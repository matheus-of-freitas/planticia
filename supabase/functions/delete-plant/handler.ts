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

  const { plantId } = body;

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

  const { data: plant, error: fetchError } = await supabase
    .from("plants")
    .select("image_url, user_id")
    .eq("id", plantId)
    .single();

  if (fetchError || !plant) {
    return jsonResponse({ error: "Plant not found" }, 404);
  }

  if (plant.user_id !== auth.userId) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }

  const { error: deleteError } = await supabase
    .from("plants")
    .delete()
    .eq("id", plantId);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
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

  return jsonResponse({ success: true });
}
