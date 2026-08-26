import { Webhook } from "svix"
import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: any

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return new Response("Verification failed", { status: 400 })
  }

  const eventType = evt.type

  if (eventType === "user.created") {

    const { id, first_name, last_name, email_addresses } = evt.data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fullName = [first_name, last_name].filter(Boolean).join(" ") || "TeenTrade User"
    const email = email_addresses?.[0]?.email_address || ""

    const { error } = await supabase.from("users").insert({
      clerk_id: id,
      name: fullName,
      email: email,
    })

    if (error) {
      console.error("Error creating user in Supabase:", error)
      return new Response("Error creating user", { status: 500 })
    }

    console.log(`New user created in Supabase: ${fullName}`)
  }

  return new Response("Webhook received", { status: 200 })
}

