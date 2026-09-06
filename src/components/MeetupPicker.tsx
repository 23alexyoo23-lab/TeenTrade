"use client";

import { MEETUP_LOCATIONS, regionLabel } from "@/lib/constants";
import type { Region } from "@/lib/types";

/**
 * 9.4 — meetup location selector, filtered to the two users' regions so the
 * suggestions are actually reachable for both sides.
 */
export function MeetupPicker({
  value,
  onChange,
  regions,
  proposedAt,
  onProposedAtChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  regions: Region[];
  proposedAt: string;
  onProposedAtChange: (value: string) => void;
}) {
  const preferred = MEETUP_LOCATIONS.filter((location) => regions.includes(location.region));
  const others = MEETUP_LOCATIONS.filter((location) => !regions.includes(location.region));

  // Default the picker at least an hour out so the datetime input is valid.
  const minDateTime = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);

  return (
    <>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="meetup-location">
          Verified meetup location
        </label>
        <p className="field-help">
          These are staffed, public places with CCTV. Never arrange a handover at a home.
        </p>
        <select
          id="meetup-location"
          className="select"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">Choose a location</option>
          {preferred.length > 0 ? (
            <optgroup label="Near you both">
              {preferred.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} — {regionLabel(location.region)}
                </option>
              ))}
            </optgroup>
          ) : null}
          <optgroup label="Everywhere else">
            {others.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} — {regionLabel(location.region)}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="meetup-time">
          Proposed date and time
        </label>
        <input
          id="meetup-time"
          className="input"
          type="datetime-local"
          min={minDateTime}
          value={proposedAt}
          onChange={(event) => onProposedAtChange(event.target.value)}
        />
      </div>
    </>
  );
}
