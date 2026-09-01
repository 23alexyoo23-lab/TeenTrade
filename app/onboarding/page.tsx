"use client"
// This page needs "use client" because it's interactive --
// the user clicks things and the screen updates immediately,
// before anything is saved to the database.

import { useState } from "react"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  { id: "fashion", label: "Fashion & Clothes", emoji: "👕" },
  { id: "shoes", label: "Shoes", emoji: "👟" },
  { id: "textbooks", label: "Textbooks & Notes", emoji: "📚" },
  { id: "electronics", label: "Electronics", emoji: "🎧" },
  { id: "collectibles", label: "Collectibles", emoji: "🎮" },
  { id: "bags", label: "Bags & Accessories", emoji: "🎒" },
]

export default function OnboardingPage() {
  const router = useRouter()

  // Which step of the onboarding the user is on: 1 or 2
  const [step, setStep] = useState(1)

  // What they picked for "what are you here for"
  const [lookingFor, setLookingFor] = useState<string | null>(null)

  // Which categories they've selected (can pick more than one)
  const [interests, setInterests] = useState<string[]>([])

  const [saving, setSaving] = useState(false)

  // Toggle a category on/off when clicked
  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Called when the user finishes step 2 and hits "Finish"
  async function handleFinish() {
    setSaving(true)

    // Send the answers to our API route, which saves them to Supabase
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookingFor, interests }),
    })

    // Redirect based on what they said they're here for
    if (lookingFor === "buy") {
      router.push("/listings")
    } else if (lookingFor === "sell") {
      router.push("/sell")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? "w-8 bg-yellow-400" : "w-8 bg-gray-600"}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? "w-8 bg-yellow-400" : "w-8 bg-gray-600"}`} />
        </div>

        {/* ── STEP 1: Buy, Sell, or Trade ────────────────────── */}
        {step === 1 && (
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest text-center mb-3">
              Step 1 of 2
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
              What brings you here?
            </h1>
            <p className="text-gray-400 text-center mb-10">
              We&apos;ll set up your TeenTrade based on this.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { id: "buy", label: "I want to buy", desc: "Browse and find good deals", emoji: "🛍️" },
                { id: "sell", label: "I want to sell", desc: "Clear out stuff you don't need", emoji: "📸" },
                { id: "trade", label: "I want to trade", desc: "Swap items with other teens", emoji: "🔁" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setLookingFor(option.id)}
                  className="text-left rounded-2xl p-5 flex items-center gap-4 transition-all"
                  style={{
                    background: lookingFor === option.id ? "#FACC15" : "rgba(255,255,255,0.06)",
                    border: lookingFor === option.id ? "2px solid #FACC15" : "2px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <div>
                    <p
                      className="font-bold text-lg"
                      style={{ color: lookingFor === option.id ? "#111827" : "#FFFFFF" }}
                    >
                      {option.label}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: lookingFor === option.id ? "#374151" : "#9CA3AF" }}
                    >
                      {option.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <button
              disabled={!lookingFor}
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-bold py-4 rounded-xl transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── STEP 2: Category interests ─────────────────────── */}
        {step === 2 && (
          <div>
            <p className="text-yellow-400 text-xs font-semibold uppercase tracking-widest text-center mb-3">
              Step 2 of 2
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
              What are you into?
            </h1>
            <p className="text-gray-400 text-center mb-10">
              Pick as many as you like. We&apos;ll show you these first.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const selected = interests.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleInterest(cat.id)}
                    className="rounded-2xl p-4 flex flex-col items-center gap-2 transition-all"
                    style={{
                      background: selected ? "#FACC15" : "rgba(255,255,255,0.06)",
                      border: selected ? "2px solid #FACC15" : "2px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span
                      className="text-sm font-semibold text-center"
                      style={{ color: selected ? "#111827" : "#FFFFFF" }}
                    >
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="text-white font-bold py-4 px-6 rounded-xl"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Back
              </button>
              <button
                disabled={saving}
                onClick={handleFinish}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-bold py-4 rounded-xl transition-colors"
              >
                {saving ? "Setting up..." : "Finish"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}


