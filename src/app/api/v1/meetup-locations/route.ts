import { apiOk, requireUser } from "@/lib/api";
import { MEETUP_LOCATIONS } from "@/lib/constants";
import type { Region } from "@/lib/types";

/** 12.6 GET /meetup-locations — filterable by region. */
export async function GET(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const region = new URL(request.url).searchParams.get("region") as Region | null;
  const data = region ? MEETUP_LOCATIONS.filter((l) => l.region === region) : MEETUP_LOCATIONS;

  return apiOk({ data });
}
