import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { rescheduleWateringNotification } from "../../libs/notifications";
import { deletePlant } from "../../libs/deletePlant";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/theme";

interface Plant {
  id: string;
  name: string | null;
  scientific_name: string | null;
  image_url: string | null;
  watering_interval_days: number | null;
  watering_hour?: number | null;
  last_watered_at: string | null;
  light_preference: string | null;
  description: string | null;
}

export default function PlantDetails() {
  function isTodayWateringDay() {
    if (!plant?.last_watered_at || !plant?.watering_interval_days) return false;
    const lastWatered = new Date(plant.last_watered_at);
    const nextWatering = new Date(lastWatered);
    nextWatering.setDate(lastWatered.getDate() + plant.watering_interval_days);
    const today = new Date();
    return (
      nextWatering.getFullYear() === today.getFullYear() &&
      nextWatering.getMonth() === today.getMonth() &&
      nextWatering.getDate() === today.getDate()
    );
  }
  async function handleMarkWateredNow() {
    if (!plant) return;
    const now = new Date().toISOString();
    setSaving(true);
    try {
      const nextTrigger = new Date(now);
      nextTrigger.setDate(nextTrigger.getDate() + (plant.watering_interval_days || 7));
      nextTrigger.setHours(plant.watering_hour || 11, 0, 0, 0);

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-plant`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ plantId: plant.id, updates: { last_watered_at: now } }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error || "Failed to update plant");

      try {
        await rescheduleWateringNotification(
          plant.id,
          plant.name || "",
          plant.watering_interval_days || 7,
          now,
          plant.watering_hour || 11
        );
      } catch (notificationError) {
        console.error("Error rescheduling notification after watering:", notificationError);
      }

      setPlant((prev) => (prev ? { ...prev, last_watered_at: now } : null));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }
  const { plantId } = useLocalSearchParams<{ plantId: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWateringDays, setEditingWateringDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [wateringHour, setWateringHour] = useState<number>(11);
  const [editHourModalVisible, setEditHourModalVisible] = useState(false);
  const [editingHour, setEditingHour] = useState("11");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (!plantId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-details?plantId=${plantId}`, {
          headers: await getAuthHeaders(),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          console.error("Error loading plant:", json.error);
          alert("Error loading plant");
        } else {
          setPlant(json.plant);
          setWateringHour(json.plant.watering_hour || 11);
        }
      } catch (err) {
        console.error("Error loading plant:", err);
        alert("Error loading plant");
      }
      setLoading(false);
    }
    load();
  }, [plantId]);

  async function handleUpdateWateringSchedule() {
    if (!plant) return;
    const days = parseInt(editingWateringDays);
    if (isNaN(days) || days < 1) {
      return;
    }

    setSaving(true);
    try {
      const lastWatered = plant.last_watered_at || new Date().toISOString();
      const nextTrigger = new Date(lastWatered);
      nextTrigger.setDate(nextTrigger.getDate() + days);
      nextTrigger.setHours(wateringHour, 0, 0, 0);

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-plant`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          plantId: plant.id,
          updates: {
            watering_interval_days: days,
            watering_hour: wateringHour,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error || "Failed to update plant");

      try {
        await rescheduleWateringNotification(
          plant.id,
          plant.name || "Planta",
          days,
          lastWatered,
          wateringHour
        );
      } catch (notificationError) {
        console.error("Error rescheduling notification:", notificationError);
      }

      setPlant((prev) =>
        prev
          ? {
              ...prev,
              watering_interval_days: days,
              watering_hour: wateringHour,
            }
          : null
      );
      setEditModalVisible(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function openEditModal() {
    setEditingWateringDays(plant?.watering_interval_days?.toString() || "7");
    setEditModalVisible(true);
  }

  function openEditHourModal() {
    setEditingHour(wateringHour.toString());
    setEditHourModalVisible(true);
  }

  async function handleUpdateHour() {
    const parsed = parseInt(editingHour);
    if (isNaN(parsed)) return;
    const hour = Math.max(0, Math.min(23, parsed));
    setSaving(true);

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-plant`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ plantId: plant?.id, updates: { watering_hour: hour } }),
      });
      const json = await response.json();

      if (response.ok && !json.error) {
        setWateringHour(hour);
        setPlant((prev) => (prev ? { ...prev, watering_hour: hour } : null));
      }
      setEditingHour(hour.toString());
      setEditHourModalVisible(false);
    } catch (error) {
      console.error("Error updating hour:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePlant() {
    if (!plant) return;

    Alert.alert(
      "Excluir Planta",
      `Tem certeza que deseja excluir ${plant.name}? Esta ação não pode ser desfeita.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deletePlant(plant.id);
              router.replace("/");
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Falha ao excluir planta");
              setDeleting(false);
            }
          },
        },
      ]
    );
  }


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={theme.primary} size="large" />
        <Text style={styles.loadingText}>Carregando planta...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Planta não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {plant.image_url ? (
          <Image
            source={{ uri: plant.image_url }}
            style={styles.plantImage}
            resizeMode="cover"
          />
        ) : null}

        <Text style={styles.plantName}>{plant.name}</Text>
        <Text style={styles.scientificName}>{plant.scientific_name}</Text>

        <Card style={styles.careCard}>
          <Text style={styles.sectionTitle}>Informações de Cuidado</Text>

          <View style={styles.wateringRow}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Rega:</Text> A cada{" "}
            </Text>
            <TouchableOpacity onPress={openEditModal} style={styles.pillButton}>
              <Text style={styles.pillButtonText}>
                {plant.watering_interval_days}
              </Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>, às </Text>
            <TouchableOpacity onPress={openEditHourModal} style={styles.pillButton}>
              <Text style={styles.pillButtonText}>
                {(plant.watering_hour || 11).toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
            <Text style={styles.infoText}>h</Text>
          </View>

          <Modal
            visible={editHourModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setEditHourModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setEditHourModalVisible(false)}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Editar Horário da Rega</Text>
                  <Text style={styles.modalSubtitle}>
                    Defina o horário do lembrete de rega (0-23h)
                  </Text>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={editingHour}
                      onChangeText={(text) => {
                        const num = text.replace(/[^0-9]/g, "");
                        if (num.length > 0) {
                          const val = Math.max(0, Math.min(23, parseInt(num)));
                          setEditingHour(val.toString());
                        } else {
                          setEditingHour("");
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="11"
                      autoFocus
                      selectTextOnFocus
                      maxLength={2}
                    />
                    <Text style={styles.inputSuffix}>h</Text>
                  </View>

                  <Button
                    title={saving ? "Salvando..." : "Salvar"}
                    onPress={handleUpdateHour}
                    disabled={saving}
                    fullWidth
                  />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {plant.light_preference && (
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Luz:</Text>{" "}
              {plant.light_preference.charAt(0).toUpperCase() + plant.light_preference.slice(1)}
            </Text>
          )}

          {plant.last_watered_at && (
            <View style={styles.lastWateredRow}>
              <Text style={styles.lastWateredText}>
                Última rega: {new Date(plant.last_watered_at).toLocaleDateString("pt-BR")}
              </Text>
              {isTodayWateringDay() && (
                <TouchableOpacity
                  onPress={handleMarkWateredNow}
                  disabled={saving}
                  style={[styles.waterButton, saving && styles.waterButtonDisabled]}
                  accessibilityLabel="Reguei agora">
                  {saving ? (
                    <ActivityIndicator color="#fff" size={18} />
                  ) : (
                    <MaterialCommunityIcons name="water" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {plant.description && (
          <Card style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Dicas de Cuidado</Text>
            <Text style={styles.descriptionText}>{plant.description}</Text>
          </Card>
        )}

        <View style={styles.actionsContainer}>
          <Button
            title="Diagnosticar Problemas"
            onPress={() =>
              router.push({
                pathname: "/(diagnosis)/diagnose",
                params: { plantId: plant.id },
              })
            }
            variant="primary"
            fullWidth
          />
          <Button
            title="Mais Dicas de Cuidado"
            onPress={() =>
              router.push({
                pathname: "/(tips)",
                params: { plantId: plant.id },
              })
            }
            variant="outline"
            fullWidth
          />
          <Button
            title={deleting ? "Excluindo..." : "Excluir Planta"}
            onPress={handleDeletePlant}
            disabled={deleting}
            variant="ghost"
            fullWidth
            textStyle={styles.deleteButtonText}
          />
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Cronograma de Rega</Text>
              <Text style={styles.modalSubtitle}>
                Defina a cada quantos dias você quer regar esta planta
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={editingWateringDays}
                  onChangeText={(text) => {
                    setEditingWateringDays(text);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.inputSuffix}>dias</Text>
              </View>

              <Button
                title={saving ? "Salvando..." : "Salvar"}
                onPress={handleUpdateWateringSchedule}
                disabled={saving}
                fullWidth
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const theme = Colors.light;

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: Spacing.md,
  },
  scrollContent: {
    alignItems: "center",
    padding: Spacing.md,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
    gap: Spacing.md,
  },

  // Loading & Error
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: theme.textSecondary,
    marginBottom: Spacing.md,
  },

  // Plant header
  plantImage: {
    width: "100%",
    height: 300,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  plantName: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  scientificName: {
    fontStyle: "italic",
    marginBottom: Spacing.lg,
    textAlign: "center",
    color: theme.textSecondary,
    fontSize: Typography.fontSize.base,
  },

  // Care info card
  careCard: {
    marginBottom: Spacing.md,
    width: "100%",
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: Spacing.md,
  },
  wateringRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    color: theme.text,
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontWeight: Typography.fontWeight.semibold,
  },
  pillButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: theme.primary,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
  },
  pillButtonText: {
    color: "#fff",
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },

  // Last watered row
  lastWateredRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    justifyContent: "space-between",
  },
  lastWateredText: {
    fontSize: Typography.fontSize.sm,
    color: theme.textTertiary,
    flex: 1,
  },
  waterButton: {
    marginLeft: Spacing.md,
    backgroundColor: theme.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  waterButtonDisabled: {
    opacity: 0.7,
  },

  // Description card
  descriptionCard: {
    marginBottom: Spacing.md,
    width: "100%",
  },
  descriptionText: {
    fontSize: Typography.fontSize.sm + 1,
    lineHeight: 22,
    color: theme.textSecondary,
  },

  // Actions
  actionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    width: "100%",
  },
  deleteButtonText: {
    color: theme.error,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: theme.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: theme.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.lg,
    textAlign: "center",
    color: theme.text,
  },
  inputSuffix: {
    fontSize: Typography.fontSize.base,
    color: theme.textSecondary,
  },
});
