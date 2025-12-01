import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
serve(async (request: Request) => {
  const url = new URL(request.url);
  const plantId = url.searchParams.get("plantId");
  if (!plantId) {
    return new Response(JSON.stringify({ error: "Missing plantId" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const PROJECT_URL = Deno.env.get("PROJECT_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", plantId)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ plant: data }), {
    headers: { "Content-Type": "application/json" },
  });
});
