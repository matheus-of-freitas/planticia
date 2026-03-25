import { getCareTips } from "../../libs/getCareTips";

describe("getCareTips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data with both plantName and scientificName", async () => {
    const mockTips = { plantName: "Rosa", watering: { frequency: "daily" } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockTips),
    });

    const result = await getCareTips({
      plantName: "Rosa",
      scientificName: "Rosa gallica",
    });

    expect(result).toEqual(mockTips);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("plant_name=Rosa"),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("scientific_name=Rosa+gallica"),
      expect.any(Object)
    );
  });

  it("includes only plantName param when scientificName is absent", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await getCareTips({ plantName: "Rosa" });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("plant_name=Rosa");
    expect(url).not.toContain("scientific_name");
  });

  it("throws error from error response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Tips not available" }),
    });

    await expect(
      getCareTips({ plantName: "Unknown" })
    ).rejects.toThrow("Tips not available");
  });

  it("includes only scientificName param when plantName is absent", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    await getCareTips({ scientificName: "Rosa gallica" });

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain("scientific_name=Rosa+gallica");
    expect(url).not.toContain("plant_name");
  });
});
