// Set UNSPLASH_ACCESS_KEY before the module is imported so the module-level
// const captures this value. This MUST come before the import.
Deno.env.set("UNSPLASH_ACCESS_KEY", "test-key");

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { fetchStockPhoto } from "../../_shared/stockPhoto.ts";

// ---------- helpers ----------

/**
 * Creates a mock SupabaseClient-like object.
 *
 * @param cacheResult  What `maybeSingle()` should resolve to (e.g.
 *                     `{ data: { image_url: "..." }, error: null }`).
 * @param upsertResult What `upsert()` should resolve to.
 */
function createMockSb(
  cacheResult: { data: unknown; error: unknown },
  upsertResult: { error: unknown } = { error: null },
) {
  const upsertCalls: unknown[] = [];
  return {
    client: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve(cacheResult),
          }),
        }),
        upsert: (row: unknown, _opts?: unknown) => {
          upsertCalls.push(row);
          return Promise.resolve(upsertResult);
        },
      }),
    // deno-lint-ignore no-explicit-any
    } as any,
    upsertCalls,
  };
}

/**
 * Creates a mock SupabaseClient that throws on `from()`, simulating a DB error.
 */
function createErrorSb() {
  return {
    from: () => {
      throw new Error("DB connection failed");
    },
  // deno-lint-ignore no-explicit-any
  } as any;
}

// ---------- tests ----------

Deno.test("returns null when scientificName is empty", async () => {
  const { client } = createMockSb({ data: null, error: null });
  const result = await fetchStockPhoto("", "Common Name", client);
  assertEquals(result, null);
});

Deno.test("returns cached data on cache hit with image_url", async () => {
  const cachedRow = {
    image_url: "https://images.unsplash.com/photo-abc",
    attribution: "Foto por Jane no Unsplash",
    photographer_name: "Jane",
    photographer_url: "https://unsplash.com/@jane",
    matcher_version: "4",
  };
  const { client } = createMockSb({ data: cachedRow, error: null });

  const result = await fetchStockPhoto("Rosa gallica", "Rosa", client);

  assertExists(result);
  assertEquals(result!.imageUrl, cachedRow.image_url);
  assertEquals(result!.attribution, cachedRow.attribution);
  assertEquals(result!.photographerName, cachedRow.photographer_name);
  assertEquals(result!.photographerUrl, cachedRow.photographer_url);
});

Deno.test("returns null on negative cache hit (empty image_url)", async () => {
  const cachedRow = {
    image_url: "",
    attribution: null,
    photographer_name: null,
    photographer_url: null,
    matcher_version: "4",
  };
  const { client } = createMockSb({ data: cachedRow, error: null });

  const result = await fetchStockPhoto("Unknown species", "Desconhecida", client);
  assertEquals(result, null);
});

Deno.test("returns null when supabase throws a DB error", async () => {
  const sbError = createErrorSb();
  const result = await fetchStockPhoto("Rosa gallica", "Rosa", sbError);
  assertEquals(result, null);
});

