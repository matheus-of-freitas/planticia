export async function identifyPlant(imageBase64: string, mimeType: string) {
  const res = await fetch(
    "https://ubwoxfprrhpcjboyturx.functions.supabase.co/identify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
