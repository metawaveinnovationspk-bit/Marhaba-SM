import { PRODUCTS, SHOP_DEPARTMENTS, VERIFIED_BRANCHES } from '../data/marhabaData';
import type {
  ApprovalRequest,
  AuditLogEntry,
  BankSettlementRecord,
  BranchChecklistItem,
  BranchStockRecord,
  BusinessExpense,
  CashierShift,
  CustomerServiceCase,
  CycleCountRecord,
  ErpProduct,
  GoodsReceiptNote,
  LeaveRequestRecord,
  MaintenanceTicket,
  OnlineFulfillmentOrder,
  PosSaleRecord,
  PromotionCampaign,
  PurchaseOrder,
  PurchaseRequisition,
  StaffAttendanceRecord,
  StaffUser,
  StockMovement,
  StockTransferRecord,
  SupplierInvoiceRecord,
  SupplierRecord,
  SyncJobRecord,
} from './types';

export interface StaffCredentialSeed extends StaffUser {
  demoPin: string; // Demo login password clearly documented as non-production demo
}

export const INITIAL_STAFF_USERS: StaffCredentialSeed[] = [
  // FRONTLINE SALES & FLOOR
  {
    id: 'usr-cashier-hyd',
    employeeCode: 'MRH-EMP-042',
    fullName: 'Usman Tariq',
    email: 'cashier.hyd@marhaba.demo',
    roleId: 'cashier',
    department: 'Checkout Operations',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-senior-cashier-hyd',
    employeeCode: 'MRH-EMP-038',
    fullName: 'Bilquis Javed (Demo)',
    email: 'senior.cashier@marhaba.demo',
    roleId: 'senior_cashier',
    department: 'Checkout Operations',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-pos-sup-hyd',
    employeeCode: 'MRH-EMP-019',
    fullName: 'Kamran Siddiqui',
    email: 'pos.sup@marhaba.demo',
    roleId: 'pos_supervisor',
    department: 'Checkout Operations',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-sales-asst-hyd',
    employeeCode: 'MRH-EMP-071',
    fullName: 'Fahad Memon (Demo)',
    email: 'sales.assistant@marhaba.demo',
    roleId: 'sales_assistant',
    department: 'Grocery & Dairy Floor',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-dept-sup-hyd',
    employeeCode: 'MRH-EMP-031',
    fullName: 'Zainab Soomro',
    email: 'dept.sup@marhaba.demo',
    roleId: 'department_supervisor',
    department: 'Grocery & Dairy Floor',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-rec-clerk',
    employeeCode: 'MRH-EMP-056',
    fullName: 'Imran Qazi',
    email: 'receiving@marhaba.demo',
    roleId: 'receiving_clerk',
    department: 'Backroom & Receiving',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-order-picker',
    employeeCode: 'MRH-EMP-066',
    fullName: 'Saqib Brohi (Demo)',
    email: 'picker.hyd@marhaba.demo',
    roleId: 'order_picker',
    department: 'E-Commerce Fulfillment',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-cs-hyd',
    employeeCode: 'MRH-EMP-063',
    fullName: 'Ayesha Ansari',
    email: 'support@marhaba.demo',
    roleId: 'customer_service',
    department: 'Customer Care',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-facilities-hyd',
    employeeCode: 'MRH-EMP-078',
    fullName: 'Naveed Arain (Demo)',
    email: 'maintenance@marhaba.demo',
    roleId: 'facilities_admin',
    department: 'Branch Administration & Maintenance',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },

  // OPERATIONAL MANAGEMENT
  {
    id: 'usr-stock-ctrl-hyd',
    employeeCode: 'MRH-EMP-049',
    fullName: 'Tariq Jamali (Demo)',
    email: 'stock.controller@marhaba.demo',
    roleId: 'stock_controller',
    department: 'Inventory & Warehouse',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-inv-auditor',
    employeeCode: 'MRH-AUD-002',
    fullName: 'Farhan Raza (Demo)',
    email: 'inv.auditor@marhaba.demo',
    roleId: 'inventory_auditor',
    department: 'Inventory Audit',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-inv-mgr',
    employeeCode: 'MRH-MGR-008',
    fullName: 'Adnan Sheikh',
    email: 'inventory@marhaba.demo',
    roleId: 'inventory_manager',
    department: 'Inventory & Warehouse',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-purch-off',
    employeeCode: 'MRH-EMP-024',
    fullName: 'Danish Ali (Demo)',
    email: 'buyer@marhaba.demo',
    roleId: 'purchasing_officer',
    department: 'Procurement & Vendors',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-purch-mgr',
    employeeCode: 'MRH-MGR-005',
    fullName: 'Sanaullah Qureshi',
    email: 'purchasing@marhaba.demo',
    roleId: 'purchasing_manager',
    department: 'Procurement & Vendors',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-ap-officer',
    employeeCode: 'MRH-EMP-029',
    fullName: 'Rabia Siddiqui (Demo)',
    email: 'ap@marhaba.demo',
    roleId: 'accounts_payable',
    department: 'Accounts & Finance',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-acc-mgr',
    employeeCode: 'MRH-MGR-004',
    fullName: 'Hina Lakhani',
    email: 'accounts@marhaba.demo',
    roleId: 'accounts_manager',
    department: 'Accounts & Finance',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-hr-mgr',
    employeeCode: 'MRH-MGR-007',
    fullName: 'Sadia Khalid (Demo)',
    email: 'hr@marhaba.demo',
    roleId: 'hr_manager',
    department: 'Human Resources',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-orders-mgr',
    employeeCode: 'MRH-MGR-009',
    fullName: 'Bilal Rajput',
    email: 'orders@marhaba.demo',
    roleId: 'online_orders_manager',
    department: 'E-Commerce Fulfillment',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-branch-hyd',
    employeeCode: 'MRH-MGR-002',
    fullName: 'Faisal Talpur',
    email: 'branch.hyd@marhaba.demo',
    roleId: 'branch_manager',
    department: 'Branch Management',
    branchId: 'hyderabad',
    active: true,
    demoPin: 'demo1234',
  },

  // TECHNICAL & MIS
  {
    id: 'usr-data-op',
    employeeCode: 'MRH-TEC-011',
    fullName: 'hamza_catalog (Demo)',
    email: 'catalog@marhaba.demo',
    roleId: 'product_data_operator',
    department: 'MIS & Product Data',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-dir-mis',
    employeeCode: 'MRH-DIR-005',
    fullName: 'Shahzad Ahmed Memon',
    email: 'shahzad.mis@marhaba.demo',
    roleId: 'director_mis',
    department: 'Management Information Systems',
    branchId: 'all',
    active: true,
    isPublishedLeadership: true,
    demoPin: 'demo1234',
  },

  // EXECUTIVE BOARD & INTERNAL AUDIT
  {
    id: 'usr-int-auditor',
    employeeCode: 'MRH-AUD-001',
    fullName: 'Kamaluddin Shaikh (Demo)',
    email: 'audit@marhaba.demo',
    roleId: 'internal_auditor',
    department: 'Internal Audit & Compliance',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-dir-purch',
    employeeCode: 'MRH-DIR-004',
    fullName: 'Faraz Ahmed Memon',
    email: 'faraz.purchasing@marhaba.demo',
    roleId: 'director_purchasing',
    department: 'Purchasing Directorate',
    branchId: 'all',
    active: true,
    isPublishedLeadership: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-dir-acc',
    employeeCode: 'MRH-DIR-003',
    fullName: 'Sheeraz Ahmed Memon',
    email: 'sheeraz.accounts@marhaba.demo',
    roleId: 'director_accounts',
    department: 'Accounts Directorate',
    branchId: 'all',
    active: true,
    isPublishedLeadership: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-dir-admin',
    employeeCode: 'MRH-DIR-002',
    fullName: 'Dr. Niaz Ahmed Memon',
    email: 'niaz.admin@marhaba.demo',
    roleId: 'director_admin',
    department: 'Administration Directorate',
    branchId: 'all',
    active: true,
    isPublishedLeadership: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-ceo',
    employeeCode: 'MRH-DIR-001',
    fullName: 'Riaz Ahmed Memon',
    email: 'riaz.ceo@marhaba.demo',
    roleId: 'ceo',
    department: 'Chief Executive Office',
    branchId: 'all',
    active: true,
    isPublishedLeadership: true,
    demoPin: 'demo1234',
  },
  {
    id: 'usr-owner-partner',
    employeeCode: 'MRH-OWN-002',
    fullName: 'Board Partner Representative (Demo)',
    email: 'partner@marhaba.demo',
    roleId: 'owner_partner',
    department: 'Ownership & Governance',
    branchId: 'all',
    active: true,
    demoPin: 'demo1234',
  },
];

