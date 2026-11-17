import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { classifyExpiryStatus, getSellableStock } from '../../erp/calculations';
import type { ManagementModuleId } from '../../erp/types';
import { formatPKR } from '../../utils/commerce';
import type { ManagementBootstrapPayload } from './managementApi';

interface ManagementDashboardProps {
  data: ManagementBootstrapPayload;
  onSelectModule: (moduleId: ManagementModuleId) => void;
}

export function ManagementDashboard({ data, onSelectModule }: ManagementDashboardProps) {
  const { user, role } = data;
  const openShift = data.shifts.find(
    (s) => s.status === 'Open' && (role.branchRestricted ? s.cashierUserId === user.id : true)
  );
  const lowStockItems = data.stock.filter((st) => {
    const prod = data.products.find((p) => p.id === st.productId);
    return prod && getSellableStock(st) <= prod.reorderPoint;
  });
  const expiringSoonItems = data.stock.filter((st) => {
    const exp = classifyExpiryStatus(st.expiryDate, '2026-11-16');
    return exp === 'Expired' || exp === 'Near Expiry (<= 30d)';
  });
  const pendingApprovals = data.approvals.filter((a) => a.status === 'Pending');
  const activeWebOrders = data.onlineOrders.filter(
    (o) => !['Completed', 'Cancelled'].includes(o.stage)
  );

  // ==================== FRONTLINE CASHIER / SENIOR CASHIER ====================
  if (user.roleId === 'cashier' || user.roleId === 'senior_cashier') {
    const mySales = data.posSales.filter((s) => s.cashierUserId === user.id);
    return (
      <div className="space-y-6">
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Frontline Checkout Workspace · {data.activeBranchScope}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#1C1917]">
              Welcome, {user.fullName}
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              {openShift
                ? `Active register ${openShift.registerId} (${openShift.shiftNumber}) is open.`
                : 'No active shift open. Open a register float before scanning customer baskets.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectModule('pos')}
            className="px-5 py-3 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] inline-flex items-center gap-2 shrink-0"
          >
            <Receipt className="w-4 h-4" />
            <span>Open POS Billing Terminal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs font-medium text-[#57534E]">Register Expected Cash</p>
            <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">
              {openShift ? formatPKR(openShift.expectedCash) : 'PKR 0'}
            </p>
            <p className="mt-1 text-xs text-[#57534E]">
              Includes PKR {openShift ? openShift.openingFloat.toLocaleString() : 0} opening float
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs font-medium text-[#57534E]">Card Tender Collected</p>
            <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">
              {openShift ? formatPKR(openShift.cardSalesTotal) : 'PKR 0'}
            </p>
            <p className="mt-1 text-xs text-[#57534E]">Synced to register shift</p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
            <p className="text-xs font-medium text-[#57534E]">Receipts Issued (Demo)</p>
            <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">{mySales.length}</p>
            <p className="mt-1 text-xs text-[#57534E]">Max discount cap: {role.maxPosDiscountPercent}%</p>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917]">Recent Counter Receipts</h3>
            <button
              type="button"
              onClick={() => onSelectModule('staff')}
              className="text-xs font-semibold text-[#9B1C2E] hover:underline"
            >
              My Shift &amp; Leave &rarr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Receipt #</th>
                  <th className="py-2.5 px-4 font-semibold">Method</th>
                  <th className="py-2.5 px-4 font-semibold">Items</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {mySales.slice(0, 6).map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#1C1917]">
                      {s.receiptNumber}
                    </td>
                    <td className="py-2.5 px-4 text-[#57534E]">{s.paymentMethod}</td>
                    <td className="py-2.5 px-4 text-[#57534E]">
                      {s.items.reduce((a, b) => a + b.quantity, 0)} unit(s)
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                      {formatPKR(s.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==================== EXECUTIVE BOARD / FINANCE / OPS / TECHNICAL ====================
  const isExecutiveOrFinance = Boolean(data.financeSummary);
  const isExecutiveBoard = user.roleId === 'ceo' || user.roleId === 'owner_partner';

  const branchSalesTotals = data.branches
    .map((br) => {
      const brPos = data.posSales
        .filter((s) => s.branchId === br.id && s.status !== 'Returned')
        .reduce((sum, s) => sum + s.grandTotal, 0);
      const brOrders = data.onlineOrders
        .filter((o) => o.branchId === br.id && o.stage !== 'Cancelled' && o.paymentStatus !== 'Refunded')
        .reduce((sum, o) => sum + o.totalAmount, 0);
      return { branch: br, posRevenue: brPos, webRevenue: brOrders, total: brPos + brOrders };
    })
    .sort((a, b) => b.total - a.total);
  const topBranch = branchSalesTotals[0];

  const lowStockCategories = Array.from(
    lowStockItems.reduce((map, st) => {
      const prod = data.products.find((p) => p.id === st.productId);
      if (prod) map.set(prod.departmentName, (map.get(prod.departmentName) || 0) + 1);
      return map;
    }, new Map<string, number>())
  );

  const pendingCashVariances = data.shifts.filter((s) => s.status === 'Pending Reconciliation');
  const invoiceDiscrepancies = data.supplierInvoices.filter(
    (inv) => inv.threeWayMatchStatus !== 'Matched'
  );
  const openMaintenance = data.maintenanceTickets.filter((t) => t.status !== 'Verified Resolved');
  const syncAttentionCount = data.syncJobs.filter((j) => j.status === 'Attention Required').length;

  const frontlineTaskCards: { label: string; detail: string; module: ManagementModuleId }[] = [];
  if (user.roleId === 'order_picker') {
    frontlineTaskCards.push({
      label: `${activeWebOrders.length} Online Order(s) to Pick & Pack`,
      detail: 'Verify aisle bins, mark substitutions if needed, and hand over to dispatch.',
      module: 'orders',
    });
  }
  if (user.roleId === 'receiving_clerk') {
    const receivablePos = data.purchaseOrders.filter(
      (p) => p.status === 'Approved' || p.status === 'Partially Received'
    );
    const inTransit = data.stockTransfers.filter((t) => t.status === 'In Transit');
    frontlineTaskCards.push({
      label: `${receivablePos.length} Approved PO(s) Ready for GRN`,
      detail: 'Inspect incoming deliveries, log accepted vs damaged quantities.',
      module: 'purchasing',
    });
    frontlineTaskCards.push({
      label: `${inTransit.length} Inter-Branch Transfer(s) In Transit`,
      detail: 'Verify incoming transfer cartons at receiving dock.',
      module: 'inventory',
    });
  }
  if (user.roleId === 'sales_assistant') {
    frontlineTaskCards.push({
      label: `${lowStockItems.length} Shelf Replenishment Item(s)`,
      detail: 'Check price tags via Product Lookup and refill low-stock floor shelves.',
      module: 'products',
    });
    frontlineTaskCards.push({
      label: `${data.checklists.filter((c) => !c.completed).length} Opening / Closing Aisle Tasks`,
      detail: 'Complete daily supermarket floor checklist items.',
      module: 'branches',
    });
  }
  if (user.roleId === 'facilities_admin') {
    frontlineTaskCards.push({
      label: `${openMaintenance.length} Open Supermarket Equipment Ticket(s)`,
      detail: 'Maintain chillers, freezers, backup power, and checkout hardware.',
      module: 'branches',
    });
  }
  if (user.roleId === 'stock_controller') {
    frontlineTaskCards.push({
      label: `${expiringSoonItems.length} FEFO Expiry & ${data.cycleCounts.length} Cycle Count(s)`,
      detail: 'Replenish floor shelves from backroom warehouse and log cycle counts.',
      module: 'inventory',
    });
  }
  if (user.roleId === 'customer_service') {
    frontlineTaskCards.push({
      label: `${data.customerCases.filter((c) => c.status !== 'Resolved').length} Open Support Case(s)`,
      detail: 'Resolve order inquiries and submit return/refund requests with disposition.',
      module: 'customers',
    });
  }

  return (
    <div className="space-y-6">
      {/* Executive / Department Header */}
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
            {role.label} ·{' '}
            {data.activeBranchScope === 'all'
              ? 'Consolidated (Hyderabad & Karachi Branches)'
              : data.branches.find((b) => b.id === data.activeBranchScope)?.shortName ||
                data.activeBranchScope}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold text-[#1C1917]">
            {isExecutiveBoard
              ? 'Executive Supermarket Control Center'
              : `${role.label} Workspace`}
          </h2>
          <p className="mt-1 text-sm text-[#57534E]">{role.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {data.permittedModules.some((m) => m.id === 'settings') && pendingApprovals.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectModule('settings')}
              className="px-4 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center gap-2 whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Review {pendingApprovals.length} Pending Approvals</span>
            </button>
          )}
          {data.permittedModules.some((m) => m.id === 'orders') && (
            <button
              type="button"
              onClick={() => onSelectModule('orders')}
              className="px-4 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] whitespace-nowrap"
            >
              Online Orders ({activeWebOrders.length})
            </button>
          )}
        </div>
      </div>

      {/* Focused Daily Tasks Band for Task-Driven Frontline Roles */}
      {frontlineTaskCards.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frontlineTaskCards.map((task) => (
            <button
              key={task.label}
              type="button"
              onClick={() => onSelectModule(task.module)}
              className="text-left bg-[#FFFFFF] border border-[#E6E2DA] hover:border-[#9B1C2E] rounded-2xl p-5 flex items-center justify-between gap-4 transition-colors"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  My Daily Supermarket Task
                </p>
                <p className="mt-1 text-base font-bold text-[#1C1917]">{task.label}</p>
                <p className="mt-1 text-xs text-[#57534E]">{task.detail}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#9B1C2E] shrink-0" />
            </button>
          ))}
        </section>
      )}

      {/* Role-scoped KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isExecutiveOrFinance && data.financeSummary && (
          <>
            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-[#57534E]">
                <span>Net Retail Revenue (POS + Web)</span>
                <CreditCard className="w-4 h-4 text-[#9B1C2E]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">
                {formatPKR(data.financeSummary.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-[#57534E] tabular-nums">
                POS {formatPKR(data.financeSummary.posNetSales)} · Web{' '}
                {formatPKR(data.financeSummary.onlineOrdersRevenue)}
                {data.financeSummary.refundsDeducted > 0 &&
                  ` · Refunds -${formatPKR(data.financeSummary.refundsDeducted)}`}
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-[#57534E]">
                <span>Gross Margin &amp; Stock Valuation</span>
                <CheckCircle2 className="w-4 h-4 text-[#166534]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#166534] tabular-nums">
                {data.financeSummary.grossMarginPercent}%
              </p>
              <p className="mt-1 text-xs text-[#57534E] tabular-nums">
                Valuation: {formatPKR(data.financeSummary.inventoryValuation)} · Payables{' '}
                {formatPKR(data.financeSummary.unpaidPayables)}
              </p>
            </div>
          </>
        )}

        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#57534E]">
            <span>Stock &amp; FEFO Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-[#B45309]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">
            {lowStockItems.length + expiringSoonItems.length}
          </p>
          <p className="mt-1 text-xs text-[#57534E] tabular-nums">
            {lowStockItems.length} low stock · {expiringSoonItems.length} near-expiry/expired
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#57534E]">
            <span>Active Operations &amp; Approvals</span>
            <ShoppingCart className="w-4 h-4 text-[#9B1C2E]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1C1917] tabular-nums">
            {pendingApprovals.length} Pending
          </p>
          <p className="mt-1 text-xs text-[#57534E] tabular-nums">
            {activeWebOrders.length} active web orders · {pendingCashVariances.length} cash variances
          </p>
        </div>
      </div>

      {/* CEO / Owner Executive Reality Intelligence Band */}
      {isExecutiveBoard && data.financeSummary && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1917]">
                Department Margins &amp; Slow-Moving Stock
              </h3>
              <button
                type="button"
                onClick={() => onSelectModule('reports')}
                className="text-xs font-semibold text-[#9B1C2E] hover:underline"
              >
                Full BI Report &rarr;
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Department</th>
                    <th className="py-2 px-3 font-semibold text-right">POS Sales</th>
                    <th className="py-2 px-3 font-semibold text-right">Est. Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2DA]">
                  {data.departmentMargins.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-3 px-3 text-[#57534E]">
                        No settled POS sales recorded for this branch filter yet.
                      </td>
                    </tr>
                  ) : (
                    data.departmentMargins.slice(0, 6).map((dm) => (
                      <tr key={dm.departmentId || dm.departmentName}>
                        <td className="py-2 px-3 font-semibold text-[#1C1917]">{dm.departmentName}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatPKR(dm.revenue)}</td>
                        <td className="py-2 px-3 text-right font-bold tabular-nums text-[#166534]">
                          {dm.marginPercent}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="pt-2 border-t border-[#E6E2DA] text-xs space-y-1">
              <p className="font-bold text-[#1C1917]">
                Slow / Zero-Sale SKUs in Window ({data.slowMovingSkus.length})
              </p>
              <p className="text-[#57534E]">
                {data.slowMovingSkus.slice(0, 3).map((s) => `${s.name} (${s.stockUnits}u)`).join(' · ') ||
                  'All active SKUs moved today.'}
              </p>
              <p className="text-[#57534E]">
                Low-stock categories:{' '}
                <strong className="text-[#1C1917]">
                  {lowStockCategories.map(([cat, cnt]) => `${cat} (${cnt})`).join(', ') || 'None'}
                </strong>
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Financial Risk, Supplier 3-Way Match &amp; System Health
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => onSelectModule('finance')}
                className="text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#9B1C2E]"
              >
                <p className="text-[#57534E]">Top Performing Branch</p>
                <p className="mt-1 font-bold text-[#1C1917]">
                  {topBranch ? `${topBranch.branch.shortName}` : 'Hyderabad'}
                </p>
                <p className="mt-0.5 tabular-nums text-[#166534] font-semibold">
                  {topBranch ? formatPKR(topBranch.total) : 'PKR 0'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectModule('finance')}
                className="text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#9B1C2E]"
              >
                <p className="text-[#57534E]">Supplier GRN / 3-Way Variances</p>
                <p className="mt-1 font-bold text-[#9B1C2E] tabular-nums">
                  {invoiceDiscrepancies.length} Issue(s) · Payables {formatPKR(data.financeSummary.unpaidPayables)}
                </p>
                <p className="mt-0.5 text-[#57534E]">
                  {pendingCashVariances.length} unresolved shift variance(s)
                </p>
              </button>

              <button
                type="button"
                onClick={() => onSelectModule('settings')}
                className="text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#9B1C2E]"
              >
                <p className="text-[#57534E]">Pending High-Value Approvals</p>
                <p className="mt-1 font-bold text-[#1C1917] tabular-nums">
                  {pendingApprovals.length} Request(s)
                </p>
                <p className="mt-0.5 text-[#57534E]">Price changes, write-offs, POs &amp; refunds</p>
              </button>

              <button
                type="button"
                onClick={() => onSelectModule('settings')}
                className="text-left p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#9B1C2E]"
              >
                <p className="text-[#57534E]">Integration &amp; Equipment Sync</p>
                <p
                  className={`mt-1 font-bold ${
                    syncAttentionCount > 0 ? 'text-[#9B1C2E]' : 'text-[#166534]'
                  }`}
                >
                  {syncAttentionCount > 0
                    ? `${syncAttentionCount} Feed Attention Required`
                    : 'All Website Feeds Healthy'}
                </p>
                <p className="mt-0.5 text-[#57534E]">
                  {openMaintenance.length} open equipment ticket(s)
                </p>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Multi-Column Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Priority Action Queue */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Priority Action Queue ({data.priorityAlerts.length})
            </h3>
            <span className="text-[11px] text-[#57534E]">Click any exception to jump</span>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.priorityAlerts.length === 0 ? (
              <div className="p-6 text-sm text-[#57534E]">
                All operational queues within your scope are clear.
              </div>
            ) : (
              data.priorityAlerts.slice(0, 7).map((al) => (
                <button
                  key={al.id}
                  type="button"
                  onClick={() => onSelectModule(al.module)}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#FAF9F6] transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          al.priority === 'high'
                            ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                            : 'bg-[#B45309]/10 text-[#B45309]'
                        }`}
                      >
                        {al.priority}
                      </span>
                      <p className="text-xs font-bold text-[#1C1917] truncate">{al.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-[#57534E] truncate">{al.detail}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#57534E] shrink-0" />
                </button>
              ))
            )}
          </div>
        </section>

        {/* Quick Module Shortcuts & Branch Snapshot */}
        <section className="lg:col-span-5 space-y-5">
          {isExecutiveBoard && (
            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#1C1917] mb-3">
                Branch Performance Snapshot (Demo)
              </h3>
              <div className="space-y-2.5">
                {branchSalesTotals.map((row) => (
                  <div
                    key={row.branch.id}
                    className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1C1917] truncate">{row.branch.shortName}</p>
                      <p className="text-[11px] text-[#57534E]">{row.branch.city}</p>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <p className="text-xs font-bold text-[#1C1917]">{formatPKR(row.total)}</p>
                      <p className="text-[11px] text-[#57534E]">
                        POS {formatPKR(row.posRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#1C1917] mb-3">Permitted Workspaces</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {data.permittedModules
                .filter((m) => m.id !== 'dashboard')
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectModule(m.id)}
                    className="text-left p-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:border-[#9B1C2E] hover:bg-[#FFFFFF] transition-colors"
                  >
                    <p className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      {m.id === 'products' && <Package className="w-3.5 h-3.5 text-[#9B1C2E]" />}
                      {m.id === 'purchasing' && <Truck className="w-3.5 h-3.5 text-[#9B1C2E]" />}
                      {m.id === 'pos' && <Receipt className="w-3.5 h-3.5 text-[#9B1C2E]" />}
                      {m.id !== 'products' && m.id !== 'purchasing' && m.id !== 'pos' && (
                        <ClipboardList className="w-3.5 h-3.5 text-[#9B1C2E]" />
                      )}
                      <span>{m.shortLabel}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#57534E] line-clamp-1">{m.description}</p>
                  </button>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
