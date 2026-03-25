import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_shared/auth.ts";

export async function handler(req: Request): Promise<Response> {
  const auth = await getAuthenticatedUser(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const plantId = url.searchParams.get("plantId");
  if (!plantId) {
    return new Response(JSON.stringify({ error: "Missing plantId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ plant: data }), {
    headers: { "Content-Type": "application/json" },
  });
}
