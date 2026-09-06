"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { Avatar } from "./ui";
import type { PublicUser } from "@/lib/types";

/** 10.3 — Settings > Blocked users. Blocking is reversible from here. */
export function BlockedUsers({ users }: { users: PublicUser[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <p
        className="t-body card"
        style={{ padding: "var(--space-5)", margin: 0, color: "var(--ink-muted)" }}
      >
        You have not blocked anyone. Blocking hides someone&apos;s listings from you and stops them
        contacting you, and they are never told.
      </p>
    );
  }

  async function unblock(user: PublicUser) {
    setBusy(user.id);
    try {
      const response = await fetch(`/api/v1/users/${user.id}/block`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not unblock");
      toast(`You unblocked @${user.username}.`);
      router.refresh();
    } catch {
      toast("That did not work. Try again shortly.", { tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "var(--space-2)" }}>
      {users.map((user) => (
        <li
          key={user.id}
          className="card"
          style={{ padding: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}
        >
          <Avatar user={user} size={36} />
          <Link
            href={`/profile/${user.username}`}
            className="t-body-md"
            style={{ flex: 1, color: "var(--ink)", textDecoration: "none" }}
          >
            @{user.username}
          </Link>
          <button
            type="button"
            className="btn btn-tertiary btn-sm"
            onClick={() => unblock(user)}
            disabled={busy === user.id}
          >
            {busy === user.id ? <span className="btn-spinner" /> : "Unblock"}
          </button>
        </li>
      ))}
    </ul>
  );
}
