import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { recordEvent } from "@/lib/data";
import { readJson } from "@/lib/api";

/**
 * 14.1 — analytics sink. Always answers 204 so a failed event can never break
 * a user flow, and so sendBeacon does not retry.
 */
export async function POST(request: Request) {
  const body = await readJson<{ name?: string; properties?: Record<string, unknown> }>(request);

  if (body?.name) {
    const user = await currentUser();
    await recordEvent(body.name, user?.id ?? null, body.properties ?? {});
  }

  return new NextResponse(null, { status: 204 });
}
