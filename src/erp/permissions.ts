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
    label: 'Today',
    shortLabel: 'Today',
    path: '/management/dashboard',
    description: 'Role-adapted daily tasks, alerts & operational overview',
  },
  {
    id: 'pos',
    label: 'POS & Sales',
    shortLabel: 'POS',
    path: '/management/pos',
    description: 'Barcode billing, shifts, overrides & returns',
  },
  {
    id: 'products',
    label: 'Products',
    shortLabel: 'Products',
    path: '/management/products',
    description: 'Catalogue SKUs, barcodes, packaging & lookup',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    shortLabel: 'Inventory',
    path: '/management/inventory',
    description: 'Warehouse & floor stock, putaway, transfers, counts & FEFO expiry',
  },
  {
    id: 'purchasing',
    label: 'Purchasing',
    shortLabel: 'Purchasing',
    path: '/management/purchasing',
    description: 'Requisitions, suppliers, POs & GRN receiving',
  },
  {
    id: 'orders',
    label: 'Online Orders',
    shortLabel: 'Orders',
    path: '/management/orders',
    description: 'Website intake, reservations, picking, packing & handover',
  },
  {
    id: 'offers',
    label: 'Pricing & Offers',
    shortLabel: 'Pricing',
    path: '/management/offers',
    description: 'Approved price changes & promotional campaigns',
  },
  {
    id: 'finance',
    label: 'Finance',
    shortLabel: 'Finance',
    path: '/management/finance',
    description: 'Shift cash reconciliation, card settlements, payables & expenses',
  },
  {
    id: 'staff',
    label: 'Staff & HR',
    shortLabel: 'Staff & HR',
    path: '/management/staff',
    description: 'Employees, shift schedules, attendance & leave approvals',
  },
  {
    id: 'branches',
    label: 'Branch Operations',
    shortLabel: 'Branches',
    path: '/management/branches',
    description: 'Opening/closing checklists, aisles & supermarket equipment maintenance',
  },
  {
    id: 'customers',
    label: 'Customers & Support',
    shortLabel: 'Support',
    path: '/management/customers',
    description: 'Customer inquiries, complaints & return intake',
  },
  {
    id: 'reports',
    label: 'Reports',
    shortLabel: 'Reports',
    path: '/management/reports',
    description: 'Authorized retail, inventory, audit & financial reports',
  },
  {
    id: 'settings',
    label: 'MIS & Settings',
    shortLabel: 'MIS & Admin',
    path: '/management/settings',
    description: 'Users, RBAC permissions, governance queue, integrations & audit logs',
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
    description: 'Fast POS billing, open/close own shift, barcode lookup & leave submission.',
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
    description: 'POS billing, held bills, counter return verification & customer assistance.',
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
    description: 'Supervises checkout counters, approves POS discount overrides & reviews cash closings.',
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
      settings: ['view'],
    },
  },
  sales_assistant: {
    id: 'sales_assistant',
    label: 'Sales & Replenishment Assistant',
    tier: 'frontline',
    description: 'Floor product/price lookup, stock availability check & shelf refill tasks (no financial access).',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      products: ['view'],
      inventory: ['view'],
      branches: ['view', 'edit'],
      staff: ['view', 'submit'],
    },
  },
  department_supervisor: {
    id: 'department_supervisor',
    label: 'Department Supervisor',
    tier: 'frontline',
    description: 'Aisle replenishment, warehouse-to-floor putaway, cycle counts & near-expiry checks.',
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
    description: 'Verifies inbound supplier deliveries against POs, logs GRN discrepancies & receives transfers.',
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
  stock_controller: {
    id: 'stock_controller',
    label: 'Stock Controller / Storekeeper',
    tier: 'operational',
    description: 'Warehouse putaway to floor, physical cycle counts, transfer dispatch & adjustment requests.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 5000,
    modules: {
      dashboard: ['view'],
      products: ['view'],
      inventory: ['view', 'create', 'edit', 'submit', 'verify'],
      staff: ['view', 'submit'],
    },
  },
  inventory_auditor: {
    id: 'inventory_auditor',
    label: 'Inventory Auditor (Read-Only)',
    tier: 'operational',
    description: 'Independent physical stock verification, variance reporting & batch audit without altering stock.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    isReadOnlyAudit: true,
    modules: {
      dashboard: ['view'],
      products: ['view'],
      inventory: ['view', 'verify', 'export'],
      reports: ['view', 'export'],
    },
  },
  inventory_manager: {
    id: 'inventory_manager',
    label: 'Inventory Manager',
    tier: 'operational',
    description: 'Multi-branch stock control, transfers, cycle count variance approval & FEFO expiry blocking.',
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
      settings: ['view'],
    },
  },
  purchasing_officer: {
    id: 'purchasing_officer',
    label: 'Purchasing Officer / Buyer',
    tier: 'operational',
    description: 'Prepares supplier requisitions, converts PRs to POs (within buyer ceiling) & monitors deliveries.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 50000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'submit'],
      inventory: ['view'],
      purchasing: ['view', 'create', 'edit', 'submit'],
      reports: ['view'],
      staff: ['view', 'submit'],
    },
  },
  purchasing_manager: {
    id: 'purchasing_manager',
    label: 'Purchasing Manager',
    tier: 'operational',
    description: 'Supplier performance, requisition conversion, purchase orders & cost reviews.',
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
      settings: ['view'],
    },
  },
  accounts_payable: {
    id: 'accounts_payable',
    label: 'Accounts Payable / Cash Controller',
    tier: 'operational',
    description: 'Verifies cashier collections, bank card settlements & prepares matched supplier payments (cannot release unauthorized funds).',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'verify'],
      purchasing: ['view', 'verify'],
      finance: ['view', 'create', 'submit', 'verify'],
      reports: ['view'],
      staff: ['view', 'submit'],
    },
  },
  accounts_manager: {
    id: 'accounts_manager',
    label: 'Accounts Manager',
    tier: 'operational',
    description: 'Shift cash reconciliation, bank settlement matching, 3-way invoice approval & expenses.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 500000,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'verify'],
      purchasing: ['view', 'verify'],
      finance: ['view', 'create', 'edit', 'verify', 'approve', 'export'],
      customers: ['view', 'approve'],
      reports: ['view', 'export'],
      staff: ['view', 'submit'],
      settings: ['view'],
    },
  },
  internal_auditor: {
    id: 'internal_auditor',
    label: 'Internal Auditor (Read-Only)',
    tier: 'executive',
    description: 'Independent financial, inventory & security audit review without altering transactions or stock.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    isReadOnlyAudit: true,
    modules: {
      dashboard: ['view'],
      pos: ['view', 'export'],
      products: ['view', 'export'],
      inventory: ['view', 'export'],
      purchasing: ['view', 'export'],
      orders: ['view'],
      finance: ['view', 'export'],
      staff: ['view'],
      branches: ['view'],
      customers: ['view'],
      reports: ['view', 'export'],
      settings: ['view', 'export'],
    },
  },
  hr_manager: {
    id: 'hr_manager',
    label: 'HR Manager',
    tier: 'operational',
    description: 'Workforce onboarding/roster, shift scheduling, attendance monitoring & leave approvals.',
    branchRestricted: false,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 100000,
    modules: {
      dashboard: ['view'],
      staff: ['view', 'create', 'edit', 'submit', 'verify', 'approve', 'export'],
      branches: ['view', 'edit'],
      reports: ['view', 'export'],
    },
  },
  facilities_admin: {
    id: 'facilities_admin',
    label: 'Branch Administration & Maintenance',
    tier: 'frontline',
    description: 'Supermarket chillers, scanners & store maintenance tickets and opening checklists.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      branches: ['view', 'create', 'edit', 'verify'],
      staff: ['view', 'submit'],
    },
  },
  order_picker: {
    id: 'order_picker',
    label: 'Online Order Picker & Packer',
    tier: 'frontline',
    description: 'Aisle picking, substitution flagging, packing verification & pickup counter handover.',
    branchRestricted: true,
    canViewCostAndMargin: false,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      products: ['view'],
      inventory: ['view'],
      orders: ['view', 'edit', 'verify'],
      staff: ['view', 'submit'],
    },
  },
  online_orders_manager: {
    id: 'online_orders_manager',
    label: 'Online Orders Manager',
    tier: 'operational',
    description: 'E-commerce fulfillment queue, stock reservations, substitutions, dispatch & exceptions.',
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
    description: 'Customer inquiries, order assistance & return intake (refund release separated to Finance).',
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
    description: 'Full operational oversight of assigned branch registers, stock, transfers, orders, maintenance & staff.',
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
      staff: ['view', 'create', 'edit', 'submit', 'verify', 'approve'],
      branches: ['view', 'create', 'edit', 'verify', 'approve'],
      customers: ['view', 'edit', 'verify'],
      reports: ['view', 'export'],
      settings: ['view'],
    },
  },
  product_data_operator: {
    id: 'product_data_operator',
    label: 'Product Data Operator',
    tier: 'technical',
    description: 'Maintains SKUs, GTIN barcodes, packaging & submits controlled price change requests.',
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
    description: 'Executive procurement governance, supplier contracts, price approvals & category oversight.',
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
      settings: ['view'],
    },
  },
  director_accounts: {
    id: 'director_accounts',
    label: 'Director Accounts',
    tier: 'executive',
    description: 'Executive finance control, reconciliations, supplier payment releases, refunds & audit review.',
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
      settings: ['view', 'export'],
    },
  },
  director_admin: {
    id: 'director_admin',
    label: 'Director Administration',
    tier: 'executive',
    description: 'Workforce governance, multi-branch operations, equipment facilities & compliance oversight.',
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
      settings: ['view'],
    },
  },
  director_mis: {
    id: 'director_mis',
    label: 'Director MIS',
    tier: 'technical',
    description: 'RBAC security matrix, user provisioning/offboarding, audit logs & website integrations (NO financial/PO approvals).',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 0,
    modules: {
      dashboard: ['view'],
      products: ['view', 'export'],
      orders: ['view'],
      branches: ['view'],
      reports: ['view', 'export'],
      settings: FULL_ACTIONS,
    },
  },
  ceo: {
    id: 'ceo',
    label: 'Chief Executive Officer',
    tier: 'executive',
    description: 'Consolidated enterprise visibility, branch comparisons, commercial BI & high-value executive approvals.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 50,
    approvalLimitPkr: Number.MAX_SAFE_INTEGER,
    modules: {
      dashboard: FULL_ACTIONS,
      pos: ['view', 'verify', 'approve', 'export'],
      products: ['view', 'edit', 'approve', 'export'],
      inventory: ['view', 'verify', 'approve', 'export'],
      purchasing: ['view', 'verify', 'approve', 'reject', 'export'],
      orders: ['view', 'verify', 'approve', 'export'],
      offers: ['view', 'approve', 'reject', 'export'],
      finance: ['view', 'verify', 'approve', 'reject', 'export'],
      staff: ['view', 'verify', 'approve', 'reject', 'export'],
      branches: ['view', 'verify', 'approve', 'export'],
      customers: ['view', 'verify', 'approve', 'export'],
      reports: FULL_ACTIONS,
      settings: ['view', 'approve', 'reject', 'export', 'administer'],
    },
  },
  owner_partner: {
    id: 'owner_partner',
    label: 'Authorized Owner / Partner',
    tier: 'executive',
    description: 'Governance-level partner reports, approved financial visibility & major strategic approvals.',
    branchRestricted: false,
    canViewCostAndMargin: true,
    maxPosDiscountPercent: 0,
    approvalLimitPkr: 50000000,
    modules: {
      dashboard: ['view'],
      products: ['view', 'export'],
      inventory: ['view', 'export'],
      purchasing: ['view', 'approve', 'reject', 'export'],
      offers: ['view', 'approve', 'reject'],
      finance: ['view', 'approve', 'reject', 'export'],
      branches: ['view'],
      reports: ['view', 'export'],
      settings: ['view'],
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
  if (action === 'administer') return actions.includes('administer');
  return actions.includes(action) || actions.includes('administer');
}

export function canAccessModule(roleId: StaffRoleId, moduleId: ManagementModuleId): boolean {
  return hasPermission(roleId, moduleId, 'view');
}

export function getPermittedModules(roleId: StaffRoleId) {
  return MODULE_METADATA.filter((m) => canAccessModule(roleId, m.id));
}

export function canAccessBranch(user: StaffUser, targetBranchId: string): boolean {
  const role = ROLE_DEFINITIONS[user.roleId];
  if (!role) return false;
  if (!targetBranchId || targetBranchId === 'all') {
    return !role.branchRestricted && user.branchId === 'all';
  }
  if (user.branchId === 'all' && !role.branchRestricted) {
    return true;
  }
  return user.branchId === targetBranchId;
}

/**
 * Enforces strict RBAC + branch scope + segregation of duties + financial approval limits.
 * Technical administrators (e.g. MIS) NEVER bypass business module approval authority.
 */
export function evaluateApprovalAuthority(
  user: StaffUser,
  approval: ApprovalRequest
): { allowed: boolean; reason?: string } {
  const role = ROLE_DEFINITIONS[user.roleId];
  if (!role) return { allowed: false, reason: 'Unrecognized role.' };
  if (!user.active) return { allowed: false, reason: 'Inactive staff account.' };
  if (role.isReadOnlyAudit) {
    return { allowed: false, reason: `Auditor role "${role.label}" is strictly read-only.` };
  }

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

  // Strictly require approval authority on the OWNING business module (NO settings:approve bypass!)
  const moduleMap: Record<ApprovalRequest['type'], ManagementModuleId> = {
    PRICE_CHANGE: 'offers',
    POS_DISCOUNT_OVERRIDE: 'pos',
    PURCHASE_ORDER: 'purchasing',
    STOCK_WRITE_OFF: 'inventory',
    REFUND_REQUEST: 'finance',
    SUPPLIER_PAYMENT: 'finance',
  };
  const requiredModule = moduleMap[approval.type];
  if (!hasPermission(user.roleId, requiredModule, 'approve')) {
    return {
      allowed: false,
      reason: `Role "${role.label}" does not hold approval authority on ${requiredModule} for ${approval.type}.`,
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
