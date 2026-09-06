import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Supabase client every read and write goes through.
 *
 * This replaces the JSON-backed store the project started with. The repository
 * functions in `data.ts` are still the only callers, so the swap stayed
 * contained to these two files.
 *
 * The server-side client uses the service role key, which bypasses row level
 * security. That is deliberate: authorisation is enforced in the API layer
 * (`api.ts` and the route handlers), which already knows the caller, and the
 * server components in `src/app` render for a user we have already resolved.
 * The service role key must therefore never reach the browser — it is read
 * from a non-`NEXT_PUBLIC_` variable and this module is `server-only`.
 */

const globalForSupabase = globalThis as unknown as { __teentradeSupabase?: SupabaseClient };

export function sb(): SupabaseClient {
  if (globalForSupabase.__teentradeSupabase) return globalForSupabase.__teentradeSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "in .env.local — see .env.example and the Setup section of the README.",
    );
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  globalForSupabase.__teentradeSupabase = client;
  return client;
}

/**
 * Supabase returns `{ data, error }` rather than throwing. These two helpers
 * turn that into ordinary values and exceptions so the repository functions
 * read the way they did over the in-memory store.
 */

interface Result<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/** Unwraps a query expected to return a set of rows. */
export async function rows<T>(query: PromiseLike<Result<T[]>>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data ?? [];
}

/** Unwraps a query expected to return one row, or none. */
export async function maybeRow<T>(query: PromiseLike<Result<T>>): Promise<T | undefined> {
  const { data, error } = await query;
  // PGRST116 is "no rows returned" from `.single()`, which is not an error here.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  return data ?? undefined;
}

/** Runs a write and throws on failure. */
export async function run(query: PromiseLike<Result<unknown>>): Promise<void> {
  const { error } = await query;
  if (error) throw new Error(`Supabase write failed: ${error.message}`);
}
