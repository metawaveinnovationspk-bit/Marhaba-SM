import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCashChange,
  calculateShiftClosing,
  classifyExpiryStatus,
  computePosLineTotal,
  computePosTotals,
  evaluateThreeWayMatch,
  getSellableStock,
  lookupProductByBarcodeOrSku,
  validateNewProductInput,
} from './calculations';
import {
  canAccessBranch,
  canAccessModule,
  evaluateApprovalAuthority,
  hasPermission,
  redactProductForRole,
} from './permissions';
import type { ApprovalRequest, ErpProduct, PurchaseOrder, StaffUser } from './types';

const SAMPLE_PRODUCT: ErpProduct = {
  id: 'olpers-milk-1l-carton',
  sku: 'MRH-DAI-101',
  barcode: '8961001011015',
  name: "Olper's Full Cream Milk 1 Liter (Carton of 12)",
  brand: "Olper's",
  departmentId: 'dairy-bakery',
  departmentName: 'Dairy & Bakery',
  subcategory: 'UHT & Packaged Milk',
  supplierId: 'sup-friesland',
  unitLabel: '1L × 12 Carton',
  packConversion: 12,
  purchaseCost: 3720,
  sellingPrice: 4180,
  originalPrice: 4560,
  taxClass: 'Standard GST (Demo Configurable)',
  status: 'Active',
  reorderPoint: 15,
  dataTier: 'verified',
};

const CASHIER_USER: StaffUser = {
  id: 'usr-cashier-hyd',
  employeeCode: 'MRH-EMP-042',
  fullName: 'Usman Tariq',
  email: 'usman.cashier@marhaba.demo',
  roleId: 'cashier',
  department: 'Frontline Checkout',
  branchId: 'hyderabad',
  active: true,
};

const PURCHASING_MGR: StaffUser = {
  id: 'usr-purch-mgr',
  employeeCode: 'MRH-EMP-014',
  fullName: 'Sanaullah Qureshi',
  email: 'sanaullah.purchasing@marhaba.demo',
  roleId: 'purchasing_manager',
  department: 'Procurement',
  branchId: 'all',
  active: true,
};

const CEO_USER: StaffUser = {
  id: 'usr-ceo',
  employeeCode: 'MRH-DIR-001',
  fullName: 'Riaz Ahmed Memon',
  email: 'ceo@marhaba.demo',
  roleId: 'ceo',
  department: 'Executive Office',
  branchId: 'all',
  active: true,
  isPublishedLeadership: true,
};

test('RBAC isolates Cashier from Finance/Purchasing and hides purchase cost', () => {
  assert.equal(canAccessModule('cashier', 'pos'), true);
  assert.equal(canAccessModule('cashier', 'finance'), false);
  assert.equal(canAccessModule('cashier', 'purchasing'), false);
  assert.equal(hasPermission('cashier', 'products', 'edit'), false);

  const cashierView = redactProductForRole(SAMPLE_PRODUCT, 'cashier');
  assert.equal(cashierView.purchaseCost, null);
  assert.equal(cashierView.marginPercent, null);

  const ceoView = redactProductForRole(SAMPLE_PRODUCT, 'ceo');
  assert.equal(ceoView.purchaseCost, 3720);
  assert.ok(ceoView.marginPercent !== null && ceoView.marginPercent > 0);
});

test('Branch scope blocks Hyderabad branch staff from Karachi records', () => {
  assert.equal(canAccessBranch(CASHIER_USER, 'hyderabad'), true);
  assert.equal(canAccessBranch(CASHIER_USER, 'karachi-p10'), false);
  assert.equal(canAccessBranch(CEO_USER, 'karachi-p10'), true);
  assert.equal(canAccessBranch(CEO_USER, 'all'), true);
});

test('Segregation of duties rejects self-approval even for high-limit managers', () => {
  const selfRequest: ApprovalRequest = {
    id: 'apr-1',
    type: 'PURCHASE_ORDER',
    title: 'PO Dairy Replenishment',
    branchId: 'hyderabad',
    requestedByUserId: PURCHASING_MGR.id,
    requestedByName: PURCHASING_MGR.fullName,
    requestedAt: '2026-11-16T09:00:00Z',
    amountPkr: 120000,
    previousValue: '0',
    proposedValue: 'PKR 120,000',
    justification: 'Weekly dairy restock',
    status: 'Pending',
  };

  const selfDecision = evaluateApprovalAuthority(PURCHASING_MGR, selfRequest);
  assert.equal(selfDecision.allowed, false);
  assert.match(selfDecision.reason || '', /Segregation of duties/i);

  const independentDecision = evaluateApprovalAuthority(CEO_USER, selfRequest);
  assert.equal(independentDecision.allowed, true);
});

