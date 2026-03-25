/**
 * Creates a chainable mock Supabase client for testing edge functions.
 *
 * Usage:
 *   const sb = createMockSupabase({
 *     from: { plants: { select: { data: [...], error: null } } }
 *   });
 */

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

interface FromConfig {
  [method: string]: QueryResult | FromConfig;
}

interface SupabaseConfig {
  from?: Record<string, FromConfig>;
  auth?: {
    getUser?: QueryResult;
  };
  storage?: {
    from?: Record<string, {
      upload?: QueryResult;
      remove?: QueryResult;
      getPublicUrl?: { data: { publicUrl: string } };
    }>;
  };
}

function createChainableQuery(result: QueryResult): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "gt", "lt", "gte", "lte",
    "single", "maybeSingle", "order",
  ];

  for (const method of methods) {
    chain[method] = (..._args: unknown[]) => {
      // Terminal methods return the result directly
      if (method === "single" || method === "maybeSingle") {
        return Promise.resolve(result);
      }
      return chain;
    };
  }

  // Make the chain itself thenable so `await supabase.from("x").select("*")` works
  chain.then = (resolve: (val: QueryResult) => void) => {
    return Promise.resolve(result).then(resolve);
  };

  return chain;
}

export function createMockSupabase(config: SupabaseConfig = {}) {
  return {
    from: (table: string) => {
      const tableConfig = config.from?.[table];
      if (!tableConfig) {
        return createChainableQuery({ data: null, error: null });
      }

      // Return a chainable object where terminal methods resolve to the configured result
      const defaultResult: QueryResult = { data: null, error: null };
      const methods = [
        "select", "insert", "update", "delete", "upsert",
        "eq", "neq", "order",
      ];

      const chain: Record<string, unknown> = {};
      for (const method of methods) {
        const configured = tableConfig[method] as QueryResult | undefined;
        chain[method] = (..._args: unknown[]) => {
          if (configured) {
            return createChainableQuery(configured);
          }
          return createChainableQuery(defaultResult);
        };
      }

      // Handle direct select→single pattern
      chain.select = (..._args: unknown[]) => {
        const selectResult = tableConfig["select"] as QueryResult | undefined;
        return createChainableQuery(selectResult || defaultResult);
      };

      chain.insert = (..._args: unknown[]) => {
        const insertResult = tableConfig["insert"] as QueryResult | undefined;
        return createChainableQuery(insertResult || defaultResult);
      };

      chain.update = (..._args: unknown[]) => {
        const updateResult = tableConfig["update"] as QueryResult | undefined;
        return createChainableQuery(updateResult || defaultResult);
      };

      chain.delete = (..._args: unknown[]) => {
        const deleteResult = tableConfig["delete"] as QueryResult | undefined;
        return createChainableQuery(deleteResult || defaultResult);
      };

      chain.upsert = (..._args: unknown[]) => {
        const upsertResult = tableConfig["upsert"] as QueryResult | undefined;
        return createChainableQuery(upsertResult || defaultResult);
      };

      return chain;
    },
    auth: {
      getUser: () =>
        Promise.resolve(
          config.auth?.getUser || { data: { user: null }, error: null }
        ),
      persistSession: false,
    },
    storage: {
      from: (bucket: string) => {
        const bucketConfig = config.storage?.from?.[bucket];
        return {
          upload: (..._args: unknown[]) =>
            Promise.resolve(bucketConfig?.upload || { data: null, error: null }),
          remove: (..._args: unknown[]) =>
            Promise.resolve(bucketConfig?.remove || { data: null, error: null }),
          getPublicUrl: (..._args: unknown[]) =>
            bucketConfig?.getPublicUrl || { data: { publicUrl: "" } },
        };
      },
    },
  };
}

/**
 * Stubs globalThis.fetch for tests. Restores original on cleanup.
 * Returns a cleanup function.
 *
 * @param urlResponseMap - Map of URL substring → Response config
 */
export function stubFetch(
  urlResponseMap: Record<string, { ok?: boolean; status?: number; body?: unknown; headers?: Record<string, string> }>
): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: string | URL | Request, _init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    for (const [pattern, config] of Object.entries(urlResponseMap)) {
      if (url.includes(pattern)) {
        const responseHeaders = new Headers(config.headers || { "Content-Type": "application/json" });
        return new Response(
          typeof config.body === "string" ? config.body : JSON.stringify(config.body ?? {}),
          {
            status: config.status ?? (config.ok === false ? 500 : 200),
            ok: config.ok ?? true,
            headers: responseHeaders,
          } as ResponseInit
        );
      }
    }

    // Default: return empty 200
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

/**
 * Set standard test environment variables.
 */
export function setTestEnv() {
  Deno.env.set("SUPABASE_URL", "https://test.supabase.co");
  Deno.env.set("SUPABASE_ANON_KEY", "test-anon-key");
  Deno.env.set("SERVICE_ROLE_KEY", "test-service-role-key");
  Deno.env.set("OPENAI_API_KEY", "test-openai-key");
  Deno.env.set("PLANTNET_API_KEY", "test-plantnet-key");
  Deno.env.set("UNSPLASH_ACCESS_KEY", "test-unsplash-key");
}

/**
 * Clear test environment variables.
 */
export function clearTestEnv() {
  const keys = [
    "SUPABASE_URL", "SUPABASE_ANON_KEY", "SERVICE_ROLE_KEY",
    "OPENAI_API_KEY", "PLANTNET_API_KEY", "UNSPLASH_ACCESS_KEY",
  ];
  for (const key of keys) {
    try {
      Deno.env.delete(key);
    } catch {
      // ignore
    }
  }
}
