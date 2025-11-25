import { Image, View, Button, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { compressImage } from "../../utils/compressImage";
import { supabase } from "../../libs/supabaseClient";
import * as FileSystem from "expo-file-system";

export default function Preview() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();

  if (!uri) {
    return (
      <View>
        <Text>No image found.</Text>
      </View>
    );
  }

  async function uploadImage() {
    const compressed = await compressImage(uri);

    const file = await FileSystem.readAsStringAsync(compressed, {
      encoding: "base64",
    });

    const fileName = `plants/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("plant-images")
      .upload(fileName, Buffer.from(file, "base64"), {
        contentType: "image/jpeg",
      });

    if (error) {
      console.error("Upload error:", error);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("plant-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    router.push({
      pathname: "/(plants)/add",
      params: { imageUrl },
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "80%", resizeMode: "cover" }}
      />
      <Button title="Use this photo" onPress={uploadImage} />
    </View>
  );
}