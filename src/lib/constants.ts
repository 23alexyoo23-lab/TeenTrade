import type {
  Category,
  Condition,
  MeetupLocation,
  Region,
  ReportReason,
  TransactionType,
} from "./types";

/** 7.3 — the ten V1 categories, plus the child categories used by breadcrumbs. */
export const CATEGORIES: Category[] = [
  { id: 1, slug: "clothing", name: "Clothing", parent_id: null, requires_size: true },
  { id: 2, slug: "shoes", name: "Shoes", parent_id: null, requires_size: true },
  { id: 3, slug: "tech", name: "Tech", parent_id: null, requires_size: false },
  { id: 4, slug: "gaming", name: "Gaming", parent_id: null, requires_size: false },
  { id: 5, slug: "sports", name: "Sports", parent_id: null, requires_size: false },
  { id: 6, slug: "books", name: "Books", parent_id: null, requires_size: false },
  { id: 7, slug: "accessories", name: "Accessories", parent_id: null, requires_size: false },
  { id: 8, slug: "collectibles", name: "Collectibles", parent_id: null, requires_size: false },
  { id: 9, slug: "music", name: "Music", parent_id: null, requires_size: false },
  { id: 10, slug: "other", name: "Other", parent_id: null, requires_size: false },

  // Children — parent inherits requires_size.
  { id: 101, slug: "hoodies", name: "Hoodies", parent_id: 1, requires_size: true },
  { id: 102, slug: "t-shirts", name: "T-Shirts", parent_id: 1, requires_size: true },
  { id: 103, slug: "jackets", name: "Jackets", parent_id: 1, requires_size: true },
  { id: 104, slug: "bottoms", name: "Bottoms", parent_id: 1, requires_size: true },
  { id: 201, slug: "sneakers", name: "Sneakers", parent_id: 2, requires_size: true },
  { id: 202, slug: "sandals", name: "Sandals", parent_id: 2, requires_size: true },
  { id: 203, slug: "boots", name: "Boots", parent_id: 2, requires_size: true },
  { id: 301, slug: "phones", name: "Phones", parent_id: 3, requires_size: false },
  { id: 302, slug: "laptops", name: "Laptops", parent_id: 3, requires_size: false },
  { id: 303, slug: "audio", name: "Audio", parent_id: 3, requires_size: false },
  { id: 304, slug: "cameras", name: "Cameras", parent_id: 3, requires_size: false },
  { id: 401, slug: "consoles", name: "Consoles", parent_id: 4, requires_size: false },
  { id: 402, slug: "games", name: "Games", parent_id: 4, requires_size: false },
  { id: 403, slug: "controllers", name: "Controllers", parent_id: 4, requires_size: false },
  { id: 404, slug: "pc-gear", name: "PC Gear", parent_id: 4, requires_size: false },
  { id: 501, slug: "bikes-scooters", name: "Bikes & Scooters", parent_id: 5, requires_size: false },
  { id: 502, slug: "team-sports", name: "Team Sports", parent_id: 5, requires_size: false },
  { id: 503, slug: "fitness", name: "Fitness", parent_id: 5, requires_size: false },
  { id: 601, slug: "textbooks", name: "Textbooks", parent_id: 6, requires_size: false },
  { id: 602, slug: "fiction", name: "Fiction", parent_id: 6, requires_size: false },
  { id: 603, slug: "manga", name: "Manga", parent_id: 6, requires_size: false },
  { id: 701, slug: "bags", name: "Bags", parent_id: 7, requires_size: false },
  { id: 702, slug: "watches", name: "Watches", parent_id: 7, requires_size: false },
  { id: 703, slug: "jewellery", name: "Jewellery", parent_id: 7, requires_size: false },
  { id: 801, slug: "trading-cards", name: "Trading Cards", parent_id: 8, requires_size: false },
  { id: 802, slug: "figures", name: "Figures", parent_id: 8, requires_size: false },
  { id: 803, slug: "sneaker-collectibles", name: "Sneaker Collectibles", parent_id: 8, requires_size: false },
  { id: 901, slug: "instruments", name: "Instruments", parent_id: 9, requires_size: false },
  { id: 902, slug: "vinyl-cds", name: "Vinyl & CDs", parent_id: 9, requires_size: false },
  { id: 1001, slug: "misc", name: "Misc", parent_id: 10, requires_size: false },
];

export const TOP_CATEGORIES = CATEGORIES.filter((c) => c.parent_id === null);

export function categoryById(id: number): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function childCategories(parentId: number): Category[] {
  return CATEGORIES.filter((c) => c.parent_id === parentId);
}

