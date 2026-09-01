"use client"

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

const REASONS = [
  { id: "buy", label: "Buy", desc: "Browse and find good deals", emoji: "🛍️" },
  { id: "sell", label: "Sell", desc: "Clear out stuff you don't need", emoji: "📸" },
  { id: "trade", label: "Trade", desc: "Swap items with other teens", emoji: "🔁" },
]

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [transitioning, setTransitioning] = useState(false)

  // Now an array, since multiple reasons can be picked
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggleReason(id: string) {
    setLookingFor((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  // Smooth transition between steps instead of an instant swap
  function goToStep(next: number) {
    setTransitioning(true)
    setTimeout(() => {
      setStep(next)
      setTransitioning(false)
    }, 200)
  }

  async function handleFinish() {
    setSaving(true)

    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookingFor, interests }),
    })

    // Decide where to send them based on everything they picked.
    // Selling is the most "actionable" intent, so it takes priority,
    // then buying, then trading, then just fall back to the dashboard.
    if (lookingFor.includes("sell")) {
      router.push("/sell")
    } else if (lookingFor.includes("buy")) {
      router.push("/listings")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6 py-16 relative overflow-hidden">

      {/* Soft glow in the background for atmosphere */}
      <div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{
          width: 500,
          height: 500,
          top: "-10%",
          right: "-10%",
          background: "rgba(250,204,21,0.12)",
        }}
      />

      <div className="max-w-xl w-full relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-lg font-bold text-white">
            Teen<span className="text-yellow-400">Trade</span>
          </span>
        </div>

        {/* Progress bar -- fills based on step */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-gray-500 font-semibold mb-2 px-0.5">
            <span className={step === 1 ? "text-yellow-400" : ""}>What you're here for</span>
            <span className={step === 2 ? "text-yellow-400" : ""}>Your interests</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        {/* Card container with fade transition */}
        <div
          className="transition-all duration-200"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? "translateY(8px)" : "translateY(0)",
          }}
        >

          {/* ── STEP 1: What brings you here (multi-select) ── */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
                What brings you here?
              </h1>
              <p className="text-gray-400 text-center mb-2">
                Pick everything that applies -- most people do more than one.
              </p>
              {lookingFor.length > 0 && (
                <p className="text-yellow-400 text-xs font-semibold text-center mb-8">
                  {lookingFor.length} selected
                </p>
              )}
              {lookingFor.length === 0 && <div className="mb-8" />}

              <div className="flex flex-col gap-3">
                {REASONS.map((option) => {
                  const selected = lookingFor.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleReason(option.id)}
                      className="text-left rounded-2xl p-5 flex items-center gap-4 transition-all duration-200"
                      style={{
                        background: selected ? "#FACC15" : "rgba(255,255,255,0.05)",
                        border: selected ? "2px solid #FACC15" : "2px solid rgba(255,255,255,0.08)",
                        transform: selected ? "scale(1.01)" : "scale(1)",
                        boxShadow: selected ? "0 8px 24px rgba(250,204,21,0.25)" : "none",
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: selected ? "rgba(17,24,39,0.12)" : "rgba(255,255,255,0.06)" }}
                      >
                        {option.emoji}
                      </div>

                      <div className="flex-1">
                        <p
                          className="font-bold text-lg"
                          style={{ color: selected ? "#111827" : "#FFFFFF" }}
                        >
                          {option.label}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: selected ? "#374151" : "#9CA3AF" }}
                        >
                          {option.desc}
                        </p>
                      </div>

                      {/* Checkmark badge -- only shows when selected */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                        style={{
                          background: selected ? "#111827" : "transparent",
                          border: selected ? "none" : "2px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {selected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L4.5 8.5L10 3" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                disabled={lookingFor.length === 0}
                onClick={() => goToStep(2)}
                className="w-full mt-8 bg-yellow-400 disabled:bg-gray-800 disabled:text-gray-600 hover:bg-yellow-300 text-gray-900 font-bold py-4 rounded-xl transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── STEP 2: Category interests (multi-select) ── */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white text-center mb-2">
                What are you into?
              </h1>
              <p className="text-gray-400 text-center mb-2">
                Pick as many as you like. We&apos;ll show you these first.
              </p>
              {interests.length > 0 && (
                <p className="text-yellow-400 text-xs font-semibold text-center mb-8">
                  {interests.length} selected
                </p>
              )}
              {interests.length === 0 && <div className="mb-8" />}

              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const selected = interests.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleInterest(cat.id)}
                      className="relative rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-200"
                      style={{
                        background: selected ? "#FACC15" : "rgba(255,255,255,0.05)",
                        border: selected ? "2px solid #FACC15" : "2px solid rgba(255,255,255,0.08)",
                        transform: selected ? "scale(1.02)" : "scale(1)",
                        boxShadow: selected ? "0 8px 20px rgba(250,204,21,0.22)" : "none",
                      }}
                    >
                      {selected && (
                        <div
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#111827" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L4.5 8.5L10 3" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: selected ? "rgba(17,24,39,0.12)" : "rgba(255,255,255,0.06)" }}
                      >
                        {cat.emoji}
                      </div>
                      <span
                        className="text-sm font-semibold text-center leading-tight"
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
                  onClick={() => goToStep(1)}
                  className="text-white font-bold py-4 px-6 rounded-xl transition-colors hover:bg-white/5"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  Back
                </button>
                <button
                  disabled={saving}
                  onClick={handleFinish}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-gray-900 font-bold py-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"
                      />
                      Setting up...
                    </>
                  ) : (
                    "Finish"
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

