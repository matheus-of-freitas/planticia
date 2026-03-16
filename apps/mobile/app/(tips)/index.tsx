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
  Alert,
  Animated,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, SUPABASE_HEADERS } from "../../libs/config";
import { getCareTips, CareTips } from "../../libs/getCareTips";

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
            Alert.alert("Erro", "Falha ao carregar dicas de cuidado. Tente novamente.");
            setStep("select");
          });
      }
    }
  }, [params.plantId, plants, progress]);

  async function loadPlants() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/list-plants?userId=${user.id}`,
        { headers: SUPABASE_HEADERS }
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
      Alert.alert("Erro", "Falha ao carregar dicas de cuidado. Tente novamente.");
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
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Carregando plantas...</Text>
        </View>
      );
    }

    if (plants.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.icon}>🌱</Text>
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
        <Text style={styles.loadingIcon}>💡</Text>
        <Text style={styles.analyzingText}>Buscando dicas de cuidado...</Text>
        <Text style={styles.analyzingSubtext}>
          Preparando informações detalhadas para {selectedPlant?.name}
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
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{careTips.toxicityWarning}</Text>
            </View>
          )}

          {/* Watering */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>💧</Text>
            <Text style={styles.sectionTitle}>Rega</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Frequência:</Text> {careTips.watering.frequency}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Quantidade:</Text> {careTips.watering.amount}
            </Text>
            {careTips.watering.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Light */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>☀️</Text>
            <Text style={styles.sectionTitle}>Luz</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Necessidades:</Text> {careTips.light.requirements}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Posicionamento:</Text> {careTips.light.placement}
            </Text>
            {careTips.light.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Soil */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>🌱</Text>
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
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Fertilizer */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>🌿</Text>
            <Text style={styles.sectionTitle}>Adubação</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Tipo:</Text> {careTips.fertilizer.type}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Frequência:</Text> {careTips.fertilizer.frequency}
            </Text>
            {careTips.fertilizer.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Temperature & Humidity */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>🌡️</Text>
            <Text style={styles.sectionTitle}>Temperatura e Umidade</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Temperatura ideal:</Text> {careTips.temperature.ideal}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Umidade:</Text> {careTips.temperature.humidity}
            </Text>
            {careTips.temperature.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Maintenance */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>✂️</Text>
            <Text style={styles.sectionTitle}>Manutenção</Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Poda:</Text> {careTips.maintenance.pruning}
            </Text>
            <Text style={styles.sectionDetail}>
              <Text style={styles.detailLabel}>Limpeza:</Text> {careTips.maintenance.cleaning}
            </Text>
            {careTips.maintenance.tips.map((tip, index) => (
              <Text key={index} style={styles.tipItem}>• {tip}</Text>
            ))}
          </View>

          {/* Problems */}
          <View style={styles.section}>
            <Text style={styles.sectionIcon}>🐛</Text>
            <Text style={styles.sectionTitle}>Problemas Comuns</Text>
            <Text style={styles.problemCategory}>Pragas:</Text>
            {careTips.problems.pests.map((pest, index) => (
              <Text key={index} style={styles.tipItem}>• {pest}</Text>
            ))}
            <Text style={[styles.problemCategory, { marginTop: 12 }]}>Doenças:</Text>
            {careTips.problems.diseases.map((disease, index) => (
              <Text key={index} style={styles.tipItem}>• {disease}</Text>
            ))}
            <Text style={[styles.problemCategory, { marginTop: 12 }]}>Prevenção:</Text>
            {careTips.problems.prevention.map((prevention, index) => (
              <Text key={index} style={styles.tipItem}>• {prevention}</Text>
            ))}
          </View>

          {/* Special Tips */}
          {careTips.specialTips.length > 0 && (
            <View style={[styles.section, styles.specialSection]}>
              <Text style={styles.sectionIcon}>⭐</Text>
              <Text style={styles.sectionTitle}>Dicas Especiais</Text>
              {careTips.specialTips.map((tip, index) => (
                <Text key={index} style={styles.tipItem}>• {tip}</Text>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={resetTips}>
              <Text style={styles.buttonText}>Ver Outra Planta</Text>
            </TouchableOpacity>
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
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  plantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  loadingIcon: {
    fontSize: 64,
    marginBottom: 32,
    textAlign: "center",
  },
  analyzingText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  analyzingSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  progressBarContainer: {
    width: "80%",
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  analyzingNote: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  tipsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tipsHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  tipsScientific: {
    fontSize: 18,
    fontStyle: "italic",
    color: "#666",
  },
  warningBox: {
    backgroundColor: "#fff3cd",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#856404",
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  specialSection: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  sectionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionDetail: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
    color: "#333",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#000",
  },
  tipItem: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 4,
    color: "#555",
  },
  problemCategory: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
    color: "#333",
  },
  actionButtons: {
    marginTop: 24,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});