/** Root-to-leaf path, used by the listing detail breadcrumb (8.3). */
export function categoryPath(id: number): Category[] {
  const path: Category[] = [];
  let current = categoryById(id);
  while (current) {
    path.unshift(current);
    current = current.parent_id === null ? undefined : categoryById(current.parent_id);
  }
  return path;
}

export const CONDITIONS: {
  value: Condition;
  label: string;
  description: string;
}[] = [
  { value: "new", label: "New", description: "Never used, still has tags or original packaging" },
  { value: "like_new", label: "Like New", description: "Used once or twice, no visible wear" },
  { value: "good", label: "Good", description: "Used regularly, minor signs of wear" },
  { value: "fair", label: "Fair", description: "Well used, visible wear or small defects" },
];

export function conditionLabel(condition: Condition): string {
  return CONDITIONS.find((c) => c.value === condition)?.label ?? condition;
}

export const REGIONS: { value: Region; label: string }[] = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "central", label: "Central" },
];

export function regionLabel(region: Region): string {
  return REGIONS.find((r) => r.value === region)?.label ?? region;
}

export const TRANSACTION_OPTIONS: {
  value: TransactionType;
  title: string;
  description: string;
}[] = [
  { value: "sell", title: "Sell", description: "List your item for sale" },
  { value: "trade", title: "Trade", description: "Exchange your item with others" },
  { value: "giveaway", title: "Giveaway", description: "Give your item for free" },
];

/** 8.5 — colour list. */
export const COLOURS = [
  "Black", "White", "Grey", "Navy", "Blue", "Red", "Pink", "Purple",
  "Green", "Yellow", "Orange", "Brown", "Beige", "Multicolour",
];

/** 8.5 — size options vary by category family. */
export const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "One Size"];
export const SHOE_SIZES = [
  "UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12",
];

export function sizeOptions(categoryId: number | null): string[] {
  if (categoryId === null) return [];
  const root = categoryPath(categoryId)[0];
  if (!root) return [];
  if (root.slug === "shoes") return SHOE_SIZES;
  if (root.slug === "clothing") return CLOTHING_SIZES;
  return [];
}

export function requiresSize(categoryId: number | null): boolean {
  if (categoryId === null) return false;
  const root = categoryPath(categoryId)[0];
  return root?.slug === "clothing" || root?.slug === "shoes";
}

/** 8.2 — sort options. */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "condition", label: "Condition" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** 9.6 / 10.2 — report reasons. */
export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "prohibited_item", label: "Prohibited item" },
  { value: "counterfeit", label: "Counterfeit" },
  { value: "scam", label: "Scam or fraud" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment" },
  { value: "not_a_teen", label: "User is not a teen" },
  { value: "other", label: "Other" },
];

/** 10.1 — prohibited items, surfaced at /safety/prohibited-items. */
export const PROHIBITED_ITEMS: { title: string; detail: string }[] = [
  { title: "Weapons and replicas", detail: "Including knives, airsoft guns, and anything designed to look like a weapon." },
  { title: "Alcohol", detail: "Any alcoholic drink, regardless of the seller's or buyer's age." },
  { title: "Tobacco and vaping products", detail: "Cigarettes, vapes, pods, and accessories. Vaping is illegal in Singapore." },
  { title: "Medication and supplements", detail: "Prescription and over-the-counter medicine, protein powders, and vitamins." },
  { title: "Adult content", detail: "Sexual content of any kind, in listings, photos, or messages." },
  { title: "Live animals", detail: "Pets, fish, insects, or any living creature." },
  { title: "Event tickets", detail: "Concert, sport, and attraction tickets, because of resale fraud risk." },
  { title: "Gift cards and digital currency", detail: "Store credit, game currency, crypto, and account top-ups." },
  { title: "Opened cosmetics", detail: "Make-up, skincare, and personal care products that have been unsealed." },
  { title: "Counterfeit goods", detail: "Replicas, fakes, and unauthorised copies of branded items." },
  { title: "Anything requiring an adult licence", detail: "If an adult would need a permit to sell it, it does not belong here." },
];

