import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../update-plant/handler.ts";

const BASE_URL = "https://test.supabase.co/functions/v1/update-plant";

Deno.test("update-plant: returns 405 for non-POST method", async () => {
  const req = new Request(BASE_URL, {
    method: "GET",
  });
  const res = await handler(req);
  assertEquals(res.status, 405);
  const text = await res.text();
  assertEquals(text, "Method Not Allowed");
});

Deno.test("update-plant: returns 401 when Authorization header is missing", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plantId: "abc-123", updates: { name: "New Name" } }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("update-plant: returns 401 when Authorization header lacks Bearer prefix", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token some-token-value",
    },
    body: JSON.stringify({ plantId: "abc-123", updates: { name: "New Name" } }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});
