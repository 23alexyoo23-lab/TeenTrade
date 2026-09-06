/** Formatting helpers shared by server and client components. */

/**
 * A listing with no price is either a giveaway (free) or trade-only (no cash
 * involved at all). Those read very differently to a buyer, so callers that
 * know the transaction types should pass them.
 */
export function formatPrice(
  cents: number | null | undefined,
  transactionTypes?: readonly string[],
): string {
  if (cents === null || cents === undefined) {
    if (transactionTypes && !transactionTypes.includes("giveaway")) return "Trade only";
    return "Free";
  }
  const dollars = cents / 100;
  // Whole dollars read better on cards; cents are shown only when present.
  return dollars % 1 === 0
    ? `$${dollars.toFixed(0)}`
    : `$${dollars.toFixed(2)}`;
}

export function dollarsToCents(value: string | number): number | null {
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** "Listed 2 days ago" style timestamps used across cards and detail pages. */
export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((now - then) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 90) return "1 minute ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.round(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/**
 * Countdown for a future timestamp, such as when an offer expires. Falls back
 * to a plain "expired" once the moment has passed.
 */
export function timeUntil(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";

  const seconds = Math.round((then - now) / 1000);
  if (seconds <= 0) return "expired";
  if (seconds < 60) return "in under a minute";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} ${hours === 1 ? "hour" : "hours"}`;

  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

/** 8.3 seller card presence indicator. */
export function presenceLabel(lastActiveAt: string, now = Date.now()): string {
  const diffHours = (now - new Date(lastActiveAt).getTime()) / 36e5;
  if (diffHours < 24) return "Active today";
  if (diffHours < 48) return "Active yesterday";
  const days = Math.floor(diffHours / 24);
  if (days < 30) return `Active ${days} days ago`;
  return "Active a while ago";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function initials(username: string): string {
  return username.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
}

/**
 * Deterministic avatar tint so seeded users look distinct without images.
 * Every tint carries its initials at 4.5:1 or better (13.2).
 */
const AVATAR_TINTS = [
  "#FFC629", // ink initials, 10.6:1
  "#4F46E5", // white initials, 6.3:1
  "#10B981", // ink initials, 6.6:1
  "#1D4ED8", // white initials, 6.7:1
  "#C2410C", // white initials, 5.2:1
  "#DB2777", // white initials, 4.6:1
  "#0F766E", // white initials, 5.5:1
];

export function avatarTint(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) % 100000;
  }
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

/** Ink or white initials, whichever contrasts better with the tint. */
export function avatarInk(tint: string): string {
  const value = Number.parseInt(tint.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.35 ? "#1A1D2E" : "#FFFFFF";
}

export function ageFromDob(dob: string, now = new Date()): number {
  const birth = new Date(dob);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
