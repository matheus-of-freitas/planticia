import { createClient } from "npm:@supabase/supabase-js@^2.39.7";
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

  const {
    imageUrl,
    species,
    commonName,
    wateringIntervalDays,
    lightPreference,
    description,
    lastWateredAt,
    notificationId,
  } = body;

  if (!species || !imageUrl) {
    return jsonResponse({ error: "Missing required fields" }, 400);
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
    .insert({
      user_id: auth.userId,
      name: commonName || species,
      scientific_name: species,
      image_url: imageUrl,
      watering_interval_days: wateringIntervalDays || 7,
      watering_hour: 11,
      last_watered_at: lastWateredAt || new Date().toISOString(),
      light_preference: lightPreference,
      description: description,
      notification_id: notificationId || null,
    })
    .select()
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ plant: data });
}