Deno.test("common name search finds best match from Unsplash candidates", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const unsplashPayload = {
      results: [
        {
          description: "Fresh garden leaves",
          alt_description: "close-up foliage",
          tags: [{ title: "herbs" }],
          urls: { regular: "https://images.unsplash.com/photo-wrong" },
          user: {
            name: "Wrong Match",
            links: { html: "https://unsplash.com/@wrong" },
          },
        },
        {
          description: "Mentha spicata in an herb garden",
          alt_description: "Mentha spicata leaves",
          tags: [{ title: "mentha spicata" }, { title: "mint" }],
          urls: { regular: "https://images.unsplash.com/photo-xyz" },
          user: {
            name: "John Doe",
            links: { html: "https://unsplash.com/@johndoe" },
          },
        },
      ],
    };

    // Stub fetch to return a successful Unsplash response
    globalThis.fetch = async () =>
      new Response(JSON.stringify(unsplashPayload), { status: 200 });

    const { client, upsertCalls } = createMockSb({ data: null, error: null });

    const result = await fetchStockPhoto("Mentha spicata", "Mint", client);

    assertExists(result);
    assertEquals(
      result!.imageUrl,
      "https://images.unsplash.com/photo-xyz&w=800&q=80",
    );
    assertEquals(result!.attribution, "Foto por John Doe no Unsplash");
    assertEquals(result!.photographerName, "John Doe");
    assertEquals(result!.photographerUrl, "https://unsplash.com/@johndoe");

    // Verify a positive cache upsert was attempted
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    // Common name is searched first now, so matched_query is the common name
    assertEquals(upserted.matched_query, "Mint");
    assertEquals(upserted.matcher_version, "4");
    assert(typeof upserted.match_score === "number");
    assert((upserted.match_score as number) >= 70);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("falls back to scientific name when common name search finds nothing", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount += 1;
      // First call (common name "Garden Mint") returns empty
      if (fetchCount === 1) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      // Second call (scientific name "Mentha spicata") returns a match
      return new Response(JSON.stringify({
        results: [
          {
            description: "Mentha spicata in an herb garden",
            tags: [{ title: "mentha spicata" }, { title: "spearmint" }],
            urls: { regular: "https://images.unsplash.com/photo-mint" },
            user: {
              name: "Mint Person",
              links: { html: "https://unsplash.com/@mintperson" },
            },
          },
        ],
      }), { status: 200 });
    };

    const { client, upsertCalls } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Mentha spicata", "Garden Mint", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-mint&w=800&q=80");
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.matched_query, "Mentha spicata");
    assertEquals(upserted.matcher_version, "4");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("accepts genus signal plus common-name overlap for sparse metadata", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        results: [
          {
            description: "Fresh mint leaves from the market",
            tags: [{ title: "mentha" }, { title: "herb" }],
            urls: { regular: "https://images.unsplash.com/photo-spearmint" },
            user: {
              name: "Herb Person",
              links: { html: "https://unsplash.com/@herbperson" },
            },
          },
        ],
      }), { status: 200 });

    const { client } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Mentha spicata", "Mint", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-spearmint&w=800&q=80");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("rejects unrelated Unsplash results and negative-caches the miss", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        results: [
          {
            description: "Generic tropical plant",
            alt_description: "green leaves in the sun",
            tags: [{ title: "plant" }, { title: "leaf" }],
            urls: { regular: "https://images.unsplash.com/photo-generic" },
            user: {
              name: "Generic Person",
              links: { html: "https://unsplash.com/@generic" },
            },
          },
        ],
      }), { status: 200 });

    const { client, upsertCalls } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Mentha spicata", "Mint", client);

    assertEquals(result, null);
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.image_url, "");
    assertEquals(upserted.matcher_version, "4");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("stale cache rows are ignored and revalidated with the current matcher", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        results: [
          {
            description: "Rosa gallica bloom",
            tags: [{ title: "rosa gallica" }],
            urls: { regular: "https://images.unsplash.com/photo-rose" },
            user: {
              name: "Rose Person",
              links: { html: "https://unsplash.com/@roseperson" },
            },
          },
        ],
      }), { status: 200 });

    const staleCachedRow = {
      image_url: "https://images.unsplash.com/photo-stale",
      attribution: "Foto por Old no Unsplash",
      photographer_name: "Old",
      photographer_url: "https://unsplash.com/@old",
      matcher_version: "2",
    };

    const { client, upsertCalls } = createMockSb({ data: staleCachedRow, error: null });
    const result = await fetchStockPhoto("Rosa gallica", "Rose", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-rose&w=800&q=80");
    assertEquals(upsertCalls.length >= 1, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Unsplash API error triggers negative cache upsert and returns null", async () => {
  const originalFetch = globalThis.fetch;
  try {
    // Stub fetch to return a non-ok Unsplash response
    globalThis.fetch = async () =>
      new Response("Rate limited", { status: 429 });

    const { client, upsertCalls } = createMockSb({ data: null, error: null });

    const result = await fetchStockPhoto(
      "Zamioculcas zamiifolia",
      "Zamioculca",
      client,
    );

    assertEquals(result, null);

    // A negative cache upsert should have been made (empty image_url)
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.image_url, "");
    assertEquals(upserted.matcher_version, "4");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
