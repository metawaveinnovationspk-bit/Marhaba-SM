import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { SHOP_DEPARTMENTS, VERIFIED_BRANCHES } from '../data/marhabaData';
import {
  calculateShiftClosing,
  classifyExpiryStatus,
  computeDepartmentMargins,
  computeFinanceSummary,
  computePosLineTotal,
  computePosTotals,
  evaluateThreeWayMatch,
  getSellableStock,
  validateNewProductInput,
} from './calculations';
import {
  canAccessBranch,
  canAccessModule,
  evaluateApprovalAuthority,
  getPermittedModules,
  hasPermission,
  MODULE_METADATA,
  redactProductForRole,
  ROLE_DEFINITIONS,
} from './permissions';
import { createInitialErpDatabase, type ErpDatabaseState, type StaffCredentialSeed } from './seedData';
import type {
  ApprovalRequest,
  AuditLogEntry,
  ManagementModuleId,
  OnlineFulfillmentOrder,
  OnlineFulfillmentStage,
  PermissionAction,
  PosSaleLine,
  PriorityAlert,
  StaffRoleId,
  StaffUser,
} from './types';

const SESSION_COOKIE = 'marhaba_mgmt_session';
const SESSION_SECRET =
  process.env.MGMT_SESSION_SECRET || 'marhaba-mwi-demo-hmac-secret-2026-not-for-prod';

interface SessionTokenPayload {
  uid: string;
  roleId: StaffRoleId;
  branchId: string;
  iat: number;
  exp: number;
}

interface AuthedRequest extends Request {
  staffUser?: StaffUser;
}

