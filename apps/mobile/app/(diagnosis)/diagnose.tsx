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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../libs/supabaseClient";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { diagnosePlant } from "../../libs/diagnosePlant";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TopAppBar } from "../../components/ui/TopAppBar";
import { EditorialHeader } from "../../components/ui/EditorialHeader";
import { Colors, Typography, Spacing, BorderRadius, Gradients } from "../../constants/theme";
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

  useEffect(() => { loadPlants(); }, []);

  useEffect(() => {
    if (params.plantId && plants.length > 0) {
      const plant = plants.find((p) => p.id === params.plantId);
      if (plant) { setSelectedPlant(plant); setStep("capture"); }
    }
  }, [params.plantId, plants]);

  async function loadPlants() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/list-plants`, { headers });
      const json = await response.json();
      if (!response.ok || json.error) { console.error("Error loading plants:", json.error); return; }
      setPlants(json.plants || []);
    } catch (error) { console.error("Error loading plants:", error); }
    finally { setLoading(false); }
  }

  async function handleSelectPlant(plant: Plant) { setSelectedPlant(plant); setStep("capture"); }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert({ type: 'warning', title: 'Permissao Necessaria', message: 'Permissao de camera e necessaria para tirar fotos.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); await performDiagnosis(result.assets[0].uri); }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) { setImageUri(result.assets[0].uri); await performDiagnosis(result.assets[0].uri); }
  }

  async function performDiagnosis(uri: string) {
    if (!selectedPlant) return;
    setAnalyzing(true);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 100, duration: 6500, useNativeDriver: false, easing: (t) => t * t }).start();
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
      const result = await diagnosePlant({ imageBase64: base64, mimeType: "image/jpeg", plantName: selectedPlant.name, scientificName: selectedPlant.scientific_name || undefined });
      setDiagnosis(result); setStep("result");
    } catch (error) {
      console.error("Error diagnosing plant:", error);
      showAlert({ type: 'error', title: 'Erro', message: 'Falha ao analisar a planta. Tente novamente.' });
    } finally { setAnalyzing(false); }
  }

  function resetDiagnosis() { setStep("select"); setSelectedPlant(null); setImageUri(null); setDiagnosis(null); }

  // SELECT STEP
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
        <View style={styles.container}>
          <TopAppBar onBack={() => router.back()} />
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="sprout" size={64} color={theme.primary} />
            <Text style={styles.emptyTitle}>Nenhuma planta cadastrada</Text>
            <Text style={styles.emptySubtitle}>Adicione plantas primeiro para diagnostica-las</Text>
            <Button title="Adicionar Planta" onPress={() => router.push("/(plants)/add")} variant="primary" />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <TopAppBar onBack={() => router.back()} />
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <EditorialHeader
              label="DIAGNOSTICO"
              title="Selecione a Planta"
              subtitle="Qual planta voce gostaria de diagnosticar?"
              style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md }}
            />
          }
          contentContainerStyle={styles.listContainer}
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
                <Text style={styles.plantName}>{item.name}</Text>
                {item.scientific_name && (
                  <Text style={styles.plantScientific}>{item.scientific_name}</Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // CAPTURE STEP
  if (step === "capture") {
    if (analyzing) {
      const progressWidth = progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="microscope" size={64} color={theme.primary} style={{ marginBottom: Spacing.xl }} />
          <Text style={styles.analyzingText}>Diagnosticando planta...</Text>
          <Text style={styles.analyzingSubtext}>Usando inteligencia artificial para analise</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
              <LinearGradient colors={[...Gradients.biophilic]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
          <Text style={styles.analyzingNote}>Isso pode levar alguns segundos...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <TopAppBar onBack={() => setStep("select")} />
        <ScrollView contentContainerStyle={styles.captureContent}>
          <EditorialHeader
            label="DIAGNOSTICO"
            title="Diagnosticar Doenca"
            subtitle="Nossa IA botanica ajudara a identificar problemas de saude e sugerir o tratamento ideal"
          />

          {/* Action cards */}
          <TouchableOpacity
            onPress={takePhoto}
            activeOpacity={0.7}
            style={[styles.actionCard, { backgroundColor: theme.surfaceContainerLow }]}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="camera" size={28} color={theme.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Tirar uma Foto</Text>
              <Text style={styles.actionDescription}>Analise sua planta instantaneamente</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickPhoto}
            activeOpacity={0.7}
            style={[styles.actionCard, { backgroundColor: theme.surfaceContainerLow }]}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="image-multiple" size={28} color={theme.secondary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Carregar da Galeria</Text>
              <Text style={styles.actionDescription}>Escolha uma foto da sua biblioteca</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
          </TouchableOpacity>

          {/* Botanical tip */}
          <Card variant="filled" style={styles.tipCard}>
            <View style={[styles.tipBadge, { backgroundColor: theme.secondaryContainer }]}>
              <Text style={[styles.tipBadgeText, { color: theme.onSecondaryContainer }]}>Dica do Jardineiro</Text>
            </View>
            <Text style={styles.tipTitle}>Boa iluminacao e fundamental</Text>
            <Text style={styles.tipText}>
              Para melhores resultados, fotografe de perto a area afetada com boa iluminacao natural
            </Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  // RESULT STEP
  if (step === "result" && diagnosis) {
    const severityColor = diagnosis.severity === "grave" ? theme.error : diagnosis.severity === "moderada" ? theme.warning : theme.success;

    return (
      <View style={styles.container}>
        <TopAppBar onBack={resetDiagnosis} />
        <ScrollView contentContainerStyle={styles.resultContainer}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.resultImage} />}

          <View style={styles.resultHeader}>
            {diagnosis.isHealthy ? (
              <MaterialCommunityIcons name="check-circle" size={48} color={theme.success} style={{ marginBottom: Spacing.sm }} />
            ) : (
              <MaterialCommunityIcons name="alert-circle" size={48} color={theme.warning} style={{ marginBottom: Spacing.sm }} />
            )}
            <Text style={styles.resultTitle}>{diagnosis.diagnosis}</Text>
            <Text style={styles.resultPlant}>
              {selectedPlant?.name}{selectedPlant?.scientific_name && ` (${selectedPlant.scientific_name})`}
            </Text>
            <View style={styles.metaContainer}>
              <View style={[styles.metaBadge, { backgroundColor: theme.surfaceContainerHigh }]}>
                <Text style={styles.metaText}>Confianca: {Math.round(diagnosis.confidence * 100)}%</Text>
              </View>
              {diagnosis.severity !== "nenhuma" && (
                <View style={[styles.metaBadge, { backgroundColor: severityColor + '20' }]}>
                  <Text style={[styles.metaText, { color: severityColor }]}>
                    {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {diagnosis.symptoms.length > 0 && (
            <Card variant="filled" style={styles.section}>
              <Text style={styles.sectionTitle}>Sintomas Identificados</Text>
              {diagnosis.symptoms.map((s, i) => <Text key={i} style={styles.listItem}>{"\u2022"} {s}</Text>)}
            </Card>
          )}

          {diagnosis.causes.length > 0 && (
            <Card variant="filled" style={styles.section}>
              <Text style={styles.sectionTitle}>Causas Provaveis</Text>
              {diagnosis.causes.map((c, i) => <Text key={i} style={styles.listItem}>{"\u2022"} {c}</Text>)}
            </Card>
          )}

          {diagnosis.treatment.immediate.length > 0 && (
            <Card style={[styles.section, { backgroundColor: theme.errorContainer }]}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="alert" size={20} color={theme.error} />
                <Text style={styles.sectionTitle}>Acoes Imediatas</Text>
              </View>
              {diagnosis.treatment.immediate.map((a, i) => <Text key={i} style={styles.listItem}>{i + 1}. {a}</Text>)}
            </Card>
          )}

          {diagnosis.treatment.ongoing.length > 0 && (
            <Card variant="filled" style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="clipboard-text" size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>Tratamento Continuo</Text>
              </View>
              {diagnosis.treatment.ongoing.map((t, i) => <Text key={i} style={styles.listItem}>{"\u2022"} {t}</Text>)}
            </Card>
          )}

          {diagnosis.treatment.prevention.length > 0 && (
            <Card variant="filled" style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="shield-check" size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>Prevencao</Text>
              </View>
              {diagnosis.treatment.prevention.map((p, i) => <Text key={i} style={styles.listItem}>{"\u2022"} {p}</Text>)}
            </Card>
          )}

          <Card variant="filled" style={styles.section}>
            <Text style={styles.sectionTitle}>Prognostico</Text>
            <Text style={styles.bodyText}>{diagnosis.prognosis}</Text>
          </Card>

          {diagnosis.additionalNotes && (
            <Card variant="filled" style={styles.section}>
              <Text style={styles.sectionTitle}>Observacoes Adicionais</Text>
              <Text style={[styles.bodyText, { fontStyle: 'italic' }]}>{diagnosis.additionalNotes}</Text>
            </Card>
          )}

          <View style={styles.actionButtons}>
            <Button title="Novo Diagnostico" onPress={resetDiagnosis} variant="primary" fullWidth />
            <Button
              title="Voltar para Planta"
              onPress={() => router.push({ pathname: "/(plants)/details", params: { plantId: selectedPlant?.id } })}
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
  container: { flex: 1, backgroundColor: theme.surface },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, backgroundColor: theme.surface },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
  loadingText: { marginTop: Spacing.sm, fontFamily: Typography.fontFamily.bodyMedium, fontSize: Typography.fontSize.base, color: theme.onSurfaceVariant },

  // Select step
  listContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  plantCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.sm, borderRadius: BorderRadius.xl },
  plantImage: { width: 56, height: 56, borderRadius: BorderRadius.lg, marginRight: Spacing.md },
  plantInfo: { flex: 1 },
  plantName: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.base, color: theme.onSurface, marginBottom: 2 },
  plantScientific: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, fontStyle: 'italic', color: theme.onSurfaceVariant },
  emptyTitle: { fontFamily: Typography.fontFamily.headlineBold, fontSize: Typography.fontSize.xl, color: theme.onSurface, textAlign: 'center' },
  emptySubtitle: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.base, color: theme.onSurfaceVariant, textAlign: 'center' },

  // Capture step
  captureContent: { padding: Spacing.lg },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
  actionIconContainer: { width: 56, height: 56, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  actionTextContainer: { flex: 1, marginRight: Spacing.sm },
  actionTitle: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.base, color: theme.onSurface, marginBottom: 2 },
  actionDescription: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant },
  tipCard: { marginTop: Spacing.lg },
  tipBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
  tipBadgeText: { fontFamily: Typography.fontFamily.bodySemiBold, fontSize: Typography.fontSize.xs },
  tipTitle: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.base, color: theme.onSurface, marginBottom: Spacing.xs },
  tipText: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant, lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed },

  // Analyzing state
  analyzingText: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.xl, color: theme.onSurface, marginBottom: Spacing.sm, textAlign: 'center' },
  analyzingSubtext: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant, marginBottom: Spacing.xl, textAlign: 'center' },
  progressBarContainer: { width: '80%', height: 8, backgroundColor: theme.surfaceContainerHigh, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md },
  progressBar: { height: '100%', borderRadius: BorderRadius.full, overflow: 'hidden' },
  analyzingNote: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.xs, color: theme.onSurfaceVariant, textAlign: 'center', fontStyle: 'italic' },

  // Result step
  resultContainer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  resultImage: { width: '100%', height: 250, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  resultHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  resultTitle: { fontFamily: Typography.fontFamily.headlineBold, fontSize: Typography.fontSize['2xl'], color: theme.onSurface, textAlign: 'center', marginBottom: Spacing.sm },
  resultPlant: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.base, fontStyle: 'italic', color: theme.onSurfaceVariant, marginBottom: Spacing.sm },
  metaContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metaBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  metaText: { fontFamily: Typography.fontFamily.bodyMedium, fontSize: Typography.fontSize.xs, color: theme.onSurfaceVariant },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.base, color: theme.onSurface, marginBottom: Spacing.sm },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  listItem: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed, marginBottom: Spacing.xs, color: theme.onSurface },
  bodyText: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed, color: theme.onSurfaceVariant },
  actionButtons: { marginTop: Spacing.lg, gap: Spacing.sm },
});
