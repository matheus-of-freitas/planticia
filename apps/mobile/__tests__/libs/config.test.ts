import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";

const { supabase } = require("../../libs/supabaseClient");

describe("config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("SUPABASE_FUNCTIONS_URL", () => {
    it("is constructed from the env variable", () => {
      expect(SUPABASE_FUNCTIONS_URL).toBe(
        "https://test.supabase.co/functions/v1"
      );
    });
  });

  describe("getAuthHeaders", () => {
    it("returns Content-Type header", async () => {
      const headers = await getAuthHeaders();
      expect(headers["Content-Type"]).toBe("application/json");
    });

    it("uses anon key when no session exists", async () => {
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
      });

      const headers = await getAuthHeaders();
      expect(headers.Authorization).toBe("Bearer test-anon-key");
    });

    it("uses access_token when session exists", async () => {
      supabase.auth.getSession.mockResolvedValueOnce({
        data: { session: { access_token: "my-jwt-token" } },
      });

      const headers = await getAuthHeaders();
      expect(headers.Authorization).toBe("Bearer my-jwt-token");
    });
  });
});
