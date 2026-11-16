import React, { Suspense } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { StoreProvider, useStore } from './context/StoreContext';
import { SiteHeader } from './components/Header/SiteHeader';
import { SiteFooter } from './components/Footer/SiteFooter';
import { HomePage } from './components/Pages/HomePage';
import { ShopPage } from './components/Shop/ShopPage';
import { ProductDetailPage } from './components/Shop/ProductDetailPage';
import { CartDrawer } from './components/Shop/CartDrawer';
import { CheckoutPage } from './components/Shop/CheckoutPage';
import { RestaurantPage } from './components/Restaurant/RestaurantPage';
import { PlayLandPage } from './components/PlayLand/PlayLandPage';
import {
  AboutPage,
  AccountPage,
  ContactPage,
  LocationsPage,
  OffersPage,
  WishlistPage,
} from './components/Pages/SecondaryPages';

const ManagementPortal = React.lazy(() => import('./components/Management/ManagementPortal'));

function MarhabaShell() {
  const { route, managementPath, toast, dismissToast, isCartOpen } = useStore();

  if (managementPath !== null) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl px-6 py-5 text-sm font-medium text-[#1C1917]">
              Loading Marhaba Supermarket Management System...
            </div>
          </div>
        }
      >
        <ManagementPortal />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1C1917]">
      <SiteHeader />

      <main className="flex-1">
        {route === 'home' && <HomePage />}
        {route === 'shop' && <ShopPage />}
        {route === 'product' && <ProductDetailPage />}
        {route === 'checkout' && <CheckoutPage />}
        {route === 'restaurant' && <RestaurantPage />}
        {route === 'playland' && <PlayLandPage />}
        {route === 'offers' && <OffersPage />}
        {route === 'locations' && <LocationsPage />}
        {route === 'about' && <AboutPage />}
        {route === 'contact' && <ContactPage />}
        {route === 'wishlist' && <WishlistPage />}
        {route === 'account' && <AccountPage />}
      </main>

      <SiteFooter />
      <CartDrawer />

      {/* Subtle Non-blocking Action Toast (suppressed whenever CartDrawer is open) */}
      {toast && !isCartOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 z-40 max-w-sm bg-[#1C1917] text-white rounded-2xl shadow-xl border border-[#292524] px-4 py-3 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate">{toast.title}</p>
            {toast.detail && <p className="text-[11px] text-[#E6E2DA] truncate">{toast.detail}</p>}
          </div>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                dismissToast();
              }}
              className="text-xs font-bold text-[#FBBF24] hover:underline shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="text-[#D6D3CD] hover:text-white p-1.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MarhabaShell />
    </StoreProvider>
  );
}
