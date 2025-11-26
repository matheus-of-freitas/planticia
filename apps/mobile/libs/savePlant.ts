import { supabase } from "./supabaseClient";

interface SavePlantParams {
  imageUrl: string;
  species: string;
  commonName?: string | null;
  confidence?: number;
}

/**
 * Inserts a plant for the currently authenticated user.
 * Returns the inserted row.
 */
export async function savePlant({ imageUrl, species, commonName }: SavePlantParams) {
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
      // watering_interval_days: 3, // you can pass or use DB default
      // light_preference: null,
      // description: null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error inserting plant:", error);
    throw error;
  }

  return data;
}
