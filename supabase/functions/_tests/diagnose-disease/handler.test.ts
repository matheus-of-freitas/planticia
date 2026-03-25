import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../diagnose-disease/handler.ts";

Deno.test("diagnose-disease - missing auth header returns 401", async () => {
  const req = new Request("https://test.supabase.co/functions/v1/diagnose-disease", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("diagnose-disease - invalid auth format returns 401", async () => {
  const req = new Request("https://test.supabase.co/functions/v1/diagnose-disease", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic dXNlcjpwYXNz",
    },
    body: JSON.stringify({ image_base64: "abc123" }),
  });

  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("diagnose-disease - auth header present but env vars missing returns 500", async () => {
  try { Deno.env.delete("SUPABASE_URL"); } catch { /* ignore */ }
  try { Deno.env.delete("SUPABASE_ANON_KEY"); } catch { /* ignore */ }

  const req = new Request("https://test.supabase.co/functions/v1/diagnose-disease", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer some-valid-looking-token",
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
