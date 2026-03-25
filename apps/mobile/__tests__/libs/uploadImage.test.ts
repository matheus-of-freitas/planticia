import { uploadImage } from "../../libs/uploadImage";

const ImageManipulator = require("expo-image-manipulator");
const FileSystem = require("expo-file-system/legacy");
const { supabase } = require("../../libs/supabaseClient");

describe("uploadImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the public URL on success", async () => {
    const result = await uploadImage("file:///photo.jpg");
    expect(result).toBe("https://example.com/test.jpg");
  });

  it("calls ImageManipulator.manipulateAsync with correct args", async () => {
    await uploadImage("file:///photo.jpg");

    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      "file:///photo.jpg",
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
  });

  it("calls FileSystem.readAsStringAsync with the manipulated URI", async () => {
    await uploadImage("file:///photo.jpg");

    expect(FileSystem.readAsStringAsync).toHaveBeenCalledWith(
      "manipulated-uri",
      { encoding: "base64" }
    );
  });

  it("throws when upload returns an error", async () => {
    const uploadError = new Error("Storage quota exceeded");
    supabase.storage.from.mockReturnValueOnce({
      upload: jest.fn().mockResolvedValue({ data: null, error: uploadError }),
      getPublicUrl: jest.fn(),
    });

    await expect(uploadImage("file:///photo.jpg")).rejects.toThrow(
      "Storage quota exceeded"
    );
  });
});
