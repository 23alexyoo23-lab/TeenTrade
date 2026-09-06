import { apiOk, requireUser } from "@/lib/api";
import { offersReceivedBy } from "@/lib/data";
import { hydrateOffer } from "@/lib/offers";

/** 12.4 GET /offers/received */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const offers = await offersReceivedBy(auth.user.id);
  const data = await Promise.all(offers.map((offer) => hydrateOffer(offer, auth.user.id)));

  return apiOk({ data });
}
