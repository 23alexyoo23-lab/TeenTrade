"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/** Clears the header's unread dot once the notifications page is opened. */
export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;

    void fetch("/api/v1/notifications/read", { method: "POST" })
      .then(() => router.refresh())
      .catch(() => {
        // The dot clearing late is not worth an error message.
      });
  }, [hasUnread, router]);

  return null;
}