test('POS barcode lookup, line totals, discounts, and cash change math', () => {
  assert.equal(lookupProductByBarcodeOrSku([SAMPLE_PRODUCT], '8961001011015')?.id, SAMPLE_PRODUCT.id);
  assert.equal(lookupProductByBarcodeOrSku([SAMPLE_PRODUCT], 'MRH-DAI-101')?.id, SAMPLE_PRODUCT.id);

  assert.equal(computePosLineTotal(1000, 3, 5), 2850);
  const totals = computePosTotals([
    {
      productId: SAMPLE_PRODUCT.id,
      sku: SAMPLE_PRODUCT.sku,
      barcode: SAMPLE_PRODUCT.barcode,
      name: SAMPLE_PRODUCT.name,
      unitLabel: SAMPLE_PRODUCT.unitLabel,
      quantity: 2,
      unitPrice: 4180,
      discountPercent: 5,
      lineTotal: 7942,
    },
  ]);
  assert.equal(totals.subtotal, 8360);
  assert.equal(totals.discountAmount, 418);
  assert.equal(totals.grandTotal, 7942);
  assert.equal(calculateCashChange(7942, 8000), 58);
});

test('Shift closing computes expected cash and detects short/over variances', () => {
  const balanced = calculateShiftClosing(
    { openingFloat: 10000, cashSalesTotal: 25400, refundsTotal: 400 },
    35000
  );
  assert.equal(balanced.expectedCash, 35000);
  assert.equal(balanced.variance, 0);
  assert.equal(balanced.statusLabel, 'Balanced');

  const short = calculateShiftClosing(
    { openingFloat: 10000, cashSalesTotal: 25400, refundsTotal: 0 },
    34900
  );
  assert.equal(short.variance, -500);
  assert.equal(short.statusLabel, 'Short');
});

test('Sellable stock, FEFO expiry classification, and 3-way PO/GRN/Invoice match', () => {
  const sellable = getSellableStock({
    productId: SAMPLE_PRODUCT.id,
    branchId: 'hyderabad',
    locationCode: 'HYD-A01',
    zone: 'Sales Floor',
    onHand: 40,
    floorQty: 24,
    warehouseQty: 16,
    reserved: 6,
    damaged: 2,
    inTransit: 10,
    batchNumber: 'B-2611',
    expiryDate: '2026-12-01',
  });
  assert.equal(sellable, 32);

  assert.equal(classifyExpiryStatus('2026-12-01', '2026-11-16'), 'Near Expiry (<= 30d)');
  assert.equal(classifyExpiryStatus('2026-11-10', '2026-11-16'), 'Expired');
  assert.equal(classifyExpiryStatus('', '2026-11-16'), 'Non-Perishable');

  const samplePo: PurchaseOrder = {
    id: 'po-1',
    poNumber: 'PO-2026-011',
    supplierId: 'sup-friesland',
    branchId: 'hyderabad',
    createdByUserId: PURCHASING_MGR.id,
    createdByName: PURCHASING_MGR.fullName,
    createdAt: '2026-11-15T10:00:00Z',
    expectedDeliveryDate: '2026-11-17',
    status: 'Partially Received',
    items: [
      {
        productId: SAMPLE_PRODUCT.id,
        orderedQty: 20,
        receivedQty: 18,
        damagedQty: 2,
        unitCost: 3720,
      },
    ],
    totalAmount: 74400,
  };

  assert.equal(
    evaluateThreeWayMatch(samplePo, [{ productId: SAMPLE_PRODUCT.id, acceptedQty: 18 }], 66960),
    'Quantity Variance'
  );
  assert.equal(
    evaluateThreeWayMatch(samplePo, [{ productId: SAMPLE_PRODUCT.id, acceptedQty: 18 }], 74400),
    'Amount Variance'
  );
});

test('Duplicate barcode or invalid cost validation rejects bad catalogue entries', () => {
  const errs = validateNewProductInput([SAMPLE_PRODUCT], {
    sku: 'MRH-DAI-101',
    barcode: '8961001011015',
    name: 'Test Item',
    sellingPrice: 100,
    purchaseCost: 120,
  });
  assert.ok(errs.sku);
  assert.ok(errs.barcode);
  assert.ok(errs.purchaseCost);
});
