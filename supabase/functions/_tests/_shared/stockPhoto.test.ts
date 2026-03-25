// Set UNSPLASH_ACCESS_KEY before the module is imported so the module-level
// const captures this value. This MUST come before the import.
Deno.env.set("UNSPLASH_ACCESS_KEY", "test-key");

import {
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

Deno.test("happy path: cache miss, Unsplash returns a photo", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const unsplashPayload = {
      results: [
        {
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

    const result = await fetchStockPhoto("Rosa gallica", "Rosa", client);

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
  } finally {
    globalThis.fetch = originalFetch;
  }
});