export const INITIAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: 'sup-friesland',
    name: 'FrieslandCampina Engro Foods Pakistan (Demo)',
    code: 'SUP-001',
    contactPerson: 'Rashid Mehmood',
    phone: '0300-2114401',
    city: 'Karachi',
    paymentTermsDays: 21,
    onTimeRatePercent: 96,
    qualityScorePercent: 98,
    status: 'Active',
  },
  {
    id: 'sup-nestle-pk',
    name: 'Nestlé Pakistan Distribution South (Demo)',
    code: 'SUP-002',
    contactPerson: 'Salman Zubairi',
    phone: '0321-8223309',
    city: 'Karachi',
    paymentTermsDays: 15,
    onTimeRatePercent: 98,
    qualityScorePercent: 94,
    status: 'Active',
  },
  {
    id: 'sup-sindh-mills',
    name: 'Indus Basin Grain & Pulses Mills (Demo)',
    code: 'SUP-003',
    contactPerson: 'Haji Altaf',
    phone: '0333-2601188',
    city: 'Hyderabad',
    paymentTermsDays: 30,
    onTimeRatePercent: 91,
    qualityScorePercent: 95,
    status: 'Active',
  },
  {
    id: 'sup-fmcg-dist',
    name: 'United Household & Beverage Distributors (Demo)',
    code: 'SUP-004',
    contactPerson: 'Waqar Baig',
    phone: '0345-2049912',
    city: 'Hyderabad',
    paymentTermsDays: 14,
    onTimeRatePercent: 89,
    qualityScorePercent: 92,
    status: 'Active',
  },
];

