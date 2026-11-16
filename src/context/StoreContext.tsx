import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  PRODUCTS,
  SHOP_DEPARTMENTS,
  VERIFIED_BRANCHES,
} from '../data/marhabaData';
import type {
  AccountProfile,
  AppRoute,
  CartItem,
  CartTotals,
  CheckoutFormData,
  CuisineType,
  PlayLandInquiryData,
  PlayLandInquirySubmission,
  PlayLandSection,
  Product,
  ReservationFormData,
  ReservationSubmission,
  RestaurantSection,
  SavedAddress,
  ShopFilterState,
  SimulatedOrder,
  SortOption,
} from '../types/marhaba';
import {
  addOrUpdateCartItem,
  calculateCartTotals,
  updateCartItemQuantity,
} from '../utils/commerce';

const STORAGE_KEY = 'marhaba_experience_state_v1';

const DEFAULT_FILTER: ShopFilterState = {
  departmentId: null,
  subcategory: null,
  brands: [],
  minPrice: null,
  maxPrice: null,
  availability: 'all',
  offersOnly: false,
  attributes: {},
  searchQuery: '',
  sortBy: 'featured',
};

const DEFAULT_ACCOUNT_PROFILE: AccountProfile = {
  fullName: 'Marhaba Customer',
  email: '',
  phone: '',
  preferredBranchId: 'hyderabad',
  orderUpdates: true,
  weeklyOffers: false,
};

interface PersistedState {
  branchId: string;
  cart: CartItem[];
  wishlist: string[];
  orders: SimulatedOrder[];
  reservations: ReservationSubmission[];
  playInquiries: PlayLandInquirySubmission[];
  isSignedIn: boolean;
  accountProfile: AccountProfile;
  savedAddresses: SavedAddress[];
}

function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        branchId: parsed.branchId || 'hyderabad',
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
        playInquiries: Array.isArray(parsed.playInquiries) ? parsed.playInquiries : [],
        isSignedIn: typeof parsed.isSignedIn === 'boolean' ? parsed.isSignedIn : true,
        accountProfile: parsed.accountProfile
          ? { ...DEFAULT_ACCOUNT_PROFILE, ...parsed.accountProfile }
          : DEFAULT_ACCOUNT_PROFILE,
        savedAddresses: Array.isArray(parsed.savedAddresses) ? parsed.savedAddresses : [],
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    branchId: 'hyderabad',
    cart: [],
    wishlist: [],
    orders: [],
    reservations: [],
    playInquiries: [],
    isSignedIn: true,
    accountProfile: DEFAULT_ACCOUNT_PROFILE,
    savedAddresses: [],
  };
}

function parseRouteFromUrl(): {
  route: AppRoute;
  productId: string | null;
  restaurantSection: RestaurantSection;
  restaurantCuisine: CuisineType | 'All';
  playLandSection: PlayLandSection;
  shopFilter: ShopFilterState;
} {
  const params = new URLSearchParams(window.location.search);
  const view = (params.get('view') as AppRoute) || 'home';
  const validRoutes: AppRoute[] = [
    'home',
    'shop',
    'product',
    'restaurant',
    'playland',
    'offers',
    'locations',
    'about',
    'contact',
    'wishlist',
    'account',
    'checkout',
  ];
  const route = validRoutes.includes(view) ? view : 'home';

  const departmentId = params.get('dept');
  const subcategory = params.get('sub');
  const brands = params.get('brands') ? params.get('brands')!.split(',').filter(Boolean) : [];
  const minPrice = params.get('min') ? Number(params.get('min')) : null;
  const maxPrice = params.get('max') ? Number(params.get('max')) : null;
  const availability = (params.get('avail') as ShopFilterState['availability']) || 'all';
  const offersOnly = params.get('offers') === '1';
  const searchQuery = params.get('q') || '';
  const sortBy = (params.get('sort') as SortOption) || 'featured';

  return {
    route,
    productId: params.get('id'),
    restaurantSection: (params.get('rsec') as RestaurantSection) || 'overview',
    restaurantCuisine: (params.get('cuisine') as CuisineType | 'All') || 'All',
    playLandSection: (params.get('psec') as PlayLandSection) || 'overview',
    shopFilter: {
      departmentId: departmentId && SHOP_DEPARTMENTS.some((d) => d.id === departmentId) ? departmentId : null,
      subcategory,
      brands,
      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      availability: ['all', 'in-stock', 'out-of-stock'].includes(availability) ? availability : 'all',
      offersOnly,
      attributes: {},
      searchQuery,
      sortBy: ['featured', 'price-asc', 'price-desc', 'discount', 'name-asc'].includes(sortBy)
        ? sortBy
        : 'featured',
    },
  };
}

