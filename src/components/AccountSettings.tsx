"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { REGIONS } from "@/lib/constants";
import type { Region } from "@/lib/types";

/** The editable slice of the profile: username and region. */
export function AccountSettings({
  currentUsername,
  currentRegion,
}: {
  currentUsername: string;
  currentRegion: Region;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState(currentUsername);
  const [region, setRegion] = useState<Region>(currentRegion);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = username !== currentUsername || region !== currentRegion;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/v1/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, region }),
      });
      const body = await response.json();

      if (!response.ok) {
        setError(body?.error?.message ?? "We could not save that.");
        return;
      }

      toast("Profile updated.");
      router.refresh();
    } catch {
      setError("We could not reach TeenTrade. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      {error ? (
        <p className="field-error" role="alert" aria-live="polite" style={{ marginBottom: "var(--space-4)" }}>
          {error}
        </p>
      ) : null}

      <div style={{ marginBottom: "var(--space-4)" }}>
        <label className="field-label" htmlFor="settings-username">
          Username
        </label>
        <p className="field-help">Lowercase letters, numbers and underscores. Do not use your full name.</p>
        <input
          id="settings-username"
          className="input"
          value={username}
          minLength={3}
          maxLength={30}
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
        />
      </div>

      <div style={{ marginBottom: "var(--space-5)" }}>
        <label className="field-label" htmlFor="settings-region">
          Region
        </label>
        <p className="field-help">Shown on your listings. We never store a precise location.</p>
        <select
          id="settings-region"
          className="select"
          value={region}
          onChange={(event) => setRegion(event.target.value as Region)}
        >
          {REGIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
        {saving ? <span className="btn-spinner" /> : "Save changes"}
      </button>
    </form>
  );
}
