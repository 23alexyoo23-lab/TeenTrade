"use client"

import { useState, useEffect } from "react"
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

const ANIMATED_LISTINGS = [
  { emoji: "📚", title: "IGCSE Maths Textbook", price: "S$ 12", category: "Books", color: "#DBEAFE" },
  { emoji: "👟", title: "Nike Air Force 1 US8", price: "S$ 45", category: "Shoes", color: "#FEF3C7" },
  { emoji: "🎧", title: "Sony Headphones XM4", price: "S$ 180", category: "Electronics", color: "#F3E8FF" },
  { emoji: "👕", title: "H&M Puffer Jacket S", price: "S$ 20", category: "Clothes", color: "#DCFCE7" },
  { emoji: "🎮", title: "Nintendo Switch Lite", price: "S$ 150", category: "Electronics", color: "#FEE2E2" },
  { emoji: "🎒", title: "Adidas School Bag", price: "S$ 25", category: "Bags", color: "#FFEDD5" },
]

const CYCLING_WORDS = ["teens.", "students.", "you."]

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0)
  const [visibleCards, setVisibleCards] = useState([0, 1, 2])
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setVisibleCards((prev) => prev.map((i) => (i + 1) % ANIMATED_LISTINGS.length))
        setAnimating(false)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            Teen<span className="text-yellow-400">Trade</span>
          </span>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="/listings" className="hover:text-gray-900">Browse</a>
            <a href="/sell" className="hover:text-gray-900">Sell</a>
          </div>
          <div className="flex gap-3 items-center">
            <SignedOut>
              <SignInButton mode="modal">
                <span className="text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer">
                  Sign in
                </span>
              </SignInButton>
              <SignUpButton mode="modal">
                <span className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-bold px-4 py-2 rounded-lg cursor-pointer">
                  Join free
                </span>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      <section className="bg-gray-900 flex items-center overflow-hidden" style={{ minHeight: "90vh" }}>
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center py-20">

            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
                style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.3)" }}
              >
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                <span className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">
                  Singapore teens only
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tight mb-6">
                Buy, sell, trade <br />
                with other{" "}
                <span
                  className="text-yellow-400"
                  style={{ opacity: animating ? 0 : 1, transition: "opacity 0.3s ease" }}
                >
                  {CYCLING_WORDS[wordIndex]}
                </span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
                Safe, simple, and made for Singapore students aged 13 to 18.
                Clear out your room or find a bargain near you.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <a
                  href="/listings"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-base"
                >
                  Browse listings
                </a>
                <a
                  href="/sell"
                  className="text-white font-bold px-8 py-4 rounded-xl text-base"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Sell something
                </a>
              </div>

              <div className="flex gap-8">
                <div>
                  <div className="text-2xl font-black text-white">100%</div>
                  <div className="text-gray-500 text-xs mt-1">Teen verified</div>
                </div>
                <div className="w-px bg-gray-700"></div>
                <div>
                  <div className="text-2xl font-black text-white">Free</div>
                  <div className="text-gray-500 text-xs mt-1">To join</div>
                </div>
                <div className="w-px bg-gray-700"></div>
                <div>
                  <div className="text-2xl font-black text-white">SG</div>
                  <div className="text-gray-500 text-xs mt-1">Students only</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative">

                <div
                  className="absolute inset-0 rounded-full blur-3xl"
                  style={{ background: "rgba(250,204,21,0.2)", transform: "scale(0.75)" }}
                ></div>

                <div
                  className="relative bg-gray-800 p-4 w-72 shadow-2xl"
                  style={{ borderRadius: "40px", border: "2px solid #4B5563" }}
                >
                  <div className="w-20 h-1.5 bg-gray-600 rounded-full mx-auto mb-4"></div>

                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-white font-black text-lg">
                      Teen<span className="text-yellow-400">Trade</span>
                    </span>
                    <span className="text-gray-400 text-xl">🔍</span>
                  </div>

                  <div className="flex gap-2 mb-4 overflow-hidden">
                    {["All", "Books", "Shoes", "Electronics"].map((cat, i) => (
                      <span
                        key={cat}
                        className="text-xs px-3 py-1 rounded-full whitespace-nowrap font-semibold"
                        style={{
                          background: i === 0 ? "#FACC15" : "#374151",
                          color: i === 0 ? "#111827" : "#9CA3AF",
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3">
                    {visibleCards.map((listingIndex, cardPosition) => {
                      const listing = ANIMATED_LISTINGS[listingIndex]
                      return (
                        <div
                          key={cardPosition}
                          className="rounded-2xl p-3 flex gap-3 items-center"
                          style={{
                            background: "rgba(55,65,81,0.6)",
                            opacity: animating ? 0 : 1,
                            transform: animating ? "translateY(8px)" : "translateY(0)",
                            transition: "opacity 0.4s ease, transform 0.4s ease",
                            transitionDelay: `${cardPosition * 60}ms`,
                          }}
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: listing.color }}
                          >
                            {listing.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                              {listing.category}
                            </p>
                            <p className="text-white text-sm font-semibold truncate mt-1">
                              {listing.title}
                            </p>
                          </div>
                          <div className="text-yellow-400 font-black text-sm flex-shrink-0">
                            {listing.price}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-around mt-4 pt-3 border-t border-gray-700">
                    <span className="text-yellow-400 text-xl">🏠</span>
                    <span className="text-gray-500 text-xl">🔍</span>
                    <span className="text-gray-500 text-xl">➕</span>
                    <span className="text-gray-500 text-xl">👤</span>
                  </div>
                </div>

                <div
                  className="absolute bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2 animate-bounce"
                  style={{ top: "-12px", right: "-12px" }}
                >
                  <span className="text-base">🎉</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">New listing!</p>
                    <p className="text-xs text-gray-400">Just posted</p>
                  </div>
                </div>

                <div
                  className="absolute bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-2"
                  style={{ bottom: "-12px", left: "-12px" }}
                >
                  <span className="text-base">✅</span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Verified teen</p>
                    <p className="text-xs text-gray-400">Safe to buy</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-black text-gray-900 text-center mb-14">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { emoji: "📸", title: "1. List your item", desc: "Take a few photos, set your price, and post in under 2 minutes." },
            { emoji: "💬", title: "2. Chat or trade", desc: "Buyers message you directly. Swap items or sell for cash." },
            { emoji: "🤝", title: "3. Meet and swap", desc: "Meet at school or somewhere nearby. Hand over the item, get paid." },
          ].map((step) => (
            <div key={step.title} className="bg-white rounded-2xl border border-gray-100 p-8">
              <div className="text-5xl mb-5">{step.emoji}</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900">Latest listings</h2>
            <a href="/listings" className="text-sm font-semibold text-yellow-500 hover:underline">
              See all
            </a>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ANIMATED_LISTINGS.slice(0, 4).map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                <div
                  className="h-36 flex items-center justify-center text-4xl"
                  style={{ background: item.color }}
                >
                  {item.emoji}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                    {item.category}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm mt-1">{item.title}</p>
                  <p className="font-black text-gray-900 mt-2">{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-gray-400 border-t border-gray-100">
        <p>
          Teen<span className="text-yellow-400 font-bold">Trade</span> -- Buy, Sell, Trade
        </p>
      </footer>

    </div>
  )
}
