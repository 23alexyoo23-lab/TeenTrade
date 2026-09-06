"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import { TOP_CATEGORIES } from "@/lib/constants";
import { track } from "@/lib/analytics";

const RECENT_KEY = "tt.recent-searches";

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function pushRecent(term: string): void {
  try {
    const next = [term, ...readRecent().filter((t) => t !== term)].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private browsing can throw; searching must still work.
  }
}

/**
 * 7.4 Search bar. After two characters the dropdown offers up to five recent
 * searches and five suggested categories.
 */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => setRecent(readRecent()), []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const trimmed = value.trim();
  const showSuggestions = open && trimmed.length >= 2;

  const recentMatches = recent
    .filter((term) => term.toLowerCase().includes(trimmed.toLowerCase()) && term !== trimmed)
    .slice(0, 5);
  const categoryMatches = TOP_CATEGORIES.filter((category) =>
    category.name.toLowerCase().includes(trimmed.toLowerCase()),
  ).slice(0, 5);

  const options: { label: string; href: string; hint: string }[] = [
    ...recentMatches.map((term) => ({
      label: term,
      href: `/buy?q=${encodeURIComponent(term)}`,
      hint: "Recent search",
    })),
    ...categoryMatches.map((category) => ({
      label: category.name,
      href: `/buy?category=${category.slug}`,
      hint: "Category",
    })),
  ];

  function submit(term: string) {
    const query = term.trim();
    if (!query) return;
    pushRecent(query);
    setRecent(readRecent());
    setOpen(false);
    track("search_performed", { query, source: "header" });
    router.push(`/buy?q=${encodeURIComponent(query)}`);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, minWidth: 0, maxWidth: 640 }}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (activeIndex >= 0 && options[activeIndex]) {
            const option = options[activeIndex];
            setOpen(false);
            router.push(option.href);
            return;
          }
          submit(value);
        }}
      >
        <label htmlFor="tt-global-search" className="sr-only">
          Search TeenTrade
        </label>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-muted)",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={20} />
        </span>
        <input
          id="tt-global-search"
          type="search"
          className="input"
          value={value}
          placeholder="Search TeenTrade"
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions && options.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (!showSuggestions || options.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => (i + 1) % options.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          style={{ paddingLeft: 44, background: "var(--surface-subtle)" }}
        />
      </form>

      {showSuggestions && options.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            listStyle: "none",
            margin: 0,
            padding: 4,
            zIndex: 60,
          }}
        >
          {options.map((option, index) => (
            <li key={`${option.hint}-${option.label}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  setOpen(false);
                  if (option.hint === "Recent search") pushRecent(option.label);
                  router.push(option.href);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  background: index === activeIndex ? "var(--surface-subtle)" : "transparent",
                  border: 0,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span className="t-body">{option.label}</span>
                <span className="t-caption" style={{ color: "var(--ink-muted)" }}>
                  {option.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
