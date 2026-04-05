import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_shared/auth.ts";
import { jsonResponse } from "../_shared/response.ts";

export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { plantId, updates } = body;

  if (!plantId || !updates) {
    return jsonResponse({ error: "Missing plantId or updates" }, 400);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Verify ownership
  const { data: plant, error: fetchError } = await supabase
    .from("plants")
    .select("user_id")
    .eq("id", plantId)
    .single();

  if (fetchError || !plant) {
    return jsonResponse({ error: "Plant not found" }, 404);
  }

  if (plant.user_id !== auth.userId) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }

  const { data, error } = await supabase
    .from("plants")
    .update(updates)
    .eq("id", plantId)
    .select()
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ plant: data });
}
