import { identifyPlant } from "../../libs/identifyPlant";

describe("identifyPlant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    const mockData = { species: "Rosa", confidence: 0.95 };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
    });

    const result = await identifyPlant("base64data", "image/jpeg");
    expect(result).toEqual(mockData);
  });

  it("throws 'Server returned non-JSON' for non-JSON response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("<html>Error</html>"),
    });

    await expect(identifyPlant("base64data", "image/jpeg")).rejects.toThrow(
      "Server returned non-JSON (200)"
    );
  });

  it("throws data.error when response is not ok and has error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ error: "Plant not found" })),
    });

    await expect(identifyPlant("base64data", "image/jpeg")).rejects.toThrow(
      "Plant not found"
    );
  });

  it("throws data.message when response is not ok and has message field", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: jest
        .fn()
        .mockResolvedValue(JSON.stringify({ message: "Bad request" })),
    });

    await expect(identifyPlant("base64data", "image/jpeg")).rejects.toThrow(
      "Bad request"
    );
  });

  it("passes correct fetch arguments", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(JSON.stringify({ ok: true })),
    });

    await identifyPlant("img-base64", "image/png");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.supabase.co/functions/v1/identify",
      {
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: expect.stringContaining("Bearer"),
        }),
        body: JSON.stringify({
          image_base64: "img-base64",
          mime_type: "image/png",
        }),
      }
    );
  });
});
