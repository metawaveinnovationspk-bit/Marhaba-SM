import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Heart,
  MapPin,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import {
  ASSETS,
  PLAYLAND_ATTRACTIONS,
  PRODUCTS,
  RESTAURANT_CUISINES,
  RESTAURANT_DISHES,
  SHOP_DEPARTMENTS,
  VERIFIED_BRANCHES,
  VERIFIED_CONTACT,
} from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type { AppRoute, PlayLandSection, RestaurantSection } from '../../types/marhaba';
import { formatPKR } from '../../utils/commerce';
import { StudioImage } from '../Media/VisualAsset';
import { MobileNav } from './MobileNav';

type ActiveDropdown = 'shop' | 'restaurant' | 'playland' | null;

export function MarhabaLogo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-8 h-8 sm:w-9 sm:h-9 shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="10"
          fill="#9B1C2E"
          stroke={isDark ? 'rgba(250, 249, 246, 0.16)' : 'none'}
          strokeWidth="1"
        />
        <path
          d="M9 28V12H13.2L20 21.8L26.8 12H31V28H27.2V18.4L20.8 27.2H19.2L12.8 18.4V28H9Z"
          fill="#FAF9F6"
        />
        <circle cx="20" cy="9" r="2" fill="#FBBF24" />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className={`font-serif text-base sm:text-xl font-bold tracking-tight whitespace-nowrap ${
            isDark ? 'text-[#FAF9F6]' : 'text-[#1C1917]'
          }`}
        >
          Marhaba
        </span>
        <span
          className={`text-[9px] sm:text-[10px] font-semibold tracking-[0.14em] sm:tracking-[0.16em] uppercase whitespace-nowrap ${
            isDark ? 'text-[#FBBF24]' : 'text-[#9B1C2E]'
          }`}
        >
          Supermarket
        </span>
      </div>
    </div>
  );
}

