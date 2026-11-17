import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PackageCheck, ShoppingCart, Truck } from 'lucide-react';
import { hasPermission } from '../../erp/permissions';
import type { OnlineFulfillmentOrder, OnlineFulfillmentStage } from '../../erp/types';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface OrdersModuleProps {
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

export function OrdersModule({ data, onRefresh }: OrdersModuleProps) {
  const [stageFilter, setStageFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(data.onlineOrders[0]?.id || '');
  const [subNotes, setSubNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const canEditOrders = hasPermission(data.user.roleId, 'orders', 'edit');

  const visibleOrders = useMemo(() => {
    return data.onlineOrders.filter((o) => {
      if (stageFilter === 'active') return !['Completed', 'Cancelled'].includes(o.stage);
      if (stageFilter === 'completed') return ['Completed', 'Cancelled'].includes(o.stage);
      return true;
    });
  }, [data.onlineOrders, stageFilter]);

  const activeOrder: OnlineFulfillmentOrder | undefined =
    data.onlineOrders.find((o) => o.id === selectedOrderId) || visibleOrders[0];

  const handlePickLine = async (
    orderId: string,
    productId: string,
    pickedQty: number,
    flaggedMissing: boolean,
    substituteNote?: string
  ) => {
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.updateOrderPick(orderId, {
        productId,
        pickedQty,
        flaggedMissing,
        substituteNote,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Pick update failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleStageChange = async (
    orderId: string,
    stage: OnlineFulfillmentStage,
    extra?: { paymentStatus?: OnlineFulfillmentOrder['paymentStatus']; exceptionReason?: string }
  ) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.updateOrderStage(
        orderId,
        stage,
        stage === 'Packed' || stage === 'Ready for Pickup' || stage === 'Dispatched',
        extra
      );
      setFeedback({
        type: 'ok',
        text: `Order ${res.order.orderNumber} updated: Stage "${res.order.stage}" · Payment "${res.order.paymentStatus}" · Stock "${res.order.reservationStatus}".`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Stage update failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#1C1917]">
            Online Supermarket Order Fulfillment Queue
          </h2>
          <p className="text-xs text-[#57534E]">
            Storefront checkout orders automatically reserve sellable branch inventory and sync here live.
          </p>
        </div>
        <div className="flex gap-2">
          {(['active', 'completed', 'all'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStageFilter(tab)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize ${
                stageFilter === tab
                  ? 'border-[#9B1C2E] bg-[#9B1C2E]/8 text-[#9B1C2E]'
                  : 'border-[#E6E2DA] text-[#57534E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Order List */}
        <section className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
          <div className="divide-y divide-[#E6E2DA]">
            {visibleOrders.length === 0 ? (
              <div className="p-6 text-xs text-[#57534E]">
                No orders in this filter. Place an order on the public Storefront Checkout to see live intake.
              </div>
            ) : (
              visibleOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    activeOrder?.id === o.id ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#1C1917]">
                      {o.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.paymentStatus === 'Failed'
                            ? 'bg-[#9B1C2E]/10 text-[#9B1C2E]'
                            : o.paymentStatus === 'Paid'
                            ? 'bg-[#166534]/10 text-[#166534]'
                            : 'bg-[#B45309]/10 text-[#B45309]'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#9B1C2E]/10 text-[#9B1C2E] text-[11px] font-semibold">
                        {o.stage}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[#1C1917]">{o.customerName}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#57534E]">
                    <span>
                      {o.branchId} · {o.fulfillmentMethod === 'pickup' ? 'Store Pickup' : 'Delivery'}
                    </span>
                    <span className="font-bold tabular-nums text-[#1C1917]">
                      {formatPKR(o.totalAmount)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Right: Picking & Packing Detail */}
        <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-5">
          {!activeOrder ? (
            <p className="text-xs text-[#57534E]">Select an online order to inspect picking details.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E2DA]">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#9B1C2E]" />
                    <h3 className="font-mono text-base font-bold text-[#1C1917]">
                      {activeOrder.orderNumber}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-[#57534E]">
                    {activeOrder.customerName} ({activeOrder.customerPhone}) · {activeOrder.addressSummary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E6E2DA] text-xs font-semibold text-[#1C1917]">
                    Stock: {activeOrder.reservationStatus}
                  </span>
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E6E2DA] text-xs font-semibold text-[#1C1917]">
                    Pay: {activeOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {activeOrder.exceptionReason && (
                <div className="p-3 rounded-xl bg-[#B45309]/10 border border-[#B45309]/25 text-xs text-[#B45309] font-medium">
                  Exception Notice: {activeOrder.exceptionReason}
                </div>
              )}

              {/* Pick Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#57534E] mb-2.5">
                  Aisle Pick Checklist
                </h4>
                <div className="divide-y divide-[#E6E2DA] border border-[#E6E2DA] rounded-xl overflow-hidden">
                  {activeOrder.items.map((line) => (
                    <div key={line.productId} className="p-3.5 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#1C1917]">{line.name}</p>
                          <p className="text-[11px] font-mono text-[#57534E]">
                            Bin: {line.locationCode} · SKU: {line.sku} · Ordered: {line.quantity}
                          </p>
                          {line.substituteNote && (
                            <p className="mt-0.5 text-[11px] text-[#B45309]">
                              Substitution Note: {line.substituteNote}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-semibold text-[#166534] whitespace-nowrap">
                            Picked {line.pickedQty}/{line.quantity}
                          </span>
                          {canEditOrders && !['Completed', 'Cancelled'].includes(activeOrder.stage) && (
                            <>
                              <button
                                type="button"
                                disabled={busy || line.pickedQty >= line.quantity}
                                onClick={() =>
                                  handlePickLine(activeOrder.id, line.productId, line.quantity, false)
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-[#166534] text-white font-semibold disabled:opacity-40 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Pick Full</span>
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  handlePickLine(
                                    activeOrder.id,
                                    line.productId,
                                    line.pickedQty,
                                    !line.flaggedMissing,
                                    subNotes[line.productId]
                                  )
                                }
                                className={`px-2.5 py-1.5 rounded-lg border font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                                  line.flaggedMissing
                                    ? 'border-[#B45309] bg-[#B45309]/10 text-[#B45309]'
                                    : 'border-[#E6E2DA] text-[#57534E]'
                                }`}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{line.flaggedMissing ? 'Missing Flagged' : 'Flag Issue'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {canEditOrders && !['Completed', 'Cancelled'].includes(activeOrder.stage) && (
                        <input
                          type="text"
                          value={subNotes[line.productId] ?? line.substituteNote ?? ''}
                          onChange={(e) =>
                            setSubNotes((prev) => ({ ...prev, [line.productId]: e.target.value }))
                          }
                          placeholder="Optional customer-approved substitution note before flagging issue..."
                          className="w-full h-8 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-[11px]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Controls */}
              {canEditOrders && (
                <div className="pt-2 border-t border-[#E6E2DA] flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || activeOrder.stage === 'Packed'}
                    onClick={() => handleStageChange(activeOrder.id, 'Packed')}
                    className="px-3.5 py-2 rounded-lg border border-[#E6E2DA] text-xs font-semibold hover:border-[#9B1C2E] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <PackageCheck className="w-3.5 h-3.5 text-[#166534]" />
                    <span>Mark Packing Verified</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      handleStageChange(
                        activeOrder.id,
                        activeOrder.fulfillmentMethod === 'pickup' ? 'Ready for Pickup' : 'Dispatched'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>
                      {activeOrder.fulfillmentMethod === 'pickup'
                        ? 'Ready at Pickup Counter'
                        : 'Dispatch & Deduct Stock'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleStageChange(activeOrder.id, 'Completed')}
                    className="px-3.5 py-2 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#14532D] whitespace-nowrap"
                  >
                    Complete Order
                  </button>
                  {activeOrder.paymentStatus !== 'Failed' && activeOrder.stage !== 'Completed' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleStageChange(activeOrder.id, 'Exception', {
                          paymentStatus: 'Failed',
                          exceptionReason: 'Payment authorization failed at counter / gateway',
                        })
                      }
                      className="px-3.5 py-2 rounded-lg border border-[#B45309]/40 text-[#B45309] text-xs font-semibold hover:bg-[#B45309]/8 whitespace-nowrap"
                    >
                      Mark Payment Failed
                    </button>
                  )}
                  {activeOrder.stage !== 'Cancelled' && activeOrder.stage !== 'Completed' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleStageChange(activeOrder.id, 'Cancelled')}
                      className="px-3.5 py-2 rounded-lg border border-[#9B1C2E]/30 text-[#9B1C2E] text-xs font-semibold hover:bg-[#9B1C2E]/8 whitespace-nowrap"
                    >
                      Cancel &amp; Release Stock
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
