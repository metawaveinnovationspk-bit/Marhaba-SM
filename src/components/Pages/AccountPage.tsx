import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShoppingBag,
  Trash2,
  User,
} from 'lucide-react';
import { PRODUCTS, VERIFIED_BRANCHES, VERIFIED_CONTACT } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type { AccountSection, SavedAddress } from '../../types/marhaba';
import {
  formatPKR,
  validateAddressForm,
  validatePasswordChange,
  validateProfileForm,
} from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';

const NAV_ITEMS: { id: AccountSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'profile', label: 'Profile & Settings', icon: User },
  { id: 'bookings', label: 'My Bookings', icon: Calendar },
  { id: 'support', label: 'Help & Support', icon: HelpCircle },
];

export function AccountPage() {
  const {
    orders,
    wishlist,
    reservations,
    playInquiries,
    currentBranch,
    isSignedIn,
    accountProfile,
    savedAddresses,
    navigate,
    addToCart,
    toggleWishlist,
    updateAccountProfile,
    signOutAccount,
    signInAccount,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
  } = useStore();

  const [activeSection, setActiveSection] = useState<AccountSection>('overview');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Sign-In state when logged out
  const [loginName, setLoginName] = useState(
    accountProfile.fullName !== 'Marhaba Customer' ? accountProfile.fullName : ''
  );
  const [loginEmail, setLoginEmail] = useState(accountProfile.email);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Address form state
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrRecipient, setAddrRecipient] = useState(accountProfile.fullName);
  const [addrPhone, setAddrPhone] = useState(accountProfile.phone);
  const [addrCity, setAddrCity] = useState('Hyderabad');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrNotes, setAddrNotes] = useState('');
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  // Profile form state
  const [profileDraft, setProfileDraft] = useState(accountProfile);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSavedNote, setProfileSavedNote] = useState<string | null>(null);

  // Password form state (local demo)
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  const wishlistProducts = useMemo(
    () => PRODUCTS.filter((p) => wishlist.includes(p.id)),
    [wishlist]
  );

  const totalBookings = reservations.length + playInquiries.length;
  const latestOrder = orders[0] || null;

  const openAddressForm = (existing?: SavedAddress) => {
    if (existing) {
      setEditingAddressId(existing.id);
      setAddrLabel(existing.label);
      setAddrRecipient(existing.recipientName);
      setAddrPhone(existing.phone);
      setAddrCity(existing.city);
      setAddrStreet(existing.streetAddress);
      setAddrNotes(existing.notes || '');
    } else {
      setEditingAddressId(null);
      setAddrLabel('Home');
      setAddrRecipient(
        accountProfile.fullName !== 'Marhaba Customer' ? accountProfile.fullName : ''
      );
      setAddrPhone(accountProfile.phone || '');
      setAddrCity(currentBranch.city || 'Hyderabad');
      setAddrStreet('');
      setAddrNotes('');
    }
    setAddrErrors({});
    setAddressFormOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      label: addrLabel,
      recipientName: addrRecipient,
      phone: addrPhone,
      streetAddress: addrStreet,
      city: addrCity,
      notes: addrNotes,
    };
    const errs = validateAddressForm(payload);
    if (Object.keys(errs).length > 0) {
      setAddrErrors(errs);
      return;
    }
    setAddrErrors({});
    saveAddress(payload, editingAddressId || undefined);
    setAddressFormOpen(false);
    setEditingAddressId(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateProfileForm(profileDraft);
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      setProfileSavedNote(null);
      return;
    }
    setProfileErrors({});
    updateAccountProfile(profileDraft);
    setProfileSavedNote('Your profile details and preferences have been updated.');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePasswordChange(currentPw, newPw, confirmPw);
    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      setPwSuccess(null);
      return;
    }
    setPwErrors({});
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwSuccess(
      'Password requirement validated in this demonstration interface. Live account password updates require server authentication.'
    );
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim() || loginName.trim().length < 2) {
      setLoginError('Please enter your full name.');
      return;
    }
    if (!loginEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.trim())) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (loginPassword.length < 6) {
      setLoginError('Please enter a password (at least 6 characters).');
      return;
    }
    setLoginError(null);
    signInAccount({ fullName: loginName, email: loginEmail });
    setProfileDraft((prev) => ({
      ...prev,
      fullName: loginName.trim(),
      email: loginEmail.trim(),
    }));
    setLoginPassword('');
    setActiveSection('overview');
  };

  const handleLogout = () => {
    setLoginName(
      accountProfile.fullName.trim() && accountProfile.fullName !== 'Marhaba Customer'
        ? accountProfile.fullName.trim()
        : ''
    );
    setLoginEmail(accountProfile.email.trim());
    setLoginPassword('');
    setLoginError(null);
    signOutAccount();
  };

  // SIGNED-OUT STATE
  if (!isSignedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14">
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Marhaba Customer Account
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">Sign In</h1>
            <p className="mt-2 text-sm text-[#57534E] leading-relaxed">
              Access your saved orders, wishlist, and delivery addresses. This preview uses a local
              demonstration session stored in your browser.
            </p>
          </div>

          <form onSubmit={handleSignInSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="acc-login-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Full Name *
              </label>
              <input
                id="acc-login-name"
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
              />
            </div>

            <div>
              <label htmlFor="acc-login-email" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Email Address *
              </label>
              <input
                id="acc-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
              />
            </div>

            <div>
              <label htmlFor="acc-login-pw" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Password *
              </label>
              <input
                id="acc-login-pw"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-xs font-medium text-[#9B1C2E]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors"
            >
              Sign In to Account
            </button>
          </form>

          <div className="pt-4 border-t border-[#E6E2DA] flex items-center justify-between text-xs text-[#57534E]">
            <span>Prefer browsing first?</span>
            <button
              type="button"
              onClick={() => navigate('shop', { resetShopFilter: true })}
              className="font-semibold text-[#9B1C2E] hover:underline"
            >
              Continue Shopping &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = accountProfile.fullName.trim() || 'Marhaba Customer';

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Page Intro Bar */}
      <div className="pb-6 border-b border-[#E6E2DA] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
            Customer Account
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
            My Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#57534E]">
            <span className="font-semibold text-[#1C1917]">{displayName}</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            Active Branch: <span className="font-semibold text-[#1C1917]">{currentBranch.shortName}</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Local Demo Session</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('shop', { resetShopFilter: true })}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] transition-colors whitespace-nowrap"
        >
          Back to Supermarket
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ACCOUNT NAVIGATION (Desktop Sidebar + Compact Mobile Bar) */}
        <aside
          className={activeSection !== 'overview' ? 'hidden lg:block lg:col-span-3' : 'lg:col-span-3'}
          aria-label="Account Sections"
        >
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-2 lg:p-3">
            {/* Mobile Compact Navigation Grid / Scroll-Free Pill-Free Buttons */}
            <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                const count =
                  item.id === 'orders'
                    ? orders.length
                    : item.id === 'wishlist'
                    ? wishlistProducts.length
                    : item.id === 'addresses'
                    ? savedAddresses.length
                    : item.id === 'bookings'
                    ? totalBookings
                    : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setActiveSection(item.id)}
                    className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#9B1C2E] text-white'
                        : 'text-[#1C1917] hover:bg-[#FAF9F6] hover:text-[#9B1C2E]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {count !== null && count > 0 && (
                      <span
                        className={`text-[11px] tabular-nums ${
                          active ? 'text-white/90' : 'text-[#57534E]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="col-span-2 sm:col-span-4 lg:col-span-1 pt-1.5 mt-1 border-t border-[#E6E2DA]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-semibold text-[#57534E] hover:bg-[#FAF9F6] hover:text-[#9B1C2E] flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* MAIN ACCOUNT PANEL */}
        <div className="lg:col-span-9 space-y-6">
          {/* Mobile Clear Back-to-Overview Button when inside sub-sections */}
          {activeSection !== 'overview' && (
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] inline-flex items-center gap-2 text-xs font-semibold text-[#9B1C2E] hover:border-[#9B1C2E]"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back to Overview</span>
              </button>
            </div>
          )}

          {/* 1. OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Friendly Greeting & Two Primary Actions */}
              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-lg">
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Hello, {displayName}
                  </h2>
                  <p className="text-sm text-[#57534E] leading-relaxed">
                    Check your recent supermarket orders, saved wishlist items, and delivery
                    addresses in one calm workspace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('shop', { resetShopFilter: true })}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors whitespace-nowrap"
                  >
                    Continue Shopping
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('orders')}
                    className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#9B1C2E] transition-colors whitespace-nowrap"
                  >
                    View Orders
                  </button>
                </div>
              </section>

              {/* Compact Recent Order Summary */}
              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E6E2DA]">
                  <h2 className="font-serif text-xl font-bold text-[#1C1917]">
                    Recent Order Summary
                  </h2>
                  {orders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveSection('orders')}
                      className="text-xs font-semibold text-[#9B1C2E] hover:underline"
                    >
                      All Orders ({orders.length})
                    </button>
                  )}
                </div>

                {!latestOrder ? (
                  <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#1C1917]">No orders placed yet</p>
                      <p className="text-xs text-[#57534E]">
                        When you complete a simulated checkout, your order summary and tracking
                        progress will appear here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('shop', { resetShopFilter: true })}
                      className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-[#E6E2DA] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] whitespace-nowrap"
                    >
                      Browse Groceries
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-[#1C1917]">
                          {latestOrder.orderNumber}{' '}
                          <span className="font-normal text-xs text-[#57534E] tabular-nums">
                            · {latestOrder.totals.itemCount} item
                            {latestOrder.totals.itemCount !== 1 ? 's' : ''}
                          </span>
                        </p>
                        <p className="text-xs text-[#B45309] font-medium">{latestOrder.status}</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-base font-bold text-[#1C1917] tabular-nums">
                          {formatPKR(latestOrder.totals.finalTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedOrderId(latestOrder.orderNumber);
                            setActiveSection('orders');
                          }}
                          className="text-xs font-semibold text-[#9B1C2E] hover:underline whitespace-nowrap"
                        >
                          Order Details
                        </button>
                      </div>
                    </div>

                    {orders.length > 1 && (
                      <div className="divide-y divide-[#E6E2DA]">
                        {orders.slice(1, 3).map((ord) => (
                          <div
                            key={ord.orderNumber}
                            className="py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-[#1C1917]">{ord.orderNumber}</span>
                              <span className="text-[#57534E] ml-2 tabular-nums">
                                {ord.totals.itemCount} item{ord.totals.itemCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <span className="font-semibold text-[#1C1917] tabular-nums">
                              {formatPKR(ord.totals.finalTotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Gentle Quick Links Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveSection('wishlist')}
                  className="text-left p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E2DA] hover:border-[#9B1C2E] transition-colors"
                >
                  <p className="text-xs font-semibold text-[#57534E]">Saved Wishlist</p>
                  <p className="mt-1 font-serif text-lg font-bold text-[#1C1917] tabular-nums">
                    {wishlistProducts.length} Item{wishlistProducts.length !== 1 ? 's' : ''}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('addresses')}
                  className="text-left p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E2DA] hover:border-[#9B1C2E] transition-colors"
                >
                  <p className="text-xs font-semibold text-[#57534E]">Saved Addresses</p>
                  <p className="mt-1 font-serif text-lg font-bold text-[#1C1917] tabular-nums">
                    {savedAddresses.length} Saved
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('profile')}
                  className="text-left p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E2DA] hover:border-[#9B1C2E] transition-colors"
                >
                  <p className="text-xs font-semibold text-[#57534E]">Profile &amp; Branch</p>
                  <p className="mt-1 font-serif text-lg font-bold text-[#1C1917] truncate">
                    {currentBranch.city}
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* 2. MY ORDERS */}
          {activeSection === 'orders' && (
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="pb-4 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">My Orders</h2>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Simulated checkout records saved in this browser session.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#57534E] tabular-nums">
                  {orders.length} order{orders.length !== 1 ? 's' : ''}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <Package className="w-10 h-10 text-[#D6D3CD] mx-auto" aria-hidden="true" />
                  <p className="font-semibold text-[#1C1917]">You have no orders yet</p>
                  <p className="text-sm text-[#57534E] max-w-sm mx-auto">
                    Explore our supermarket catalog and try adding essentials to your cart.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('shop', { resetShopFilter: true })}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const expanded = expandedOrderId === ord.orderNumber;
                    const createdLabel = new Date(ord.createdAt).toLocaleDateString('en-PK', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });

                    return (
                      <article
                        key={ord.orderNumber}
                        className="border border-[#E6E2DA] rounded-2xl p-4 sm:p-5 space-y-4 bg-[#FAF9F6]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                              <span className="font-bold text-sm text-[#1C1917]">
                                {ord.orderNumber}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{createdLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {ord.totals.itemCount} item{ord.totals.itemCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#B45309]">{ord.status}</p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-base font-bold text-[#9B1C2E] tabular-nums">
                              {formatPKR(ord.totals.finalTotal)}
                            </span>
                            <button
                              type="button"
                              aria-expanded={expanded}
                              onClick={() =>
                                setExpandedOrderId(expanded ? null : ord.orderNumber)
                              }
                              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] inline-flex items-center gap-1.5"
                            >
                              <span>{expanded ? 'Hide Details' : 'Order Details'}</span>
                              {expanded ? (
                                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="pt-4 border-t border-[#E6E2DA] space-y-4">
                            {/* Simple 3-Step Demo Tracking Strip */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#166534]/40">
                                <p className="font-semibold text-[#166534] inline-flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>1. Demo Request Logged</span>
                                </p>
                              </div>
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E6E2DA] text-[#57534E]">
                                <p className="font-medium">2. Store Packing (Demo)</p>
                              </div>
                              <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E6E2DA] text-[#57534E]">
                                <p className="font-medium">
                                  3.{' '}
                                  {ord.customer.fulfillmentMethod === 'pickup'
                                    ? 'In-Store Pickup'
                                    : 'Local Delivery'}{' '}
                                  (Demo)
                                </p>
                              </div>
                            </div>

                            {/* Order Line Items */}
                            <div className="divide-y divide-[#E6E2DA] bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl px-4">
                              {ord.items.map((item) => (
                                <div
                                  key={`${item.productId}-${item.variantId}`}
                                  className="py-3 flex items-center gap-3 text-xs sm:text-sm"
                                >
                                  <div className="w-12 h-12 rounded-lg border border-[#E6E2DA] bg-[#F3F1EC] overflow-hidden shrink-0">
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
                                    <p className="font-semibold text-[#1C1917] truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-xs text-[#57534E]">
                                      {item.variantLabel} · Qty {item.quantity}
                                    </p>
                                  </div>
                                  <span className="font-semibold text-[#1C1917] tabular-nums shrink-0">
                                    {formatPKR(item.unitPrice * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="text-xs text-[#57534E] flex flex-wrap justify-between gap-2">
                              <span>
                                Recipient: <strong className="text-[#1C1917]">{ord.customer.fullName}</strong>{' '}
                                ({ord.customer.phone})
                              </span>
                              <span>
                                {ord.customer.fulfillmentMethod === 'pickup'
                                  ? 'Counter Pickup'
                                  : `${ord.customer.address}, ${ord.customer.city}`}
                              </span>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* 3. WISHLIST */}
          {activeSection === 'wishlist' && (
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="pb-4 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Saved Wishlist</h2>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Move saved supermarket essentials directly into your cart.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#57534E] tabular-nums">
                  {wishlistProducts.length} saved
                </span>
              </div>

              {wishlistProducts.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <Heart className="w-10 h-10 text-[#D6D3CD] mx-auto" aria-hidden="true" />
                  <p className="font-semibold text-[#1C1917]">Your wishlist is empty</p>
                  <p className="text-sm text-[#57534E] max-w-sm mx-auto">
                    Tap the heart button on any product to keep groceries and family essentials
                    handy.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('shop', { resetShopFilter: true })}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Browse Supermarket
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col justify-between bg-[#FAF9F6]"
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => navigate('product', { productId: p.id })}
                          aria-label={`View ${p.name}`}
                          className="w-full aspect-[4/3] bg-[#F3F1EC] overflow-hidden block"
                        >
                          <ProductPackshot
                            image={p.image}
                            name={p.name}
                            brand={p.brand}
                            unitLabel={p.unitLabel}
                            style={p.packshotStyle}
                            accent={p.packshotAccent}
                          />
                        </button>
                        <div className="p-4 pb-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                            {p.brand}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate('product', { productId: p.id })}
                            className="mt-1 text-left text-sm font-bold text-[#1C1917] hover:text-[#9B1C2E] line-clamp-2"
                          >
                            {p.name}
                          </button>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-sm font-bold text-[#1C1917] tabular-nums">
                              {formatPKR(p.price)}
                            </span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-xs text-[#57534E] line-through tabular-nums">
                                {formatPKR(p.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={!p.inStock}
                          onClick={() => addToCart(p, p.variants[0]?.id, 1)}
                          className="flex-1 min-h-[40px] rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{p.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${p.name} from wishlist`}
                          onClick={() => toggleWishlist(p.id)}
                          className="w-10 h-10 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] inline-flex items-center justify-center text-[#57534E] hover:text-[#9B1C2E]"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 4. MY ADDRESSES */}
          {activeSection === 'addresses' && (
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">My Addresses</h2>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Manage delivery addresses for Hyderabad and Bahria Town Karachi.
                  </p>
                </div>
                {!addressFormOpen && (
                  <button
                    type="button"
                    onClick={() => openAddressForm()}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {addressFormOpen && (
                <form
                  onSubmit={handleSaveAddress}
                  className="bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-5 space-y-4"
                  noValidate
                >
                  <h3 className="text-base font-bold text-[#1C1917]">
                    {editingAddressId ? 'Edit Address' : 'New Delivery Address'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="addr-label" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Address Label *
                      </label>
                      <input
                        id="addr-label"
                        type="text"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="e.g. Home, Office"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                      />
                      {addrErrors.label && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{addrErrors.label}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="addr-city" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        City / Zone *
                      </label>
                      <select
                        id="addr-city"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                      >
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Bahria Town Karachi">Bahria Town Karachi</option>
                        <option value="Karachi">Karachi</option>
                      </select>
                      {addrErrors.city && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{addrErrors.city}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="addr-rec" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Recipient Name *
                      </label>
                      <input
                        id="addr-rec"
                        type="text"
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                      />
                      {addrErrors.recipientName && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{addrErrors.recipientName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="addr-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Contact Phone *
                      </label>
                      <input
                        id="addr-phone"
                        type="tel"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="03XX-XXXXXXX"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                      />
                      {addrErrors.phone && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{addrErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="addr-street" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Street, Block &amp; House Number *
                    </label>
                    <input
                      id="addr-street"
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="House, street, sector, or precinct"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                    />
                    {addrErrors.streetAddress && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{addrErrors.streetAddress}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="addr-notes" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Delivery Landmark (Optional)
                    </label>
                    <input
                      id="addr-notes"
                      type="text"
                      value={addrNotes}
                      onChange={(e) => setAddrNotes(e.target.value)}
                      placeholder="Nearby landmark or gate instructions"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="submit"
                      className="min-h-[42px] px-5 py-2 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524]"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddressFormOpen(false);
                        setEditingAddressId(null);
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {savedAddresses.length === 0 && !addressFormOpen ? (
                <div className="py-10 text-center space-y-3">
                  <MapPin className="w-10 h-10 text-[#D6D3CD] mx-auto" aria-hidden="true" />
                  <p className="font-semibold text-[#1C1917]">No saved delivery addresses yet</p>
                  <p className="text-sm text-[#57534E] max-w-sm mx-auto">
                    Add your home or workplace address to keep local delivery details organized.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAddressForm()}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <article
                      key={addr.id}
                      className="border border-[#E6E2DA] rounded-2xl p-5 bg-[#FAF9F6] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-sm text-[#1C1917]">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="font-semibold text-[#166534]">Default Address</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#1C1917]">{addr.recipientName}</p>
                        <p className="text-xs text-[#57534E] leading-relaxed">
                          {addr.streetAddress}, {addr.city}
                        </p>
                        <p className="text-xs text-[#57534E]">{addr.phone}</p>
                        {addr.notes && (
                          <p className="text-xs text-[#57534E] italic">Note: {addr.notes}</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#E6E2DA] flex flex-wrap items-center gap-3 text-xs">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => setDefaultAddress(addr.id)}
                            className="font-semibold text-[#166534] hover:underline py-1"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openAddressForm(addr)}
                          className="font-semibold text-[#1C1917] hover:text-[#9B1C2E] py-1"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAddress(addr.id)}
                          className="font-semibold text-[#57534E] hover:text-[#9B1C2E] py-1 ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* 5. PROFILE & SETTINGS */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-5">
                <div className="pb-4 border-b border-[#E6E2DA]">
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Personal Details &amp; Preferences
                  </h2>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Saved locally in this browser demonstration session.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="prof-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Full Name *
                      </label>
                      <input
                        id="prof-name"
                        type="text"
                        value={profileDraft.fullName}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, fullName: e.target.value }))
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      />
                      {profileErrors.fullName && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{profileErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Mobile Number *
                      </label>
                      <input
                        id="prof-phone"
                        type="tel"
                        value={profileDraft.phone}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, phone: e.target.value }))
                        }
                        placeholder="03XX-XXXXXXX"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      />
                      {profileErrors.phone && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{profileErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="prof-email" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Email Address *
                      </label>
                      <input
                        id="prof-email"
                        type="email"
                        value={profileDraft.email}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="name@example.com"
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      />
                      {profileErrors.email && (
                        <p className="mt-1 text-xs text-[#9B1C2E]">{profileErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="prof-branch" className="block text-xs font-semibold text-[#1C1917] mb-1">
                        Preferred Marhaba Branch
                      </label>
                      <select
                        id="prof-branch"
                        value={profileDraft.preferredBranchId}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, preferredBranchId: e.target.value }))
                        }
                        className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                      >
                        {VERIFIED_BRANCHES.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.shortName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2.5 text-sm">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileDraft.orderUpdates}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, orderUpdates: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#9B1C2E]"
                      />
                      <span className="text-[#1C1917]">Receive order &amp; reservation status updates</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileDraft.weeklyOffers}
                        onChange={(e) =>
                          setProfileDraft((p) => ({ ...p, weeklyOffers: e.target.checked }))
                        }
                        className="w-4 h-4 accent-[#9B1C2E]"
                      />
                      <span className="text-[#1C1917]">Receive supermarket essentials &amp; family dining updates</span>
                    </label>
                  </div>

                  {profileSavedNote && (
                    <p className="text-xs font-semibold text-[#166534]">{profileSavedNote}</p>
                  )}

                  <button
                    type="submit"
                    className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors"
                  >
                    Save Profile Changes
                  </button>
                </form>
              </section>

              {/* Password Section */}
              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E6E2DA]">
                  <Lock className="w-4 h-4 text-[#9B1C2E]" aria-hidden="true" />
                  <h2 className="font-serif text-xl font-bold text-[#1C1917]">
                    Password &amp; Security
                  </h2>
                </div>
                <p className="text-xs text-[#57534E]">
                  Demonstration security form — live password changes are enabled when connected to a
                  customer authentication backend.
                </p>

                <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4" noValidate>
                  <div>
                    <label htmlFor="pw-curr" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Current Password
                    </label>
                    <input
                      id="pw-curr"
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {pwErrors.currentPassword && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{pwErrors.currentPassword}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="pw-new" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      New Password
                    </label>
                    <input
                      id="pw-new"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {pwErrors.newPassword && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{pwErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="pw-conf" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="pw-conf"
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {pwErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{pwErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
                    {pwSuccess ? (
                      <p className="text-xs font-medium text-[#166534]">{pwSuccess}</p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      className="min-h-[42px] px-5 py-2 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E]"
                    >
                      Validate Password Update
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* 6. OPTIONAL MY BOOKINGS (RESTAURANT & PLAY LAND) */}
          {activeSection === 'bookings' && (
            <div className="space-y-6">
              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="pb-3 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Restaurant Table Requests
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('restaurant', { restaurantSection: 'reservations' })}
                    className="text-xs font-semibold text-[#9B1C2E] hover:underline"
                  >
                    Request a Table &rarr;
                  </button>
                </div>

                {reservations.length === 0 ? (
                  <p className="text-sm text-[#57534E]">No table reservation requests submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reservations.map((r) => (
                      <div
                        key={r.referenceId}
                        className="border border-[#E6E2DA] bg-[#FAF9F6] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-bold text-[#1C1917]">
                            {r.referenceId} · {r.data.partySize} Guests ({r.data.date} at {r.data.time})
                          </p>
                          <p className="text-xs font-medium text-[#B45309]">{r.status}</p>
                        </div>
                        <span className="text-xs text-[#57534E]">{r.data.seatingPreference}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="pb-3 border-b border-[#E6E2DA] flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                    Play Land Visit Inquiries
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('playland', { playLandSection: 'plan-visit' })}
                    className="text-xs font-semibold text-[#166534] hover:underline"
                  >
                    Plan Play Land Visit &rarr;
                  </button>
                </div>

                {playInquiries.length === 0 ? (
                  <p className="text-sm text-[#57534E]">No Play Land visit inquiries submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {playInquiries.map((inq) => (
                      <div
                        key={inq.referenceId}
                        className="border border-[#E6E2DA] bg-[#FAF9F6] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
                      >
                        <div>
                          <p className="font-bold text-[#1C1917]">
                            {inq.referenceId} · {inq.data.inquiryType} ({inq.data.childrenCount}{' '}
                            Children)
                          </p>
                          <p className="text-xs font-medium text-[#166534]">{inq.status}</p>
                        </div>
                        <span className="text-xs text-[#57534E]">{inq.data.preferredDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* 7. HELP & SUPPORT */}
          {activeSection === 'support' && (
            <section className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#E6E2DA]">
                <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                  Help &amp; Customer Support
                </h2>
                <p className="text-sm text-[#57534E] mt-1">
                  Reach our store teams directly during daily operating hours (
                  {VERIFIED_CONTACT.workingHours}).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2">
                  <p className="font-semibold text-[#1C1917] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#9B1C2E]" aria-hidden="true" />
                    <span>Supermarket Support</span>
                  </p>
                  <p className="text-xs text-[#57534E]">
                    {VERIFIED_CONTACT.supportPhone} · {VERIFIED_CONTACT.mobileSupport}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2">
                  <p className="font-semibold text-[#1C1917] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#166534]" aria-hidden="true" />
                    <span>Email Assistance</span>
                  </p>
                  <p className="text-xs text-[#57534E]">{VERIFIED_CONTACT.generalEmail}</p>
                  <p className="text-xs text-[#57534E]">{VERIFIED_CONTACT.restaurantEmail}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('contact')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                >
                  Open Contact Form
                </button>
                <button
                  type="button"
                  onClick={() => navigate('locations')}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#9B1C2E]"
                >
                  View Store Locations
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
