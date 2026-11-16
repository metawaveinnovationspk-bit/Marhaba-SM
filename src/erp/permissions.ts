import type {
  ApprovalRequest,
  ErpProduct,
  ManagementModuleId,
  PermissionAction,
  RoleDefinition,
  StaffRoleId,
  StaffUser,
} from './types';

export const MODULE_METADATA: {
  id: ManagementModuleId;
  label: string;
  shortLabel: string;
  path: string;
  description: string;
}[] = [
  {
    id: 'dashboard',
    label: 'Operations Overview',
    shortLabel: 'Overview',
    path: '/management/dashboard',
    description: 'Role-adapted operational summary & exceptions',
  },
  {
    id: 'pos',
    label: 'POS & Cashier Shifts',
    shortLabel: 'POS',
    path: '/management/pos',
    description: 'Barcode billing, registers, discounts & shift closing',
  },
  {
    id: 'products',
    label: 'Products & Catalogue',
    shortLabel: 'Products',
    path: '/management/products',
    description: 'SKUs, GTIN barcodes, packaging, costs & prices',
  },
  {
    id: 'inventory',
    label: 'Inventory & Warehouse',
    shortLabel: 'Inventory',
    path: '/management/inventory',
    description: 'Branch stock, transfers, cycle counts & FEFO expiry',
  },
  {
    id: 'purchasing',
    label: 'Purchasing & Suppliers',
    shortLabel: 'Purchasing',
    path: '/management/purchasing',
    description: 'Requisitions, POs, GRN receiving & 3-way matching',
  },
  {
    id: 'orders',
    label: 'Online Orders & Fulfillment',
    shortLabel: 'Orders',
    path: '/management/orders',
    description: 'Website orders, reservations, picking & packing',
  },
  {
    id: 'offers',
    label: 'Offers & Pricing',
    shortLabel: 'Offers',
    path: '/management/offers',
    description: 'Promotions, campaign scheduling & price requests',
  },
  {
    id: 'finance',
    label: 'Finance & Accounts',
    shortLabel: 'Finance',
    path: '/management/finance',
    description: 'Settlements, cash variances, payables & expenses',
  },
  {
    id: 'staff',
    label: 'Employees & Admin',
    shortLabel: 'Staff',
    path: '/management/staff',
    description: 'Shifts, attendance, leave requests & roster',
  },
  {
    id: 'branches',
    label: 'Branch Operations',
    shortLabel: 'Branches',
    path: '/management/branches',
    description: 'Branch checklists, counters & shelf tasks',
  },
  {
    id: 'customers',
    label: 'Customers & Support',
    shortLabel: 'Support',
    path: '/management/customers',
    description: 'Inquiries, complaints & return workflows',
  },
  {
    id: 'reports',
    label: 'Reports & BI',
    shortLabel: 'Reports',
    path: '/management/reports',
    description: 'Role-filtered retail, stock & financial reports',
  },
  {
    id: 'settings',
    label: 'MIS, RBAC & Approvals',
    shortLabel: 'MIS & Admin',
    path: '/management/settings',
    description: 'Users, permissions, approvals, audit & website sync',
  },
];

const FULL_ACTIONS: PermissionAction[] = [
  'view',
  'create',
  'edit',
  'submit',
  'verify',
  'approve',
  'reject',
  'cancel',
  'export',
  'administer',
];

