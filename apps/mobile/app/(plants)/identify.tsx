import { useEffect, useState, useRef } from "react";
import { View, Text, Image, ScrollView, Animated, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { uploadImage } from "../../libs/uploadImage";
import { identifyPlant } from "../../libs/identifyPlant";
import { savePlant } from "@/libs/savePlant";
import * as FileSystem from "expo-file-system/legacy";
import { compressImage } from "../../utils/compressImage";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TopAppBar } from "../../components/ui/TopAppBar";
import { Colors, Typography, Spacing, BorderRadius, Gradients } from "../../constants/theme";
import { useAlert } from "../../context/AlertContext";

const theme = Colors.light;

export default function Identify() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const todayDateString = new Date().toISOString().slice(0, 10);
  const [lastWateredAt, setLastWateredAt] = useState<string>(todayDateString);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  // Scan line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Scan line loop
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse overlay loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [scanLineAnim, pulseAnim]);

  useEffect(() => {
    async function process() {
      if (!imageUri) return;

      Animated.timing(progress, {
        toValue: 100,
        duration: 6500,
        useNativeDriver: false,
        easing: (t) => t * t,
      }).start();

      try {
        const compressedUri = await compressImage(imageUri);
        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: "base64",
        });

        const data = await identifyPlant(base64, "image/jpeg");
        setResult(data);
      } catch (err: any) {
        console.error("Identify error:", err);
        showAlert({
          type: 'error',
          title: 'Erro',
          message: `Erro ao identificar planta: ${err.message || err}`,
        });
      } finally {
        setLoading(false);
      }
    }

    process();
  }, [imageUri, showAlert, progress]);

  async function handleSave() {
    if (!result || !imageUri) {
      showAlert({
        type: 'warning',
        title: 'Atencao',
        message: 'Nenhum resultado para salvar ainda.',
      });
      return;
    }

    try {
      setSaving(true);

      const userPublicUrl = await uploadImage(imageUri);
      const lastWateredISO = lastWateredAt ? new Date(lastWateredAt).toISOString() : new Date().toISOString();

      const plant = await savePlant({
        imageUrl: userPublicUrl,
        species: result.species,
        commonName: result.commonName,
        wateringIntervalDays: result.wateringIntervalDays,
        lightPreference: result.lightPreference,
        description: result.description,
        lastWateredAt: lastWateredISO,
      });

      router.replace({
        pathname: "/(plants)/details",
        params: { plantId: plant.id },
      });
    } catch (err: any) {
      console.error(err);
      showAlert({
        type: 'error',
        title: 'Erro',
        message: 'Erro ao salvar planta. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    const progressWidth = progress.interpolate({
      inputRange: [0, 100],
      outputRange: ["0%", "100%"],
    });

    const scanTranslate = scanLineAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 280],
    });

    return (
      <View style={styles.loadingContainer}>
        <TopAppBar
          showBack={true}
          onBack={() => router.back()}
          title="Planticia"
        />

        <View style={styles.loadingContent}>
          {/* Scan area with image */}
          <View style={styles.scanArea}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.scanImage} />
            )}
            {/* Pulse overlay */}
            <Animated.View style={[styles.scanOverlay, { opacity: pulseAnim }]} />
            {/* Scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanTranslate }] },
              ]}
            />
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Badge */}
            <View style={[styles.scanBadge, { backgroundColor: theme.secondaryContainer }]}>
              <Text style={[styles.scanBadgeText, { color: theme.onSecondaryContainer }]}>
                IDENTIFICANDO...
              </Text>
            </View>
          </View>

          <Text style={styles.loadingTitle}>A Planticia esta consultando sua base de dados...</Text>
          <Text style={styles.loadingSubtitle}>Comparando padroes de folhas e estruturas</Text>

          {/* Progress bar */}
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[...Gradients.biophilic]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

        </View>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noResultText}>Nenhum resultado encontrado</Text>
        <Button title="Tentar Novamente" onPress={() => router.back()} variant="primary" />
      </View>
    );
  }

  if (result.confidence === 0) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={theme.warning} style={{ marginBottom: Spacing.lg }} />
        <Text style={styles.notPlantTitle}>Nao e uma Planta</Text>
        <Text style={styles.notPlantDescription}>
          A imagem enviada nao parece ser de uma planta. Por favor, tire uma foto de uma planta real para identificação.
        </Text>
        <Button title="Tentar Novamente" onPress={() => router.back()} variant="primary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopAppBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: imageUri }} style={styles.plantImage} />

        {/* Name card */}
        <Card style={styles.nameCard}>
          <Text style={styles.commonName}>{result.commonName || "Nome desconhecido"}</Text>
          <Text style={styles.speciesName}>{result.species}</Text>
          <View style={[styles.confidenceBadge, { backgroundColor: theme.secondaryContainer }]}>
            <Text style={[styles.confidenceText, { color: theme.onSecondaryContainer }]}>
              {(result.confidence * 100).toFixed(1)}% de confianca
            </Text>
          </View>
        </Card>

        {/* Care info cards */}
        {(result.lightPreference || result.wateringIntervalDays) && (
          <View style={styles.careGrid}>
            {result.wateringIntervalDays && (
              <Card variant="filled" style={styles.careGridItem}>
                <MaterialCommunityIcons name="water" size={24} color={theme.info} />
                <Text style={styles.careLabel}>Rega</Text>
                <Text style={styles.careValue}>A cada {result.wateringIntervalDays} {result.wateringIntervalDays === 1 ? 'dia' : 'dias'}</Text>
              </Card>
            )}
            {result.lightPreference && (
              <Card variant="filled" style={styles.careGridItem}>
                <MaterialCommunityIcons name="white-balance-sunny" size={24} color={theme.warning} />
                <Text style={styles.careLabel}>Luz</Text>
                <Text style={styles.careValue}>{result.lightPreference}</Text>
              </Card>
            )}
          </View>
        )}

        {result.description && (
          <Card variant="filled" style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Sobre</Text>
            <Text style={styles.descriptionText}>{result.description}</Text>
          </Card>
        )}

        {/* Date picker */}
        <View style={styles.dateSection}>
          <Text style={styles.dateSectionTitle}>Data da ultima rega:</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.datePickerButton, { backgroundColor: theme.surfaceContainerLow }]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="calendar" size={20} color={theme.primary} />
            <Text style={styles.datePickerText}>
              {new Date(lastWateredAt).toLocaleDateString("pt-BR")}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(lastWateredAt)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setLastWateredAt(selectedDate.toISOString().slice(0, 10));
                }
              }}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            title="Salvar na Minha Colecao"
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            title="Cancelar"
            onPress={() => router.push("/")}
            disabled={saving}
            variant="ghost"
            size="md"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Loading state
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  scanArea: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    backgroundColor: theme.surfaceContainerLow,
  },
  scanImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.primaryContainer,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.primaryFixedDim,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.primaryFixedDim,
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  scanBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  scanBadgeText: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 0.8,
  },
  loadingTitle: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.lg,
    color: theme.onSurface,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  loadingSubtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  progressBarTrack: {
    width: '80%',
    height: 8,
    backgroundColor: theme.surfaceContainerHigh,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },

  // Centered states
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: theme.surface,
  },
  noResultText: {
    fontFamily: Typography.fontFamily.bodyMedium,
    fontSize: Typography.fontSize.base,
    color: theme.onSurfaceVariant,
    marginBottom: Spacing.md,
  },
  notPlantTitle: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize['2xl'],
    color: theme.onSurface,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  notPlantDescription: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    color: theme.onSurfaceVariant,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },

  // Result state
  container: {
    flex: 1,
    backgroundColor: theme.surface,
  },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  plantImage: {
    width: 250,
    height: 250,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xs,
  },
  attributionText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.xs - 1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  nameCard: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  commonName: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize.xl,
    color: theme.onSurface,
    marginBottom: Spacing.xs,
  },
  speciesName: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    color: theme.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  confidenceText: {
    fontFamily: Typography.fontFamily.bodyMedium,
    fontSize: Typography.fontSize.xs,
  },
  careGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
  },
  careGridItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  careLabel: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.sm,
    color: theme.onSurface,
  },
  careValue: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
  },
  descriptionCard: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  descriptionTitle: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.base,
    color: theme.onSurface,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    color: theme.onSurfaceVariant,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  dateSection: {
    marginBottom: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  dateSectionTitle: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.base,
    color: theme.onSurface,
    marginBottom: Spacing.sm,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  datePickerText: {
    fontFamily: Typography.fontFamily.bodyMedium,
    fontSize: Typography.fontSize.base,
    color: theme.onSurface,
  },
  actionsContainer: {
    gap: Spacing.sm,
    width: '100%',
  },
});
