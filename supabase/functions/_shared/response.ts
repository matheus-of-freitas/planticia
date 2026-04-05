/**
 * Creates a JSON Response with proper Content-Type including charset=utf-8.
 */
export function jsonResponse(
  body: unknown,
  status: number = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
