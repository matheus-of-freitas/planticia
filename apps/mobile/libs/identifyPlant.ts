import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "./config";

export async function identifyPlant(imageBase64: string, mimeType: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${SUPABASE_FUNCTIONS_URL}/identify`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        image_base64: imageBase64,
        mime_type: mimeType
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to identify plant");
  }

  return data;
}