export function SiteHeader() {
  const {
    route,
    branchId,
    setBranchId,
    currentBranch,
    cartTotals,
    wishlist,
    openCart,
    navigate,
    navigateToManagement,
    shopFilter,
  } = useStore();

  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [hoveredDeptId, setHoveredDeptId] = useState<string>(SHOP_DEPARTMENTS[0].id);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState(shopFilter.searchQuery || '');
  const [searchFocused, setSearchFocused] = useState(false);

  const hoverTimerRef = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const activeDepartment = useMemo(
    () => SHOP_DEPARTMENTS.find((d) => d.id === hoveredDeptId) || SHOP_DEPARTMENTS[0],
    [hoveredDeptId]
  );

  // Sync header search input when shopFilter changes externally
  useEffect(() => {
    setSearchText(shopFilter.searchQuery || '');
  }, [shopFilter.searchQuery]);

  // Close menus on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
        setSearchFocused(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const cancelHoverClose = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const scheduleHoverClose = () => {
    cancelHoverClose();
    hoverTimerRef.current = window.setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const openDropdown = (menu: ActiveDropdown) => {
    cancelHoverClose();
    setActiveDropdown(menu);
  };

  const searchResults = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return { products: [], departments: [], dishes: [], attractions: [] };
    return {
      products: PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      ).slice(0, 5),
      departments: SHOP_DEPARTMENTS.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 3),
      dishes: RESTAURANT_DISHES.filter(
        (d) => d.name.toLowerCase().includes(q) || d.cuisine.toLowerCase().includes(q)
      ).slice(0, 3),
      attractions: PLAYLAND_ATTRACTIONS.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 2),
    };
  }, [searchText]);

  const hasSearchResults =
    searchResults.products.length > 0 ||
    searchResults.departments.length > 0 ||
    searchResults.dishes.length > 0 ||
    searchResults.attractions.length > 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchFocused(false);
    setMobileSearchOpen(false);
    navigate('shop', {
      resetShopFilter: true,
      shopFilter: { searchQuery: searchText.trim() },
    });
  };

  const goTo = (nextRoute: AppRoute) => {
    setActiveDropdown(null);
    navigate(nextRoute);
  };

  const goToRestaurant = (section: RestaurantSection) => {
    setActiveDropdown(null);
    navigate('restaurant', { restaurantSection: section });
  };

  const goToPlayLand = (section: PlayLandSection) => {
    setActiveDropdown(null);
    navigate('playland', { playLandSection: section });
  };

  const navLinkClass = (isActive: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-2 text-[13px] font-semibold tracking-wide whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 ${
      isActive
        ? 'border-[#9B1C2E] text-[#9B1C2E]'
        : 'border-transparent text-[#1C1917] hover:text-[#9B1C2E] hover:border-[#9B1C2E]/40'
    }`;

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6E2DA] shadow-[0_1px_3px_rgba(28,25,23,0.04)]"
        onMouseLeave={scheduleHoverClose}
      >
        {/* LEVEL A: Slim Utility Strip (Desktop & Tablet) */}
        <div className="hidden md:block bg-[#F3F1EC] border-b border-[#E6E2DA]/80 text-xs text-[#57534E]">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-9 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#9B1C2E] shrink-0" aria-hidden="true" />
                <label htmlFor="branch-select" className="sr-only">
                  Select Marhaba Branch
                </label>
                <select
                  id="branch-select"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="bg-transparent font-medium text-[#1C1917] text-xs pr-2 py-0.5 focus:outline-none cursor-pointer"
                >
                  {VERIFIED_BRANCHES.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[#D6D3CD]" aria-hidden="true">
                |
              </span>
              <span className="truncate">{currentBranch.hours}</span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <a
                href={`tel:${VERIFIED_CONTACT.supportPhone}`}
                className="inline-flex items-center gap-1.5 hover:text-[#1C1917] transition-colors whitespace-nowrap"
              >
                <Phone className="w-3 h-3 text-[#166534]" aria-hidden="true" />
                <span>Support: {VERIFIED_CONTACT.supportPhone}</span>
              </a>
              <span className="text-[#D6D3CD]" aria-hidden="true">
                |
              </span>
              <span className="text-[#166534] font-medium whitespace-nowrap">
                Supermarket · Restaurant · Play Land
              </span>
            </div>
          </div>
        </div>

        {/* LEVEL B: Main Header (Logo, Prominent Search, Account, Wishlist, Cart, Management) */}
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-8 h-16 lg:h-[72px] flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 rounded-lg text-[#1C1917] hover:bg-[#F3F1EC] min-w-[40px] min-h-[44px] inline-flex items-center justify-center shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo('home')}
              aria-label="Marhaba Supermarket Home"
              className="text-left focus-visible:outline-2 min-w-0"
            >
              <MarhabaLogo />
            </button>
          </div>

          {/* Desktop Search Bar */}
          <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <label htmlFor="desktop-global-search" className="sr-only">
                Search groceries, brands, cuisines, or Play Land attractions
              </label>
              <input
                id="desktop-global-search"
                type="search"
                value={searchText}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder="Search milk, rice, cooking oil, cuisines, or Play Land..."
                className="w-full h-10 pl-4 pr-11 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] text-sm text-[#1C1917] placeholder:text-[#57534E] focus:bg-[#FFFFFF] focus:border-[#9B1C2E] focus:outline-none transition-colors"
              />
              <button
                type="submit"
                aria-label="Search Marhaba"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md bg-[#9B1C2E] text-white inline-flex items-center justify-center hover:bg-[#7F1524] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Search Dropdown */}
            {searchFocused && searchText.trim().length > 0 && (
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-12 bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl shadow-lg overflow-hidden z-50 max-h-[420px] overflow-y-auto"
              >
                {!hasSearchResults ? (
                  <div className="p-4 text-sm text-[#57534E]">
                    No direct matches for &ldquo;{searchText}&rdquo;. Press Enter to search all products.
                  </div>
                ) : (
                  <div className="divide-y divide-[#E6E2DA]">
                    {searchResults.products.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                          Supermarket Products
                        </p>
                        {searchResults.products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate('product', { productId: p.id });
                            }}
                            className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-[#FAF9F6] transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1C1917] truncate">{p.name}</p>
                              <p className="text-xs text-[#57534E]">
                                {p.brand} · {p.unitLabel}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-[#9B1C2E] tabular-nums shrink-0">
                              {formatPKR(p.price)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.departments.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                          Departments
                        </p>
                        {searchResults.departments.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate('shop', {
                                resetShopFilter: true,
                                shopFilter: { departmentId: d.id },
                              });
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#1C1917] hover:bg-[#FAF9F6]"
                          >
                            <span>{d.name}</span>
                            <ChevronRight className="w-4 h-4 text-[#57534E]" />
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.dishes.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                          Restaurant Menu
                        </p>
                        {searchResults.dishes.map((dish) => (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate('restaurant', {
                                restaurantSection: 'menu',
                                restaurantCuisine: dish.cuisine,
                              });
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#1C1917] hover:bg-[#FAF9F6]"
                          >
                            <span>{dish.name}</span>
                            <span className="text-xs text-[#57534E]">{dish.cuisine}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.attractions.length > 0 && (
                      <div className="p-2">
                        <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                          Play Land
                        </p>
                        {searchResults.attractions.map((attr) => (
                          <button
                            key={attr.id}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              navigate('playland', { playLandSection: 'attractions' });
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-[#1C1917] hover:bg-[#FAF9F6]"
                          >
                            <span>{attr.name}</span>
                            <span className="text-xs text-[#57534E]">{attr.ageRangeLabel}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Actions: Mobile Search, Account, Wishlist, Cart, Management */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Toggle product search"
              aria-expanded={mobileSearchOpen}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-[#1C1917] hover:bg-[#F3F1EC] min-w-[36px] min-h-[40px] sm:min-w-[40px] sm:min-h-[44px] inline-flex items-center justify-center"
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => goTo('account')}
              aria-label="Account & Saved Inquiries"
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                route === 'account'
                  ? 'bg-[#F3F1EC] text-[#9B1C2E]'
                  : 'text-[#1C1917] hover:bg-[#F3F1EC]'
              }`}
            >
              <User className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
              <span className="hidden xl:inline">Account</span>
            </button>

            <button
              type="button"
              onClick={() => goTo('wishlist')}
              aria-label={`Wishlist (${wishlist.length} items)`}
              className={`relative hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-[40px] min-h-[44px] justify-center whitespace-nowrap ${
                route === 'wishlist'
                  ? 'bg-[#F3F1EC] text-[#9B1C2E]'
                  : 'text-[#1C1917] hover:bg-[#F3F1EC]'
              }`}
            >
              <Heart className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
              <span className="hidden xl:inline">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold bg-[#1C1917] text-white rounded tabular-nums">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={openCart}
              aria-label={`Open shopping cart with ${cartTotals.itemCount} items`}
              className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-lg bg-[#9B1C2E] text-white hover:bg-[#7F1524] transition-colors min-h-[40px] sm:min-h-[44px] whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold tabular-nums">
                <span className="hidden sm:inline">Cart</span>
                <span>({cartTotals.itemCount})</span>
                {cartTotals.subtotal > 0 && (
                  <span className="hidden md:inline font-normal text-white/90">
                    · {formatPKR(cartTotals.subtotal)}
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigateToManagement('/management')}
              aria-label="Open Marhaba Supermarket Management Portal"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-[#1C1917] hover:border-[#9B1C2E] hover:text-[#9B1C2E] hover:bg-[#FFFFFF] transition-colors min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0"
            >
              <Building2 className="w-4 h-4 text-[#9B1C2E] shrink-0" aria-hidden="true" />
              <span>Management</span>
            </button>
          </div>
        </div>

        {/* Mobile Expandable Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-[#E6E2DA] bg-[#FAF9F6]">
            <form onSubmit={handleSearchSubmit} className="pt-2.5 flex gap-2">
              <label htmlFor="mobile-global-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-global-search"
                type="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search groceries, dishes, attractions..."
                className="flex-1 h-10 px-3.5 rounded-lg bg-[#FFFFFF] border border-[#E6E2DA] text-sm text-[#1C1917]"
              />
              <button
                type="submit"
                className="px-4 h-10 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold whitespace-nowrap"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* LEVEL C: Desktop Main Navigation + Mega Menus */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:block border-t border-[#E6E2DA]/80 bg-[#FFFFFF] relative"
        >
          <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between">
            <ul className="flex items-center gap-2 xl:gap-5">
              <li>
                <button
                  type="button"
                  aria-current={route === 'home' ? 'page' : undefined}
                  onMouseEnter={() => setActiveDropdown(null)}
                  onClick={() => goTo('home')}
                  className={navLinkClass(route === 'home')}
                >
                  HOME
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'shop' || route === 'product' ? 'page' : undefined}
                  aria-expanded={activeDropdown === 'shop'}
                  aria-haspopup="true"
                  onMouseEnter={() => openDropdown('shop')}
                  onFocus={() => openDropdown('shop')}
                  onClick={() => {
                    if (activeDropdown === 'shop') {
                      goTo('shop');
                    } else {
                      openDropdown('shop');
                    }
                  }}
                  className={navLinkClass(route === 'shop' || route === 'product')}
                >
                  <span>SHOP</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      activeDropdown === 'shop' ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'restaurant' ? 'page' : undefined}
                  aria-expanded={activeDropdown === 'restaurant'}
                  aria-haspopup="true"
                  onMouseEnter={() => openDropdown('restaurant')}
                  onFocus={() => openDropdown('restaurant')}
                  onClick={() => {
                    if (activeDropdown === 'restaurant') {
                      goTo('restaurant');
                    } else {
                      openDropdown('restaurant');
                    }
                  }}
                  className={navLinkClass(route === 'restaurant')}
                >
                  <span>RESTAURANT</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      activeDropdown === 'restaurant' ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'playland' ? 'page' : undefined}
                  aria-expanded={activeDropdown === 'playland'}
                  aria-haspopup="true"
                  onMouseEnter={() => openDropdown('playland')}
                  onFocus={() => openDropdown('playland')}
                  onClick={() => {
                    if (activeDropdown === 'playland') {
                      goTo('playland');
                    } else {
                      openDropdown('playland');
                    }
                  }}
                  className={navLinkClass(route === 'playland')}
                >
                  <span>PLAY LAND</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      activeDropdown === 'playland' ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'offers' ? 'page' : undefined}
                  onMouseEnter={() => setActiveDropdown(null)}
                  onClick={() => goTo('offers')}
                  className={navLinkClass(route === 'offers')}
                >
                  OFFERS
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'locations' ? 'page' : undefined}
                  onMouseEnter={() => setActiveDropdown(null)}
                  onClick={() => goTo('locations')}
                  className={navLinkClass(route === 'locations')}
                >
                  LOCATIONS
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'about' ? 'page' : undefined}
                  onMouseEnter={() => setActiveDropdown(null)}
                  onClick={() => goTo('about')}
                  className={navLinkClass(route === 'about')}
                >
                  ABOUT
                </button>
              </li>

              <li>
                <button
                  type="button"
                  aria-current={route === 'contact' ? 'page' : undefined}
                  onMouseEnter={() => setActiveDropdown(null)}
                  onClick={() => goTo('contact')}
                  className={navLinkClass(route === 'contact')}
                >
                  CONTACT
                </button>
              </li>
            </ul>

            <div className="flex items-center gap-4 text-xs text-[#57534E]">
              <button
                type="button"
                onClick={() => goToRestaurant('reservations')}
                className="font-medium text-[#1C1917] hover:text-[#9B1C2E] transition-colors whitespace-nowrap"
              >
                Reserve a Table
              </button>
              <span className="text-[#D6D3CD]" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => goToPlayLand('plan-visit')}
                className="font-medium text-[#1C1917] hover:text-[#9B1C2E] transition-colors whitespace-nowrap"
              >
                Plan Play Land Visit
              </button>
            </div>
          </div>

          {/* SHOP 3-COLUMN MEGA MENU */}
          {activeDropdown === 'shop' && (
            <div
              onMouseEnter={cancelHoverClose}
              className="absolute left-0 right-0 top-full bg-[#FFFFFF] border-t border-b border-[#E6E2DA] shadow-xl z-50"
              role="region"
              aria-label="Shop Departments Mega Menu"
            >
              <div className="max-w-[1440px] mx-auto px-8 py-6 grid grid-cols-12 gap-6">
                {/* LEFT: Main Shopping Departments */}
                <div className="col-span-4 border-r border-[#E6E2DA] pr-4 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                      17 Departments
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        navigate('shop', { resetShopFilter: true });
                      }}
                      className="text-xs font-semibold text-[#9B1C2E] hover:underline"
                    >
                      All Products
                    </button>
                  </div>
                  <ul className="grid grid-cols-1 gap-0.5">
                    {SHOP_DEPARTMENTS.map((dept) => {
                      const isCurrent = dept.id === activeDepartment.id;
                      return (
                        <li key={dept.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setHoveredDeptId(dept.id)}
                            onFocus={() => setHoveredDeptId(dept.id)}
                            onClick={() => {
                              setActiveDropdown(null);
                              navigate('shop', {
                                resetShopFilter: true,
                                shopFilter: { departmentId: dept.id },
                              });
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-sm text-left transition-colors ${
                              isCurrent
                                ? 'bg-[#F3F1EC] text-[#9B1C2E] font-semibold'
                                : 'text-[#1C1917] hover:bg-[#FAF9F6]'
                            }`}
                          >
                            <span className="truncate">{dept.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* CENTER: Subcategories for Selected Department */}
                <div className="col-span-4 px-2 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E] mb-1">
                      Selected Department
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-[#1C1917]">
                      {activeDepartment.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#57534E] leading-relaxed">
                      {activeDepartment.shortDescription}
                    </p>

                    <div className="mt-4">
                      <p className="text-xs font-semibold text-[#1C1917] mb-2">Subcategories</p>
                      <ul className="space-y-1.5">
                        {activeDepartment.subcategories.map((sub) => (
                          <li key={sub}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveDropdown(null);
                                navigate('shop', {
                                  resetShopFilter: true,
                                  shopFilter: {
                                    departmentId: activeDepartment.id,
                                    subcategory: sub,
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-2 text-sm text-[#57534E] hover:text-[#9B1C2E] transition-colors"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-[#9B1C2E]" />
                              <span>{sub}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E6E2DA] flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        navigate('shop', {
                          resetShopFilter: true,
                          shopFilter: { departmentId: activeDepartment.id },
                        });
                      }}
                      className="px-4 py-2 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors"
                    >
                      Browse {activeDepartment.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        navigate('shop', {
                          resetShopFilter: true,
                          shopFilter: { offersOnly: true },
                        });
                      }}
                      className="text-sm font-medium text-[#166534] hover:underline"
                    >
                      View Offers
                    </button>
                  </div>
                </div>

                {/* RIGHT: Contextual Visual & Featured Collection */}
                <div className="col-span-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DA] overflow-hidden flex flex-col">
                  <div className="h-52 overflow-hidden">
                    <StudioImage
                      src={activeDepartment.featuredBannerImage}
                      alt={activeDepartment.featuredCollection}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#166534]">
                        Featured Collection
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-[#1C1917]">
                        {activeDepartment.featuredCollection}
                      </p>
                      <p className="mt-1 text-xs text-[#57534E]">
                        Available at {currentBranch.shortName} · Daily 10 AM – 10 PM
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        navigate('shop', {
                          resetShopFilter: true,
                          shopFilter: { departmentId: activeDepartment.id },
                        });
                      }}
                      className="self-start text-xs font-semibold text-[#9B1C2E] hover:underline"
                    >
                      Explore {activeDepartment.featuredCollection} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESTAURANT COMPACT CULINARY DROPDOWN */}
          {activeDropdown === 'restaurant' && (
            <div
              onMouseEnter={cancelHoverClose}
              className="absolute left-0 right-0 top-full bg-[#FFFFFF] border-t border-b border-[#E6E2DA] shadow-xl z-50"
              role="region"
              aria-label="Restaurant Navigation"
            >
              <div className="max-w-[1440px] mx-auto px-8 py-6 grid grid-cols-12 gap-8 items-stretch">
                <div className="col-span-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1C2E] mb-2">
                    Marhaba Restaurant
                  </p>
                  <ul className="grid grid-cols-1 gap-1">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['menu', 'Explore Menu'],
                        ['cuisines', 'Cuisines (4 Kitchens)'],
                        ['offers', 'Deals & Offers'],
                        ['dining', 'Dining Experience'],
                        ['gallery', 'Gallery'],
                        ['reservations', 'Reservations'],
                      ] as [RestaurantSection, string][]
                    ).map(([sec, label]) => (
                      <li key={sec}>
                        <button
                          type="button"
                          onClick={() => goToRestaurant(sec)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#FAF9F6] hover:text-[#9B1C2E] transition-colors"
                        >
                          <span>{label}</span>
                          <ChevronRight className="w-4 h-4 text-[#57534E]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-span-4 border-l border-[#E6E2DA] pl-6">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E] mb-2">
                    Explore Cuisines
                  </p>
                  <div className="space-y-3">
                    {RESTAURANT_CUISINES.slice(0, 4).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveDropdown(null);
                          navigate('restaurant', {
                            restaurantSection: 'menu',
                            restaurantCuisine: c.id,
                          });
                        }}
                        className="w-full text-left group"
                      >
                        <p className="text-sm font-semibold text-[#1C1917] group-hover:text-[#9B1C2E] transition-colors">
                          {c.title}
                        </p>
                        <p className="text-xs text-[#57534E] line-clamp-1">{c.subtitle}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DA] overflow-hidden flex flex-col">
                  <div className="h-36 overflow-hidden">
                    <StudioImage
                      src={ASSETS.restaurantHero}
                      alt="Marhaba Restaurant warm family dining table"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">Family & Rooftop Dining</p>
                      <p className="text-xs text-[#57534E]">Reservations: 0314-7817063</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToRestaurant('reservations')}
                      className="px-3.5 py-2 rounded-lg bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] whitespace-nowrap"
                    >
                      Request Table
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLAY LAND FAMILY DROPDOWN */}
          {activeDropdown === 'playland' && (
            <div
              onMouseEnter={cancelHoverClose}
              className="absolute left-0 right-0 top-full bg-[#FFFFFF] border-t border-b border-[#E6E2DA] shadow-xl z-50"
              role="region"
              aria-label="Play Land Navigation"
            >
              <div className="max-w-[1440px] mx-auto px-8 py-6 grid grid-cols-12 gap-8 items-stretch">
                <div className="col-span-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#166534] mb-2">
                    Marhaba Play Land
                  </p>
                  <ul className="grid grid-cols-1 gap-1">
                    {(
                      [
                        ['overview', 'Overview'],
                        ['attractions', 'Rides & Attractions'],
                        ['ages', 'Explore by Age'],
                        ['packages', 'Tickets & Packages'],
                        ['birthdays', 'Birthdays & Celebrations'],
                        ['parents-guide', 'Parent Guide'],
                        ['plan-visit', 'Plan Your Visit'],
                      ] as [PlayLandSection, string][]
                    ).map(([sec, label]) => (
                      <li key={sec}>
                        <button
                          type="button"
                          onClick={() => goToPlayLand(sec)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[#1C1917] hover:bg-[#FAF9F6] hover:text-[#166534] transition-colors"
                        >
                          <span>{label}</span>
                          <ChevronRight className="w-4 h-4 text-[#57534E]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="col-span-4 border-l border-[#E6E2DA] pl-6 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E] mb-2">
                      Designed for Families
                    </p>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                      Big Smiles. Wonderful Adventures.
                    </h3>
                    <p className="mt-1.5 text-sm text-[#57534E] leading-relaxed">
                      Indoor climate-controlled play zones for toddlers, adventurers, and juniors—with clear parent seating and direct access to Marhaba Restaurant.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToPlayLand('parents-guide')}
                    className="mt-4 self-start text-sm font-semibold text-[#166534] hover:underline"
                  >
                    Read the Parents&apos; Comfort Guide &rarr;
                  </button>
                </div>

                <div className="col-span-4 bg-[#FAF9F6] rounded-xl border border-[#E6E2DA] overflow-hidden flex flex-col">
                  <div className="h-36 overflow-hidden">
                    <StudioImage
                      src={ASSETS.playlandZone}
                      alt="Marhaba indoor family Play Land"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917]">Hyderabad Flagship Complex</p>
                      <p className="text-xs text-[#57534E]">Daily 10:00 AM – 10:00 PM</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToPlayLand('plan-visit')}
                      className="px-3.5 py-2 rounded-lg bg-[#166534] text-white text-xs font-semibold hover:bg-[#14532D] whitespace-nowrap"
                    >
                      Plan Visit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile Drawer + Mobile Bottom Quick Bar */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
