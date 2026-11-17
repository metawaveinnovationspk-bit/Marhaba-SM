import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpDown,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  PackageCheck,
  Scale,
  Truck,
} from 'lucide-react';
import { classifyExpiryStatus, getSellableStock } from '../../erp/calculations';
import { hasPermission } from '../../erp/permissions';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface InventoryPurchasingModuleProps {
  mode: 'inventory' | 'purchasing';
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

const STOCK_PAGE_SIZE = 15;
const PO_PAGE_SIZE = 10;

export function InventoryPurchasingModule({
  mode,
  data,
  onRefresh,
}: InventoryPurchasingModuleProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'expiry'>('all');
  const [stockSortKey, setStockSortKey] = useState<'branch' | 'product' | 'onHand' | 'sellable'>(
    'branch'
  );
  const [stockSortDir, setStockSortDir] = useState<'asc' | 'desc'>('asc');
  const [stockPage, setStockPage] = useState(1);
  const [poPage, setPoPage] = useState(1);

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const defaultBranch = data.activeBranchScope === 'all' ? 'hyderabad' : data.activeBranchScope;

  // Putaway Form (Backroom Warehouse -> Sales Floor)
  const [putProductId, setPutProductId] = useState(data.products[0]?.id || '');
  const [putBranch, setPutBranch] = useState(defaultBranch);
  const [putQty, setPutQty] = useState('4');
  const [putLocation, setPutLocation] = useState('');

  // Stock Transfer Form
  const [trProductId, setTrProductId] = useState(data.products[0]?.id || '');
  const [trFromBranch, setTrFromBranch] = useState('hyderabad');
  const [trToBranch, setTrToBranch] = useState('karachi-p10');
  const [trQty, setTrQty] = useState('5');

  // Transfer Receipt Variance State
  const [trReceiveQty, setTrReceiveQty] = useState<Record<string, string>>({});
  const [trDamagedQty, setTrDamagedQty] = useState<Record<string, string>>({});
  const [trVarianceNote, setTrVarianceNote] = useState<Record<string, string>>({});

  // Physical Cycle Count Form
  const [cntProductId, setCntProductId] = useState(data.products[0]?.id || '');
  const [cntBranch, setCntBranch] = useState(defaultBranch);
  const [cntPhysicalQty, setCntPhysicalQty] = useState('18');
  const [cntNotes, setCntNotes] = useState('');

  // Stock Adjustment Form
  const [adjProductId, setAdjProductId] = useState(data.products[0]?.id || '');
  const [adjBranch, setAdjBranch] = useState(defaultBranch);
  const [adjDelta, setAdjDelta] = useState('-2');
  const [adjReason, setAdjReason] = useState('');

  // Purchasing PO Form
  const [poBranch, setPoBranch] = useState(defaultBranch);
  const [poProductId, setPoProductId] = useState(data.products[0]?.id || '');
  const [poQty, setPoQty] = useState('25');

  // PR -> PO supplier override
  const [prSupplierOverride, setPrSupplierOverride] = useState<Record<string, string>>({});

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
  const canVerifyInv = hasPermission(data.user.roleId, 'inventory', 'verify');
  const canCreatePo = hasPermission(data.user.roleId, 'purchasing', 'create');
  const canVerifyGrn = hasPermission(data.user.roleId, 'purchasing', 'verify');

  const stockRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = data.stock.filter((st) => {
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

    return [...filtered].sort((a, b) => {
      const prodA = productMap.get(a.productId);
      const prodB = productMap.get(b.productId);
      let cmp = 0;
      if (stockSortKey === 'branch') {
        cmp = `${a.branchId}-${a.locationCode}`.localeCompare(`${b.branchId}-${b.locationCode}`);
      } else if (stockSortKey === 'product') {
        cmp = (prodA?.name || '').localeCompare(prodB?.name || '');
      } else if (stockSortKey === 'onHand') {
        cmp = a.onHand - b.onHand;
      } else {
        cmp = getSellableStock(a) - getSellableStock(b);
      }
      return stockSortDir === 'asc' ? cmp : -cmp;
    });
  }, [data.stock, productMap, search, filterMode, stockSortKey, stockSortDir]);

  const totalStockPages = Math.max(1, Math.ceil(stockRows.length / STOCK_PAGE_SIZE));
  const safeStockPage = Math.min(stockPage, totalStockPages);
  const pagedStockRows = stockRows.slice(
    (safeStockPage - 1) * STOCK_PAGE_SIZE,
    safeStockPage * STOCK_PAGE_SIZE
  );

  const totalPoPages = Math.max(1, Math.ceil(data.purchaseOrders.length / PO_PAGE_SIZE));
  const safePoPage = Math.min(poPage, totalPoPages);
  const pagedPos = data.purchaseOrders.slice(
    (safePoPage - 1) * PO_PAGE_SIZE,
    safePoPage * PO_PAGE_SIZE
  );

  const toggleSort = (key: typeof stockSortKey) => {
    if (stockSortKey === key) {
      setStockSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStockSortKey(key);
      setStockSortDir('asc');
    }
    setStockPage(1);
  };

  const handlePutaway = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.putawayStock({
        productId: putProductId,
        branchId: putBranch,
        quantity: Number(putQty),
        locationCode: putLocation || undefined,
      });
      setPutLocation('');
      setFeedback({
        type: 'ok',
        text: `Replenished ${putQty} units to Sales Floor (${res.stockRec.locationCode}). Floor qty: ${res.stockRec.floorQty}, Warehouse: ${res.stockRec.warehouseQty}.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Putaway failed.' });
    } finally {
      setBusy(false);
    }
  };

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

  const handleReceiveTransfer = async (
    trfId: string,
    dispatchedQty: number,
    withVarianceInput: boolean
  ) => {
    setBusy(true);
    setFeedback(null);
    try {
      const recQty = withVarianceInput
        ? Number(trReceiveQty[trfId] ?? dispatchedQty)
        : dispatchedQty;
      const dmgQty = withVarianceInput ? Number(trDamagedQty[trfId] ?? 0) : 0;
      const note = withVarianceInput ? trVarianceNote[trfId] || '' : '';
      const res = await managementApi.receiveStockTransfer(trfId, {
        receivedQty: recQty,
        damagedQty: dmgQty,
        varianceNote: note,
      });
      setFeedback({
        type: 'ok',
        text: `Transfer ${res.transfer.transferRef} received (${res.transfer.status}: ${res.transfer.receivedQty}/${res.transfer.dispatchedQty} ok, ${res.transfer.damagedInTransitQty} damaged).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Transfer receipt denied.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCycleCount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.submitCycleCount({
        productId: cntProductId,
        branchId: cntBranch,
        physicalQty: Number(cntPhysicalQty),
        notes: cntNotes,
      });
      setCntNotes('');
      setFeedback({
        type: 'ok',
        text:
          res.cycleCount.variance === 0
            ? `Cycle count verified exact match (${res.cycleCount.physicalQty} units).`
            : `Cycle count recorded variance (${res.cycleCount.variance > 0 ? '+' : ''}${res.cycleCount.variance} units) and queued for independent write-off approval.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Cycle count submission failed.',
      });
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

  const handleConvertPr = async (prId: string, defaultSupplierId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const supId = prSupplierOverride[prId] || defaultSupplierId;
      const res = await managementApi.convertRequisitionToPo(prId, supId);
      setFeedback({
        type: 'ok',
        text: `Converted ${res.requisition.id} into ${res.purchaseOrder.poNumber} (${res.purchaseOrder.status}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'PR conversion failed.',
      });
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
    const convertiblePrs = data.requisitions.filter(
      (r) => r.status === 'Approved' || r.status === 'Pending Approval'
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

        {/* Approved Requisitions Conversion Queue */}
        {convertiblePrs.length > 0 && (
          <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#9B1C2E]" />
                <span>Approved Requisitions Awaiting PO Conversion ({convertiblePrs.length})</span>
              </h2>
            </div>
            <div className="divide-y divide-[#E6E2DA]">
              {convertiblePrs.map((pr) => {
                const line = pr.items[0];
                const prod = line ? productMap.get(line.productId) : undefined;
                return (
                  <div
                    key={pr.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1C1917]">{pr.id}</span>
                        <span className="px-2 py-0.5 rounded bg-[#166534]/10 text-[#166534] text-[10px] font-semibold">
                          {pr.status}
                        </span>
                        <span className="text-[#57534E]">· Branch: {pr.branchId}</span>
                      </div>
                      <p className="mt-1 font-medium text-[#1C1917]">
                        {prod?.name || line?.productId} — Qty: {line?.quantity} · Requested by{' '}
                        {pr.requestedByName}
                      </p>
                      <p className="text-[#57534E]">{pr.notes}</p>
                    </div>
                    {canCreatePo && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <select
                          value={prSupplierOverride[pr.id] || pr.supplierId}
                          onChange={(e) =>
                            setPrSupplierOverride((prev) => ({ ...prev, [pr.id]: e.target.value }))
                          }
                          aria-label={`Supplier for ${pr.id}`}
                          className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                        >
                          {data.suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} ({sup.onTimeRatePercent}% on-time)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleConvertPr(pr.id, pr.supplierId)}
                          className="h-9 px-3.5 rounded-lg bg-[#9B1C2E] text-white font-semibold hover:bg-[#7F1524] disabled:opacity-45"
                        >
                          Convert to PO
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
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
                    {pagedPos.map((po) => {
                      const sup = supplierMap.get(po.supplierId);
                      const firstLine = po.items[0];
                      return (
                        <tr key={po.id} className="hover:bg-[#FAF9F6]">
                          <td className="py-2.5 px-4 font-mono font-bold text-[#1C1917]">
                            {po.poNumber}
                            <p className="text-[10px] font-normal text-[#57534E]">
                              {po.branchId}
                              {po.requisitionId ? ` · from ${po.requisitionId}` : ''}
                            </p>
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
                    {pagedPos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#57534E]">
                          No purchase orders in current branch scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data.purchaseOrders.length > PO_PAGE_SIZE && (
                <div className="px-4 py-3 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#57534E]">
                  <span>
                    Showing {(safePoPage - 1) * PO_PAGE_SIZE + 1}–
                    {Math.min(safePoPage * PO_PAGE_SIZE, data.purchaseOrders.length)} of{' '}
                    {data.purchaseOrders.length} POs
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safePoPage <= 1}
                      onClick={() => setPoPage((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono">
                      {safePoPage}/{totalPoPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePoPage >= totalPoPages}
                      onClick={() => setPoPage((p) => Math.min(totalPoPages, p + 1))}
                      className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Supplier Directory & Performance */}
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#9B1C2E]" />
                  <span>Supplier Directory &amp; SLA Comparison ({data.suppliers.length})</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Supplier</th>
                      <th className="py-2.5 px-4 font-semibold">Terms</th>
                      <th className="py-2.5 px-4 font-semibold text-right">On-Time SLA</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Quality Score</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA]">
                    {data.suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#1C1917]">{sup.name}</p>
                          <p className="text-[10px] font-mono text-[#57534E]">
                            {sup.code} · {sup.city}
                          </p>
                        </td>
                        <td className="py-2.5 px-4 font-mono">{sup.paymentTermsDays}d</td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#166534]">
                          {sup.onTimeRatePercent}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          {sup.qualityScorePercent}%
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              sup.status === 'Active'
                                ? 'bg-[#166534]/10 text-[#166534]'
                                : 'bg-[#B45309]/10 text-[#B45309]'
                            }`}
                          >
                            {sup.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E6E2DA]">
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Goods Receipt Notes (GRN) &amp; Verified Deliveries
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
            onChange={(e) => {
              setSearch(e.target.value);
              setStockPage(1);
            }}
            placeholder="Filter SKU, product, or aisle location (e.g. HYD-A01)..."
            className="flex-1 min-w-[220px] h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
          />
          {(['all', 'low', 'expiry'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilterMode(f);
                setStockPage(1);
              }}
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

      {/* Operations Grid: Putaway, Inter-Branch Transfer, Physical Cycle Count, Adjustment */}
      {(canCreateInv || canVerifyInv) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {canCreateInv && (
            <form
              onSubmit={handlePutaway}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#166534]" />
                <span>Backroom Warehouse &rarr; Sales Floor Putaway</span>
              </h3>
              <select
                value={putProductId}
                onChange={(e) => setPutProductId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={putBranch}
                  onChange={(e) => setPutBranch(e.target.value)}
                  disabled={data.activeBranchScope !== 'all'}
                  className="h-10 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={putQty}
                  onChange={(e) => setPutQty(e.target.value)}
                  placeholder="Qty"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
                <input
                  type="text"
                  value={putLocation}
                  onChange={(e) => setPutLocation(e.target.value)}
                  placeholder="Bin e.g. HYD-A04"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#14532D]"
              >
                Move to Sales Floor
              </button>
            </form>
          )}

          {canVerifyInv && (
            <form
              onSubmit={handleCycleCount}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#9B1C2E]" />
                <span>Physical Cycle Count Entry</span>
              </h3>
              <select
                value={cntProductId}
                onChange={(e) => setCntProductId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
              >
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={cntBranch}
                  onChange={(e) => setCntBranch(e.target.value)}
                  disabled={data.activeBranchScope !== 'all'}
                  className="h-10 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={cntPhysicalQty}
                  onChange={(e) => setCntPhysicalQty(e.target.value)}
                  placeholder="Counted Qty"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
                <input
                  type="text"
                  value={cntNotes}
                  onChange={(e) => setCntNotes(e.target.value)}
                  placeholder="Count note / bin check"
                  className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
              >
                Post Cycle Count
              </button>
            </form>
          )}

          {canCreateInv && (
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
          )}

          {canCreateInv && (
            <form
              onSubmit={handleAdjustment}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#B45309]" />
                <span>Reasoned Stock Adjustment / Write-Off Request</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
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
                <select
                  value={adjBranch}
                  onChange={(e) => setAdjBranch(e.target.value)}
                  disabled={data.activeBranchScope !== 'all'}
                  className="h-10 px-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id}
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
          )}
        </div>
      )}

      {/* Inter-Branch Transfers Queue (In Transit & Completed) */}
      {data.stockTransfers.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#9B1C2E]" />
              <span>Inter-Branch Transfer Queue ({data.stockTransfers.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.stockTransfers.map((trf) => (
              <div
                key={trf.id}
                className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#1C1917]">{trf.transferRef}</span>
                    <span className="font-semibold text-[#1C1917]">{trf.productName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        trf.status === 'In Transit'
                          ? 'bg-[#B45309]/10 text-[#B45309]'
                          : trf.status === 'Completed'
                          ? 'bg-[#166534]/10 text-[#166534]'
                          : 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                      }`}
                    >
                      {trf.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[#57534E]">
                    Route: <strong>{trf.fromBranchId}</strong> &rarr;{' '}
                    <strong>{trf.toBranchId}</strong> · Dispatched: {trf.dispatchedQty} units by{' '}
                    {trf.dispatchedByName}
                    {trf.receivedByName
                      ? ` · Received: ${trf.receivedQty} ok / ${trf.damagedInTransitQty} damaged (${trf.receivedByName})`
                      : ''}
                  </p>
                </div>

                {trf.status === 'In Transit' && canVerifyInv && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={trf.dispatchedQty}
                      value={trReceiveQty[trf.id] ?? String(trf.dispatchedQty)}
                      onChange={(e) =>
                        setTrReceiveQty((prev) => ({ ...prev, [trf.id]: e.target.value }))
                      }
                      aria-label="Received qty"
                      className="w-20 h-9 px-2 rounded border border-[#E6E2DA] bg-[#FAF9F6] font-mono text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      max={trf.dispatchedQty}
                      value={trDamagedQty[trf.id] ?? '0'}
                      onChange={(e) =>
                        setTrDamagedQty((prev) => ({ ...prev, [trf.id]: e.target.value }))
                      }
                      placeholder="Dmg"
                      aria-label="Damaged qty"
                      className="w-16 h-9 px-2 rounded border border-[#E6E2DA] bg-[#FAF9F6] font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={trVarianceNote[trf.id] ?? ''}
                      onChange={(e) =>
                        setTrVarianceNote((prev) => ({ ...prev, [trf.id]: e.target.value }))
                      }
                      placeholder="Shortage / damage note"
                      className="w-40 h-9 px-2.5 rounded border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReceiveTransfer(trf.id, trf.dispatchedQty, false)}
                      className="h-9 px-3 rounded-lg bg-[#166534] text-white font-semibold hover:bg-[#14532D]"
                    >
                      Confirm Full Receipt
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReceiveTransfer(trf.id, trf.dispatchedQty, true)}
                      className="h-9 px-3 rounded-lg border border-[#B45309] text-[#B45309] font-semibold hover:bg-[#B45309]/8"
                    >
                      Receive with Variance
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Physical Cycle Counts */}
      {data.cycleCounts.length > 0 && (
        <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E2DA]">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Physical Cycle Count Log ({data.cycleCounts.length})
            </h3>
          </div>
          <div className="divide-y divide-[#E6E2DA]">
            {data.cycleCounts.slice(0, 8).map((cnt) => (
              <div
                key={cnt.id}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#1C1917]">{cnt.productName}</span>
                  <span className="text-[#57534E]">
                    {' '}
                    · {cnt.branchId} · System: {cnt.systemQty} vs Physical: {cnt.physicalQty} (
                    {cnt.variance > 0 ? `+${cnt.variance}` : cnt.variance})
                  </span>
                  <p className="text-[11px] text-[#57534E]">
                    Counted by {cnt.countedByName} · {cnt.notes}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    cnt.status === 'Matched' || cnt.status === 'Adjusted'
                      ? 'bg-[#166534]/10 text-[#166534]'
                      : 'bg-[#B45309]/10 text-[#B45309]'
                  }`}
                >
                  {cnt.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stock Ledger Table with Sort + Floor/Warehouse + 15/page Pagination */}
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
              <tr>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('branch')}
                    className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                  >
                    <span>Branch &amp; Bin</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('product')}
                    className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                  >
                    <span>Product</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Floor / Backroom</th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('onHand')}
                    className="inline-flex items-center gap-1 ml-auto hover:text-[#1C1917]"
                  >
                    <span>On Hand</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Reserved</th>
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('sellable')}
                    className="inline-flex items-center gap-1 ml-auto hover:text-[#1C1917]"
                  >
                    <span>Sellable</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Damaged / Transit</th>
                <th className="py-3 px-4 font-semibold">Batch &amp; FEFO Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]">
              {pagedStockRows.map((st) => {
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
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                      {st.floorQty} / {st.warehouseQty}
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
              {pagedStockRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#57534E]">
                    No inventory batches match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {stockRows.length > STOCK_PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#57534E]">
            <span>
              Showing {(safeStockPage - 1) * STOCK_PAGE_SIZE + 1}–
              {Math.min(safeStockPage * STOCK_PAGE_SIZE, stockRows.length)} of {stockRows.length}{' '}
              branch records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safeStockPage <= 1}
                onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono">
                {safeStockPage}/{totalStockPages}
              </span>
              <button
                type="button"
                disabled={safeStockPage >= totalStockPages}
                onClick={() => setStockPage((p) => Math.min(totalStockPages, p + 1))}
                className="h-8 px-2.5 rounded border border-[#E6E2DA] disabled:opacity-40 inline-flex items-center"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
