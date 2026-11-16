import React from 'react';
import { Eye, Heart, Plus, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types/marhaba';
import { calculateDiscountPercent, formatPKR } from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist, navigate } = useStore();
  const isWishlisted = wishlist.includes(product.id);
  const discountPct = calculateDiscountPercent(product.originalPrice, product.price);
  const defaultVariantId = product.variants[0]?.id;

  return (
    <article className="group bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(28,25,23,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(28,25,23,0.1)]">
      {/* Product Image / Studio Packshot Container */}
      <div className="relative aspect-[4/3] bg-[#F3F1EC] overflow-hidden">
        <button
          type="button"
          onClick={() => navigate('product', { productId: product.id })}
          aria-label={`View details for ${product.name}`}
          className="w-full h-full block text-left"
        >
          <ProductPackshot
            image={product.image}
            name={product.name}
            brand={product.brand}
            unitLabel={product.unitLabel}
            style={product.packshotStyle}
            accent={product.packshotAccent}
          />
        </button>

        {/* Top-left restrained discount label (only when genuinely discounted) */}
        {discountPct > 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-[#9B1C2E] text-white text-[11px] font-semibold tabular-nums shadow-xs">
            -{discountPct}%
          </span>
        )}

        {/* Top-right action icons: Wishlist & Quick View */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label={`Quick view ${product.name}`}
              className="w-9 h-9 rounded-xl bg-[#FFFFFF]/95 border border-[#E6E2DA] text-[#1C1917] hover:text-[#9B1C2E] hover:border-[#9B1C2E]/40 inline-flex items-center justify-center shadow-xs transition-colors"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={
              isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`
            }
            aria-pressed={isWishlisted}
            className={`w-9 h-9 rounded-xl border inline-flex items-center justify-center shadow-xs transition-colors ${
              isWishlisted
                ? 'bg-[#9B1C2E] border-[#9B1C2E] text-white'
                : 'bg-[#FFFFFF]/95 border-[#E6E2DA] text-[#57534E] hover:text-[#9B1C2E] hover:border-[#9B1C2E]/40'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
            <span className="font-semibold uppercase tracking-wider truncate">{product.brand}</span>
            <span className="text-[11px] font-medium text-[#57534E] shrink-0">
              {product.dataTier === 'verified' ? 'Verified Price' : 'Demo Item'}
            </span>
          </div>

          <h3 className="mt-1 text-[15px] font-semibold text-[#1C1917] leading-snug line-clamp-2">
            <button
              type="button"
              onClick={() => navigate('product', { productId: product.id })}
              className="text-left hover:text-[#9B1C2E] transition-colors"
            >
              {product.name}
            </button>
          </h3>

          <p className="mt-1 text-xs text-[#57534E]">
            {product.unitLabel}
            <span aria-hidden="true"> · </span>
            <span className={product.inStock ? 'text-[#166534] font-medium' : 'text-[#9B1C2E] font-medium'}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </p>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-3 border-t border-[#E6E2DA]/80 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#1C1917] tabular-nums">
                {formatPKR(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-[#57534E] line-through tabular-nums">
                  {formatPKR(product.originalPrice)}
                </span>
              )}
            </div>
            {discountPct > 0 && product.originalPrice && (
              <p className="text-[11px] font-semibold text-[#9B1C2E] tabular-nums">
                Save {formatPKR(product.originalPrice - product.price)}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => addToCart(product, defaultVariantId, 1)}
            aria-label={`Add ${product.name} to cart`}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
              product.inStock
                ? 'bg-[#1C1917] text-white hover:bg-[#9B1C2E]'
                : 'bg-[#F3F1EC] text-[#57534E] cursor-not-allowed'
            }`}
          >
            {product.inStock ? (
              <>
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Unavailable</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
