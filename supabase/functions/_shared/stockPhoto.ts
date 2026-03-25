import { SupabaseClient } from "@supabase/supabase-js";

const UNSPLASH_API = "https://api.unsplash.com";
const STOCK_PHOTO_MATCHER_VERSION = "3";
const UNSPLASH_RESULTS_PER_PAGE = "8";
const MIN_ACCEPTABLE_MATCH_SCORE = 70;
const GENERIC_TOKENS = new Set([
  "plant",
  "plants",
  "planta",
  "plantas",
  "leaf",
  "leaves",
  "foliage",
  "green",
  "garden",
  "nature",
  "herb",
  "herbs",
  "flower",
  "flowers",
  "botanical",
]);
const TOKEN_STOPWORDS = new Set([
  "da",
  "de",
  "do",
  "das",
  "dos",
  "the",
  "and",
]);

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

interface UnsplashCandidate {
  urls?: { regular?: string };
  user?: {
    name?: string;
    links?: { html?: string };
  };
  description?: string | null;
  alt_description?: string | null;
  slug?: string | null;
  tags?: Array<{ title?: string | null }>;
}

interface SearchMatch {
  photo: StockPhotoResult;
  matchedQuery: string;
  score: number;
}

interface CandidateField {
  text: string;
  tokens: Set<string>;
  weight: number;
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
      .select("image_url, attribution, photographer_name, photographer_url, matcher_version")
      .eq("scientific_name", scientificName)
      .maybeSingle<CachedStockPhotoRow>();

    if (cached && cached.matcher_version === STOCK_PHOTO_MATCHER_VERSION) {
      // Negative cache — no photo exists for this species
      if (!cached.image_url) return null;
      return {
        imageUrl: cached.image_url,
        attribution: cached.attribution || "Foto no Unsplash",
        photographerName: cached.photographer_name || "Unknown",
        photographerUrl: cached.photographer_url || "https://unsplash.com",
      };
    }

    // 2. Search Unsplash — try scientific name first
    const normalizedScientificName = normalizeForMatch(scientificName);
    const normalizedCommonName = normalizeForMatch(commonName);
    let match = await searchUnsplash(scientificName, unsplashKey, {
      scientificName: normalizedScientificName,
      commonName: normalizedCommonName,
      allowCommonNameMatches: false,
    });

    // 3. Fallback to common name
    if (!match && normalizedCommonName) {
      match = await searchUnsplash(commonName, unsplashKey, {
        scientificName: normalizedScientificName,
        commonName: normalizedCommonName,
        allowCommonNameMatches: true,
      });
    }

