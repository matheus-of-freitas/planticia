import { diagnosePlant } from "../../libs/diagnosePlant";

describe("diagnosePlant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data on success", async () => {
    const mockData = { isHealthy: true, diagnosis: "No issues found" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await diagnosePlant({
      imageBase64: "base64data",
      mimeType: "image/jpeg",
    });

    expect(result).toEqual(mockData);
  });

  it("throws error field from error response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest
        .fn()
        .mockResolvedValue({ error: "Could not analyze image" }),
    });

    await expect(
      diagnosePlant({ imageBase64: "base64data", mimeType: "image/jpeg" })
    ).rejects.toThrow("Could not analyze image");
  });

  it("throws 'Failed to diagnose plant' when error field is absent", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({}),
    });

    await expect(
      diagnosePlant({ imageBase64: "base64data", mimeType: "image/jpeg" })
    ).rejects.toThrow("Failed to diagnose plant");
  });

  it("passes optional plantName and scientificName in the body", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ isHealthy: true }),
    });

    await diagnosePlant({
      imageBase64: "base64data",
      mimeType: "image/jpeg",
      plantName: "Rosa",
      scientificName: "Rosa gallica",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.supabase.co/functions/v1/diagnose-disease",
      {
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          image_base64: "base64data",
          mime_type: "image/jpeg",
          plant_name: "Rosa",
          scientific_name: "Rosa gallica",
        }),
      }
    );
  });
});
