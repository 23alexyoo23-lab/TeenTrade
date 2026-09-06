/**
 * Category icons — 6.7 asks for filled, multi-colour, 32px illustrations that
 * are visually distinct from the outline UI icon set.
 */

interface Tone {
  bg: string;
  fg: string;
  accent: string;
}

const TONES: Record<string, Tone> = {
  clothing: { bg: "#EFF3FF", fg: "#1D4ED8", accent: "#93B4FF" },
  shoes: { bg: "#FEF6E0", fg: "#B45309", accent: "#FFD976" },
  tech: { bg: "#F1F3F7", fg: "#334155", accent: "#B7C0CF" },
  gaming: { bg: "#EEF0FF", fg: "#6366F1", accent: "#B9BDFF" },
  sports: { bg: "#E6F9F1", fg: "#047857", accent: "#7FDCB6" },
  books: { bg: "#FFF1F3", fg: "#BE123C", accent: "#FFB3C1" },
  accessories: { bg: "#FEF6E0", fg: "#92400E", accent: "#FFCF5C" },
  collectibles: { bg: "#EEF0FF", fg: "#4F46E5", accent: "#A5A9FF" },
  music: { bg: "#F1F3F7", fg: "#0F172A", accent: "#C7CEDB" },
  other: { bg: "#F9FAFB", fg: "#4B5563", accent: "#CBD5E1" },
};

function Glyph({ slug, tone }: { slug: string; tone: Tone }) {
  switch (slug) {
    case "clothing":
      return (
        <>
          <path d="M14 8 L20 5.5 L24 8 L28 10 L26.5 14 L24 12.8 V27 H8 V12.8 L5.5 14 L4 10 L8 8 L12 5.5 Z" fill={tone.fg} />
          <path d="M12 5.5 A4 4 0 0 0 20 5.5 Z" fill={tone.accent} />
        </>
      );
    case "shoes":
      return (
        <>
          <path d="M3 22 V15 H10 L14 11 L17.5 15.5 C20 18.5 23.5 19 27 19.4 C28.5 19.6 29 20.4 29 21.6 V22 Z" fill={tone.fg} />
          <path d="M3 22 H29 V25 H3 Z" fill={tone.accent} />
        </>
      );
    case "tech":
      return (
        <>
          <rect x="5" y="7" width="22" height="15" rx="2" fill={tone.fg} />
          <rect x="8" y="10" width="16" height="9" rx="1" fill={tone.accent} />
          <path d="M3 24 H29 V26.5 H3 Z" fill={tone.fg} />
        </>
      );
    case "gaming":
      return (
        <>
          <path d="M9 10 H23 A7 7 0 0 1 29 20.5 L27.5 24.5 A3 3 0 0 1 22.5 25 L20.5 22 H11.5 L9.5 25 A3 3 0 0 1 4.5 24.5 L3 20.5 A7 7 0 0 1 9 10 Z" fill={tone.fg} />
          <path d="M9.5 15 V19 M7.5 17 H11.5" stroke={tone.accent} strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="16.5" r="1.7" fill={tone.accent} />
          <circle cx="25" cy="19.5" r="1.7" fill={tone.accent} />
        </>
      );
    case "sports":
      return (
        <>
          <circle cx="16" cy="16" r="11.5" fill={tone.fg} />
          <path d="M16 4.5 V27.5 M4.5 16 H27.5 M7 9 Q16 16 25 9 M7 23 Q16 16 25 23" stroke={tone.accent} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      );
    case "books":
      return (
        <>
          <path d="M5 5 H16 A3 3 0 0 1 19 8 V27 H8 A3 3 0 0 1 5 24 Z" fill={tone.fg} />
          <path d="M19 8 H27 V27 H19 Z" fill={tone.accent} />
          <path d="M8 11 H15 M8 15 H15" stroke={tone.bg} strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case "accessories":
      return (
        <>
          <path d="M6 11 H26 L27.5 27 H4.5 Z" fill={tone.fg} />
          <path d="M11 11 V8.5 A5 5 0 0 1 21 8.5 V11" stroke={tone.accent} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      );
    case "collectibles":
      return (
        <>
          <path d="M8 4 H19 L25 10 V28 H8 Z" fill={tone.fg} />
          <path d="M19 4 V10 H25 Z" fill={tone.accent} />
          <path d="M12 16 H21 M12 20 H18" stroke={tone.bg} strokeWidth="1.8" strokeLinecap="round" />
        </>
      );
    case "music":
      return (
        <>
          <path d="M12 24 V6 L27 3 V21" stroke={tone.fg} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8.5" cy="24" r="4.2" fill={tone.fg} />
          <circle cx="23.5" cy="21" r="4.2" fill={tone.accent} />
        </>
      );
    default:
      return (
        <>
          <path d="M16 4 L27 10 V22 L16 28 L5 22 V10 Z" fill={tone.fg} />
          <path d="M5 10 L16 16 L27 10 M16 16 V28" stroke={tone.accent} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        </>
      );
  }
}

export function CategoryIcon({ slug, size = 32 }: { slug: string; size?: number }) {
  const tone = TONES[slug] ?? TONES.other;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <Glyph slug={slug} tone={tone} />
    </svg>
  );
}
