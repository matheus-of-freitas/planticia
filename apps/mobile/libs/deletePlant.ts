import { supabase } from "./supabaseClient";
import { cancelPlantNotifications } from "./notifications";

/**
 * Deletes a plant and cancels its notifications
 */
export async function deletePlant(plantId: string): Promise<void> {
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

  try {
    await cancelPlantNotifications(plantId);
  } catch (notificationError) {
    console.error("Error cancelling notifications:", notificationError);
  }

  const response = await fetch(
    "https://ubwoxfprrhpcjboyturx.functions.supabase.co/delete-plant",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plantId, userId: user.id }),
    }
  );

  const json = await response.json();

  if (!response.ok || json.error) {
    console.error("Error deleting plant via edge function:", json.error);
    throw new Error(json.error || "Failed to delete plant");
  }
}
