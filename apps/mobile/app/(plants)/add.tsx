import { Text, View, Button, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function AddPlant() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl?: string }>();
  const router = useRouter();

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ marginBottom: 16 }}>
        Add Plant (placeholder — will call identification next)
      </Text>

      {imageUrl && (
        <>
          <Image
            source={{ uri: imageUrl }}
            style={{ width: 200, height: 200, marginBottom: 16 }}
          />
          <Text>Image uploaded successfully!</Text>
        </>
      )}

      <Button
        title="Take Photo"
        onPress={() => router.push("/(plants)/camera")}
      />
    </View>
  );
}