function signSessionToken(payload: SessionTokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySessionToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionTokenPayload;
    if (!payload.uid || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

function stripCredential(u: StaffCredentialSeed): StaffUser {
  const { demoPin: _ignored, ...safe } = u;
  return safe;
}

export function createApiApp(initialDb?: ErpDatabaseState) {
  let db: ErpDatabaseState = initialDb || createInitialErpDatabase();
  const processedOrderKeys = new Set<string>();
  let totalRefundDeductions = 0;

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const addAudit = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    db.auditLogs.unshift({
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
    });
    if (db.auditLogs.length > 400) {
      db.auditLogs = db.auditLogs.slice(0, 400);
    }
  };

  const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const cookies = parseCookies(req.headers.cookie);
    return cookies[SESSION_COOKIE] || null;
  };

  const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        error: 'Management authentication required. Customer accounts cannot access management routes.',
      });
      return;
    }
    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Management session expired or invalid. Please sign in again.' });
      return;
    }
    const found = db.staffUsers.find((u) => u.id === payload.uid);
    if (!found || !found.active) {
      res.status(401).json({ error: 'Staff account is inactive or disabled.' });
      return;
    }
    req.staffUser = stripCredential(found);
    next();
  };

  const checkPermOrDeny = (
    req: AuthedRequest,
    res: Response,
    moduleId: ManagementModuleId,
    action: PermissionAction,
    branchId?: string
  ): StaffUser | null => {
    const user = req.staffUser;
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return null;
    }
    const role = ROLE_DEFINITIONS[user.roleId];
    if (!role) {
      res.status(403).json({ error: 'Unrecognized staff role.' });
      return null;
    }
    if (role.isReadOnlyAudit && action !== 'view' && action !== 'export' && action !== 'verify') {
      addAudit({
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: role.label,
        branchId: branchId || user.branchId,
        module: moduleId,
        action: `${moduleId.toUpperCase()}_${action.toUpperCase()}`,
        target: req.originalUrl,
        outcome: 'Denied',
        detail: `Read-only audit role "${role.label}" blocked from write mutation.`,
      });
      res.status(403).json({
        error: `Read-only audit control: "${role.label}" cannot modify transactions or stock.`,
      });
      return null;
    }
    if (!hasPermission(user.roleId, moduleId, action)) {
      addAudit({
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: role.label,
        branchId: branchId || user.branchId,
        module: moduleId,
        action: `${moduleId.toUpperCase()}_${action.toUpperCase()}`,
        target: req.originalUrl,
        outcome: 'Denied',
        detail: `Role "${role.label}" lacks "${action}" permission on ${moduleId}.`,
      });
      res.status(403).json({
        error: `Access denied: Role "${role.label}" does not have "${action}" permission in ${moduleId}.`,
      });
      return null;
    }
    if (branchId && !canAccessBranch(user, branchId)) {
      addAudit({
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: role.label,
        branchId,
        module: moduleId,
        action: `${moduleId.toUpperCase()}_BRANCH_SCOPE`,
        target: branchId,
        outcome: 'Denied',
        detail: `User scoped to "${user.branchId}" attempted action in "${branchId}".`,
      });
      res.status(403).json({
        error: `Branch access denied: your role is restricted to ${user.branchId}.`,
      });
      return null;
    }
    return user;
  };

  // ==================== PUBLIC STOREFRONT SYNC ENDPOINTS ====================
  app.get('/api/public/catalog', (_req, res) => {
    const publicCatalog = db.products
      .filter((p) => p.status === 'Active')
      .map((p) => {
        const branchStock = db.stock
          .filter((s) => s.productId === p.id)
          .map((s) => ({
            branchId: s.branchId,
            sellable: getSellableStock(s),
          }));
        return {
          id: p.id,
          sku: p.sku,
          barcode: p.barcode,
          name: p.name,
          sellingPrice: p.sellingPrice,
          originalPrice: p.originalPrice,
          branchStock,
        };
      });

    res.json({
      products: publicCatalog,
      promotions: db.promotions.filter((pr) => pr.status === 'Active'),
    });
  });

  app.post('/api/public/orders', (req, res) => {
    const body = req.body as {
      idempotencyKey?: string;
      orderNumber?: string;
      branchId?: string;
      customerName?: string;
      customerPhone?: string;
      fulfillmentMethod?: 'delivery' | 'pickup';
      addressSummary?: string;
      paymentMethod?: 'cod' | 'card-counter';
      items?: { productId: string; quantity: number; unitPrice?: number; name?: string }[];
    };

    const idempKey = body.idempotencyKey || body.orderNumber;
    if (idempKey && processedOrderKeys.has(idempKey)) {
      const existing = db.onlineOrders.find((o) => o.orderNumber === body.orderNumber);
      if (existing) {
        res.json({ order: existing, deduplicated: true });
        return;
      }
    }

    const branchId = VERIFIED_BRANCHES.some((b) => b.id === body.branchId)
      ? body.branchId!
      : 'hyderabad';
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0 || !body.customerName?.trim() || !body.customerPhone?.trim()) {
      res.status(400).json({ error: 'Customer name, phone, and at least one item are required.' });
      return;
    }

    const lines: OnlineFulfillmentOrder['items'] = [];
    let totalAmount = 0;

    for (const reqItem of rawItems) {
      const prod = db.products.find((p) => p.id === reqItem.productId);
      const qty = Math.max(1, Math.floor(Number(reqItem.quantity) || 1));
      const stockRec = db.stock.find((s) => s.productId === reqItem.productId && s.branchId === branchId);
      const unitPrice = prod ? prod.sellingPrice : Number(reqItem.unitPrice || 0);
      totalAmount += unitPrice * qty;

      if (stockRec && getSellableStock(stockRec) >= qty) {
        stockRec.reserved += qty;
        db.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          productId: reqItem.productId,
          branchId,
          type: 'ONLINE_RESERVE',
          quantityDelta: -qty,
          sourceLocation: stockRec.locationCode,
          destinationLocation: 'Online Order Hold',
          referenceId: body.orderNumber || 'WEB-ORDER',
          actorName: 'Storefront Order Intake',
          reason: 'Auto-reserved sellable inventory for website order',
        });
      }

      lines.push({
        productId: reqItem.productId,
        sku: prod?.sku || 'MRH-WEB',
        name: prod?.name || reqItem.name || 'Supermarket Item',
        unitLabel: prod?.unitLabel || 'Unit',
        quantity: qty,
        unitPrice,
        locationCode: stockRec?.locationCode || 'FLOOR',
        pickedQty: 0,
        flaggedMissing: false,
      });
    }

    const orderNumber = body.orderNumber || `MRH-WEB-${Math.floor(90500 + Math.random() * 9000)}`;
    const newOrder: OnlineFulfillmentOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      branchId,
      customerName: body.customerName.trim(),
      customerPhone: body.customerPhone.trim(),
      fulfillmentMethod: body.fulfillmentMethod === 'pickup' ? 'pickup' : 'delivery',
      addressSummary:
        body.addressSummary?.trim() ||
        (body.fulfillmentMethod === 'pickup' ? 'Store Pickup Desk' : 'Delivery Address Provided'),
      paymentMethod: body.paymentMethod === 'card-counter' ? 'card-counter' : 'cod',
      paymentStatus: body.paymentMethod === 'card-counter' ? 'Paid' : 'Pending',
      stage: 'Confirmed',
      reservationStatus: 'Reserved',
      packingVerified: false,
      items: lines,
      totalAmount,
    };

    db.onlineOrders.unshift(newOrder);
    if (idempKey) processedOrderKeys.add(idempKey);

    const intakeSync = db.syncJobs.find((s) => s.channel === 'Online Orders Intake');
    if (intakeSync) {
      intakeSync.lastRunAt = new Date().toISOString();
      intakeSync.recordsSynced = db.onlineOrders.length;
    }

    res.status(201).json({ order: newOrder });
  });

  // ==================== MANAGEMENT AUTH ENDPOINTS ====================
  app.post('/api/mgmt/auth/login', (req, res) => {
    const { identifier, pin } = req.body as { identifier?: string; pin?: string };
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    const found = db.staffUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.employeeCode.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    if (!found || found.demoPin !== cleanPin) {
      addAudit({
        actorUserId: found?.id || 'anonymous',
        actorName: found?.fullName || cleanId || 'Unknown',
        actorRole: found ? ROLE_DEFINITIONS[found.roleId]?.label : 'Unauthenticated',
        branchId: found?.branchId || 'all',
        module: 'auth',
        action: 'MGMT_LOGIN_ATTEMPT',
        target: cleanId || 'empty',
        outcome: 'Denied',
        detail: 'Invalid staff employee code/email or demo PIN.',
      });
      res.status(401).json({ error: 'Invalid staff ID/email or PIN.' });
      return;
    }

    if (!found.active) {
      addAudit({
        actorUserId: found.id,
        actorName: found.fullName,
        actorRole: ROLE_DEFINITIONS[found.roleId]?.label || found.roleId,
        branchId: found.branchId,
        module: 'auth',
        action: 'MGMT_LOGIN_DISABLED',
        target: found.employeeCode,
        outcome: 'Denied',
        detail: 'Offboarded / disabled staff account attempted login.',
      });
      res.status(403).json({ error: 'Staff account is disabled by MIS Administrator.' });
      return;
    }

    const token = signSessionToken({
      uid: found.id,
      roleId: found.roleId,
      branchId: found.branchId,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 12,
    });

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 12,
    });

    const user = stripCredential(found);
    const role = ROLE_DEFINITIONS[user.roleId];

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: role.label,
      branchId: user.branchId,
      module: 'auth',
      action: 'MGMT_LOGIN',
      target: user.employeeCode,
      outcome: 'Success',
      detail: `Authenticated management session (${role.label}).`,
    });

    res.json({
      token,
      user,
      role,
      permittedModules: getPermittedModules(user.roleId),
    });
  });

  app.get('/api/mgmt/auth/status', (req, res) => {
    const token = extractToken(req);
    const payload = token ? verifySessionToken(token) : null;
    const found = payload ? db.staffUsers.find((u) => u.id === payload.uid && u.active) : null;
    res.json({ authenticated: Boolean(found) });
  });

  app.get('/api/mgmt/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const user = req.staffUser!;
    res.json({
      user,
      role: ROLE_DEFINITIONS[user.roleId],
      permittedModules: getPermittedModules(user.roleId),
    });
  });

  app.post('/api/mgmt/auth/logout', (req: AuthedRequest, res) => {
    const token = extractToken(req);
    const payload = token ? verifySessionToken(token) : null;
    if (payload) {
      const found = db.staffUsers.find((u) => u.id === payload.uid);
      if (found) {
        addAudit({
          actorUserId: found.id,
          actorName: found.fullName,
          actorRole: ROLE_DEFINITIONS[found.roleId]?.label || found.roleId,
          branchId: found.branchId,
          module: 'auth',
          action: 'MGMT_LOGOUT',
          target: found.employeeCode,
          outcome: 'Success',
          detail: 'Signed out of management session.',
        });
      }
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  // ==================== ROLE-SCOPED BOOTSTRAP ====================
  app.get('/api/mgmt/bootstrap', requireAuth, (req: AuthedRequest, res) => {
    const user = req.staffUser!;
    const role = ROLE_DEFINITIONS[user.roleId];
    const requestedBranch = typeof req.query.branchId === 'string' ? req.query.branchId : 'all';

    const activeBranchScope =
      role.branchRestricted || user.branchId !== 'all'
        ? user.branchId
        : requestedBranch === 'all' || VERIFIED_BRANCHES.some((b) => b.id === requestedBranch)
        ? requestedBranch
        : 'all';

    const inScope = (bId: string) => activeBranchScope === 'all' || bId === activeBranchScope;

    const permittedProducts = db.products.map((p) => redactProductForRole(p, user.roleId));
    const stockInScope = db.stock.filter((s) => inScope(s.branchId));

    const canPos = canAccessModule(user.roleId, 'pos');
    const canInventory = canAccessModule(user.roleId, 'inventory');
    const canPurchasing = canAccessModule(user.roleId, 'purchasing');
    const canOrders = canAccessModule(user.roleId, 'orders');
    const canOffers = canAccessModule(user.roleId, 'offers');
    const canFinance = canAccessModule(user.roleId, 'finance');
    const canStaff = canAccessModule(user.roleId, 'staff');
    const canBranches = canAccessModule(user.roleId, 'branches');
    const canCustomers = canAccessModule(user.roleId, 'customers');
    const canSettings = canAccessModule(user.roleId, 'settings');
    const canReports = canAccessModule(user.roleId, 'reports');

    const shiftsInScope =
      canPos || canFinance || canReports || user.roleId === 'ceo'
        ? db.shifts.filter((s) => inScope(s.branchId))
        : [];
    const salesInScope =
      canPos || canFinance || canReports || user.roleId === 'ceo'
        ? db.posSales.filter((s) => inScope(s.branchId))
        : [];
    const onlineOrdersInScope =
      canOrders || canCustomers || canReports || user.roleId === 'ceo' || user.roleId === 'branch_manager'
        ? db.onlineOrders.filter((o) => inScope(o.branchId))
        : [];

    const alerts: PriorityAlert[] = [];
    const refDate = '2026-11-16';

    if (canInventory || user.roleId === 'department_supervisor' || user.roleId === 'ceo' || user.roleId === 'branch_manager') {
      for (const s of stockInScope) {
        const prod = db.products.find((p) => p.id === s.productId);
        if (!prod) continue;
        const sellable = getSellableStock(s);
        if (sellable <= prod.reorderPoint && s.onHand > 0) {
          alerts.push({
            id: `al-low-${s.branchId}-${s.productId}`,
            priority: 'medium',
            module: 'inventory',
            title: `Low stock: ${prod.name}`,
            detail: `${sellable} sellable units (reorder at ${prod.reorderPoint}) · ${s.locationCode}`,
            branchId: s.branchId,
          });
        }
        const expStatus = classifyExpiryStatus(s.expiryDate, refDate);
        if (expStatus === 'Expired' || expStatus === 'Near Expiry (<= 30d)') {
          alerts.push({
            id: `al-exp-${s.branchId}-${s.productId}`,
            priority: 'high',
            module: 'inventory',
            title: `${expStatus}: ${prod.name}`,
            detail: `Batch ${s.batchNumber} expires ${s.expiryDate} · Qty ${s.onHand}`,
            branchId: s.branchId,
          });
        }
      }
      for (const tr of db.stockTransfers.filter((t) => t.status === 'In Transit' && (inScope(t.toBranchId) || inScope(t.fromBranchId)))) {
        alerts.push({
          id: `al-trf-${tr.id}`,
          priority: 'medium',
          module: 'inventory',
          title: `Transfer In Transit: ${tr.transferRef}`,
          detail: `${tr.dispatchedQty} × ${tr.productName} (${tr.fromBranchId} -> ${tr.toBranchId}) awaiting receipt`,
          branchId: tr.toBranchId,
        });
      }
    }

    if (canFinance || user.roleId === 'pos_supervisor' || user.roleId === 'ceo') {
      for (const sh of db.shifts.filter((x) => inScope(x.branchId) && x.status === 'Pending Reconciliation')) {
        alerts.push({
          id: `al-var-${sh.id}`,
          priority: 'high',
          module: 'finance',
          title: `Shift Cash Variance (${sh.shiftNumber})`,
          detail: `Variance PKR ${sh.variance?.toLocaleString()} awaiting Accounts verification`,
          branchId: sh.branchId,
        });
      }
      for (const inv of db.supplierInvoices.filter(
        (x) => inScope(x.branchId) && x.threeWayMatchStatus === 'Amount Variance'
      )) {
        alerts.push({
          id: `al-inv-${inv.id}`,
          priority: 'high',
          module: 'purchasing',
          title: `3-Way Match Variance: ${inv.invoiceNumber}`,
          detail: `Billed PKR ${inv.billedAmount.toLocaleString()} vs GRN PKR ${inv.grnAcceptedAmount.toLocaleString()}`,
          branchId: inv.branchId,
        });
      }
    }

    if (canBranches) {
      for (const mnt of db.maintenanceTickets.filter((t) => inScope(t.branchId) && t.status !== 'Verified Resolved')) {
        alerts.push({
          id: `al-mnt-${mnt.id}`,
          priority: mnt.priority === 'Urgent' ? 'high' : 'medium',
          module: 'branches',
          title: `Equipment Issue: ${mnt.equipment}`,
          detail: `${mnt.issue} (${mnt.status})`,
          branchId: mnt.branchId,
        });
      }
    }

    if (canOrders || user.roleId === 'branch_manager') {
      const openWebOrders = db.onlineOrders.filter(
        (o) => inScope(o.branchId) && !['Completed', 'Cancelled'].includes(o.stage)
      );
      if (openWebOrders.length > 0) {
        alerts.push({
          id: `al-orders-open`,
          priority: 'medium',
          module: 'orders',
          title: `${openWebOrders.length} active online order(s)`,
          detail: 'Requires picking, packing verification, or counter release.',
          branchId: activeBranchScope,
        });
      }
    }

    const approvalsVisible = canSettings || canPurchasing || canFinance || canInventory || canOffers || canPos || user.roleId === 'ceo' || user.roleId === 'owner_partner'
      ? db.approvals
          .filter((a) => inScope(a.branchId))
          .map((a) => ({
            ...a,
            authority: evaluateApprovalAuthority(user, a),
          }))
      : [];

    const canManageStaffRoster =
      hasPermission(user.roleId, 'staff', 'approve') || hasPermission(user.roleId, 'staff', 'verify');

    const onlineOrdersRevenue = db.onlineOrders
      .filter((o) => inScope(o.branchId) && o.stage !== 'Cancelled' && o.paymentStatus !== 'Refunded')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const financeSummary =
      canFinance || canReports || user.roleId === 'ceo' || user.roleId === 'owner_partner' || user.roleId === 'branch_manager'
        ? computeFinanceSummary({
            sales: db.posSales,
            onlineOrdersRevenue,
            refundDeductions: totalRefundDeductions,
            products: db.products,
            stock: db.stock,
            expenses: db.expenses,
            invoices: db.supplierInvoices,
            branchId: activeBranchScope,
          })
        : null;

    // Executive intelligence helpers (only attached when cost/margin authorized)
    const soldProductIds = new Set<string>();
    for (const sale of db.posSales.filter((s) => inScope(s.branchId) && s.status !== 'Returned')) {
      for (const l of sale.items) soldProductIds.add(l.productId);
    }
    for (const ord of db.onlineOrders.filter((o) => inScope(o.branchId) && o.stage !== 'Cancelled')) {
      for (const l of ord.items) soldProductIds.add(l.productId);
    }

    const slowMovingSkus = role.canViewCostAndMargin
      ? db.products
          .filter((p) => !soldProductIds.has(p.id))
          .slice(0, 12)
          .map((p) => {
            const qty = stockInScope
              .filter((st) => st.productId === p.id)
              .reduce((sum, st) => sum + st.onHand, 0);
            return {
              productId: p.id,
              sku: p.sku,
              name: p.name,
              departmentName: p.departmentName,
              stockUnits: qty,
              stockCostValue: qty * p.purchaseCost,
            };
          })
      : [];

    const departmentMargins = role.canViewCostAndMargin
      ? computeDepartmentMargins(db.products, db.posSales, activeBranchScope)
      : [];

    res.json({
      user,
      role,
      permittedModules: getPermittedModules(user.roleId),
      moduleMetadata: MODULE_METADATA,
      branches: VERIFIED_BRANCHES,
      departments: SHOP_DEPARTMENTS.map((d) => ({ id: d.id, name: d.name })),
      activeBranchScope,
      products: permittedProducts,
      stock: stockInScope,
      stockMovements:
        canInventory || canOrders || canPos
          ? db.stockMovements.filter((m) => inScope(m.branchId)).slice(0, 80)
          : [],
      stockTransfers:
        canInventory || canBranches || user.roleId === 'ceo'
          ? db.stockTransfers.filter((t) => inScope(t.fromBranchId) || inScope(t.toBranchId))
          : [],
      cycleCounts:
        canInventory || user.roleId === 'ceo'
          ? db.cycleCounts.filter((c) => inScope(c.branchId))
          : [],
      suppliers: canPurchasing || canFinance || canInventory || canSettings ? db.suppliers : [],
      requisitions: canPurchasing || canInventory ? db.requisitions.filter((r) => inScope(r.branchId)) : [],
      purchaseOrders:
        canPurchasing || canFinance || canInventory ? db.purchaseOrders.filter((p) => inScope(p.branchId)) : [],
      goodsReceipts:
        canPurchasing || canInventory || canFinance ? db.goodsReceipts.filter((g) => inScope(g.branchId)) : [],
      supplierInvoices:
        canFinance || canPurchasing || user.roleId === 'ceo' || user.roleId === 'owner_partner'
          ? db.supplierInvoices.filter((i) => inScope(i.branchId))
          : [],
      bankSettlements:
        canFinance || user.roleId === 'ceo' || user.roleId === 'owner_partner'
          ? db.bankSettlements.filter((b) => inScope(b.branchId))
          : [],
      shifts: shiftsInScope,
      posSales: salesInScope,
      onlineOrders: onlineOrdersInScope,
      promotions:
        canOffers || canPos || user.roleId === 'ceo' || user.roleId === 'branch_manager' ? db.promotions : [],
      expenses:
        canFinance || user.roleId === 'branch_manager' || user.roleId === 'ceo'
          ? db.expenses.filter((e) => inScope(e.branchId))
          : [],
      customerCases:
        canCustomers || canOrders || user.roleId === 'branch_manager' || user.roleId === 'ceo'
          ? db.customerCases.filter((c) => inScope(c.branchId))
          : [],
      approvals: approvalsVisible,
      checklists: canBranches || user.roleId === 'ceo' ? db.checklists.filter((c) => inScope(c.branchId)) : [],
      maintenanceTickets:
        canBranches || user.roleId === 'ceo' || user.roleId === 'director_admin'
          ? db.maintenanceTickets.filter((m) => inScope(m.branchId))
          : [],
      attendance: canStaff
        ? canManageStaffRoster
          ? db.attendance.filter((a) => inScope(a.branchId))
          : db.attendance.filter((a) => a.userId === user.id)
        : [],
      leaveRequests: canStaff
        ? canManageStaffRoster
          ? db.leaveRequests.filter((l) => inScope(l.branchId))
          : db.leaveRequests.filter((l) => l.userId === user.id)
        : [],
      auditLogs:
        canSettings || user.roleId === 'ceo' || user.roleId === 'director_accounts' || user.roleId === 'internal_auditor'
          ? db.auditLogs.slice(0, 120)
          : [],
      syncJobs: canSettings || canProductsOnly(user.roleId) ? db.syncJobs : [],
      staffUsers: canSettings || canStaff ? db.staffUsers.map(stripCredential) : [],
      roleDefinitions: canSettings ? ROLE_DEFINITIONS : undefined,
      financeSummary,
      departmentMargins,
      slowMovingSkus,
      priorityAlerts: alerts.slice(0, 15),
    });
  });

  function canProductsOnly(roleId: StaffRoleId) {
    return roleId === 'product_data_operator' || roleId === 'director_mis' || roleId === 'ceo';
  }

  // ==================== POS ENDPOINTS ====================
  app.post('/api/mgmt/pos/shifts/open', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body as { branchId?: string; registerId?: string; openingFloat?: number };
    const branchId = body.branchId || req.staffUser!.branchId;
    const targetBranch = branchId === 'all' ? 'hyderabad' : branchId;
    const user = checkPermOrDeny(req, res, 'pos', 'create', targetBranch);
    if (!user) return;

    const existingOpen = db.shifts.find(
      (s) => s.cashierUserId === user.id && s.branchId === targetBranch && s.status === 'Open'
    );
    if (existingOpen) {
      res.status(400).json({ error: `You already have an open shift (${existingOpen.shiftNumber}).` });
      return;
    }

    const openingFloat = Math.max(0, Math.round(Number(body.openingFloat ?? 15000)));
    const newShift = {
      id: `shf-${Date.now()}`,
      shiftNumber: `SHF-${targetBranch.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      registerId: body.registerId || `REG-${targetBranch.slice(0, 3).toUpperCase()}-02`,
      branchId: targetBranch,
      cashierUserId: user.id,
      cashierName: user.fullName,
      openedAt: new Date().toISOString(),
      openingFloat,
      cashSalesTotal: 0,
      cardSalesTotal: 0,
      refundsTotal: 0,
      expectedCash: openingFloat,
      status: 'Open' as const,
    };

    db.shifts.unshift(newShift);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: targetBranch,
      module: 'pos',
      action: 'OPEN_SHIFT',
      target: newShift.shiftNumber,
      outcome: 'Success',
      detail: `Opened register ${newShift.registerId} with float PKR ${openingFloat.toLocaleString()}.`,
    });
    res.status(201).json({ shift: newShift });
  });

  app.post('/api/mgmt/pos/shifts/:id/close', requireAuth, (req: AuthedRequest, res) => {
    const shift = db.shifts.find((s) => s.id === req.params.id);
    if (!shift) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'pos', 'submit', shift.branchId);
    if (!user) return;
    if (shift.status !== 'Open') {
      res.status(400).json({ error: 'Only open shifts can be closed.' });
      return;
    }
    const declaredCash = Math.max(0, Math.round(Number(req.body?.declaredCash ?? 0)));
    const closing = calculateShiftClosing(shift, declaredCash);
    shift.closedAt = new Date().toISOString();
    shift.expectedCash = closing.expectedCash;
    shift.declaredCash = declaredCash;
    shift.variance = closing.variance;
    shift.status = closing.variance === 0 ? 'Closed' : 'Pending Reconciliation';

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: shift.branchId,
      module: 'pos',
      action: 'CLOSE_SHIFT',
      target: shift.shiftNumber,
      outcome: 'Success',
      detail: `Declared PKR ${declaredCash.toLocaleString()} vs Expected PKR ${closing.expectedCash.toLocaleString()} (Variance: PKR ${closing.variance}).`,
    });

    res.json({ shift, closing });
  });

  app.post('/api/mgmt/pos/sales', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body as {
      shiftId?: string;
      branchId?: string;
      items?: { productId: string; quantity: number; discountPercent?: number }[];
      paymentMethod?: 'Cash' | 'Card' | 'Split';
      cashReceived?: number;
      cardAmount?: number;
      cardTerminalFailed?: boolean;
      supervisorOverrideId?: string;
    };

    const branchId = body.branchId || (req.staffUser!.branchId === 'all' ? 'hyderabad' : req.staffUser!.branchId);
    const user = checkPermOrDeny(req, res, 'pos', 'create', branchId);
    if (!user) return;

    if (body.cardTerminalFailed) {
      res.status(402).json({
        error: 'Card terminal declined / timed out (Simulated). Retry card swipe or collect Cash / Split tender.',
        paymentFailure: true,
      });
      return;
    }

    const shift = db.shifts.find((s) => s.id === body.shiftId && s.branchId === branchId && s.status === 'Open');
    if (!shift) {
      res.status(400).json({ error: 'An open register shift in this branch is required before billing.' });
      return;
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Scan or add at least one product before completing checkout.' });
      return;
    }

    const role = ROLE_DEFINITIONS[user.roleId];
    const saleLines: PosSaleLine[] = [];

    // Check if there is an approved supervisor override passed in
    const approvedOverride = body.supervisorOverrideId
      ? db.approvals.find(
          (a) =>
            a.id === body.supervisorOverrideId &&
            a.type === 'POS_DISCOUNT_OVERRIDE' &&
            a.status === 'Approved' &&
            a.branchId === branchId
        )
      : undefined;

    for (const item of rawItems) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (!prod) {
        res.status(400).json({ error: `Product ${item.productId} not found in master catalogue.` });
        return;
      }
      const qty = Math.max(1, Math.floor(Number(item.quantity || 1)));
      const disc = Math.min(100, Math.max(0, Number(item.discountPercent || 0)));

      if (disc > role.maxPosDiscountPercent && !approvedOverride) {
        addAudit({
          actorUserId: user.id,
          actorName: user.fullName,
          actorRole: role.label,
          branchId,
          module: 'pos',
          action: 'POS_DISCOUNT_LIMIT_EXCEEDED',
          target: prod.sku,
          outcome: 'Denied',
          detail: `Attempted ${disc}% discount exceeding role limit (${role.maxPosDiscountPercent}%).`,
        });
        res.status(403).json({
          error: `Discount ${disc}% exceeds your role cap (${role.maxPosDiscountPercent}%). Request a POS Supervisor override.`,
          discountLimitExceeded: true,
          maxAllowedPercent: role.maxPosDiscountPercent,
        });
        return;
      }

      const stockRec = db.stock.find((s) => s.productId === prod.id && s.branchId === branchId);
      if (!stockRec || getSellableStock(stockRec) < qty) {
        res.status(400).json({
          error: `Insufficient sellable stock for ${prod.name} at ${branchId} (Sellable: ${stockRec ? getSellableStock(stockRec) : 0}).`,
        });
        return;
      }

      const expStatus = classifyExpiryStatus(stockRec.expiryDate, '2026-11-16');
      if (expStatus === 'Expired') {
        res.status(400).json({
          error: `Blocked: Batch ${stockRec.batchNumber} of ${prod.name} is EXPIRED (${stockRec.expiryDate}) and cannot be sold.`,
        });
        return;
      }

      saleLines.push({
        productId: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        unitLabel: prod.unitLabel,
        quantity: qty,
        unitPrice: prod.sellingPrice,
        discountPercent: disc,
        lineTotal: computePosLineTotal(prod.sellingPrice, qty, disc),
      });
    }

    const totals = computePosTotals(saleLines);
    const paymentMethod = body.paymentMethod || 'Cash';
    let cashReceived = 0;
    let cardAmount = 0;
    let changeDue = 0;

    if (paymentMethod === 'Cash') {
      cashReceived = Math.round(Number(body.cashReceived || 0));
      if (cashReceived < totals.grandTotal) {
        res.status(400).json({ error: 'Cash tendered is less than the grand total.' });
        return;
      }
      changeDue = cashReceived - totals.grandTotal;
    } else if (paymentMethod === 'Card') {
      cardAmount = totals.grandTotal;
    } else {
      cardAmount = Math.max(0, Math.round(Number(body.cardAmount || 0)));
      cashReceived = Math.max(0, Math.round(Number(body.cashReceived || 0)));
      if (cardAmount + cashReceived < totals.grandTotal) {
        res.status(400).json({ error: 'Combined cash + card tender is less than grand total.' });
        return;
      }
      changeDue = cashReceived + cardAmount - totals.grandTotal;
    }

    const receiptNumber = `RCP-${branchId.slice(0, 3).toUpperCase()}-${1004 + db.posSales.length}`;

    for (const line of saleLines) {
      const stockRec = db.stock.find((s) => s.productId === line.productId && s.branchId === branchId)!;
      stockRec.onHand -= line.quantity;
      if (stockRec.floorQty >= line.quantity) {
        stockRec.floorQty -= line.quantity;
      } else {
        const remainder = line.quantity - stockRec.floorQty;
        stockRec.floorQty = 0;
        stockRec.warehouseQty = Math.max(0, stockRec.warehouseQty - remainder);
      }
      db.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        productId: line.productId,
        branchId,
        type: 'POS_SALE',
        quantityDelta: -line.quantity,
        sourceLocation: `${stockRec.locationCode} (Sales Floor)`,
        destinationLocation: 'Customer Checkout',
        referenceId: receiptNumber,
        actorName: user.fullName,
        reason: `POS counter sale (${paymentMethod})`,
      });
    }

    const netCashToDrawer =
      paymentMethod === 'Cash'
        ? totals.grandTotal
        : paymentMethod === 'Split'
        ? Math.max(0, totals.grandTotal - cardAmount)
        : 0;

    shift.cashSalesTotal += netCashToDrawer;
    shift.cardSalesTotal += cardAmount;
    shift.expectedCash = shift.openingFloat + shift.cashSalesTotal - shift.refundsTotal;

    const sale = {
      id: `sale-${Date.now()}`,
      receiptNumber,
      shiftId: shift.id,
      branchId,
      cashierUserId: user.id,
      cashierName: user.fullName,
      createdAt: new Date().toISOString(),
      items: saleLines,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod,
      cashReceived,
      cardAmount,
      changeDue,
      status: 'Completed' as const,
      supervisorOverrideId: approvedOverride?.id,
    };

    db.posSales.unshift(sale);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: role.label,
      branchId,
      module: 'pos',
      action: 'COMPLETE_POS_SALE',
      target: receiptNumber,
      outcome: 'Success',
      detail: `Completed POS sale PKR ${totals.grandTotal.toLocaleString()} via ${paymentMethod}.`,
    });

    res.status(201).json({ sale, shift });
  });

  app.post('/api/mgmt/pos/discount-override-request', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body as {
      branchId?: string;
      sku?: string;
      requestedDiscountPercent?: number;
      reason?: string;
      amountPkr?: number;
    };
    const branchId = body.branchId || (req.staffUser!.branchId === 'all' ? 'hyderabad' : req.staffUser!.branchId);
    const user = checkPermOrDeny(req, res, 'pos', 'create', branchId);
    if (!user) return;

    const approval: ApprovalRequest = {
      id: `apr-disc-${Date.now()}`,
      type: 'POS_DISCOUNT_OVERRIDE',
      title: `POS Discount Override (${body.requestedDiscountPercent}% on ${body.sku || 'Basket'})`,
      branchId,
      requestedByUserId: user.id,
      requestedByName: user.fullName,
      requestedAt: new Date().toISOString(),
      amountPkr: Math.max(0, Math.round(Number(body.amountPkr || 0))),
      previousValue: `Role Cap ${ROLE_DEFINITIONS[user.roleId].maxPosDiscountPercent}%`,
      proposedValue: `${body.requestedDiscountPercent}%`,
      justification: body.reason?.trim() || 'Cashier requested supervisor discount override.',
      status: 'Pending',
    };
    db.approvals.unshift(approval);
    res.status(201).json({ approval });
  });

  app.delete('/api/mgmt/pos/sales/:id', requireAuth, (req: AuthedRequest, res) => {
    const user = req.staffUser!;
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: user.branchId,
      module: 'pos',
      action: 'DELETE_POS_SALE',
      target: req.params.id,
      outcome: 'Denied',
      detail: 'Blocked deletion of finalized POS transaction to preserve financial ledger integrity.',
    });
    res.status(403).json({
      error: 'POS financial records are immutable and cannot be deleted. Process a formal Return instead.',
    });
  });

  app.post('/api/mgmt/pos/returns', requireAuth, (req: AuthedRequest, res) => {
    const { receiptNumber, reason, disposition } = req.body as {
      receiptNumber?: string;
      reason?: string;
      disposition?: 'Restock Sellable' | 'Damaged Quarantine';
    };
    const sale = db.posSales.find((s) => s.receiptNumber === receiptNumber);
    if (!sale) {
      res.status(404).json({ error: 'Receipt number not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'pos', 'verify', sale.branchId);
    if (!user) return;
    if (sale.status === 'Returned') {
      res.status(400).json({ error: 'Receipt already returned.' });
      return;
    }

    const disp = disposition === 'Damaged Quarantine' ? 'Damaged Quarantine' : 'Restock Sellable';
    sale.status = 'Returned';
    for (const line of sale.items) {
      const stockRec = db.stock.find((s) => s.productId === line.productId && s.branchId === sale.branchId);
      if (stockRec) {
        if (disp === 'Restock Sellable') {
          stockRec.onHand += line.quantity;
          stockRec.floorQty += line.quantity;
        } else {
          stockRec.damaged += line.quantity;
        }
      }
      db.stockMovements.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        productId: line.productId,
        branchId: sale.branchId,
        type: 'RETURN',
        quantityDelta: disp === 'Restock Sellable' ? line.quantity : 0,
        sourceLocation: 'Customer Return Counter',
        destinationLocation: disp === 'Restock Sellable' ? 'Sales Floor' : 'Damaged Quarantine',
        referenceId: sale.receiptNumber,
        actorName: user.fullName,
        reason: `${reason?.trim() || 'POS counter return'} (${disp})`,
      });
    }

    const shift = db.shifts.find((sh) => sh.id === sale.shiftId);
    if (shift) {
      shift.refundsTotal += sale.grandTotal;
      shift.expectedCash = shift.openingFloat + shift.cashSalesTotal - shift.refundsTotal;
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: sale.branchId,
      module: 'pos',
      action: 'POS_RETURN',
      target: sale.receiptNumber,
      outcome: 'Success',
      detail: `Processed counter return PKR ${sale.grandTotal.toLocaleString()} (${disp}).`,
    });

    res.json({ sale });
  });

  // ==================== PRODUCTS & OFFERS ENDPOINTS ====================
  app.post('/api/mgmt/products', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'products', 'create');
    if (!user) return;
    const body = req.body as {
      sku: string;
      barcode: string;
      name: string;
      brand: string;
      departmentId: string;
      subcategory: string;
      supplierId: string;
      unitLabel: string;
      packConversion?: number;
      purchaseCost: number;
      sellingPrice: number;
      reorderPoint?: number;
    };

    const errors = validateNewProductInput(db.products, {
      sku: body.sku || '',
      barcode: body.barcode || '',
      name: body.name || '',
      purchaseCost: Number(body.purchaseCost || 0),
      sellingPrice: Number(body.sellingPrice || 0),
    });

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: Object.values(errors)[0], fieldErrors: errors });
      return;
    }

    const dept = SHOP_DEPARTMENTS.find((d) => d.id === body.departmentId) || SHOP_DEPARTMENTS[0];
    const newProd = {
      id: `prod-${Date.now()}`,
      sku: body.sku.trim().toUpperCase(),
      barcode: body.barcode.trim(),
      name: body.name.trim(),
      brand: body.brand?.trim() || 'Marhaba Selection',
      departmentId: dept.id,
      departmentName: dept.name,
      subcategory: body.subcategory?.trim() || dept.subcategories[0] || 'General',
      supplierId: body.supplierId || db.suppliers[0].id,
      unitLabel: body.unitLabel?.trim() || '1 Unit',
      packConversion: Math.max(1, Number(body.packConversion || 1)),
      purchaseCost: Math.round(Number(body.purchaseCost)),
      sellingPrice: Math.round(Number(body.sellingPrice)),
      taxClass: 'Standard GST (Demo Configurable)' as const,
      status: 'Active' as const,
      reorderPoint: Math.max(1, Number(body.reorderPoint || 12)),
      dataTier: 'demonstration' as const,
    };

    db.products.unshift(newProd);
    for (const branch of VERIFIED_BRANCHES) {
      db.stock.push({
        productId: newProd.id,
        branchId: branch.id,
        locationCode: `${branch.id.slice(0, 3).toUpperCase()}-NEW`,
        zone: 'Sales Floor',
        onHand: 15,
        floorQty: 8,
        warehouseQty: 7,
        reserved: 0,
        damaged: 0,
        inTransit: 0,
        batchNumber: `B-NEW-${Date.now().toString().slice(-3)}`,
        expiryDate: '',
      });
    }

    const catSync = db.syncJobs.find((s) => s.channel === 'Website Catalogue Sync');
    if (catSync) {
      catSync.lastRunAt = new Date().toISOString();
      catSync.recordsSynced = db.products.length;
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: user.branchId,
      module: 'products',
      action: 'CREATE_PRODUCT',
      target: newProd.sku,
      outcome: 'Success',
      detail: `Created SKU ${newProd.sku} (${newProd.name}) at PKR ${newProd.sellingPrice}.`,
    });

    res.status(201).json({ product: redactProductForRole(newProd, user.roleId) });
  });

  app.patch('/api/mgmt/products/:id', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'products', 'edit');
    if (!user) return;
    const prod = db.products.find((p) => p.id === req.params.id);
    if (!prod) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const body = req.body as Partial<typeof prod>;
    const errors = validateNewProductInput(
      db.products,
      {
        sku: body.sku ?? prod.sku,
        barcode: body.barcode ?? prod.barcode,
        name: body.name ?? prod.name,
        sellingPrice: Number(body.sellingPrice ?? prod.sellingPrice),
        purchaseCost: Number(body.purchaseCost ?? prod.purchaseCost),
      },
      prod.id
    );
    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: Object.values(errors)[0], fieldErrors: errors });
      return;
    }

    if (body.name) prod.name = body.name.trim();
    if (body.sku) prod.sku = body.sku.trim().toUpperCase();
    if (body.barcode) prod.barcode = body.barcode.trim();
    if (body.reorderPoint !== undefined) prod.reorderPoint = Math.max(1, Number(body.reorderPoint));
    if (body.sellingPrice !== undefined && hasPermission(user.roleId, 'offers', 'approve')) {
      prod.sellingPrice = Math.round(Number(body.sellingPrice));
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: user.branchId,
      module: 'products',
      action: 'UPDATE_PRODUCT',
      target: prod.sku,
      outcome: 'Success',
      detail: `Updated catalogue details for ${prod.name}.`,
    });

    res.json({ product: redactProductForRole(prod, user.roleId) });
  });

  app.post('/api/mgmt/offers/promotions', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'offers', 'submit');
    if (!user) return;
    const body = req.body as {
      title: string;
      discountPercent: number;
      departmentId: string;
      branchScope: string;
      startDate: string;
      endDate: string;
    };
    if (!body.title?.trim() || Number(body.discountPercent) <= 0 || Number(body.discountPercent) > 60) {
      res.status(400).json({ error: 'Provide a campaign title and discount between 1% and 60%.' });
      return;
    }
    const autoApprove = hasPermission(user.roleId, 'offers', 'approve');
    const promo = {
      id: `promo-${Date.now()}`,
      title: body.title.trim(),
      discountPercent: Math.round(Number(body.discountPercent)),
      departmentId: body.departmentId || 'grocery-pantry',
      branchScope: body.branchScope || 'all',
      startDate: body.startDate || '2026-11-17',
      endDate: body.endDate || '2026-11-30',
      status: autoApprove ? ('Active' as const) : ('Pending Approval' as const),
      createdByName: user.fullName,
    };
    db.promotions.unshift(promo);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: promo.branchScope,
      module: 'offers',
      action: 'CREATE_PROMOTION',
      target: promo.title,
      outcome: 'Success',
      detail: `Created ${promo.discountPercent}% offer (${promo.status}).`,
    });
    res.status(201).json({ promotion: promo });
  });

  app.post('/api/mgmt/offers/price-requests', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'offers', 'submit');
    if (!user) return;
    const { productId, proposedPrice, justification } = req.body as {
      productId: string;
      proposedPrice: number;
      justification: string;
    };
    const prod = db.products.find((p) => p.id === productId);
    if (!prod || !Number.isFinite(Number(proposedPrice)) || Number(proposedPrice) <= 0) {
      res.status(400).json({ error: 'Valid product and proposed selling price required.' });
      return;
    }

    const approval: ApprovalRequest = {
      id: `apr-price-${Date.now()}`,
      type: 'PRICE_CHANGE',
      title: `Price Change: ${prod.name}`,
      branchId: user.branchId === 'all' ? 'hyderabad' : user.branchId,
      requestedByUserId: user.id,
      requestedByName: user.fullName,
      requestedAt: new Date().toISOString(),
      amountPkr: Math.round(Number(proposedPrice)),
      previousValue: `PKR ${prod.sellingPrice.toLocaleString()}`,
      proposedValue: `PKR ${Math.round(Number(proposedPrice)).toLocaleString()}`,
      justification: justification?.trim() || 'Retail shelf price adjustment request.',
      referenceId: prod.id,
      status: 'Pending',
    };
    db.approvals.unshift(approval);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: approval.branchId,
      module: 'offers',
      action: 'SUBMIT_PRICE_REQUEST',
      target: prod.sku,
      outcome: 'Success',
      detail: `Requested price ${approval.previousValue} -> ${approval.proposedValue}.`,
    });
    res.status(201).json({ approval });
  });

  // ==================== INVENTORY ENDPOINTS ====================
  app.post('/api/mgmt/inventory/putaway', requireAuth, (req: AuthedRequest, res) => {
    const { productId, branchId, quantity, locationCode } = req.body as {
      productId: string;
      branchId: string;
      quantity: number;
      locationCode?: string;
    };
    const user = checkPermOrDeny(req, res, 'inventory', 'create', branchId);
    if (!user) return;

    const stockRec = db.stock.find((s) => s.productId === productId && s.branchId === branchId);
    const prod = db.products.find((p) => p.id === productId);
    if (!stockRec || !prod) {
      res.status(404).json({ error: 'Stock record not found.' });
      return;
    }

    const qty = Math.max(1, Math.floor(Number(quantity || 0)));
    if (stockRec.warehouseQty < qty) {
      res.status(400).json({
        error: `Only ${stockRec.warehouseQty} units available in Backroom Warehouse for putaway.`,
      });
      return;
    }

    stockRec.warehouseQty -= qty;
    stockRec.floorQty += qty;
    stockRec.zone = 'Sales Floor';
    if (locationCode?.trim()) {
      stockRec.locationCode = locationCode.trim().toUpperCase();
    }

    db.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId,
      branchId,
      type: 'PUTAWAY_FLOOR',
      quantityDelta: qty,
      sourceLocation: `${branchId.slice(0, 3).toUpperCase()}-WAREHOUSE`,
      destinationLocation: `${stockRec.locationCode} (Sales Floor)`,
      referenceId: `PUT-${Date.now().toString().slice(-4)}`,
      actorName: user.fullName,
      reason: 'Replenished sales floor shelf from backroom warehouse',
    });

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId,
      module: 'inventory',
      action: 'FLOOR_PUTAWAY',
      target: prod.sku,
      outcome: 'Success',
      detail: `Moved ${qty} units from Backroom Warehouse to ${stockRec.locationCode} (Sales Floor).`,
    });

    res.json({ stockRec });
  });

  app.post('/api/mgmt/inventory/transfers', requireAuth, (req: AuthedRequest, res) => {
    const { productId, fromBranchId, toBranchId, quantity } = req.body as {
      productId: string;
      fromBranchId: string;
      toBranchId: string;
      quantity: number;
    };
    const user = checkPermOrDeny(req, res, 'inventory', 'create', fromBranchId);
    if (!user) return;
    if (fromBranchId === toBranchId) {
      res.status(400).json({ error: 'Source and destination branches must differ.' });
      return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity || 0)));
    const source = db.stock.find((s) => s.productId === productId && s.branchId === fromBranchId);
    const dest = db.stock.find((s) => s.productId === productId && s.branchId === toBranchId);
    const prod = db.products.find((p) => p.id === productId);
    if (!source || !dest || !prod || getSellableStock(source) < qty) {
      res.status(400).json({ error: 'Insufficient sellable stock at source branch for transfer.' });
      return;
    }

    source.onHand -= qty;
    if (source.warehouseQty >= qty) {
      source.warehouseQty -= qty;
    } else {
      const rem = qty - source.warehouseQty;
      source.warehouseQty = 0;
      source.floorQty = Math.max(0, source.floorQty - rem);
    }
    dest.inTransit += qty;

    const ref = `TRF-2026-${902 + db.stockTransfers.length}`;
    const transferRecord = {
      id: `trf-${Date.now()}`,
      transferRef: ref,
      productId,
      productName: prod.name,
      fromBranchId,
      toBranchId,
      dispatchedQty: qty,
      receivedQty: 0,
      damagedInTransitQty: 0,
      status: 'In Transit' as const,
      dispatchedByName: user.fullName,
      dispatchedAt: new Date().toISOString(),
    };
    db.stockTransfers.unshift(transferRecord);

    db.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId,
      branchId: fromBranchId,
      type: 'TRANSFER_OUT',
      quantityDelta: -qty,
      sourceLocation: `${source.locationCode} (${fromBranchId})`,
      destinationLocation: `In-Transit -> ${toBranchId}`,
      referenceId: ref,
      actorName: user.fullName,
      reason: `Inter-branch transfer dispatched to ${toBranchId}`,
    });

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: fromBranchId,
      module: 'inventory',
      action: 'INITIATE_STOCK_TRANSFER',
      target: ref,
      outcome: 'Success',
      detail: `Dispatched ${qty} units of ${prod.sku} (${fromBranchId} -> ${toBranchId}).`,
    });

    res.status(201).json({ transferRef: ref, transfer: transferRecord, source, dest });
  });

  app.post('/api/mgmt/inventory/transfers/:id/receive', requireAuth, (req: AuthedRequest, res) => {
    const trf = db.stockTransfers.find((t) => t.id === req.params.id || t.transferRef === req.params.id);
    if (!trf) {
      res.status(404).json({ error: 'Stock transfer record not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'inventory', 'verify', trf.toBranchId);
    if (!user) return;
    if (trf.status !== 'In Transit') {
      res.status(400).json({ error: 'Transfer has already been received.' });
      return;
    }

    const receivedQty = Math.max(0, Math.min(trf.dispatchedQty, Math.floor(Number(req.body?.receivedQty ?? trf.dispatchedQty))));
    const damagedQty = Math.max(0, Math.min(trf.dispatchedQty - receivedQty, Math.floor(Number(req.body?.damagedQty ?? 0))));
    const varianceNote = typeof req.body?.varianceNote === 'string' ? req.body.varianceNote.trim() : '';

    const dest = db.stock.find((s) => s.productId === trf.productId && s.branchId === trf.toBranchId);
    if (dest) {
      dest.inTransit = Math.max(0, dest.inTransit - trf.dispatchedQty);
      dest.onHand += receivedQty;
      dest.warehouseQty += receivedQty;
      dest.damaged += damagedQty;
    }

    const hasVariance = receivedQty < trf.dispatchedQty || damagedQty > 0;
    trf.receivedQty = receivedQty;
    trf.damagedInTransitQty = damagedQty;
    trf.status = hasVariance ? 'Completed with Variance' : 'Completed';
    trf.receivedByName = user.fullName;
    trf.receivedAt = new Date().toISOString();
    trf.varianceNote = varianceNote || undefined;

    db.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: trf.productId,
      branchId: trf.toBranchId,
      type: 'TRANSFER_IN',
      quantityDelta: receivedQty,
      sourceLocation: `In-Transit (${trf.fromBranchId})`,
      destinationLocation: `${dest?.locationCode || trf.toBranchId} (Warehouse)`,
      referenceId: trf.transferRef,
      actorName: user.fullName,
      reason: hasVariance
        ? `Transfer received with transit variance (${receivedQty} ok, ${damagedQty} damaged)`
        : 'Confirmed full inter-branch transfer receipt',
    });

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: trf.toBranchId,
      module: 'inventory',
      action: 'RECEIVE_STOCK_TRANSFER',
      target: trf.transferRef,
      outcome: 'Success',
      detail: `Received ${receivedQty}/${trf.dispatchedQty} units at ${trf.toBranchId}.`,
    });

    res.json({ transfer: trf, dest });
  });

  app.post('/api/mgmt/inventory/cycle-counts', requireAuth, (req: AuthedRequest, res) => {
    const { productId, branchId, physicalQty, notes } = req.body as {
      productId: string;
      branchId: string;
      physicalQty: number;
      notes?: string;
    };
    const user = checkPermOrDeny(req, res, 'inventory', 'verify', branchId);
    if (!user) return;

    const stockRec = db.stock.find((s) => s.productId === productId && s.branchId === branchId);
    const prod = db.products.find((p) => p.id === productId);
    if (!stockRec || !prod) {
      res.status(404).json({ error: 'Stock record not found.' });
      return;
    }

    const phys = Math.max(0, Math.floor(Number(physicalQty)));
    const variance = phys - stockRec.onHand;

    const countRecord = {
      id: `cnt-${Date.now()}`,
      branchId,
      productId,
      productName: prod.name,
      systemQty: stockRec.onHand,
      physicalQty: phys,
      variance,
      countedByName: user.fullName,
      countedAt: new Date().toISOString(),
      status: variance === 0 ? ('Matched' as const) : ('Pending Approval' as const),
      notes: notes?.trim() || (variance === 0 ? 'Physical count verified exact match.' : 'Cycle count variance detected.'),
    };
    db.cycleCounts.unshift(countRecord);

    let approval: ApprovalRequest | undefined;
    if (variance !== 0) {
      approval = {
        id: `apr-cnt-${Date.now()}`,
        type: 'STOCK_WRITE_OFF',
        title: `Cycle Count Variance (${variance > 0 ? '+' : ''}${variance} units): ${prod.name}`,
        branchId,
        requestedByUserId: user.id,
        requestedByName: user.fullName,
        requestedAt: new Date().toISOString(),
        amountPkr: Math.abs(variance) * prod.purchaseCost,
        previousValue: `System: ${stockRec.onHand} units`,
        proposedValue: `Physical: ${phys} units`,
        justification: countRecord.notes,
        referenceId: `${branchId}::${productId}::${variance}::${countRecord.id}`,
        status: 'Pending',
      };
      db.approvals.unshift(approval);
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId,
      module: 'inventory',
      action: 'SUBMIT_CYCLE_COUNT',
      target: prod.sku,
      outcome: 'Success',
      detail: `Counted ${phys} vs system ${stockRec.onHand} (Variance: ${variance}).`,
    });

    res.status(201).json({ cycleCount: countRecord, approval });
  });

  app.post('/api/mgmt/inventory/adjustments', requireAuth, (req: AuthedRequest, res) => {
    const { productId, branchId, delta, reason } = req.body as {
      productId: string;
      branchId: string;
      delta: number;
      reason: string;
    };
    const user = checkPermOrDeny(req, res, 'inventory', 'create', branchId);
    if (!user) return;
    if (!reason?.trim()) {
      res.status(400).json({ error: 'Mandatory reason is required for all stock adjustments.' });
      return;
    }
    const stockRec = db.stock.find((s) => s.productId === productId && s.branchId === branchId);
    const prod = db.products.find((p) => p.id === productId);
    if (!stockRec || !prod) {
      res.status(404).json({ error: 'Stock record not found.' });
      return;
    }

    const intDelta = Math.round(Number(delta));
    if (!Number.isFinite(intDelta) || intDelta === 0) {
      res.status(400).json({ error: 'Adjustment quantity must be non-zero.' });
      return;
    }

    const valuePkr = Math.abs(intDelta) * prod.purchaseCost;
    const canAutoApprove =
      hasPermission(user.roleId, 'inventory', 'approve') &&
      valuePkr <= ROLE_DEFINITIONS[user.roleId].approvalLimitPkr;

    if (!canAutoApprove || intDelta < 0) {
      const approval: ApprovalRequest = {
        id: `apr-wo-${Date.now()}`,
        type: 'STOCK_WRITE_OFF',
        title: `Stock Adjustment (${intDelta > 0 ? '+' : ''}${intDelta} units): ${prod.name}`,
        branchId,
        requestedByUserId: user.id,
        requestedByName: user.fullName,
        requestedAt: new Date().toISOString(),
        amountPkr: valuePkr,
        previousValue: `${stockRec.onHand} units`,
        proposedValue: `${Math.max(0, stockRec.onHand + intDelta)} units`,
        justification: reason.trim(),
        referenceId: `${branchId}::${productId}::${intDelta}`,
        status: 'Pending',
      };
      db.approvals.unshift(approval);
      res.status(202).json({
        pendingApproval: true,
        approval,
        message: 'Adjustment queued for independent Inventory / Branch Manager approval.',
      });
      return;
    }

    stockRec.onHand = Math.max(0, stockRec.onHand + intDelta);
    stockRec.warehouseQty = Math.max(0, stockRec.warehouseQty + intDelta);
    db.stockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId,
      branchId,
      type: 'ADJUSTMENT',
      quantityDelta: intDelta,
      sourceLocation: stockRec.locationCode,
      destinationLocation: stockRec.locationCode,
      referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
      actorName: user.fullName,
      reason: reason.trim(),
    });
    res.json({ pendingApproval: false, stockRec });
  });

  // ==================== PURCHASING ENDPOINTS ====================
  app.post('/api/mgmt/purchasing/requisitions', requireAuth, (req: AuthedRequest, res) => {
    const { branchId, supplierId, productId, quantity, notes } = req.body as {
      branchId: string;
      supplierId: string;
      productId: string;
      quantity: number;
      notes: string;
    };
    const user = checkPermOrDeny(req, res, 'purchasing', 'create', branchId);
    if (!user) return;
    const prod = db.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(400).json({ error: 'Valid product is required.' });
      return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity || 1)));
    const pr = {
      id: `PR-2026-${String(32 + db.requisitions.length).padStart(3, '0')}`,
      branchId,
      requestedByUserId: user.id,
      requestedByName: user.fullName,
      createdAt: new Date().toISOString(),
      status: 'Approved' as const,
      supplierId: supplierId || prod.supplierId,
      items: [{ productId: prod.id, quantity: qty, estimatedUnitCost: prod.purchaseCost }],
      notes: notes?.trim() || 'Replenishment requisition.',
    };
    db.requisitions.unshift(pr);
    res.status(201).json({ requisition: pr });
  });

  app.post('/api/mgmt/purchasing/requisitions/:id/convert-to-po', requireAuth, (req: AuthedRequest, res) => {
    const pr = db.requisitions.find((r) => r.id === req.params.id);
    if (!pr) {
      res.status(404).json({ error: 'Purchase requisition not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'purchasing', 'create', pr.branchId);
    if (!user) return;
    if (pr.status === 'Converted to PO' || pr.status === 'Rejected') {
      res.status(400).json({ error: `Requisition already in status "${pr.status}".` });
      return;
    }

    const firstItem = pr.items[0];
    const supplierId = (req.body?.supplierId as string) || pr.supplierId;
    const qty = firstItem?.quantity || 1;
    const unitCost = firstItem?.estimatedUnitCost || 100;
    const totalAmount = qty * unitCost;
    const poNumber = `PO-2026-${String(16 + db.purchaseOrders.length).padStart(3, '0')}`;

    const withinLimit =
      hasPermission(user.roleId, 'purchasing', 'approve') &&
      totalAmount <= ROLE_DEFINITIONS[user.roleId].approvalLimitPkr;

    const po = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId,
      branchId: pr.branchId,
      requisitionId: pr.id,
      createdByUserId: user.id,
      createdByName: user.fullName,
      approvedByName: withinLimit ? user.fullName : undefined,
      createdAt: new Date().toISOString(),
      expectedDeliveryDate: '2026-11-19',
      status: withinLimit ? ('Approved' as const) : ('Pending Approval' as const),
      items: [
        {
          productId: firstItem.productId,
          orderedQty: qty,
          receivedQty: 0,
          damagedQty: 0,
          unitCost,
        },
      ],
      totalAmount,
    };

    pr.status = 'Converted to PO';
    db.purchaseOrders.unshift(po);

    if (!withinLimit) {
      db.approvals.unshift({
        id: `apr-po-${Date.now()}`,
        type: 'PURCHASE_ORDER',
        title: `Purchase Order Approval: ${poNumber} (from ${pr.id})`,
        branchId: pr.branchId,
        requestedByUserId: user.id,
        requestedByName: user.fullName,
        requestedAt: new Date().toISOString(),
        amountPkr: totalAmount,
        previousValue: pr.id,
        proposedValue: `PKR ${totalAmount.toLocaleString()} (${qty} units)`,
        justification: `Converted from ${pr.id}; requires independent Purchasing authorization.`,
        referenceId: po.id,
        status: 'Pending',
      });
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: pr.branchId,
      module: 'purchasing',
      action: 'CONVERT_PR_TO_PO',
      target: `${pr.id} -> ${po.poNumber}`,
      outcome: 'Success',
      detail: `Converted ${pr.id} to ${po.poNumber} (PKR ${totalAmount.toLocaleString()}).`,
    });

    res.status(201).json({ purchaseOrder: po, requisition: pr });
  });

  app.post('/api/mgmt/purchasing/orders', requireAuth, (req: AuthedRequest, res) => {
    const { branchId, supplierId, productId, quantity } = req.body as {
      branchId: string;
      supplierId: string;
      productId: string;
      quantity: number;
    };
    const user = checkPermOrDeny(req, res, 'purchasing', 'create', branchId);
    if (!user) return;
    const prod = db.products.find((p) => p.id === productId);
    if (!prod) {
      res.status(400).json({ error: 'Valid product is required.' });
      return;
    }
    const qty = Math.max(1, Math.floor(Number(quantity || 1)));
    const totalAmount = qty * prod.purchaseCost;
    const poNumber = `PO-2026-${String(16 + db.purchaseOrders.length).padStart(3, '0')}`;

    const withinLimit =
      hasPermission(user.roleId, 'purchasing', 'approve') &&
      totalAmount <= ROLE_DEFINITIONS[user.roleId].approvalLimitPkr;

    const po = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: supplierId || prod.supplierId,
      branchId,
      createdByUserId: user.id,
      createdByName: user.fullName,
      approvedByName: withinLimit ? user.fullName : undefined,
      createdAt: new Date().toISOString(),
      expectedDeliveryDate: '2026-11-19',
      status: withinLimit ? ('Approved' as const) : ('Pending Approval' as const),
      items: [
        {
          productId: prod.id,
          orderedQty: qty,
          receivedQty: 0,
          damagedQty: 0,
          unitCost: prod.purchaseCost,
        },
      ],
      totalAmount,
    };

    db.purchaseOrders.unshift(po);

    if (!withinLimit) {
      db.approvals.unshift({
        id: `apr-po-${Date.now()}`,
        type: 'PURCHASE_ORDER',
        title: `Purchase Order Approval: ${poNumber} (${prod.name})`,
        branchId,
        requestedByUserId: user.id,
        requestedByName: user.fullName,
        requestedAt: new Date().toISOString(),
        amountPkr: totalAmount,
        previousValue: 'Draft PO',
        proposedValue: `PKR ${totalAmount.toLocaleString()} (${qty} units)`,
        justification: `Exceeds issuer direct limit or requires Director Purchasing sign-off.`,
        referenceId: po.id,
        status: 'Pending',
      });
    }

    res.status(201).json({ purchaseOrder: po });
  });

  app.post('/api/mgmt/purchasing/grn', requireAuth, (req: AuthedRequest, res) => {
    const { poId, items, discrepancyNote } = req.body as {
      poId: string;
      items: { productId: string; acceptedQty: number; damagedQty: number }[];
      discrepancyNote?: string;
    };
    const po = db.purchaseOrders.find((p) => p.id === poId);
    if (!po) {
      res.status(404).json({ error: 'Purchase order not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'purchasing', 'verify', po.branchId);
    if (!user) return;
    if (po.status === 'Pending Approval' || po.status === 'Cancelled') {
      res.status(400).json({ error: `Cannot receive goods against PO in status "${po.status}".` });
      return;
    }

    const grnItems = po.items.map((poItem) => {
      const incoming = items?.find((x) => x.productId === poItem.productId);
      const accepted = Math.max(0, Math.round(Number(incoming?.acceptedQty ?? 0)));
      const damaged = Math.max(0, Math.round(Number(incoming?.damagedQty ?? 0)));

      poItem.receivedQty += accepted;
      poItem.damagedQty += damaged;

      const stockRec = db.stock.find(
        (s) => s.productId === poItem.productId && s.branchId === po.branchId
      );
      if (stockRec) {
        stockRec.onHand += accepted;
        stockRec.warehouseQty += accepted;
        stockRec.damaged += damaged;
      }

      if (accepted > 0) {
        db.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          productId: poItem.productId,
          branchId: po.branchId,
          type: 'GRN',
          quantityDelta: accepted,
          sourceLocation: 'Supplier Delivery Dock',
          destinationLocation: `${stockRec?.locationCode || po.branchId} (Backroom Warehouse)`,
          referenceId: po.poNumber,
          actorName: user.fullName,
          reason: `Inbound GRN received (${damaged} damaged quarantined)`,
        });
      }

      return {
        productId: poItem.productId,
        orderedQty: poItem.orderedQty,
        acceptedQty: accepted,
        damagedQty: damaged,
      };
    });

    const allFulfilled = po.items.every((it) => it.receivedQty >= it.orderedQty);
    po.status = allFulfilled ? 'Received' : 'Partially Received';

    const grn = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-${po.branchId.slice(0, 3).toUpperCase()}-${20 + db.goodsReceipts.length}`,
      poId: po.id,
      poNumber: po.poNumber,
      branchId: po.branchId,
      receivedByName: user.fullName,
      receivedAt: new Date().toISOString(),
      items: grnItems,
      discrepancyNote: discrepancyNote?.trim(),
    };
    db.goodsReceipts.unshift(grn);

    // Link or auto-create supplier invoice with 3-way match evaluation
    let inv = db.supplierInvoices.find((i) => i.poId === po.id);
    const totalAcceptedAmount = po.items.reduce((sum, it) => sum + it.receivedQty * it.unitCost, 0);
    const matchStatus = evaluateThreeWayMatch(
      po,
      po.items.map((it) => ({ productId: it.productId, acceptedQty: it.receivedQty })),
      inv ? inv.billedAmount : totalAcceptedAmount
    );
    if (inv) {
      inv.grnAcceptedAmount = totalAcceptedAmount;
      inv.threeWayMatchStatus = matchStatus;
    } else {
      inv = {
        id: `inv-sup-${Date.now()}`,
        invoiceNumber: `INV-${po.poNumber.slice(-3)}-${100 + db.supplierInvoices.length}`,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        branchId: po.branchId,
        billedAmount: totalAcceptedAmount,
        grnAcceptedAmount: totalAcceptedAmount,
        threeWayMatchStatus: matchStatus,
        paymentStatus: 'Unpaid',
        dueDate: '2026-12-10',
      };
      db.supplierInvoices.unshift(inv);
    }

    res.status(201).json({ grn, po, invoice: inv });
  });

  // ==================== ONLINE ORDERS FULFILLMENT ====================
  app.patch('/api/mgmt/orders/:id/pick', requireAuth, (req: AuthedRequest, res) => {
    const order = db.onlineOrders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Online order not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'orders', 'edit', order.branchId);
    if (!user) return;

    const { productId, pickedQty, flaggedMissing, substituteNote } = req.body as {
      productId: string;
      pickedQty: number;
      flaggedMissing?: boolean;
      substituteNote?: string;
    };
    const line = order.items.find((l) => l.productId === productId);
    if (!line) {
      res.status(404).json({ error: 'Order line not found.' });
      return;
    }
    line.pickedQty = Math.min(line.quantity, Math.max(0, Math.floor(Number(pickedQty))));
    line.flaggedMissing = Boolean(flaggedMissing);
    if (substituteNote !== undefined) line.substituteNote = substituteNote.trim();
    order.assignedPickerName = user.fullName;
    if (order.stage === 'Confirmed' || order.stage === 'Placed') {
      order.stage = 'Picking';
    }
    if (line.flaggedMissing) {
      order.stage = 'Exception';
      order.exceptionReason = line.substituteNote
        ? `Missing/Substitution: ${line.substituteNote}`
        : `Item ${line.name} flagged missing during picking`;
    }
    res.json({ order });
  });

  app.patch('/api/mgmt/orders/:id/stage', requireAuth, (req: AuthedRequest, res) => {
    const order = db.onlineOrders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Online order not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'orders', 'edit', order.branchId);
    if (!user) return;

    const { stage, packingVerified, paymentStatus, exceptionReason } = req.body as {
      stage: OnlineFulfillmentStage;
      packingVerified?: boolean;
      paymentStatus?: OnlineFulfillmentOrder['paymentStatus'];
      exceptionReason?: string;
    };
    if (packingVerified !== undefined) order.packingVerified = packingVerified;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (exceptionReason !== undefined) order.exceptionReason = exceptionReason;

    if (stage === 'Packed' && !order.packingVerified) {
      order.packingVerified = true;
    }

    if ((stage === 'Dispatched' || stage === 'Completed') && order.reservationStatus === 'Reserved') {
      for (const line of order.items) {
        const deductUnits = line.pickedQty > 0 ? line.pickedQty : line.quantity;
        const stockRec = db.stock.find(
          (s) => s.productId === line.productId && s.branchId === order.branchId
        );
        if (stockRec) {
          stockRec.reserved = Math.max(0, stockRec.reserved - line.quantity);
          stockRec.onHand = Math.max(0, stockRec.onHand - deductUnits);
          stockRec.floorQty = Math.max(0, stockRec.floorQty - deductUnits);
        }
        db.stockMovements.unshift({
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          productId: line.productId,
          branchId: order.branchId,
          type: 'ONLINE_DISPATCH',
          quantityDelta: -deductUnits,
          sourceLocation: `${stockRec?.locationCode || order.branchId}`,
          destinationLocation: `Customer (${order.fulfillmentMethod})`,
          referenceId: order.orderNumber,
          actorName: user.fullName,
          reason: `Fulfillment moved to ${stage}`,
        });
      }
      order.reservationStatus = 'Deducted';
      if (stage === 'Completed' && order.paymentStatus === 'Pending') {
        order.paymentStatus = 'Paid';
      }
    } else if (stage === 'Cancelled' && order.reservationStatus === 'Reserved') {
      for (const line of order.items) {
        const stockRec = db.stock.find(
          (s) => s.productId === line.productId && s.branchId === order.branchId
        );
        if (stockRec) {
          stockRec.reserved = Math.max(0, stockRec.reserved - line.quantity);
        }
      }
      order.reservationStatus = 'Released';
    }

    order.stage = stage;
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: order.branchId,
      module: 'orders',
      action: 'UPDATE_ORDER_STAGE',
      target: order.orderNumber,
      outcome: 'Success',
      detail: `Order stage changed to ${stage} (Stock: ${order.reservationStatus}, Payment: ${order.paymentStatus}).`,
    });

    res.json({ order });
  });

  // ==================== FINANCE & ACCOUNTS ENDPOINTS ====================
  app.post('/api/mgmt/finance/reconcile-shift', requireAuth, (req: AuthedRequest, res) => {
    const { shiftId } = req.body as { shiftId: string };
    const shift = db.shifts.find((s) => s.id === shiftId);
    if (!shift) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }
    const user =
      hasPermission(req.staffUser!.roleId, 'finance', 'verify')
        ? checkPermOrDeny(req, res, 'finance', 'verify', shift.branchId)
        : checkPermOrDeny(req, res, 'pos', 'approve', shift.branchId);
    if (!user) return;

    shift.status = 'Closed';
    shift.reconciledByName = user.fullName;
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: shift.branchId,
      module: 'finance',
      action: 'RECONCILE_SHIFT',
      target: shift.shiftNumber,
      outcome: 'Success',
      detail: `Verified cash closing variance (PKR ${shift.variance ?? 0}) and closed shift.`,
    });
    res.json({ shift });
  });

  app.post('/api/mgmt/finance/bank-settlements/:id/reconcile', requireAuth, (req: AuthedRequest, res) => {
    const bnk = db.bankSettlements.find((b) => b.id === req.params.id);
    if (!bnk) {
      res.status(404).json({ error: 'Bank settlement batch not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'finance', 'verify', bnk.branchId);
    if (!user) return;
    const bankAmount = req.body?.bankSettledAmount !== undefined ? Number(req.body.bankSettledAmount) : bnk.bankSettledAmount;
    bnk.bankSettledAmount = Math.round(bankAmount);
    bnk.variance = bnk.bankSettledAmount - bnk.posCardExpected;
    bnk.status = bnk.variance === 0 ? 'Matched' : 'Variance Flagged';
    bnk.reconciledByName = user.fullName;
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: bnk.branchId,
      module: 'finance',
      action: 'RECONCILE_BANK_SETTLEMENT',
      target: bnk.batchRef,
      outcome: 'Success',
      detail: `Bank settlement verified (${bnk.status}, variance PKR ${bnk.variance}).`,
    });
    res.json({ bankSettlement: bnk });
  });

  app.post('/api/mgmt/finance/expenses', requireAuth, (req: AuthedRequest, res) => {
    const { branchId, category, description, amount } = req.body as {
      branchId: string;
      category: 'Utilities' | 'Store Maintenance' | 'Logistics' | 'Packaging Supplies' | 'Staff Welfare';
      description: string;
      amount: number;
    };
    const user = checkPermOrDeny(req, res, 'finance', 'create', branchId);
    if (!user) return;
    if (!description?.trim() || Number(amount) <= 0) {
      res.status(400).json({ error: 'Description and positive PKR amount are required.' });
      return;
    }
    const exp = {
      id: `exp-${Date.now()}`,
      branchId,
      category,
      description: description.trim(),
      amount: Math.round(Number(amount)),
      date: new Date().toISOString().slice(0, 10),
      recordedByName: user.fullName,
      status: hasPermission(user.roleId, 'finance', 'approve') ? ('Approved' as const) : ('Recorded' as const),
    };
    db.expenses.unshift(exp);
    res.status(201).json({ expense: exp });
  });

  app.post('/api/mgmt/finance/invoices/:id/prepare', requireAuth, (req: AuthedRequest, res) => {
    const inv = db.supplierInvoices.find((i) => i.id === req.params.id);
    if (!inv) {
      res.status(404).json({ error: 'Supplier invoice not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'finance', 'submit', inv.branchId);
    if (!user) return;
    if (inv.paymentStatus === 'Paid') {
      res.status(400).json({ error: 'Invoice already paid.' });
      return;
    }
    inv.paymentStatus = 'Prepared (Pending Release)';
    inv.preparedByName = user.fullName;
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: inv.branchId,
      module: 'finance',
      action: 'PREPARE_SUPPLIER_PAYMENT',
      target: inv.invoiceNumber,
      outcome: 'Success',
      detail: `Prepared payment batch for ${inv.invoiceNumber} awaiting authorized release.`,
    });
    res.json({ invoice: inv });
  });

  app.post('/api/mgmt/finance/invoices/:id/pay', requireAuth, (req: AuthedRequest, res) => {
    const inv = db.supplierInvoices.find((i) => i.id === req.params.id);
    if (!inv) {
      res.status(404).json({ error: 'Supplier invoice not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'finance', 'approve', inv.branchId);
    if (!user) return;

    if (inv.threeWayMatchStatus !== 'Matched' && user.roleId !== 'director_accounts' && user.roleId !== 'ceo' && user.roleId !== 'owner_partner') {
      res.status(400).json({
        error: `3-Way Match exception (${inv.threeWayMatchStatus}). Only Director Accounts, Owner, or CEO can override mismatched supplier invoices.`,
      });
      return;
    }

    inv.paymentStatus = 'Paid';
    inv.approvedByName = user.fullName;
    inv.paidAt = new Date().toISOString();
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: inv.branchId,
      module: 'finance',
      action: 'PAY_SUPPLIER_INVOICE',
      target: inv.invoiceNumber,
      outcome: 'Success',
      detail: `Released supplier payment PKR ${inv.billedAmount.toLocaleString()} (${inv.threeWayMatchStatus}).`,
    });
    res.json({ invoice: inv });
  });

  // ==================== STAFF, BRANCHES & CUSTOMERS ====================
  app.post('/api/mgmt/staff/leave', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'staff', 'submit');
    if (!user) return;
    const { leaveType, startDate, days, reason } = req.body as {
      leaveType: 'Casual' | 'Annual' | 'Medical';
      startDate: string;
      days: number;
      reason: string;
    };
    const reqRec = {
      id: `lv-${Date.now()}`,
      userId: user.id,
      employeeName: user.fullName,
      branchId: user.branchId === 'all' ? 'hyderabad' : user.branchId,
      leaveType: leaveType || 'Casual',
      startDate: startDate || '2026-11-25',
      days: Math.max(1, Math.min(30, Number(days || 1))),
      reason: reason?.trim() || 'Personal request',
      status: 'Pending' as const,
    };
    db.leaveRequests.unshift(reqRec);
    res.status(201).json({ leaveRequest: reqRec });
  });

  app.patch('/api/mgmt/staff/leave/:id', requireAuth, (req: AuthedRequest, res) => {
    const leave = db.leaveRequests.find((l) => l.id === req.params.id);
    if (!leave) {
      res.status(404).json({ error: 'Leave request not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'staff', 'approve', leave.branchId);
    if (!user) return;
    if (leave.userId === user.id) {
      res.status(403).json({ error: 'Segregation of duties: you cannot approve your own leave request.' });
      return;
    }
    const decision = req.body?.status === 'Rejected' ? 'Rejected' : 'Approved';
    leave.status = decision;
    res.json({ leaveRequest: leave });
  });

  app.post('/api/mgmt/staff/attendance', requireAuth, (req: AuthedRequest, res) => {
    const { userId, branchId, shiftWindow, status } = req.body as {
      userId: string;
      branchId: string;
      shiftWindow: string;
      status?: 'On Shift' | 'Scheduled' | 'Completed' | 'Leave Approved';
    };
    const actor = checkPermOrDeny(req, res, 'staff', 'edit', branchId);
    if (!actor) return;
    const target = db.staffUsers.find((u) => u.id === userId);
    if (!target) {
      res.status(404).json({ error: 'Staff member not found.' });
      return;
    }
    const rec = {
      id: `att-${Date.now()}`,
      userId: target.id,
      employeeCode: target.employeeCode,
      fullName: target.fullName,
      roleLabel: target.department,
      branchId: branchId || target.branchId,
      shiftWindow: shiftWindow || '10:00 AM – 06:00 PM',
      status: status || ('Scheduled' as const),
    };
    db.attendance.unshift(rec);
    addAudit({
      actorUserId: actor.id,
      actorName: actor.fullName,
      actorRole: ROLE_DEFINITIONS[actor.roleId].label,
      branchId: rec.branchId,
      module: 'staff',
      action: 'ASSIGN_SHIFT_ROSTER',
      target: target.employeeCode,
      outcome: 'Success',
      detail: `Scheduled ${target.fullName} for ${rec.shiftWindow} (${rec.branchId}).`,
    });
    res.status(201).json({ attendance: rec });
  });

  app.patch('/api/mgmt/branches/checklist/:id', requireAuth, (req: AuthedRequest, res) => {
    const item = db.checklists.find((c) => c.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Checklist task not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'branches', 'edit', item.branchId);
    if (!user) return;
    item.completed = !item.completed;
    item.completedBy = item.completed ? user.fullName : undefined;
    item.completedAt = item.completed ? new Date().toISOString() : undefined;
    res.json({ checklistItem: item });
  });

  app.post('/api/mgmt/branches/maintenance', requireAuth, (req: AuthedRequest, res) => {
    const { branchId, equipment, issue, priority } = req.body as {
      branchId: string;
      equipment: string;
      issue: string;
      priority?: 'Normal' | 'Urgent';
    };
    const user = checkPermOrDeny(req, res, 'branches', 'edit', branchId);
    if (!user) return;
    if (!equipment?.trim() || !issue?.trim()) {
      res.status(400).json({ error: 'Equipment name and issue summary are required.' });
      return;
    }
    const ticket = {
      id: `mnt-${Date.now()}`,
      branchId,
      equipment: equipment.trim(),
      issue: issue.trim(),
      priority: priority === 'Urgent' ? ('Urgent' as const) : ('Normal' as const),
      reportedByName: user.fullName,
      assignedToName: 'Naveed Arain (Demo)',
      status: 'Open' as const,
      createdAt: new Date().toISOString(),
    };
    db.maintenanceTickets.unshift(ticket);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId,
      module: 'branches',
      action: 'LOG_MAINTENANCE_TICKET',
      target: ticket.equipment,
      outcome: 'Success',
      detail: `Opened supermarket equipment ticket (${ticket.priority}): ${ticket.issue}`,
    });
    res.status(201).json({ maintenanceTicket: ticket });
  });

  app.patch('/api/mgmt/branches/maintenance/:id', requireAuth, (req: AuthedRequest, res) => {
    const ticket = db.maintenanceTickets.find((m) => m.id === req.params.id);
    if (!ticket) {
      res.status(404).json({ error: 'Maintenance ticket not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'branches', 'edit', ticket.branchId);
    if (!user) return;
    if (req.body?.status) ticket.status = req.body.status;
    if (req.body?.assignedToName) ticket.assignedToName = String(req.body.assignedToName);
    res.json({ maintenanceTicket: ticket });
  });

  app.post('/api/mgmt/customers/cases', requireAuth, (req: AuthedRequest, res) => {
    const { customerName, maskedPhone, branchId, orderNumber, category, priority, notes } = req.body as {
      customerName: string;
      maskedPhone: string;
      branchId: string;
      orderNumber?: string;
      category: 'Inquiry' | 'Complaint' | 'Return & Exchange' | 'Order Assistance';
      priority: 'Normal' | 'High';
      notes: string;
    };
    const user = checkPermOrDeny(req, res, 'customers', 'create', branchId);
    if (!user) return;
    if (!customerName?.trim() || !notes?.trim()) {
      res.status(400).json({ error: 'Customer name and case summary are required.' });
      return;
    }
    const newCase = {
      id: `case-${Date.now()}`,
      caseNumber: `CS-2026-${410 + db.customerCases.length}`,
      customerName: customerName.trim(),
      maskedPhone: maskedPhone?.trim() || '03XX-***-XXXX',
      branchId,
      orderNumber: orderNumber?.trim(),
      category: category || 'Inquiry',
      priority: priority || 'Normal',
      status: 'Open' as const,
      assignedTo: user.fullName,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };
    db.customerCases.unshift(newCase);
    res.status(201).json({ customerCase: newCase });
  });

  app.patch('/api/mgmt/customers/cases/:id', requireAuth, (req: AuthedRequest, res) => {
    const c = db.customerCases.find((x) => x.id === req.params.id);
    if (!c) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }
    const user = checkPermOrDeny(req, res, 'customers', 'edit', c.branchId);
    if (!user) return;
    if (req.body?.status) c.status = req.body.status;
    if (req.body?.refundDisposition) c.refundDisposition = req.body.refundDisposition;
    if (req.body?.requestRefundAmount && Number(req.body.requestRefundAmount) > 0) {
      db.approvals.unshift({
        id: `apr-ref-${Date.now()}`,
        type: 'REFUND_REQUEST',
        title: `Customer Refund Request (${c.caseNumber})`,
        branchId: c.branchId,
        requestedByUserId: user.id,
        requestedByName: user.fullName,
        requestedAt: new Date().toISOString(),
        amountPkr: Math.round(Number(req.body.requestRefundAmount)),
        previousValue: c.orderNumber || c.caseNumber,
        proposedValue: `PKR ${Math.round(Number(req.body.requestRefundAmount)).toLocaleString()} Refund`,
        justification: `${c.notes} (${c.refundDisposition || 'Restock Sellable'})`,
        referenceId: c.id,
        status: 'Pending',
      });
    }
    res.json({ customerCase: c });
  });

  // ==================== GOVERNANCE, APPROVALS & MIS SETTINGS ====================
  app.post('/api/mgmt/approvals/:id/decide', requireAuth, (req: AuthedRequest, res) => {
    const user = req.staffUser!;
    const approval = db.approvals.find((a) => a.id === req.params.id);
    if (!approval) {
      res.status(404).json({ error: 'Approval request not found.' });
      return;
    }
    if (approval.status !== 'Pending') {
      res.status(400).json({ error: 'This approval request has already been decided.' });
      return;
    }

    const decision: 'Approved' | 'Rejected' = req.body?.decision === 'Rejected' ? 'Rejected' : 'Approved';
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';

    const check = evaluateApprovalAuthority(user, approval);
    if (!check.allowed) {
      addAudit({
        actorUserId: user.id,
        actorName: user.fullName,
        actorRole: ROLE_DEFINITIONS[user.roleId].label,
        branchId: approval.branchId,
        module: 'settings',
        action: `APPROVAL_${decision.toUpperCase()}`,
        target: approval.id,
        outcome: 'Denied',
        detail: check.reason || 'Insufficient approval authority.',
      });
      res.status(403).json({ error: check.reason });
      return;
    }

    approval.status = decision;
    approval.decidedByUserId = user.id;
    approval.decidedByName = user.fullName;
    approval.decidedAt = new Date().toISOString();
    approval.decisionNote = note;

    if (decision === 'Approved') {
      if (approval.type === 'PRICE_CHANGE' && approval.referenceId) {
        const prod = db.products.find((p) => p.id === approval.referenceId);
        if (prod) {
          prod.sellingPrice = approval.amountPkr;
        }
      } else if (approval.type === 'PURCHASE_ORDER' && approval.referenceId) {
        const po = db.purchaseOrders.find(
          (p) => p.id === approval.referenceId || p.poNumber === approval.referenceId
        );
        if (po) {
          po.status = 'Approved';
          po.approvedByName = user.fullName;
        }
      } else if (approval.type === 'STOCK_WRITE_OFF' && approval.referenceId?.includes('::')) {
        const [bId, pId, deltaStr, countId] = approval.referenceId.split('::');
        const stockRec = db.stock.find((s) => s.branchId === bId && s.productId === pId);
        const delta = Number(deltaStr || 0);
        if (stockRec && Number.isFinite(delta)) {
          stockRec.onHand = Math.max(0, stockRec.onHand + delta);
          stockRec.warehouseQty = Math.max(0, stockRec.warehouseQty + delta);
          db.stockMovements.unshift({
            id: `mov-${Date.now()}`,
            timestamp: new Date().toISOString(),
            productId: pId,
            branchId: bId,
            type: 'ADJUSTMENT',
            quantityDelta: delta,
            sourceLocation: stockRec.locationCode,
            destinationLocation: delta < 0 ? 'Shrinkage Write-Off' : stockRec.locationCode,
            referenceId: approval.id,
            actorName: user.fullName,
            reason: `Approved adjustment/write-off: ${approval.justification}`,
          });
        }
        if (countId) {
          const cnt = db.cycleCounts.find((c) => c.id === countId);
          if (cnt) cnt.status = 'Adjusted';
        }
      } else if (approval.type === 'REFUND_REQUEST' && approval.referenceId) {
        totalRefundDeductions += approval.amountPkr;
        const cCase = db.customerCases.find((c) => c.id === approval.referenceId);
        if (cCase) {
          cCase.status = 'Resolved';
          if (cCase.orderNumber) {
            const ord = db.onlineOrders.find((o) => o.orderNumber === cCase.orderNumber);
            if (ord) {
              ord.paymentStatus = 'Refunded';
              for (const line of ord.items) {
                const st = db.stock.find((s) => s.productId === line.productId && s.branchId === ord.branchId);
                if (st) {
                  if (cCase.refundDisposition === 'Damaged Quarantine') {
                    st.damaged += line.quantity;
                  } else {
                    st.onHand += line.quantity;
                    st.floorQty += line.quantity;
                  }
                }
                db.stockMovements.unshift({
                  id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  timestamp: new Date().toISOString(),
                  productId: line.productId,
                  branchId: ord.branchId,
                  type: 'RETURN',
                  quantityDelta: cCase.refundDisposition === 'Damaged Quarantine' ? 0 : line.quantity,
                  sourceLocation: 'Customer Return',
                  destinationLocation: cCase.refundDisposition === 'Damaged Quarantine' ? 'Damaged Quarantine' : 'Sales Floor',
                  referenceId: ord.orderNumber,
                  actorName: user.fullName,
                  reason: `Approved customer refund (${cCase.refundDisposition || 'Restock Sellable'})`,
                });
              }
            }
          }
        }
      }
    }

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: approval.branchId,
      module: 'settings',
      action: `APPROVAL_${decision.toUpperCase()}`,
      target: approval.title,
      outcome: 'Success',
      detail: `${decision} by ${user.fullName}${note ? ` — ${note}` : ''}`,
    });

    res.json({ approval });
  });

  app.post('/api/mgmt/settings/users', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'settings', 'administer');
    if (!user) return;
    const { fullName, email, roleId, branchId, department } = req.body as {
      fullName: string;
      email: string;
      roleId: StaffRoleId;
      branchId: string;
      department: string;
    };
    if (!fullName?.trim() || !email?.trim() || !ROLE_DEFINITIONS[roleId]) {
      res.status(400).json({ error: 'Valid name, email, and role are required.' });
      return;
    }
    if (db.staffUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      res.status(400).json({ error: 'Email already assigned to a staff account.' });
      return;
    }
    const created: StaffCredentialSeed = {
      id: `usr-${Date.now()}`,
      employeeCode: `MRH-EMP-${100 + db.staffUsers.length}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      roleId,
      department: department?.trim() || 'Store Operations',
      branchId: ROLE_DEFINITIONS[roleId].branchRestricted ? branchId || 'hyderabad' : 'all',
      active: true,
      demoPin: 'demo1234',
    };
    db.staffUsers.push(created);
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: created.branchId,
      module: 'settings',
      action: 'CREATE_STAFF_USER',
      target: created.employeeCode,
      outcome: 'Success',
      detail: `Provisioned ${created.fullName} as ${ROLE_DEFINITIONS[roleId].label}.`,
    });
    res.status(201).json({ staffUser: stripCredential(created) });
  });

  app.patch('/api/mgmt/settings/users/:id/role', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'settings', 'administer');
    if (!user) return;
    const target = db.staffUsers.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Staff user not found.' });
      return;
    }
    if (target.id === user.id) {
      res.status(403).json({ error: 'Self-modification of your own MIS/CEO privileges is blocked.' });
      return;
    }
    const { roleId, active, branchId } = req.body as {
      roleId?: StaffRoleId;
      active?: boolean;
      branchId?: string;
    };
    if (roleId && ROLE_DEFINITIONS[roleId]) target.roleId = roleId;
    if (active !== undefined) target.active = Boolean(active);
    if (branchId) target.branchId = branchId;

    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: target.branchId,
      module: 'settings',
      action: 'UPDATE_STAFF_ROLE',
      target: target.employeeCode,
      outcome: 'Success',
      detail: `Updated ${target.fullName} -> ${ROLE_DEFINITIONS[target.roleId].label} (Active: ${target.active}).`,
    });
    res.json({ staffUser: stripCredential(target) });
  });

  app.post('/api/mgmt/settings/sync-simulate-issue', requireAuth, (req: AuthedRequest, res) => {
    const user = checkPermOrDeny(req, res, 'settings', 'administer');
    if (!user) return;
    const target = db.syncJobs.find((j) => j.channel === 'Website Catalogue Sync');
    if (target) {
      target.status = 'Attention Required';
      target.detail = 'Simulated feed timeout — awaiting MIS diagnostic retry.';
    }
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: 'all',
      module: 'sync',
      action: 'SIMULATE_SYNC_ALERT',
      target: 'Website Catalogue Sync',
      outcome: 'Success',
      detail: 'Marked sync feed Attention Required for MIS failover recovery drill.',
    });
    res.json({ syncJobs: db.syncJobs });
  });

  app.post('/api/mgmt/settings/sync-retry', requireAuth, (req: AuthedRequest, res) => {
    const user = req.staffUser!;
    if (!hasPermission(user.roleId, 'settings', 'view') && !hasPermission(user.roleId, 'products', 'submit')) {
      res.status(403).json({ error: 'Permission denied to trigger website sync.' });
      return;
    }
    const now = new Date().toISOString();
    for (const job of db.syncJobs) {
      job.lastRunAt = now;
      job.status = 'Healthy';
      if (job.channel === 'Website Catalogue Sync') {
        job.recordsSynced = db.products.length;
        job.detail = 'Authoritative SKU & selling price feed synchronized with storefront.';
      }
      if (job.channel === 'Inventory Availability Feed') {
        job.recordsSynced = db.stock.length;
        job.detail = 'Sellable vs reserved stock availability active across 3 branches.';
      }
      if (job.channel === 'Online Orders Intake') {
        job.recordsSynced = db.onlineOrders.length;
        job.detail = 'Public storefront checkout connected to reservation & fulfillment queue.';
      }
    }
    addAudit({
      actorUserId: user.id,
      actorName: user.fullName,
      actorRole: ROLE_DEFINITIONS[user.roleId].label,
      branchId: 'all',
      module: 'sync',
      action: 'RUN_WEBSITE_SYNC',
      target: 'Storefront Feeds',
      outcome: 'Success',
      detail: 'Triggered manual catalogue, inventory & online order synchronization.',
    });
    res.json({ syncJobs: db.syncJobs });
  });

  return app;
}
