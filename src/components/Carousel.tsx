"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * Horizontal rail with chevron paging — 8.1. The chevrons disable at each end
 * (acceptance criterion 15.1) and the rail stays keyboard and touch scrollable.
 */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= maxScroll - 2);
  }, []);

  useEffect(() => {
    sync();
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function page(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div style={{ position: "relative" }}>
      <div ref={railRef} className="rail" role="group" aria-label={label}>
        {children}
      </div>

      <ChevronButton side="left" onClick={() => page(-1)} disabled={atStart} label={`Scroll ${label} backwards`} />
      <ChevronButton side="right" onClick={() => page(1)} disabled={atEnd} label={`Scroll ${label} forwards`} />
    </div>
  );
}

function ChevronButton({
  side,
  onClick,
  disabled,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="tt-carousel-chevron"
      style={{
        [side]: -14,
        opacity: disabled ? 0 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Icon name={side === "left" ? "chevron-left" : "chevron-right"} size={20} />
    </button>
  );
}
