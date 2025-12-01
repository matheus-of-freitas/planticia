import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, StyleSheet } from "react-native";
import { supabase } from "../libs/supabaseClient";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";

interface Plant {
  id: string;
  name: string;
  image_url: string;
}

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function loadPlants(showLoader = true) {
    if (showLoader) setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`https://ubwoxfprrhpcjboyturx.functions.supabase.co/list-plants?userId=${user.id}`);
      const json = await response.json();

      if (!response.ok || json.error) {
        console.error("Error loading plants:", json.error);
        setLoading(false);
        return;
      }

      setPlants(json.plants || []);
    } catch (error) {
      console.error("Error loading plants:", error);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPlants(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/(auth)/login");
      return;
    }

    if (session) {
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
    }
  }, [session, authLoading, router]);

  // Reload plants when screen comes into focus (e.g., after adding a plant)
  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadPlants(false);
      }
    }, [session])
  );

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Carregando plantas...</Text>
      </View>
    );
  }

  if (plants.length === 0) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Text style={{ marginBottom: 16 }}>Nenhuma planta ainda 🌱</Text>
        <TouchableOpacity onPress={() => router.push("/(plants)/add")}>
          <Text style={{ fontSize: 16, color: "blue" }}>Adicione sua primeira planta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(plants)/add")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
    lineHeight: 32,
  },
});