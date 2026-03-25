import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../plant-create/handler.ts";

const BASE_URL = "https://test.supabase.co/functions/v1/plant-create";

Deno.test("plant-create: returns 405 for non-POST method", async () => {
  const req = new Request(BASE_URL, {
    method: "GET",
  });
  const res = await handler(req);
  assertEquals(res.status, 405);
  const text = await res.text();
  assertEquals(text, "Method Not Allowed");
});

Deno.test("plant-create: returns 401 when Authorization header is missing", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ species: "Rosa", imageUrl: "https://example.com/rose.jpg" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("plant-create: returns 401 when Authorization header lacks Bearer prefix", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Token some-invalid-token",
    },
    body: JSON.stringify({ species: "Rosa", imageUrl: "https://example.com/rose.jpg" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});
