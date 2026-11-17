import type {
  BranchStockRecord,
  BusinessExpense,
  CashierShift,
  ErpProduct,
  PosSaleLine,
  PosSaleRecord,
  PurchaseOrder,
  SupplierInvoiceRecord,
} from './types';

export function lookupProductByBarcodeOrSku(
  products: ErpProduct[],
  query: string
): ErpProduct | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;
  return (
    products.find(
      (p) =>
        p.barcode.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        p.id.toLowerCase() === clean
    ) || null
  );
}

export function computePosLineTotal(
  unitPrice: number,
  quantity: number,
  discountPercent: number
): number {
  const safeQty = Math.max(1, Math.floor(quantity));
  const safeDiscount = Math.min(100, Math.max(0, discountPercent));
  const gross = unitPrice * safeQty;
  const net = gross * (1 - safeDiscount / 100);
  return Math.round(net);
}

export function computePosTotals(lines: PosSaleLine[]) {
  let subtotal = 0;
  let discountAmount = 0;

  for (const line of lines) {
    const gross = line.unitPrice * line.quantity;
    const net = computePosLineTotal(line.unitPrice, line.quantity, line.discountPercent);
    subtotal += gross;
    discountAmount += gross - net;
  }

  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  // Prices in Marhaba retail shelf demo are tax-inclusive; show informational breakdown clearly marked configurable
  const taxAmount = Math.round(netBeforeTax * 0);
  const grandTotal = netBeforeTax + taxAmount;

  return {
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
  };
}

export function calculateCashChange(grandTotal: number, cashReceived: number): number {
  if (!Number.isFinite(cashReceived)) return 0;
  return Math.max(0, Math.round(cashReceived - grandTotal));
}

export function calculateShiftClosing(
  shift: Pick<CashierShift, 'openingFloat' | 'cashSalesTotal' | 'refundsTotal'>,
  declaredCash: number
): { expectedCash: number; variance: number; statusLabel: 'Balanced' | 'Over' | 'Short' } {
  const expectedCash = Math.round(shift.openingFloat + shift.cashSalesTotal - shift.refundsTotal);
  const variance = Math.round(declaredCash - expectedCash);
  const statusLabel = variance === 0 ? 'Balanced' : variance > 0 ? 'Over' : 'Short';
  return { expectedCash, variance, statusLabel };
}

export function getSellableStock(stock: BranchStockRecord): number {
  return Math.max(0, stock.onHand - stock.reserved - stock.damaged);
}

export function classifyExpiryStatus(
  expiryDate: string,
  referenceDateIso: string
): 'Non-Perishable' | 'Expired' | 'Near Expiry (<= 30d)' | 'Fresh' {
  if (!expiryDate) return 'Non-Perishable';
  const exp = new Date(expiryDate + 'T00:00:00Z').getTime();
  const ref = new Date(referenceDateIso.slice(0, 10) + 'T00:00:00Z').getTime();
  if (!Number.isFinite(exp) || !Number.isFinite(ref)) return 'Non-Perishable';
  const daysRemaining = Math.floor((exp - ref) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining <= 30) return 'Near Expiry (<= 30d)';
  return 'Fresh';
}

export function evaluateThreeWayMatch(
  po: PurchaseOrder,
  acceptedItems: { productId: string; acceptedQty: number }[],
  invoiceBilledAmount: number
): SupplierInvoiceRecord['threeWayMatchStatus'] {
  const acceptedMap = new Map(acceptedItems.map((i) => [i.productId, i.acceptedQty]));
  let grnAcceptedTotal = 0;
  let qtyMismatch = false;

  for (const item of po.items) {
    const acc = acceptedMap.get(item.productId) ?? item.receivedQty;
    if (acc !== item.orderedQty) {
      qtyMismatch = true;
    }
    grnAcceptedTotal += acc * item.unitCost;
  }

  if (Math.abs(Math.round(invoiceBilledAmount) - Math.round(grnAcceptedTotal)) > 5) {
    return 'Amount Variance';
  }
  if (qtyMismatch) {
    return 'Quantity Variance';
  }
  return 'Matched';
}

export function validateNewProductInput(
  existingProducts: ErpProduct[],
  input: {
    sku: string;
    barcode: string;
    name: string;
    sellingPrice: number;
    purchaseCost: number;
  },
  editingId?: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name.trim() || input.name.trim().length < 3) {
    errors.name = 'Product name must be at least 3 characters.';
  }
  if (!input.sku.trim()) {
    errors.sku = 'SKU is required.';
  } else if (
    existingProducts.some(
      (p) => p.id !== editingId && p.sku.toLowerCase() === input.sku.trim().toLowerCase()
    )
  ) {
    errors.sku = 'Duplicate SKU already exists in master catalogue.';
  }
  if (!input.barcode.trim() || input.barcode.trim().length < 6) {
    errors.barcode = 'Valid GTIN / barcode (minimum 6 characters) is required.';
  } else if (
    existingProducts.some(
      (p) => p.id !== editingId && p.barcode.toLowerCase() === input.barcode.trim().toLowerCase()
    )
  ) {
    errors.barcode = 'Duplicate barcode detected on another product.';
  }
  if (!Number.isFinite(input.sellingPrice) || input.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than PKR 0.';
  }
  if (!Number.isFinite(input.purchaseCost) || input.purchaseCost <= 0) {
    errors.purchaseCost = 'Purchase cost must be greater than PKR 0.';
  } else if (input.purchaseCost > input.sellingPrice) {
    errors.purchaseCost = 'Cost exceeds selling price — verify before saving.';
  }
  return errors;
}

