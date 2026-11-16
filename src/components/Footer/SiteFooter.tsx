import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { VERIFIED_BRANCHES, VERIFIED_CONTACT } from '../../data/marhabaData';
import { useStore } from '../../context/StoreContext';
import { MarhabaLogo } from '../Header/SiteHeader';

export function SiteFooter() {
  const { navigate } = useStore();

  return (
    <footer className="bg-[#1C1917] text-[#E6E2DA] border-t border-[#292524] pb-16 md:pb-0">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-12 lg:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Column 1: Brand Identity */}
        <div className="lg:col-span-4 space-y-4">
          <button
            type="button"
            onClick={() => navigate('home')}
            aria-label="Return to Marhaba Home"
            className="text-left focus-visible:outline-2 rounded-lg"
          >
            <MarhabaLogo variant="dark" />
          </button>
          <p className="text-sm text-[#D6D3CD] leading-relaxed max-w-sm">
            A trusted family destination bringing together everyday supermarket shopping, multi-cuisine
            dining, and indoor children&apos;s entertainment in Hyderabad and Bahria Town Karachi.
          </p>
          <p className="text-xs text-[#D6D3CD]/90">{VERIFIED_CONTACT.workingHours}</p>
        </div>

        {/* Column 2: Explore Marhaba */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Destinations</h2>
          <ul className="space-y-2 text-sm text-[#D6D3CD]">
            <li>
              <button
                type="button"
                onClick={() => navigate('shop', { resetShopFilter: true })}
                className="hover:text-white transition-colors"
              >
                Supermarket Shop
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('restaurant')}
                className="hover:text-white transition-colors"
              >
                Marhaba Restaurant
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('playland')}
                className="hover:text-white transition-colors"
              >
                Indoor Play Land
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('offers')}
                className="hover:text-white transition-colors"
              >
                Offers &amp; Value
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Customer Help */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Company &amp; Help</h2>
          <ul className="space-y-2 text-sm text-[#D6D3CD]">
            <li>
              <button
                type="button"
                onClick={() => navigate('locations')}
                className="hover:text-white transition-colors"
              >
                Branches &amp; Store Hours
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('playland', { playLandSection: 'parents-guide' })}
                className="hover:text-white transition-colors"
              >
                Play Land Parents&apos; Guide
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('restaurant', { restaurantSection: 'reservations' })}
                className="hover:text-white transition-colors"
              >
                Table Reservations
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('about')}
                className="hover:text-white transition-colors"
              >
                About &amp; Data Transparency
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('contact')}
                className="hover:text-white transition-colors"
              >
                Contact Support
              </button>
            </li>
          </ul>
        </div>

        {/* Column 4: Verified Branches & Contact */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Verified Contact
          </h2>
          <div className="space-y-2.5 text-xs text-[#D6D3CD]">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#9B1C2E] shrink-0 mt-0.5" />
              <span>{VERIFIED_BRANCHES[0].address}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#9B1C2E] shrink-0" />
              <span>
                {VERIFIED_CONTACT.supportPhone} · {VERIFIED_CONTACT.mobileSupport}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#9B1C2E] shrink-0" />
              <span>{VERIFIED_CONTACT.generalEmail}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#292524]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#A8A29E]">
          <p>© {new Date().getFullYear()} Marhaba Super Market. All rights reserved.</p>
          <p>Digital Experience Concept · Engineered by MetaWave Innovations LTD</p>
        </div>
      </div>
    </footer>
  );
}