export const ROLE_DEFINITIONS: Record<StaffRoleId, RoleDefinition> = {
  cashier: {
    id: 'cashier',
    label: 'Cashier',
    tier: 'frontline',
    description: 'Frontline POS billing, open/close own shift, standard receipts.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 5,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'create', 'submit'],
      products: ['view'],
      staff: ['view', 'submit'],
    },
  },
  senior_cashier: {
    id: 'senior_cashier',
    label: 'Senior Cashier',
    tier: 'frontline',
    description: 'POS billing, hold/resume bills, customer return intake.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 10,
    approvalLimitPkr: 2500,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'create', 'edit', 'submit', 'verify'],
      products: ['view'],
      customers: ['view', 'create'],
      staff: ['view', 'submit'],
    },
  },
  pos_supervisor: {
    id: 'pos_supervisor',
    label: 'POS Supervisor',
    tier: 'frontline',
    description: 'Supervises register shifts, overrides POS discounts, verifies cash closings.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 20,
    approvalLimitPkr: 25000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'create', 'edit', 'verify', 'approve', 'reject'],
      products: ['view'],
      orders: ['view', 'edit'],
      customers: ['view', 'edit'],
      branches: ['view', 'edit'],
      staff: ['view', 'verify'],
      reports: ['view'],
    },
  },
  department_supervisor: {
    id: 'department_supervisor',
    label: 'Department Supervisor',
    tier: 'frontline',
    description: 'Aisle replenishment, cycle counts, near-expiry checks & department tasks.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 10000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'submit'],
      inventory: ['view', 'create', 'submit', 'verify'],
      branches: ['view', 'edit'],
      staff: ['view', 'verify'],
      reports: ['view'],
    },
  },
  receiving_clerk: {
    id: 'receiving_clerk',
    label: 'Receiving Clerk',
    tier: 'frontline',
    description: 'Verifies inbound supplier deliveries against POs and logs GRN discrepancies.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      inventory: ['view', 'create', 'verify'],
      purchasing: ['view', 'verify'],
      staff: ['view', 'submit'],
    },
  },
  inventory_manager: {
    id: 'inventory_manager',
    label: 'Inventory Manager',
    tier: 'operational',
    description: 'Branch & warehouse stock control, transfers, adjustments & FEFO expiry blocking.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 150000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'edit'],
      inventory: ['view', 'create', 'edit', 'submit', 'verify', 'approve', 'export'],
      purchasing: ['view', 'create', 'submit'],
      orders: ['view', 'verify'],
      branches: ['view', 'edit'],
      reports: ['view', 'export'],
      staff: ['view', 'verify'],
    },
  },
  purchasing_manager: {
    id: 'purchasing_manager',
    label: 'Purchasing Manager',
    tier: 'operational',
    description: 'Supplier directory, requisitions, purchase orders & cost reviews.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 350000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'create', 'edit', 'submit'],
      inventory: ['view'],
      purchasing: ['view', 'create', 'edit', 'submit', 'verify', 'approve', 'export'],
      offers: ['view', 'submit'],
      reports: ['view', 'export'],
      staff: ['view', 'submit'],
    },
  },
  accounts_manager: {
    id: 'accounts_manager',
    label: 'Accounts Manager',
    tier: 'operational',
    description: 'Cashier shift reconciliation, 3-way supplier invoice match, expenses & payables.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 500000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'verify'],
      purchasing: ['view', 'verify'],
      finance: ['view', 'create', 'edit', 'verify', 'approve', 'export'],
      reports: ['view', 'export'],
      staff: ['view', 'submit'],
    },
  },
  hr_manager: {
    id: 'hr_manager',
    label: 'HR / Administration Manager',
    tier: 'operational',
    description: 'Workforce directory, attendance, rosters & leave approvals.',
    branchRestricted: false,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 100000,
    modules: {
      dashboard: ['view'],
      staff: ['view', 'create', 'edit', 'verify', 'approve', 'export'],
      branches: ['view', 'edit'],
      reports: ['view'],
    },
  },
  online_orders_manager: {
    id: 'online_orders_manager',
    label: 'Online Orders Manager',
    tier: 'operational',
    description: 'E-commerce fulfillment, stock reservations, picking, packing & dispatch.',
    branchRestricted: false,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 50000,
    modules: {
      dashboard: ['view'],
      products: ['view'],
      inventory: ['view'],
      orders: ['view', 'create', 'edit', 'verify', 'approve', 'cancel', 'export'],
      customers: ['view', 'edit'],
      reports: ['view', 'export'],
    },
  },
  customer_service: {
    id: 'customer_service',
    label: 'Customer Service Officer',
    tier: 'frontline',
    description: 'Customer inquiries, order assistance & return intake (refund approval separated).',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      orders: ['view'],
      customers: ['view', 'create', 'edit', 'submit'],
      staff: ['view', 'submit'],
    },
  },
  branch_manager: {
    id: 'branch_manager',
    label: 'Branch Manager',
    tier: 'operational',
    description: 'Full operational oversight of assigned branch registers, stock, orders & staff.',
    branchRestricted: true,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 25,
    approvalLimitPkr: 250000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'create', 'verify', 'approve', 'export'],
      products: ['view', 'edit'],
      inventory: ['view', 'create', 'edit', 'verify', 'approve', 'export'],
      purchasing: ['view', 'create', 'submit', 'approve'],
      orders: ['view', 'edit', 'verify', 'approve'],
      offers: ['view', 'submit'],
      finance: ['view', 'create', 'verify'],
      staff: ['view', 'verify', 'approve'],
      branches: ['view', 'create', 'edit', 'verify', 'approve'],
      customers: ['view', 'edit', 'verify'],
      reports: ['view', 'export'],
    },
  },
  product_data_operator: {
    id: 'product_data_operator',
    label: 'Product Data Operator',
    tier: 'technical',
    description: 'Maintains SKUs, GTIN barcodes, product copy & syncs website feed.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      products: ['view', 'create', 'edit', 'submit', 'export'],
      offers: ['view', 'create', 'submit'],
      settings: ['view'],
    },
  },
  director_purchasing: {
    id: 'director_purchasing',
    label: 'Director Purchasing',
    tier: 'executive',
    description: 'Executive procurement governance, supplier contracts & cost oversight.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 20,
    approvalLimitPkr: 5000000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'create', 'edit', 'approve', 'export'],
      inventory: ['view', 'export'],
      purchasing: FULL_ACTIONS,
      offers: ['view', 'approve', 'reject', 'export'],
      finance: ['view'],
      branches: ['view'],
      reports: ['view', 'export'],
      settings: ['view', 'approve'],
    },
  },
  director_accounts: {
    id: 'director_accounts',
    label: 'Director Accounts',
    tier: 'executive',
    description: 'Executive finance control, reconciliations, payables & audit review.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 15,
    approvalLimitPkr: 10000000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'verify'],
      purchasing: ['view', 'verify', 'approve'],
      finance: FULL_ACTIONS,
      branches: ['view'],
      customers: ['view', 'approve'],
      reports: ['view', 'export'],
      settings: ['view', 'approve', 'export'],
    },
  },
  director_admin: {
    id: 'director_admin',
    label: 'Director Administration',
    tier: 'executive',
    description: 'Workforce governance, multi-branch operations & compliance oversight.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 15,
    approvalLimitPkr: 2500000,
    modules: {
      dashboard: ['view'],
      inventory: ['view'],
      orders: ['view'],
      staff: FULL_ACTIONS,
      branches: FULL_ACTIONS,
      customers: ['view', 'edit', 'approve'],
      reports: ['view', 'export'],
      settings: ['view', 'approve'],
    },
  },
  director_mis: {
    id: 'director_mis',
    label: 'Director MIS',
    tier: 'technical',
    description: 'RBAC security matrix, staff account provisioning, audit logs & website integrations.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 20,
    approvalLimitPkr: 1500000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'verify'],
      products: ['view', 'create', 'edit', 'export'],
      inventory: ['view'],
      orders: ['view', 'edit'],
      offers: ['view', 'edit'],
      branches: ['view'],
      reports: ['view', 'export'],
      settings: FULL_ACTIONS,
    },
  },
  ceo: {
    id: 'ceo',
    label: 'Chief Executive Officer',
    tier: 'executive',
    description: 'Consolidated enterprise visibility across all Marhaba branches, finance & approvals.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 50,
    approvalLimitPkr: Number.MAX_SAFE_INTEGER,
    modules: {
      dashboard: FULL_ACTIONS,
      pos: ['view', 'verify', 'approve', 'export'],
      products: FULL_ACTIONS,
      inventory: FULL_ACTIONS,
      purchasing: FULL_ACTIONS,
      orders: FULL_ACTIONS,
      offers: FULL_ACTIONS,
      finance: FULL_ACTIONS,
      staff: FULL_ACTIONS,
      branches: FULL_ACTIONS,
      customers: FULL_ACTIONS,
      reports: FULL_ACTIONS,
      settings: FULL_ACTIONS,
    },
  },
};

