/**
 * Build a Request object for testing edge function handlers.
 */
export function makeRequest(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Request {
  const url = `https://test.supabase.co/functions/v1${path}`;
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Build an authenticated POST request (most common case).
 */
export function makeAuthRequest(
  path: string,
  body?: unknown,
  method = "POST"
): Request {
  return makeRequest(method, path, body, {
    Authorization: "Bearer test-valid-token",
  });
}

/**
 * Build an authenticated GET request with query params.
 */
export function makeAuthGet(
  path: string,
  params?: Record<string, string>
): Request {
  const url = new URL(`https://test.supabase.co/functions/v1${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return new Request(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer test-valid-token",
    },
  });
}

/**
 * Parse a Response body as JSON.
 */
export async function parseResponse<T = Record<string, unknown>>(
  response: Response
): Promise<T> {
  return await response.json() as T;
}
