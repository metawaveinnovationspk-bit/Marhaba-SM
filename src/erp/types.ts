export type ManagementModuleId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchasing'
  | 'orders'
  | 'offers'
  | 'finance'
  | 'staff'
  | 'branches'
  | 'customers'
  | 'reports'
  | 'settings';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'submit'
  | 'verify'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'export'
  | 'administer';

export type StaffRoleId =
  | 'cashier'
  | 'senior_cashier'
  | 'pos_supervisor'
  | 'sales_assistant'
  | 'department_supervisor'
  | 'receiving_clerk'
  | 'stock_controller'
  | 'inventory_auditor'
  | 'inventory_manager'
  | 'purchasing_officer'
  | 'purchasing_manager'
  | 'accounts_payable'
  | 'accounts_manager'
  | 'internal_auditor'
  | 'hr_manager'
  | 'facilities_admin'
  | 'order_picker'
  | 'online_orders_manager'
  | 'customer_service'
  | 'branch_manager'
  | 'product_data_operator'
  | 'director_purchasing'
  | 'director_accounts'
  | 'director_admin'
  | 'director_mis'
  | 'ceo'
  | 'owner_partner';

export type RoleTier = 'frontline' | 'operational' | 'technical' | 'executive';

export interface RoleDefinition {
  id: StaffRoleId;
  label: string;
  tier: RoleTier;
  description: string;
  branchRestricted: boolean;
  canViewCostAndMargin: boolean;
  maxPosDiscountPercent: number;
  approvalLimitPkr: number;
  isReadOnlyAudit?: boolean;
  modules: Partial<Record<ManagementModuleId, PermissionAction[]>>;
}

export interface StaffUser {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  roleId: StaffRoleId;
  department: string;
  branchId: string; // 'all' for Head Office / CEO / Directors
  active: boolean;
  isPublishedLeadership?: boolean;
}

export interface SupplierRecord {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  city: string;
  paymentTermsDays: number;
  onTimeRatePercent: number;
  qualityScorePercent: number;
  status: 'Active' | 'On Hold';
}

export interface ErpProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  departmentId: string;
  departmentName: string;
  subcategory: string;
  supplierId: string;
  unitLabel: string;
  packConversion: number;
  purchaseCost: number;
  sellingPrice: number;
  originalPrice?: number;
  taxClass: 'Standard GST (Demo Configurable)' | 'Essential Exempt (Demo Configurable)';
  status: 'Active' | 'Pending Approval' | 'Discontinued';
  reorderPoint: number;
  dataTier: 'verified' | 'demonstration' | 'proposed';
}

export interface BranchStockRecord {
  productId: string;
  branchId: string;
  locationCode: string; // e.g. 'HYD-A04-S2'
  zone: 'Sales Floor' | 'Backroom Warehouse';
  onHand: number;
  floorQty: number;
  warehouseQty: number;
  reserved: number;
  damaged: number;
  inTransit: number;
  batchNumber: string;
  expiryDate: string; // ISO YYYY-MM-DD or '' for non-perishable
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  branchId: string;
  type:
    | 'GRN'
    | 'PUTAWAY_FLOOR'
    | 'POS_SALE'
    | 'ONLINE_RESERVE'
    | 'ONLINE_DISPATCH'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'ADJUSTMENT'
    | 'RETURN';
  quantityDelta: number;
  sourceLocation?: string;
  destinationLocation?: string;
  referenceId: string;
  actorName: string;
  reason: string;
}

export interface StockTransferRecord {
  id: string;
  transferRef: string;
  productId: string;
  productName: string;
  fromBranchId: string;
  toBranchId: string;
  dispatchedQty: number;
  receivedQty: number;
  damagedInTransitQty: number;
  status: 'In Transit' | 'Completed' | 'Completed with Variance';
  dispatchedByName: string;
  dispatchedAt: string;
  receivedByName?: string;
  receivedAt?: string;
  varianceNote?: string;
}

export interface CycleCountRecord {
  id: string;
  branchId: string;
  productId: string;
  productName: string;
  systemQty: number;
  physicalQty: number;
  variance: number;
  countedByName: string;
  countedAt: string;
  status: 'Matched' | 'Pending Approval' | 'Adjusted';
  notes: string;
}

export interface PurchaseRequisition {
  id: string;
  branchId: string;
  requestedByUserId: string;
  requestedByName: string;
  createdAt: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted to PO';
  supplierId: string;
  items: { productId: string; quantity: number; estimatedUnitCost: number }[];
  notes: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  branchId: string;
  requisitionId?: string;
  createdByUserId: string;
  createdByName: string;
  approvedByName?: string;
  createdAt: string;
  expectedDeliveryDate: string;
  status: 'Pending Approval' | 'Approved' | 'Partially Received' | 'Received' | 'Cancelled';
  items: {
    productId: string;
    orderedQty: number;
    receivedQty: number;
    damagedQty: number;
    unitCost: number;
  }[];
  totalAmount: number;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  branchId: string;
  receivedByName: string;
  receivedAt: string;
  items: {
    productId: string;
    orderedQty: number;
    acceptedQty: number;
    damagedQty: number;
  }[];
  discrepancyNote?: string;
}

export interface SupplierInvoiceRecord {
  id: string;
  invoiceNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  branchId: string;
  billedAmount: number;
  grnAcceptedAmount: number;
  threeWayMatchStatus: 'Matched' | 'Quantity Variance' | 'Amount Variance' | 'Awaiting GRN';
  paymentStatus: 'Unpaid' | 'Prepared (Pending Release)' | 'Paid';
  preparedByName?: string;
  approvedByName?: string;
  dueDate: string;
  paidAt?: string;
}

