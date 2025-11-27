import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Button, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { uploadImage } from "../../libs/uploadImage";
import { identifyPlant } from "../../libs/identifyPlant";
import { savePlant } from "@/libs/savePlant";
import * as FileSystem from "expo-file-system/legacy";

export default function Identify() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function process() {
      if (!imageUri) return;
      try {
        // Convert image to base64 for identification
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: "base64",
        });

        // Identify plant using base64
        const data = await identifyPlant(base64, "image/jpeg");
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

  async function handleSave() {
    if (!result || !imageUri) {
      alert("Nothing to save yet");
      return;
    }

    try {
      setSaving(true);

      // Upload image only when saving
      const publicUrl = await uploadImage(imageUri);

      const plant = await savePlant({
        imageUrl: publicUrl,
        species: result.species,
        commonName: result.commonName,
        wateringIntervalDays: result.wateringIntervalDays,
        lightPreference: result.lightPreference,
        description: result.description,
      });

      router.replace({
        pathname: "/(plants)/details",
        params: { plantId: plant.id },
      });
    } catch (err: any) {
      console.error(err);
      alert("Error saving plant");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Identificando planta...</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Nenhum resultado encontrado</Text>
        <Button title="Tentar Novamente" onPress={() => router.back()} />
      </View>
    );
  }

  if (result.confidence === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>⚠️</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
          Não é uma Planta
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 32, textAlign: "center" }}>
          A imagem enviada não parece ser de uma planta. Por favor, tire uma foto de uma planta real para identificação.
        </Text>
        <Button title="Tentar Novamente" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16, paddingBottom: 100 }}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 24 }}
        />
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
          {result.commonName || "Nome desconhecido"}
        </Text>
        <Text style={{ marginBottom: 12 }}>Científico: {result.species}</Text>
        <Text style={{ marginBottom: 12 }}>Confiança: {(result.confidence * 100).toFixed(1)}%</Text>

        {result.lightPreference && (
          <Text style={{ marginBottom: 8 }}>☀️ Luz: {result.lightPreference}</Text>
        )}
        {result.wateringIntervalDays && (
          <Text style={{ marginBottom: 8 }}>💧 Regar a cada {result.wateringIntervalDays} dias</Text>
        )}
        {result.description && (
          <Text style={{ marginBottom: 24, textAlign: "center", paddingHorizontal: 16, color: "#666" }}>
            {result.description}
          </Text>
        )}

        <View style={{ gap: 12, width: "100%", paddingHorizontal: 16 }}>
          <Button title={saving ? "Salvando..." : "Salvar Planta"} onPress={handleSave} disabled={saving} />
        </View>
      </ScrollView>
    </View>
  );
}
