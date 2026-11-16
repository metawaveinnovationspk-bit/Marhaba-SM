import React from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ABOUT_MILESTONES,
  ABOUT_TRUST_CREEDS,
  ASSETS,
  BOARD_OF_DIRECTORS,
  BUSINESS_ECOSYSTEM_PILLARS,
  CORPORATE_WORKFORCE,
  VERIFIED_BRANCHES,
} from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import { StudioImage } from '../Media/VisualAsset';

export function AboutPage() {
  const { navigate } = useStore();

  const leadDirector = BOARD_OF_DIRECTORS.find((d) => d.isLead) || BOARD_OF_DIRECTORS[0];
  const boardDirectors = BOARD_OF_DIRECTORS.filter((d) => d.id !== leadDirector.id);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1C1917]">
      {/* CORPORATE EDITORIAL HERO */}
      <section className="bg-[#FFFFFF] border-b border-[#E6E2DA]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9B1C2E]">
                About Marhaba · Est. 1998 Family Retail Legacy
              </p>
              <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1C1917] leading-[1.12]">
                Decades of Family Enterprise, Built on Everyday Trust
              </h1>
              <p className="mt-4 text-base text-[#57534E] leading-relaxed max-w-xl">
                From founding National Supermarket in Jeddah in 1998 and building international
                hospitality experience in the United Kingdom, to establishing Marhaba Supermarket in
                Bahria Town Karachi and expanding to Qasim Chowk, Hyderabad, Marhaba unites retail
                reliability, multi-cuisine dining, and family leisure under trusted leadership.
              </p>
            </div>

            {/* Quiet Section Quick-Navigation */}
            <nav
              aria-label="About Marhaba Sections"
              className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-[#E6E2DA]"
            >
              {[
                { id: 'about-story', label: 'Our Story' },
                { id: 'about-values', label: 'Three Creeds of Trust' },
                { id: 'about-leadership', label: 'Board of Directors' },
                { id: 'about-ecosystem', label: 'People & Ecosystem' },
                { id: 'about-locations', label: 'Verified Locations' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="py-1.5 text-xs font-semibold text-[#57534E] hover:text-[#9B1C2E] transition-colors whitespace-nowrap shrink-0"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[260px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-[#F3F1EC]">
              <StudioImage
                src={ASSETS.heroDestination}
                alt="Marhaba Supermarket modern family retail and dining destination atrium"
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Full-Width Heritage Summary Strip */}
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E6E2DA] rounded-2xl bg-[#FAF9F6] divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DA]">
            <div className="p-5 sm:p-6">
              <p className="font-serif text-2xl font-bold text-[#9B1C2E] tabular-nums">1998</p>
              <p className="mt-1 text-sm font-semibold text-[#1C1917]">Jeddah Origins</p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                National Supermarket founded by Riaz Ahmed Memon
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-serif text-2xl font-bold text-[#9B1C2E] tabular-nums">2015</p>
              <p className="mt-1 text-sm font-semibold text-[#1C1917]">United Kingdom</p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                International venture exposure &amp; Memon Travels &amp; Tourism
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-serif text-2xl font-bold text-[#9B1C2E] tabular-nums">2018</p>
              <p className="mt-1 text-sm font-semibold text-[#1C1917]">Bahria Town Karachi</p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                Marhaba launched via R &amp; B Associates partnership
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-serif text-2xl font-bold text-[#9B1C2E] tabular-nums">2021</p>
              <p className="mt-1 text-sm font-semibold text-[#1C1917]">Hyderabad Flagship</p>
              <p className="mt-0.5 text-xs text-[#57534E]">
                Qasim Chowk Supermarket, Rooftop Dining &amp; Play Land
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. OUR STORY — BUSINESS EVOLUTION TIMELINE */}
      <section
        id="about-story"
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-[168px] space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                Section 01 · Heritage
              </p>
              <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917] leading-tight">
                Our Story — Business Evolution
              </h2>
              <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                Across more than two decades of cross-border commerce, Marhaba&apos;s leadership has
                grown from an independent supermarket in Jeddah into a trusted family retail, dining,
                and entertainment institution across Sindh.
              </p>
            </div>

            <div className="pt-4 border-t border-[#E6E2DA] space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                Timeline Milestones
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                {ABOUT_MILESTONES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => scrollToSection(m.id)}
                    className="text-left px-3 py-2 rounded-xl border border-[#E6E2DA] bg-[#FFFFFF] hover:border-[#9B1C2E] transition-colors"
                  >
                    <span className="block font-serif text-sm font-bold text-[#9B1C2E] tabular-nums">
                      {m.year}
                    </span>
                    <span className="block text-[11px] text-[#57534E] truncate">{m.location}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5">
            {ABOUT_MILESTONES.map((milestone, idx) => (
              <article
                key={milestone.id}
                id={milestone.id}
                className="scroll-mt-48 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-[#E6E2DA]">
                  <div className="flex items-baseline gap-4">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#9B1C2E] tabular-nums">
                      {milestone.year}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#57534E]">
                      {milestone.location}
                    </span>
                  </div>
                  <span className="text-xs text-[#57534E] tabular-nums">
                    Chapter {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-xl sm:text-2xl font-bold text-[#1C1917]">
                  {milestone.headline}
                </h3>
                <p className="mt-2.5 text-sm sm:text-[15px] text-[#57534E] leading-relaxed">
                  {milestone.summary}
                </p>

                <ul className="mt-4 pt-4 border-t border-[#E6E2DA]/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#57534E]">
                  {milestone.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#166534] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 2. OUR VALUES — THREE CREEDS OF TRUST */}
      <section
        id="about-values"
        className="scroll-mt-48 bg-[#F3F1EC] border-y border-[#E6E2DA]"
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Section 02 · Guiding Philosophy
            </p>
            <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">
              Our Values — Three Creeds of Trust
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
              Every aisle, kitchen table, and management partnership at Marhaba is anchored by
              three enduring commitments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ABOUT_TRUST_CREEDS.map((creed) => (
              <article
                key={creed.id}
                className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E6E2DA]">
                    <span className="font-serif text-2xl font-bold text-[#9B1C2E] tabular-nums">
                      {creed.index}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#57534E]">
                      Creed of Trust
                    </span>
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-[#1C1917]">
                    {creed.title}
                  </h3>
                  <p className="mt-2.5 text-sm font-semibold text-[#9B1C2E] leading-relaxed">
                    &ldquo;{creed.creedStatement}&rdquo;
                  </p>
                  <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                    {creed.elaboration}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. OUR LEADERSHIP — BOARD OF DIRECTORS */}
      <section
        id="about-leadership"
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-20 border-b border-[#E6E2DA]"
      >
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
            Section 03 · Governance
          </p>
          <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">
            Our Leadership — Board of Directors
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-[#57534E] leading-relaxed">
            Guided by hands-on family stewardship combining retail heritage, financial accountability,
            merchandising depth, and systems discipline.
          </p>
        </div>

        {/* Row 1: CEO Executive Feature + Portrait Authenticity Note */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
          <article className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
            <div
              className="w-20 h-20 rounded-2xl bg-[#F3F1EC] border border-[#E6E2DA] flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="font-serif text-2xl font-bold text-[#9B1C2E] tracking-wide">
                {leadDirector.initials}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                {leadDirector.role}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
                {leadDirector.name}
              </h3>
              <p className="text-sm text-[#57534E] leading-relaxed max-w-xl">
                {leadDirector.stewardshipNote}
              </p>
            </div>
          </article>

          <aside className="lg:col-span-5 bg-[#FAF9F6] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#166534]">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Executive Stewardship &amp; Portrait Integrity</span>
              </div>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Together, Marhaba&apos;s five Directors align group purchasing, branch administration,
                financial governance, and management information systems across Hyderabad and Bahria
                Town Karachi.
              </p>
            </div>
            <p className="mt-4 pt-4 border-t border-[#E6E2DA] text-xs text-[#57534E]">
              Monogram emblems are displayed in place of imagery until verified official portraits of
              the Directors are supplied.
            </p>
          </aside>
        </div>

        {/* Row 2: Four Functional Directors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {boardDirectors.map((director) => (
            <article
              key={director.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div
                  className="w-14 h-14 rounded-xl bg-[#F3F1EC] border border-[#E6E2DA] flex items-center justify-center mb-5"
                  aria-hidden="true"
                >
                  <span className="font-serif text-lg font-bold text-[#9B1C2E]">
                    {director.initials}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                  {director.role}
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold text-[#1C1917]">
                  {director.name}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-[#57534E] leading-relaxed">
                  {director.stewardshipNote}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. OUR PEOPLE & BUSINESS ECOSYSTEM */}
      <section
        id="about-ecosystem"
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-20 border-b border-[#E6E2DA] space-y-10"
      >
        {/* Reported Workforce Band */}
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-2 lg:border-r lg:border-[#E6E2DA] lg:pr-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Section 04 · Our People</span>
            </div>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-serif text-5xl sm:text-6xl font-bold text-[#1C1917] tabular-nums">
                {CORPORATE_WORKFORCE.reportedHeadcount}
              </span>
              <span className="text-sm font-semibold text-[#57534E]">Workforce Members</span>
            </div>
            <p className="text-xs font-semibold text-[#B45309]">
              {CORPORATE_WORKFORCE.statusLabel}
            </p>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
              People &amp; Integrated Business Ecosystem
            </h2>
            <p className="text-sm text-[#57534E] leading-relaxed">
              {CORPORATE_WORKFORCE.summary}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-[#1C1917] font-medium">
              {CORPORATE_WORKFORCE.divisions.map((division) => (
                <div key={division} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#166534] shrink-0" aria-hidden="true" />
                  <span>{division}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Three Business Experiences */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {BUSINESS_ECOSYSTEM_PILLARS.map((pillar) => (
            <article
              key={pillar.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md"
            >
              <div>
                <div className="aspect-[16/10] bg-[#F3F1EC] overflow-hidden">
                  <StudioImage
                    src={pillar.image}
                    alt={pillar.imageAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
                    {pillar.subtitle}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-[#1C1917]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-[#57534E] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  type="button"
                  onClick={() =>
                    pillar.targetRoute === 'shop'
                      ? navigate('shop', { resetShopFilter: true })
                      : navigate(pillar.targetRoute)
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9B1C2E] hover:underline"
                >
                  <span>{pillar.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. LOCATIONS, DATA CLARITY & CLOSING EXPERIENCE */}
      <section
        id="about-locations"
        className="scroll-mt-48 max-w-[1440px] mx-auto px-4 lg:px-8 py-14 lg:py-20 space-y-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Section 05 · Verified Footprint
            </p>
            <h2 className="mt-1.5 font-serif text-3xl sm:text-4xl font-bold text-[#1C1917]">
              Karachi &amp; Hyderabad Locations
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('locations')}
            className="text-sm font-semibold text-[#9B1C2E] hover:underline whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            View Full Branch Directory &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VERIFIED_BRANCHES.map((branch) => (
            <div
              key={branch.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                  <span className="font-semibold uppercase tracking-wider text-[#166534]">
                    {branch.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{branch.isFlagship ? 'Flagship Complex' : 'Branch'}</span>
                  </span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-bold text-[#1C1917]">
                  {branch.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#57534E] leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#9B1C2E] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{branch.address}</span>
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E6E2DA] space-y-1.5 text-xs text-[#57534E]">
                <p className="font-semibold text-[#1C1917]">{branch.facilities.join(' · ')}</p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#166534] shrink-0" aria-hidden="true" />
                  <span>{branch.hours}</span>
                </p>
                <p className="flex items-center gap-1.5 font-medium text-[#9B1C2E]">
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{branch.phones.join(' · ')}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Corporate Record & Data Transparency */}
        <div className="bg-[#F3F1EC] border border-[#E6E2DA] rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row gap-5 items-start">
          <ShieldCheck className="w-6 h-6 text-[#166534] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1.5 text-xs sm:text-sm text-[#57534E] leading-relaxed">
            <h3 className="font-semibold text-[#1C1917]">
              Corporate Record &amp; Platform Transparency
            </h3>
            <p>
              Verified branch addresses, daily operating hours (10:00 AM – 10:00 PM), contact numbers,
              and core published supermarket PKR rates reflect current business records. Historical
              evolution milestones (1998–2021), Board roles, and the 145-member workforce figure
              reflect published company information, with headcount subject to confirmation. Extended
              catalogues, sample menu pricing, and online cart/booking workflows remain clearly labeled
              demonstration experiences.
            </p>
          </div>
        </div>

        {/* Closing Destination CTAs */}
        <div className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B1C2E]">
              Experience Marhaba Today
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold text-[#1C1917]">
              Welcome to Shopping, Dining &amp; Family Joy Under One Roof
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('shop', { resetShopFilter: true })}
              className="px-5 py-3 rounded-xl bg-[#9B1C2E] text-white text-sm font-semibold hover:bg-[#7F1524] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>Explore Supermarket</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('restaurant')}
              className="px-5 py-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#9B1C2E] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <UtensilsCrossed className="w-4 h-4 text-[#9B1C2E]" aria-hidden="true" />
              <span>Discover Restaurant</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('playland')}
              className="px-5 py-3 rounded-xl border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#166534] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[#166534]" aria-hidden="true" />
              <span>Visit Play Land</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