export function hasPermission(
  roleId: StaffRoleId,
  moduleId: ManagementModuleId,
  action: PermissionAction = 'view'
): boolean {
  const role = ROLE_DEFINITIONS[roleId];
  if (!role) return false;
  const actions = role.modules[moduleId];
  if (!actions) return false;
  return actions.includes(action) || actions.includes('administer');
}

export function canAccessModule(roleId: StaffRoleId, moduleId: ManagementModuleId): boolean {
  return hasPermission(roleId, moduleId, 'view');
}

export function getPermittedModules(roleId: StaffRoleId) {
  return MODULE_METADATA.filter((m) => canAccessModule(roleId, m.id));
}

export function canAccessBranch(user: StaffUser, targetBranchId: string): boolean {
  if (!targetBranchId || targetBranchId === 'all') {
    return !ROLE_DEFINITIONS[user.roleId].branchRestricted && user.branchId === 'all';
  }
  if (user.branchId === 'all' && !ROLE_DEFINITIONS[user.roleId].branchRestricted) {
    return true;
  }
  return user.branchId === targetBranchId;
}

/**
 * Enforces RBAC + branch scope + segregation of duties + financial approval limits.
 */
export function evaluateApprovalAuthority(
  user: StaffUser,
  approval: ApprovalRequest
): { allowed: boolean; reason?: string } {
  const role = ROLE_DEFINITIONS[user.roleId];
  if (!role) return { allowed: false, reason: 'Unrecognized role.' };
  if (!user.active) return { allowed: false, reason: 'Inactive staff account.' };

  // Segregation of duties: requester cannot approve or reject their own request
  if (approval.requestedByUserId === user.id) {
    return {
      allowed: false,
      reason: 'Segregation of duties: you cannot approve or reject your own submitted request.',
    };
  }

  // Branch scope check
  if (!canAccessBranch(user, approval.branchId)) {
    return {
      allowed: false,
      reason: `Branch restriction: your account is scoped to ${user.branchId}, not ${approval.branchId}.`,
    };
  }

  // Module capability check based on approval type
  const moduleMap: Record<ApprovalRequest['type'], ManagementModuleId> = {
    PRICE_CHANGE: 'offers',
    POS_DISCOUNT_OVERRIDE: 'pos',
    PURCHASE_ORDER: 'purchasing',
    STOCK_WRITE_OFF: 'inventory',
    REFUND_REQUEST: 'finance',
    SUPPLIER_PAYMENT: 'finance',
  };
  const requiredModule = moduleMap[approval.type];
  if (!hasPermission(user.roleId, requiredModule, 'approve') && !hasPermission(user.roleId, 'settings', 'approve')) {
    return {
      allowed: false,
      reason: `Role "${role.label}" does not hold approval authority for ${approval.type}.`,
    };
  }

  // Financial threshold check
  if (approval.amountPkr > role.approvalLimitPkr) {
    return {
      allowed: false,
      reason: `Amount exceeds your role approval ceiling (PKR ${role.approvalLimitPkr.toLocaleString()}). Escalate to Director / CEO.`,
    };
  }

  return { allowed: true };
}

/**
 * Redacts sensitive purchase cost from product records for roles without cost/margin clearance.
 */
export function redactProductForRole(
  product: ErpProduct,
  roleId: StaffRoleId
): Omit<ErpProduct, 'purchaseCost'> & { purchaseCost: number | null; marginPercent: number | null } {
  const canViewCost = ROLE_DEFINITIONS[roleId]?.canViewCostAndMargin ?? false;
  if (!canViewCost) {
    return {
      ...product,
      purchaseCost: null,
      marginPercent: null,
    };
  }
  const marginPercent =
    product.sellingPrice > 0
      ? Number((((product.sellingPrice - product.purchaseCost) / product.sellingPrice) * 100).toFixed(1))
      : 0;
  return {
    ...product,
    marginPercent,
  };
}
