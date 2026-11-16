import type {
  ApprovalRequest,
  AuditLogEntry,
  BranchChecklistItem,
  BranchStockRecord,
  BusinessExpense,
  CashierShift,
  CustomerServiceCase,
  ErpProduct,
  GoodsReceiptNote,
  LeaveRequestRecord,
  ManagementModuleId,
  OnlineFulfillmentOrder,
  PosSaleRecord,
  PriorityAlert,
  PromotionCampaign,
  PurchaseOrder,
  PurchaseRequisition,
  RoleDefinition,
  StaffAttendanceRecord,
  StaffRoleId,
  StaffUser,
  StockMovement,
  SupplierInvoiceRecord,
  SupplierRecord,
  SyncJobRecord,
} from '../../erp/types';
import type { BranchInfo } from '../../types/marhaba';

const TOKEN_STORAGE_KEY = 'marhaba_mgmt_bearer_token_v1';

export type RedactedErpProduct = Omit<ErpProduct, 'purchaseCost'> & {
  purchaseCost: number | null;
  marginPercent: number | null;
};

export interface ApprovalWithAuthority extends ApprovalRequest {
  authority: { allowed: boolean; reason?: string };
}

export interface FinanceSummary {
  posGrossSales: number;
  posDiscounts: number;
  posNetSales: number;
  onlineOrdersRevenue: number;
  totalRevenue: number;
  cashTenderTotal: number;
  cardTenderTotal: number;
  estimatedCogs: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  inventoryValuation: number;
  totalExpenses: number;
  unpaidPayables: number;
}

export interface ManagementBootstrapPayload {
  user: StaffUser;
  role: RoleDefinition;
  permittedModules: {
    id: ManagementModuleId;
    label: string;
    shortLabel: string;
    path: string;
    description: string;
  }[];
  branches: BranchInfo[];
  departments: { id: string; name: string }[];
  activeBranchScope: string;
  products: RedactedErpProduct[];
  stock: BranchStockRecord[];
  stockMovements: StockMovement[];
  suppliers: SupplierRecord[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  supplierInvoices: SupplierInvoiceRecord[];
  shifts: CashierShift[];
  posSales: PosSaleRecord[];
  onlineOrders: OnlineFulfillmentOrder[];
  promotions: PromotionCampaign[];
  expenses: BusinessExpense[];
  customerCases: CustomerServiceCase[];
  approvals: ApprovalWithAuthority[];
  checklists: BranchChecklistItem[];
  attendance: StaffAttendanceRecord[];
  leaveRequests: LeaveRequestRecord[];
  auditLogs: AuditLogEntry[];
  syncJobs: SyncJobRecord[];
  staffUsers: StaffUser[];
  roleDefinitions?: Record<StaffRoleId, RoleDefinition>;
  financeSummary: FinanceSummary | null;
  priorityAlerts: PriorityAlert[];
}

export function getStoredMgmtToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredMgmtToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function mgmtFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredMgmtToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    // non-json error
  }

  if (!res.ok) {
    const errMsg = typeof parsed.error === 'string' ? parsed.error : `Request failed (${res.status})`;
    const error = new Error(errMsg) as Error & {
      status?: number;
      data?: Record<string, unknown>;
    };
    error.status = res.status;
    error.data = parsed;
    throw error;
  }

  return parsed as unknown as T;
}

