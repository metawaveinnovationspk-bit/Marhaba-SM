import React, { useMemo, useState } from 'react';
import { ArrowUpDown, BadgePercent, CheckCircle2, Lock, Plus, Search, X } from 'lucide-react';
import { hasPermission } from '../../erp/permissions';
import { formatPKR } from '../../utils/commerce';
import { managementApi, type ManagementBootstrapPayload } from './managementApi';

interface CatalogOffersModuleProps {
  mode: 'products' | 'offers';
  data: ManagementBootstrapPayload;
  onRefresh: () => Promise<void>;
}

export function CatalogOffersModule({ mode, data, onRefresh }: CatalogOffersModuleProps) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'sku' | 'name' | 'sellingPrice'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // New Product Form
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newDept, setNewDept] = useState(data.departments[0]?.id || 'grocery-pantry');
  const [newUnit, setNewUnit] = useState('1 Pack');
  const [newCost, setNewCost] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Offers & Price Request Form
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('10');
  const [promoDept, setPromoDept] = useState(data.departments[0]?.id || 'grocery-pantry');
  const [priceProdId, setPriceProdId] = useState(data.products[0]?.id || '');
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');

  const canCreateProduct = hasPermission(data.user.roleId, 'products', 'create');
  const canSubmitOffer = hasPermission(data.user.roleId, 'offers', 'submit') || hasPermission(data.user.roleId, 'offers', 'create');
  const showCostMargin = data.role.canViewCostAndMargin;

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = data.products.filter((p) => {
      if (deptFilter !== 'all' && p.departmentId !== deptFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'sellingPrice') return (a.sellingPrice - b.sellingPrice) * mul;
      return a[sortBy].localeCompare(b[sortBy]) * mul;
    });
  }, [data.products, search, deptFilter, sortBy, sortDir]);

  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (col: 'sku' | 'name' | 'sellingPrice') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.createProduct({
        sku: newSku,
        barcode: newBarcode,
        name: newName,
        brand: newBrand,
        departmentId: newDept,
        unitLabel: newUnit,
        purchaseCost: Number(newCost),
        sellingPrice: Number(newPrice),
      });
      setAddOpen(false);
      setNewSku('');
      setNewBarcode('');
      setNewName('');
      setNewCost('');
      setNewPrice('');
      setFeedback({ type: 'ok', text: 'New SKU added to Master Catalogue and website feed synced.' });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Validation failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await managementApi.createPromotion({
        title: promoTitle,
        discountPercent: Number(promoDiscount),
        departmentId: promoDept,
        branchScope: data.activeBranchScope,
      });
      setPromoTitle('');
      setFeedback({
        type: 'ok',
        text: `Campaign "${res.promotion.title}" recorded (${res.promotion.status}).`,
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Could not create promotion.' });
    } finally {
      setBusy(false);
    }
  };

  const handlePriceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await managementApi.submitPriceRequest({
        productId: priceProdId,
        proposedPrice: Number(proposedPrice),
        justification: priceReason,
      });
      setProposedPrice('');
      setPriceReason('');
      setFeedback({
        type: 'ok',
        text: 'Price change request queued for independent Director / CEO approval.',
      });
      await onRefresh();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Failed to submit price change.' });
    } finally {
      setBusy(false);
    }
  };

  if (mode === 'offers') {
    return (
      <div className="space-y-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E6E2DA] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1C1917]">
                Promotions &amp; Department Offers ({data.promotions.length})
              </h2>
              <BadgePercent className="w-4 h-4 text-[#9B1C2E]" />
            </div>
            <div className="divide-y divide-[#E6E2DA]">
              {data.promotions.map((pr) => (
                <div key={pr.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1C1917]">{pr.title}</p>
                    <p className="mt-1 text-[11px] text-[#57534E]">
                      Dept: {pr.departmentId} · Scope: {pr.branchScope} · {pr.startDate} to {pr.endDate}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#166534]/10 text-[#166534] text-xs font-bold tabular-nums">
                      -{pr.discountPercent}%
                    </span>
                    <p className="mt-1 text-[10px] font-semibold text-[#57534E]">{pr.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-5 space-y-5">
            {canSubmitOffer && (
              <>
                <form
                  onSubmit={handleCreatePromo}
                  className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
                >
                  <h3 className="text-sm font-bold text-[#1C1917]">Create Promotional Campaign</h3>
                  <input
                    type="text"
                    required
                    value={promoTitle}
                    onChange={(e) => setPromoTitle(e.target.value)}
                    placeholder="Campaign title (e.g. Weekend Dairy Savings)"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2.5">
                    <select
                      value={promoDept}
                      onChange={(e) => setPromoDept(e.target.value)}
                      className="h-10 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                    >
                      {data.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={promoDiscount}
                      onChange={(e) => setPromoDiscount(e.target.value)}
                      placeholder="Discount %"
                      className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-10 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
                  >
                    Launch / Submit Promotion
                  </button>
                </form>

                <form
                  onSubmit={handlePriceRequest}
                  className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-3"
                >
                  <h3 className="text-sm font-bold text-[#1C1917]">
                    Submit Controlled Price Change Request
                  </h3>
                  <p className="text-[11px] text-[#57534E]">
                    Enforces segregation of duties: requires independent Director / CEO approval.
                  </p>
                  <select
                    value={priceProdId}
                    onChange={(e) => setPriceProdId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                  >
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {formatPKR(p.sellingPrice)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    required
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="Proposed selling price (PKR)"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={priceReason}
                    onChange={(e) => setPriceReason(e.target.value)}
                    placeholder="Supplier cost / rebate justification"
                    className="w-full h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-10 rounded-lg bg-[#1C1917] text-white text-xs font-semibold hover:bg-[#292524]"
                  >
                    Submit for Approval
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search, Filter & Add SKU Header */}
      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#57534E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search SKU, GTIN barcode, brand, or product name..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-medium"
          >
            <option value="all">All Departments ({data.products.length})</option>
            {data.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!showCostMargin && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] text-[11px] font-medium text-[#57534E]">
              <Lock className="w-3 h-3 text-[#9B1C2E]" />
              <span>Cost &amp; Margin Redacted</span>
            </span>
          )}
          {canCreateProduct && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="h-10 px-4 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Master SKU</span>
            </button>
          )}
        </div>
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

      {addOpen && (
        <form
          onSubmit={handleCreateProduct}
          className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E6E2DA] pb-3">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Create New Supermarket Product (Duplicate SKU &amp; Barcode Protected)
            </h3>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="p-1 text-[#57534E] hover:text-[#1C1917]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              placeholder="SKU (e.g. MRH-GRO-991)"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
            />
            <input
              type="text"
              required
              value={newBarcode}
              onChange={(e) => setNewBarcode(e.target.value)}
              placeholder="GTIN / Barcode (min 6 chars)"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
            />
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Product Name"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs sm:col-span-2"
            />
            <input
              type="text"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Brand"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            />
            <select
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs"
            >
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="Purchase Cost (PKR)"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
            />
            <input
              type="number"
              required
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Selling Price (PKR)"
              className="h-10 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="px-4 h-9 rounded-lg border border-[#E6E2DA] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 h-9 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
            >
              Save Master SKU
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] text-[#57534E] border-b border-[#E6E2DA]">
              <tr>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('sku')}
                    className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                  >
                    <span>SKU &amp; Barcode</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                  >
                    <span>Product</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Department</th>
                {showCostMargin && (
                  <>
                    <th className="py-3 px-4 font-semibold text-right">Purchase Cost</th>
                    <th className="py-3 px-4 font-semibold text-right">Margin</th>
                  </>
                )}
                <th className="py-3 px-4 font-semibold text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('sellingPrice')}
                    className="inline-flex items-center gap-1 hover:text-[#1C1917] ml-auto"
                  >
                    <span>Selling Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Reorder Pt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2DA]">
              {pagedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={showCostMargin ? 7 : 5}
                    className="py-8 px-4 text-center text-xs text-[#57534E]"
                  >
                    No catalogue SKUs match your search or department filter.
                  </td>
                </tr>
              ) : (
                pagedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F6]">
                    <td className="py-2.5 px-4 font-mono">
                      <p className="font-semibold text-[#1C1917]">{p.sku}</p>
                      <p className="text-[11px] text-[#57534E]">{p.barcode}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-[#1C1917]">{p.name}</p>
                      <p className="text-[11px] text-[#57534E]">
                        {p.brand} · {p.unitLabel}
                      </p>
                    </td>
                    <td className="py-2.5 px-4 text-[#57534E]">{p.departmentName}</td>
                    {showCostMargin && (
                      <>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#57534E]">
                          {p.purchaseCost !== null ? formatPKR(p.purchaseCost) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#166534]">
                          {p.marginPercent !== null ? `${p.marginPercent}%` : '—'}
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums text-[#1C1917]">
                      {formatPKR(p.sellingPrice)}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-[#57534E]">
                      {p.reorderPoint}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#E6E2DA] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
          <span className="tabular-nums">
            Showing {filteredProducts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} SKUs
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] font-semibold text-[#1C1917] disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-[11px]">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] font-semibold text-[#1C1917] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
