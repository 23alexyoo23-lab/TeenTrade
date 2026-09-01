// app/api/onboarding/route.ts

import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  // lookingFor is now an array too, e.g. ["buy", "sell"]
  const { lookingFor, interests } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from("users")
    .update({
      looking_for: lookingFor,   // now saved as an array/list, not a single word
      interests: interests,
    })
    .eq("clerk_id", user.id)

  if (error) {
    console.error("Error saving onboarding answers:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

