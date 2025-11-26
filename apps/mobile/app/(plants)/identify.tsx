import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Button } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { uploadImage } from "../../libs/uploadImage";
import { identifyPlant } from "../../libs/identifyPlant";

export default function Identify() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function process() {
      if (!imageUri) return;
      try {
        const publicUrl = await uploadImage(imageUri);
        const data = await identifyPlant(publicUrl);
        setResult(data);
      } catch (err: any) {
        console.error(err);
        alert("Error identifying plant");
      } finally {
        setLoading(false);
      }
    }

    process();
  }, [imageUri]);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
        <Text>Identifying plant...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Text>No result found</Text>
        <Button title="Try Again" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, alignItems: "center", padding: 16 }}>
      <Image
        source={{ uri: imageUri }}
        style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 24 }}
      />
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
        {result.commonName || "Unknown name"}
      </Text>
      <Text style={{ marginBottom: 12 }}>
        Scientific: {result.species}
      </Text>
      <Text style={{ marginBottom: 24 }}>
        Confidence: {(result.confidence * 100).toFixed(1)}%
      </Text>

      <Button
        title="Save Plant"
        onPress={() =>
          alert(
            "Saving to DB will be implemented in Phase 6 🤓 (press back for now)"
          )
        }
      />
    </View>
  );
}
