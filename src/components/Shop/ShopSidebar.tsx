import React, { useMemo, useState } from 'react';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';
import { PRODUCTS, SHOP_DEPARTMENTS } from '../../data/marhabaData';
import type { ShopFilterState } from '../../types/marhaba';
import { formatPKR } from '../../utils/commerce';

interface ShopSidebarProps {
  filter: ShopFilterState;
  setFilter: React.Dispatch<React.SetStateAction<ShopFilterState>>;
  onReset: () => void;
  totalResults: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function ShopSidebar({
  filter,
  setFilter,
  onReset,
  totalResults,
  mobileOpen = false,
  onCloseMobile,
}: ShopSidebarProps) {
  const [brandQuery, setBrandQuery] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    departments: true,
    subcategories: true,
    brands: true,
    price: true,
    availability: true,
    attributes: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeDepartment = useMemo(
    () => SHOP_DEPARTMENTS.find((d) => d.id === filter.departmentId) || null,
    [filter.departmentId]
  );

  // Department product counts
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of PRODUCTS) {
      counts[p.departmentId] = (counts[p.departmentId] || 0) + 1;
    }
    return counts;
  }, []);

  // Context-aware brand list (from active department or full catalog)
  const availableBrands = useMemo(() => {
    const scope = filter.departmentId
      ? PRODUCTS.filter((p) => p.departmentId === filter.departmentId)
      : PRODUCTS;
    const set = new Set<string>(scope.map((p) => p.brand));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filter.departmentId]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return availableBrands;
    return availableBrands.filter((b) => b.toLowerCase().includes(q));
  }, [availableBrands, brandQuery]);

  // Actual price bounds from current product scope
  const priceBounds = useMemo(() => {
    const scope = filter.departmentId
      ? PRODUCTS.filter((p) => p.departmentId === filter.departmentId)
      : PRODUCTS;
    const prices = scope.map((p) => p.price);
    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 5000,
    };
  }, [filter.departmentId]);

  const toggleBrand = (brand: string) => {
    setFilter((prev) => {
      const exists = prev.brands.includes(brand);
      return {
        ...prev,
        brands: exists ? prev.brands.filter((b) => b !== brand) : [...prev.brands, brand],
      };
    });
  };

  const toggleAttribute = (attrKey: string, val: string) => {
    setFilter((prev) => {
      const current = prev.attributes[attrKey] || [];
      const exists = current.includes(val);
      const next = exists ? current.filter((v) => v !== val) : [...current, val];
      return {
        ...prev,
        attributes: {
          ...prev.attributes,
          [attrKey]: next,
        },
      };
    });
  };

  const sidebarBody = (
    <div className="space-y-5">
      {/* Header & Clear All */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E6E2DA]">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C1917]">Filters</h2>
          <p className="text-xs text-[#57534E] tabular-nums">{totalResults} products found</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B1C2E] hover:underline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      {/* 1. Departments */}
      <div className="border-b border-[#E6E2DA] pb-4">
        <button
          type="button"
          onClick={() => toggleSection('departments')}
          aria-expanded={openSections.departments}
          className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
        >
          <span>Departments</span>
          <ChevronDown
            className={`w-4 h-4 text-[#57534E] transition-transform ${
              openSections.departments ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.departments && (
          <ul className="mt-2.5 space-y-1 max-h-64 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    departmentId: null,
                    subcategory: null,
                    attributes: {},
                  }))
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter.departmentId === null
                    ? 'bg-[#9B1C2E] text-white'
                    : 'text-[#1C1917] hover:bg-[#F3F1EC]'
                }`}
              >
                <span>All Departments</span>
                <span className="tabular-nums opacity-80">{PRODUCTS.length}</span>
              </button>
            </li>
            {SHOP_DEPARTMENTS.map((dept) => {
              const count = deptCounts[dept.id] || 0;
              if (count === 0) return null;
              const active = filter.departmentId === dept.id;
              return (
                <li key={dept.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setFilter((prev) => ({
                        ...prev,
                        departmentId: dept.id,
                        subcategory: null,
                        attributes: {},
                      }))
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors ${
                      active
                        ? 'bg-[#9B1C2E] text-white'
                        : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917]'
                    }`}
                  >
                    <span className="truncate pr-2">{dept.name}</span>
                    <span className="tabular-nums opacity-80 shrink-0">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 2. Dynamic Subcategories (only when department is selected) */}
      {activeDepartment && (
        <div className="border-b border-[#E6E2DA] pb-4">
          <button
            type="button"
            onClick={() => toggleSection('subcategories')}
            aria-expanded={openSections.subcategories}
            className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
          >
            <span>Subcategories</span>
            <ChevronDown
              className={`w-4 h-4 text-[#57534E] transition-transform ${
                openSections.subcategories ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.subcategories && (
            <ul className="mt-2.5 space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setFilter((prev) => ({ ...prev, subcategory: null }))}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                    filter.subcategory === null
                      ? 'bg-[#F3F1EC] text-[#9B1C2E] font-semibold'
                      : 'text-[#57534E] hover:bg-[#FAF9F6]'
                  }`}
                >
                  All {activeDepartment.name}
                </button>
              </li>
              {activeDepartment.subcategories.map((sub) => (
                <li key={sub}>
                  <button
                    type="button"
                    onClick={() => setFilter((prev) => ({ ...prev, subcategory: sub }))}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium ${
                      filter.subcategory === sub
                        ? 'bg-[#F3F1EC] text-[#9B1C2E] font-semibold'
                        : 'text-[#57534E] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    {sub}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 3. Brands (with search inside brand list) */}
      <div className="border-b border-[#E6E2DA] pb-4">
        <button
          type="button"
          onClick={() => toggleSection('brands')}
          aria-expanded={openSections.brands}
          className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
        >
          <span>Brands</span>
          <ChevronDown
            className={`w-4 h-4 text-[#57534E] transition-transform ${
              openSections.brands ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.brands && (
          <div className="mt-2.5 space-y-2.5">
            {availableBrands.length > 5 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#57534E] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  placeholder="Find a brand..."
                  aria-label="Filter brand list"
                  className="w-full h-8 pl-8 pr-2.5 text-xs rounded-md border border-[#E6E2DA] bg-[#FAF9F6] focus:bg-[#FFFFFF] focus:border-[#9B1C2E] focus:outline-none"
                />
              </div>
            )}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {filteredBrands.map((brand) => {
                const checked = filter.brands.includes(brand);
                return (
                  <label
                    key={brand}
                    className="flex items-center gap-2.5 text-xs text-[#1C1917] cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(brand)}
                      className="w-4 h-4 rounded border-[#D6D3CD] accent-[#9B1C2E]"
                    />
                    <span className={checked ? 'font-semibold text-[#9B1C2E]' : ''}>{brand}</span>
                  </label>
                );
              })}
              {filteredBrands.length === 0 && (
                <p className="text-xs text-[#57534E]">No matching brands.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Price Range (PKR) */}
      <div className="border-b border-[#E6E2DA] pb-4">
        <button
          type="button"
          onClick={() => toggleSection('price')}
          aria-expanded={openSections.price}
          className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
        >
          <span>Price Range (PKR)</span>
          <ChevronDown
            className={`w-4 h-4 text-[#57534E] transition-transform ${
              openSections.price ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.price && (
          <div className="mt-2.5 space-y-2.5">
            <p className="text-[11px] text-[#57534E] tabular-nums">
              Range in catalog: {formatPKR(priceBounds.min)} – {formatPKR(priceBounds.max)}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="min-price-input" className="text-[11px] text-[#57534E]">
                  Min (Rs.)
                </label>
                <input
                  id="min-price-input"
                  type="number"
                  min={0}
                  value={filter.minPrice ?? ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      minPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder={String(priceBounds.min)}
                  className="mt-0.5 w-full h-8 px-2 text-xs rounded-md border border-[#E6E2DA] bg-[#FAF9F6] tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="max-price-input" className="text-[11px] text-[#57534E]">
                  Max (Rs.)
                </label>
                <input
                  id="max-price-input"
                  type="number"
                  min={0}
                  value={filter.maxPrice ?? ''}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      maxPrice: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder={String(priceBounds.max)}
                  className="mt-0.5 w-full h-8 px-2 text-xs rounded-md border border-[#E6E2DA] bg-[#FAF9F6] tabular-nums"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Under Rs. 500', min: null, max: 500 },
                { label: 'Rs. 500 – 1,500', min: 500, max: 1500 },
                { label: 'Rs. 1,500+', min: 1500, max: null },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    setFilter((prev) => ({
                      ...prev,
                      minPrice: preset.min,
                      maxPrice: preset.max,
                    }))
                  }
                  className="px-2 py-1 rounded bg-[#F3F1EC] hover:bg-[#E6E2DA] text-[11px] font-medium text-[#1C1917] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Availability & Offers */}
      <div className="border-b border-[#E6E2DA] pb-4">
        <button
          type="button"
          onClick={() => toggleSection('availability')}
          aria-expanded={openSections.availability}
          className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
        >
          <span>Availability &amp; Offers</span>
          <ChevronDown
            className={`w-4 h-4 text-[#57534E] transition-transform ${
              openSections.availability ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openSections.availability && (
          <div className="mt-2.5 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs font-medium text-[#9B1C2E] cursor-pointer">
              <input
                type="checkbox"
                checked={filter.offersOnly}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, offersOnly: e.target.checked }))
                }
                className="w-4 h-4 rounded accent-[#9B1C2E]"
              />
              <span>Discounted &amp; Offer Items Only</span>
            </label>

            <div className="space-y-1 pt-1">
              {(
                [
                  ['all', 'All Availability'],
                  ['in-stock', 'In Stock Only'],
                  ['out-of-stock', 'Out of Stock'],
                ] as const
              ).map(([val, label]) => (
                <label key={val} className="flex items-center gap-2.5 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    checked={filter.availability === val}
                    onChange={() => setFilter((prev) => ({ ...prev, availability: val }))}
                    className="w-3.5 h-3.5 accent-[#9B1C2E]"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Context-Specific Department Attributes (Only rendered when department has attributes) */}
      {activeDepartment && activeDepartment.attributeFilters.length > 0 && (
        <div className="pb-2">
          <button
            type="button"
            onClick={() => toggleSection('attributes')}
            aria-expanded={openSections.attributes}
            className="w-full flex items-center justify-between py-1 text-sm font-semibold text-[#1C1917]"
          >
            <span>{activeDepartment.name} Attributes</span>
            <ChevronDown
              className={`w-4 h-4 text-[#57534E] transition-transform ${
                openSections.attributes ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSections.attributes && (
            <div className="mt-2.5 space-y-3">
              {activeDepartment.attributeFilters.map((attr) => (
                <div key={attr.key}>
                  <p className="text-xs font-semibold text-[#57534E] mb-1.5">{attr.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.options.map((opt) => {
                      const active = (filter.attributes[attr.key] || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleAttribute(attr.key, opt)}
                          className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                            active
                              ? 'bg-[#9B1C2E] border-[#9B1C2E] text-white font-medium'
                              : 'bg-[#FAF9F6] border-[#E6E2DA] text-[#1C1917] hover:border-[#9B1C2E]/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        aria-label="Product Filters"
        className="hidden lg:block w-72 shrink-0 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 self-start sticky top-[168px] max-h-[calc(100vh-184px)] overflow-y-auto"
      >
        {sidebarBody}
      </aside>

      {/* Mobile Filter Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Filter Products"
        >
          <div
            className="fixed inset-0 bg-[#1C1917]/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-[#FFFFFF] h-full flex flex-col shadow-2xl">
            <div className="px-4 h-14 border-b border-[#E6E2DA] flex items-center justify-between shrink-0">
              <span className="font-semibold text-[#1C1917]">Filter Catalogue</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close filters"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebarBody}</div>
            <div className="p-4 border-t border-[#E6E2DA] bg-[#FAF9F6] grid grid-cols-2 gap-3 shrink-0">
              <button
                type="button"
                onClick={onReset}
                className="h-11 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-sm font-semibold text-[#1C1917]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={onCloseMobile}
                className="h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold"
              >
                Apply ({totalResults})
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
