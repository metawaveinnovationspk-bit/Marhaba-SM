import React, { useEffect } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatPKR } from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';

export function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cart,
    cartTotals,
    setCartQty,
    removeFromCart,
    navigate,
  } = useStore();

  useEffect(() => {
    if (!isCartOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-[1px]"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 h-16 border-b border-[#E6E2DA] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#9B1C2E]" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1C1917]">
              Your Cart <span className="text-[#57534E] font-normal tabular-nums">({cartTotals.itemCount})</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close shopping cart"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#1C1917] hover:bg-[#F3F1EC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress Bar */}
        {cart.length > 0 && (
          <div className="px-5 py-3 bg-[#FAF9F6] border-b border-[#E6E2DA] text-xs shrink-0">
            {cartTotals.amountToFreeDelivery > 0 ? (
              <p className="text-[#57534E]">
                Add{' '}
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {formatPKR(cartTotals.amountToFreeDelivery)}
                </span>{' '}
                more for free standard delivery (demo threshold {formatPKR(cartTotals.freeDeliveryThreshold)}).
              </p>
            ) : (
              <p className="font-semibold text-[#166534]">
                Your order qualifies for free standard delivery.
              </p>
            )}
          </div>
        )}

        {/* Cart Line Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-[#E6E2DA]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#D6D3CD] mb-3" />
              <p className="text-base font-semibold text-[#1C1917]">Your supermarket cart is empty</p>
              <p className="mt-1 text-sm text-[#57534E] max-w-xs">
                Explore groceries, fresh dairy, pantry staples, and family care essentials.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('shop');
                }}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-3.5">
                <div className="w-20 h-20 rounded-lg border border-[#E6E2DA] bg-[#F3F1EC] overflow-hidden shrink-0">
                  <ProductPackshot
                    image={item.image}
                    name={item.name}
                    brand={item.brand}
                    unitLabel={item.variantLabel}
                    style={item.packshotStyle}
                    accent={item.packshotAccent}
                    compact
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                        {item.brand}
                      </p>
                      <p className="text-sm font-semibold text-[#1C1917] leading-snug line-clamp-2">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#57534E] mt-0.5">{item.variantLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="p-2 text-[#57534E] hover:text-[#9B1C2E] rounded-lg hover:bg-[#FAF9F6]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center border border-[#E6E2DA] rounded-lg bg-[#FAF9F6] h-9">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => setCartQty(item.productId, item.variantId, item.quantity - 1)}
                        className="w-9 h-full inline-flex items-center justify-center text-[#1C1917] hover:bg-[#E6E2DA] rounded-l-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-[#1C1917] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setCartQty(item.productId, item.variantId, item.quantity + 1)}
                        className="w-9 h-full inline-flex items-center justify-center text-[#1C1917] hover:bg-[#E6E2DA] rounded-r-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-[#1C1917] tabular-nums">
                        {formatPKR(item.unitPrice * item.quantity)}
                      </p>
                      <p className="text-[11px] text-[#57534E] tabular-nums">
                        {formatPKR(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#E6E2DA] bg-[#FAF9F6] space-y-3 shrink-0">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#57534E]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {formatPKR(cartTotals.subtotal)}
                </span>
              </div>
              {cartTotals.totalSavings > 0 && (
                <div className="flex justify-between text-[#166534]">
                  <span>Discount Savings</span>
                  <span className="font-semibold tabular-nums">
                    -{formatPKR(cartTotals.totalSavings)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#57534E]">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-[#1C1917] tabular-nums">
                  {cartTotals.deliveryFee === 0 ? 'Free' : formatPKR(cartTotals.deliveryFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E6E2DA] flex justify-between text-base font-bold text-[#1C1917]">
                <span>Total</span>
                <span className="tabular-nums">{formatPKR(cartTotals.finalTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                closeCart();
                navigate('checkout');
              }}
              className="w-full h-12 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
