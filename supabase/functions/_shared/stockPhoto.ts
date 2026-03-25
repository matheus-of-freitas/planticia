import { SupabaseClient } from "@supabase/supabase-js";

const UNSPLASH_API = "https://api.unsplash.com";
const STOCK_PHOTO_MATCHER_VERSION = "5";

interface StockPhotoResult {
  imageUrl: string;
  attribution: string;
  photographerName: string;
  photographerUrl: string;
}

interface CachedStockPhotoRow {
  image_url: string;
  attribution: string | null;
  photographer_name: string | null;
  photographer_url: string | null;
  matcher_version?: string | null;
}

/**
 * Fetches a high-quality stock photo for a plant species from Unsplash.
 * Searches by Portuguese common name first, then falls back to scientific name.
 * Trusts Unsplash's search relevance — takes the top result.
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
      .select("image_url, attribution, photographer_name, photographer_url, matcher_version")
      .eq("scientific_name", scientificName)
      .maybeSingle<CachedStockPhotoRow>();

    if (cached && cached.matcher_version === STOCK_PHOTO_MATCHER_VERSION) {
      if (!cached.image_url) return null;
      return {
        imageUrl: cached.image_url,
        attribution: cached.attribution || "Foto no Unsplash",
        photographerName: cached.photographer_name || "Unknown",
        photographerUrl: cached.photographer_url || "https://unsplash.com",
      };
    }

    // 2. Search Unsplash — Portuguese common name first, then scientific name
    let result: { photo: StockPhotoResult; query: string } | null = null;

    if (commonName) {
      result = await searchUnsplash(`${commonName} planta`, unsplashKey);
    }
    if (!result) {
      result = await searchUnsplash(`${scientificName} planta`, unsplashKey);
    }

    // 3. Cache result (positive or negative)
    if (result) {
      await supabase.from("stock_photos").upsert({
        scientific_name: scientificName,
        image_url: result.photo.imageUrl,
        attribution: result.photo.attribution,
        photographer_name: result.photo.photographerName,
        photographer_url: result.photo.photographerUrl,
        matched_query: result.query,
        matcher_version: STOCK_PHOTO_MATCHER_VERSION,
        match_score: null,
        source: "unsplash",
      }, { onConflict: "scientific_name" });

      return result.photo;
    } else {
      await supabase.from("stock_photos").upsert({
        scientific_name: scientificName,
        image_url: "",
        attribution: null,
        photographer_name: null,
        photographer_url: null,
        matched_query: null,
        matcher_version: STOCK_PHOTO_MATCHER_VERSION,
        match_score: null,
        source: "unsplash",
      }, { onConflict: "scientific_name" });

      return null;
    }
  } catch (err) {
    console.error("Stock photo fetch failed (non-critical):", err);
    return null;
  }
}

async function searchUnsplash(
  query: string,
  accessKey: string,
): Promise<{ photo: StockPhotoResult; query: string } | null> {
  const url = new URL(`${UNSPLASH_API}/search/photos`);
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "1");
  url.searchParams.set("orientation", "squarish");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${accessKey}` },
  });

  if (!res.ok) {
    console.error("Unsplash API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo?.urls?.regular) return null;

  const photographerName = photo.user?.name || "Unknown";
  const photographerUrl = photo.user?.links?.html || "https://unsplash.com";

  return {
    photo: {
      imageUrl: `${photo.urls.regular}&w=800&q=80`,
      attribution: `Foto por ${photographerName} no Unsplash`,
      photographerName,
      photographerUrl,
    },
    query,
  };
}
