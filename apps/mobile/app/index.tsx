import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, StyleSheet } from "react-native";
import { supabase } from "../libs/supabaseClient";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { FAB } from "../components/ui/FAB";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

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
  const theme = Colors.light;

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

  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadPlants(false);
      }
    }, [session])
  );

  if (authLoading || loading) {
    return <LoadingScreen message="Carregando plantas..." />;
  }

  if (plants.length === 0) {
    return (
      <EmptyState
        icon="🌱"
        title="Nenhuma planta ainda"
        message="Comece sua coleção adicionando sua primeira planta"
        actionLabel="Adicionar Planta"
        onAction={() => router.push("/(plants)/add")}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(plants)/details",
                params: { plantId: item.id },
              })
            }
            activeOpacity={0.7}
          >
            <Card style={styles.plantCard} padding="md">
              <View style={styles.plantCardContent}>
                {item.image_url && (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.plantImage}
                  />
                )}
                <View style={styles.plantInfo}>
                  <Text style={[styles.plantName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.plantSubtitle, { color: theme.textSecondary }]}>
                    Toque para ver detalhes
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <FAB onPress={() => router.push("/(plants)/add")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  plantCard: {
    marginBottom: Spacing.md,
  },
  plantCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  plantImage: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs / 2,
  },
  plantSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  chevron: {
    fontSize: Typography.fontSize['2xl'],
    color: '#999',
    fontWeight: Typography.fontWeight.light,
  },
});