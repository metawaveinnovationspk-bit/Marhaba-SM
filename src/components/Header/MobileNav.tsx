import React, { useEffect, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Home,
  MapPin,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { SHOP_DEPARTMENTS, VERIFIED_BRANCHES } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type { PlayLandSection, RestaurantSection } from '../../types/marhaba';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const {
    route,
    branchId,
    setBranchId,
    navigate,
    navigateToManagement,
    cartTotals,
    openCart,
  } = useStore();

  const [expandedGroup, setExpandedGroup] = useState<'shop' | 'restaurant' | 'playland' | null>('shop');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const navAndClose = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <>
      {/* Slide-over Mobile Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div
            className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-[1px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-[#FFFFFF] h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="px-4 h-16 border-b border-[#E6E2DA] flex items-center justify-between shrink-0">
              <div>
                <p className="font-serif text-lg font-bold text-[#1C1917]">Marhaba Supermarket</p>
                <p className="text-xs text-[#57534E]">Shop · Dine · Play Land</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#1C1917] hover:bg-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Branch Switcher */}
            <div className="px-4 py-3 bg-[#F3F1EC] border-b border-[#E6E2DA] shrink-0">
              <label
                htmlFor="mobile-branch-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#57534E] mb-1"
              >
                <MapPin className="w-3.5 h-3.5 text-[#9B1C2E]" />
                <span>Selected Branch</span>
              </label>
              <select
                id="mobile-branch-select"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#FFFFFF] border border-[#E6E2DA] text-sm font-medium text-[#1C1917]"
              >
                {VERIFIED_BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              <button
                type="button"
                onClick={() => navAndClose(() => navigate('home'))}
                className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
              >
                <span>Home</span>
                <ChevronRight className="w-4 h-4 text-[#57534E]" />
              </button>

              {/* SHOP Expandable */}
              <div className="border-t border-[#E6E2DA] pt-1">
                <button
                  type="button"
                  aria-expanded={expandedGroup === 'shop'}
                  onClick={() => setExpandedGroup(expandedGroup === 'shop' ? null : 'shop')}
                  className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  <span>Shop Departments (17)</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedGroup === 'shop' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedGroup === 'shop' && (
                  <div className="pl-3 pr-1 pb-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => navAndClose(() => navigate('shop', { resetShopFilter: true }))}
                      className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-[#9B1C2E] bg-[#FAF9F6]"
                    >
                      View All Supermarket Products
                    </button>
                    {SHOP_DEPARTMENTS.map((dept) => {
                      const deptOpen = expandedDept === dept.id;
                      return (
                        <div key={dept.id}>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() =>
                                navAndClose(() =>
                                  navigate('shop', {
                                    resetShopFilter: true,
                                    shopFilter: { departmentId: dept.id },
                                  })
                                )
                              }
                              className="flex-1 text-left px-3 py-2 text-sm text-[#1C1917] hover:text-[#9B1C2E]"
                            >
                              {dept.name}
                            </button>
                            <button
                              type="button"
                              aria-label={`Toggle ${dept.name} subcategories`}
                              aria-expanded={deptOpen}
                              onClick={() => setExpandedDept(deptOpen ? null : dept.id)}
                              className="p-2 text-[#57534E]"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${deptOpen ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </div>
                          {deptOpen && (
                            <div className="pl-5 pb-1.5 space-y-1">
                              {dept.subcategories.map((sub) => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={() =>
                                    navAndClose(() =>
                                      navigate('shop', {
                                        resetShopFilter: true,
                                        shopFilter: { departmentId: dept.id, subcategory: sub },
                                      })
                                    )
                                  }
                                  className="block w-full text-left py-1.5 text-xs text-[#57534E] hover:text-[#9B1C2E]"
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RESTAURANT Expandable */}
              <div className="border-t border-[#E6E2DA] pt-1">
                <button
                  type="button"
                  aria-expanded={expandedGroup === 'restaurant'}
                  onClick={() =>
                    setExpandedGroup(expandedGroup === 'restaurant' ? null : 'restaurant')
                  }
                  className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  <span>Restaurant &amp; Dining</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedGroup === 'restaurant' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedGroup === 'restaurant' && (
                  <div className="pl-4 pb-2 space-y-1">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['menu', 'Explore Menu'],
                        ['cuisines', 'Cuisines'],
                        ['offers', 'Deals & Offers'],
                        ['dining', 'Dining Experience'],
                        ['gallery', 'Gallery'],
                        ['reservations', 'Reservations'],
                      ] as [RestaurantSection, string][]
                    ).map(([sec, label]) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          navAndClose(() => navigate('restaurant', { restaurantSection: sec }))
                        }
                        className="block w-full text-left px-3 py-2 text-sm text-[#57534E] hover:text-[#9B1C2E]"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PLAY LAND Expandable */}
              <div className="border-t border-[#E6E2DA] pt-1">
                <button
                  type="button"
                  aria-expanded={expandedGroup === 'playland'}
                  onClick={() =>
                    setExpandedGroup(expandedGroup === 'playland' ? null : 'playland')
                  }
                  className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  <span>Play Land</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedGroup === 'playland' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedGroup === 'playland' && (
                  <div className="pl-4 pb-2 space-y-1">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['attractions', 'Rides & Attractions'],
                        ['ages', 'Explore by Age'],
                        ['packages', 'Tickets & Packages'],
                        ['birthdays', 'Birthdays'],
                        ['parents-guide', 'Parent Guide'],
                        ['plan-visit', 'Plan Your Visit'],
                      ] as [PlayLandSection, string][]
                    ).map(([sec, label]) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          navAndClose(() => navigate('playland', { playLandSection: sec }))
                        }
                        className="block w-full text-left px-3 py-2 text-sm text-[#57534E] hover:text-[#166534]"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Pages */}
              <div className="border-t border-[#E6E2DA] pt-2 space-y-1">
                {(
                  [
                    ['offers', 'Offers & Promotions'],
                    ['locations', 'Locations & Hours'],
                    ['about', 'About Marhaba'],
                    ['contact', 'Contact Support'],
                    ['wishlist', 'Wishlist'],
                    ['account', 'Account & Inquiries'],
                  ] as const
                ).map(([targetRoute, label]) => (
                  <button
                    key={targetRoute}
                    type="button"
                    onClick={() => navAndClose(() => navigate(targetRoute))}
                    className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#FAF9F6]"
                  >
                    <span>{label}</span>
                    <ChevronRight className="w-4 h-4 text-[#57534E]" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => navAndClose(() => navigateToManagement('/management'))}
                  className="w-full flex items-center justify-between px-3 min-h-[44px] rounded-lg text-sm font-semibold text-[#9B1C2E] bg-[#FAF9F6] border border-[#E6E2DA] mt-2"
                >
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Supermarket Management Portal</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slim Bottom Quick Access Bar (<= 56px to stay well under 15% mobile sticky cap) */}
      <nav
        aria-label="Mobile Quick Access"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#FFFFFF]/95 backdrop-blur-sm border-t border-[#E6E2DA] grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          aria-current={route === 'home' ? 'page' : undefined}
          onClick={() => navigate('home')}
          className={`flex flex-col items-center justify-center h-full text-[11px] font-medium ${
            route === 'home' ? 'text-[#9B1C2E] font-semibold' : 'text-[#57534E]'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          type="button"
          aria-current={route === 'shop' || route === 'product' ? 'page' : undefined}
          onClick={() => navigate('shop')}
          className={`flex flex-col items-center justify-center h-full text-[11px] font-medium ${
            route === 'shop' || route === 'product' ? 'text-[#9B1C2E] font-semibold' : 'text-[#57534E]'
          }`}
        >
          <Store className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Shop</span>
        </button>
        <button
          type="button"
          aria-current={route === 'restaurant' ? 'page' : undefined}
          onClick={() => navigate('restaurant')}
          className={`flex flex-col items-center justify-center h-full text-[11px] font-medium ${
            route === 'restaurant' ? 'text-[#9B1C2E] font-semibold' : 'text-[#57534E]'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Dining</span>
        </button>
        <button
          type="button"
          aria-current={route === 'playland' ? 'page' : undefined}
          onClick={() => navigate('playland')}
          className={`flex flex-col items-center justify-center h-full text-[11px] font-medium ${
            route === 'playland' ? 'text-[#166534] font-semibold' : 'text-[#57534E]'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" aria-hidden="true" />
          <span>Play Land</span>
        </button>
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center h-full text-[11px] font-medium text-[#1C1917]"
        >
          <ShoppingBag className="w-4 h-4 mb-0.5 text-[#9B1C2E]" aria-hidden="true" />
          <span className="tabular-nums">Cart ({cartTotals.itemCount})</span>
        </button>
      </nav>
    </>
  );
}
