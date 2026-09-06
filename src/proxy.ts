import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next.js 16 renamed the `middleware` file convention to `proxy`. Because this
 * project keeps its routes in `src/app`, this file has to sit at `src/proxy.ts`
 * — Clerk looks for it there and will not attach the session otherwise.
 *
 * This only attaches the Clerk session so `auth()` works. Deciding who may see
 * what is left to the pages and route handlers, which need the TeenTrade
 * profile (account status, parental consent) and not just a Clerk session.
 */

// The Clerk webhook is signed with svix and authenticates itself.
const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isWebhookRoute(request)) return;
});

export const config = {
  matcher: [
    // Everything except static files and Next internals.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
};