interface ToastMessage {
  id: number;
  title: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface StoreContextValue {
  route: AppRoute;
  managementPath: string | null;
  selectedProductId: string | null;
  restaurantSection: RestaurantSection;
  restaurantCuisine: CuisineType | 'All';
  playLandSection: PlayLandSection;
  shopFilter: ShopFilterState;
  branchId: string;
  currentBranch: (typeof VERIFIED_BRANCHES)[number];
  cart: CartItem[];
  cartTotals: CartTotals;
  isCartOpen: boolean;
  wishlist: string[];
  orders: SimulatedOrder[];
  reservations: ReservationSubmission[];
  playInquiries: PlayLandInquirySubmission[];
  isSignedIn: boolean;
  accountProfile: AccountProfile;
  savedAddresses: SavedAddress[];
  toast: ToastMessage | null;
  navigate: (
    nextRoute: AppRoute,
    options?: {
      productId?: string | null;
      restaurantSection?: RestaurantSection;
      restaurantCuisine?: CuisineType | 'All';
      playLandSection?: PlayLandSection;
      shopFilter?: Partial<ShopFilterState>;
      resetShopFilter?: boolean;
      scrollTop?: boolean;
    }
  ) => void;
  navigateToManagement: (subPath?: string) => void;
  exitManagement: () => void;
  setBranchId: (id: string) => void;
  setShopFilter: React.Dispatch<React.SetStateAction<ShopFilterState>>;
  resetShopFilters: () => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variantId?: string, quantity?: number) => { ok: boolean; error?: string };
  setCartQty: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  submitDemoOrder: (form: CheckoutFormData) => SimulatedOrder;
  submitReservation: (form: ReservationFormData) => ReservationSubmission;
  submitPlayLandInquiry: (form: PlayLandInquiryData) => PlayLandInquirySubmission;
  updateAccountProfile: (profile: AccountProfile) => void;
  signOutAccount: () => void;
  signInAccount: (details: { fullName: string; email: string; phone?: string }) => void;
  saveAddress: (address: Omit<SavedAddress, 'id' | 'isDefault'>, existingId?: string) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const initialUrl = useMemo(() => parseRouteFromUrl(), []);
  const initialPersisted = useMemo(() => loadPersistedState(), []);

