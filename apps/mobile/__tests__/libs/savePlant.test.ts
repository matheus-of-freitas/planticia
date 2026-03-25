import { savePlant } from "../../libs/savePlant";

const { supabase } = require("../../libs/supabaseClient");

describe("savePlant", () => {
  const basePlantParams = {
    imageUrl: "https://example.com/plant.jpg",
    species: "Rosa gallica",
    commonName: "Rosa",
  };

  const mockPlant = { id: "plant-123", species: "Rosa gallica" };

  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    // plant-create succeeds, then update-notification succeeds
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ plant: mockPlant }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      })
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });
  });

  it("returns the plant on success", async () => {
    const result = await savePlant(basePlantParams);
    expect(result).toEqual(mockPlant);
  });

  it("throws when getUser returns an error", async () => {
    const authError = new Error("Auth failed");
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: authError,
    });

    await expect(savePlant(basePlantParams)).rejects.toThrow("Auth failed");
  });

  it("throws 'User not authenticated' when no user", async () => {
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(savePlant(basePlantParams)).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("throws when plant-create returns an error", async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest
        .fn()
        .mockResolvedValue({ error: "Database insert failed" }),
    });

    await expect(savePlant(basePlantParams)).rejects.toThrow(
      "Database insert failed"
    );
  });

  it("does not throw when notification scheduling fails", async () => {
    const Notifications = require("expo-notifications");
    Notifications.getPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({
      status: "denied",
    });

    const result = await savePlant(basePlantParams);
    expect(result).toEqual(mockPlant);
  });

  it("handles background care tips cache failure gracefully", async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ plant: mockPlant }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true }),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = await savePlant(basePlantParams);
    expect(result).toEqual(mockPlant);

    // Wait for fire-and-forget promise to settle
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Background care tips caching failed"),
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("uses default wateringIntervalDays and lastWateredAt when not provided", async () => {
    await savePlant({
      imageUrl: "https://example.com/plant.jpg",
      species: "Rosa gallica",
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.wateringIntervalDays).toBe(3);
    expect(body.lastWateredAt).toBeDefined();
  });
});
