import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export async function compressImage(uri: string) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width: 1080 });
  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  return result.uri;
}
