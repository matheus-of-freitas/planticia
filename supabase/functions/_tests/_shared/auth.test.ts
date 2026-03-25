import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { getAuthenticatedUser } from "../../_shared/auth.ts";

// ---------- helpers ----------

/** Build a minimal Request with the given Authorization header (or omit it). */
function makeRequest(authHeader?: string): Request {
  const headers = new Headers();
  if (authHeader !== undefined) {
    headers.set("Authorization", authHeader);
  }
  return new Request("https://example.com", { headers });
}

/** Type-guard: result contains an error Response. */
function isError(
  result: { userId: string } | { error: Response },
): result is { error: Response } {
  return "error" in result;
}

// ---------- tests ----------

Deno.test("returns 401 when Authorization header is missing", async () => {
  const result = await getAuthenticatedUser(makeRequest());
  assertExists(result);
  assertEquals(isError(result), true);
  if (isError(result)) {
    assertEquals(result.error.status, 401);
    const body = await result.error.json();
    assertEquals(body.error, "Missing or invalid Authorization header");
  }
});

Deno.test("returns 401 when Authorization header does not start with Bearer", async () => {
  const result = await getAuthenticatedUser(makeRequest("Basic abc123"));
  assertExists(result);
  assertEquals(isError(result), true);
  if (isError(result)) {
    assertEquals(result.error.status, 401);
    const body = await result.error.json();
    assertEquals(body.error, "Missing or invalid Authorization header");
  }
});

Deno.test("returns 401 when Authorization header is an empty string", async () => {
  const result = await getAuthenticatedUser(makeRequest(""));
  assertExists(result);
  assertEquals(isError(result), true);
  if (isError(result)) {
    assertEquals(result.error.status, 401);
    const body = await result.error.json();
    assertEquals(body.error, "Missing or invalid Authorization header");
  }
});

Deno.test("returns 500 when SUPABASE_URL env var is missing", async () => {
  // Ensure env vars are unset so we hit the missing-env branch.
  const origUrl = Deno.env.get("SUPABASE_URL");
  const origKey = Deno.env.get("SUPABASE_ANON_KEY");
  try {
    Deno.env.delete("SUPABASE_URL");
    Deno.env.set("SUPABASE_ANON_KEY", "some-key");

    const result = await getAuthenticatedUser(
      makeRequest("Bearer valid-token"),
    );
    assertExists(result);
    assertEquals(isError(result), true);
    if (isError(result)) {
      assertEquals(result.error.status, 500);
      const body = await result.error.json();
      assertEquals(body.error, "Missing Supabase env vars");
    }
  } finally {
    // Restore original values
    if (origUrl !== undefined) {
      Deno.env.set("SUPABASE_URL", origUrl);
    } else {
      Deno.env.delete("SUPABASE_URL");
    }
    if (origKey !== undefined) {
      Deno.env.set("SUPABASE_ANON_KEY", origKey);
    } else {
      Deno.env.delete("SUPABASE_ANON_KEY");
    }
  }
});

Deno.test("returns 500 when SUPABASE_ANON_KEY env var is missing", async () => {
  const origUrl = Deno.env.get("SUPABASE_URL");
  const origKey = Deno.env.get("SUPABASE_ANON_KEY");
  try {
    Deno.env.set("SUPABASE_URL", "https://fake.supabase.co");
    Deno.env.delete("SUPABASE_ANON_KEY");

    const result = await getAuthenticatedUser(
      makeRequest("Bearer valid-token"),
    );
    assertExists(result);
    assertEquals(isError(result), true);
    if (isError(result)) {
      assertEquals(result.error.status, 500);
      const body = await result.error.json();
      assertEquals(body.error, "Missing Supabase env vars");
    }
  } finally {
    if (origUrl !== undefined) {
      Deno.env.set("SUPABASE_URL", origUrl);
    } else {
      Deno.env.delete("SUPABASE_URL");
    }
    if (origKey !== undefined) {
      Deno.env.set("SUPABASE_ANON_KEY", origKey);
    } else {
      Deno.env.delete("SUPABASE_ANON_KEY");
    }
  }
});
