import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Button, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../libs/supabaseClient";

interface Plant {
  id: string;
  name: string | null;
  scientific_name: string | null;
  image_url: string | null;
  watering_interval_days: number | null;
  last_watered_at: string | null;
  light_preference: string | null;
  description: string | null;
}

export default function PlantDetails() {
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (!plantId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("plants").select("*").eq("id", plantId).single();

      if (error) {
        console.error("Error loading plant:", error);
        alert("Error loading plant");
      } else {
        setPlant(data);
      }

      setLoading(false);
    }

    load();
  }, [plantId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text>Carregando planta...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Planta não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16, paddingBottom: 100 }}>
        {plant.image_url ? (
          <Image
            source={{ uri: plant.image_url }}
            style={{
              width: "100%",
              height: 300,
              borderRadius: 12,
              marginBottom: 24,
            }}
            resizeMode="cover"
          />
        ) : null}

        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
          }}>
          {plant.name}
        </Text>
        <Text
          style={{
            fontStyle: "italic",
            marginBottom: 24,
            textAlign: "center",
            color: "#666",
            fontSize: 16,
          }}>
          {plant.scientific_name}
        </Text>

        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
          }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 12,
            }}>
            🌱 Informações de Cuidado
          </Text>

          {plant.watering_interval_days != null && (
            <Text
              style={{
                marginBottom: 8,
                fontSize: 16,
                lineHeight: 24,
              }}>
              💧 <Text style={{ fontWeight: "600" }}>Rega:</Text> A cada{" "}
              {plant.watering_interval_days} dias
            </Text>
          )}

          {plant.light_preference && (
            <Text
              style={{
                marginBottom: 8,
                fontSize: 16,
                lineHeight: 24,
              }}>
              ☀️ <Text style={{ fontWeight: "600" }}>Luz:</Text>{" "}
              {plant.light_preference.charAt(0).toUpperCase() + plant.light_preference.slice(1)}
            </Text>
          )}

          {plant.last_watered_at && (
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#888",
              }}>
              Última rega: {new Date(plant.last_watered_at).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>

        {plant.description && (
          <View
            style={{
              backgroundColor: "#f0f9ff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}>
              Dicas de Cuidado
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "#333",
              }}>
              {plant.description}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 24, gap: 12, width: "100%" }}>
          <Button title="Diagnosticar Problemas" onPress={() => router.push("/(diagnosis)/diagnose")} />
          <Button title="Mais Dicas de Cuidado" onPress={() => router.push("/(tips)")} />
        </View>
      </ScrollView>
    </View>
  );
}
