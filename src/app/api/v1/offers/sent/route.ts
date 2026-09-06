import { apiOk, requireUser } from "@/lib/api";
import { offersSentBy } from "@/lib/data";
import { hydrateOffer } from "@/lib/offers";

/** 12.4 GET /offers/sent */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const offers = await offersSentBy(auth.user.id);
  const data = await Promise.all(offers.map((offer) => hydrateOffer(offer, auth.user.id)));

  return apiOk({ data });
}
