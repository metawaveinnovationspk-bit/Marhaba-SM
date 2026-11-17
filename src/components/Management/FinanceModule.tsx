import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, FileCheck2, ReceiptText } from 'lucide-react';
import { hasPermission } from '../../erp/permissions';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface FinanceModuleProps {
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

export function FinanceModule({ data, onRefresh }: FinanceModuleProps) {
  const [expBranch, setExpBranch] = useState(
    data.activeBranchScope === 'all' ? 'hyderabad' : data.activeBranchScope
  );
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const canVerifyShift = hasPermission(data.user.roleId, 'finance', 'verify');
  const canPreparePay = hasPermission(data.user.roleId, 'finance', 'submit');
  const canApprovePay = hasPermission(data.user.roleId, 'finance', 'approve');
  const canCreateExp = hasPermission(data.user.roleId, 'finance', 'create');

  const handleReconcile = async (shiftId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.reconcileShift(shiftId);
      setFeedback({ type: 'ok', text: `Shift ${res.shift.shiftNumber} reconciled & closed.` });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Reconciliation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleReconcileBank = async (bankId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.reconcileBankSettlement(bankId);
      setFeedback({
        type: 'ok',
        text: `Bank batch ${res.bankSettlement.batchRef} reconciled (${res.bankSettlement.status}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Bank reconciliation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePrepareInvoice = async (invId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.prepareSupplierInvoice(invId);
      setFeedback({
        type: 'ok',
        text: `Invoice ${res.invoice.invoiceNumber} prepared for payment release.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Preparation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePayInvoice = async (invId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.paySupplierInvoice(invId);
      setFeedback({
        type: 'ok',
        text: `Supplier invoice ${res.invoice.invoiceNumber} marked Paid.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Payment blocked.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.recordExpense({
        branchId: expBranch,
        category: expCategory,
        description: expDesc,
        amount: Number(expAmount),
      });
      setExpDesc('');
      setExpAmount('');
      setFeedback({ type: 'ok', text: 'Branch operating expense posted.' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Could not post expense.' });
    } finally {
      setBusy(false);
    }
  };

  const summary = data.financeSummary;

  return (
    <div className="space-y-6">
      <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E6E2DA] text-xs text-[#57534E] flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Financial &amp; Tax Disclosure:</strong> Demonstration ledger figures in PKR. Tax profiles are configurable placeholders (no live FBR fiscal/POS gateway connected).
        </span>
        <span className="font-semibold text-[#1C1917]">3-Way PO / GRN / Invoice Match Active</span>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-[#166534]/8 border-[#166534]/25 text-[#166534]'
              : 'bg-[#9B1C2E]/8 border-[#9B1C2E]/25 text-[#9B1C2E]'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-4">
            <p className="text-xs text-[#57534E]">Cash vs Card Tender (POS)</p>
            <p className="mt-1.5 text-lg font-bold text-[#1C1917] tabular-nums">
              {formatPKR(summary.cashTenderTotal)} / {formatPKR(summary.cardTenderTotal)}
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-4">
            <p className="text-xs text-[#57534E]">Gross Margin (Est. COGS)</p>
            <p className="mt-1.5 text-lg font-bold text-[#166534] tabular-nums">
              {formatPKR(summary.grossMarginAmount)} ({summary.grossMarginPercent}%)
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-4">
            <p className="text-xs text-[#57534E]">Unpaid Supplier Payables</p>
            <p className="mt-1.5 text-lg font-bold text-[#9B1C2E] tabular-nums">
              {formatPKR(summary.unpaidPayables)}
            </p>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-4">
            <p className="text-xs text-[#57534E]">Stock Cost Valuation</p>
            <p className="mt-1.5 text-lg font-bold text-[#1C1917] tabular-nums">
              {formatPKR(summary.inventoryValuation)}
            </p>
          </div>
        </div>
      )}

      {/* Cashier Shift Cash Variance Reconciliation */}
      <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#9B1C2E]" />
            <span>Cashier Shift Closings &amp; Variance Settlement</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Shift #</th>
                <th className="py-2.5 px-4 font-semibold">Cashier</th>
                <th className="py-2.5 px-4 font-semibold text-right">Expected Cash</th>
                <th className="py-2.5 px-4 font-semibold text-right">Declared</th>
                <th className="py-2.5 px-4 font-semibold text-right">Variance</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]">
              {data.shifts.map((sh) => (
                <tr key={sh.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-2.5 px-4 font-mono font-semibold text-[#1C1917]">
                    {sh.shiftNumber}
                  </td>
                  <td className="py-2.5 px-4 text-[#57534E]">{sh.cashierName}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {formatPKR(sh.expectedCash)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {sh.declaredCash !== undefined ? formatPKR(sh.declaredCash) : '—'}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums ${
                      (sh.variance ?? 0) < 0 ? 'text-[#9B1C2E]' : 'text-[#166534]'
                    }`}
                  >
                    {sh.variance !== undefined ? formatPKR(sh.variance) : '—'}
                  </td>
                  <td className="py-2.5 px-4 font-semibold">{sh.status}</td>
                  <td className="py-2.5 px-4 text-right">
                    {sh.status === 'Pending Reconciliation' && canVerifyShift && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReconcile(sh.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#9B1C2E] text-white font-semibold hover:bg-[#7F1524] whitespace-nowrap"
                      >
                        Reconcile &amp; Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bank & Card Settlement Batches */}
      <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1C1917]">
            Bank &amp; Card Settlement Reconciliation ({data.bankSettlements.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Batch Ref</th>
                <th className="py-2.5 px-4 font-semibold">Branch &amp; Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">POS Card Expected</th>
                <th className="py-2.5 px-4 font-semibold text-right">Bank Settled</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]">
              {data.bankSettlements.map((bnk) => (
                <tr key={bnk.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-2.5 px-4 font-mono font-semibold text-[#1C1917]">{bnk.batchRef}</td>
                  <td className="py-2.5 px-4 text-[#57534E]">
                    {bnk.branchId} · {bnk.date}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {formatPKR(bnk.posCardExpected)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {formatPKR(bnk.bankSettledAmount)}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        bnk.status === 'Matched'
                          ? 'bg-[#166534]/10 text-[#166534]'
                          : 'bg-[#B45309]/10 text-[#B45309]'
                      }`}
                    >
                      {bnk.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {bnk.status !== 'Matched' && canVerifyShift && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReconcileBank(bnk.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#1C1917] text-white font-semibold hover:bg-[#292524] whitespace-nowrap"
                      >
                        Verify Settlement
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Supplier Invoices & 3-Way Match */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#9B1C2E]" />
              <span>Supplier Invoices &amp; 3-Way Match</span>
            </h3>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.supplierInvoices.map((inv) => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-mono font-bold text-[#1C1917]">
                    {inv.invoiceNumber} · {inv.poNumber}
                  </p>
                  <p className="mt-0.5 text-[#57534E]">
                    Billed: {formatPKR(inv.billedAmount)} vs GRN Accepted: {formatPKR(inv.grnAcceptedAmount)}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      inv.threeWayMatchStatus === 'Matched'
                        ? 'bg-[#166534]/10 text-[#166534]'
                        : 'bg-[#B45309]/10 text-[#B45309]'
                    }`}
                  >
                    {inv.threeWayMatchStatus}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#57534E]">{inv.paymentStatus}</span>
                  {inv.paymentStatus === 'Unpaid' && canPreparePay && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePrepareInvoice(inv.id)}
                      className="px-3 py-1.5 rounded-lg border border-[#1C1917] text-[#1C1917] font-semibold hover:bg-[#FAF9F6] whitespace-nowrap"
                    >
                      Prepare Batch
                    </button>
                  )}
                  {inv.paymentStatus !== 'Paid' && canApprovePay && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePayInvoice(inv.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#1C1917] text-white font-semibold hover:bg-[#292524] whitespace-nowrap"
                    >
                      Release Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Branch Operating Expenses */}
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#9B1C2E]" />
            <span>Operating Expenses</span>
          </h3>

          {canCreateExp && (
            <form onSubmit={handleRecordExpense} className="space-y-2.5 pb-4 border-b border-[#E6E2DA]">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expBranch}
                  onChange={(e) => setExpBranch(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}
                    </option>
                  ))}
                </select>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Store Maintenance">Store Maintenance</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Packaging Supplies">Packaging Supplies</option>
                  <option value="Staff Welfare">Staff Welfare</option>
                </select>
              </div>
              <input
                type="text"
                required
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Expense description"
                className="w-full h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="Amount (PKR)"
                  className="flex-1 h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="h-9 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold"
                >
                  Record
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-[#E6E2DA] text-xs">
            {data.expenses.map((ex) => (
              <div key={ex.id} className="py-2.5 flex justify-between gap-2">
                <div>
                  <p className="font-semibold text-[#1C1917]">{ex.description}</p>
                  <p className="text-[11px] text-[#57534E]">
                    {ex.branchId} · {ex.category} · {ex.date}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums shrink-0">
                  {formatPKR(ex.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
