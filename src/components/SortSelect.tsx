"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/constants";

/** 8.2 — sort control. Writes into the URL like every other filter. */
export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const value = params.get("sort") ?? "newest";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label className="t-body" htmlFor="sort-by" style={{ color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
        Sort by:
      </label>
      <select
        id="sort-by"
        className="select"
        style={{ width: "auto", minWidth: 170, height: 36 }}
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          if (event.target.value === "newest") next.delete("sort");
          else next.set("sort", event.target.value);
          next.delete("page");
          router.push(`/buy?${next.toString()}`, { scroll: false });
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
