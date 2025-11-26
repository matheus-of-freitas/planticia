import { supabase } from "./supabaseClient";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";

export async function uploadImage(uri: string) {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: "base64",
  });

  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);

  const filename = `plants/${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from("plant-images")
    .upload(filename, byteArray, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("plant-images")
    .getPublicUrl(filename);

  return urlData.publicUrl;
}
