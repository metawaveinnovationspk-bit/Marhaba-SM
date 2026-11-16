import React, { useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  PLAYLAND_PACKAGES,
  PRODUCTS,
  RESTAURANT_DEALS,
  VERIFIED_BRANCHES,
  VERIFIED_CONTACT,
} from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import { calculateDiscountPercent, formatPKR } from '../../utils/commerce';
import { ProductPackshot } from '../Media/VisualAsset';
import { ProductCard } from '../Shop/ProductCard';

export function OffersPage() {
  const { navigate } = useStore();
  const discountedProducts = PRODUCTS.filter(
    (p) => calculateDiscountPercent(p.originalPrice, p.price) > 0
  );

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 space-y-12">
      <div className="pb-6 border-b border-[#E6E2DA]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
          Verified Savings &amp; Proposed Bundles
        </p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">
          Offers Across Marhaba
        </h1>
        <p className="mt-2 text-sm text-[#57534E] max-w-2xl">
          Discount percentages are calculated directly from original and offer prices—never inflated
          or fabricated. Verified supermarket discounts are labeled clearly alongside demonstration
          restaurant and Play Land bundle structures.
        </p>
      </div>

      {/* Supermarket Discounts */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
            Supermarket Savings ({discountedProducts.length})
          </h2>
          <button
            type="button"
            onClick={() =>
              navigate('shop', { resetShopFilter: true, shopFilter: { offersOnly: true } })
            }
            className="text-sm font-semibold text-[#9B1C2E] hover:underline"
          >
            Filter Offers in Shop &rarr;
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {discountedProducts.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Restaurant & Play Land Bundles */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[#E6E2DA]">
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Restaurant Family Deals</h2>
            <button
              type="button"
              onClick={() => navigate('restaurant', { restaurantSection: 'offers' })}
              className="text-xs font-semibold text-[#9B1C2E] hover:underline"
            >
              View in Restaurant &rarr;
            </button>
          </div>
          {RESTAURANT_DEALS.map((deal) => (
            <div key={deal.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
              <div className="flex justify-between gap-3">
                <p className="font-bold text-[#1C1917]">{deal.title}</p>
                <span className="font-bold text-[#9B1C2E] tabular-nums">
                  {formatPKR(deal.offerPrice)}
                </span>
              </div>
              <p className="text-xs text-[#57534E] mt-1">{deal.includedItems.join(' · ')}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1C1917]">Play Land Packages</h2>
            <button
              type="button"
              onClick={() => navigate('playland', { playLandSection: 'packages' })}
              className="text-xs font-semibold text-[#166534] hover:underline"
            >
              View in Play Land &rarr;
            </button>
          </div>
          {PLAYLAND_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
              <div className="flex justify-between gap-3">
                <p className="font-bold text-[#1C1917]">{pkg.name}</p>
                <span className="font-bold text-[#166534] tabular-nums">
                  {formatPKR(pkg.price)}
                </span>
              </div>
              <p className="text-xs text-[#57534E] mt-1">
                {pkg.participants} · {pkg.duration}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function LocationsPage() {
  const { setBranchId, branchId } = useStore();

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E6E2DA]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
          Verified Store Directory
        </p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">
          Locations, Hours &amp; Facilities
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Select your preferred branch to set your active shopping &amp; dining location across the site.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {VERIFIED_BRANCHES.map((b) => {
          const isSelected = b.id === branchId;
          return (
            <div
              key={b.id}
              className={`bg-[#FFFFFF] border rounded-2xl p-6 flex flex-col justify-between ${
                isSelected ? 'border-[#9B1C2E] ring-1 ring-[#9B1C2E]' : 'border-[#E6E2DA]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#166534]">{b.city}</span>
                  {b.isFlagship && (
                    <span className="font-semibold text-[#9B1C2E]">Flagship Complex</span>
                  )}
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1C1917]">{b.name}</h2>
                <p className="text-sm text-[#57534E] flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#9B1C2E] shrink-0 mt-0.5" />
                  <span>{b.address}</span>
                </p>
                <p className="text-xs font-medium text-[#1C1917]">{b.hours}</p>

                <div className="pt-2 border-t border-[#E6E2DA] space-y-1.5 text-xs">
                  <p className="font-semibold text-[#1C1917]">Available Facilities:</p>
                  <p className="text-[#57534E]">{b.facilities.join(' · ')}</p>
                  <p className="font-semibold text-[#1C1917] pt-1">Store Phone:</p>
                  <p className="text-[#57534E]">{b.phones.join(' / ')}</p>
                  {b.restaurantPhones && (
                    <>
                      <p className="font-semibold text-[#1C1917] pt-1">Restaurant Lines:</p>
                      <p className="text-[#57534E]">{b.restaurantPhones.join(' · ')}</p>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBranchId(b.id)}
                className={`mt-6 w-full h-11 rounded-lg text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'bg-[#166534] text-white'
                    : 'bg-[#FAF9F6] border border-[#E6E2DA] text-[#1C1917] hover:border-[#9B1C2E]'
                }`}
              >
                {isSelected ? 'Currently Selected Branch' : 'Set as Active Branch'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { AboutPage } from './AboutPage';

export function ContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Supermarket Inquiry');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 7 || !message.trim()) {
      setError('Please enter your name, contact number, and message.');
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-5 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
          Customer Care
        </p>
        <h1 className="font-serif text-3xl font-bold text-[#1C1917]">Contact Marhaba</h1>
        <p className="text-sm text-[#57534E] leading-relaxed">
          Reach our Hyderabad or Karachi teams directly by telephone or email during daily store
          hours ({VERIFIED_CONTACT.workingHours}).
        </p>

        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-[#9B1C2E] mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-[#1C1917]">Supermarket Support</p>
              <p className="text-xs text-[#57534E]">
                {VERIFIED_CONTACT.supportPhone} · {VERIFIED_CONTACT.mobileSupport}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-[#166534] mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-[#1C1917]">Restaurant Reservations</p>
              <p className="text-xs text-[#57534E]">{VERIFIED_CONTACT.restaurantPhones.join(' · ')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-[#57534E] mt-1 shrink-0" />
            <div>
              <p className="font-semibold text-[#1C1917]">Email</p>
              <p className="text-xs text-[#57534E]">{VERIFIED_CONTACT.generalEmail}</p>
              <p className="text-xs text-[#57534E]">{VERIFIED_CONTACT.restaurantEmail}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
        {sent ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#166534] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#1C1917]">
                  Inquiry Logged (Demo)
                </h2>
                <p className="mt-1 text-sm text-[#57534E]">
                  Thank you, {name}. Your {topic.toLowerCase()} note has been captured in this
                  demonstration interface. For live assistance, please call {VERIFIED_CONTACT.supportPhone}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setMessage('');
              }}
              className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <h2 className="text-lg font-bold text-[#1C1917]">Send a Message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ct-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Name *
                </label>
                <input
                  id="ct-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                />
              </div>
              <div>
                <label htmlFor="ct-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                  Phone *
                </label>
                <input
                  id="ct-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ct-topic" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Department
              </label>
              <select
                id="ct-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
              >
                <option>Supermarket Inquiry</option>
                <option>Restaurant &amp; Catering</option>
                <option>Play Land &amp; Birthdays</option>
                <option>Customer Feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="ct-msg" className="block text-xs font-semibold text-[#1C1917] mb-1">
                Message *
              </label>
              <textarea
                id="ct-msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
              />
            </div>

            {error && <p className="text-xs font-medium text-[#9B1C2E]">{error}</p>}

            <button
              type="submit"
              className="px-6 h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
            >
              Submit Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, navigate } = useStore();
  const savedProducts = PRODUCTS.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10">
      <div className="pb-6 border-b border-[#E6E2DA] flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#1C1917]">Saved Wishlist</h1>
          <p className="mt-1 text-sm text-[#57534E]">
            Keep track of everyday groceries and family items for quick reordering.
          </p>
        </div>
        <span className="text-sm font-semibold text-[#57534E] tabular-nums">
          {savedProducts.length} saved
        </span>
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="w-10 h-10 text-[#D6D3CD] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#1C1917]">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-[#57534E]">
            Tap the heart icon on any product in the Shop to save it here.
          </p>
          <button
            type="button"
            onClick={() => navigate('shop')}
            className="mt-5 px-5 py-2.5 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold"
          >
            Explore Shop
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {savedProducts.map((p) => (
            <div
              key={p.id}
              className="group bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    {p.brand}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('product', { productId: p.id })}
                    className="mt-1 text-left font-bold text-[#1C1917] hover:text-[#9B1C2E] line-clamp-2"
                  >
                    {p.name}
                  </button>
                  <p className="mt-1 text-xs text-[#57534E]">{p.unitLabel}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-base font-bold text-[#1C1917] tabular-nums">
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
              <div className="p-4 pt-3 flex gap-2">
                <button
                  type="button"
                  disabled={!p.inStock}
                  onClick={() => addToCart(p, p.variants[0]?.id, 1)}
                  className="flex-1 h-10 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{p.inStock ? 'Add to Cart' : 'Unavailable'}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${p.name} from wishlist`}
                  onClick={() => toggleWishlist(p.id)}
                  className="w-10 h-10 rounded-xl border border-[#E6E2DA] inline-flex items-center justify-center text-[#57534E] hover:text-[#9B1C2E] hover:border-[#9B1C2E]/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { AccountPage } from './AccountPage';
