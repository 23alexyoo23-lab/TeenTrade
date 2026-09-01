// app/api/onboarding/route.ts
//
// This is a small API route -- when the onboarding page finishes,
// it sends the user's answers here, and this code saves them into
// the "users" table in Supabase, matched to the signed-in person.

import { currentUser } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const user = await currentUser()

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  const { lookingFor, interests } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from("users")
    .update({
      looking_for: lookingFor,
      interests: interests,
    })
    .eq("clerk_id", user.id)

  if (error) {
    console.error("Error saving onboarding answers:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}