export interface BankSettlementRecord {
  id: string;
  batchRef: string;
  branchId: string;
  date: string;
  posCardExpected: number;
  bankSettledAmount: number;
  variance: number;
  status: 'Matched' | 'Pending Review' | 'Variance Flagged';
  reconciledByName?: string;
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  registerId: string;
  branchId: string;
  cashierUserId: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  refundsTotal: number;
  expectedCash: number;
  declaredCash?: number;
  variance?: number;
  status: 'Open' | 'Pending Reconciliation' | 'Closed';
  reconciledByName?: string;
}

export interface PosSaleLine {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface PosSaleRecord {
  id: string;
  receiptNumber: string;
  shiftId: string;
  branchId: string;
  cashierUserId: string;
  cashierName: string;
  createdAt: string;
  items: PosSaleLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Split';
  cashReceived: number;
  cardAmount: number;
  changeDue: number;
  status: 'Completed' | 'Returned' | 'Partial Return';
  supervisorOverrideId?: string;
}

export type OnlineFulfillmentStage =
  | 'Placed'
  | 'Confirmed'
  | 'Picking'
  | 'Packed'
  | 'Ready for Pickup'
  | 'Dispatched'
  | 'Completed'
  | 'Cancelled'
  | 'Exception';

export interface OnlineOrderLine {
  productId: string;
  sku: string;
  name: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number;
  locationCode: string;
  pickedQty: number;
  flaggedMissing: boolean;
  substituteNote?: string;
}

export interface OnlineFulfillmentOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  addressSummary: string;
  paymentMethod: 'cod' | 'card-counter';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  stage: OnlineFulfillmentStage;
  reservationStatus: 'Reserved' | 'Released' | 'Deducted';
  packingVerified: boolean;
  assignedPickerName?: string;
  items: OnlineOrderLine[];
  totalAmount: number;
  exceptionReason?: string;
}

export interface PromotionCampaign {
  id: string;
  title: string;
  discountPercent: number;
  departmentId: string;
  branchScope: string; // 'all' or branchId
  startDate: string;
  endDate: string;
  status: 'Active' | 'Scheduled' | 'Pending Approval' | 'Ended';
  createdByName: string;
}

export interface BusinessExpense {
  id: string;
  branchId: string;
  category: 'Utilities' | 'Store Maintenance' | 'Logistics' | 'Packaging Supplies' | 'Staff Welfare';
  description: string;
  amount: number;
  date: string;
  recordedByName: string;
  status: 'Recorded' | 'Pending Approval' | 'Approved';
}

export interface CustomerServiceCase {
  id: string;
  caseNumber: string;
  customerName: string;
  maskedPhone: string;
  branchId: string;
  orderNumber?: string;
  category: 'Inquiry' | 'Complaint' | 'Return & Exchange' | 'Order Assistance';
  priority: 'Normal' | 'High';
  status: 'Open' | 'In Review' | 'Resolved';
  assignedTo: string;
  notes: string;
  refundDisposition?: 'Restock Sellable' | 'Damaged Quarantine';
  createdAt: string;
}

export type ApprovalType =
  | 'PRICE_CHANGE'
  | 'POS_DISCOUNT_OVERRIDE'
  | 'PURCHASE_ORDER'
  | 'STOCK_WRITE_OFF'
  | 'REFUND_REQUEST'
  | 'SUPPLIER_PAYMENT';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  branchId: string;
  requestedByUserId: string;
  requestedByName: string;
  requestedAt: string;
  amountPkr: number;
  previousValue: string;
  proposedValue: string;
  justification: string;
  referenceId?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  decidedByUserId?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface BranchChecklistItem {
  id: string;
  branchId: string;
  shiftType: 'Opening' | 'Closing';
  task: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface MaintenanceTicket {
  id: string;
  branchId: string;
  equipment: string;
  issue: string;
  priority: 'Normal' | 'Urgent';
  reportedByName: string;
  assignedToName: string;
  status: 'Open' | 'In Progress' | 'Verified Resolved';
  createdAt: string;
}

export interface StaffAttendanceRecord {
  id: string;
  userId: string;
  employeeCode: string;
  fullName: string;
  roleLabel: string;
  branchId: string;
  shiftWindow: string;
  status: 'On Shift' | 'Scheduled' | 'Completed' | 'Leave Approved';
}

export interface LeaveRequestRecord {
  id: string;
  userId: string;
  employeeName: string;
  branchId: string;
  leaveType: 'Casual' | 'Annual' | 'Medical';
  startDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  branchId: string;
  module: ManagementModuleId | 'auth' | 'sync';
  action: string;
  target: string;
  outcome: 'Success' | 'Denied';
  detail: string;
}

export interface SyncJobRecord {
  id: string;
  channel:
    | 'Website Catalogue Sync'
    | 'Website Pricing Feed'
    | 'Online Orders Intake'
    | 'Inventory Availability Feed';
  lastRunAt: string;
  status: 'Healthy' | 'Attention Required';
  recordsSynced: number;
  detail: string;
}

export interface PriorityAlert {
  id: string;
  priority: 'high' | 'medium' | 'low';
  module: ManagementModuleId;
  title: string;
  detail: string;
  branchId: string;
}
