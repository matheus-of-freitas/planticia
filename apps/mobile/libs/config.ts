export const SUPABASE_FUNCTIONS_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export const SUPABASE_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
};
