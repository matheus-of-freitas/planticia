import { SupabaseClient } from "@supabase/supabase-js";

const UNSPLASH_API = "https://api.unsplash.com";

interface StockPhotoResult {
  imageUrl: string;
  attribution: string;
  photographerName: string;
  photographerUrl: string;
}

/**
 * Fetches a high-quality stock photo for a plant species from Unsplash.
 * Results are cached in the stock_photos table (including negative results).
 * Never throws — returns null on any error.
 */
export async function fetchStockPhoto(
  scientificName: string,
  commonName: string,
  supabase: SupabaseClient,
): Promise<StockPhotoResult | null> {
  const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!unsplashKey) {
    console.warn("UNSPLASH_ACCESS_KEY not set, skipping stock photo fetch");
    return null;
  }

  if (!scientificName) return null;

  try {
    // 1. Check cache
    const { data: cached } = await supabase
      .from("stock_photos")
      .select("image_url, attribution, photographer_name, photographer_url")
      .eq("scientific_name", scientificName)
      .maybeSingle();

    if (cached) {
      // Negative cache — no photo exists for this species
      if (!cached.image_url) return null;
      return {
        imageUrl: cached.image_url,
        attribution: cached.attribution,
        photographerName: cached.photographer_name,
        photographerUrl: cached.photographer_url,
      };
    }

    // 2. Search Unsplash — try scientific name first
    let photo = await searchUnsplash(scientificName, unsplashKey);

    // 3. Fallback to common name
    if (!photo && commonName) {
      photo = await searchUnsplash(commonName, unsplashKey);
    }

    // 4. Cache result (positive or negative)
    if (photo) {
      await supabase.from("stock_photos").upsert({
        scientific_name: scientificName,
        image_url: photo.imageUrl,
        attribution: photo.attribution,
        photographer_name: photo.photographerName,
        photographer_url: photo.photographerUrl,
        source: "unsplash",
      }, { onConflict: "scientific_name" });

      return photo;
    } else {
      // Negative cache
      await supabase.from("stock_photos").upsert({
        scientific_name: scientificName,
        image_url: "",
        attribution: null,
        photographer_name: null,
        photographer_url: null,
        source: "unsplash",
      }, { onConflict: "scientific_name" });

      return null;
    }
  } catch (err) {
    console.error("Stock photo fetch failed (non-critical):", err);
    return null;
  }
}

async function searchUnsplash(query: string, accessKey: string): Promise<StockPhotoResult | null> {
  const url = new URL(`${UNSPLASH_API}/search/photos`);
  url.searchParams.set("query", `${query} plant`);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "squarish");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
    },
  });

  if (!res.ok) {
    console.error("Unsplash API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const photo = data.results?.[0];

  if (!photo) return null;

  const photographerName = photo.user?.name || "Unknown";
  const photographerUrl = photo.user?.links?.html || "https://unsplash.com";

  return {
    imageUrl: `${photo.urls.regular}&w=800&q=80`,
    attribution: `Foto por ${photographerName} no Unsplash`,
    photographerName,
    photographerUrl,
  };
}
