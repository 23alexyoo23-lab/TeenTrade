import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isWebhookRoute = createRouteMatcher(["/api/webhooks(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isWebhookRoute(req)) {
    return
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?)).*)",
    "/(api|trpc)(.*)",
  ],
}


