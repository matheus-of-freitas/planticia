import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../identify/handler.ts";

Deno.test("identify - missing auth header returns 401", async () => {
  const req = new Request("https://test.supabase.co/functions/v1/identify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("identify - invalid auth format (no Bearer prefix) returns 401", async () => {
  const req = new Request("https://test.supabase.co/functions/v1/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Token some-token",
    },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("identify - missing env vars returns 500", async () => {
  // Clear env vars to ensure they are not set
  try { Deno.env.delete("SUPABASE_URL"); } catch { /* ignore */ }
  try { Deno.env.delete("SUPABASE_ANON_KEY"); } catch { /* ignore */ }

  const req = new Request("https://test.supabase.co/functions/v1/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer some-token",
    },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  try {
    const res = await handler(req);
    assertEquals(res.status, 500);
    const body = await res.json();
    assertEquals(body.error, "Missing Supabase env vars");
  } finally {
    // No env vars to restore
  }
});

Deno.test("identify - empty Bearer token returns 401", async () => {
  const req = new Request("https://test.supabase.co/functions/v1/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer ",
    },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  const res = await handler(req);
  // Empty token still has Bearer prefix, but getAuthenticatedUser creates a
  // Supabase client that rejects the empty token → 401
  assertEquals(res.status, 401);
});