function buildErpProducts(): ErpProduct[] {
  const deptNameMap = new Map(SHOP_DEPARTMENTS.map((d) => [d.id, d.name]));
  return PRODUCTS.map((p, index) => {
    const barcodeNum = String(8961001011000 + index * 17);
    const supplierId =
      p.brand.includes("Olper")
        ? 'sup-friesland'
        : p.brand.includes('Nestlé')
        ? 'sup-nestle-pk'
        : p.departmentId === 'grocery-pantry'
        ? 'sup-sindh-mills'
        : 'sup-fmcg-dist';

    const marginRatio = p.departmentId === 'grocery-pantry' || p.departmentId === 'dairy-bakery' ? 0.89 : 0.78;
    const purchaseCost = Math.max(10, Math.round(p.price * marginRatio));

    return {
      id: p.id,
      sku: p.sku,
      barcode: barcodeNum,
      name: p.name,
      brand: p.brand,
      departmentId: p.departmentId,
      departmentName: deptNameMap.get(p.departmentId) || 'Supermarket',
      subcategory: p.subcategory,
      supplierId,
      unitLabel: p.unitLabel,
      packConversion: p.id.includes('carton') ? 12 : p.id.includes('6') ? 6 : 1,
      purchaseCost,
      sellingPrice: p.price,
      originalPrice: p.originalPrice,
      taxClass:
        p.departmentId === 'fresh-food' || p.departmentId === 'grocery-pantry'
          ? 'Essential Exempt (Demo Configurable)'
          : 'Standard GST (Demo Configurable)',
      status: 'Active',
      reorderPoint: index % 4 === 0 ? 18 : 12,
      dataTier: p.dataTier,
    };
  });
}

function buildBranchStock(erpProducts: ErpProduct[]): BranchStockRecord[] {
  const records: BranchStockRecord[] = [];
  VERIFIED_BRANCHES.forEach((branch, bIdx) => {
    erpProducts.forEach((prod, pIdx) => {
      const isOutOfStock = prod.id === 'rose-petal-lip-tint';
      const lowItem =
        (bIdx === 0 && (pIdx === 1 || pIdx === 6)) ||
        (bIdx === 1 && pIdx === 4);
      const baseOnHand = isOutOfStock ? 0 : lowItem ? 7 : 28 + ((pIdx * 5 + bIdx * 9) % 45);
      const floorQty = Math.min(baseOnHand, Math.max(0, Math.round(baseOnHand * 0.45)));
      const warehouseQty = Math.max(0, baseOnHand - floorQty);
      const isPerishable =
        prod.departmentId === 'dairy-bakery' ||
        prod.departmentId === 'fresh-food' ||
        prod.departmentId === 'frozen-chilled';

      const expiryDate = !isPerishable
        ? ''
        : pIdx === 1 && bIdx === 0
        ? '2026-12-03'
        : pIdx === 10 && bIdx === 0
        ? '2026-11-22'
        : '2027-04-15';

      records.push({
        productId: prod.id,
        branchId: branch.id,
        locationCode: `${branch.id === 'hyderabad' ? 'HYD' : branch.id === 'karachi-p10' ? 'K10' : 'KP2'}-A${String(
          (pIdx % 9) + 1
        ).padStart(2, '0')}`,
        zone: floorQty > 0 ? 'Sales Floor' : 'Backroom Warehouse',
        onHand: baseOnHand,
        floorQty,
        warehouseQty,
        reserved: pIdx === 0 && bIdx === 0 ? 2 : 0,
        damaged: pIdx === 3 && bIdx === 0 ? 2 : 0,
        inTransit: bIdx === 1 && pIdx === 4 ? 15 : 0,
        batchNumber: `B-2611-${String(100 + pIdx)}`,
        expiryDate,
      });
    });
  });
  return records;
}

