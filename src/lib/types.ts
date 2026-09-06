/**
 * Domain types — PRD section 11 (Data Model).
 * Column names mirror the spec so the store, the API and the UI all speak the
 * same language.
 */

export type Region = "north" | "south" | "east" | "west" | "central";
export type Condition = "new" | "like_new" | "good" | "fair";
export type TransactionType = "sell" | "trade" | "giveaway";

export type AccountStatus = "pending_consent" | "active" | "suspended" | "deleted";

export type ListingStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "reserved"
  | "sold"
  | "removed";

export type OfferType = "purchase" | "price_offer" | "trade";

export type OfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "countered"
  | "expired"
  | "completed";

export type ReportTargetType = "listing" | "user" | "message";

export type ReportReason =
  | "prohibited_item"
  | "counterfeit"
  | "scam"
  | "inappropriate"
  | "harassment"
  | "not_a_teen"
  | "other";

export type ReportStatus = "open" | "in_review" | "resolved" | "dismissed";

/** 11.2 users */
export interface User {
  id: string;
  /** The Clerk account this profile belongs to. Clerk owns credentials. */
  clerk_id: string;
  username: string;
  email: string;
  date_of_birth: string; // ISO date
  phone_number: string | null; // stored encrypted at rest (10.5)
  phone_verified: boolean;
  avatar_url: string | null;
  region: Region;
  account_status: AccountStatus;
  parent_email: string | null; // encrypted at rest (10.5)
  parent_consent_at: string | null;
  parent_consent_token: string | null;
  parent_consent_sent_at: string | null;
  rating_average: number | null;
  rating_count: number;
  last_active_at: string;
  created_at: string;
  deleted_at: string | null;
}

/** Fields that are safe to expose to another user (10.5: no real name, no phone). */
export interface PublicUser {
  id: string;
  username: string;
  avatar_url: string | null;
  region: Region;
  rating_average: number | null;
  rating_count: number;
  last_active_at: string;
  created_at: string;
}

/** 11.3 listings */
export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category_id: number;
  condition: Condition;
  size: string | null;
  colour: string | null;
  brand: string | null;
  price_cents: number | null;
  transaction_types: TransactionType[];
  accepts_offers: boolean;
  region: Region;
  status: ListingStatus;
  view_count: number;
  save_count: number;
  moderation_note: string | null;
  reserved_until: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** 11.4 listing_images */
export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  thumbnail_url: string;
  position: number;
  created_at: string;
}

/** 11.5 offers */
export interface Offer {
  id: string;
  listing_id: string;
  offerer_id: string;
  offer_type: OfferType;
  offered_price_cents: number | null;
  offered_listing_ids: string[] | null;
  cash_topup_cents: number | null;
  message: string | null;
  meetup_location_id: number | null;
  proposed_meetup_at: string | null;
  status: OfferStatus;
  /** Set once each side confirms the handover happened (9.4). */
  completed_by: string[];
  expires_at: string;
  created_at: string;
}

/** 11.6 reports */
export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string;
  attachment_url: string | null;
  status: ReportStatus;
  resolution_note: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface SavedItem {
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  offer_id: string | null;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  /** True when the outbound scanner stripped contact details (10.1). */
  redacted: boolean;
  /** Pinned system messages carry the meetup summary (9.4). */
  kind: "text" | "system";
  read_by: string[];
  created_at: string;
}

export interface Review {
  id: string;
  offer_id: string;
  author_id: string;
  subject_id: string;
  rating: number;
  body: string;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: "message" | "offer" | "listing_status" | "consent" | "review" | "report";
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  created_at: string;
}

export interface ListingView {
  user_id: string;
  listing_id: string;
  viewed_at: string;
}

export interface MeetupLocation {
  id: number;
  name: string;
  region: Region;
  nearest_mrt: string;
  opening_hours: string;
  kind: "mrt" | "community_centre" | "library" | "mall";
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
  /** Clothing and Shoes require a size on the listing form (8.5). */
  requires_size: boolean;
}

export interface AnalyticsEvent {
  id: string;
  name: string;
  user_id: string | null;
  properties: Record<string, unknown>;
  created_at: string;
}

/** The full shape held in the JSON-backed store. */
export interface Database {
  users: User[];
  listings: Listing[];
  listing_images: ListingImage[];
  offers: Offer[];
  reports: Report[];
  saved_items: SavedItem[];
  conversations: Conversation[];
  messages: Message[];
  reviews: Review[];
  blocks: Block[];
  notifications: Notification[];
  listing_views: ListingView[];
  analytics_events: AnalyticsEvent[];
}

/** Listing enriched for the card / detail surfaces. */
export interface ListingWithRelations extends Listing {
  seller: PublicUser;
  images: ListingImage[];
  cover_image_url: string | null;
  category: Category;
  category_path: Category[];
  saved_by_viewer: boolean;
}
