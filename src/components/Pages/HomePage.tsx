import React from 'react';
import { ArrowRight, Clock, MapPin, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react';
import { ASSETS, PRODUCTS, SHOP_DEPARTMENTS, VERIFIED_BRANCHES } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import { StudioImage } from '../Media/VisualAsset';
import { ProductCard } from '../Shop/ProductCard';

export function HomePage() {
  const { navigate, currentBranch } = useStore();

  const verifiedFeaturedProducts = PRODUCTS.filter((p) => p.dataTier === 'verified').slice(0, 4);

  return (
    <div>
      {/* 1. DESTINATION HERO — Immediate 3-Pillar Brand Clarity */}
      <section className="relative bg-[#FFFFFF] border-b border-[#E6E2DA]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9B1C2E]">
                Hyderabad &amp; Bahria Town Karachi
              </p>
              <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1C1917] leading-[1.12]">
                A Trusted Family Destination for Shopping, Dining &amp; Play
              </h1>
              <p className="mt-4 text-base text-[#57534E] leading-relaxed max-w-xl">
                Marhaba brings together everyday supermarket convenience, a four-cuisine family
                restaurant, and an indoor children&apos;s Play Land under one welcoming roof—open daily
                from 10:00 AM to 10:00 PM.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('shop', { resetShopFilter: true })}
                className="px-6 py-3 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] inline-flex items-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Supermarket</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('restaurant')}
                className="px-5 py-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#9B1C2E] inline-flex items-center gap-2 transition-colors"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#9B1C2E]" />
                <span>Explore Restaurant</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('playland')}
                className="px-5 py-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#166534] inline-flex items-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#166534]" />
                <span>Visit Play Land</span>
              </button>
            </div>

            {/* Verified Operational Snapshot */}
            <div className="pt-4 border-t border-[#E6E2DA] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#57534E]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9B1C2E] shrink-0" />
                <span className="truncate">{currentBranch.shortName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#166534] shrink-0" />
                <span>{currentBranch.hours}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[260px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-[#E6E2DA] shadow-xs">
              <StudioImage
                src={ASSETS.heroDestination}
                alt="Marhaba Supermarket modern family shopping mall atrium"
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* 3-Experience Pillar Strip */}
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate('shop', { resetShopFilter: true })}
            className="text-left p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#9B1C2E] hover:-translate-y-0.5 hover:shadow-md transition-all flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                01 · Supermarket
              </p>
              <h2 className="mt-1 text-base font-bold text-[#1C1917]">
                17 Retail Departments
              </h2>
              <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                Groceries, fresh dairy, beverages, personal care, home &amp; apparel.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#9B1C2E] shrink-0 mt-1" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('restaurant')}
            className="text-left p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#B45309] hover:-translate-y-0.5 hover:shadow-md transition-all flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                02 · Family Dining
              </p>
              <h2 className="mt-1 text-base font-bold text-[#1C1917]">
                Marhaba Restaurant
              </h2>
              <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                Pakistani, Chinese, Italian &amp; Turkish cuisines with rooftop seating.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#B45309] shrink-0 mt-1" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => navigate('playland')}
            className="text-left p-5 rounded-2xl bg-[#FAF9F6] border border-[#E6E2DA] hover:border-[#166534] hover:-translate-y-0.5 hover:shadow-md transition-all flex items-start justify-between gap-4"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
                03 · Family Entertainment
              </p>
              <h2 className="mt-1 text-base font-bold text-[#1C1917]">
                Indoor Play Land
              </h2>
              <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                Toddler soft play, climbing frames, rides &amp; comfortable parent seating.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#166534] shrink-0 mt-1" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* 2. FEATURED SUPERMARKET ESSENTIALS (Verified PKR Prices) */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Published Marhaba Pricing
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Everyday Supermarket Essentials
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('shop', { resetShopFilter: true })}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9B1C2E] hover:underline"
          >
            <span>Browse Full Supermarket ({PRODUCTS.length} Items)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {verifiedFeaturedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Department Quick Directory */}
        <div className="mt-8 pt-6 border-t border-[#E6E2DA] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#57534E] mr-2">Shop by Department:</span>
          {SHOP_DEPARTMENTS.slice(0, 9).map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() =>
                navigate('shop', {
                  resetShopFilter: true,
                  shopFilter: { departmentId: dept.id },
                })
              }
              className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E6E2DA] text-xs font-medium text-[#1C1917] hover:border-[#9B1C2E] hover:text-[#9B1C2E] transition-colors"
            >
              {dept.name}
            </button>
          ))}
        </div>
      </section>

      {/* 3. CONNECTED RESTAURANT & PLAY LAND SPOTLIGHT */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Restaurant Card */}
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-[16/9] overflow-hidden bg-[#F3F1EC]">
              <StudioImage
                src={ASSETS.restaurantHero}
                alt="Marhaba Family Restaurant Dining Room"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  Marhaba Restaurant
                </p>
                <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
                  Four Cuisines for Memorable Family Dinners
                </h2>
                <p className="mt-2.5 text-sm text-[#57534E] leading-relaxed">
                  Dine indoors or enjoy rooftop evening seating with Pakistani BBQ &amp; karahi,
                  Chinese wok dishes, Italian wood-fired pizzas, and Turkish charcoal platters.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('restaurant', { restaurantSection: 'menu' })}
                  className="px-5 py-2.5 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
                >
                  Explore Menu
                </button>
                <button
                  type="button"
                  onClick={() => navigate('restaurant', { restaurantSection: 'reservations' })}
                  className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  Request a Table
                </button>
              </div>
            </div>
          </div>

          {/* Play Land Card */}
          <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-[16/9] overflow-hidden bg-[#F3F1EC]">
              <StudioImage
                src={ASSETS.playlandZone}
                alt="Marhaba Indoor Play Land"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
                  Marhaba Play Land
                </p>
                <h2 className="mt-1.5 font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
                  Big Smiles &amp; Comfort for Parents
                </h2>
                <p className="mt-2.5 text-sm text-[#57534E] leading-relaxed">
                  Age-appropriate indoor zones for toddlers, adventurers, and juniors—paired with a
                  transparent Parents&apos; Guide, birthday planning, and adjacent dining access.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('playland', { playLandSection: 'attractions' })}
                  className="px-5 py-2.5 rounded-lg bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D]"
                >
                  Explore Attractions
                </button>
                <button
                  type="button"
                  onClick={() => navigate('playland', { playLandSection: 'parents-guide' })}
                  className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  Parents&apos; Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFIED BRANCHES & LOCATIONS */}
      <section className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Visit Us In Person
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Our Verified Branches
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('locations')}
            className="text-sm font-semibold text-[#9B1C2E] hover:underline"
          >
            View All Contact Numbers &amp; Hours &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VERIFIED_BRANCHES.map((branch) => (
            <div
              key={branch.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(28,25,23,0.03)]"
            >
              <div>
                <p className="text-xs font-semibold text-[#166534]">{branch.city}</p>
                <h3 className="mt-1 text-base font-bold text-[#1C1917]">{branch.name}</h3>
                <p className="mt-2 text-xs text-[#57534E] leading-relaxed">{branch.address}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E6E2DA] text-xs text-[#57534E] space-y-1">
                <p className="font-medium text-[#1C1917]">{branch.facilities.join(' · ')}</p>
                <p>{branch.hours}</p>
                <p className="font-semibold text-[#9B1C2E] tabular-nums">{branch.phones[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
