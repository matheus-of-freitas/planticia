export async function identifyPlant(imageUrl: string) {
  const res = await fetch(
    "https://ubwoxfprrhpcjboyturx.functions.supabase.co/identify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to identify plant");
  }

  return data;
}
