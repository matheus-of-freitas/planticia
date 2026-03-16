import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getAuthenticatedUser } from "../_shared/auth.ts";

serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const auth = await getAuthenticatedUser(request);
  if ("error" in auth) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { plantId, updates } = body;

  if (!plantId || !updates) {
    return new Response(JSON.stringify({ error: "Missing plantId or updates" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
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
    return new Response(JSON.stringify({ error: "Plant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (plant.user_id !== auth.userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { data, error } = await supabase
    .from("plants")
    .update(updates)
    .eq("id", plantId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ plant: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
