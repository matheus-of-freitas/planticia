import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Animated, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { uploadImage } from "../../libs/uploadImage";
import { identifyPlant } from "../../libs/identifyPlant";
import { savePlant } from "@/libs/savePlant";
import * as FileSystem from "expo-file-system/legacy";
import { compressImage } from "../../utils/compressImage";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/theme";
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
        title: 'Atenção',
        message: 'Nenhum resultado para salvar ainda.',
      });
      return;
    }

    try {
      setSaving(true);

      const publicUrl = await uploadImage(imageUri);
      const lastWateredISO = lastWateredAt ? new Date(lastWateredAt).toISOString() : new Date().toISOString();

      const plant = await savePlant({
        imageUrl: publicUrl,
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

    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={64}
          color={theme.primary}
          style={styles.loadingIcon}
        />
        <Text style={styles.loadingTitle}>Analisando sua planta...</Text>
        <Text style={styles.loadingSubtitle}>
          Usando inteligência artificial para identificar
        </Text>

        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>

        <Text style={styles.loadingHint}>
          Isso pode levar alguns segundos...
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.centeredContainerNoPadding}>
        <Text style={styles.noResultText}>Nenhum resultado encontrado</Text>
        <Button
          title="Tentar Novamente"
          onPress={() => router.back()}
          variant="primary"
        />
      </View>
    );
  }

  if (result.confidence === 0) {
    return (
      <View style={styles.centeredContainer}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={theme.warning}
          style={styles.notPlantIcon}
        />
        <Text style={styles.notPlantTitle}>
          Não é uma Planta
        </Text>
        <Text style={styles.notPlantDescription}>
          A imagem enviada não parece ser de uma planta. Por favor, tire uma
          foto de uma planta real para identificação.
        </Text>
        <Button
          title="Tentar Novamente"
          onPress={() => router.back()}
          variant="primary"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: imageUri }} style={styles.plantImage} />

        <View style={styles.nameCard}>
          <Text style={styles.commonName}>
            {result.commonName || "Nome desconhecido"}
          </Text>
          <Text style={styles.speciesName}>
            {result.species}
          </Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {(result.confidence * 100).toFixed(1)}% de confiança
            </Text>
          </View>
        </View>

        {(result.lightPreference || result.wateringIntervalDays) && (
          <View style={styles.careCard}>
            {result.lightPreference && (
              <View style={styles.careRow}>
                <MaterialCommunityIcons
                  name="white-balance-sunny"
                  size={22}
                  color={theme.warning}
                />
                <Text style={styles.careLabel}>Luz:</Text>
                <Text style={styles.careValue}>{result.lightPreference}</Text>
              </View>
            )}
            {result.wateringIntervalDays && (
              <View style={styles.careRow}>
                <MaterialCommunityIcons
                  name="water"
                  size={22}
                  color={theme.info}
                />
                <Text style={styles.careLabel}>Rega:</Text>
                <Text style={styles.careValue}>
                  A cada {result.wateringIntervalDays} dias
                </Text>
              </View>
            )}
          </View>
        )}

        {result.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Sobre</Text>
            <Text style={styles.descriptionText}>{result.description}</Text>
          </View>
        )}

        <View style={styles.dateSection}>
          <Text style={styles.dateSectionTitle}>Data da última rega:</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.datePickerButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={20}
              color={theme.primary}
            />
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
                  const selected = new Date(selectedDate);
                  setLastWateredAt(selected.toISOString().slice(0, 10));
                }
              }}
            />
          )}
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Salvar na Minha Coleção"
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
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: theme.background,
  },
  centeredContainerNoPadding: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    alignItems: "center",
    padding: Spacing.md,
    paddingBottom: 100,
  },

  // Loading state
  loadingIcon: {
    marginBottom: Spacing.xl,
  },
  loadingTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: theme.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  progressBarTrack: {
    width: "80%",
    height: 6,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.primaryLight,
    borderRadius: BorderRadius.full,
  },
  loadingHint: {
    fontSize: Typography.fontSize.xs,
    color: theme.textTertiary,
    textAlign: "center",
    fontStyle: "italic",
  },

  // No result state
  noResultText: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    marginBottom: Spacing.md,
  },

  // Not a plant state
  notPlantIcon: {
    marginBottom: Spacing.lg,
  },
  notPlantTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  notPlantDescription: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: "center",
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },

  // Results - image
  plantImage: {
    width: 250,
    height: 250,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },

  // Results - name card
  nameCard: {
    width: "100%",
    backgroundColor: theme.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  commonName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.xs,
  },
  speciesName: {
    fontSize: Typography.fontSize.sm,
    color: theme.textSecondary,
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  confidenceBadge: {
    backgroundColor: theme.primaryLight + "1A",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  confidenceText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: theme.primary,
  },

  // Results - care card
  careCard: {
    width: "100%",
    backgroundColor: theme.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  careRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  careLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
  },
  careValue: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    flex: 1,
  },

  // Results - description card
  descriptionCard: {
    width: "100%",
    backgroundColor: theme.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  descriptionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm,
    color: theme.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },

  // Date picker section
  dateSection: {
    marginBottom: Spacing.lg,
    width: "100%",
    alignItems: "center",
  },
  dateSectionTitle: {
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: theme.text,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: theme.border,
    ...Shadows.sm,
  },
  datePickerText: {
    fontSize: Typography.fontSize.base,
    color: theme.text,
    fontWeight: Typography.fontWeight.medium,
  },

  // Actions
  actionsContainer: {
    gap: Spacing.sm,
    width: "100%",
    paddingHorizontal: Spacing.md,
  },
});
