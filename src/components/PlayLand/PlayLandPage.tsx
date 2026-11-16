import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  AGE_GROUPS,
  ASSETS,
  PARENTS_GUIDE_SECTIONS,
  PLAYLAND_ATTRACTIONS,
  PLAYLAND_PACKAGES,
  VERIFIED_CONTACT,
} from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import type {
  AgeSuitabilityGroup,
  PlayAttraction,
  PlayLandInquiryData,
  PlayLandInquirySubmission,
  PlayLandSection,
} from '../../types/marhaba';
import { formatPKR, validatePlayLandInquiry } from '../../utils/commerce';
import { StudioImage } from '../Media/VisualAsset';

export function PlayLandPage() {
  const { playLandSection, navigate, submitPlayLandInquiry } = useStore();

  const [selectedAgeFilter, setSelectedAgeFilter] = useState<AgeSuitabilityGroup | 'All'>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedAttraction, setSelectedAttraction] = useState<PlayAttraction | null>(null);
  const [openGuideId, setOpenGuideId] = useState<string>(PARENTS_GUIDE_SECTIONS[0].id);

  const [inquiryForm, setInquiryForm] = useState<PlayLandInquiryData>({
    inquiryType: 'General Visit',
    branchId: 'hyderabad',
    childrenCount: 2,
    ageGroups: ['Young Adventurers (4–7 yrs)'],
    adultsCount: 2,
    preferredDate: '',
    packageId: PLAYLAND_PACKAGES[0].id,
    parentName: '',
    contactPhone: '',
    specialRequirements: '',
  });
  const [inquiryErrors, setInquiryErrors] = useState<Record<string, string>>({});
  const [submittedInquiry, setSubmittedInquiry] = useState<PlayLandInquirySubmission | null>(null);

  const sectionRefs = useRef<Record<PlayLandSection, HTMLElement | null>>({
    overview: null,
    attractions: null,
    ages: null,
    packages: null,
    birthdays: null,
    'parents-guide': null,
    'plan-visit': null,
  });

  useEffect(() => {
    if (playLandSection && playLandSection !== 'overview') {
      sectionRefs.current[playLandSection]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [playLandSection]);

  useEffect(() => {
    if (!selectedAttraction) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAttraction(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedAttraction]);

  const jumpTo = (sec: PlayLandSection) => {
    navigate('playland', { playLandSection: sec, scrollTop: false });
    sectionRefs.current[sec]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredAttractions = useMemo(() => {
    return PLAYLAND_ATTRACTIONS.filter((a) => {
      if (selectedAgeFilter !== 'All' && a.ageGroup !== selectedAgeFilter) return false;
      if (selectedCategoryFilter !== 'All' && a.category !== selectedCategoryFilter) return false;
      return true;
    });
  }, [selectedAgeFilter, selectedCategoryFilter]);

  const toggleAgeGroupInForm = (group: AgeSuitabilityGroup) => {
    setInquiryForm((prev) => {
      const exists = prev.ageGroups.includes(group);
      return {
        ...prev,
        ageGroups: exists
          ? prev.ageGroups.filter((g) => g !== group)
          : [...prev.ageGroups, group],
      };
    });
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePlayLandInquiry(inquiryForm);
    setInquiryErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const res = submitPlayLandInquiry(inquiryForm);
    setSubmittedInquiry(res);
  };

  return (
    <div className="bg-[#FAF9F6]">
      {/* Play Land Sub-Navigation */}
      <div className="bg-[#FFFFFF] border-b border-[#E6E2DA] lg:sticky lg:top-[149px] z-20">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-12 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            {(
              [
                ['overview', 'Overview'],
                ['ages', 'Explore by Age'],
                ['attractions', 'Rides & Attractions'],
                ['parents-guide', "Parents' Guide"],
                ['packages', 'Tickets & Packages'],
                ['birthdays', 'Birthdays'],
                ['plan-visit', 'Plan Your Visit'],
              ] as [PlayLandSection, string][]
            ).map(([sec, label]) => (
              <button
                key={sec}
                type="button"
                onClick={() => jumpTo(sec)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  playLandSection === sec
                    ? 'bg-[#166534] text-white'
                    : 'text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-[#57534E] whitespace-nowrap">
            Hyderabad Flagship · Daily 10 AM – 10 PM
          </span>
        </div>
      </div>

      {/* SECTION 1: Hero */}
      <section
        ref={(el) => {
          sectionRefs.current.overview = el;
        }}
        className="bg-[#FFFFFF] border-b border-[#E6E2DA]"
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#166534]">
              Marhaba Indoor Family Play Land
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] leading-[1.12]">
              Big Smiles. Wonderful Adventures.
            </h1>
            <p className="text-base text-[#57534E] leading-relaxed max-w-xl">
              An inviting indoor play center inside Marhaba Super Market Hyderabad—combining soft
              toddler zones, climbing frames, rides, and comfortable parent seating steps away from
              family dining.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={() => jumpTo('attractions')}
                className="px-5 py-3 rounded-lg bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D] transition-colors"
              >
                Explore Attractions
              </button>
              <button
                type="button"
                onClick={() => jumpTo('packages')}
                className="px-5 py-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm font-semibold text-[#1C1917] hover:border-[#166534]"
              >
                View Packages
              </button>
              <button
                type="button"
                onClick={() => jumpTo('plan-visit')}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-[#9B1C2E] hover:underline"
              >
                Plan Your Visit &rarr;
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-[#E6E2DA] shadow-sm">
              <StudioImage
                src={ASSETS.playlandZone}
                alt="Children enjoying indoor wooden climbing frames and slides at Marhaba Play Land"
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 & 3: Activities for Different Ages */}
      <section
        ref={(el) => {
          sectionRefs.current.ages = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Explore by Age
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Designed for Every Stage of Childhood
            </h2>
          </div>
          <p className="text-xs text-[#57534E]">
            Proposed discovery grouping — confirm exact height/age rules at the Play Land reception.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {AGE_GROUPS.map((group) => {
            const count = PLAYLAND_ATTRACTIONS.filter((a) => a.ageGroup === group).length;
            const active = selectedAgeFilter === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => {
                  setSelectedAgeFilter(group);
                  jumpTo('attractions');
                }}
                className={`text-left p-5 rounded-xl bg-[#FFFFFF] border transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  active ? 'border-[#166534] ring-1 ring-[#166534]' : 'border-[#E6E2DA]'
                }`}
              >
                <p className="text-xs font-semibold text-[#166534] tabular-nums">
                  {count} Zone{count !== 1 ? 's' : ''}
                </p>
                <h3 className="mt-1.5 text-lg font-bold text-[#1C1917]">{group}</h3>
                <p className="mt-2 text-xs text-[#57534E]">
                  Filter rides, soft play, and supervision details tailored to this group &rarr;
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: Rides & Attractions Directory */}
      <section
        ref={(el) => {
          sectionRefs.current.attractions = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Rides &amp; Attractions Directory
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Explore Play Zones &amp; Guidelines
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter attractions by age group"
              value={selectedAgeFilter}
              onChange={(e) => setSelectedAgeFilter(e.target.value as AgeSuitabilityGroup | 'All')}
              className="h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917]"
            >
              <option value="All">All Age Groups</option>
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter attractions by activity type"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#E6E2DA] bg-[#FFFFFF] text-xs font-semibold text-[#1C1917]"
            >
              <option value="All">All Activity Types</option>
              <option value="Soft Play">Soft Play</option>
              <option value="Climbing & Slides">Climbing &amp; Slides</option>
              <option value="Rides">Rides</option>
              <option value="Arcade & Interactive">Arcade &amp; Interactive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttractions.map((attr) => (
            <article
              key={attr.id}
              className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="aspect-[16/10] bg-[#F3F1EC] overflow-hidden">
                  <StudioImage
                    src={attr.image}
                    alt={attr.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#57534E]">
                    <span className="font-semibold text-[#166534]">{attr.category}</span>
                    <span>{attr.ageRangeLabel}</span>
                  </div>
                  <h3 className="mt-1.5 text-lg font-bold text-[#1C1917]">{attr.name}</h3>
                  <p className="mt-2 text-sm text-[#57534E] leading-relaxed">{attr.description}</p>

                  <dl className="mt-4 pt-3 border-t border-[#E6E2DA] space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#57534E]">Height Rule</dt>
                      <dd className="font-medium text-[#1C1917] text-right">{attr.heightRequirement}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-[#57534E]">Duration</dt>
                      <dd className="font-medium text-[#1C1917] text-right">{attr.sessionDuration}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setSelectedAttraction(attr)}
                  className="w-full h-10 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-xs font-semibold text-[#1C1917] hover:border-[#166534] hover:text-[#166534] transition-colors"
                >
                  View Supervision &amp; Safety Details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 5: Parent Comfort — Dedicated Parents' Guide */}
      <section
        ref={(el) => {
          sectionRefs.current['parents-guide'] = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Parent Comfort &amp; Clarity
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              The Parents&apos; Guide
            </h2>
            <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
              Clear answers before you arrive—covering supervision expectations, footwear hygiene,
              visiting hours, and easy access to Marhaba Restaurant. We clearly distinguish verified
              branch facts from proposed operational guidelines awaiting final management sign-off.
            </p>
            <div className="mt-5 p-4 rounded-xl bg-[#FFFFFF] border border-[#E6E2DA] text-xs text-[#57534E] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
              <span>
                Need specific accessibility or group accommodation details? Call our Hyderabad desk at{' '}
                <strong className="text-[#1C1917]">{VERIFIED_CONTACT.supportPhone}</strong>.
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-2.5">
            {PARENTS_GUIDE_SECTIONS.map((sec) => {
              const isOpen = openGuideId === sec.id;
              return (
                <div
                  key={sec.id}
                  className="bg-[#FFFFFF] border border-[#E6E2DA] rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGuideId(isOpen ? '' : sec.id)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-[#1C1917]">{sec.title}</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          sec.status === 'Verified' ? 'text-[#166534]' : 'text-[#B45309]'
                        }`}
                      >
                        · {sec.status}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#57534E] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm text-[#57534E] leading-relaxed border-t border-[#E6E2DA]/60 pt-3">
                      {sec.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 & 7: Tickets, Packages & Birthdays */}
      <section
        ref={(el) => {
          sectionRefs.current.packages = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 border-b border-[#E6E2DA] scroll-mt-48"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Passes &amp; Celebrations
            </p>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1C1917]">
              Tickets, Packages &amp; Birthdays
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F3F1EC] text-xs text-[#57534E]">
            <Info className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
            <span>
              Proposed package structure &amp; sample PKR rates shown for visit planning inquiry only.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PLAYLAND_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              ref={
                pkg.isBirthday
                  ? (el) => {
                      sectionRefs.current.birthdays = el;
                    }
                  : undefined
              }
              className={`bg-[#FFFFFF] border rounded-2xl p-6 flex flex-col justify-between ${
                pkg.isBirthday ? 'border-[#9B1C2E]/40' : 'border-[#E6E2DA]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#166534]">{pkg.duration}</span>
                  {pkg.isBirthday && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#9B1C2E]">
                      <PartyPopper className="w-3.5 h-3.5" />
                      <span>Birthday Special</span>
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-serif text-xl font-bold text-[#1C1917]">{pkg.name}</h3>
                <p className="mt-1 text-xs text-[#57534E]">{pkg.participants}</p>

                <div className="mt-4 pb-4 border-b border-[#E6E2DA]">
                  <span className="text-2xl font-bold text-[#1C1917] tabular-nums">
                    {formatPKR(pkg.price)}
                  </span>
                  <span className="ml-2 text-xs text-[#57534E]">Indicative Demo Rate</span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-semibold text-[#1C1917]">Includes:</p>
                  <ul className="space-y-1.5 text-[#57534E]">
                    {pkg.includedAttractions.map((inc) => (
                      <li key={inc} className="flex items-start gap-2">
                        <span className="text-[#166534] font-bold">✓</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="pt-2 text-[11px] text-[#57534E]">
                    Exclusions: {pkg.exclusions.join(', ')}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setInquiryForm((prev) => ({
                      ...prev,
                      packageId: pkg.id,
                      inquiryType: pkg.isBirthday ? 'Birthday Celebration' : 'General Visit',
                    }));
                    jumpTo('plan-visit');
                  }}
                  className={`w-full h-11 rounded-lg text-sm font-semibold transition-colors ${
                    pkg.isBirthday
                      ? 'bg-[#9B1C2E] text-white hover:bg-[#7F1524]'
                      : 'bg-[#166534] text-white hover:bg-[#14532D]'
                  }`}
                >
                  Select in Visit Planner
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: Interactive Visit Planner & Inquiry Form */}
      <section
        ref={(el) => {
          sectionRefs.current['plan-visit'] = el;
        }}
        className="max-w-[1440px] mx-auto px-4 lg:px-8 py-14 scroll-mt-48"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Family Visit &amp; Event Planner
            </p>
            <h2 className="font-serif text-3xl font-bold text-[#1C1917]">
              Plan Your Visit or Birthday Inquiry
            </h2>
            <p className="text-sm text-[#57534E] leading-relaxed">
              Tell us how many children are visiting, their age groups, and whether you are planning
              a regular outing, birthday celebration, or school group visit. Our Hyderabad team will
              confirm counter availability and package details.
            </p>
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E6E2DA] space-y-2 text-xs text-[#57534E]">
              <p className="font-semibold text-[#1C1917]">Combine with Family Dining</p>
              <p>
                Planning lunch or dinner at Marhaba Restaurant after Play Land? Mention your preferred
                dining time in Special Requirements or submit a table request separately.
              </p>
              <button
                type="button"
                onClick={() => navigate('restaurant', { restaurantSection: 'reservations' })}
                className="font-semibold text-[#9B1C2E] hover:underline"
              >
                Also Reserve a Restaurant Table &rarr;
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            {submittedInquiry ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#166534] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
                      {submittedInquiry.status}
                    </p>
                    <h3 className="font-serif text-2xl font-bold text-[#1C1917] mt-1">
                      Inquiry Reference: {submittedInquiry.referenceId}
                    </h3>
                    <p className="mt-1.5 text-sm text-[#57534E]">
                      Thank you, {submittedInquiry.data.parentName}. We recorded your{' '}
                      <strong className="text-[#1C1917]">{submittedInquiry.data.inquiryType}</strong>{' '}
                      plan for {submittedInquiry.data.childrenCount} child(ren) on{' '}
                      {submittedInquiry.data.preferredDate}. Please confirm final counter rates with
                      our Play Land desk upon callback.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedInquiry(null)}
                  className="px-5 py-2.5 rounded-lg border border-[#E6E2DA] text-sm font-semibold text-[#1C1917]"
                >
                  Plan Another Visit
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(
                    ['General Visit', 'Birthday Celebration', 'School / Group Visit'] as const
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setInquiryForm((f) => ({ ...f, inquiryType: t }))}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-semibold ${
                        inquiryForm.inquiryType === t
                          ? 'border-[#166534] bg-[#166534]/10 text-[#166534]'
                          : 'border-[#E6E2DA] text-[#57534E]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="pl-children" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Children *
                    </label>
                    <input
                      id="pl-children"
                      type="number"
                      min={1}
                      max={60}
                      value={inquiryForm.childrenCount}
                      onChange={(e) =>
                        setInquiryForm((f) => ({ ...f, childrenCount: Number(e.target.value) || 0 }))
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm tabular-nums"
                    />
                    {inquiryErrors.childrenCount && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.childrenCount}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pl-adults" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Adults *
                    </label>
                    <input
                      id="pl-adults"
                      type="number"
                      min={1}
                      max={40}
                      value={inquiryForm.adultsCount}
                      onChange={(e) =>
                        setInquiryForm((f) => ({ ...f, adultsCount: Number(e.target.value) || 0 }))
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm tabular-nums"
                    />
                    {inquiryErrors.adultsCount && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.adultsCount}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pl-date" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      Preferred Date *
                    </label>
                    <input
                      id="pl-date"
                      type="date"
                      value={inquiryForm.preferredDate}
                      onChange={(e) =>
                        setInquiryForm((f) => ({ ...f, preferredDate: e.target.value }))
                      }
                      className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {inquiryErrors.preferredDate && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.preferredDate}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                    Children&apos;s Age Groups *
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {AGE_GROUPS.map((group) => {
                      const active = inquiryForm.ageGroups.includes(group);
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => toggleAgeGroupInForm(group)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                            active
                              ? 'border-[#166534] bg-[#166534] text-white'
                              : 'border-[#E6E2DA] bg-[#FAF9F6] text-[#1C1917]'
                          }`}
                        >
                          {group}
                        </button>
                      );
                    })}
                  </div>
                  {inquiryErrors.ageGroups && (
                    <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.ageGroups}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="pl-package" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Preferred Package (Indicative)
                  </label>
                  <select
                    id="pl-package"
                    value={inquiryForm.packageId}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, packageId: e.target.value }))}
                    className="w-full h-11 px-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  >
                    {PLAYLAND_PACKAGES.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({formatPKR(pkg.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pl-parent" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Parent / Guardian Name *
                    </label>
                    <input
                      id="pl-parent"
                      type="text"
                      value={inquiryForm.parentName}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, parentName: e.target.value }))}
                      placeholder="Full name"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {inquiryErrors.parentName && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.parentName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pl-phone" className="block text-xs font-semibold text-[#1C1917] mb-1">
                      Contact Number *
                    </label>
                    <input
                      id="pl-phone"
                      type="tel"
                      value={inquiryForm.contactPhone}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, contactPhone: e.target.value }))}
                      placeholder="03XX-XXXXXXX"
                      className="w-full h-11 px-3.5 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                    />
                    {inquiryErrors.contactPhone && (
                      <p className="mt-1 text-xs text-[#9B1C2E]">{inquiryErrors.contactPhone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="pl-notes" className="block text-xs font-semibold text-[#1C1917] mb-1">
                    Special Requirements (Cake coordination, accessibility, meal timing)
                  </label>
                  <textarea
                    id="pl-notes"
                    rows={2}
                    value={inquiryForm.specialRequirements}
                    onChange={(e) =>
                      setInquiryForm((f) => ({ ...f, specialRequirements: e.target.value }))
                    }
                    className="w-full p-3 rounded-lg border border-[#E6E2DA] bg-[#FAF9F6] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 h-12 rounded-lg bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D] transition-colors"
                >
                  Submit Visit Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Attraction Details Modal */}
      {selectedAttraction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C1917]/60 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={selectedAttraction.name}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAttraction(null);
          }}
        >
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E6E2DA] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#166534]">
                  {selectedAttraction.category} · {selectedAttraction.ageRangeLabel}
                </p>
                <h3 className="font-serif text-2xl font-bold text-[#1C1917] mt-1">
                  {selectedAttraction.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttraction(null)}
                aria-label="Close attraction details"
                className="p-1.5 rounded-lg text-[#57534E] hover:bg-[#F3F1EC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#57534E] leading-relaxed">
              {selectedAttraction.description}
            </p>

            <dl className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[#1C1917]">Height Guideline</dt>
                <dd className="text-[#57534E] text-right">{selectedAttraction.heightRequirement}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[#1C1917]">Supervision</dt>
                <dd className="text-[#57534E] text-right">{selectedAttraction.supervisionRule}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[#1C1917]">Session Duration</dt>
                <dd className="text-[#57534E] text-right">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {selectedAttraction.sessionDuration}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[#1C1917]">Availability</dt>
                <dd className="text-[#166534] font-semibold text-right">
                  {selectedAttraction.availability}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-semibold text-[#1C1917] mb-1.5">Safety Guidelines</p>
              <ul className="space-y-1 text-xs text-[#57534E]">
                {selectedAttraction.safetyGuidelines.map((rule) => (
                  <li key={rule}>· {rule}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedAttraction(null);
                jumpTo('plan-visit');
              }}
              className="w-full h-11 rounded-lg bg-[#166534] text-white text-sm font-semibold hover:bg-[#14532D]"
            >
              Include in Visit Planner
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
