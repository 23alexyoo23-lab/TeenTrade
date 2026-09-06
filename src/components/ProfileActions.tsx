"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { ReportModal } from "./ReportModal";
import { useToast } from "./Toast";
import { track } from "@/lib/analytics";

/** 10.3 — block and report a user from their profile. */
export function ProfileActions({
  userId,
  username,
  initiallyBlocked,
}: {
  userId: string;
  username: string;
  initiallyBlocked: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [confirming, setConfirming] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function toggleBlock() {
    setBusy(true);
    try {
      const response = await fetch(`/api/v1/users/${userId}/block`, {
        method: blocked ? "DELETE" : "POST",
      });
      if (!response.ok) throw new Error("Could not update");

      const next = !blocked;
      setBlocked(next);
      setConfirming(false);

      if (next) {
        track("user_blocked", { source: "profile" });
        toast(`You blocked @${username}. This is silent, they are not told.`);
      } else {
        toast(`You unblocked @${username}.`);
      }
      router.refresh();
    } catch {
      toast("That did not work. Try again shortly.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: "var(--ink-muted)" }}
          onClick={() => setReportOpen(true)}
        >
          <Icon name="flag" size={14} />
          Report user
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: blocked ? "var(--blue-link)" : "var(--ink-muted)" }}
          onClick={() => (blocked ? toggleBlock() : setConfirming(true))}
          disabled={busy}
        >
          <Icon name="ban" size={14} />
          {blocked ? "Unblock" : "Block"}
        </button>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Block @${username}?`}
        footer={
          <>
            <button type="button" className="btn btn-tertiary" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-destructive" onClick={toggleBlock} disabled={busy}>
              {busy ? <span className="btn-spinner" /> : "Block"}
            </button>
          </>
        }
      >
        <ul className="t-body" style={{ margin: 0, paddingLeft: 18, color: "var(--ink-secondary)" }}>
          <li>Their listings disappear from your feed and search results</li>
          <li>They cannot message you, make offers, or see your listings</li>
          <li>They are not told. Blocking is silent</li>
          <li>You can undo this any time from Settings</li>
        </ul>
      </Modal>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="user"
        targetId={userId}
        targetLabel={`@${username}`}
      />
    </>
  );
}