    // 4. Cache result (positive or negative)
    if (match) {
      await supabase.from("stock_photos").upsert({
        scientific_name: scientificName,
        image_url: match.photo.imageUrl,
        attribution: match.photo.attribution,
        photographer_name: match.photo.photographerName,
        photographer_url: match.photo.photographerUrl,
        matched_query: match.matchedQuery,
        matcher_version: STOCK_PHOTO_MATCHER_VERSION,
        match_score: match.score,
        source: "unsplash",
      }, { onConflict: "scientific_name" });

      return match.photo;
    } else {
      // Negative cache
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
  matchTerms: {
    scientificName: string;
    commonName: string;
    allowCommonNameMatches: boolean;
  },
): Promise<SearchMatch | null> {
  const url = new URL(`${UNSPLASH_API}/search/photos`);
  url.searchParams.set("query", `${query} plant`);
  url.searchParams.set("per_page", UNSPLASH_RESULTS_PER_PAGE);
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
  const photos = Array.isArray(data.results) ? data.results as UnsplashCandidate[] : [];
  let bestMatch: SearchMatch | null = null;
  let bestScore = -1;

  for (const candidate of photos) {
    const score = scoreCandidate(candidate, matchTerms);
    if (score <= bestScore) continue;

    const photo = toStockPhotoResult(candidate);
    if (!photo) continue;

    bestScore = score;
    bestMatch = {
      photo,
      matchedQuery: query,
      score,
    };
  }

  return bestScore >= MIN_ACCEPTABLE_MATCH_SCORE ? bestMatch : null;
}

function toStockPhotoResult(photo: UnsplashCandidate): StockPhotoResult | null {
  const imageUrl = photo.urls?.regular;
  if (!imageUrl) return null;

  const photographerName = photo.user?.name || "Unknown";
  const photographerUrl = photo.user?.links?.html || "https://unsplash.com";

  return {
    imageUrl: `${imageUrl}&w=800&q=80`,
    attribution: `Foto por ${photographerName} no Unsplash`,
    photographerName,
    photographerUrl,
  };
}

function scoreCandidate(
  photo: UnsplashCandidate,
  matchTerms: {
    scientificName: string;
    commonName: string;
    allowCommonNameMatches: boolean;
  },
): number {
  const fields = buildCandidateFields(photo);
  if (fields.length === 0) return -1;

  const scientificTokens = tokenize(matchTerms.scientificName);
  const genus = scientificTokens[0] || "";
  const species = scientificTokens[1] || "";
  const commonTokens = filterSpecificTokens(tokenize(matchTerms.commonName));

  let score = 0;
  let signalCount = 0;
  let hasGenusMatch = false;
  let commonTokenHits = 0;
  let nonGenericTokenHits = 0;

  for (const field of fields) {
    if (matchTerms.scientificName && containsWholePhrase(field.text, matchTerms.scientificName)) {
      score += 120 + field.weight * 5;
      signalCount += 1;
      hasGenusMatch = true;
      nonGenericTokenHits += 2;
      continue;
    }

    if (
      matchTerms.allowCommonNameMatches &&
      matchTerms.commonName &&
      containsWholePhrase(field.text, matchTerms.commonName)
    ) {
      score += 80 + field.weight * 5;
      signalCount += 1;
      commonTokenHits += Math.max(commonTokenHits, commonTokens.length || 1);
      nonGenericTokenHits += 1;
    }

    if (genus && field.tokens.has(genus)) {
      score += 18 * field.weight;
      signalCount += 1;
      hasGenusMatch = true;
      nonGenericTokenHits += 1;
    }

    if (species && hasGenusMatch && field.tokens.has(species)) {
      score += 10 * field.weight;
      signalCount += 1;
      nonGenericTokenHits += 1;
    }

    if (matchTerms.allowCommonNameMatches && commonTokens.length > 0) {
      const fieldCommonHits = commonTokens.filter((token) => field.tokens.has(token)).length;
      if (fieldCommonHits > 0) {
        score += fieldCommonHits * 14 * field.weight;
        commonTokenHits += fieldCommonHits;
        signalCount += 1;
        nonGenericTokenHits += fieldCommonHits;
      }
    }
  }

  if (signalCount >= 2) score += 15;
  if (hasGenusMatch && commonTokenHits > 0) score += 20;
  if (commonTokens.length > 1 && commonTokenHits >= Math.min(2, commonTokens.length)) score += 12;
  if (nonGenericTokenHits === 0) score -= 40;

  return score;
}

function buildCandidateFields(photo: UnsplashCandidate): CandidateField[] {
  const fields: CandidateField[] = [];

  addCandidateField(fields, photo.description || "", 2);
  addCandidateField(fields, photo.alt_description || "", 2);
  addCandidateField(fields, photo.slug || "", 2);

  if (Array.isArray(photo.tags)) {
    for (const tag of photo.tags) {
      addCandidateField(fields, tag.title || "", 3);
    }
  }

  return fields;
}

function addCandidateField(fields: CandidateField[], value: string, weight: number) {
  const text = normalizeForMatch(value);
  if (!text) return;

  fields.push({
    text,
    tokens: new Set(tokenize(text)),
    weight,
  });
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(" ")
    .filter(Boolean);
}

function filterSpecificTokens(tokens: string[]): string[] {
  return tokens.filter((token) =>
    token.length > 2 &&
    !GENERIC_TOKENS.has(token) &&
    !TOKEN_STOPWORDS.has(token)
  );
}

function containsWholePhrase(text: string, phrase: string): boolean {
  const normalizedText = ` ${normalizeForMatch(text)} `;
  const normalizedPhrase = normalizeForMatch(phrase);
  if (!normalizedPhrase) return false;
  return normalizedText.includes(` ${normalizedPhrase} `);
}
