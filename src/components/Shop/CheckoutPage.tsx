import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { VERIFIED_BRANCHES } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type { CheckoutFormData, SimulatedOrder } from '../../types/marhaba';
import { calculateCartTotals, formatPKR, validateCheckoutForm } from '../../utils/commerce';

type Step = 1 | 2 | 3 | 4 | 5;

export function CheckoutPage() {
  const { cart, branchId, navigate, submitDemoOrder } = useStore();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<CheckoutFormData>({
    fullName: '',
    phone: '',
    email: '',
    branchId,
    fulfillmentMethod: 'delivery',
    address: '',
    city: 'Hyderabad',
    deliveryNotes: '',
    paymentMethod: 'cod',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<SimulatedOrder | null>(null);

  const totals = calculateCartTotals(cart, form.fulfillmentMethod);
  const selectedBranch = VERIFIED_BRANCHES.find((b) => b.id === form.branchId) || VERIFIED_BRANCHES[0];

  if (cart.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#1C1917]">Your cart is currently empty</h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Add items from Marhaba Supermarket before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('shop')}
          className="mt-6 px-6 py-3 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const validateStep = (currentStep: Step): boolean => {
    const allErrors = validateCheckoutForm(form);
    const stepKeys: Record<Step, string[]> = {
      1: ['fullName', 'phone', 'email'],
      2: form.fulfillmentMethod === 'delivery' ? ['address', 'city'] : [],
      3: [],
      4: [],
      5: [],
    };
    const relevant: Record<string, string> = {};
    for (const key of stepKeys[currentStep]) {
      if (allErrors[key]) relevant[key] = allErrors[key];
    }
    setErrors(relevant);
    return Object.keys(relevant).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(4, s + 1) as Step);
    }
  };

  const handleConfirmDemoOrder = () => {
    const allErrors = validateCheckoutForm(form);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(allErrors.fullName || allErrors.phone || allErrors.email ? 1 : 2);
      return;
    }
    const order = submitDemoOrder(form);
    setConfirmedOrder(order);
    setStep(5);
  };

  const stepLabels = [
    '1. Customer Info',
    '2. Delivery Details',
    '3. Payment',
    '4. Review',
    '5. Confirmation',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <button
        type="button"
        onClick={() => navigate('shop')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#9B1C2E] mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E2DA]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
            Supermarket Checkout
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">
            Interactive checkout preview — no real financial charge or live dispatch occurs.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-lg bg-[#B45309]/10 border border-[#B45309]/25 text-xs font-semibold text-[#B45309]">
          Simulated Demonstration Checkout
        </span>
      </div>

      {/* Stepper */}
      <ol className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stepLabels.map((label, idx) => {
          const sNum = (idx + 1) as Step;
          const active = step === sNum;
          const done = step > sNum;
          const canJumpBack = done && step < 5 && sNum < 5;
          return (
            <li key={label}>
              {canJumpBack ? (
                <button
                  type="button"
                  onClick={() => setStep(sNum)}
                  className="w-full px-3 py-2 rounded-xl border border-[#166534]/30 bg-[#166534]/10 text-[#166534] hover:bg-[#166534]/15 text-xs font-semibold text-center transition-colors"
                >
                  {label}
                </button>
              ) : (
                <div
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold text-center ${
                    active
                      ? 'border-[#9B1C2E] bg-[#9B1C2E] text-white'
                      : done
                      ? 'border-[#166534]/30 bg-[#166534]/10 text-[#166534]'
                      : 'border-[#E6E2DA] bg-[#FFFFFF] text-[#57534E]'
                  }`}
                >
                  {label}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {step === 5 && confirmedOrder ? (
        <div className="mt-8 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-[#166534] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                Simulated Order Recorded
              </p>
              <h2 className="font-serif text-2xl font-bold text-[#1C1917] mt-1">
                Order Reference: {confirmedOrder.orderNumber}
              </h2>
              <p className="mt-1.5 text-sm text-[#57534E]">
                {confirmedOrder.status}. You can review this receipt anytime in your Account page.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E6E2DA] grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <p className="font-semibold text-[#1C1917]">Customer &amp; Fulfillment</p>
              <p className="text-[#57534E]">{confirmedOrder.customer.fullName}</p>
              <p className="text-[#57534E]">{confirmedOrder.customer.phone}</p>
              <p className="text-[#57534E]">
                {confirmedOrder.customer.fulfillmentMethod === 'delivery'
                  ? `Delivery to: ${confirmedOrder.customer.address}, ${confirmedOrder.customer.city}`
                  : `Store Pickup at ${selectedBranch.name}`}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-[#1C1917]">Order Summary</p>
              {confirmedOrder.items.map((it) => (
                <div key={`${it.productId}-${it.variantId}`} className="flex justify-between text-[#57534E]">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="tabular-nums font-medium text-[#1C1917]">
                    {formatPKR(it.unitPrice * it.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#E6E2DA] flex justify-between font-bold text-[#1C1917]">
                <span>Total (Simulated)</span>
                <span className="tabular-nums">{formatPKR(confirmedOrder.totals.finalTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('shop')}
              className="px-5 py-2.5 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
            >
              Continue Shopping
            </button>
            <button
              type="button"
              onClick={() => navigate('account')}
              className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
            >
              View in Account
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Steps */}
          <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1C1917]">Customer Information</h2>
                <div>
                  <label htmlFor="co-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="co-name"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="e.g. Ayesha Siddiqui"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-[#9B1C2E]">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="co-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 0300-1234567"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-[#9B1C2E]">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="co-email" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    id="co-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="name@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  />
                  {errors.email && <p className="mt-1 text-xs text-[#9B1C2E]">{errors.email}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Continue to Delivery Details
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1C1917]">Delivery or Store Pickup</h2>

                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['delivery', 'Home Delivery'],
                      ['pickup', 'In-Store Pickup'],
                    ] as const
                  ).map(([method, label]) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, fulfillmentMethod: method }))}
                      className={`p-3 rounded-lg border text-sm font-semibold text-left ${
                        form.fulfillmentMethod === method
                          ? 'border-[#9B1C2E] bg-[#9B1C2E]/5 text-[#9B1C2E]'
                          : 'border-[#E6E2DA] text-[#1C1917]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="co-branch" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Fulfilling Marhaba Branch
                  </label>
                  <select
                    id="co-branch"
                    value={form.branchId}
                    onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  >
                    {VERIFIED_BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {form.fulfillmentMethod === 'delivery' && (
                  <>
                    <div>
                      <label htmlFor="co-city" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        City *
                      </label>
                      <select
                        id="co-city"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      >
                        <option value="Hyderabad">Hyderabad (Qasimabad / Latifabad / Cantt)</option>
                        <option value="Karachi">Karachi (Bahria Town)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="co-addr" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Street Address &amp; Landmark *
                      </label>
                      <input
                        id="co-addr"
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                        placeholder="House / Flat #, Block / Precinct, Landmark"
                        className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      />
                      {errors.address && <p className="mt-1 text-xs text-[#9B1C2E]">{errors.address}</p>}
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="co-notes" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Order Instructions (Optional)
                  </label>
                  <textarea
                    id="co-notes"
                    rows={2}
                    value={form.deliveryNotes}
                    onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    placeholder="Preferred delivery window or packaging note..."
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 h-11 rounded-lg border border-[#E6E2DA] text-sm font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#1C1917]">Payment Selection (Demonstration)</h2>
                <div className="p-3.5 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] flex items-start gap-2.5 text-xs text-[#57534E]">
                  <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <span>
                    Live online payment gateway integration is not connected in this preview. Selecting a
                    payment option demonstrates the order review workflow only.
                  </span>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E6E2DA] cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={form.paymentMethod === 'cod'}
                      onChange={() => setForm((f) => ({ ...f, paymentMethod: 'cod' }))}
                      className="mt-1 accent-[#9B1C2E]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">Cash on Delivery (Demo)</p>
                      <p className="text-xs text-[#57534E]">Pay cash upon delivery verification.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 rounded-xl border border-[#E6E2DA] cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={form.paymentMethod === 'card-counter'}
                      onChange={() => setForm((f) => ({ ...f, paymentMethod: 'card-counter' }))}
                      className="mt-1 accent-[#9B1C2E]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">Pay at Store Counter / POS (Demo)</p>
                      <p className="text-xs text-[#57534E]">Settle via cash or card at pickup desk.</p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 h-11 rounded-lg border border-[#E6E2DA] text-sm font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-[#1C1917]">Review &amp; Submit Demo Order</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-xs">
                  <div>
                    <p className="font-semibold text-[#1C1917]">Customer</p>
                    <p className="mt-1 text-[#57534E]">{form.fullName}</p>
                    <p className="text-[#57534E]">{form.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1C1917]">Fulfillment</p>
                    <p className="mt-1 text-[#57534E]">
                      {form.fulfillmentMethod === 'delivery'
                        ? `${form.address}, ${form.city}`
                        : `Pickup: ${selectedBranch.shortName}`}
                    </p>
                    <p className="text-[#57534E]">
                      Payment: {form.paymentMethod === 'cod' ? 'Cash on Delivery (Demo)' : 'Store Counter (Demo)'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-5 h-11 rounded-lg border border-[#E6E2DA] text-sm font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDemoOrder}
                    className="px-6 h-11 rounded-lg bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D] inline-flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Place Simulated Order ({formatPKR(totals.finalTotal)})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Order Summary Sidebar */}
          <aside className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#1C1917]">Order Summary</h2>
            <div className="divide-y divide-[#E6E2DA] max-h-72 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-2.5 flex justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-[#1C1917]">{item.name}</p>
                    <p className="text-[#57534E]">
                      {item.variantLabel} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-[#1C1917] tabular-nums shrink-0">
                    {formatPKR(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-[#E6E2DA] space-y-1.5 text-sm">
              <div className="flex justify-between text-[#57534E]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#1C1917]">
                  {formatPKR(totals.subtotal)}
                </span>
              </div>
              {totals.totalSavings > 0 && (
                <div className="flex justify-between text-[#166534]">
                  <span>Savings</span>
                  <span className="tabular-nums font-medium">-{formatPKR(totals.totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#57534E]">
                <span>Delivery</span>
                <span className="tabular-nums font-medium text-[#1C1917]">
                  {totals.deliveryFee === 0 ? 'Free' : formatPKR(totals.deliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6E2DA] flex justify-between text-base font-bold text-[#1C1917]">
                <span>Total</span>
                <span className="tabular-nums">{formatPKR(totals.finalTotal)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
