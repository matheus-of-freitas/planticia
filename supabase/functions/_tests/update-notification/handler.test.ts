import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handler } from "../../update-notification/handler.ts";

const BASE_URL = "https://test.supabase.co/functions/v1/update-notification";

Deno.test("update-notification: returns 405 for non-POST method", async () => {
  const req = new Request(BASE_URL, {
    method: "GET",
  });
  const res = await handler(req);
  assertEquals(res.status, 405);
  const text = await res.text();
  assertEquals(text, "Method Not Allowed");
});

Deno.test("update-notification: returns 401 when Authorization header is missing", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plantId: "abc-123", notificationId: "notif-456" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});

Deno.test("update-notification: returns 401 when Authorization header lacks Bearer prefix", async () => {
  const req = new Request(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "OAuth some-oauth-token",
    },
    body: JSON.stringify({ plantId: "abc-123", notificationId: "notif-456" }),
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Missing or invalid Authorization header");
});
