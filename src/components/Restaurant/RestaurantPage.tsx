import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Maximize2,
  Phone,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  ASSETS,
  GALLERY_PHOTOS,
  RESTAURANT_CUISINES,
  RESTAURANT_DEALS,
  RESTAURANT_DISHES,
  VERIFIED_BRANCHES,
  VERIFIED_CONTACT,
} from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type {
  CuisineType,
  DishItem,
  ReservationFormData,
  ReservationSubmission,
  RestaurantSection,
} from '../../types/marhaba';
import { calculateDiscountPercent, formatPKR, validateReservationForm } from '../../utils/commerce';
import { StudioImage } from '../Media/VisualAsset';

export function RestaurantPage() {
  const {
    restaurantSection,
    restaurantCuisine,
    navigate,
    branchId,
    submitReservation,
  } = useStore();

  const [activeCuisine, setActiveCuisine] = useState<CuisineType | 'All'>(restaurantCuisine);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedDish, setSelectedDish] = useState<DishItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<'All' | 'Food' | 'Dining' | 'Ambiance'>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [resForm, setResForm] = useState<ReservationFormData>({
    branchId: branchId === 'karachi-p2' ? 'hyderabad' : branchId,
    date: '',
    time: '20:00',
    partySize: 4,
    customerName: '',
    contactNumber: '',
    seatingPreference: 'Family Hall',
    specialRequests: '',
  });
  const [resErrors, setResErrors] = useState<Record<string, string>>({});
  const [submittedRes, setSubmittedRes] = useState<ReservationSubmission | null>(null);

  const sectionRefs = useRef<Record<RestaurantSection, HTMLElement | null>>({
    overview: null,
    menu: null,
    cuisines: null,
    offers: null,
    dining: null,
    gallery: null,
    reservations: null,
  });

  useEffect(() => {
    setActiveCuisine(restaurantCuisine);
    setActiveCategory('All');
  }, [restaurantCuisine]);

  useEffect(() => {
    if (restaurantSection && restaurantSection !== 'overview') {
      const el = sectionRefs.current[restaurantSection];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [restaurantSection]);

  const galleryItems = useMemo(() => {
    const restaurantPhotos = GALLERY_PHOTOS.filter((g) => g.category !== 'Play Land');
    if (galleryFilter === 'All') return restaurantPhotos;
    return restaurantPhotos.filter((g) => g.category === galleryFilter);
  }, [galleryFilter]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % galleryItems.length));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + galleryItems.length) % galleryItems.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, galleryItems.length]);

  useEffect(() => {
    if (!selectedDish) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDish(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedDish]);

  const availableCategories = useMemo(() => {
    if (activeCuisine === 'All') return [];
    const found = RESTAURANT_CUISINES.find((c) => c.id === activeCuisine);
    return found ? found.categories : [];
  }, [activeCuisine]);

  const filteredDishes = useMemo(() => {
    return RESTAURANT_DISHES.filter((d) => {
      if (activeCuisine !== 'All' && d.cuisine !== activeCuisine) return false;
      if (activeCategory !== 'All' && d.category !== activeCategory) return false;
      return true;
    });
  }, [activeCuisine, activeCategory]);

  const handleReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateReservationForm(resForm);
    setResErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const result = submitReservation(resForm);
    setSubmittedRes(result);
  };

  const jumpTo = (sec: RestaurantSection) => {
    navigate('restaurant', { restaurantSection: sec, scrollTop: false });
    sectionRefs.current[sec]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-[#FAF9F6]">
      {/* Restaurant Sub-Navigation Strip */}
      <div className="bg-[#FFFFFF] border-b border-[#E6E2DA] lg:sticky lg:top-[149px] z-20">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {(
              [
                ['overview', 'Overview'],
                ['cuisines', 'Cuisines'],
                ['menu', 'Explore Menu'],
                ['dining', 'Dining Experience'],
                ['offers', 'Deals & Offers'],
                ['gallery', 'Gallery'],
                ['reservations', 'Reservations'],
              ] as [RestaurantSection, string][]
            ).map(([sec, label]) => (
              <button
                key={sec}
                type="button"
                onClick={() => jumpTo(sec)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  restaurantSection === sec
                    ? 'bg-[#9B1C2E] text-white'
                    : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <a
            href={`tel:${VERIFIED_CONTACT.restaurantPhones[0]}`}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-[#9B1C2E] whitespace-nowrap shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Dining Desk: {VERIFIED_CONTACT.restaurantPhones[0]}</span>
          </a>
        </div>
      </div>

      {/* SECTION 1: Restaurant Hero */}
      <section
        ref={(el) => {
          sectionRefs.current.overview = el;
        }}
        className="relative bg-[#1C1917] text-white overflow-hidden"
      >
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-14 py-14 lg:py-20 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F59E0B]">
              Marhaba Family &amp; Rooftop Dining
            </p>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12] text-white">
              Warm Hospitality &amp; Four Distinct Kitchens
            </h1>
            <p className="mt-4 text-base text-[#E6E2DA] leading-relaxed max-w-xl">
              From charcoal-fired Pakistani BBQ and copper-pot karahi to hand-tossed Chinese wok plates,
              stone-baked Italian pizzas, and Turkish kebabs—crafted for comfortable family gatherings.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => jumpTo('menu')}
                className="px-6 py-3 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors"
              >
                Explore Menu
              </button>
              <button
                type="button"
                onClick={() => jumpTo('reservations')}
                className="px-6 py-3 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Reserve a Table
              </button>
            </div>
            <p className="mt-6 text-xs text-[#D6D3CD]">
              Daily Hours: 10:00 AM – 10:00 PM · Hyderabad Flagship &amp; Bahria Town Karachi
            </p>
          </div>
          <div className="lg:col-span-6 min-h-[280px] lg:min-h-[460px] relative">
            <StudioImage
              src={ASSETS.restaurantHero}
              alt="Family enjoying dinner at Marhaba Restaurant"
              className="w-full h-full object-cover"
              priority
            />
            <div
              className="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#1C1917] to-transparent"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: The Restaurant Experience (Editorial Layout) */}
      <section
        ref={(el) => {
          sectionRefs.current.dining = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-16 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              The Dining Experience
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#1C1917]">
              Thoughtful Comfort for Every Family Occasion
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#57534E] leading-relaxed">
              Integrated directly within the Marhaba complex, Marhaba Restaurant offers both indoor
              family hall seating and open rooftop dining ambiance. Families can transition effortlessly
              from grocery shopping or children&apos;s Play Land visits to a calm, freshly prepared meal.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 pt-5 border-t border-[#E6E2DA] text-sm">
              <div>
                <p className="font-semibold text-[#1C1917]">Dining Formats</p>
                <p className="text-xs text-[#57534E] mt-1">
                  Casual Family Hall · Rooftop Seating · Group Tables
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#1C1917]">Direct Reservations</p>
                <p className="text-xs text-[#57534E] mt-1">
                  0314-7817063 · 0341-1817063
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-[#E6E2DA] bg-[#FFFFFF]">
              <div className="aspect-[4/3] overflow-hidden">
                <StudioImage
                  src={ASSETS.restaurantFeast}
                  alt="Four cuisines spread at Marhaba Restaurant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-[#1C1917]">Multi-Cuisine Harmony</p>
                <p className="text-xs text-[#57534E] mt-1">
                  Pakistani, Chinese, Italian, and Turkish selections served fresh to one table.
                </p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-[#E6E2DA] bg-[#FFFFFF]">
              <div className="aspect-[4/3] overflow-hidden">
                <StudioImage
                  src={ASSETS.playlandZone}
                  alt="Adjacent family Play Land access"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Connected to Play Land</p>
                  <p className="text-xs text-[#57534E] mt-1">
                    Convenient indoor proximity so parents and kids enjoy the whole evening comfortably.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('playland')}
                  className="mt-2 self-start text-xs font-semibold text-[#166534] hover:underline"
                >
                  Explore Play Land &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Explore Four Cuisines */}
      <section
        ref={(el) => {
          sectionRefs.current.cuisines = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Four Culinary Traditions
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">Explore Cuisines</h2>
          </div>
          <p className="text-sm text-[#57534E]">
            Select any cuisine to filter the interactive menu below.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {RESTAURANT_CUISINES.slice(0, 4).map((cuisine) => (
            <button
              key={cuisine.id}
              type="button"
              onClick={() => {
                setActiveCuisine(cuisine.id);
                setActiveCategory('All');
                jumpTo('menu');
              }}
              className={`text-left bg-[#FFFFFF] border rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between ${
                activeCuisine === cuisine.id
                  ? 'border-[#9B1C2E] ring-1 ring-[#9B1C2E]'
                  : 'border-[#E6E2DA]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#57534E] mb-2">
                  <span>Verified Cuisine</span>
                  <UtensilsCrossed className="w-4 h-4 text-[#9B1C2E]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1C1917]">{cuisine.title}</h3>
                <p className="mt-2 text-sm text-[#57534E] leading-relaxed">{cuisine.subtitle}</p>
              </div>
              <p className="mt-4 pt-3 border-t border-[#E6E2DA] text-xs font-semibold text-[#9B1C2E]">
                View {cuisine.id} Dishes &rarr;
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 4 & 5: Complete Interactive Menu */}
      <section
        ref={(el) => {
          sectionRefs.current.menu = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Interactive Menu Directory
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              {activeCuisine === 'All' ? 'Complete Dining Menu' : `${activeCuisine} Kitchen`}
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F1EC] text-xs text-[#57534E]">
            <Info className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            <span>
              Dish prices shown are illustrative demonstration samples pending official printed menu sync.
            </span>
          </div>
        </div>

        {/* Cuisine Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#E6E2DA]">
          <button
            type="button"
            onClick={() => {
              setActiveCuisine('All');
              setActiveCategory('All');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeCuisine === 'All'
                ? 'bg-[#1C1917] text-white'
                : 'bg-[#FFFFFF] border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC]'
            }`}
          >
            All Cuisines ({RESTAURANT_DISHES.length})
          </button>
          {RESTAURANT_CUISINES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCuisine(c.id);
                setActiveCategory('All');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeCuisine === c.id
                  ? 'bg-[#9B1C2E] text-white'
                  : 'bg-[#FFFFFF] border border-[#E6E2DA] text-[#1C1917] hover:bg-[#F3F1EC]'
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>

        {/* Category Sub-Filters */}
        {availableCategories.length > 0 && (
          <div className="py-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                activeCategory === 'All'
                  ? 'bg-[#F3F1EC] text-[#9B1C2E] font-semibold'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              All Categories
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  activeCategory === cat
                    ? 'bg-[#F3F1EC] text-[#9B1C2E] font-semibold'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Dish Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDishes.map((dish) => (
            <article
              key={dish.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {dish.image && (
                <div className="aspect-[16/10] bg-[#F3F1EC] overflow-hidden">
                  <StudioImage
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                    <span className="font-semibold text-[#9B1C2E]">
                      {dish.cuisine} · {dish.category}
                    </span>
                    <span className="text-[11px] text-[#57534E]">Sample Menu</span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-bold text-[#1C1917]">{dish.name}</h3>
                  <p className="mt-1.5 text-sm text-[#57534E] leading-relaxed">{dish.description}</p>
                  <p className="mt-2.5 text-xs text-[#57534E]">
                    Serving: <span className="font-medium text-[#1C1917]">{dish.portionSize}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6E2DA] flex items-center justify-between gap-3">
                  <div>
                    {dish.price ? (
                      <span className="text-base font-bold text-[#1C1917] tabular-nums">
                        {formatPKR(dish.price)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#57534E]">Ask at Counter</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDish(dish)}
                    className="px-3.5 py-2 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#9B1C2E] hover:text-[#9B1C2E] transition-colors"
                  >
                    Dish Details &amp; Inquiry
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 6 & 7: Deals & Offers */}
      <section
        ref={(el) => {
          sectionRefs.current.offers = el;
        }}
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA]"
      >
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
            Dining Value (Demonstration Structure)
          </p>
          <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
            Family Deals &amp; Platters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {RESTAURANT_DEALS.map((deal) => {
            const pct = calculateDiscountPercent(deal.originalPrice, deal.offerPrice);
            return (
              <div
                key={deal.id}
                className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#166534]">{deal.validity}</span>
                    <span className="text-[#57534E]">{deal.servings}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-bold text-[#1C1917]">{deal.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-[#57534E]">
                    {deal.includedItems.map((it) => (
                      <li key={it} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#9B1C2E] shrink-0" aria-hidden="true" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E6E2DA] flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl font-bold text-[#1C1917] tabular-nums">
                        {formatPKR(deal.offerPrice)}
                      </span>
                      {deal.originalPrice && (
                        <span className="text-sm text-[#57534E] line-through tabular-nums">
                          {formatPKR(deal.originalPrice)}
                        </span>
                      )}
                      {pct > 0 && (
                        <span className="text-xs font-semibold text-[#9B1C2E]">Save {pct}%</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#57534E] mt-0.5">{deal.terms}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpTo('reservations')}
                    className="px-4 py-2.5 rounded-xl bg-[#9B1C2E] text-white text-xs font-semibold hover:bg-[#7F1524] transition-colors"
                  >
                    Inquire with Reservation
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 8: Gallery with Fullscreen Lightbox */}
      <section
        ref={(el) => {
          sectionRefs.current.gallery = el;
        }}
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA]"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Visual Showcase
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Food &amp; Dining Gallery
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Food', 'Dining', 'Ambiance'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setGalleryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  galleryFilter === cat
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#FFFFFF] border border-[#E6E2DA] text-[#57534E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {galleryItems.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="group text-left bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F1EC]">
                <StudioImage
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
                <span className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-[#1C1917]/75 text-white inline-flex items-center justify-center">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  {photo.category}
                </p>
                <p className="mt-0.5 text-sm font-bold text-[#1C1917]">{photo.title}</p>
                <p className="mt-1 text-xs text-[#57534E] line-clamp-2">{photo.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 9 & 10: Reservations & Direct Contact */}
      <section
        ref={(el) => {
          sectionRefs.current.reservations = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 scroll-mt-48"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Info & Verified Phones */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                Table Reservation Request
              </p>
              <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
                Plan Your Family Table
              </h2>
              <p className="mt-2.5 text-sm text-[#57534E] leading-relaxed">
                Submit a reservation request below and our hospitality desk will follow up to confirm
                table availability. For immediate same-evening seating, please call our verified restaurant
                lines directly.
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl p-5 space-y-3 text-sm">
              <p className="font-semibold text-[#1C1917]">Verified Restaurant Reservation Lines</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {VERIFIED_CONTACT.restaurantPhones.map((num) => (
                  <a
                    key={num}
                    href={`tel:${num}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF9F6] border border-[#E6E2DA] font-semibold text-[#1C1917] hover:border-[#9B1C2E]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#9B1C2E]" />
                    <span>{num}</span>
                  </a>
                ))}
              </div>
              <p className="text-xs text-[#57534E] pt-1">
                Email: {VERIFIED_CONTACT.restaurantEmail} · {VERIFIED_CONTACT.workingHours}
              </p>
            </div>
          </div>

          {/* Right: Simple Validated Reservation Form */}
          <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            {submittedRes ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#B45309] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#B45309]">
                      {submittedRes.status}
                    </p>
                    <h3 className="font-serif text-2xl font-bold text-[#1C1917] mt-1">
                      Request Reference: {submittedRes.referenceId}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#57534E]">
                      Thank you, {submittedRes.data.customerName}. Your request for{' '}
                      <strong className="text-[#1C1917]">{submittedRes.data.partySize} guests</strong> on{' '}
                      <strong className="text-[#1C1917]">{submittedRes.data.date}</strong> at{' '}
                      <strong className="text-[#1C1917]">{submittedRes.data.time}</strong> has been logged.
                      Please note this table is not finalized until confirmed by our restaurant staff.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedRes(null)}
                  className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleReservationSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="res-branch" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Branch Location
                    </label>
                    <select
                      id="res-branch"
                      value={resForm.branchId}
                      onChange={(e) => setResForm((f) => ({ ...f, branchId: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    >
                      {VERIFIED_BRANCHES.filter((b) => b.facilities.includes('Restaurant')).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="res-seating" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Seating Area
                    </label>
                    <select
                      id="res-seating"
                      value={resForm.seatingPreference}
                      onChange={(e) =>
                        setResForm((f) => ({
                          ...f,
                          seatingPreference: e.target.value as ReservationFormData['seatingPreference'],
                        }))
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    >
                      <option value="Family Hall">Indoor Family Hall</option>
                      <option value="Rooftop Dining">Rooftop Dining</option>
                      <option value="No Preference">No Preference</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="res-date" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Date *
                    </label>
                    <input
                      id="res-date"
                      type="date"
                      value={resForm.date}
                      onChange={(e) => setResForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {resErrors.date && <p className="mt-1 text-xs text-[#9B1C2E]">{resErrors.date}</p>}
                  </div>

                  <div>
                    <label htmlFor="res-time" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      Time *
                    </label>
                    <input
                      id="res-time"
                      type="time"
                      value={resForm.time}
                      onChange={(e) => setResForm((f) => ({ ...f, time: e.target.value }))}
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {resErrors.time && <p className="mt-1 text-xs text-[#9B1C2E]">{resErrors.time}</p>}
                  </div>

                  <div>
                    <label htmlFor="res-guests" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Party Size *
                    </label>
                    <input
                      id="res-guests"
                      type="number"
                      min={1}
                      max={40}
                      value={resForm.partySize}
                      onChange={(e) =>
                        setResForm((f) => ({ ...f, partySize: Number(e.target.value) || 0 }))
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm tabular-nums"
                    />
                    {resErrors.partySize && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{resErrors.partySize}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="res-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Your Name *
                    </label>
                    <input
                      id="res-name"
                      type="text"
                      value={resForm.customerName}
                      onChange={(e) => setResForm((f) => ({ ...f, customerName: e.target.value }))}
                      placeholder="Full name"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {resErrors.customerName && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{resErrors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="res-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Contact Number *
                    </label>
                    <input
                      id="res-phone"
                      type="tel"
                      value={resForm.contactNumber}
                      onChange={(e) => setResForm((f) => ({ ...f, contactNumber: e.target.value }))}
                      placeholder="03XX-XXXXXXX"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {resErrors.contactNumber && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{resErrors.contactNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="res-notes" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Special Requests (High chair, celebration note, dietary needs)
                  </label>
                  <textarea
                    id="res-notes"
                    rows={2}
                    value={resForm.specialRequests}
                    onChange={(e) => setResForm((f) => ({ ...f, specialRequests: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    placeholder="Optional seating or occasion notes..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 h-12 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] transition-colors"
                >
                  Request Table Reservation
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Dish Detail Modal */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={selectedDish.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDish(null);
          }}
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E6E2DA] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  {selectedDish.cuisine} · {selectedDish.category}
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#1C1917] mt-1">
                  {selectedDish.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDish(null)}
                aria-label="Close dish details"
                className="p-1.5 rounded-lg text-[#57534E] hover:bg-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#57534E] leading-relaxed">{selectedDish.description}</p>

            <div className="text-xs space-y-2 pt-2 border-t border-[#E6E2DA]">
              <p>
                <strong className="text-[#1C1917]">Portion:</strong> {selectedDish.portionSize}
              </p>
              {selectedDish.ingredients && (
                <p>
                  <strong className="text-[#1C1917]">Key Ingredients:</strong>{' '}
                  {selectedDish.ingredients.join(', ')}
                </p>
              )}
              {selectedDish.variations && (
                <p>
                  <strong className="text-[#1C1917]">Options:</strong>{' '}
                  {selectedDish.variations.join(' / ')}
                </p>
              )}
              {selectedDish.price && (
                <p>
                  <strong className="text-[#1C1917]">Sample Menu Price:</strong>{' '}
                  <span className="font-bold text-[#9B1C2E] tabular-nums">
                    {formatPKR(selectedDish.price)}
                  </span>
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] text-xs text-[#57534E]">
              Online restaurant ordering is not yet connected. Enjoy dine-in service or call{' '}
              <strong className="text-[#1C1917]">{VERIFIED_CONTACT.restaurantPhones[0]}</strong> to
              inquire directly with the restaurant desk.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDish(null);
                  jumpTo('reservations');
                }}
                className="flex-1 h-11 rounded-lg bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524]"
              >
                Reserve Table for Dining
              </button>
              <a
                href={`tel:${VERIFIED_CONTACT.restaurantPhones[0]}`}
                className="px-4 h-11 rounded-lg border border-[#E6E2DA] inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#1C1917] hover:bg-[#FAF9F6]"
              >
                <Phone className="w-4 h-4 text-[#9B1C2E]" />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Viewer */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-[#1C1917]/95 flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery Lightbox"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close gallery lightbox"
            className="absolute top-4 right-4 w-11 h-11 rounded-lg bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-4xl w-full flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((lightboxIndex - 1 + galleryItems.length) % galleryItems.length)
              }
              aria-label="Previous image"
              className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 rounded-xl overflow-hidden bg-[#1C1917]">
              <img
                src={galleryItems[lightboxIndex].image}
                alt={galleryItems[lightboxIndex].title}
                className="w-full max-h-[72vh] object-contain mx-auto"
              />
            </div>

            <button
              type="button"
              onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryItems.length)}
              aria-label="Next image"
              className="w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 inline-flex items-center justify-center shrink-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 text-center text-white max-w-xl">
            <p className="text-base font-semibold">{galleryItems[lightboxIndex].title}</p>
            <p className="text-xs text-[#D6D3CD] mt-1">{galleryItems[lightboxIndex].caption}</p>
          </div>
        </div>
      )}
    </div>
  );
}