export function computeDepartmentMargins(
  products: ErpProduct[],
  sales: PosSaleRecord[],
  branchId?: string
): {
  departmentId: string;
  departmentName: string;
  revenue: number;
  cogs: number;
  marginPercent: number;
  estMarginPercent: number;
  skuCount: number;
}[] {
  const inBranch = (bId: string) => !branchId || branchId === 'all' || bId === branchId;
  const prodMap = new Map(products.map((p) => [p.id, p]));
  const buckets = new Map<
    string,
    {
      departmentId: string;
      departmentName: string;
      revenue: number;
      cogs: number;
      skuCount: number;
      marginSum: number;
    }
  >();

  for (const p of products) {
    const cur = buckets.get(p.departmentId) || {
      departmentId: p.departmentId,
      departmentName: p.departmentName,
      revenue: 0,
      cogs: 0,
      skuCount: 0,
      marginSum: 0,
    };
    const mPct = p.sellingPrice > 0 ? ((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 100 : 0;
    cur.skuCount += 1;
    cur.marginSum += mPct;
    buckets.set(p.departmentId, cur);
  }

  for (const sale of sales.filter((s) => inBranch(s.branchId) && s.status !== 'Returned')) {
    for (const line of sale.items) {
      const prod = prodMap.get(line.productId);
      if (!prod) continue;
      const cur = buckets.get(prod.departmentId);
      if (cur) {
        cur.revenue += line.lineTotal;
        cur.cogs += prod.purchaseCost * line.quantity;
      }
    }
  }

  return Array.from(buckets.values())
    .map((b) => {
      const pct =
        b.revenue > 0
          ? Number((((b.revenue - b.cogs) / b.revenue) * 100).toFixed(1))
          : b.skuCount > 0
          ? Number((b.marginSum / b.skuCount).toFixed(1))
          : 0;
      return {
        departmentId: b.departmentId,
        departmentName: b.departmentName,
        revenue: b.revenue,
        cogs: b.cogs,
        skuCount: b.skuCount,
        marginPercent: pct,
        estMarginPercent: pct,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.marginPercent - a.marginPercent);
}

export function computeFinanceSummary(params: {
  sales: PosSaleRecord[];
  onlineOrdersRevenue: number;
  refundDeductions?: number;
  products: ErpProduct[];
  stock: BranchStockRecord[];
  expenses: BusinessExpense[];
  invoices: SupplierInvoiceRecord[];
  branchId?: string;
}) {
  const inBranch = (bId: string) =>
    !params.branchId || params.branchId === 'all' || bId === params.branchId;

  const salesFiltered = params.sales.filter((s) => inBranch(s.branchId));
  const completedSales = salesFiltered.filter((s) => s.status !== 'Returned');

  const posGrossSales = completedSales.reduce((sum, s) => sum + s.subtotal, 0);
  const posDiscounts = completedSales.reduce((sum, s) => sum + s.discountAmount, 0);
  const posNetSales = completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const cashTenderTotal = completedSales.reduce(
    (sum, s) => sum + (s.paymentMethod === 'Cash' ? s.grandTotal : s.paymentMethod === 'Split' ? s.cashReceived : 0),
    0
  );
  const cardTenderTotal = completedSales.reduce(
    (sum, s) => sum + (s.paymentMethod === 'Card' ? s.grandTotal : s.cardAmount || 0),
    0
  );

  const productMap = new Map(params.products.map((p) => [p.id, p]));
  let estimatedCogs = 0;
  for (const s of completedSales) {
    for (const line of s.items) {
      const prod = productMap.get(line.productId);
      if (prod) {
        estimatedCogs += prod.purchaseCost * line.quantity;
      }
    }
  }

  const inventoryValuation = params.stock
    .filter((st) => inBranch(st.branchId))
    .reduce((sum, st) => {
      const prod = productMap.get(st.productId);
      return sum + (prod ? prod.purchaseCost * st.onHand : 0);
    }, 0);

  const totalExpenses = params.expenses
    .filter((e) => inBranch(e.branchId))
    .reduce((sum, e) => sum + e.amount, 0);

  const unpaidPayables = params.invoices
    .filter((inv) => inBranch(inv.branchId) && inv.paymentStatus !== 'Paid')
    .reduce((sum, inv) => sum + inv.billedAmount, 0);

  const refundsDeducted = params.refundDeductions || 0;
  const totalRevenue = Math.max(0, posNetSales + params.onlineOrdersRevenue - refundsDeducted);
  const grossMarginAmount = Math.max(0, posNetSales - estimatedCogs);
  const grossMarginPercent =
    posNetSales > 0 ? Number(((grossMarginAmount / posNetSales) * 100).toFixed(1)) : 0;

  return {
    posGrossSales,
    posDiscounts,
    posNetSales,
    onlineOrdersRevenue: params.onlineOrdersRevenue,
    refundsDeducted,
    totalRevenue,
    cashTenderTotal,
    cardTenderTotal,
    estimatedCogs,
    grossMarginAmount,
    grossMarginPercent,
    inventoryValuation,
    totalExpenses,
    unpaidPayables,
  };
}
