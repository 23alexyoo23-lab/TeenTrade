"use client";

import { useState } from "react";
import { FilterPanel } from "./FilterPanel";
import { Icon } from "./Icon";

/** Below 1024px the filter sidebar collapses behind a disclosure button. */
export function MobileFilters() {
  const [open, setOpen] = useState(false);

  return (
    <div className="tt-mobile-filters">
      <button
        type="button"
        className="btn btn-tertiary btn-sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="tt-mobile-filter-panel"
      >
        <Icon name="sliders" size={16} />
        Filters
      </button>

      {open ? (
        <div id="tt-mobile-filter-panel" style={{ marginTop: "var(--space-4)" }}>
          <FilterPanel onClose={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
