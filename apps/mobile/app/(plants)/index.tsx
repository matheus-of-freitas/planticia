import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { supabase } from "../../libs/supabaseClient";
import { useRouter } from "expo-router";

interface Plant {
  id: string;
  name: string;
  image_url: string;
}

export default function MyPlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function loadPlants(showLoader = true) {
    if (showLoader) setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading plants:", error);
      alert("Error loading plants");
      setLoading(false);
      return;
    }

    setPlants(data || []);
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlants(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("plants-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plants" },
        () => loadPlants(false)
      )
      .subscribe();

    loadPlants();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading plants...</Text>
      </View>
    );
  }

  if (plants.length === 0) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Text style={{ marginBottom: 16 }}>No plants yet 🌱</Text>
        <TouchableOpacity onPress={() => router.push("/(plants)/add")}>
          <Text style={{ fontSize: 16, color: "blue" }}>Add your first plant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={plants}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(plants)/details",
              params: { plantId: item.id },
            })
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#f8f8f8",
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          {item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: 60, height: 60, borderRadius: 8, marginRight: 12 }}
            />
          )}
          <Text style={{ fontSize: 16, fontWeight: "500" }}>
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}
