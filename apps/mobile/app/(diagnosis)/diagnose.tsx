import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "../../libs/supabaseClient";
import { diagnosePlant } from "../../libs/diagnosePlant";

interface Plant {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string;
}

interface DiagnosisResult {
  isHealthy: boolean;
  confidence: number;
  diagnosis: string;
  severity: string;
  symptoms: string[];
  causes: string[];
  treatment: {
    immediate: string[];
    ongoing: string[];
    prevention: string[];
  };
  prognosis: string;
  additionalNotes: string;
}

export default function Diagnose() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plantId?: string }>();

  const [step, setStep] = useState<"select" | "capture" | "result">("select");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (params.plantId && plants.length > 0) {
      const plant = plants.find((p) => p.id === params.plantId);
      if (plant) {
        setSelectedPlant(plant);
        setStep("capture");
      }
    }
  }, [params.plantId, plants]);

  async function loadPlants() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://ubwoxfprrhpcjboyturx.functions.supabase.co/list-plants?userId=${user.id}`
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
    setStep("capture");
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão Necessária", "Permissão de câmera é necessária para tirar fotos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await performDiagnosis(result.assets[0].uri);
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await performDiagnosis(result.assets[0].uri);
    }
  }

  async function performDiagnosis(uri: string) {
    if (!selectedPlant) return;

    setAnalyzing(true);

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 100,
      duration: 6500,
      useNativeDriver: false,
      easing: (t) => t * t,
    }).start();

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: "base64",
      });

      const result = await diagnosePlant({
        imageBase64: base64,
        mimeType: "image/jpeg",
        plantName: selectedPlant.name,
        scientificName: selectedPlant.scientific_name || undefined,
      });

      setDiagnosis(result);
      setStep("result");
    } catch (error) {
      console.error("Error diagnosing plant:", error);
      Alert.alert("Erro", "Falha ao analisar a planta. Tente novamente.");
    } finally {
      setAnalyzing(false);
    }
  }

  function resetDiagnosis() {
    setStep("select");
    setSelectedPlant(null);
    setImageUri(null);
    setDiagnosis(null);
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
            Adicione plantas primeiro para diagnosticá-las
          </Text>
          <Button title="Adicionar Planta" onPress={() => router.push("/(plants)/add")} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Selecione a Planta</Text>
          <Text style={styles.headerSubtitle}>
            Qual planta você gostaria de diagnosticar?
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

  if (step === "capture") {
    if (analyzing) {
      const progressWidth = progress.interpolate({
        inputRange: [0, 100],
        outputRange: ["0%", "100%"],
      });

      return (
        <View style={styles.centerContainer}>
          <Text style={styles.analyzingIcon}>🔬</Text>
          <Text style={styles.analyzingText}>Diagnosticando planta...</Text>
          <Text style={styles.analyzingSubtext}>
            Usando inteligência artificial para análise
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

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Diagnosticar: {selectedPlant?.name}</Text>
          <Text style={styles.headerSubtitle}>
            Tire ou escolha uma foto da área problemática
          </Text>
        </View>

        <View style={styles.captureContainer}>
          <Text style={styles.icon}>🔬</Text>
          <Text style={styles.captureTitle}>Capturar Imagem</Text>
          <Text style={styles.captureDescription}>
            Para um diagnóstico preciso, fotografe de perto a área afetada da planta
            (folhas, caule, raízes visíveis, etc.)
          </Text>

          <View style={styles.buttonGroup}>
            <Button title="Tirar Foto" onPress={takePhoto} />
            <View style={{ height: 12 }} />
            <Button title="Escolher da Galeria" onPress={pickPhoto} />
            <View style={{ height: 12 }} />
            <Button title="Voltar" onPress={() => setStep("select")} color="#666" />
          </View>
        </View>
      </View>
    );
  }

  if (step === "result" && diagnosis) {
    const healthIcon = diagnosis.isHealthy ? "✅" : "⚠️";
    const severityColor =
      diagnosis.severity === "grave"
        ? "#d32f2f"
        : diagnosis.severity === "moderada"
        ? "#ff9800"
        : "#4caf50";

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          )}

          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{healthIcon}</Text>
            <Text style={styles.resultTitle}>{diagnosis.diagnosis}</Text>
            <Text style={styles.resultPlant}>
              {selectedPlant?.name}
              {selectedPlant?.scientific_name && ` (${selectedPlant.scientific_name})`}
            </Text>
            <View style={styles.metaContainer}>
              <Text style={styles.confidenceText}>
                Confiança: {Math.round(diagnosis.confidence * 100)}%
              </Text>
              {diagnosis.severity !== "nenhuma" && (
                <Text style={[styles.severityBadge, { backgroundColor: severityColor }]}>
                  {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                </Text>
              )}
            </View>
          </View>

          {diagnosis.symptoms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sintomas Identificados</Text>
              {diagnosis.symptoms.map((symptom, index) => (
                <Text key={index} style={styles.listItem}>
                  • {symptom}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.causes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Causas Prováveis</Text>
              {diagnosis.causes.map((cause, index) => (
                <Text key={index} style={styles.listItem}>
                  • {cause}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.immediate.length > 0 && (
            <View style={[styles.section, styles.treatmentSection]}>
              <Text style={styles.sectionTitle}>🚨 Ações Imediatas</Text>
              {diagnosis.treatment.immediate.map((action, index) => (
                <Text key={index} style={styles.listItem}>
                  {index + 1}. {action}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.ongoing.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Tratamento Contínuo</Text>
              {diagnosis.treatment.ongoing.map((treatment, index) => (
                <Text key={index} style={styles.listItem}>
                  • {treatment}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.prevention.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛡️ Prevenção</Text>
              {diagnosis.treatment.prevention.map((prevention, index) => (
                <Text key={index} style={styles.listItem}>
                  • {prevention}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prognóstico</Text>
            <Text style={styles.prognosisText}>{diagnosis.prognosis}</Text>
          </View>

          {diagnosis.additionalNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações Adicionais</Text>
              <Text style={styles.notesText}>{diagnosis.additionalNotes}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button title="Novo Diagnóstico" onPress={resetDiagnosis} />
            <View style={{ height: 12 }} />
            <Button
              title="Voltar para Planta"
              onPress={() =>
                router.push({
                  pathname: "/(plants)/details",
                  params: { plantId: selectedPlant?.id },
                })
              }
              color="#666"
            />
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
  captureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  captureDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 300,
  },
  analyzingIcon: {
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
  resultContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  resultImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  resultPlant: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#666",
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confidenceText: {
    fontSize: 14,
    color: "#888",
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  treatmentSection: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
    color: "#333",
  },
  prognosisText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#333",
  },
  notesText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#666",
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: 16,
  },
});