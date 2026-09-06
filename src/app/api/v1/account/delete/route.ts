import { NextResponse } from "next/server";
import { apiOk, requireUser } from "@/lib/api";
import { updateUser } from "@/lib/data";

/**
 * 10.5 — users can request account deletion from Settings. The account is
 * marked deleted immediately and disappears from the product; the hard delete
 * runs within 30 days.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  await updateUser(auth.user.id, {
    account_status: "deleted",
    deleted_at: new Date().toISOString(),
  });

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/welcome?deleted=1", request.url), 303);
  }
  return apiOk({ deletion_requested: true, completes_within_days: 30 });
}
