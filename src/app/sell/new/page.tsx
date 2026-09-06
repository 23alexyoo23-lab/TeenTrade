import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { ListingFlow } from "@/components/ListingFlow";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "List an item" };

/** 8.4 to 8.6 — the three-step create listing flow. Route: /sell/new */
export default async function NewListingPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/sell/new");

  // 15.5 — under-16 accounts cannot publish before parental consent.
  if (user.account_status !== "active") {
    return (
      <div className="tt-container" style={{ paddingBlock: "var(--space-12)", maxWidth: 640 }}>
        <h1 className="t-h1" style={{ marginTop: 0 }}>You cannot list items yet</h1>
        <Banner tone="amber" icon="users" title="Waiting for your parent or guardian">
          Once they confirm your account you will be able to publish listings and message other teens. Use
          the Resend email button in the banner at the top of the page if they have not received it.
        </Banner>
      </div>
    );
  }

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 1080 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>List an item</h1>
      <p className="t-body" style={{ color: "var(--ink-secondary)", marginBottom: "var(--space-6)" }}>
        Three steps: add photos, fill in the details, then choose whether you want to sell, trade or give it
        away.
      </p>

      <ListingFlow mode="create" defaultRegion={user.region} />
    </div>
  );
}
