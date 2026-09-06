"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEventName } from "@/lib/analytics";

/**
 * Fires a single analytics event when a server-rendered screen mounts (14.1).
 * Kept as its own client component so pages stay server components.
 */
export function ViewTracker({
  event,
  properties,
}: {
  event: AnalyticsEventName;
  properties: Record<string, unknown>;
}) {
  const fired = useRef(false);
  const key = JSON.stringify(properties);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, JSON.parse(key) as Record<string, unknown>);
  }, [event, key]);

  return null;
}
