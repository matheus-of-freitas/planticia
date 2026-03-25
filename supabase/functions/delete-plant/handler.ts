import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "../_shared/auth.ts";

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
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { plantId } = body;

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

  const { data: plant, error: fetchError } = await supabase
    .from("plants")
    .select("image_url, user_id")
    .eq("id", plantId)
    .single();

  if (fetchError || !plant) {
    return new Response(JSON.stringify({ error: "Plant not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (plant.user_id !== auth.userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: deleteError } = await supabase
    .from("plants")
    .delete()
    .eq("id", plantId);

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
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
}
