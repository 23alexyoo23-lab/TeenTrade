"use client";

import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { useToast } from "./Toast";
import { MEETUP_LOCATIONS, REGIONS, regionLabel } from "@/lib/constants";
import type { MeetupLocation, Region } from "@/lib/types";

const KIND_ICON: Record<MeetupLocation["kind"], IconName> = {
  mrt: "map-pin",
  community_centre: "users",
  library: "book",
  mall: "bag",
};

const KIND_LABEL: Record<MeetupLocation["kind"], string> = {
  mrt: "MRT station control",
  community_centre: "Community centre",
  library: "Public library",
  mall: "Mall information counter",
};

/**
 * 8.7 — map view plus list. The map is a schematic of Singapore's regions
 * rather than a tile map, which keeps the page fast and needs no third-party
 * script or API key.
 */
export function MeetupLocationList({ viewerRegion }: { viewerRegion: Region }) {
  const [region, setRegion] = useState<Region | "all">(viewerRegion);
  const { toast } = useToast();

  const locations =
    region === "all" ? MEETUP_LOCATIONS : MEETUP_LOCATIONS.filter((l) => l.region === region);

  return (
    <div style={{ marginTop: "var(--space-5)" }}>
      {/* Region filter, doubling as the map legend */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "var(--space-5)" }}>
        <button
          type="button"
          className={`tt-tab${region === "all" ? " is-active" : ""}`}
          onClick={() => setRegion("all")}
        >
          All Singapore ({MEETUP_LOCATIONS.length})
        </button>
        {REGIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`tt-tab${region === option.value ? " is-active" : ""}`}
            onClick={() => setRegion(option.value)}
          >
            {option.label} ({MEETUP_LOCATIONS.filter((l) => l.region === option.value).length})
          </button>
        ))}
      </div>

      <div className="tt-meetup-layout">
        <RegionMap active={region} onSelect={setRegion} />

        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-2)" }}>
          {locations.map((location) => (
            <li
              key={location.id}
              className="card"
              style={{ padding: "var(--space-4)", display: "flex", gap: "var(--space-3)", alignItems: "flex-start", flexWrap: "wrap" }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--green-subtle)",
                  color: "#047857",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={KIND_ICON[location.kind]} size={18} />
              </span>

              <div style={{ flex: 1, minWidth: 160 }}>
                <p className="t-body-md" style={{ margin: 0 }}>{location.name}</p>
                <p className="t-caption" style={{ margin: "2px 0 0", color: "var(--ink-muted)" }}>
                  {regionLabel(location.region)} · {KIND_LABEL[location.kind]} · {location.nearest_mrt}
                </p>
                <p className="t-caption" style={{ margin: "2px 0 0", color: "var(--ink-muted)" }}>
                  {location.opening_hours}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-tertiary btn-sm"
                onClick={() => {
                  // Copied so it can be pasted into an open chat.
                  const text = `Can we meet at ${location.name} (${location.nearest_mrt})?`;
                  void navigator.clipboard
                    ?.writeText(text)
                    .then(() => toast("Copied. Paste it into your chat with the other person."))
                    .catch(() => toast("Copy that location name into your chat.", { tone: "info" }));
                }}
              >
                Suggest this location
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Schematic map of Singapore's five regions with location counts. */
function RegionMap({
  active,
  onSelect,
}: {
  active: Region | "all";
  onSelect: (region: Region | "all") => void;
}) {
  const shapes: { id: Region; label: string; d: string; cx: number; cy: number }[] = [
    { id: "north", label: "North", d: "M96 22 L242 18 L252 82 L104 92 Z", cx: 174, cy: 55 },
    { id: "west", label: "West", d: "M22 78 L104 92 L112 168 L34 158 Z", cx: 68, cy: 124 },
    { id: "central", label: "Central", d: "M104 92 L252 82 L246 152 L112 168 Z", cx: 178, cy: 126 },
    { id: "east", label: "East", d: "M246 152 L252 82 L326 96 L318 160 Z", cx: 286, cy: 126 },
    { id: "south", label: "South", d: "M112 168 L246 152 L238 200 L120 206 Z", cx: 178, cy: 180 },
  ];

  return (
    <div className="card" style={{ padding: "var(--space-4)", alignSelf: "start" }}>
      <svg viewBox="0 0 348 224" width="100%" role="img" aria-label="Meetup locations by region">
        {shapes.map((shape) => {
          const isActive = active === shape.id;
          const count = MEETUP_LOCATIONS.filter((l) => l.region === shape.id).length;
          return (
            <g
              key={shape.id}
              onClick={() => onSelect(isActive ? "all" : shape.id)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={shape.d}
                fill={isActive ? "var(--brand-yellow)" : "var(--surface-subtle)"}
                stroke={isActive ? "var(--brand-yellow-pressed)" : "var(--border-strong)"}
                strokeWidth="1.5"
              />
              <text
                x={shape.cx}
                y={shape.cy - 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--ink)"
              >
                {shape.label}
              </text>
              <text x={shape.cx} y={shape.cy + 12} textAnchor="middle" fontSize="11" fill="var(--ink-muted)">
                {count} spots
              </text>
            </g>
          );
        })}
      </svg>
      <p className="t-caption" style={{ margin: "var(--space-2) 0 0", color: "var(--ink-muted)", textAlign: "center" }}>
        Tap a region to filter the list.
      </p>
    </div>
  );
}
