import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../get-details/handler.ts";

const BASE_URL = "https://test.supabase.co/functions/v1/get-details";

Deno.test("get-details: returns 401 when Authorization header is missing", async () => {
  const req = new Request(`${BASE_URL}?plantId=abc-123`, {
    method: "GET",
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("get-details: returns 401 when Authorization header lacks Bearer prefix", async () => {
  const req = new Request(`${BASE_URL}?plantId=abc-123`, {
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
