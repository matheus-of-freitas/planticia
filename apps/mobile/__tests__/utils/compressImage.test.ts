import { compressImage } from "../../utils/compressImage";

// Mock expo-image-manipulator with the new API used by compressImage
jest.mock("expo-image-manipulator", () => {
  const mockSaveAsync = jest.fn().mockResolvedValue({ uri: "compressed-uri" });
  const mockRenderAsync = jest.fn().mockResolvedValue({
    saveAsync: mockSaveAsync,
  });
  const mockResize = jest.fn();
  const mockManipulate = jest.fn().mockReturnValue({
    resize: mockResize,
    renderAsync: mockRenderAsync,
  });

  return {
    ImageManipulator: {
      manipulate: mockManipulate,
    },
    SaveFormat: {
      JPEG: "jpeg",
      PNG: "png",
    },
    __mocks: {
      manipulate: mockManipulate,
      resize: mockResize,
      renderAsync: mockRenderAsync,
      saveAsync: mockSaveAsync,
    },
  };
});

const { __mocks } = require("expo-image-manipulator");

describe("compressImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the compressed image URI", async () => {
    const result = await compressImage("file:///original.jpg");
    expect(result).toBe("compressed-uri");
  });

  it("calls ImageManipulator.manipulate with the input URI", async () => {
    await compressImage("file:///photo.jpg");
    expect(__mocks.manipulate).toHaveBeenCalledWith("file:///photo.jpg");
  });

  it("resizes to width 1080", async () => {
    await compressImage("file:///photo.jpg");
    expect(__mocks.resize).toHaveBeenCalledWith({ width: 1080 });
  });

  it("saves as JPEG with 0.7 compression", async () => {
    await compressImage("file:///photo.jpg");
    expect(__mocks.saveAsync).toHaveBeenCalledWith({
      compress: 0.7,
      format: "jpeg",
    });
  });
});
