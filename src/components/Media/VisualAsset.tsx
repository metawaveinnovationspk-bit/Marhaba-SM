import React, { useState } from 'react';
import type { PackshotStyle } from '../../types/marhaba';

interface StudioImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  priority?: boolean;
}

export function StudioImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  priority = false,
}: StudioImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F3F1EC] text-[#57534E] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-xs font-medium tracking-wide text-[#9B1C2E]">MARHABA</span>
        <span className="mt-1 text-xs font-medium text-[#1C1917] max-w-[16rem] leading-snug">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

interface ProductPackshotProps {
  image?: string;
  name: string;
  brand: string;
  unitLabel: string;
  style: PackshotStyle;
  accent: string;
  className?: string;
  compact?: boolean;
}

function renderPackshotSvg(style: PackshotStyle, accent: string) {
  switch (style) {
    case 'bottle':
    case 'cosmetic':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <rect x="48" y="10" width="24" height="14" rx="4" fill={accent} />
          <path
            d="M46 24 L74 24 L84 44 L84 126 C84 131 80 134 75 134 L45 134 C40 134 36 131 36 126 L36 44 Z"
            fill="#FFFFFF"
            stroke="#D6D3CD"
            strokeWidth="2"
          />
          <rect
            x="42"
            y="54"
            width="36"
            height="48"
            rx="5"
            fill={accent}
            fillOpacity="0.12"
            stroke={accent}
            strokeWidth="1.5"
          />
          <rect x="48" y="65" width="24" height="4.5" rx="2.25" fill={accent} />
          <rect x="48" y="75" width="18" height="3" rx="1.5" fill="#57534E" fillOpacity="0.55" />
          <rect x="48" y="83" width="20" height="3" rx="1.5" fill="#57534E" fillOpacity="0.35" />
        </svg>
      );
    case 'carton':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <polygon points="32,34 60,16 88,34 88,128 32,128" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <line x1="32" y1="34" x2="88" y2="34" stroke="#D6D3CD" strokeWidth="1.5" />
          <rect x="52" y="18" width="16" height="6" rx="2" fill={accent} />
          <rect
            x="38"
            y="48"
            width="44"
            height="56"
            rx="5"
            fill={accent}
            fillOpacity="0.12"
            stroke={accent}
            strokeWidth="1.5"
          />
          <circle cx="60" cy="68" r="10" fill={accent} fillOpacity="0.18" />
          <rect x="45" y="84" width="30" height="4.5" rx="2" fill={accent} />
          <rect x="48" y="93" width="24" height="3" rx="1.5" fill="#57534E" fillOpacity="0.5" />
        </svg>
      );
    case 'box':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <rect x="24" y="34" width="72" height="92" rx="8" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <line x1="24" y1="52" x2="96" y2="52" stroke="#E6E2DA" strokeWidth="2" />
          <rect x="33" y="62" width="54" height="48" rx="6" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" />
          <rect x="42" y="74" width="36" height="5" rx="2.5" fill={accent} />
          <rect x="42" y="84" width="26" height="3" rx="1.5" fill="#57534E" fillOpacity="0.5" />
          <rect x="42" y="92" width="30" height="3" rx="1.5" fill="#57534E" fillOpacity="0.35" />
        </svg>
      );
    case 'jar':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <rect x="38" y="20" width="44" height="14" rx="5" fill="#57534E" />
          <rect x="32" y="34" width="56" height="92" rx="12" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <rect x="38" y="56" width="44" height="46" rx="6" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.5" />
          <rect x="44" y="69" width="32" height="4.5" rx="2" fill={accent} />
          <rect x="48" y="79" width="24" height="3" rx="1.5" fill="#57534E" fillOpacity="0.45" />
        </svg>
      );
    case 'produce':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <rect x="24" y="42" width="72" height="80" rx="12" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <circle cx="52" cy="78" r="18" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.5" />
          <circle cx="71" cy="84" r="14" fill="#166534" fillOpacity="0.16" stroke="#166534" strokeWidth="1.5" />
          <path d="M52 56 C55 48, 66 48, 67 54" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="38" y="106" width="44" height="4" rx="2" fill={accent} />
        </svg>
      );
    case 'bakery':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <path
            d="M22 92 C22 64, 40 50, 60 50 C80 50, 98 64, 98 92 L94 114 C94 118, 90 122, 85 122 L35 122 C30 122, 26 118, 26 114 Z"
            fill="#FFFFFF"
            stroke="#D6D3CD"
            strokeWidth="2"
          />
          <path d="M36 74 Q48 64 56 76" stroke={accent} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M56 72 Q68 62 76 74" stroke={accent} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <rect x="38" y="92" width="44" height="16" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.2" />
        </svg>
      );
    case 'appliance':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <path d="M34 38 L78 38 L84 114 L30 114 Z" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <path d="M78 48 C94 48, 96 92, 82 96" stroke={accent} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <rect x="26" y="114" width="62" height="10" rx="4" fill={accent} />
          <rect x="42" y="56" width="28" height="36" rx="4" fill={accent} fillOpacity="0.12" stroke={accent} strokeWidth="1.5" />
        </svg>
      );
    case 'apparel':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <path
            d="M36 28 L48 22 C54 28, 66 28, 72 22 L84 28 L102 48 L90 62 L82 54 L82 122 L38 122 L38 54 L30 62 L18 48 Z"
            fill="#FFFFFF"
            stroke="#D6D3CD"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <line x1="60" y1="30" x2="60" y2="66" stroke={accent} strokeWidth="2" />
          <rect x="45" y="76" width="30" height="22" rx="4" fill={accent} fillOpacity="0.1" stroke={accent} strokeWidth="1.2" />
        </svg>
      );
    case 'stationery':
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <rect x="32" y="22" width="58" height="98" rx="6" fill="#FFFFFF" stroke="#D6D3CD" strokeWidth="2" />
          <rect x="32" y="22" width="12" height="98" rx="3" fill={accent} fillOpacity="0.18" />
          <rect x="52" y="42" width="28" height="18" rx="3" fill={accent} fillOpacity="0.14" stroke={accent} strokeWidth="1.3" />
          <line x1="52" y1="74" x2="80" y2="74" stroke="#57534E" strokeOpacity="0.4" strokeWidth="2" />
          <line x1="52" y1="84" x2="76" y2="84" stroke="#57534E" strokeOpacity="0.4" strokeWidth="2" />
        </svg>
      );
    case 'pet':
    case 'bag':
    case 'pouch':
    default:
      return (
        <svg viewBox="0 0 120 140" className="w-full h-full drop-shadow-sm" aria-hidden="true">
          <path
            d="M32 22 L88 22 L94 124 C94 129 90 132 85 132 L35 132 C30 132 26 129 26 124 Z"
            fill="#FFFFFF"
            stroke="#D6D3CD"
            strokeWidth="2"
          />
          <line x1="31" y1="32" x2="89" y2="32" stroke="#E6E2DA" strokeWidth="2" />
          <rect
            x="36"
            y="48"
            width="48"
            height="54"
            rx="6"
            fill={accent}
            fillOpacity="0.12"
            stroke={accent}
            strokeWidth="1.5"
          />
          <rect x="44" y="62" width="32" height="5" rx="2.5" fill={accent} />
          <rect x="44" y="73" width="24" height="3" rx="1.5" fill="#57534E" fillOpacity="0.5" />
          <rect x="44" y="82" width="18" height="3" rx="1.5" fill="#57534E" fillOpacity="0.35" />
        </svg>
      );
  }
}

/**
 * Renders verified/generated studio photography when matched, OR a crisp, honest
 * neutral studio packaging illustration when individual SKU packshots are awaiting
 * official Marhaba photography (per Section 20 data accuracy requirements).
 */
export function ProductPackshot({
  image,
  name,
  brand,
  unitLabel,
  style,
  accent,
  className = '',
  compact = false,
}: ProductPackshotProps) {
  const [imgError, setImgError] = useState(false);

  if (image && !imgError) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-[#F3F1EC] ${className}`}>
        <img
          src={image}
          alt={`${brand} ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F7F5F0] to-[#EFECE5] ${
        compact ? 'p-2' : 'px-4 py-4'
      } select-none transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
      aria-label={`${brand} ${name} package illustration`}
    >
      <div
        className={`relative flex flex-col items-center justify-center ${
          compact ? 'w-12 h-14' : 'w-24 h-28'
        }`}
      >
        {renderPackshotSvg(style, accent)}
      </div>
      {!compact && (
        <div className="mt-1 text-center">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#57534E]">{brand}</p>
          <p className="text-[11px] text-[#57534E] tabular-nums">{unitLabel}</p>
        </div>
      )}
    </div>
  );
}

