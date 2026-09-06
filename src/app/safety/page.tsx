import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactModeration } from "@/components/ContactModeration";
import { Icon, type IconName } from "@/components/Icon";
import { MeetupLocationList } from "@/components/MeetupLocationList";
import { ReportEntryPoints } from "@/components/ReportEntryPoints";
import { PaymentNotice } from "@/components/PaymentNotice";
import { currentUser } from "@/lib/auth";
import { MEETUP_LOCATIONS } from "@/lib/constants";

export const metadata = { title: "Safety" };

/** 8.7 Safety hub. Route: /safety */
const GUIDELINES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "map-pin",
    title: "Meet in public",
    body: "Always meet at a verified meetup location. Never invite someone to your home or go to theirs.",
  },
  {
    icon: "users",
    title: "Bring someone",
    body: "Take a friend, a parent, or an older sibling with you to every handover.",
  },
  {
    icon: "eye",
    title: "Check before you pay",
    body: "Inspect the item in person before any money changes hands.",
  },
  {
    icon: "message",
    title: "Keep chat on TeenTrade",
    body: "Do not move conversations to WhatsApp or Telegram. On-platform messages are moderated.",
  },
  {
    icon: "lock",
    title: "Never share personal details",
    body: "Do not share your home address, school name, IC number, or bank details.",
  },
  {
    icon: "shield",
    title: "Trust your instincts",
    body: "If something feels wrong, stop and report it. You will not get in trouble for reporting.",
  },
];

export default async function SafetyPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/safety");

  return (
    <div className="tt-container" style={{ paddingBlock: "var(--space-8) var(--space-12)", maxWidth: 1080 }}>
      <h1 className="t-h1" style={{ marginTop: 0 }}>Safety</h1>
      <p className="t-body-lg" style={{ color: "var(--ink-secondary)", maxWidth: 640 }}>
        Everyone on TeenTrade is aged 13 to 19 and age verified. These are the habits that keep it that
        way, and the tools to use if something goes wrong.
      </p>

      {/* 1. Safety guidelines */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <h2 className="t-h2">Safety guidelines</h2>
        <div className="tt-guideline-grid">
          {GUIDELINES.map((guideline) => (
            <article key={guideline.title} className="card" style={{ padding: "var(--space-5)" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  background: "var(--green-subtle)",
                  color: "#047857",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "var(--space-3)",
                }}
              >
                <Icon name={guideline.icon} size={20} />
              </span>
              <h3 className="t-h3" style={{ margin: "0 0 4px" }}>{guideline.title}</h3>
              <p className="t-body" style={{ margin: 0, color: "var(--ink-secondary)" }}>
                {guideline.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 10.4 payment position */}
      <section style={{ marginTop: "var(--space-8)" }}>
        <PaymentNotice />
      </section>

      {/* 2. Verified meetup locations */}
      <section id="meetup-locations" style={{ marginTop: "var(--space-10)", scrollMarginTop: 130 }}>
        <h2 className="t-h2">Verified meetup locations</h2>
        <p className="t-body" style={{ color: "var(--ink-secondary)", maxWidth: 640 }}>
          {MEETUP_LOCATIONS.length} public, staffed places with CCTV: MRT station control areas, community
          centres, public library entrances and shopping mall information counters. Pick one near both of
          you.
        </p>
        <MeetupLocationList viewerRegion={user.region} />
      </section>

      {/* Prohibited items */}
      <section style={{ marginTop: "var(--space-10)" }}>
        <h2 className="t-h2">What cannot be listed</h2>
        <p className="t-body" style={{ color: "var(--ink-secondary)", maxWidth: 640 }}>
          Some things are not allowed on TeenTrade, either because they are illegal for teens in Singapore
          or because they are too easy to use for a scam.
        </p>
        <Link href="/safety/prohibited-items" className="btn btn-tertiary">
          <Icon name="ban" size={16} />
          See the prohibited items list
        </Link>
      </section>

      {/* 3. Report a problem */}
      <section id="report" style={{ marginTop: "var(--space-10)", scrollMarginTop: 130 }}>
        <h2 className="t-h2">Report a problem</h2>
        <p className="t-body" style={{ color: "var(--ink-secondary)", maxWidth: 640 }}>
          Reports are confidential. We never tell the other person who reported them, and you will not get
          in trouble for reporting something in good faith.
        </p>
        <ReportEntryPoints />
      </section>

      {/* 4. Contact moderation */}
      <section id="contact-moderation" style={{ marginTop: "var(--space-10)", scrollMarginTop: 130 }}>
        <h2 className="t-h2">Contact moderation</h2>
        <p className="t-body" style={{ color: "var(--ink-secondary)", maxWidth: 640 }}>
          For anything that does not fit a report. We reply within 24 hours.
        </p>
        <div className="panel" style={{ marginTop: "var(--space-4)", maxWidth: 640 }}>
          <ContactModeration />
        </div>
      </section>
    </div>
  );
}
