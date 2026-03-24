import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { getCareTips, CareTips } from "../../libs/getCareTips";
import { Button } from "../../components/ui/Button";
import { TopAppBar } from "../../components/ui/TopAppBar";
import { EditorialHeader } from "../../components/ui/EditorialHeader";
import { Colors, Typography, Spacing, BorderRadius } from "../../constants/theme";
import { useAlert } from "../../context/AlertContext";

const theme = Colors.light;

interface Plant {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string;
}

export default function Tips() {
  const params = useLocalSearchParams<{ plantId?: string }>();
  const router = useRouter();

  const [step, setStep] = useState<"select" | "loading" | "display">("select");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(false);
  const [careTips, setCareTips] = useState<CareTips | null>(null);
  const [progress] = useState(new Animated.Value(0));
  const { showAlert } = useAlert();

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (params.plantId && plants.length > 0) {
      const plant = plants.find((p) => p.id === params.plantId);
      if (plant) {
        setSelectedPlant(plant);
        setStep("loading");

        progress.setValue(0);
        Animated.timing(progress, {
          toValue: 100,
          duration: 5000,
          useNativeDriver: false,
          easing: (t) => t * t,
        }).start();

        getCareTips({
          plantName: plant.name,
          scientificName: plant.scientific_name || undefined,
        })
          .then((tips) => {
            setCareTips(tips);
            setStep("display");
          })
          .catch((error) => {
            console.error("Error getting care tips:", error);
            showAlert({ type: 'error', title: 'Erro', message: 'Falha ao carregar dicas de cuidado. Tente novamente.' });
            setStep("select");
          });
      }
    }
  }, [params.plantId, plants, progress, showAlert]);

  async function loadPlants() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/list-plants`,
        { headers }
      );
      const json = await response.json();

      if (!response.ok || json.error) {
        console.error("Error loading plants:", json.error);
        return;
      }

      setPlants(json.plants || []);
    } catch (error) {
      console.error("Error loading plants:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlant(plant: Plant) {
    setSelectedPlant(plant);
    setStep("loading");

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 100,
      duration: 5000,
      useNativeDriver: false,
      easing: (t) => t * t,
    }).start();

    try {
      const tips = await getCareTips({
        plantName: plant.name,
        scientificName: plant.scientific_name || undefined,
      });

      setCareTips(tips);
      setStep("display");
    } catch (error) {
      console.error("Error getting care tips:", error);
      showAlert({ type: 'error', title: 'Erro', message: 'Falha ao carregar dicas de cuidado. Tente novamente.' });
      setStep("select");
    }
  }

  function resetTips() {
    setStep("select");
    setSelectedPlant(null);
    setCareTips(null);
  }

  // ── Select Step ──
  if (step === "select") {
    if (loading) {
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.surface }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.onSurfaceVariant }]}>
            Carregando plantas...
          </Text>
        </View>
      );
    }

    if (plants.length === 0) {
      return (
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          <TopAppBar onBack={() => router.back()} />
          <View style={styles.emptyContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.secondaryContainer }]}>
              <MaterialCommunityIcons name="sprout" size={40} color={theme.secondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.onSurface }]}>
              Nenhuma planta cadastrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.onSurfaceVariant }]}>
              Adicione plantas primeiro para ver dicas de cuidado
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <TopAppBar onBack={() => router.back()} />
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <EditorialHeader
              label="CUIDADOS"
              title="Dicas de Cuidado"
              subtitle="Selecione uma planta para ver dicas detalhadas"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.plantCard, { backgroundColor: theme.surfaceContainerLow }]}
              onPress={() => handleSelectPlant(item)}
              activeOpacity={0.7}
            >
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.plantImage} />
              )}
              <View style={styles.plantInfo}>
                <Text style={[styles.plantName, { color: theme.onSurface }]}>{item.name}</Text>
                {item.scientific_name && (
                  <Text style={[styles.plantScientific, { color: theme.onSurfaceVariant }]}>
                    {item.scientific_name}
                  </Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // ── Loading Step ──
  if (step === "loading") {
    const progressWidth = progress.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.secondaryContainer }]}>
          <MaterialCommunityIcons name="lightbulb-on" size={40} color={theme.secondary} />
        </View>
        <Text style={[styles.analyzingText, { color: theme.onSurface }]}>
          Buscando dicas de cuidado...
        </Text>
        <Text style={[styles.analyzingSubtext, { color: theme.onSurfaceVariant }]}>
          Preparando informacoes detalhadas para {selectedPlant?.name}
        </Text>

        <View style={[styles.progressBarContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth, backgroundColor: theme.primaryContainer },
            ]}
          />
        </View>

        <Text style={[styles.analyzingNote, { color: theme.outlineVariant }]}>
          Isso pode levar alguns segundos...
        </Text>
      </View>
    );
  }

  // ── Display Step ──
  if (step === "display" && careTips) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <TopAppBar onBack={resetTips} />
        <ScrollView contentContainerStyle={styles.tipsContent}>
          <EditorialHeader
            label="GUIA DE CUIDADOS"
            title={careTips.plantName}
            subtitle={careTips.scientificName || undefined}
          />

          {careTips.toxicityWarning && (
            <View style={[styles.warningBox, { backgroundColor: theme.errorContainer }]}>
              <MaterialCommunityIcons name="alert" size={24} color={theme.error} />
              <Text style={[styles.warningText, { color: theme.onErrorContainer }]}>
                {careTips.toxicityWarning}
              </Text>
            </View>
          )}

          {/* Watering */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="water" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Rega</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Frequencia:</Text> {careTips.watering.frequency}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Quantidade:</Text> {careTips.watering.amount}
            </Text>
            {careTips.watering.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Light */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLowest }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="white-balance-sunny" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Luz</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Necessidades:</Text> {careTips.light.requirements}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Posicionamento:</Text> {careTips.light.placement}
            </Text>
            {careTips.light.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Soil */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="sprout" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Solo e Substrato</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Tipo:</Text> {careTips.soil.type}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>pH:</Text> {careTips.soil.ph}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Drenagem:</Text> {careTips.soil.drainage}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Replantio:</Text> {careTips.soil.repotting}
            </Text>
            {careTips.soil.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Fertilizer */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLowest }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="leaf" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Adubacao</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Tipo:</Text> {careTips.fertilizer.type}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Frequencia:</Text> {careTips.fertilizer.frequency}
            </Text>
            {careTips.fertilizer.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Temperature & Humidity */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="thermometer" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Temperatura e Umidade</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Temperatura ideal:</Text> {careTips.temperature.ideal}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Umidade:</Text> {careTips.temperature.humidity}
            </Text>
            {careTips.temperature.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Maintenance */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLowest }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="content-cut" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Manutencao</Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Poda:</Text> {careTips.maintenance.pruning}
            </Text>
            <Text style={[styles.sectionDetail, { color: theme.onSurface }]}>
              <Text style={styles.detailLabel}>Limpeza:</Text> {careTips.maintenance.cleaning}
            </Text>
            {careTips.maintenance.tips.map((tip, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {tip}
              </Text>
            ))}
          </View>

          {/* Problems */}
          <View style={[styles.section, { backgroundColor: theme.surfaceContainerLow }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="bug" size={22} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Problemas Comuns</Text>
            <Text style={[styles.problemCategory, { color: theme.onSurface }]}>Pragas:</Text>
            {careTips.problems.pests.map((pest, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {pest}
              </Text>
            ))}
            <Text style={[styles.problemCategory, styles.problemCategorySpaced, { color: theme.onSurface }]}>
              Doencas:
            </Text>
            {careTips.problems.diseases.map((disease, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {disease}
              </Text>
            ))}
            <Text style={[styles.problemCategory, styles.problemCategorySpaced, { color: theme.onSurface }]}>
              Prevencao:
            </Text>
            {careTips.problems.prevention.map((prevention, index) => (
              <Text key={index} style={[styles.tipItem, { color: theme.onSurfaceVariant }]}>
                {"\u2022"} {prevention}
              </Text>
            ))}
          </View>

          {/* Special Tips */}
          {careTips.specialTips.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.secondaryContainer }]}>
              <View style={[styles.sectionIconContainer, { backgroundColor: theme.surfaceContainerLowest }]}>
                <MaterialCommunityIcons name="star" size={22} color={theme.secondary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.onSurface }]}>Dicas Especiais</Text>
              {careTips.specialTips.map((tip, index) => (
                <Text key={index} style={[styles.tipItem, { color: theme.onSecondaryContainer }]}>
                  {"\u2022"} {tip}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button title="Ver Outra Planta" onPress={resetTips} variant="primary" fullWidth />
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  plantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  plantImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.base,
    marginBottom: 2,
  },
  plantScientific: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize.xl,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
  },
  analyzingText: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.xl,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  analyzingSubtext: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xl,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  progressBarContainer: {
    width: "80%",
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  analyzingNote: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
    fontStyle: "italic",
  },
  tipsContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + Spacing.lg,
  },
  warningBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.sm,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.sm,
  },
  sectionDetail: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    fontFamily: Typography.fontFamily.bodySemiBold,
  },
  tipItem: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginTop: Spacing.xs,
  },
  problemCategory: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  problemCategorySpaced: {
    marginTop: Spacing.sm,
  },
  actionButtons: {
    marginTop: Spacing.lg,
  },
});
