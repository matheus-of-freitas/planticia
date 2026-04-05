import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/response.ts";

export async function handler(req: Request): Promise<Response> {
  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const plantId = url.searchParams.get("plantId");
  if (!plantId) {
    return jsonResponse({ error: "Missing plantId" }, 400);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", plantId)
    .eq("user_id", auth.userId)
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ plant: data });
}