  const [managementPath, setManagementPath] = useState<string | null>(() =>
    window.location.pathname.startsWith('/management') ? window.location.pathname : null
  );
  const [route, setRoute] = useState<AppRoute>(initialUrl.route);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialUrl.productId);
  const [restaurantSection, setRestaurantSection] = useState<RestaurantSection>(
    initialUrl.restaurantSection
  );
  const [restaurantCuisine, setRestaurantCuisine] = useState<CuisineType | 'All'>(
    initialUrl.restaurantCuisine
  );
  const [playLandSection, setPlayLandSection] = useState<PlayLandSection>(initialUrl.playLandSection);
  const [shopFilter, setShopFilter] = useState<ShopFilterState>(initialUrl.shopFilter);

  const [branchId, setBranchIdState] = useState<string>(initialPersisted.branchId);
  const [cart, setCart] = useState<CartItem[]>(initialPersisted.cart);
  const [wishlist, setWishlist] = useState<string[]>(initialPersisted.wishlist);
  const [orders, setOrders] = useState<SimulatedOrder[]>(initialPersisted.orders);
  const [reservations, setReservations] = useState<ReservationSubmission[]>(initialPersisted.reservations);
  const [playInquiries, setPlayInquiries] = useState<PlayLandInquirySubmission[]>(
    initialPersisted.playInquiries
  );
  const [isSignedIn, setIsSignedIn] = useState<boolean>(initialPersisted.isSignedIn);
  const [accountProfile, setAccountProfile] = useState<AccountProfile>(initialPersisted.accountProfile);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(initialPersisted.savedAddresses);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        branchId,
        cart,
        wishlist,
        orders,
        reservations,
        playInquiries,
        isSignedIn,
        accountProfile,
        savedAddresses,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [branchId, cart, wishlist, orders, reservations, playInquiries, isSignedIn, accountProfile, savedAddresses]);

  // Sync URL query params for storefront views only (never overwrite /management/* pathnames)
  useEffect(() => {
    if (managementPath !== null) return;
    const params = new URLSearchParams();
    if (route !== 'home') params.set('view', route);
    if (route === 'product' && selectedProductId) params.set('id', selectedProductId);
    if (route === 'restaurant') {
      if (restaurantSection !== 'overview') params.set('rsec', restaurantSection);
      if (restaurantCuisine !== 'All') params.set('cuisine', restaurantCuisine);
    }
    if (route === 'playland' && playLandSection !== 'overview') {
      params.set('psec', playLandSection);
    }
    if (route === 'shop') {
      if (shopFilter.departmentId) params.set('dept', shopFilter.departmentId);
      if (shopFilter.subcategory) params.set('sub', shopFilter.subcategory);
      if (shopFilter.brands.length > 0) params.set('brands', shopFilter.brands.join(','));
      if (shopFilter.minPrice !== null) params.set('min', String(shopFilter.minPrice));
      if (shopFilter.maxPrice !== null) params.set('max', String(shopFilter.maxPrice));
      if (shopFilter.availability !== 'all') params.set('avail', shopFilter.availability);
      if (shopFilter.offersOnly) params.set('offers', '1');
      if (shopFilter.searchQuery) params.set('q', shopFilter.searchQuery);
      if (shopFilter.sortBy !== 'featured') params.set('sort', shopFilter.sortBy);
    }
    const qs = params.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', nextUrl);
  }, [managementPath, route, selectedProductId, restaurantSection, restaurantCuisine, playLandSection, shopFilter]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/management')) {
        setManagementPath(path);
      } else {
        setManagementPath(null);
        const parsed = parseRouteFromUrl();
        setRoute(parsed.route);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((next: Omit<ToastMessage, 'id'>) => {
    setToast({ ...next, id: Date.now() });
  }, []);

  const navigateToManagement = useCallback((subPath = '/management') => {
    const clean = subPath.startsWith('/management') ? subPath : `/management/${subPath.replace(/^\//, '')}`;
    setIsCartOpen(false);
    setManagementPath(clean);
    if (window.location.pathname !== clean) {
      window.history.pushState(null, '', clean);
    }
    window.scrollTo({ top: 0 });
  }, []);

  const exitManagement = useCallback(() => {
    setManagementPath(null);
    if (window.location.pathname.startsWith('/management')) {
      window.history.pushState(null, '', '/');
    }
    setRoute('home');
    window.scrollTo({ top: 0 });
  }, []);

  const navigate = useCallback<StoreContextValue['navigate']>((nextRoute, options = {}) => {
    if (window.location.pathname.startsWith('/management')) {
      window.history.pushState(null, '', '/');
    }
    setManagementPath(null);
    setRoute(nextRoute);
    if (options.productId !== undefined) {
      setSelectedProductId(options.productId);
    } else if (nextRoute !== 'product') {
      setSelectedProductId(null);
    }

    if (options.restaurantSection) {
      setRestaurantSection(options.restaurantSection);
    } else if (nextRoute === 'restaurant' && !options.restaurantSection) {
      setRestaurantSection('overview');
    }

    if (options.restaurantCuisine !== undefined) {
      setRestaurantCuisine(options.restaurantCuisine);
    }

    if (options.playLandSection) {
      setPlayLandSection(options.playLandSection);
    } else if (nextRoute === 'playland' && !options.playLandSection) {
      setPlayLandSection('overview');
    }

    if (options.resetShopFilter) {
      setShopFilter({ ...DEFAULT_FILTER, ...(options.shopFilter || {}) });
    } else if (options.shopFilter) {
      setShopFilter((prev) => ({ ...prev, ...options.shopFilter }));
    }

    if (options.scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const currentBranch = useMemo(
    () => VERIFIED_BRANCHES.find((b) => b.id === branchId) || VERIFIED_BRANCHES[0],
    [branchId]
  );

  const cartTotals = useMemo(() => calculateCartTotals(cart, 'delivery'), [cart]);

  const addToCart = useCallback<StoreContextValue['addToCart']>(
    (product, variantId, quantity = 1) => {
      const targetVariantId = variantId || product.variants[0]?.id || '';
      const result = addOrUpdateCartItem(cart, product, targetVariantId, quantity);
      if (result.error) {
        showToast({ title: 'Unable to add item', detail: result.error });
        return { ok: false, error: result.error };
      }
      setCart(result.items);
      const variantLabel =
        product.variants.find((v) => v.id === targetVariantId)?.label || product.unitLabel;
      showToast({
        title: `Added ${product.name}`,
        detail: `${variantLabel} · Qty ${quantity}`,
        actionLabel: 'View Cart',
        onAction: () => {
          setToast(null);
          setIsCartOpen(true);
        },
      });
      return { ok: true };
    },
    [cart, showToast]
  );

  const setCartQty = useCallback((productId: string, variantId: string, quantity: number) => {
    setCart((prev) => updateCartItemQuantity(prev, productId, variantId, quantity));
  }, []);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantId === variantId))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const product = PRODUCTS.find((p) => p.id === productId);
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        if (product) {
          showToast({
            title: exists ? 'Removed from Wishlist' : 'Saved to Wishlist',
            detail: product.name,
          });
        }
        return next;
      });
    },
    [showToast]
  );

  const resetShopFilters = useCallback(() => {
    setShopFilter(DEFAULT_FILTER);
  }, []);

  const submitDemoOrder = useCallback<StoreContextValue['submitDemoOrder']>(
    (form) => {
      const totals = calculateCartTotals(cart, form.fulfillmentMethod);
      const order: SimulatedOrder = {
        orderNumber: `MRH-DEMO-${Math.floor(100000 + Math.random() * 900000)}`,
        createdAt: new Date().toISOString(),
        items: [...cart],
        totals,
        customer: form,
        status: 'Simulated Demonstration Order — Synced to Management Orders Queue',
      };
      setOrders((prev) => [order, ...prev]);
      setCart([]);

      // Sync storefront order directly into Management Online Fulfillment Queue
      void fetch('/api/public/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: order.orderNumber,
          orderNumber: order.orderNumber,
          branchId: form.branchId,
          customerName: form.fullName,
          customerPhone: form.phone,
          fulfillmentMethod: form.fulfillmentMethod,
          addressSummary:
            form.fulfillmentMethod === 'delivery'
              ? `${form.address}, ${form.city}`
              : 'Store Pickup Counter',
          paymentMethod: form.paymentMethod,
          items: order.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            name: it.name,
          })),
        }),
      }).catch(() => {
        // Non-blocking fallback for offline/preview
      });

      return order;
    },
    [cart]
  );

  const submitReservation = useCallback<StoreContextValue['submitReservation']>((form) => {
    const submission: ReservationSubmission = {
      referenceId: `RES-${Math.floor(10000 + Math.random() * 90000)}`,
      submittedAt: new Date().toISOString(),
      data: form,
      status: 'Pending Staff Confirmation',
    };
    setReservations((prev) => [submission, ...prev]);
    return submission;
  }, []);

  const submitPlayLandInquiry = useCallback<StoreContextValue['submitPlayLandInquiry']>(
    (form) => {
      const submission: PlayLandInquirySubmission = {
        referenceId: `PLAY-${Math.floor(10000 + Math.random() * 90000)}`,
        submittedAt: new Date().toISOString(),
        data: form,
        status: 'Inquiry Received — Awaiting Play Land Desk Confirmation',
      };
      setPlayInquiries((prev) => [submission, ...prev]);
      return submission;
    },
    []
  );

  const updateAccountProfile = useCallback(
    (profile: AccountProfile) => {
      setAccountProfile(profile);
      setBranchIdState(profile.preferredBranchId);
      showToast({
        title: 'Profile updated',
        detail: 'Preferences saved for this browser session',
      });
    },
    [showToast]
  );

  const signOutAccount = useCallback(() => {
    setIsSignedIn(false);
    showToast({
      title: 'Signed out',
      detail: 'You have signed out of your Marhaba account view',
    });
  }, [showToast]);

  const signInAccount = useCallback(
    (details: { fullName: string; email: string; phone?: string }) => {
      setAccountProfile((prev) => ({
        ...prev,
        fullName: details.fullName.trim() || prev.fullName,
        email: details.email.trim(),
        phone: details.phone?.trim() || prev.phone,
      }));
      setIsSignedIn(true);
      showToast({
        title: `Welcome back, ${details.fullName.trim() || 'Member'}`,
        detail: 'Demo account session active',
      });
    },
    [showToast]
  );

  const saveAddress = useCallback(
    (data: Omit<SavedAddress, 'id' | 'isDefault'>, existingId?: string) => {
      setSavedAddresses((prev) => {
        if (existingId) {
          return prev.map((addr) =>
            addr.id === existingId ? { ...addr, ...data } : addr
          );
        }
        const next: SavedAddress = {
          ...data,
          id: `addr-${Date.now()}`,
          isDefault: prev.length === 0,
        };
        return [next, ...prev];
      });
      showToast({
        title: existingId ? 'Address updated' : 'Address saved',
        detail: `${data.label} · ${data.city}`,
      });
    },
    [showToast]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      setSavedAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== id);
        if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
          filtered[0] = { ...filtered[0], isDefault: true };
        }
        return filtered;
      });
      showToast({ title: 'Address removed' });
    },
    [showToast]
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      setSavedAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      showToast({ title: 'Default delivery address updated' });
    },
    [showToast]
  );

  const value: StoreContextValue = {
    route,
    managementPath,
    selectedProductId,
    restaurantSection,
    restaurantCuisine,
    playLandSection,
    shopFilter,
    branchId,
    currentBranch,
    cart,
    cartTotals,
    isCartOpen,
    wishlist,
    orders,
    reservations,
    playInquiries,
    isSignedIn,
    accountProfile,
    savedAddresses,
    toast,
    navigate,
    navigateToManagement,
    exitManagement,
    setBranchId: setBranchIdState,
    setShopFilter,
    resetShopFilters,
    openCart: () => {
      setToast(null);
      setIsCartOpen(true);
    },
    closeCart: () => setIsCartOpen(false),
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    toggleWishlist,
    submitDemoOrder,
    submitReservation,
    submitPlayLandInquiry,
    updateAccountProfile,
    signOutAccount,
    signInAccount,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    dismissToast: () => setToast(null),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
