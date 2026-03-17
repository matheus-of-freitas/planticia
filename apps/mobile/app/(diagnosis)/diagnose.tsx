import { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { diagnosePlant } from "../../libs/diagnosePlant";
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
  const { showAlert } = useAlert();

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
    setStep("capture");
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        type: 'warning',
        title: 'Permissão Necessária',
        message: 'Permissão de câmera é necessária para tirar fotos.',
      });
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
      showAlert({ type: 'error', title: 'Erro', message: 'Falha ao analisar a planta. Tente novamente.' });
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
            Adicione plantas primeiro para diagnostica-las
          </Text>
          <Button
            title="Adicionar Planta"
            onPress={() => router.push("/(plants)/add")}
            variant="primary"
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Selecione a Planta</Text>
          <Text style={styles.headerSubtitle}>
            Qual planta voce gostaria de diagnosticar?
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
          <MaterialCommunityIcons name="microscope" size={64} color={theme.primary} style={{ marginBottom: Spacing.xl }} />
          <Text style={styles.analyzingText}>Diagnosticando planta...</Text>
          <Text style={styles.analyzingSubtext}>
            Usando inteligencia artificial para analise
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
            Tire ou escolha uma foto da area problematica
          </Text>
        </View>

        <View style={styles.captureContainer}>
          <MaterialCommunityIcons name="microscope" size={64} color={theme.primary} style={{ marginBottom: Spacing.md }} />
          <Text style={styles.captureTitle}>Capturar Imagem</Text>
          <Text style={styles.captureDescription}>
            Para um diagnostico preciso, fotografe de perto a area afetada da planta
            (folhas, caule, raizes visiveis, etc.)
          </Text>

          <View style={styles.buttonGroup}>
            <Button title="Tirar Foto" onPress={takePhoto} variant="primary" fullWidth />
            <View style={{ height: Spacing.sm }} />
            <Button title="Escolher da Galeria" onPress={pickPhoto} variant="outline" fullWidth />
            <View style={{ height: Spacing.sm }} />
            <Button title="Voltar" onPress={() => setStep("select")} variant="ghost" fullWidth />
          </View>
        </View>
      </View>
    );
  }

  if (step === "result" && diagnosis) {
    const severityColor =
      diagnosis.severity === "grave"
        ? theme.error
        : diagnosis.severity === "moderada"
        ? theme.warning
        : theme.success;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          )}

          <View style={styles.resultHeader}>
            {diagnosis.isHealthy ? (
              <MaterialCommunityIcons name="check-circle" size={48} color={theme.success} style={{ marginBottom: Spacing.sm }} />
            ) : (
              <MaterialCommunityIcons name="alert-circle" size={48} color={theme.warning} style={{ marginBottom: Spacing.sm }} />
            )}
            <Text style={styles.resultTitle}>{diagnosis.diagnosis}</Text>
            <Text style={styles.resultPlant}>
              {selectedPlant?.name}
              {selectedPlant?.scientific_name && ` (${selectedPlant.scientific_name})`}
            </Text>
            <View style={styles.metaContainer}>
              <Text style={styles.confidenceText}>
                Confianca: {Math.round(diagnosis.confidence * 100)}%
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
                  {"\u2022"} {symptom}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.causes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Causas Provaveis</Text>
              {diagnosis.causes.map((cause, index) => (
                <Text key={index} style={styles.listItem}>
                  {"\u2022"} {cause}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.immediate.length > 0 && (
            <View style={[styles.section, styles.treatmentSection]}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="alert" size={20} color={theme.warning} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.sectionTitle}>Acoes Imediatas</Text>
              </View>
              {diagnosis.treatment.immediate.map((action, index) => (
                <Text key={index} style={styles.listItem}>
                  {index + 1}. {action}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.ongoing.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="clipboard-text" size={20} color={theme.primary} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.sectionTitle}>Tratamento Continuo</Text>
              </View>
              {diagnosis.treatment.ongoing.map((treatment, index) => (
                <Text key={index} style={styles.listItem}>
                  {"\u2022"} {treatment}
                </Text>
              ))}
            </View>
          )}

          {diagnosis.treatment.prevention.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="shield-check" size={20} color={theme.primary} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.sectionTitle}>Prevencao</Text>
              </View>
              {diagnosis.treatment.prevention.map((prevention, index) => (
                <Text key={index} style={styles.listItem}>
                  {"\u2022"} {prevention}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prognostico</Text>
            <Text style={styles.prognosisText}>{diagnosis.prognosis}</Text>
          </View>

          {diagnosis.additionalNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observacoes Adicionais</Text>
              <Text style={styles.notesText}>{diagnosis.additionalNotes}</Text>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Button title="Novo Diagnostico" onPress={resetDiagnosis} variant="primary" fullWidth />
            <View style={{ height: Spacing.sm }} />
            <Button
              title="Voltar para Planta"
              onPress={() =>
                router.push({
                  pathname: "/(plants)/details",
                  params: { plantId: selectedPlant?.id },
                })
              }
              variant="ghost"
              fullWidth
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
  captureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  captureTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  captureDescription: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  buttonGroup: {
    width: "100%",
    maxWidth: 300,
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
  resultContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  resultImage: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  resultHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  resultTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  resultPlant: {
    fontSize: Typography.fontSize.base,
    fontStyle: "italic",
    color: theme.textSecondary,
    marginBottom: Spacing.sm,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confidenceText: {
    fontSize: Typography.fontSize.sm,
    color: theme.textTertiary,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    color: theme.background,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    overflow: "hidden",
  },
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: BorderRadius.lg,
  },
  treatmentSection: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 4,
    borderLeftColor: theme.warning,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  listItem: {
    fontSize: Typography.fontSize.base - 1,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing.sm,
    color: theme.text,
  },
  prognosisText: {
    fontSize: Typography.fontSize.base - 1,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    color: theme.text,
  },
  notesText: {
    fontSize: Typography.fontSize.base - 1,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    color: theme.textSecondary,
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: Spacing.md,
  },
});
