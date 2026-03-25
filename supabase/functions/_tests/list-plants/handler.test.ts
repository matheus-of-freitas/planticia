import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../list-plants/handler.ts";

const BASE_URL = "https://test.supabase.co/functions/v1/list-plants";

Deno.test("list-plants: returns 405 for non-GET method", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const res = await handler(req);
  assertEquals(res.status, 405);
  const text = await res.text();
  assertEquals(text, "Method Not Allowed");
});

Deno.test("list-plants: returns 401 when Authorization header is missing", async () => {
  const req = new Request(BASE_URL, {
    method: "GET",
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("list-plants: returns 401 when Authorization header lacks Bearer prefix", async () => {
  const req = new Request(BASE_URL, {
    method: "GET",
    headers: {
      Authorization: "Basic dXNlcjpwYXNz",
    },
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});