export interface ErpDatabaseState {
  staffUsers: StaffCredentialSeed[];
  suppliers: SupplierRecord[];
  products: ErpProduct[];
  stock: BranchStockRecord[];
  stockMovements: StockMovement[];
  stockTransfers: StockTransferRecord[];
  cycleCounts: CycleCountRecord[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  supplierInvoices: SupplierInvoiceRecord[];
  bankSettlements: BankSettlementRecord[];
  shifts: CashierShift[];
  posSales: PosSaleRecord[];
  onlineOrders: OnlineFulfillmentOrder[];
  promotions: PromotionCampaign[];
  expenses: BusinessExpense[];
  customerCases: CustomerServiceCase[];
  approvals: ApprovalRequest[];
  checklists: BranchChecklistItem[];
  maintenanceTickets: MaintenanceTicket[];
  attendance: StaffAttendanceRecord[];
  leaveRequests: LeaveRequestRecord[];
  auditLogs: AuditLogEntry[];
  syncJobs: SyncJobRecord[];
}

export function createInitialErpDatabase(): ErpDatabaseState {
  const products = buildErpProducts();
  const stock = buildBranchStock(products);

  const shifts: CashierShift[] = [
    {
      id: 'shf-hyd-01',
      shiftNumber: 'SHF-HYD-20261116-01',
      registerId: 'REG-HYD-01',
      branchId: 'hyderabad',
      cashierUserId: 'usr-cashier-hyd',
      cashierName: 'Usman Tariq',
      openedAt: '2026-11-16T05:00:00Z',
      openingFloat: 15000,
      cashSalesTotal: 8880,
      cardSalesTotal: 4180,
      refundsTotal: 0,
      expectedCash: 23880,
      status: 'Open',
    },
    {
      id: 'shf-k10-01',
      shiftNumber: 'SHF-K10-20261115-02',
      registerId: 'REG-K10-01',
      branchId: 'karachi-p10',
      cashierUserId: 'usr-pos-sup-hyd',
      cashierName: 'Tariq Mehmood (Demo)',
      openedAt: '2026-11-15T05:00:00Z',
      closedAt: '2026-11-15T17:00:00Z',
      openingFloat: 15000,
      cashSalesTotal: 33440,
      cardSalesTotal: 19800,
      refundsTotal: 0,
      expectedCash: 48440,
      declaredCash: 47990,
      variance: -450,
      status: 'Pending Reconciliation',
    },
  ];

  const posSales: PosSaleRecord[] = [
    {
      id: 'sale-1001',
      receiptNumber: 'RCP-HYD-1001',
      shiftId: 'shf-hyd-01',
      branchId: 'hyderabad',
      cashierUserId: 'usr-cashier-hyd',
      cashierName: 'Usman Tariq',
      createdAt: '2026-11-16T06:20:00Z',
      items: [
        {
          productId: products[0].id,
          sku: products[0].sku,
          barcode: products[0].barcode,
          name: products[0].name,
          unitLabel: products[0].unitLabel,
          quantity: 1,
          unitPrice: products[0].sellingPrice,
          discountPercent: 0,
          lineTotal: products[0].sellingPrice,
        },
      ],
      subtotal: 4180,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 4180,
      paymentMethod: 'Card',
      cashReceived: 0,
      cardAmount: 4180,
      changeDue: 0,
      status: 'Completed',
    },
    {
      id: 'sale-1002',
      receiptNumber: 'RCP-HYD-1002',
      shiftId: 'shf-hyd-01',
      branchId: 'hyderabad',
      cashierUserId: 'usr-cashier-hyd',
      cashierName: 'Usman Tariq',
      createdAt: '2026-11-16T08:45:00Z',
      items: [
        {
          productId: products[8].id,
          sku: products[8].sku,
          barcode: products[8].barcode,
          name: products[8].name,
          unitLabel: products[8].unitLabel,
          quantity: 4,
          unitPrice: products[8].sellingPrice,
          discountPercent: 0,
          lineTotal: 6720,
        },
        {
          productId: products[7].id,
          sku: products[7].sku,
          barcode: products[7].barcode,
          name: products[7].name,
          unitLabel: products[7].unitLabel,
          quantity: 4,
          unitPrice: products[7].sellingPrice,
          discountPercent: 0,
          lineTotal: 2160,
        },
      ],
      subtotal: 8880,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 8880,
      paymentMethod: 'Cash',
      cashReceived: 9000,
      cardAmount: 0,
      changeDue: 120,
      status: 'Completed',
    },
    {
      id: 'sale-1003',
      receiptNumber: 'RCP-K10-1003',
      shiftId: 'shf-k10-01',
      branchId: 'karachi-p10',
      cashierUserId: 'usr-pos-sup-hyd',
      cashierName: 'Tariq Mehmood (Demo)',
      createdAt: '2026-11-15T14:15:00Z',
      items: [
        {
          productId: products[0].id,
          sku: products[0].sku,
          barcode: products[0].barcode,
          name: products[0].name,
          unitLabel: products[0].unitLabel,
          quantity: 8,
          unitPrice: products[0].sellingPrice,
          discountPercent: 0,
          lineTotal: 33440,
        },
      ],
      subtotal: 33440,
      discountAmount: 0,
      taxAmount: 0,
      grandTotal: 33440,
      paymentMethod: 'Cash',
      cashReceived: 34000,
      cardAmount: 0,
      changeDue: 560,
      status: 'Completed',
    },
  ];

  const stockTransfers: StockTransferRecord[] = [
    {
      id: 'trf-901',
      transferRef: 'TRF-2026-901',
      productId: products[4].id,
      productName: products[4].name,
      fromBranchId: 'hyderabad',
      toBranchId: 'karachi-p10',
      dispatchedQty: 15,
      receivedQty: 0,
      damagedInTransitQty: 0,
      status: 'In Transit',
      dispatchedByName: 'Adnan Sheikh',
      dispatchedAt: '2026-11-16T06:00:00Z',
    },
  ];

  const cycleCounts: CycleCountRecord[] = [
    {
      id: 'cnt-301',
      branchId: 'hyderabad',
      productId: products[3].id,
      productName: products[3].name,
      systemQty: 32,
      physicalQty: 30,
      variance: -2,
      countedByName: 'Tariq Jamali (Demo)',
      countedAt: '2026-11-16T07:20:00Z',
      status: 'Pending Approval',
      notes: '2 cartons dented during overnight aisle restock.',
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-2026-014',
      poNumber: 'PO-2026-014',
      supplierId: 'sup-friesland',
      branchId: 'hyderabad',
      createdByUserId: 'usr-purch-mgr',
      createdByName: 'Sanaullah Qureshi',
      approvedByName: 'Faraz Ahmed Memon',
      createdAt: '2026-11-14T09:00:00Z',
      expectedDeliveryDate: '2026-11-17',
      status: 'Approved',
      items: [
        {
          productId: products[0].id,
          orderedQty: 30,
          receivedQty: 0,
          damagedQty: 0,
          unitCost: products[0].purchaseCost,
        },
      ],
      totalAmount: 30 * products[0].purchaseCost,
    },
    {
      id: 'po-2026-015',
      poNumber: 'PO-2026-015',
      supplierId: 'sup-nestle-pk',
      branchId: 'hyderabad',
      createdByUserId: 'usr-purch-mgr',
      createdByName: 'Sanaullah Qureshi',
      approvedByName: 'Faraz Ahmed Memon',
      createdAt: '2026-11-15T11:30:00Z',
      expectedDeliveryDate: '2026-11-16',
      status: 'Partially Received',
      items: [
        {
          productId: products[1].id,
          orderedQty: 40,
          receivedQty: 34,
          damagedQty: 2,
          unitCost: products[1].purchaseCost,
        },
      ],
      totalAmount: 40 * products[1].purchaseCost,
    },
  ];

  const requisitions: PurchaseRequisition[] = [
    {
      id: 'PR-2026-031',
      branchId: 'hyderabad',
      requestedByUserId: 'usr-inv-mgr',
      requestedByName: 'Adnan Sheikh',
      createdAt: '2026-11-16T07:10:00Z',
      status: 'Approved',
      supplierId: 'sup-fmcg-dist',
      items: [
        { productId: products[6].id, quantity: 48, estimatedUnitCost: products[6].purchaseCost },
      ],
      notes: 'Beverage shelf alert at Qasim Chowk below reorder threshold — ready to convert to PO.',
    },
  ];

  const goodsReceipts: GoodsReceiptNote[] = [
    {
      id: 'grn-001',
      grnNumber: 'GRN-HYD-2026-019',
      poId: 'po-2026-015',
      poNumber: 'PO-2026-015',
      branchId: 'hyderabad',
      receivedByName: 'Imran Qazi',
      receivedAt: '2026-11-16T08:05:00Z',
      items: [
        {
          productId: products[1].id,
          orderedQty: 40,
          acceptedQty: 34,
          damagedQty: 2,
        },
      ],
      discrepancyNote: '4 units short-shipped, 2 torn foil pouches moved to quarantine.',
    },
  ];

  const supplierInvoices: SupplierInvoiceRecord[] = [
    {
      id: 'inv-sup-101',
      invoiceNumber: 'INV-NST-8841',
      poId: 'po-2026-015',
      poNumber: 'PO-2026-015',
      supplierId: 'sup-nestle-pk',
      branchId: 'hyderabad',
      billedAmount: 40 * products[1].purchaseCost,
      grnAcceptedAmount: 34 * products[1].purchaseCost,
      threeWayMatchStatus: 'Amount Variance',
      paymentStatus: 'Unpaid',
      dueDate: '2026-11-30',
    },
    {
      id: 'inv-sup-102',
      invoiceNumber: 'INV-SDG-4410',
      poId: 'po-2026-014',
      poNumber: 'PO-2026-014',
      supplierId: 'sup-friesland',
      branchId: 'hyderabad',
      billedAmount: 30 * products[0].purchaseCost,
      grnAcceptedAmount: 0,
      threeWayMatchStatus: 'Awaiting GRN',
      paymentStatus: 'Unpaid',
      dueDate: '2026-12-05',
    },
  ];

  const bankSettlements: BankSettlementRecord[] = [
    {
      id: 'bnk-hyd-01',
      batchRef: 'BNK-HYD-20261116',
      branchId: 'hyderabad',
      date: '2026-11-16',
      posCardExpected: 4180,
      bankSettledAmount: 4180,
      variance: 0,
      status: 'Matched',
      reconciledByName: 'Hina Lakhani',
    },
    {
      id: 'bnk-k10-01',
      batchRef: 'BNK-K10-20261115',
      branchId: 'karachi-p10',
      date: '2026-11-15',
      posCardExpected: 19800,
      bankSettledAmount: 19550,
      variance: -250,
      status: 'Pending Review',
    },
  ];

  const onlineOrders: OnlineFulfillmentOrder[] = [
    {
      id: 'ord-web-901',
      orderNumber: 'MRH-WEB-90412',
      createdAt: '2026-11-16T09:12:00Z',
      branchId: 'hyderabad',
      customerName: 'Nadia Hussain (Demo)',
      customerPhone: '0300-XXXX891',
      fulfillmentMethod: 'delivery',
      addressSummary: 'Flat 3B, Phase 2 Qasimabad, Hyderabad',
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      stage: 'Confirmed',
      reservationStatus: 'Reserved',
      packingVerified: false,
      items: [
        {
          productId: products[0].id,
          sku: products[0].sku,
          name: products[0].name,
          unitLabel: products[0].unitLabel,
          quantity: 2,
          unitPrice: products[0].sellingPrice,
          locationCode: 'HYD-A01',
          pickedQty: 0,
          flaggedMissing: false,
        },
        {
          productId: products[2].id,
          sku: products[2].sku,
          name: products[2].name,
          unitLabel: products[2].unitLabel,
          quantity: 3,
          unitPrice: products[2].sellingPrice,
          locationCode: 'HYD-A03',
          pickedQty: 0,
          flaggedMissing: false,
        },
      ],
      totalAmount: 2 * products[0].sellingPrice + 3 * products[2].sellingPrice,
    },
    {
      id: 'ord-web-902',
      orderNumber: 'MRH-WEB-90408',
      createdAt: '2026-11-16T07:50:00Z',
      branchId: 'karachi-p10',
      customerName: 'Saad Mirza (Demo)',
      customerPhone: '0321-XXXX412',
      fulfillmentMethod: 'pickup',
      addressSummary: 'Store Pickup Counter — Precinct 10-A',
      paymentMethod: 'card-counter',
      paymentStatus: 'Paid',
      stage: 'Ready for Pickup',
      reservationStatus: 'Reserved',
      packingVerified: true,
      assignedPickerName: 'Bilal Rajput',
      items: [
        {
          productId: products[8].id,
          sku: products[8].sku,
          name: products[8].name,
          unitLabel: products[8].unitLabel,
          quantity: 1,
          unitPrice: products[8].sellingPrice,
          locationCode: 'K10-A09',
          pickedQty: 1,
          flaggedMissing: false,
        },
      ],
      totalAmount: products[8].sellingPrice,
    },
  ];

  const promotions: PromotionCampaign[] = [
    {
      id: 'promo-1',
      title: 'Monthly Household Staples Value Event (Demo)',
      discountPercent: 8,
      departmentId: 'grocery-pantry',
      branchScope: 'all',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      status: 'Active',
      createdByName: 'Faraz Ahmed Memon',
    },
    {
      id: 'promo-2',
      title: 'Weekend Family Beverage Pack Offer (Demo)',
      discountPercent: 10,
      departmentId: 'beverages',
      branchScope: 'hyderabad',
      startDate: '2026-11-20',
      endDate: '2026-11-23',
      status: 'Scheduled',
      createdByName: 'Faisal Talpur',
    },
  ];

  const expenses: BusinessExpense[] = [
    {
      id: 'exp-1',
      branchId: 'hyderabad',
      category: 'Utilities',
      description: 'Cold-chain chiller electricity & backup fuel (Demo)',
      amount: 42500,
      date: '2026-11-15',
      recordedByName: 'Faisal Talpur',
      status: 'Approved',
    },
    {
      id: 'exp-2',
      branchId: 'karachi-p10',
      category: 'Packaging Supplies',
      description: 'Thermal receipt rolls & kraft carrier bags (Demo)',
      amount: 14800,
      date: '2026-11-16',
      recordedByName: 'Hina Lakhani',
      status: 'Recorded',
    },
  ];

  const customerCases: CustomerServiceCase[] = [
    {
      id: 'case-1',
      caseNumber: 'CS-2026-409',
      customerName: 'Nadia Hussain (Demo)',
      maskedPhone: '0300-***-891',
      branchId: 'hyderabad',
      orderNumber: 'MRH-WEB-90412',
      category: 'Order Assistance',
      priority: 'High',
      status: 'In Review',
      assignedTo: 'Ayesha Ansari',
      notes: 'Requested evening delivery slot after 6:00 PM at Qasimabad.',
      createdAt: '2026-11-16T09:20:00Z',
    },
  ];

  const approvals: ApprovalRequest[] = [
    {
      id: 'apr-price-201',
      type: 'PRICE_CHANGE',
      title: 'Price Adjustment: Dalda Fortified Cooking Oil 3L (Demo)',
      branchId: 'hyderabad',
      requestedByUserId: 'usr-data-op',
      requestedByName: 'hamza_catalog (Demo)',
      requestedAt: '2026-11-16T08:15:00Z',
      amountPkr: 1640,
      previousValue: 'PKR 1,680',
      proposedValue: 'PKR 1,640',
      justification: 'Align shelf promo pricing with supplier November wholesale rebate.',
      referenceId: products[8].id,
      status: 'Pending',
    },
    {
      id: 'apr-po-202',
      type: 'PURCHASE_ORDER',
      title: 'Bulk Beverage Replenishment PO — Hyderabad (Demo)',
      branchId: 'hyderabad',
      requestedByUserId: 'usr-purch-mgr',
      requestedByName: 'Sanaullah Qureshi',
      requestedAt: '2026-11-16T07:30:00Z',
      amountPkr: 142000,
      previousValue: 'Draft PR-2026-031',
      proposedValue: 'PKR 142,000 PO',
      justification: 'Restock Fanta 500ml & Pure Life 1.5L before weekend footfall.',
      referenceId: 'PR-2026-031',
      status: 'Pending',
    },
    {
      id: 'apr-writeoff-203',
      type: 'STOCK_WRITE_OFF',
      title: 'Damaged Tea Whitener Pouch Quarantine Write-off (Demo)',
      branchId: 'hyderabad',
      requestedByUserId: 'usr-rec-clerk',
      requestedByName: 'Imran Qazi',
      requestedAt: '2026-11-16T08:10:00Z',
      amountPkr: 2 * products[1].purchaseCost,
      previousValue: '2 units damaged on GRN-HYD-2026-019',
      proposedValue: 'Write-off & claim from Nestlé Dist',
      justification: 'Transit carton crush identified during receiving inspection.',
      referenceId: 'grn-001',
      status: 'Pending',
    },
  ];

  const checklists: BranchChecklistItem[] = [
    {
      id: 'chk-hyd-1',
      branchId: 'hyderabad',
      shiftType: 'Opening',
      task: 'Verify cold-chain & frozen freezers (-18°C / 0–4°C)',
      completed: true,
      completedBy: 'Zainab Soomro',
      completedAt: '2026-11-16T05:05:00Z',
    },
    {
      id: 'chk-hyd-2',
      branchId: 'hyderabad',
      shiftType: 'Opening',
      task: 'Issue cash register opening floats & test barcode scanners',
      completed: true,
      completedBy: 'Kamran Siddiqui',
      completedAt: '2026-11-16T05:08:00Z',
    },
    {
      id: 'chk-hyd-3',
      branchId: 'hyderabad',
      shiftType: 'Closing',
      task: 'Count POS cash drawers & submit shift closing sheets',
      completed: false,
    },
    {
      id: 'chk-k10-1',
      branchId: 'karachi-p10',
      shiftType: 'Opening',
      task: 'Inspect Precinct 10-A dairy chiller temperature & expiry tags',
      completed: true,
      completedBy: 'Branch Lead (Demo)',
      completedAt: '2026-11-16T05:10:00Z',
    },
  ];

  const maintenanceTickets: MaintenanceTicket[] = [
    {
      id: 'mnt-101',
      branchId: 'hyderabad',
      equipment: 'Dairy Open Chiller Bay #2 (Supermarket)',
      issue: 'Compressor thermostat drifting above 5°C alert band.',
      priority: 'Urgent',
      reportedByName: 'Zainab Soomro',
      assignedToName: 'Naveed Arain (Demo)',
      status: 'In Progress',
      createdAt: '2026-11-16T06:45:00Z',
    },
    {
      id: 'mnt-102',
      branchId: 'hyderabad',
      equipment: 'POS Lane #3 Barcode Scanner',
      issue: 'USB cradle loose connection resolved with spare cable.',
      priority: 'Normal',
      reportedByName: 'Usman Tariq',
      assignedToName: 'Naveed Arain (Demo)',
      status: 'Verified Resolved',
      createdAt: '2026-11-15T14:20:00Z',
    },
  ];

  const attendance: StaffAttendanceRecord[] = INITIAL_STAFF_USERS.slice(0, 14).map((u, idx) => ({
    id: `att-${idx}`,
    userId: u.id,
    employeeCode: u.employeeCode,
    fullName: u.fullName,
    roleLabel: u.department,
    branchId: u.branchId === 'all' ? 'karachi-p10' : u.branchId,
    shiftWindow: idx % 2 === 0 ? '10:00 AM – 06:00 PM' : '02:00 PM – 10:00 PM',
    status: idx % 3 === 0 ? 'On Shift' : 'Scheduled',
  }));

  const leaveRequests: LeaveRequestRecord[] = [
    {
      id: 'lv-101',
      userId: 'usr-cashier-hyd',
      employeeName: 'Usman Tariq',
      branchId: 'hyderabad',
      leaveType: 'Casual',
      startDate: '2026-11-24',
      days: 1,
      reason: 'Family medical appointment',
      status: 'Pending',
    },
  ];

  const stockMovements: StockMovement[] = [
    {
      id: 'mov-1',
      timestamp: '2026-11-16T08:05:00Z',
      productId: products[1].id,
      branchId: 'hyderabad',
      type: 'GRN',
      quantityDelta: 34,
      sourceLocation: 'Supplier Dock',
      destinationLocation: 'HYD-A02 (Warehouse)',
      referenceId: 'GRN-HYD-2026-019',
      actorName: 'Imran Qazi',
      reason: 'Accepted units from PO-2026-015',
    },
    {
      id: 'mov-2',
      timestamp: '2026-11-16T08:45:00Z',
      productId: products[8].id,
      branchId: 'hyderabad',
      type: 'POS_SALE',
      quantityDelta: -4,
      sourceLocation: 'HYD-A09 (Sales Floor)',
      destinationLocation: 'Customer Checkout',
      referenceId: 'RCP-HYD-1002',
      actorName: 'Usman Tariq',
      reason: 'Completed counter sale',
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-1',
      timestamp: '2026-11-16T08:05:00Z',
      actorUserId: 'usr-rec-clerk',
      actorName: 'Imran Qazi',
      actorRole: 'Receiving Clerk',
      branchId: 'hyderabad',
      module: 'purchasing',
      action: 'POST_GRN_PARTIAL',
      target: 'PO-2026-015',
      outcome: 'Success',
      detail: 'Recorded 34 accepted / 2 damaged for Nestlé Everyday 230g.',
    },
    {
      id: 'aud-2',
      timestamp: '2026-11-16T08:15:00Z',
      actorUserId: 'usr-data-op',
      actorName: 'hamza_catalog (Demo)',
      actorRole: 'Product Data Operator',
      branchId: 'hyderabad',
      module: 'offers',
      action: 'REQUEST_PRICE_CHANGE',
      target: 'MRH-GRO-209',
      outcome: 'Success',
      detail: 'Submitted price change request (PKR 1,680 -> 1,640) for independent approval.',
    },
  ];

  const syncJobs: SyncJobRecord[] = [
    {
      id: 'sync-1',
      channel: 'Website Catalogue Sync',
      lastRunAt: '2026-11-16T09:00:00Z',
      status: 'Healthy',
      recordsSynced: products.length,
      detail: 'Authoritative SKU & selling price feed synchronized with storefront.',
    },
    {
      id: 'sync-2',
      channel: 'Inventory Availability Feed',
      lastRunAt: '2026-11-16T09:12:00Z',
      status: 'Healthy',
      recordsSynced: stock.length,
      detail: 'Sellable vs reserved stock availability active across 3 branches.',
    },
    {
      id: 'sync-3',
      channel: 'Online Orders Intake',
      lastRunAt: '2026-11-16T09:12:00Z',
      status: 'Healthy',
      recordsSynced: onlineOrders.length,
      detail: 'Public storefront checkout connected to reservation & fulfillment queue.',
    },
  ];

  return {
    staffUsers: INITIAL_STAFF_USERS,
    suppliers: INITIAL_SUPPLIERS,
    products,
    stock,
    stockMovements,
    stockTransfers,
    cycleCounts,
    requisitions,
    purchaseOrders,
    goodsReceipts,
    supplierInvoices,
    bankSettlements,
    shifts,
    posSales,
    onlineOrders,
    promotions,
    expenses,
    customerCases,
    approvals,
    checklists,
    maintenanceTickets,
    attendance,
    leaveRequests,
    auditLogs,
    syncJobs,
  };
}
