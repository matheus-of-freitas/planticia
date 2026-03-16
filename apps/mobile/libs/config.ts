import { supabase } from "./supabaseClient";

export const SUPABASE_FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

/**
 * Returns headers with the current user's session JWT for authenticated
 * edge function calls. Falls back to the anon key if no session exists.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
