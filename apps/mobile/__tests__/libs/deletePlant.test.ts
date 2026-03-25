import { deletePlant } from "../../libs/deletePlant";

const { supabase } = require("../../libs/supabaseClient");

describe("deletePlant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it("succeeds when all steps complete", async () => {
    await expect(deletePlant("plant-123")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.supabase.co/functions/v1/delete-plant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ plantId: "plant-123" }),
      })
    );
  });

  it("throws when getUser returns an error", async () => {
    const authError = new Error("Auth error");
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: authError,
    });

    await expect(deletePlant("plant-123")).rejects.toThrow("Auth error");
  });

  it("throws 'User not authenticated' when no user", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(deletePlant("plant-123")).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("proceeds even when notification cancellation fails", async () => {
    const Notifications = require("expo-notifications");
    Notifications.getAllScheduledNotificationsAsync.mockRejectedValueOnce(
      new Error("Notification error")
    );

    await expect(deletePlant("plant-123")).resolves.toBeUndefined();
  });

  it("throws when delete-plant returns an error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest
        .fn()
        .mockResolvedValue({ error: "Plant not found" }),
    });

    await expect(deletePlant("plant-123")).rejects.toThrow("Plant not found");
  });
});
