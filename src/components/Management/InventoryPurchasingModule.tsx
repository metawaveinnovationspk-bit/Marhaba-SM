import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, ClipboardCheck, PackageCheck, Truck } from 'lucide-react';
import { classifyExpiryStatus, getSellableStock } from '../../erp/calculations';
import { hasPermission } from '../../erp/permissions';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface InventoryPurchasingModuleProps {
  mode: 'inventory' | 'purchasing';
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

export function InventoryPurchasingModule({
  mode,
  data,
  onRefresh,
}: InventoryPurchasingModuleProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'expiry'>('all');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Stock Transfer Form
  const [trProductId, setTrProductId] = useState(data.products[0]?.id || '');
  const [trFromBranch, setTrFromBranch] = useState('hyderabad');
  const [trToBranch, setTrToBranch] = useState('karachi-p10');
  const [trQty, setTrQty] = useState('5');

  // Stock Adjustment Form
  const [adjProductId, setAdjProductId] = useState(data.products[0]?.id || '');
  const [adjBranch, setAdjBranch] = useState(
    data.activeBranchScope === 'all' ? 'hyderabad' : data.activeBranchScope
  );
  const [adjDelta, setAdjDelta] = useState('-2');
  const [adjReason, setAdjReason] = useState('');

  // Purchasing PO Form
  const [poBranch, setPoBranch] = useState('hyderabad');
  const [poProductId, setPoProductId] = useState(data.products[0]?.id || '');
  const [poQty, setPoQty] = useState('25');

  // Partial GRN State
  const [grnPoId, setGrnPoId] = useState(
    data.purchaseOrders.find((p) => p.status === 'Approved' || p.status === 'Partially Received')
      ?.id || ''
  );
  const [grnAccepted, setGrnAccepted] = useState('10');
  const [grnDamaged, setGrnDamaged] = useState('1');
  const [grnNote, setGrnNote] = useState('');

  const productMap = useMemo(() => new Map(data.products.map((p) => [p.id, p])), [data.products]);
  const supplierMap = useMemo(() => new Map(data.suppliers.map((s) => [s.id, s])), [data.suppliers]);

  const canCreateInv = hasPermission(data.user.roleId, 'inventory', 'create');
  const canCreatePo = hasPermission(data.user.roleId, 'purchasing', 'create');
  const canVerifyGrn = hasPermission(data.user.roleId, 'purchasing', 'verify');

  const stockRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.stock.filter((st) => {
      const prod = productMap.get(st.productId);
      if (!prod) return false;
      const sellable = getSellableStock(st);
      const exp = classifyExpiryStatus(st.expiryDate, '2026-11-16');
      if (filterMode === 'low' && sellable > prod.reorderPoint) return false;
      if (filterMode === 'expiry' && exp !== 'Expired' && exp !== 'Near Expiry (<= 30d)') {
        return false;
      }
      if (!q) return true;
      return (
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        st.locationCode.toLowerCase().includes(q)
      );
    });
  }, [data.stock, productMap, search, filterMode]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.transferStock({
        productId: trProductId,
        fromBranchId: trFromBranch,
        toBranchId: trToBranch,
        quantity: Number(trQty),
      });
      setFeedback({
        type: 'ok',
        text: `Transfer ${res.transferRef} dispatched (${trFromBranch} -> ${trToBranch}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Transfer failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.adjustStock({
        productId: adjProductId,
        branchId: adjBranch,
        delta: Number(adjDelta),
        reason: adjReason,
      });
      setAdjReason('');
      setFeedback({
        type: 'ok',
        text: res.pendingApproval
          ? res.message || 'Stock adjustment queued for independent approval.'
          : 'Stock adjustment posted to ledger.',
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Adjustment failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productMap.get(poProductId);
    if (!prod) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.createPurchaseOrder({
        branchId: poBranch,
        supplierId: prod.supplierId,
        productId: poProductId,
        quantity: Number(poQty),
      });
      setFeedback({
        type: 'ok',
        text: `PO ${res.purchaseOrder.poNumber} created (${res.purchaseOrder.status}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'PO creation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePostGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    const po = data.purchaseOrders.find((p) => p.id === grnPoId);
    if (!po || !po.items[0]) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.postGrn({
        poId: po.id,
        items: [
          {
            productId: po.items[0].productId,
            acceptedQty: Number(grnAccepted),
            damagedQty: Number(grnDamaged),
          },
        ],
        discrepancyNote: grnNote,
      });
      setGrnNote('');
      setFeedback({
        type: 'ok',
        text: `GRN ${res.grn.grnNumber} posted. PO status: ${res.po.status}.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'GRN failed.' });
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'purchasing') {
    const receivablePos = data.purchaseOrders.filter(
      (p) => p.status === 'Approved' || p.status === 'Partially Received'
    );
    return (
      <div className="space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'ok'
                ? 'bg-[#166534]/8 border-[#166534]/25 text-[#166534]'
                : 'bg-[#9B1C2E]/8 border-[#9B1C2E]/25 text-[#9B1C2E]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Suppliers & POs */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1C1917]">
                  Purchase Orders &amp; Delivery Status ({data.purchaseOrders.length})
                </h2>
                <Truck className="w-4 h-4 text-[#9B1C2E]" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">PO #</th>
                      <th className="py-2.5 px-4 font-semibold">Supplier</th>
                      <th className="py-2.5 px-4 font-semibold">Received / Ordered</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]">
                    {data.purchaseOrders.map((po) => {
                      const sup = supplierMap.get(po.supplierId);
                      const firstLine = po.items[0];
                      return (
                        <tr key={po.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-2.5 px-4 font-mono font-bold text-[#1C1917]">
                            {po.poNumber}
                            <p className="text-[10px] font-normal text-[#57534E]">{po.branchId}</p>
                          </td>
                          <td className="py-2.5 px-4 text-[#57534E]">{sup?.name || po.supplierId}</td>
                          <td className="py-2.5 px-4 font-mono">
                            {firstLine ? `${firstLine.receivedQty} / ${firstLine.orderedQty}` : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#E6E2DA] text-[11px] font-semibold">
                              {po.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                            {formatPKR(po.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA]">
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Goods Receipt Notes (GRN) &amp; Verified Suppliers
                </h3>
              </div>
              <div className="divide-y divide-[#E6E2DA]">
                {data.goodsReceipts.map((g) => (
                  <div key={g.id} className="p-4 text-xs">
                    <div className="flex justify-between font-bold text-[#1C1917]">
                      <span className="font-mono">{g.grnNumber}</span>
                      <span>PO: {g.poNumber}</span>
                    </div>
                    <p className="mt-1 text-[#57534E]">
                      Received by {g.receivedByName} · Accepted {g.items[0]?.acceptedQty} · Damaged{' '}
                      {g.items[0]?.damagedQty}
                    </p>
                    {g.discrepancyNote && (
                      <p className="mt-1 text-[11px] text-[#B45309]">{g.discrepancyNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Create PO & Post Partial GRN */}
          <div className="lg:col-span-5 space-y-5">
            {canVerifyGrn && (
              <form
                onSubmit={handlePostGrn}
                className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#166534]" />
                  <span>Post Inbound GRN (Supports Partial &amp; Damaged)</span>
                </h3>
                <select
                  value={grnPoId}
                  onChange={(e) => setGrnPoId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {receivablePos.length === 0 && <option value="">No approved POs awaiting GRN</option>}
                  {receivablePos.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.branchId} ({po.status})
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                      Accepted Units
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={grnAccepted}
                      onChange={(e) => setGrnAccepted(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                      Damaged / Quarantine
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={grnDamaged}
                      onChange={(e) => setGrnDamaged(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={grnNote}
                  onChange={(e) => setGrnNote(e.target.value)}
                  placeholder="Discrepancy / carton inspection note"
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <button
                  type="submit"
                  disabled={busy || !grnPoId}
                  className="w-full h-10 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#14532D] disabled:opacity-45"
                >
                  Verify &amp; Post GRN to Branch Stock
                </button>
              </form>
            )}

            {canCreatePo && (
              <form
                onSubmit={handleCreatePo}
                className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#1C1917]">Raise New Purchase Order</h3>
                <select
                  value={poBranch}
                  onChange={(e) => setPoBranch(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.shortName}
                    </option>
                  ))}
                </select>
                <select
                  value={poProductId}
                  onChange={(e) => setPoProductId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={poQty}
                  onChange={(e) => setPoQty(e.target.value)}
                  placeholder="Order quantity"
                  className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-10 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
                >
                  Submit Purchase Order
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter SKU, product, or aisle location (e.g. HYD-A01)..."
            className="flex-1 min-w-[220px] h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
          />
          {(['all', 'low', 'expiry'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterMode(f)}
              className={`h-10 px-3 rounded-lg text-xs font-semibold border ${
                filterMode === f
                  ? 'border-[#9B1C2E] bg-[#9B1C2E]/8 text-[#9B1C2E]'
                  : 'border-[#E6E2DA] text-[#57534E]'
              }`}
            >
              {f === 'all' ? 'All Batches' : f === 'low' ? 'Low Stock' : 'Near Expiry / Expired'}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#57534E] font-medium">
          FEFO Expiry Policy Active · {stockRows.length} branch records
        </span>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            feedback.type === 'ok'
              ? 'bg-[#166534]/8 border-[#166534]/25 text-[#166534]'
              : 'bg-[#9B1C2E]/8 border-[#9B1C2E]/25 text-[#9B1C2E]'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {canCreateInv && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <form
            onSubmit={handleTransfer}
            className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#9B1C2E]" />
              <span>Inter-Branch Stock Transfer</span>
            </h3>
            <select
              value={trProductId}
              onChange={(e) => setTrProductId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            >
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={trFromBranch}
                onChange={(e) => setTrFromBranch(e.target.value)}
                className="h-10 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    From: {b.id}
                  </option>
                ))}
              </select>
              <select
                value={trToBranch}
                onChange={(e) => setTrToBranch(e.target.value)}
                className="h-10 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                {data.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    To: {b.id}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={trQty}
                onChange={(e) => setTrQty(e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="h-9 px-4 rounded-lg bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#292524]"
            >
              Dispatch Stock Transfer
            </button>
          </form>

          <form
            onSubmit={handleAdjustment}
            className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#B45309]" />
              <span>Reasoned Stock Adjustment / Write-Off Request</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={adjProductId}
                onChange={(e) => setAdjProductId(e.target.value)}
                className="sm:col-span-2 h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={adjDelta}
                onChange={(e) => setAdjDelta(e.target.value)}
                placeholder="Delta e.g. -3"
                className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Mandatory audit reason (e.g. Chiller breakage / cycle count)"
                className="flex-1 h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              />
              <button
                type="submit"
                disabled={busy}
                className="h-10 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] whitespace-nowrap"
              >
                Submit Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Ledger Table */}
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
              <tr>
                <th className="py-3 px-4 font-semibold">Branch &amp; Bin</th>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold text-right">On Hand</th>
                <th className="py-3 px-4 font-semibold text-right">Reserved</th>
                <th className="py-3 px-4 font-semibold text-right">Sellable</th>
                <th className="py-3 px-4 font-semibold text-right">Damaged / Transit</th>
                <th className="py-3 px-4 font-semibold">Batch &amp; FEFO Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]">
              {stockRows.slice(0, 40).map((st) => {
                const prod = productMap.get(st.productId);
                if (!prod) return null;
                const sellable = getSellableStock(st);
                const expStatus = classifyExpiryStatus(st.expiryDate, '2026-11-16');
                return (
                  <tr key={`${st.branchId}-${st.productId}`} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-mono">
                      <p className="font-semibold text-[#1C1917]">{st.locationCode}</p>
                      <p className="text-[10px] text-[#57534E]">{st.branchId}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-[#1C1917]">{prod.name}</p>
                      <p className="text-[11px] font-mono text-[#57534E]">{prod.sku}</p>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{st.onHand}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#B45309]">
                      {st.reserved}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono font-bold tabular-nums ${
                        sellable <= prod.reorderPoint ? 'text-[#9B1C2E]' : 'text-[#166534]'
                      }`}
                    >
                      {sellable}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                      {st.damaged} / {st.inTransit}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-[11px] text-[#57534E] mr-2">
                        {st.batchNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          expStatus === 'Expired'
                            ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                            : expStatus === 'Near Expiry (<= 30d)'
                            ? 'bg-[#B45309]/10 text-[#B45309]'
                            : 'bg-[#FAF9F6] text-[#57534E]'
                        }`}
                      >
                        {st.expiryDate ? `${expStatus} (${st.expiryDate})` : 'Non-Perishable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
