import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  CreditCard,
  PauseCircle,
  PlayCircle,
  Printer,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  calculateCashChange,
  computePosLineTotal,
  computePosTotals,
  getSellableStock,
  lookupProductByBarcodeOrSku,
} from '../../erp/calculations';
import { hasPermission } from '../../erp/permissions';
import type { PosSaleLine, PosSaleRecord } from '../../erp/types';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface PosModuleProps {
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

interface HeldBill {
  id: string;
  label: string;
  lines: PosSaleLine[];
}

export function PosModule({ data, onRefresh }: PosModuleProps) {
  const branchId =
    data.activeBranchScope === 'all'
      ? data.branches[0]?.id || 'hyderabad'
      : data.activeBranchScope;

  const openShift = data.shifts.find(
    (s) => s.branchId === branchId && s.status === 'Open'
  );
  const canCreateSale = hasPermission(data.user.roleId, 'pos', 'create');
  const canReturnSale = hasPermission(data.user.roleId, 'pos', 'verify');

  const [scanInput, setScanInput] = useState('');
  const [basket, setBasket] = useState<PosSaleLine[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Split'>('Cash');
  const [cashTenderInput, setCashTenderInput] = useState('');
  const [cardSplitInput, setCardSplitInput] = useState('');
  const [simulateCardFail, setSimulateCardFail] = useState(false);
  const [selectedOverrideId, setSelectedOverrideId] = useState('');
  const [openingFloatInput, setOpeningFloatInput] = useState('15000');
  const [closingCashInput, setClosingCashInput] = useState('');
  const [closePanelOpen, setClosePanelOpen] = useState(false);
  const [returnReceiptInput, setReturnReceiptInput] = useState('');
  const [returnReasonInput, setReturnReasonInput] = useState('');
  const [returnDisposition, setReturnDisposition] = useState<'Restock Sellable' | 'Damaged Quarantine'>(
    'Restock Sellable'
  );
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [lastReceipt, setLastReceipt] = useState<PosSaleRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        scanRef.current?.focus();
        scanRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const approvedOverrides = useMemo(
    () =>
      data.approvals.filter(
        (a) => a.type === 'POS_DISCOUNT_OVERRIDE' && a.status === 'Approved' && a.branchId === branchId
      ),
    [data.approvals, branchId]
  );

  const branchStockMap = useMemo(() => {
    const map = new Map<string, number>();
    data.stock
      .filter((s) => s.branchId === branchId)
      .forEach((s) => map.set(s.productId, getSellableStock(s)));
    return map;
  }, [data.stock, branchId]);

  const filteredCatalog = useMemo(() => {
    const q = scanInput.trim().toLowerCase();
    if (!q) return data.products.slice(0, 12);
    return data.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [data.products, scanInput]);

  const totals = useMemo(() => computePosTotals(basket), [basket]);
  const numericCash = Number(cashTenderInput || 0);
  const numericCardSplit = Number(cardSplitInput || 0);
  const changeDue =
    paymentMethod === 'Cash'
      ? calculateCashChange(totals.grandTotal, numericCash)
      : paymentMethod === 'Split'
      ? calculateCashChange(totals.grandTotal, numericCash + numericCardSplit)
      : 0;

  const addProductToBasket = (productId: string) => {
    const prod = data.products.find((p) => p.id === productId);
    if (!prod) return;
    const sellable = branchStockMap.get(prod.id) ?? 0;
    if (sellable <= 0) {
      setFeedback({ type: 'err', text: `${prod.name} has 0 sellable stock at ${branchId}.` });
      return;
    }
    setFeedback(null);
    setBasket((prev) => {
      const existing = prev.find((l) => l.productId === prod.id);
      if (existing) {
        const nextQty = Math.min(sellable, existing.quantity + 1);
        return prev.map((l) =>
          l.productId === prod.id
            ? {
                ...l,
                quantity: nextQty,
                lineTotal: computePosLineTotal(l.unitPrice, nextQty, l.discountPercent),
              }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          name: prod.name,
          unitLabel: prod.unitLabel,
          quantity: 1,
          unitPrice: prod.sellingPrice,
          discountPercent: 0,
          lineTotal: prod.sellingPrice,
        },
      ];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = scanInput.trim();
    if (!raw) return;
    const match = lookupProductByBarcodeOrSku(
      data.products.map((p) => ({ ...p, purchaseCost: p.purchaseCost ?? 0 })),
      raw
    );
    if (match) {
      addProductToBasket(match.id);
      setScanInput('');
      scanRef.current?.focus();
    } else if (filteredCatalog.length === 1) {
      addProductToBasket(filteredCatalog[0].id);
      setScanInput('');
      scanRef.current?.focus();
    } else {
      setFeedback({
        type: 'err',
        text: `Barcode / SKU "${raw}" was not found in the active supermarket catalogue.`,
      });
      scanRef.current?.focus();
      scanRef.current?.select();
    }
  };

  const updateLineQty = (productId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setBasket((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    const maxAvail = branchStockMap.get(productId) ?? 99;
    const clamped = Math.min(maxAvail, nextQty);
    setBasket((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? {
              ...l,
              quantity: clamped,
              lineTotal: computePosLineTotal(l.unitPrice, clamped, l.discountPercent),
            }
          : l
      )
    );
  };

  const updateLineDiscount = (productId: string, discountVal: number) => {
    const clean = Math.min(50, Math.max(0, Number.isFinite(discountVal) ? discountVal : 0));
    setBasket((prev) =>
      prev.map((l) =>
        l.productId === productId
          ? {
              ...l,
              discountPercent: clean,
              lineTotal: computePosLineTotal(l.unitPrice, l.quantity, clean),
            }
          : l
      )
    );
  };

  const overCapLine = basket.find((l) => l.discountPercent > data.role.maxPosDiscountPercent);

  const handleHoldBill = () => {
    if (basket.length === 0) return;
    const id = `hold-${Date.now()}`;
    setHeldBills((prev) => [
      ...prev,
      { id, label: `Held #${prev.length + 1} (${basket.length} items)`, lines: basket },
    ]);
    setBasket([]);
    setFeedback({ type: 'ok', text: 'Current customer basket parked on Hold.' });
  };

  const handleResumeBill = (id: string) => {
    const found = heldBills.find((h) => h.id === id);
    if (!found) return;
    setBasket(found.lines);
    setHeldBills((prev) => prev.filter((h) => h.id !== id));
  };

  const handleRequestOverride = async () => {
    if (!overCapLine) return;
    setBusy(true);
    try {
      await managementApi.requestDiscountOverride({
        branchId,
        sku: overCapLine.sku,
        requestedDiscountPercent: overCapLine.discountPercent,
        reason: `Requested ${overCapLine.discountPercent}% shelf match/damage allowance at POS.`,
        amountPkr: overCapLine.unitPrice * overCapLine.quantity,
      });
      setFeedback({
        type: 'ok',
        text: `Override request for ${overCapLine.discountPercent}% sent to POS Supervisor / Branch Manager.`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Override failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckoutSale = async () => {
    if (!openShift || basket.length === 0) return;
    setBusy(true);
    setFeedback(null);
    try {
      const cashAmt =
        paymentMethod === 'Cash'
          ? numericCash || totals.grandTotal
          : paymentMethod === 'Split'
          ? numericCash
          : 0;
      const cardAmt =
        paymentMethod === 'Card'
          ? totals.grandTotal
          : paymentMethod === 'Split'
          ? numericCardSplit
          : 0;

      const res = await managementApi.completePosSale({
        shiftId: openShift.id,
        branchId,
        items: basket.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          discountPercent: l.discountPercent,
        })),
        paymentMethod,
        cashReceived: cashAmt,
        cardAmount: cardAmt,
        cardTerminalFailed: paymentMethod !== 'Cash' && simulateCardFail,
        supervisorOverrideId: selectedOverrideId || undefined,
      });
      setLastReceipt(res.sale);
      setBasket([]);
      setCashTenderInput('');
      setCardSplitInput('');
      setSelectedOverrideId('');
      setSimulateCardFail(false);
      setFeedback({
        type: 'ok',
        text: `Receipt ${res.sale.receiptNumber} completed (${formatPKR(res.sale.grandTotal)}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not complete sale.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleOpenShift = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.openShift({
        branchId,
        openingFloat: Number(openingFloatInput || 15000),
      });
      setFeedback({ type: 'ok', text: `Register shift opened at ${branchId}.` });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Failed to open shift.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCloseShift = async () => {
    if (!openShift) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.closeShift(openShift.id, Number(closingCashInput || 0));
      setClosePanelOpen(false);
      setClosingCashInput('');
      setFeedback({
        type: 'ok',
        text: `Shift ${res.shift.shiftNumber} closed (${res.shift.status}, variance PKR ${res.shift.variance ?? 0}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Failed to close shift.' });
    } finally {
      setBusy(false);
    }
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReceiptInput.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.processPosReturn(
        returnReceiptInput.trim(),
        returnReasonInput.trim() || 'Counter return',
        returnDisposition
      );
      setReturnReceiptInput('');
      setReturnReasonInput('');
      setFeedback({
        type: 'ok',
        text: `Receipt ${res.sale.receiptNumber} marked Returned (${returnDisposition}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Return failed.' });
    } finally {
      setBusy(false);
    }
  };

  const filteredSales = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    if (!q) return data.posSales;
    return data.posSales.filter(
      (s) =>
        s.receiptNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [data.posSales, ledgerSearch]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const pagedSales = filteredSales.slice((ledgerPage - 1) * PAGE_SIZE, ledgerPage * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Hardware & Shift Status Bar */}
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#1C1917]">
              Register Terminal ({branchId})
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                openShift
                  ? 'bg-[#166534]/10 text-[#166534]'
                  : 'bg-[#B45309]/10 text-[#B45309]'
              }`}
            >
              {openShift ? `${openShift.registerId} · Open` : 'No Open Shift'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[#57534E]">
            USB/HID Barcode scanner input ready (press <kbd className="px-1 py-0.5 bg-[#FAF9F6] border border-[#E6E2DA] rounded font-mono">F2</kbd> or <kbd className="px-1 py-0.5 bg-[#FAF9F6] border border-[#E6E2DA] rounded font-mono">/</kbd> to focus) · Receipt print preview &amp; drawer triggers are demo interfaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!openShift && canCreateSale && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={openingFloatInput}
                onChange={(e) => setOpeningFloatInput(e.target.value)}
                aria-label="Opening cash float PKR"
                className="w-28 h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
              />
              <button
                type="button"
                disabled={busy}
                onClick={handleOpenShift}
                className="h-9 px-3.5 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#14532D] whitespace-nowrap"
              >
                Open Shift
              </button>
            </div>
          )}
          {openShift && canCreateSale && (
            <button
              type="button"
              onClick={() => setClosePanelOpen((v) => !v)}
              className="h-9 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] whitespace-nowrap"
            >
              {closePanelOpen ? 'Cancel Close' : 'Submit Shift Closing'}
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
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

      {closePanelOpen && openShift && (
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Close Shift {openShift.shiftNumber}
            </h3>
            <p className="text-xs text-[#57534E]">
              System Expected Cash: <strong className="font-mono">{formatPKR(openShift.expectedCash)}</strong>{' '}
              (Opening {formatPKR(openShift.openingFloat)} + Cash Sales {formatPKR(openShift.cashSalesTotal)})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={closingCashInput}
              onChange={(e) => setClosingCashInput(e.target.value)}
              placeholder="Declared drawer cash (PKR)"
              className="w-52 h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
            />
            <button
              type="button"
              disabled={busy || !closingCashInput}
              onClick={handleCloseShift}
              className="h-10 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] disabled:opacity-50 whitespace-nowrap"
            >
              Confirm Close
            </button>
          </div>
        </div>
      )}

      {/* Main POS Workspace: Scanner + Quick Catalog | Active Bill & Tender */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Barcode Input & Item Grid */}
        <section className="xl:col-span-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-[#9B1C2E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={scanRef}
                type="text"
                autoFocus
                aria-label="Scan barcode or search SKU"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan GTIN barcode (e.g. 8961001011000) or search SKU / product..."
                className="w-full h-11 pl-9 pr-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm focus:bg-[#FFFFFF] focus:border-[#9B1C2E] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 h-11 rounded-xl bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#292524] whitespace-nowrap shrink-0"
            >
              Scan / Add
            </button>
          </form>

          {heldBills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {heldBills.map((hb) => (
                <button
                  key={hb.id}
                  type="button"
                  onClick={() => handleResumeBill(hb.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#B45309]/10 text-[#B45309] text-xs font-semibold hover:bg-[#B45309]/20"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Resume {hb.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => {
              const sellable = branchStockMap.get(prod.id) ?? 0;
              return (
                <button
                  key={prod.id}
                  type="button"
                  disabled={!canCreateSale || !openShift || sellable <= 0}
                  onClick={() => addProductToBasket(prod.id)}
                  className="text-left p-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] hover:border-[#9B1C2E] hover:bg-[#FFFFFF] disabled:opacity-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-[#1C1917] line-clamp-2">{prod.name}</p>
                    <span className="text-xs font-bold text-[#9B1C2E] tabular-nums shrink-0">
                      {formatPKR(prod.sellingPrice)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#57534E] font-mono">
                    <span>{prod.barcode}</span>
                    <span className={sellable <= 5 ? 'text-[#B45309] font-semibold' : ''}>
                      Avail: {sellable}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Active Bill, Discount Cap & Payment Tender */}
        <section className="xl:col-span-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#1C1917]">Active Counter Bill</h2>
              <p className="text-[11px] text-[#57534E]">
                Role discount cap: <strong className="text-[#1C1917]">{data.role.maxPosDiscountPercent}%</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={basket.length === 0}
                onClick={handleHoldBill}
                className="px-2.5 py-1.5 rounded-lg border border-[#E6E2DA] text-xs font-semibold text-[#1C1917] hover:bg-[#FAF9F6] disabled:opacity-40 inline-flex items-center gap-1"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Hold</span>
              </button>
              <button
                type="button"
                disabled={basket.length === 0}
                onClick={() => setBasket([])}
                className="px-2.5 py-1.5 rounded-lg border border-[#E6E2DA] text-xs font-semibold text-[#9B1C2E] hover:bg-[#FAF9F6] disabled:opacity-40"
              >
                Clear
              </button>
            </div>
          </div>

          {basket.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#57534E]">
              Scan a GTIN barcode or select an item on the left to start billing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                  <tr>
                    <th className="py-2 px-2 font-semibold">Item</th>
                    <th className="py-2 px-2 font-semibold">Qty</th>
                    <th className="py-2 px-2 font-semibold">Disc %</th>
                    <th className="py-2 px-2 font-semibold text-right">Line Total</th>
                    <th className="py-2 px-1" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E2DA]">
                  {basket.map((line) => (
                    <tr key={line.productId}>
                      <td className="py-2 px-2">
                        <p className="font-semibold text-[#1C1917]">{line.name}</p>
                        <p className="text-[10px] font-mono text-[#57534E]">
                          {formatPKR(line.unitPrice)} · {line.sku}
                        </p>
                      </td>
                      <td className="py-2 px-2">
                        <div className="inline-flex items-center border border-[#E6E2DA] rounded-md">
                          <button
                            type="button"
                            onClick={() => updateLineQty(line.productId, line.quantity - 1)}
                            className="px-2 py-1 hover:bg-[#FAF9F6]"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono tabular-nums">{line.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateLineQty(line.productId, line.quantity + 1)}
                            className="px-2 py-1 hover:bg-[#FAF9F6]"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={line.discountPercent}
                          onChange={(e) => updateLineDiscount(line.productId, Number(e.target.value))}
                          className={`w-14 h-8 px-1.5 rounded border text-xs font-mono ${
                            line.discountPercent > data.role.maxPosDiscountPercent
                              ? 'border-[#9B1C2E] bg-[#9B1C2E]/5 text-[#9B1C2E] font-bold'
                              : 'border-[#E6E2DA] bg-[#FAF9F6]'
                          }`}
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-semibold tabular-nums">
                        {formatPKR(line.lineTotal)}
                      </td>
                      <td className="py-2 px-1 text-right">
                        <button
                          type="button"
                          onClick={() => updateLineQty(line.productId, 0)}
                          aria-label={`Remove ${line.name}`}
                          className="p-1 text-[#57534E] hover:text-[#9B1C2E]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {overCapLine && (
            <div className="p-3 rounded-xl bg-[#B45309]/10 border border-[#B45309]/25 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2 text-[#B45309]">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {overCapLine.discountPercent}% discount exceeds your {data.role.maxPosDiscountPercent}% role cap.
                  </span>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRequestOverride}
                  className="px-3 py-1.5 rounded-lg bg-[#B45309] text-white font-semibold whitespace-nowrap shrink-0"
                >
                  Request Supervisor Override
                </button>
              </div>
              {approvedOverrides.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label htmlFor="pos-override-select" className="text-[11px] font-semibold text-[#1C1917]">
                    Apply Approved Override:
                  </label>
                  <select
                    id="pos-override-select"
                    value={selectedOverrideId}
                    onChange={(e) => setSelectedOverrideId(e.target.value)}
                    className="h-8 px-2 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs"
                  >
                    <option value="">None selected</option>
                    {approvedOverrides.map((ov) => (
                      <option key={ov.id} value={ov.id}>
                        {ov.title} (Approved by {ov.decidedByName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Totals & Payment Method */}
          <div className="pt-3 border-t border-[#E6E2DA] space-y-3">
            <div className="flex justify-between text-xs text-[#57534E]">
              <span>Subtotal ({totals.itemCount} items)</span>
              <span className="tabular-nums font-medium">{formatPKR(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-xs text-[#166534]">
                <span>Line Discounts</span>
                <span className="tabular-nums font-medium">-{formatPKR(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#1C1917]">
              <span>Grand Total (Tax-Inclusive Demo)</span>
              <span className="tabular-nums">{formatPKR(totals.grandTotal)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Card', 'Split'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`h-9 rounded-lg border text-xs font-semibold ${
                    paymentMethod === m
                      ? 'border-[#9B1C2E] bg-[#9B1C2E]/8 text-[#9B1C2E]'
                      : 'border-[#E6E2DA] text-[#1C1917]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {paymentMethod !== 'Cash' && (
              <label className="flex items-center gap-2 text-xs text-[#57534E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateCardFail}
                  onChange={(e) => setSimulateCardFail(e.target.checked)}
                />
                <span>Simulate Card Terminal Timeout / Failure (test fallback to Cash/Split)</span>
              </label>
            )}

            {paymentMethod !== 'Card' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                    Cash Received (PKR)
                  </label>
                  <input
                    type="number"
                    value={cashTenderInput}
                    onChange={(e) => setCashTenderInput(e.target.value)}
                    placeholder={String(totals.grandTotal || 0)}
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                  />
                </div>
                {paymentMethod === 'Split' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-[#57534E] mb-1">
                      Card Amount (PKR)
                    </label>
                    <input
                      type="number"
                      value={cardSplitInput}
                      onChange={(e) => setCardSplitInput(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#57534E]">Change Due</span>
                    <span className="text-sm font-bold text-[#166534] tabular-nums">
                      {formatPKR(changeDue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={!canCreateSale || !openShift || basket.length === 0 || busy}
              onClick={handleCheckoutSale}
              className="w-full h-11 rounded-xl bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D] disabled:opacity-45 inline-flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Complete Sale &amp; Issue Receipt ({formatPKR(totals.grandTotal)})</span>
            </button>
          </div>
        </section>
      </div>

      {/* Receipt Preview & Counter Returns + Recent Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {lastReceipt && (
          <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#166534]">
                  Receipt Preview (Demo Print Interface)
                </p>
                <h3 className="font-mono text-sm font-bold text-[#1C1917]">
                  {lastReceipt.receiptNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg border border-[#E6E2DA] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#FAF9F6]"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
            <div className="text-xs space-y-1 text-[#57534E]">
              <p>Cashier: {lastReceipt.cashierName}</p>
              <p>Payment: {lastReceipt.paymentMethod} · Change: {formatPKR(lastReceipt.changeDue)}</p>
            </div>
            <div className="divide-y divide-[#E6E2DA] text-xs">
              {lastReceipt.items.map((it) => (
                <div key={it.productId} className="py-1.5 flex justify-between">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-mono">{formatPKR(it.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-[#E6E2DA] flex justify-between text-sm font-bold">
              <span>Total Paid</span>
              <span className="tabular-nums">{formatPKR(lastReceipt.grandTotal)}</span>
            </div>
          </section>
        )}

        <section
          className={`${
            lastReceipt ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">
                Immutable POS Transaction Ledger
              </h3>
              <p className="text-xs text-[#57534E]">
                Completed receipts cannot be deleted; authorized supervisors process formal returns.
              </p>
            </div>
            {canReturnSale && (
              <form onSubmit={handleProcessReturn} className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={returnReceiptInput}
                  onChange={(e) => setReturnReceiptInput(e.target.value)}
                  placeholder="Receipt # (e.g. RCP-HYD-1002)"
                  className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                />
                <input
                  type="text"
                  value={returnReasonInput}
                  onChange={(e) => setReturnReasonInput(e.target.value)}
                  placeholder="Return reason"
                  className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                />
                <select
                  value={returnDisposition}
                  onChange={(e) =>
                    setReturnDisposition(e.target.value as 'Restock Sellable' | 'Damaged Quarantine')
                  }
                  aria-label="Return stock disposition"
                  className="h-9 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                >
                  <option value="Restock Sellable">Restock Sellable</option>
                  <option value="Damaged Quarantine">Damaged Quarantine</option>
                </select>
                <button
                  type="submit"
                  disabled={busy || !returnReceiptInput.trim()}
                  className="h-9 px-3 rounded-lg border border-[#9B1C2E] text-[#9B1C2E] text-xs font-semibold hover:bg-[#9B1C2E] hover:text-white inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Process Return</span>
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <input
              type="search"
              value={ledgerSearch}
              onChange={(e) => {
                setLedgerSearch(e.target.value);
                setLedgerPage(1);
              }}
              placeholder="Search receipt #, cashier, or payment method..."
              className="h-9 w-full sm:w-72 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            />
            <span className="text-[11px] text-[#57534E] tabular-nums">
              {filteredSales.length} receipts · Page {ledgerPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Receipt #</th>
                  <th className="py-2.5 px-3 font-semibold">Cashier</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E2DA]">
                {pagedSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 px-3 text-center text-[#57534E]">
                      No receipts match your filter.
                    </td>
                  </tr>
                ) : (
                  pagedSales.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#1C1917]">
                        {s.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3 text-[#57534E]">{s.cashierName}</td>
                      <td className="py-2.5 px-3 text-[#57534E]">{s.paymentMethod}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.status === 'Returned'
                              ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                              : 'bg-[#166534]/10 text-[#166534]'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums">
                        {formatPKR(s.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={ledgerPage <= 1}
                onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-[#E6E2DA] text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={ledgerPage >= totalPages}
                onClick={() => setLedgerPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-[#E6E2DA] text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
