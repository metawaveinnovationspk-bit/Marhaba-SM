import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  ZoomIn,
} from 'lucide-react';
import { PRODUCTS, SHOP_DEPARTMENTS } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import { calculateDiscountPercent, formatPKR, getRelatedProducts } from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';
import { ProductCard } from './ProductCard';

export function ProductDetailPage() {
  const {
    selectedProductId,
    navigate,
    addToCart,
    toggleWishlist,
    wishlist,
    openCart,
    currentBranch,
  } = useStore();

  const product = useMemo(
    () => PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0],
    [selectedProductId]
  );

  const department = useMemo(
    () => SHOP_DEPARTMENTS.find((d) => d.id === product.departmentId),
    [product.departmentId]
  );

  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'ingredients' | 'delivery'>(
    'description'
  );
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedVariantId(product.variants[0]?.id || '');
    setQuantity(1);
    setActiveTab('description');
    setAddedFeedback(false);
    setErrorMsg(null);
    setZoomed(false);
  }, [product]);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const currentPrice = activeVariant?.price ?? product.price;
  const originalPrice = activeVariant?.originalPrice ?? product.originalPrice;
  const discountPct = calculateDiscountPercent(originalPrice, currentPrice);
  const isInStock = product.inStock && (activeVariant ? activeVariant.inStock : true);
  const isWishlisted = wishlist.includes(product.id);

  // Only expose non-empty tabs
  const availableTabs = useMemo(() => {
    const tabs: { id: 'description' | 'specs' | 'ingredients' | 'delivery'; label: string }[] = [
      { id: 'description', label: 'Description' },
    ];
    if (product.specifications.length > 0) {
      tabs.push({ id: 'specs', label: 'Specifications' });
    }
    if (product.ingredients || product.storageUsage) {
      tabs.push({ id: 'ingredients', label: 'Ingredients & Storage' });
    }
    tabs.push({ id: 'delivery', label: 'Delivery & Returns' });
    return tabs;
  }, [product]);

  // Meaningful related & complementary products (always fills 4 balanced cards on desktop)
  const relatedProducts = useMemo(() => {
    return getRelatedProducts(PRODUCTS, product, 4);
  }, [product]);

  const handleAdd = () => {
    const res = addToCart(product, activeVariant?.id, quantity);
    if (!res.ok) {
      setErrorMsg(res.error || 'Could not add item.');
      return;
    }
    setErrorMsg(null);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#57534E] mb-6">
        <button type="button" onClick={() => navigate('home')} className="hover:text-[#9B1C2E]">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <button
          type="button"
          onClick={() => navigate('shop', { resetShopFilter: true })}
          className="hover:text-[#9B1C2E]"
        >
          Shop
        </button>
        {department && (
          <>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            <button
              type="button"
              onClick={() =>
                navigate('shop', {
                  resetShopFilter: true,
                  shopFilter: { departmentId: department.id },
                })
              }
              className="hover:text-[#9B1C2E]"
            >
              {department.name}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="font-semibold text-[#1C1917] truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main 2-Column Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT: Product Visual Gallery with Zoom */}
        <div className="lg:col-span-6 lg:sticky lg:top-[168px] space-y-3">
          <div className="relative aspect-[4/3] rounded-2xl border border-[#E6E2DA] bg-[#F3F1EC] overflow-hidden">
            <div
              className={`w-full h-full transition-transform duration-300 ${
                zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setZoomed((z) => !z)}
            >
              <ProductPackshot
                image={product.image}
                name={product.name}
                brand={product.brand}
                unitLabel={activeVariant?.label || product.unitLabel}
                style={product.packshotStyle}
                accent={product.packshotAccent}
              />
            </div>

            {discountPct > 0 && (
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#9B1C2E] text-white text-xs font-semibold tabular-nums">
                Save {discountPct}%
              </span>
            )}

            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? 'Reset product image zoom' : 'Zoom product image'}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-[#FFFFFF]/95 border border-[#E6E2DA] text-xs font-semibold text-[#1C1917] inline-flex items-center gap-1.5 shadow-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{zoomed ? 'Reset Zoom' : 'Inspect'}</span>
            </button>
          </div>

          <p className="text-xs text-[#57534E]">
            {product.image
              ? 'Studio category showcase — exact packaging may vary by batch.'
              : 'Clean studio packaging preview — official SKU packshot photography awaiting store asset upload.'}
          </p>
        </div>

        {/* RIGHT: Product Details & Purchasing Controls */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
            <span className="font-semibold uppercase tracking-wider text-[#9B1C2E]">
              {product.brand}
            </span>
            <span className="font-mono text-[11px] text-[#57534E]">
              SKU: {activeVariant?.sku || product.sku}
            </span>
          </div>

          <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] leading-tight">
            {product.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
            <span>{department?.name}</span>
            <span aria-hidden="true">·</span>
            <span>{product.subcategory}</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#1C1917]">
              {product.dataTier === 'verified' ? 'Verified Marhaba Price' : 'Demonstration Catalogue'}
            </span>
          </div>

          {/* Pricing */}
          <div className="mt-5 pb-5 border-b border-[#E6E2DA] flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-[#1C1917] tabular-nums">
              {formatPKR(currentPrice)}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <>
                <span className="text-base text-[#57534E] line-through tabular-nums">
                  {formatPKR(originalPrice)}
                </span>
                <span className="text-sm font-semibold text-[#9B1C2E] tabular-nums">
                  Save {formatPKR(originalPrice - currentPrice)} ({discountPct}% off)
                </span>
              </>
            )}
          </div>

          {/* Stock Availability */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span
              className={`font-semibold ${isInStock ? 'text-[#166534]' : 'text-[#9B1C2E]'}`}
            >
              {isInStock ? 'In Stock' : 'Currently Out of Stock'}
            </span>
            <span className="text-[#57534E]">
              · {product.stockNote || `Available at ${currentBranch.shortName}`}
            </span>
          </div>

          {/* Variations Selector */}
          {product.variants.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-2">
                Pack / Variation
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const selected = variant.id === activeVariant?.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selected
                          ? 'border-[#9B1C2E] bg-[#9B1C2E]/5 text-[#9B1C2E] font-semibold'
                          : 'border-[#E6E2DA] bg-[#FAF9F6] text-[#1C1917] hover:border-[#9B1C2E]/40'
                      }`}
                    >
                      <span>{variant.label}</span>
                      <span className="ml-2 text-xs tabular-nums text-[#57534E]">
                        {formatPKR(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="inline-flex items-center justify-between border border-[#E6E2DA] rounded-lg bg-[#FAF9F6] h-12 px-2 sm:w-36">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-md inline-flex items-center justify-center text-[#1C1917] hover:bg-[#E6E2DA]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-[#1C1917] tabular-nums">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="w-9 h-9 rounded-md inline-flex items-center justify-center text-[#1C1917] hover:bg-[#E6E2DA]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!isInStock}
              onClick={handleAdd}
              className="flex-1 h-12 px-6 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] disabled:bg-[#E6E2DA] disabled:text-[#57534E] inline-flex items-center justify-center gap-2 transition-colors"
            >
              {addedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isInStock ? 'Add to Cart' : 'Out of Stock'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`h-12 px-4 rounded-lg border inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                isWishlisted
                  ? 'border-[#9B1C2E] bg-[#9B1C2E]/5 text-[#9B1C2E]'
                  : 'border-[#E6E2DA] text-[#1C1917] hover:bg-[#FAF9F6]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              <span className="sm:hidden lg:inline">{isWishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>
          </div>

          {errorMsg && (
            <p role="alert" className="mt-3 text-xs font-medium text-[#9B1C2E]">
              {errorMsg}
            </p>
          )}

          {addedFeedback && (
            <div className="mt-3 p-3 rounded-lg bg-[#166534]/10 border border-[#166534]/20 flex items-center justify-between gap-3 text-xs text-[#166534]">
              <span className="font-medium">
                Item added to your cart ({quantity} × {activeVariant?.label || product.unitLabel}).
              </span>
              <button
                type="button"
                onClick={openCart}
                className="font-bold underline shrink-0"
              >
                View Cart
              </button>
            </div>
          )}

          {/* Convenience Trust Strip */}
          <div className="mt-6 pt-5 border-t border-[#E6E2DA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#57534E]">
            <div className="flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
              <span>Free demo delivery on orders Rs. 5,000+ or convenient in-store pickup.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#9B1C2E] shrink-0 mt-0.5" />
              <span>Freshness &amp; authentic sealed packaging checked at Marhaba counters.</span>
            </div>
          </div>

          {/* Non-empty Information Tabs */}
          <div className="mt-8">
            <div className="flex items-center gap-4 border-b border-[#E6E2DA] overflow-x-auto">
              {availableTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#9B1C2E] text-[#9B1C2E]'
                      : 'border-transparent text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-4 text-sm text-[#57534E] leading-relaxed">
              {activeTab === 'description' && <p>{product.description}</p>}

              {activeTab === 'specs' && (
                <dl className="divide-y divide-[#E6E2DA]">
                  {product.specifications.map((spec) => (
                    <div key={spec.label} className="py-2 flex items-center justify-between gap-4">
                      <dt className="font-medium text-[#1C1917]">{spec.label}</dt>
                      <dd className="text-[#57534E] text-right">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {activeTab === 'ingredients' && (
                <div className="space-y-3">
                  {product.ingredients && (
                    <div>
                      <p className="font-semibold text-[#1C1917]">Ingredients / Composition</p>
                      <p className="mt-1">{product.ingredients}</p>
                    </div>
                  )}
                  {product.storageUsage && (
                    <div>
                      <p className="font-semibold text-[#1C1917]">Storage &amp; Usage</p>
                      <p className="mt-1">{product.storageUsage}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="space-y-2">
                  <p>
                    Orders placed in this interactive experience run through a simulated demonstration
                    checkout. For immediate local fulfillment or store pickup, please confirm stock with
                    your selected branch ({currentBranch.shortName}).
                  </p>
                  <p>
                    Sealed, undamaged non-perishable items may be exchanged at the Marhaba customer
                    service desk with original receipt as per standard store policy.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#E6E2DA]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Related &amp; Complementary</h2>
              <p className="text-sm text-[#57534E]">
                Selected from {department?.name || product.brand} &amp; everyday Marhaba staples
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate('shop', {
                  resetShopFilter: true,
                  shopFilter: { departmentId: product.departmentId },
                })
              }
              className="text-sm font-semibold text-[#9B1C2E] hover:underline"
            >
              Browse Department &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
