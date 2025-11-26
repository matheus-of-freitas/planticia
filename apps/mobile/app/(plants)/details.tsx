import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, Button } from "react-native";
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

      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("id", plantId)
        .single();

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
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator />
        <Text>Loading plant...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Text>Plant not found</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex:1, alignItems:"center", padding:16 }}>
      {plant.image_url ? (
        <Image
          source={{ uri: plant.image_url }}
          style={{ width: 250, height: 250, borderRadius: 12, marginBottom: 24 }}
        />
      ) : null}

      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
        {plant.name}
      </Text>
      <Text style={{ fontStyle: "italic", marginBottom: 16 }}>
        {plant.scientific_name}
      </Text>

      {plant.watering_interval_days != null && (
        <Text style={{ marginBottom: 8 }}>
          Water every {plant.watering_interval_days} days
        </Text>
      )}

      {plant.light_preference && (
        <Text style={{ marginBottom: 8 }}>
          Light: {plant.light_preference}
        </Text>
      )}

      {plant.description && (
        <Text style={{ marginTop: 16 }}>{plant.description}</Text>
      )}

      <View style={{ marginTop: 24 }}>
        <Button title="Back to My Plants" onPress={() => router.push("/(plants)")} />
      </View>
    </View>
  );
}
