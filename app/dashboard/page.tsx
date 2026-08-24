// app/dashboard/page.tsx
//
// This is the page a user lands on right after signing in or signing up.
// It's different from the homepage (app/page.tsx) because that page is
// for visitors who haven't signed in yet. This page is personal --
// it knows who you are and shows things relevant to you.

import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

// This runs on the server, before the page is sent to the browser.
// That's why we can safely use currentUser() here -- it checks
// who is signed in using the request itself.
export default async function DashboardPage() {

  const user = await currentUser()

  // If somehow a signed-out person lands here, send them home instead
  if (!user) {
    redirect("/")
  }

  // Connect to Supabase to fetch this user's own listings
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: myListings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })

  const listings = myListings || []
  const firstName = user.firstName || "there"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* NAVBAR -- same as homepage, but simpler since user is signed in */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Teen<span className="text-yellow-400">Trade</span>
          </Link>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <Link href="/listings" className="hover:text-gray-900">Browse</Link>
            <Link href="/sell" className="hover:text-gray-900">Sell</Link>
            <Link href="/dashboard" className="text-gray-900 font-semibold">My account</Link>
          </div>
        </div>
      </nav>


      {/* WELCOME BANNER */}
      <section className="bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Welcome back
          </p>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Hey {firstName} 👋
          </h1>
          <p className="text-gray-400 text-lg mt-3 max-w-lg">
            Ready to clear out your room or find something new? Here&apos;s your TeenTrade home base.
          </p>
        </div>
      </section>


      {/* QUICK ACTIONS */}
      <section className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Link
            href="/sell"
            className="bg-yellow-400 hover:bg-yellow-300 rounded-2xl p-6 shadow-lg flex items-center justify-between transition-colors"
          >
            <div>
              <p className="text-gray-900 font-black text-xl">Sell something</p>
              <p className="text-gray-800 text-sm mt-1">List an item in under 2 minutes</p>
            </div>
            <span className="text-3xl">📸</span>
          </Link>

          <Link
            href="/listings"
            className="bg-white hover:bg-gray-50 rounded-2xl p-6 shadow-lg flex items-center justify-between transition-colors border border-gray-100"
          >
            <div>
              <p className="text-gray-900 font-black text-xl">Browse listings</p>
              <p className="text-gray-500 text-sm mt-1">See what other teens are trading</p>
            </div>
            <span className="text-3xl">🔍</span>
          </Link>

        </div>
      </section>


      {/* MY LISTINGS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">My listings</h2>
          {listings.length > 0 && (
            <span className="text-sm text-gray-400">{listings.length} item{listings.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {listings.length === 0 ? (

          /* EMPTY STATE -- shown when the user has no listings yet */
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-900 font-bold text-lg mb-2">
              You haven&apos;t listed anything yet
            </p>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Got old textbooks, shoes, or gadgets lying around? Post your first item and start trading.
            </p>
            <Link
              href="/sell"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm"
            >
              List your first item
            </Link>
          </div>

        ) : (

          /* REAL LISTINGS -- shown once the user has posted at least one item */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="h-32 bg-gray-100 flex items-center justify-center text-3xl">
                  📦
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    {item.category}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm mt-1 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-black text-gray-900">S$ {item.price}</p>
                    {item.willing_to_trade && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                        Open to trade
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

