import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Info, SlidersHorizontal, X } from 'lucide-react';
import { PRODUCTS, SHOP_DEPARTMENTS } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type { Product, SortOption } from '../../types/marhaba';
import { calculateDiscountPercent, filterAndSortProducts, formatPKR } from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';
import { ProductCard } from './ProductCard';
import { ShopSidebar } from './ShopSidebar';

const PAGE_SIZE = 12;

export function ShopPage() {
  const {
    shopFilter,
    setShopFilter,
    resetShopFilters,
    navigate,
    addToCart,
    currentBranch,
  } = useStore();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(PRODUCTS, shopFilter),
    [shopFilter]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [shopFilter]);

  useEffect(() => {
    if (!quickViewProduct) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickViewProduct(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [quickViewProduct]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const activeDepartment = useMemo(
    () => SHOP_DEPARTMENTS.find((d) => d.id === shopFilter.departmentId) || null,
    [shopFilter.departmentId]
  );

  // Build active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (activeDepartment) {
      chips.push({
        key: 'dept',
        label: `Department: ${activeDepartment.name}`,
        onRemove: () =>
          setShopFilter((p) => ({ ...p, departmentId: null, subcategory: null, attributes: {} })),
      });
    }
    if (shopFilter.subcategory) {
      chips.push({
        key: 'sub',
        label: `Subcategory: ${shopFilter.subcategory}`,
        onRemove: () => setShopFilter((p) => ({ ...p, subcategory: null })),
      });
    }
    for (const brand of shopFilter.brands) {
      chips.push({
        key: `brand-${brand}`,
        label: `Brand: ${brand}`,
        onRemove: () =>
          setShopFilter((p) => ({ ...p, brands: p.brands.filter((b) => b !== brand) })),
      });
    }
    if (shopFilter.minPrice !== null || shopFilter.maxPrice !== null) {
      chips.push({
        key: 'price',
        label: `Price: ${shopFilter.minPrice ?? 0} – ${shopFilter.maxPrice ?? 'Any'} PKR`,
        onRemove: () => setShopFilter((p) => ({ ...p, minPrice: null, maxPrice: null })),
      });
    }
    if (shopFilter.availability !== 'all') {
      chips.push({
        key: 'avail',
        label: shopFilter.availability === 'in-stock' ? 'In Stock' : 'Out of Stock',
        onRemove: () => setShopFilter((p) => ({ ...p, availability: 'all' })),
      });
    }
    if (shopFilter.offersOnly) {
      chips.push({
        key: 'offers',
        label: 'Offers Only',
        onRemove: () => setShopFilter((p) => ({ ...p, offersOnly: false })),
      });
    }
    if (shopFilter.searchQuery.trim()) {
      chips.push({
        key: 'search',
        label: `Search: "${shopFilter.searchQuery.trim()}"`,
        onRemove: () => setShopFilter((p) => ({ ...p, searchQuery: '' })),
      });
    }
    for (const [k, vals] of Object.entries(shopFilter.attributes)) {
      for (const v of vals) {
        chips.push({
          key: `attr-${k}-${v}`,
          label: `${k}: ${v}`,
          onRemove: () =>
            setShopFilter((p) => ({
              ...p,
              attributes: {
                ...p.attributes,
                [k]: (p.attributes[k] || []).filter((item) => item !== v),
              },
            })),
        });
      }
    }
    return chips;
  }, [activeDepartment, shopFilter, setShopFilter]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#57534E] mb-4">
        <button type="button" onClick={() => navigate('home')} className="hover:text-[#9B1C2E]">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        <button
          type="button"
          onClick={() => resetShopFilters()}
          className={!activeDepartment ? 'font-semibold text-[#1C1917]' : 'hover:text-[#9B1C2E]'}
        >
          Supermarket Shop
        </button>
        {activeDepartment && (
          <>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-semibold text-[#1C1917]">{activeDepartment.name}</span>
          </>
        )}
      </nav>

      {/* Clean Focused Shop Header (No promotional banner clutter) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6E2DA]">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
            {activeDepartment ? activeDepartment.name : 'Marhaba Supermarket Catalogue'}
          </h1>
          <p className="mt-1.5 text-sm text-[#57534E] max-w-2xl">
            {activeDepartment
              ? activeDepartment.shortDescription
              : 'Browse daily groceries, fresh dairy, pantry staples, personal care, and family household essentials available across Marhaba branches.'}
          </p>
        </div>
        <div className="text-xs text-[#57534E] shrink-0">
          Serving <span className="font-semibold text-[#1C1917]">{currentBranch.shortName}</span>
        </div>
      </div>

      {/* Quick Featured Departments Strip */}
      <div className="py-4 flex items-center gap-2 overflow-x-auto border-b border-[#E6E2DA]">
        <button
          type="button"
          onClick={() =>
            setShopFilter((prev) => ({ ...prev, departmentId: null, subcategory: null, attributes: {} }))
          }
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            shopFilter.departmentId === null
              ? 'bg-[#1C1917] text-white'
              : 'bg-[#F3F1EC] text-[#1C1917] hover:bg-[#E6E2DA]'
          }`}
        >
          All Departments
        </button>
        {SHOP_DEPARTMENTS.slice(0, 8).map((dept) => (
          <button
            key={dept.id}
            type="button"
            onClick={() =>
              setShopFilter((prev) => ({
                ...prev,
                departmentId: dept.id,
                subcategory: null,
                attributes: {},
              }))
            }
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              shopFilter.departmentId === dept.id
                ? 'bg-[#9B1C2E] text-white'
                : 'bg-[#F3F1EC] text-[#1C1917] hover:bg-[#E6E2DA]'
            }`}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Main Content Layout: Sidebar + Product Grid */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        <ShopSidebar
          filter={shopFilter}
          setFilter={setShopFilter}
          onReset={resetShopFilters}
          totalResults={filteredProducts.length}
          mobileOpen={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />

        <div className="flex-1 min-w-0 w-full">
          {/* Toolbar: Mobile Filter Trigger, Search/Result Count, Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 h-10 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-sm font-semibold text-[#1C1917]"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#9B1C2E]" />
                <span>Filters</span>
                {activeChips.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] bg-[#9B1C2E] text-white rounded">
                    {activeChips.length}
                  </span>
                )}
              </button>

              <p className="text-sm text-[#57534E] tabular-nums">
                Showing <span className="font-semibold text-[#1C1917]">{paginatedProducts.length}</span>{' '}
                of <span className="font-semibold text-[#1C1917]">{filteredProducts.length}</span>{' '}
                products
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort-select" className="text-xs font-medium text-[#57534E]">
                Sort by:
              </label>
              <select
                id="shop-sort-select"
                value={shopFilter.sortBy}
                onChange={(e) =>
                  setShopFilter((prev) => ({ ...prev, sortBy: e.target.value as SortOption }))
                }
                className="h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917]"
              >
                <option value="featured">Featured &amp; Verified</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F3F1EC] border border-[#E6E2DA] text-xs font-medium text-[#1C1917] hover:border-[#9B1C2E]"
                >
                  <span>{chip.label}</span>
                  <X className="w-3 h-3 text-[#57534E]" aria-hidden="true" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetShopFilters}
                className="text-xs font-semibold text-[#9B1C2E] hover:underline ml-1"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {paginatedProducts.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-10 text-center">
              <h2 className="text-lg font-semibold text-[#1C1917]">No matching products found</h2>
              <p className="mt-1.5 text-sm text-[#57534E]">
                Try removing one or more filters or clearing your search query to browse the full catalogue.
              </p>
              <button
                type="button"
                onClick={resetShopFilters}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 h-9 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917] disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setPage(pNum)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold tabular-nums ${
                    pNum === page
                      ? 'bg-[#9B1C2E] text-white'
                      : 'border border-[#E6E2DA] bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3F1EC]'
                  }`}
                >
                  {pNum}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 h-9 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}

          {/* Section 20 Data Integrity Notice */}
          <div className="mt-8 p-4 rounded-xl bg-[#F3F1EC] border border-[#E6E2DA] flex items-start gap-3 text-xs text-[#57534E]">
            <Info className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong className="text-[#1C1917]">Catalogue Accuracy Notice:</strong> Items labeled{' '}
              <em>Verified Price</em> reflect published Marhaba Supermarket PKR records (such as Olper&apos;s Milk,
              Nestlé Everyday, Steam Rice, Daal Mash, Besan, Maida, Fanta, and Pure Life). Items labeled{' '}
              <em>Demo Item</em> demonstrate full departmental taxonomy and filtering pending live store POS sync.
            </p>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view ${quickViewProduct.name}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickViewProduct(null);
          }}
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E6E2DA] max-w-2xl w-full overflow-hidden shadow-2xl grid grid-cols-1 sm:grid-cols-2">
            <div className="aspect-[4/3] sm:aspect-auto bg-[#F3F1EC]">
              <ProductPackshot
                image={quickViewProduct.image}
                name={quickViewProduct.name}
                brand={quickViewProduct.brand}
                unitLabel={quickViewProduct.unitLabel}
                style={quickViewProduct.packshotStyle}
                accent={quickViewProduct.packshotAccent}
              />
            </div>
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    {quickViewProduct.brand} · {quickViewProduct.unitLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(null)}
                    aria-label="Close quick view"
                    className="p-1.5 rounded-lg text-[#57534E] hover:bg-[#F3F1EC]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="mt-1.5 text-lg font-bold text-[#1C1917]">{quickViewProduct.name}</h2>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
                  {quickViewProduct.description}
                </p>
                <div className="mt-4 flex items-baseline gap-2.5">
                  <span className="text-xl font-bold text-[#1C1917] tabular-nums">
                    {formatPKR(quickViewProduct.price)}
                  </span>
                  {quickViewProduct.originalPrice &&
                    quickViewProduct.originalPrice > quickViewProduct.price && (
                      <>
                        <span className="text-sm text-[#57534E] line-through tabular-nums">
                          {formatPKR(quickViewProduct.originalPrice)}
                        </span>
                        <span className="text-xs font-semibold text-[#9B1C2E] tabular-nums">
                          -{calculateDiscountPercent(quickViewProduct.originalPrice, quickViewProduct.price)}%
                        </span>
                      </>
                    )}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!quickViewProduct.inStock}
                  onClick={() => {
                    addToCart(quickViewProduct, quickViewProduct.variants[0]?.id, 1);
                    setQuickViewProduct(null);
                  }}
                  className="w-full h-11 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] disabled:opacity-50"
                >
                  {quickViewProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = quickViewProduct.id;
                    setQuickViewProduct(null);
                    navigate('product', { productId: id });
                  }}
                  className="w-full h-10 rounded-xl border border-[#E6E2DA] text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  View Full Product Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
