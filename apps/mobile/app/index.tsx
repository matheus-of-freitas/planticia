import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from "../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../libs/config";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { FAB } from "../components/ui/FAB";
import { TopAppBar } from "../components/ui/TopAppBar";
import { EditorialHeader } from "../components/ui/EditorialHeader";
import { Colors, Typography, Spacing, BorderRadius } from "../constants/theme";

interface Plant {
  id: string;
  name: string;
  scientific_name?: string;
  image_url: string;
  watering_interval_days?: number;
  last_watered_at?: string;
}

function getNextWateringText(plant: Plant): string | null {
  if (!plant.watering_interval_days || !plant.last_watered_at) return null;
  const lastWatered = new Date(plant.last_watered_at);
  const nextWatering = new Date(lastWatered);
  nextWatering.setDate(lastWatered.getDate() + plant.watering_interval_days);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextWatering);
  next.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Regar hoje!";
  if (diffDays === 1) return "Regar amanhã";
  return `Regar em ${diffDays} dias`;
}

export default function Index() {
  const { session, loading: authLoading, signOut } = useAuth();
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
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/list-plants`, {
        headers,
      });
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
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <TopAppBar
          showBack={false}
          rightIcon="logout"
          onRightPress={signOut}
        />
        <EmptyState
          icon="🌱"
          title="Nenhuma planta ainda"
          message="Comece sua colecao adicionando sua primeira planta"
          actionLabel="Adicionar Planta"
          onAction={() => router.push("/(plants)/add")}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <TopAppBar
        showBack={false}
        rightIcon="logout"
        onRightPress={signOut}
      />
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <EditorialHeader
            label="CATALOGO"
            title="Minhas Plantas"
            subtitle={`${plants.length} ${plants.length === 1 ? 'planta no' : 'plantas no'} seu jardim`}
            style={styles.header}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const wateringText = getNextWateringText(item);
          return (
            <TouchableOpacity
              style={styles.cardWrapper}
              onPress={() =>
                router.push({
                  pathname: "/(plants)/details",
                  params: { plantId: item.id },
                })
              }
              activeOpacity={0.7}
            >
              <Card style={styles.plantCard} noPadding>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.plantImage}
                  />
                ) : (
                  <View style={[styles.plantImage, styles.plantImagePlaceholder, { backgroundColor: theme.surfaceContainerLow }]}>
                    <MaterialCommunityIcons name="flower" size={32} color={theme.outlineVariant} />
                  </View>
                )}
                <View style={styles.plantInfo}>
                  <Text style={[styles.plantName, { color: theme.onSurface }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {wateringText && (
                    <View style={styles.wateringRow}>
                      <MaterialCommunityIcons name="water-outline" size={12} color={theme.onSurfaceVariant} />
                      <Text style={[styles.wateringText, { color: theme.onSurfaceVariant }]} numberOfLines={1}>
                        {wateringText}
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      <FAB
        onPress={() => router.push("/(plants)/add")}
        label="Adicionar Planta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  plantCard: {
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    aspectRatio: 0.85,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  plantImagePlaceholder: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  plantInfo: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  plantName: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.sm,
    marginBottom: 2,
  },
  wateringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  wateringText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.xs - 1,
  },
});
