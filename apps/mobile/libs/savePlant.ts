import { supabase } from "./supabaseClient";

interface SavePlantParams {
  imageUrl: string;
  species: string;
  commonName?: string | null;
  confidence?: number;
  wateringIntervalDays?: number;
  lightPreference?: string | null;
  description?: string | null;
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
  description
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

  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: user.id,
      name: commonName || species,
      scientific_name: species,
      image_url: imageUrl,
      watering_interval_days: wateringIntervalDays || 7,
      light_preference: lightPreference,
      description: description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting plant:", error);
    throw error;
  }

  return data;
}
