import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConsentBanner } from "@/components/ConsentBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/Toast";
import { currentUser } from "@/lib/auth";
import { toPublicUser, totalUnreadMessages, unreadNotificationCount } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TeenTrade — Buy. Sell. Trade. Made for teens.",
    template: "%s · TeenTrade",
  },
  description:
    "The safe and easy way for teens in Singapore to buy, sell or trade second-hand items.",
};

/**
 * Every screen reads live marketplace data and the caller's session, so none of
 * them can be prerendered at build time. Setting this on the root layout keeps
 * the build from reaching for the database, and applies to every route below.
 */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFC629",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  const [unreadMessages, unreadNotifications] = user
    ? await Promise.all([totalUnreadMessages(user.id), unreadNotificationCount(user.id)])
    : [0, 0];

  return (
    <ClerkProvider>
      <html lang="en-SG">
        <body>
          <ToastProvider>
            <a href="#main" className="skip-link">
              Skip to main content
            </a>

            {user?.account_status === "pending_consent" ? <ConsentBanner /> : null}

            <Header
              user={user ? toPublicUser(user) : null}
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />

            <main id="main" tabIndex={-1} style={{ outline: "none" }}>
              {children}
            </main>

            <Footer />
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