/** 10.1 — keyword screen run against the title and description on publish. */
export const PROHIBITED_KEYWORDS = [
  "knife", "knives", "dagger", "gun", "pistol", "rifle", "airsoft", "taser", "pepper spray",
  "alcohol", "beer", "vodka", "whisky", "whiskey", "wine", "soju",
  "cigarette", "cigar", "tobacco", "vape", "vaping", "e-cigarette", "juul", "nicotine", "pod kit",
  "xanax", "adderall", "steroid", "viagra", "prescription",
  "porn", "nude", "escort",
  "puppy", "kitten", "hamster for sale",
  "concert ticket", "event ticket", "match ticket",
  "gift card", "steam wallet", "bitcoin", "crypto", "ethereum",
  "replica", "fake", "1:1 copy", "aaa quality", "counterfeit",
];

/** 10.1 price anomaly bounds, in cents. */
export const PRICE_MIN_CENTS = 100; // SGD 1
export const PRICE_MAX_CENTS = 500_000; // SGD 5000

/** 8.2 — results per page. */
export const PER_PAGE = 24;

/** 9.4 — how long a Buy Now request holds a listing. */
export const RESERVATION_HOURS = 48;

/** 8.2 filter panel: price slider ceiling in dollars. */
export const PRICE_FILTER_MAX = 200;

/** 8.7 — verified meetup locations. */
export const MEETUP_LOCATIONS: MeetupLocation[] = [
  { id: 1, name: "Bishan MRT Station Control", region: "central", nearest_mrt: "Bishan (NS17/CC15)", opening_hours: "Daily 5.30am - 12.30am", kind: "mrt" },
  { id: 2, name: "Ang Mo Kio Public Library", region: "north", nearest_mrt: "Ang Mo Kio (NS16)", opening_hours: "Daily 10am - 9pm", kind: "library" },
  { id: 3, name: "Yishun Community Centre", region: "north", nearest_mrt: "Yishun (NS13)", opening_hours: "Daily 9am - 10pm", kind: "community_centre" },
  { id: 4, name: "Northpoint City Information Counter", region: "north", nearest_mrt: "Yishun (NS13)", opening_hours: "Daily 10am - 10pm", kind: "mall" },
  { id: 5, name: "Tampines Regional Library", region: "east", nearest_mrt: "Tampines (EW2/DT32)", opening_hours: "Daily 10am - 9pm", kind: "library" },
  { id: 6, name: "Bedok MRT Station Control", region: "east", nearest_mrt: "Bedok (EW5)", opening_hours: "Daily 5.30am - 12.30am", kind: "mrt" },
  { id: 7, name: "Jurong Regional Library", region: "west", nearest_mrt: "Jurong East (NS1/EW24)", opening_hours: "Daily 10am - 9pm", kind: "library" },
  { id: 8, name: "Clementi Community Centre", region: "west", nearest_mrt: "Clementi (EW23)", opening_hours: "Daily 9am - 10pm", kind: "community_centre" },
  { id: 9, name: "JEM Mall Concierge", region: "west", nearest_mrt: "Jurong East (NS1/EW24)", opening_hours: "Daily 10am - 10pm", kind: "mall" },
  { id: 10, name: "HarbourFront MRT Station Control", region: "south", nearest_mrt: "HarbourFront (NE1/CC29)", opening_hours: "Daily 5.30am - 12.30am", kind: "mrt" },
  { id: 11, name: "VivoCity Information Counter", region: "south", nearest_mrt: "HarbourFront (NE1/CC29)", opening_hours: "Daily 10am - 10pm", kind: "mall" },
  { id: 12, name: "library@harbourfront", region: "south", nearest_mrt: "HarbourFront (NE1/CC29)", opening_hours: "Daily 11am - 9pm", kind: "library" },
  { id: 13, name: "Dhoby Ghaut MRT Station Control", region: "central", nearest_mrt: "Dhoby Ghaut (NS24/NE6/CC1)", opening_hours: "Daily 5.30am - 12.30am", kind: "mrt" },
  { id: 14, name: "National Library Building Entrance", region: "central", nearest_mrt: "Bugis (EW12/DT14)", opening_hours: "Daily 10am - 9pm", kind: "library" },
  { id: 15, name: "Toa Payoh Community Centre", region: "central", nearest_mrt: "Toa Payoh (NS19)", opening_hours: "Daily 9am - 10pm", kind: "community_centre" },
];

export function meetupLocationById(id: number): MeetupLocation | undefined {
  return MEETUP_LOCATIONS.find((l) => l.id === id);
}

/** 10.4 — stated at the purchase modal, safety hub and terms. */
export const PAYMENT_DISCLAIMER =
  "TeenTrade does not handle payments. You arrange payment directly with the other person when you meet.";

export const MIN_AGE = 13;
export const MAX_AGE = 19;
/** Below this age a parent or guardian must consent (9.2). */
export const PARENTAL_CONSENT_AGE = 16;
