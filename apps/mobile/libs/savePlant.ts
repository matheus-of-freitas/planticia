import { supabase } from "./supabaseClient";
import { scheduleWateringNotification } from "./notifications";
import { SUPABASE_FUNCTIONS_URL, SUPABASE_HEADERS } from "./config";

interface SavePlantParams {
  imageUrl: string;
  species: string;
  commonName?: string | null;
  confidence?: number;
  wateringIntervalDays?: number;
  lightPreference?: string | null;
  description?: string | null;
  lastWateredAt?: string;
}

/**
 * Inserts a plant for the currently authenticated user.
 * Returns the inserted row.
 */
export async function savePlant({
  imageUrl,
  species,
  commonName,
  wateringIntervalDays,
  lightPreference,
  description,
  lastWateredAt,
}: SavePlantParams) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error getting user:", userError);
    throw userError;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  const plantName = commonName || species;
  const wateringDays = wateringIntervalDays || 7;
  const lastWateredDate = lastWateredAt || new Date().toISOString();

  const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/plant-create`, {
    method: "POST",
    headers: SUPABASE_HEADERS,
    body: JSON.stringify({
      userId: user.id,
      imageUrl,
      species,
      commonName,
      wateringIntervalDays: wateringDays,
      lightPreference,
      description,
      lastWateredAt: lastWateredDate,
    }),
  });
  const json = await response.json();
  if (!response.ok || json.error) {
    console.error("Error inserting plant via edge function:", json.error);
    throw new Error(json.error || "Unknown error");
  }

  let notificationId: string | null = null;
  try {
    notificationId = await scheduleWateringNotification(
      json.plant.id,
      plantName,
      wateringDays,
      lastWateredDate,
      11
    );

    await fetch(`${SUPABASE_FUNCTIONS_URL}/update-notification`, {
      method: "POST",
      headers: SUPABASE_HEADERS,
      body: JSON.stringify({ plantId: json.plant.id, notificationId }),
    });
  } catch (notificationError) {
    console.error("Error scheduling or linking notification:", notificationError);
  }

  if (species) {
    fetch(
      `${SUPABASE_FUNCTIONS_URL}/get-care-tips?scientific_name=${encodeURIComponent(
        species
      )}&plant_name=${encodeURIComponent(plantName)}`,
      { headers: SUPABASE_HEADERS }
    ).catch((err) => {
      console.log("Background care tips caching failed (non-critical):", err);
    });
  }

  return json.plant;
}
