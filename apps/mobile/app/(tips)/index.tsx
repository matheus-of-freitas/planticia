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
import { useLocalSearchParams } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { getCareTips, CareTips } from "../../libs/getCareTips";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/theme";
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

  if (step === "select") {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Carregando plantas...</Text>
        </View>
      );
    }

    if (plants.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="sprout" size={64} color={theme.primary} />
          <Text style={styles.emptyTitle}>Nenhuma planta cadastrada</Text>
          <Text style={styles.emptySubtitle}>
            Adicione plantas primeiro para ver dicas de cuidado
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dicas de Cuidado</Text>
          <Text style={styles.headerSubtitle}>
            Selecione uma planta para ver dicas detalhadas
          </Text>
        </View>

        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.plantCard}
              onPress={() => handleSelectPlant(item)}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.plantImage} />
              )}
              <View style={styles.plantInfo}>
                <Text style={styles.plantName}>{item.name}</Text>
                {item.scientific_name && (
                  <Text style={styles.plantScientific}>{item.scientific_name}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  if (step === "loading") {
    const progressWidth = progress.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="lightbulb-on" size={64} color={theme.primary} style={{ marginBottom: Spacing.xl }} />
        <Text style={styles.analyzingText}>Buscando dicas de cuidado...</Text>
        <Text style={styles.analyzingSubtext}>
          Preparando informacoes detalhadas para {selectedPlant?.name}
        </Text>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>

        <Text style={styles.analyzingNote}>
          Isso pode levar alguns segundos...
        </Text>
      </View>
    );
  }

  if (step === "display" && careTips) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsTitle}>{careTips.plantName}</Text>
            {careTips.scientificName && (
              <Text style={styles.tipsScientific}>{careTips.scientificName}</Text>
            )}
          </View>

          {careTips.toxicityWarning && (
            <View style={styles.warningBox}>
              <MaterialCommunityIcons name="alert" size={24} color={theme.warning} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.warningText}>{careTips.toxicityWarning}</Text>
            </View>
          )}

          {/* Watering */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="water" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Rega</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Frequencia:</Text> {careTips.watering.frequency}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Quantidade:</Text> {careTips.watering.amount}
            </Text>
            {careTips.watering.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Light */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="white-balance-sunny" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Luz</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Necessidades:</Text> {careTips.light.requirements}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Posicionamento:</Text> {careTips.light.placement}
            </Text>
            {careTips.light.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Soil */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="sprout" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Solo e Substrato</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Tipo:</Text> {careTips.soil.type}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>pH:</Text> {careTips.soil.ph}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Drenagem:</Text> {careTips.soil.drainage}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Replantio:</Text> {careTips.soil.repotting}
            </Text>
            {careTips.soil.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Fertilizer */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="leaf" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Adubacao</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Tipo:</Text> {careTips.fertilizer.type}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Frequencia:</Text> {careTips.fertilizer.frequency}
            </Text>
            {careTips.fertilizer.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Temperature & Humidity */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="thermometer" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Temperatura e Umidade</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Temperatura ideal:</Text> {careTips.temperature.ideal}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Umidade:</Text> {careTips.temperature.humidity}
            </Text>
            {careTips.temperature.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Maintenance */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="content-cut" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Manutencao</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Poda:</Text> {careTips.maintenance.pruning}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Limpeza:</Text> {careTips.maintenance.cleaning}
            </Text>
            {careTips.maintenance.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
            ))}
          </View>

          {/* Problems */}
          <View style={styles.section}>
            <MaterialCommunityIcons name="bug" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.sectionTitle}>Problemas Comuns</Text>
            <Text style={styles.problemCategory}>Pragas:</Text>
            {careTips.problems.pests.map((pest, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {pest}</Text>
            ))}
            <Text style={[styles.problemCategory, { marginTop: Spacing.sm }]}>Doencas:</Text>
            {careTips.problems.diseases.map((disease, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {disease}</Text>
            ))}
            <Text style={[styles.problemCategory, { marginTop: Spacing.sm }]}>Prevencao:</Text>
            {careTips.problems.prevention.map((prevention, index) => (
              <Text key={index} style={styles.tipItem}>{"\u2022"} {prevention}</Text>
            ))}
          </View>

          {/* Special Tips */}
          {careTips.specialTips.length > 0 && (
            <View style={[styles.section, styles.specialSection]}>
              <MaterialCommunityIcons name="star" size={24} color={theme.primary} style={{ marginBottom: Spacing.sm }} />
              <Text style={styles.sectionTitle}>Dicas Especiais</Text>
              {careTips.specialTips.map((tip, index) => (
                <Text key={index} style={styles.tipItem}>{"\u2022"} {tip}</Text>
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
    backgroundColor: theme.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: theme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
  },
  listContainer: {
    padding: Spacing.md,
  },
  plantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: Spacing.xs,
  },
  plantScientific: {
    fontSize: Typography.fontSize.sm,
    fontStyle: "italic",
    color: theme.textSecondary,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
  },
  analyzingText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  analyzingSubtext: {
    fontSize: Typography.fontSize.sm,
    color: theme.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
    paddingHorizontal: Spacing.xl + Spacing.sm,
  },
  progressBarContainer: {
    width: "80%",
    height: 6,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.primaryLight,
    borderRadius: BorderRadius.sm,
  },
  analyzingNote: {
    fontSize: Typography.fontSize.xs,
    color: theme.textTertiary,
    textAlign: "center",
    fontStyle: "italic",
  },
  tipsContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  tipsHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    fontSize: Typography.fontSize["3xl"] - 2,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  tipsScientific: {
    fontSize: Typography.fontSize.lg,
    fontStyle: "italic",
    color: theme.textSecondary,
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: "#856404",
    fontWeight: Typography.fontWeight.semibold,
  },
  section: {
    backgroundColor: theme.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  specialSection: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: theme.info,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
  },
  sectionDetail: {
    fontSize: Typography.fontSize.base - 1,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing.sm,
    color: theme.text,
  },
  detailLabel: {
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
  },
  tipItem: {
    fontSize: Typography.fontSize.base - 1,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginTop: Spacing.xs,
    color: theme.textSecondary,
  },
  problemCategory: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    color: theme.text,
  },
  actionButtons: {
    marginTop: Spacing.lg,
  },
});
