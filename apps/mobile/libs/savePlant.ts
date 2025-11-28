import { supabase } from "./supabaseClient";
import { scheduleWateringNotification } from "./notifications";

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

  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: plantName,
      scientific_name: species,
      image_url: imageUrl,
      watering_interval_days: wateringDays,
      watering_hour: 11,
      last_watered_at: lastWateredDate,
      light_preference: lightPreference,
      description: description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting plant:", error);
    throw error;
  }

  try {
    const notificationId = await scheduleWateringNotification(
      data.id,
      plantName,
      wateringDays,
      lastWateredDate,
      11
    );

    await supabase.from("plants").update({ notification_id: notificationId }).eq("id", data.id);
  } catch (notificationError) {
    console.error("Error scheduling notification:", notificationError);
  }

  return data;
}
