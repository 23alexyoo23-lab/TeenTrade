/**
 * Hero illustration for the home banner (8.1). Inline SVG so it scales
 * crisply, needs no network request, and stays on-brand with section 6.1.
 */
export function HeroArt() {
  return (
    <svg viewBox="0 0 520 340" width="100%" height="100%" role="img" aria-label="Two teenagers swapping items" focusable="false">
      <defs>
        <linearGradient id="tt-hero-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFDF6" />
        </linearGradient>
      </defs>

      {/* Soft background shapes */}
      <circle cx="150" cy="150" r="118" fill="#FFC629" opacity="0.22" />
      <circle cx="360" cy="185" r="96" fill="#6366F1" opacity="0.14" />

      {/* Left card: a hoodie for sale */}
      <g transform="translate(52 66)">
        <rect width="168" height="196" rx="16" fill="url(#tt-hero-card)" stroke="#F0E3C0" />
        <rect x="14" y="14" width="140" height="112" rx="10" fill="#EFF3FF" />
        <g transform="translate(84 70) scale(3.4) translate(-12 -12)">
          <path
            d="M7 4 L9 3 C9 4.5 10.3 5.5 12 5.5 C13.7 5.5 15 4.5 15 3 L17 4 L21 7 L19 10 L17.5 9 L17.5 20 L6.5 20 L6.5 9 L5 10 L3 7 Z"
            fill="none" stroke="#1D4ED8" strokeWidth="1.3" strokeLinejoin="round"
          />
        </g>
        <rect x="14" y="138" width="86" height="10" rx="5" fill="#E5E7EB" />
        <rect x="14" y="156" width="44" height="14" rx="7" fill="#1A1D2E" />
        <rect x="108" y="154" width="46" height="18" rx="6" fill="#EFF3FF" />
        <text x="131" y="167" textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563EB" fontFamily="Inter, sans-serif">Buy</text>
      </g>

      {/* Right card: a controller open to trades */}
      <g transform="translate(300 96)">
        <rect width="168" height="196" rx="16" fill="url(#tt-hero-card)" stroke="#E4E2FA" />
        <rect x="14" y="14" width="140" height="112" rx="10" fill="#EEF0FF" />
        <g transform="translate(84 70) scale(3.4) translate(-12 -12)">
          <path
            d="M6 8 L18 8 A5 5 0 0 1 22.5 15 L21 19 A2.5 2.5 0 0 1 16.8 19.4 L15 17 L9 17 L7.2 19.4 A2.5 2.5 0 0 1 3 19 L1.5 15 A5 5 0 0 1 6 8 Z"
            fill="none" stroke="#6366F1" strokeWidth="1.3" strokeLinejoin="round"
          />
        </g>
        <rect x="14" y="138" width="96" height="10" rx="5" fill="#E5E7EB" />
        <rect x="14" y="156" width="40" height="14" rx="7" fill="#1A1D2E" />
        <rect x="102" y="154" width="52" height="18" rx="6" fill="#EEF0FF" />
        <text x="128" y="167" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6366F1" fontFamily="Inter, sans-serif">Trade</text>
      </g>

      {/* Swap arrows connecting the two cards */}
      <g transform="translate(232 156)">
        <circle cx="28" cy="28" r="28" fill="#FFC629" />
        <g transform="translate(28 28) scale(1.25) translate(-12 -12)">
          <path
            d="M17 2l4 4-4 4M3 6h18M7 22l-4-4 4-4M21 18H3"
            fill="none" stroke="#1A1D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Verified meetup pin */}
      <g transform="translate(408 44)">
        <circle cx="20" cy="20" r="20" fill="#E6F9F1" />
        <g transform="translate(20 20) scale(0.85) translate(-12 -12)">
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 11.5l2 2 4-4"
            fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}
