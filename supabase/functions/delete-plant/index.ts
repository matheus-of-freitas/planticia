import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { plantId, userId } = body;

  if (!plantId || !userId) {
    return new Response(JSON.stringify({ error: "Missing plantId or userId" }), {
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

  const { data: plant, error: fetchError } = await supabase
    .from("plants")
    .select("image_url, user_id")
    .eq("id", plantId)
    .single();

  if (fetchError || !plant) {
    return new Response(JSON.stringify({ error: "Plant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (plant.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { error: deleteError } = await supabase
    .from("plants")
    .delete()
    .eq("id", plantId);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (plant.image_url) {
    try {
      const urlParts = plant.image_url.split("/plant-images/");
      if (urlParts.length === 2) {
        const imagePath = urlParts[1];
        await supabase.storage.from("plant-images").remove([imagePath]);
        console.log(`Deleted image: ${imagePath}`);
      }
    } catch (storageError) {
      console.error("Error deleting image from storage:", storageError);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