export const managementApi = {
  async login(identifier: string, pin: string) {
    const data = await mgmtFetch<{
      token: string;
      user: StaffUser;
      role: RoleDefinition;
    }>('/api/mgmt/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, pin }),
    });
    setStoredMgmtToken(data.token);
    return data;
  },

  async status() {
    return mgmtFetch<{ authenticated: boolean }>('/api/mgmt/auth/status');
  },

  async me() {
    return mgmtFetch<{ user: StaffUser; role: RoleDefinition }>('/api/mgmt/auth/me');
  },

  async logout() {
    try {
      await mgmtFetch('/api/mgmt/auth/logout', { method: 'POST' });
    } finally {
      setStoredMgmtToken(null);
    }
  },

  async bootstrap(branchId = 'all') {
    const qs = branchId && branchId !== 'all' ? `?branchId=${encodeURIComponent(branchId)}` : '';
    return mgmtFetch<ManagementBootstrapPayload>(`/api/mgmt/bootstrap${qs}`);
  },

  openShift(body: { branchId: string; registerId?: string; openingFloat: number }) {
    return mgmtFetch<{ shift: CashierShift }>('/api/mgmt/pos/shifts/open', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  closeShift(shiftId: string, declaredCash: number) {
    return mgmtFetch<{ shift: CashierShift }>(`/api/mgmt/pos/shifts/${shiftId}/close`, {
      method: 'POST',
      body: JSON.stringify({ declaredCash }),
    });
  },

  completePosSale(body: {
    shiftId: string;
    branchId: string;
    items: { productId: string; quantity: number; discountPercent: number }[];
    paymentMethod: 'Cash' | 'Card' | 'Split';
    cashReceived: number;
    cardAmount: number;
  }) {
    return mgmtFetch<{ sale: PosSaleRecord; shift: CashierShift }>('/api/mgmt/pos/sales', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  requestDiscountOverride(body: {
    branchId: string;
    sku: string;
    requestedDiscountPercent: number;
    reason: string;
    amountPkr: number;
  }) {
    return mgmtFetch<{ approval: ApprovalRequest }>('/api/mgmt/pos/discount-override-request', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  processPosReturn(receiptNumber: string, reason: string) {
    return mgmtFetch<{ sale: PosSaleRecord }>('/api/mgmt/pos/returns', {
      method: 'POST',
      body: JSON.stringify({ receiptNumber, reason }),
    });
  },

  createProduct(body: Record<string, unknown>) {
    return mgmtFetch<{ product: RedactedErpProduct }>('/api/mgmt/products', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateProduct(id: string, body: Record<string, unknown>) {
    return mgmtFetch<{ product: RedactedErpProduct }>(`/api/mgmt/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  createPromotion(body: Record<string, unknown>) {
    return mgmtFetch<{ promotion: PromotionCampaign }>('/api/mgmt/offers/promotions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  submitPriceRequest(body: { productId: string; proposedPrice: number; justification: string }) {
    return mgmtFetch<{ approval: ApprovalRequest }>('/api/mgmt/offers/price-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  transferStock(body: { productId: string; fromBranchId: string; toBranchId: string; quantity: number }) {
    return mgmtFetch<{ transferRef: string }>('/api/mgmt/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  adjustStock(body: { productId: string; branchId: string; delta: number; reason: string }) {
    return mgmtFetch<{ pendingApproval: boolean; message?: string }>(
      '/api/mgmt/inventory/adjustments',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  },

  createRequisition(body: Record<string, unknown>) {
    return mgmtFetch<{ requisition: PurchaseRequisition }>('/api/mgmt/purchasing/requisitions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createPurchaseOrder(body: Record<string, unknown>) {
    return mgmtFetch<{ purchaseOrder: PurchaseOrder }>('/api/mgmt/purchasing/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  postGrn(body: {
    poId: string;
    items: { productId: string; acceptedQty: number; damagedQty: number }[];
    discrepancyNote?: string;
  }) {
    return mgmtFetch<{ grn: GoodsReceiptNote; po: PurchaseOrder }>('/api/mgmt/purchasing/grn', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateOrderPick(
    orderId: string,
    body: { productId: string; pickedQty: number; flaggedMissing?: boolean; substituteNote?: string }
  ) {
    return mgmtFetch<{ order: OnlineFulfillmentOrder }>(`/api/mgmt/orders/${orderId}/pick`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  updateOrderStage(orderId: string, stage: string, packingVerified?: boolean) {
    return mgmtFetch<{ order: OnlineFulfillmentOrder }>(`/api/mgmt/orders/${orderId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, packingVerified }),
    });
  },

  reconcileShift(shiftId: string) {
    return mgmtFetch<{ shift: CashierShift }>('/api/mgmt/finance/reconcile-shift', {
      method: 'POST',
      body: JSON.stringify({ shiftId }),
    });
  },

  recordExpense(body: { branchId: string; category: string; description: string; amount: number }) {
    return mgmtFetch<{ expense: BusinessExpense }>('/api/mgmt/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  paySupplierInvoice(invoiceId: string) {
    return mgmtFetch<{ invoice: SupplierInvoiceRecord }>(`/api/mgmt/finance/invoices/${invoiceId}/pay`, {
      method: 'POST',
    });
  },

  submitLeave(body: { leaveType: string; startDate: string; days: number; reason: string }) {
    return mgmtFetch<{ leaveRequest: LeaveRequestRecord }>('/api/mgmt/staff/leave', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  decideLeave(id: string, status: 'Approved' | 'Rejected') {
    return mgmtFetch<{ leaveRequest: LeaveRequestRecord }>(`/api/mgmt/staff/leave/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  toggleChecklist(id: string) {
    return mgmtFetch<{ checklistItem: BranchChecklistItem }>(`/api/mgmt/branches/checklist/${id}`, {
      method: 'PATCH',
    });
  },

  createCustomerCase(body: Record<string, unknown>) {
    return mgmtFetch<{ customerCase: CustomerServiceCase }>('/api/mgmt/customers/cases', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateCustomerCase(id: string, body: { status?: string; requestRefundAmount?: number }) {
    return mgmtFetch<{ customerCase: CustomerServiceCase }>(`/api/mgmt/customers/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  decideApproval(id: string, decision: 'Approved' | 'Rejected', note: string) {
    return mgmtFetch<{ approval: ApprovalRequest }>(`/api/mgmt/approvals/${id}/decide`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    });
  },

  provisionStaffUser(body: Record<string, unknown>) {
    return mgmtFetch<{ staffUser: StaffUser }>('/api/mgmt/settings/users', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  updateStaffUserRole(id: string, body: { roleId?: StaffRoleId; active?: boolean; branchId?: string }) {
    return mgmtFetch<{ staffUser: StaffUser }>(`/api/mgmt/settings/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  runWebsiteSync() {
    return mgmtFetch<{ syncJobs: SyncJobRecord[] }>('/api/mgmt/settings/sync-retry', {
      method: 'POST',
    });
  },
};
