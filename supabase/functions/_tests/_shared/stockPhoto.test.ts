Deno.env.set("UNSPLASH_ACCESS_KEY", "test-key");

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { fetchStockPhoto } from "../../_shared/stockPhoto.ts";

// ---------- helpers ----------

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

Deno.test("returns cached data on cache hit", async () => {
  const cachedRow = {
    image_url: "https://images.unsplash.com/photo-abc",
    attribution: "Foto por Jane no Unsplash",
    photographer_name: "Jane",
    photographer_url: "https://unsplash.com/@jane",
    matcher_version: "6",
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
    matcher_version: "6",
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

Deno.test("takes the first Unsplash result (trusts search relevance)", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        results: [{
          urls: { regular: "https://images.unsplash.com/photo-xyz" },
          user: {
            name: "John Doe",
            links: { html: "https://unsplash.com/@johndoe" },
          },
        }],
      }), { status: 200 });

    const { client, upsertCalls } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Mentha spicata", "Hortelã", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-xyz&w=800&q=80");
    assertEquals(result!.photographerName, "John Doe");

    // Verify cache upsert
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.matched_query, "Hortelã planta");
    assertEquals(upserted.matcher_version, "6");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("falls back to scientific name when common name search returns no results", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let fetchCount = 0;
    globalThis.fetch = async () => {
      fetchCount += 1;
      if (fetchCount === 1) {
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({
        results: [{
          urls: { regular: "https://images.unsplash.com/photo-sci" },
          user: { name: "Sci Person", links: { html: "https://unsplash.com/@sci" } },
        }],
      }), { status: 200 });
    };

    const { client, upsertCalls } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Mentha spicata", "Hortelã", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-sci&w=800&q=80");
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.matched_query, "Mentha spicata planta");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("stale cache is ignored and revalidated", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({
        results: [{
          urls: { regular: "https://images.unsplash.com/photo-new" },
          user: { name: "New", links: { html: "https://unsplash.com/@new" } },
        }],
      }), { status: 200 });

    const staleRow = {
      image_url: "https://images.unsplash.com/photo-stale",
      attribution: "Old",
      photographer_name: "Old",
      photographer_url: "https://unsplash.com/@old",
      matcher_version: "4",
    };
    const { client } = createMockSb({ data: staleRow, error: null });
    const result = await fetchStockPhoto("Rosa gallica", "Rosa", client);

    assertExists(result);
    assertEquals(result!.imageUrl, "https://images.unsplash.com/photo-new&w=800&q=80");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Unsplash API error triggers negative cache and returns null", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response("Rate limited", { status: 429 });

    const { client, upsertCalls } = createMockSb({ data: null, error: null });
    const result = await fetchStockPhoto("Zamioculcas zamiifolia", "Zamioculca", client);

    assertEquals(result, null);
    assertEquals(upsertCalls.length >= 1, true);
    const upserted = upsertCalls[0] as Record<string, unknown>;
    assertEquals(upserted.image_url, "");
    assertEquals(upserted.matcher_version, "6");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
