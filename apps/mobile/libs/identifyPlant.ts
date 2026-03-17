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

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || data.msg || `Request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return data;
}
