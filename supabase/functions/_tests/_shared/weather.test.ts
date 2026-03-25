import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { getRioWeather } from "../../_shared/weather.ts";

// ---------- helpers ----------

/** Build a full, valid Open-Meteo-shaped response body. */
function makeMeteoPayload(overrides: Record<string, unknown> = {}) {
  return {
    current: {
      temperature_2m: 31.5,
      relative_humidity_2m: 68,
      precipitation: 0,
      ...(overrides.current as Record<string, unknown> ?? {}),
    },
    daily: {
      temperature_2m_max: [32, 33, 35, 30, 31, 34, 29],
      ...(overrides.daily as Record<string, unknown> ?? {}),
    },
    ...Object.fromEntries(
      Object.entries(overrides).filter(
        ([k]) => k !== "current" && k !== "daily",
      ),
    ),
  };
}

/** Determine the expected season for the current month. */
function expectedSeason(): {
  season: "verao" | "outono" | "inverno" | "primavera";
  seasonLabel: string;
} {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2)
    return { season: "verao", seasonLabel: "verao" };
  if (month >= 3 && month <= 5)
    return { season: "outono", seasonLabel: "outono" };
  if (month >= 6 && month <= 8)
    return { season: "inverno", seasonLabel: "inverno" };
  return { season: "primavera", seasonLabel: "primavera" };
}

// ---------- tests ----------

Deno.test("successful API response is parsed into weather object", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const payload = makeMeteoPayload();
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 31.5);
    assertEquals(result.currentHumidity, 68);
    assertEquals(result.maxTempNext7Days, 35);
    // Season depends on current date; just check it is one of the valid values.
    assertEquals(
      ["verao", "outono", "inverno", "primavera"].includes(result.season),
      true,
    );
    assertExists(result.seasonLabel);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("non-ok response returns fallback values with correct season", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response("Server error", { status: 500 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 28);
    assertEquals(result.currentHumidity, 75);
    assertEquals(result.maxTempNext7Days, 34);
    // Season should be computed from the current month, not the hardcoded fallback.
    assertEquals(result.season, expectedSeason().season);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("network / fetch error returns fallback values", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error("Network failure");
    };

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 28);
    assertEquals(result.currentHumidity, 75);
    assertEquals(result.maxTempNext7Days, 34);
    assertEquals(result.season, expectedSeason().season);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("missing current.temperature_2m uses fallback currentTemp", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const payload = {
      current: {
        relative_humidity_2m: 60,
        // temperature_2m intentionally omitted
      },
      daily: { temperature_2m_max: [30, 31, 29] },
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 28); // fallback
    assertEquals(result.currentHumidity, 60); // from response
    assertEquals(result.maxTempNext7Days, 31);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("missing current.relative_humidity_2m uses fallback humidity", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const payload = {
      current: {
        temperature_2m: 25,
        // relative_humidity_2m intentionally omitted
      },
      daily: { temperature_2m_max: [26] },
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 25);
    assertEquals(result.currentHumidity, 75); // fallback
    assertEquals(result.maxTempNext7Days, 26);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("missing daily object uses fallback maxTempNext7Days", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const payload = {
      current: { temperature_2m: 30, relative_humidity_2m: 65 },
      // daily intentionally omitted
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 30);
    assertEquals(result.currentHumidity, 65);
    assertEquals(result.maxTempNext7Days, 34); // fallback
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("empty daily temperature_2m_max array uses fallback maxTemp", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const payload = {
      current: { temperature_2m: 27, relative_humidity_2m: 70 },
      daily: { temperature_2m_max: [] },
    };
    globalThis.fetch = async () =>
      new Response(JSON.stringify(payload), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 27);
    assertEquals(result.currentHumidity, 70);
    assertEquals(result.maxTempNext7Days, 34); // fallback
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("completely empty JSON body uses all fallback values", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({}), { status: 200 });

    const result = await getRioWeather();

    assertExists(result);
    assertEquals(result.currentTemp, 28); // fallback
    assertEquals(result.currentHumidity, 75); // fallback
    assertEquals(result.maxTempNext7Days, 34); // fallback
    assertEquals(result.season, expectedSeason().season);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
