import { PRICE_MAX_CENTS, PRICE_MIN_CENTS, PROHIBITED_KEYWORDS } from "./constants";

/**
 * Automated checks run when a listing is published — PRD section 10.1.
 */

export type ModerationOutcome =
  | { decision: "pass" }
  | { decision: "hold"; reason: string }
  | { decision: "reject"; reason: string };

export interface ModerationInput {
  title: string;
  description: string;
  priceCents: number | null;
  /** Cover image URLs of the seller's listings published in the last 7 days. */
  recentImageFingerprints?: string[];
  imageFingerprints?: string[];
}

export interface ModerationResult {
  outcome: ModerationOutcome;
  /** Warnings shown to the seller even when the listing passes. */
  warnings: string[];
  /** Description with contact details stripped. */
  sanitisedDescription: string;
  strippedContactDetails: boolean;
  duplicateOfRecentListing: boolean;
}

/**
 * Contact-detail patterns. 10.1 requires these to be stripped automatically
 * from descriptions, with a warning to the seller, so that conversations stay
 * on-platform where they can be moderated.
 */
const CONTACT_PATTERNS: { label: string; pattern: RegExp }[] = [
  // Singapore mobile numbers: 8 digits starting 8 or 9, optional +65, with
  // spaces, dashes or dots used to dodge the filter.
  { label: "phone number", pattern: /(?:\+?65[\s.-]*)?[89](?:[\s.-]*\d){7}/g },
  { label: "email address", pattern: /[\w.+-]+\s*(?:@|\(at\)|\[at\])\s*[\w-]+(?:\s*(?:\.|\(dot\))\s*[\w-]+)+/gi },
  { label: "Telegram handle", pattern: /(?:^|[\s(])@[a-z0-9_]{4,32}\b/gi },
  { label: "messaging app", pattern: /\b(?:whats\s?app|wa\.me|t\.me|telegram|tele|signal|wechat|instagram|insta|ig)\b\s*[:\-]?\s*[\w.@+]*/gi },
];

export function stripContactDetails(text: string): { text: string; stripped: string[] } {
  let output = text;
  const stripped: string[] = [];

  for (const { label, pattern } of CONTACT_PATTERNS) {
    // Reset lastIndex — these regexes are module-level and stateful with /g.
    pattern.lastIndex = 0;
    if (pattern.test(output)) {
      pattern.lastIndex = 0;
      output = output.replace(pattern, (match) => {
        // Preserve leading whitespace so words do not run together.
        const lead = /^\s/.test(match) ? match[0] : "";
        return `${lead}[removed]`;
      });
      stripped.push(label);
    }
  }

  // Overlapping patterns (for example "telegram @handle") can leave adjacent
  // markers; collapse them so the description still reads naturally.
  output = output.replace(/(\[removed\][\s.,;:-]*)+\[removed\]/g, "[removed]");

  return { text: output, stripped };
}

/** "a phone number and a Telegram handle" rather than a bare comma list. */
function listPhrase(labels: string[]): string {
  const withArticles = labels.map((label) => `a ${label}`);
  if (withArticles.length === 1) return withArticles[0];
  return `${withArticles.slice(0, -1).join(", ")} and ${withArticles[withArticles.length - 1]}`;
}

export function findProhibitedKeywords(text: string): string[] {
  const haystack = text.toLowerCase();
  return PROHIBITED_KEYWORDS.filter((keyword) => {
    // Word-boundary match so "winerack" does not trip on "wine".
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(haystack);
  });
}

export function moderateListing(input: ModerationInput): ModerationResult {
  const warnings: string[] = [];

  // Contact details in the description are stripped, never a hard failure.
  const { text: sanitisedDescription, stripped } = stripContactDetails(input.description);
  if (stripped.length > 0) {
    warnings.push(
      `We removed ${listPhrase(stripped)} from your description. Keep conversations on TeenTrade so our team can help if something goes wrong.`,
    );
  }

  // Duplicate detection: same images, same user, within 7 days.
  const fingerprints = input.imageFingerprints ?? [];
  const recent = new Set(input.recentImageFingerprints ?? []);
  const duplicateOfRecentListing = fingerprints.some((fp) => recent.has(fp));
  if (duplicateOfRecentListing) {
    warnings.push(
      "This looks like a listing you already published in the last 7 days. You can publish it anyway, but duplicates are less likely to be shown.",
    );
  }

  // Keyword screen runs against the sanitised text.
  const hits = findProhibitedKeywords(`${input.title} ${sanitisedDescription}`);
  if (hits.length > 0) {
    return {
      outcome: {
        decision: "hold",
        reason: `Mentions a prohibited item (${hits.slice(0, 3).join(", ")}).`,
      },
      warnings,
      sanitisedDescription,
      strippedContactDetails: stripped.length > 0,
      duplicateOfRecentListing,
    };
  }

  // Price anomaly.
  if (input.priceCents !== null) {
    if (input.priceCents < PRICE_MIN_CENTS || input.priceCents > PRICE_MAX_CENTS) {
      return {
        outcome: { decision: "hold", reason: "Price is outside the usual range." },
        warnings,
        sanitisedDescription,
        strippedContactDetails: stripped.length > 0,
        duplicateOfRecentListing,
      };
    }
  }

  return {
    outcome: { decision: "pass" },
    warnings,
    sanitisedDescription,
    strippedContactDetails: stripped.length > 0,
    duplicateOfRecentListing,
  };
}

/**
 * 12.5 — message bodies are scanned before delivery. Contact details are
 * stripped for the same reason as listing descriptions.
 */
export function scanMessage(body: string): { body: string; redacted: boolean } {
  const { text, stripped } = stripContactDetails(body);
  return { body: text, redacted: stripped.length > 0 };
}
