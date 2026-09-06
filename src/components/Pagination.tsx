import Link from "next/link";
import { Icon } from "./Icon";

/**
 * 8.2 Pagination. Numbered pages with previous and next chevrons; the
 * previous chevron is disabled on page 1 (15.2).
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: "var(--space-8)",
        flexWrap: "wrap",
      }}
    >
      <PageChevron direction="prev" page={page - 1} disabled={page <= 1} buildHref={buildHref} />

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="t-body" style={{ color: "var(--ink-muted)", padding: "0 4px" }}>
            &hellip;
          </span>
        ) : (
          <Link
            key={entry}
            href={buildHref(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={`tt-page${entry === page ? " is-current" : ""}`}
          >
            {entry}
          </Link>
        ),
      )}

      <PageChevron direction="next" page={page + 1} disabled={page >= totalPages} buildHref={buildHref} />
    </nav>
  );
}

function PageChevron({
  direction,
  page,
  disabled,
  buildHref,
}: {
  direction: "prev" | "next";
  page: number;
  disabled: boolean;
  buildHref: (page: number) => string;
}) {
  const label = direction === "prev" ? "Previous page" : "Next page";
  const icon = direction === "prev" ? "chevron-left" : "chevron-right";

  if (disabled) {
    return (
      <span className="tt-page is-disabled" aria-disabled="true" aria-label={label}>
        <Icon name={icon} size={16} />
      </span>
    );
  }
  return (
    <Link href={buildHref(page)} className="tt-page" aria-label={label}>
      <Icon name={icon} size={16} />
    </Link>
  );
}

/** Shows the first, last and a window around the current page. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const result: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) result.push("gap");
  for (let i = start; i <= end; i += 1) result.push(i);
  if (end < totalPages - 1) result.push("gap");
  result.push(totalPages);

  return result;
}
