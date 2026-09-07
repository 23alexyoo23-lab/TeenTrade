import type { NextConfig } from "next";

/**
 * Clerk serves its browser bundle from your instance's Frontend API host, which
 * differs per environment (obliging-duckling-85.clerk.accounts.dev in
 * development, clerk.yourdomain.com in production). That host is encoded in the
 * publishable key, so we decode it rather than hard-coding a domain that would
 * be wrong in the other environment.
 *
 * Key format: pk_test_<base64url of "host$">
 */
function clerkFrontendApiHost(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;

  const encoded = key.replace(/^pk_(test|live)_/, "");
  if (encoded === key) return null;

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8").replace(/\$+$/, "");
    // Guard against a malformed key turning into a junk CSP source.
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

const isDev = process.env.NODE_ENV === "development";
const clerkHost = clerkFrontendApiHost();

// In development the key may not be set when the config is evaluated, so allow
// the shared accounts.dev domain as a fallback. Production stays pinned to the
// one host the key names.
const clerkSources = [
  clerkHost ? `https://${clerkHost}` : null,
  isDev || !clerkHost ? "https://*.clerk.accounts.dev" : null,
].filter(Boolean) as string[];

// Clerk uses Cloudflare Turnstile for bot protection on sign-up.
const TURNSTILE = "https://challenges.cloudflare.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Section 13.4: security headers on every response.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(), microphone=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next injects inline bootstrap scripts; Clerk loads its bundle
              // from the Frontend API host resolved above.
              [
                "script-src 'self' 'unsafe-inline'",
                isDev ? "'unsafe-eval'" : "",
                ...clerkSources,
                TURNSTILE,
              ]
                .filter(Boolean)
                .join(" "),
              "style-src 'self' 'unsafe-inline'",
              // Clerk serves user avatars from img.clerk.com.
              "img-src 'self' data: blob: https://img.clerk.com",
              "font-src 'self' data:",
              [
                "connect-src 'self'",
                ...clerkSources,
                "https://clerk-telemetry.com",
                "https://*.clerk-telemetry.com",
              ].join(" "),
              // Clerk runs a web worker from a blob URL.
              "worker-src 'self' blob:",
              `frame-src 'self' ${TURNSTILE}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
