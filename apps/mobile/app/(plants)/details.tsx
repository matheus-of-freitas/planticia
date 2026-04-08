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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { rescheduleWateringNotification } from "../../libs/notifications";
import { deletePlant } from "../../libs/deletePlant";
import { uploadImage } from "../../libs/uploadImage";
import { SUPABASE_FUNCTIONS_URL, getAuthHeaders } from "../../libs/config";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { TopAppBar } from "../../components/ui/TopAppBar";
import { Colors, Typography, Spacing, BorderRadius, Shadows, Gradients } from "../../constants/theme";
import { useAlert } from "../../context/AlertContext";

const theme = Colors.light;

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
  const [updatingImage, setUpdatingImage] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  function isWateringNeeded() {
    if (!plant?.watering_interval_days) return false;
    if (!plant?.last_watered_at) return true; // never watered
    const lastWatered = new Date(plant.last_watered_at);
    const nextWatering = new Date(lastWatered);
    nextWatering.setDate(lastWatered.getDate() + plant.watering_interval_days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextWatering.setHours(0, 0, 0, 0);
    return today >= nextWatering; // due today OR overdue
  }

  function daysUntilNextWatering(): number {
    if (!plant?.last_watered_at || !plant?.watering_interval_days) return 0;
    const lastWatered = new Date(plant.last_watered_at);
    const nextWatering = new Date(lastWatered);
    nextWatering.setDate(lastWatered.getDate() + plant.watering_interval_days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextWatering.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((nextWatering.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
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
        await rescheduleWateringNotification(plant.id, plant.name || "", plant.watering_interval_days || 7, now, plant.watering_hour || 11);
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

  useEffect(() => {
    async function load() {
      if (!plantId) { setLoading(false); return; }
      try {
        const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/get-details?plantId=${plantId}`, { headers: await getAuthHeaders() });
        const json = await res.json();
        if (!res.ok || json.error) {
          showAlert({ type: 'error', title: 'Erro', message: 'Falha ao carregar planta.' });
        } else {
          setPlant(json.plant);
          setWateringHour(json.plant.watering_hour || 11);
        }
      } catch {
        showAlert({ type: 'error', title: 'Erro', message: 'Falha ao carregar planta.' });
      }
      setLoading(false);
    }
    load();
  }, [plantId, showAlert]);

  async function handleUpdateWateringSchedule() {
    if (!plant) return;
    const days = parseInt(editingWateringDays);
    if (isNaN(days) || days < 1) return;

    setSaving(true);
    try {
      const lastWatered = plant.last_watered_at || new Date().toISOString();
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-plant`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ plantId: plant.id, updates: { watering_interval_days: days, watering_hour: wateringHour } }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error || "Failed to update plant");

      try {
        await rescheduleWateringNotification(plant.id, plant.name || "Planta", days, lastWatered, wateringHour);
      } catch (notificationError) {
        console.error("Error rescheduling notification:", notificationError);
      }

      setPlant((prev) => prev ? { ...prev, watering_interval_days: days, watering_hour: wateringHour } : null);
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
    showAlert({
      type: 'confirm',
      title: 'Excluir Planta',
      message: `Tem certeza que deseja excluir ${plant.name}? Esta acao nao pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setDeleting(true);
        try {
          await deletePlant(plant.id);
          router.replace("/");
        } catch {
          showAlert({ type: 'error', title: 'Erro', message: 'Falha ao excluir planta.' });
          setDeleting(false);
        }
      },
    });
  }

  async function updateImageFromUri(uri: string) {
    if (!plant) return;
    setUpdatingImage(true);
    try {
      const newUrl = await uploadImage(uri);
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/update-plant`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ plantId: plant.id, updates: { image_url: newUrl } }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error || "Falha ao atualizar imagem");
      setPlant((prev) => prev ? { ...prev, image_url: newUrl } : null);
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Erro', message: err.message || 'Falha ao atualizar imagem.' });
    } finally {
      setUpdatingImage(false);
    }
  }

  function handleChangeImage() {
    showAlert({
      type: 'confirm',
      title: 'Alterar Foto',
      message: 'Como deseja escolher a nova foto?',
      confirmText: 'Tirar Foto',
      cancelText: 'Galeria',
      onConfirm: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          showAlert({ type: 'warning', title: 'Permissao Necessaria', message: 'Permissao de camera e necessaria.' });
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled) updateImageFromUri(result.assets[0].uri);
      },
      onCancel: async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
        if (!result.canceled) updateImageFromUri(result.assets[0].uri);
      },
    });
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
        <Text style={styles.errorText}>Planta nao encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero image with gradient overlay */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleChangeImage} disabled={updatingImage} style={styles.heroContainer}>
          {plant.image_url && (
            <Image source={{ uri: plant.image_url }} style={styles.heroImage} resizeMode="cover" />
          )}
          <LinearGradient colors={[...Gradients.heroOverlay]} style={styles.heroGradient} />
          <View style={styles.heroOverlayContent}>
            <TopAppBar onBack={() => router.back()} title="" transparent iconColor="#ffffff" />
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroName}>{plant.name}</Text>
              <Text style={styles.heroScientific}>{plant.scientific_name}</Text>
            </View>
          </View>
          {/* Edit badge */}
          <View style={styles.editImageBadge}>
            {updatingImage ? (
              <ActivityIndicator color="#ffffff" size={16} />
            ) : (
              <MaterialCommunityIcons name="camera-outline" size={16} color="#ffffff" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.contentPadding}>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Button
              title="Diagnosticar"
              onPress={() => router.push({ pathname: "/(diagnosis)/diagnose", params: { plantId: plant.id } })}
              variant="primary"
              size="md"
              icon={<MaterialCommunityIcons name="stethoscope" size={18} color={theme.onPrimary} />}
              style={styles.actionButton}
            />
            <Button
              title="Dicas"
              onPress={() => router.push({ pathname: "/(tips)", params: { plantId: plant.id } })}
              variant="outline"
              size="md"
              icon={<MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.primary} />}
              style={styles.actionButton}
            />
          </View>

          {/* Care info bento grid */}
          <Text style={styles.sectionTitle}>Cuidados</Text>
          <View style={styles.careGrid}>
            {/* Watering card */}
            <Card variant="filled" style={styles.careCardFull}>
              <View style={styles.careCardHeader}>
                <MaterialCommunityIcons name="water" size={22} color={theme.info} />
                <Text style={styles.careCardTitle}>Rega</Text>
              </View>
              <View style={styles.wateringRow}>
                <Text style={styles.careText}>A cada </Text>
                <TouchableOpacity onPress={openEditModal} style={[styles.pillButton, { backgroundColor: theme.primaryContainer }]}>
                  <Text style={[styles.pillButtonText, { color: theme.onPrimaryContainer }]}>
                    {plant.watering_interval_days} {plant.watering_interval_days === 1 ? 'dia' : 'dias'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.careText}> as </Text>
                <TouchableOpacity onPress={openEditHourModal} style={[styles.pillButton, { backgroundColor: theme.primaryContainer }]}>
                  <Text style={[styles.pillButtonText, { color: theme.onPrimaryContainer }]}>
                    {(plant.watering_hour || 11).toString().padStart(2, "0")}h
                  </Text>
                </TouchableOpacity>
              </View>
              {plant.last_watered_at && (
                <Text style={styles.lastWateredText}>
                  Ultima rega: {new Date(plant.last_watered_at).toLocaleDateString("pt-BR")}
                </Text>
              )}
              {isWateringNeeded() ? (
                <Button
                  title={saving ? "Salvando..." : "Reguei agora"}
                  onPress={handleMarkWateredNow}
                  disabled={saving}
                  variant="primary"
                  size="md"
                  icon={<MaterialCommunityIcons name="water" size={18} color={theme.onPrimary} />}
                  fullWidth
                  style={{ marginTop: Spacing.sm }}
                />
              ) : plant.last_watered_at && plant.watering_interval_days ? (
                <Text style={[styles.lastWateredText, { color: theme.primary, marginTop: Spacing.xs }]}>
                  Proxima rega em {daysUntilNextWatering()} {daysUntilNextWatering() === 1 ? 'dia' : 'dias'}
                </Text>
              ) : null}
            </Card>

            {/* Light card */}
            {plant.light_preference && (
              <Card variant="filled" style={styles.careCardHalf}>
                <MaterialCommunityIcons name="white-balance-sunny" size={22} color={theme.warning} />
                <Text style={styles.careCardTitle}>Luz</Text>
                <Text style={styles.careCardValue}>
                  {plant.light_preference.charAt(0).toUpperCase() + plant.light_preference.slice(1)}
                </Text>
              </Card>
            )}
          </View>

          {/* Description */}
          {plant.description && (
            <>
              <Text style={styles.sectionTitle}>Resumo da Planta</Text>
              <Card variant="filled" style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{plant.description}</Text>
              </Card>
            </>
          )}

          {/* Delete */}
          <Button
            title={deleting ? "Excluindo..." : "Excluir Planta"}
            onPress={handleDeletePlant}
            disabled={deleting}
            variant="ghost"
            fullWidth
            textStyle={{ color: theme.error }}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </ScrollView>

      {/* Edit watering days modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Cronograma de Rega</Text>
              <Text style={styles.modalSubtitle}>Defina a cada quantos dias voce quer regar esta planta</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={editingWateringDays}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, "");
                    setEditingWateringDays(num);
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  autoFocus
                  selectTextOnFocus
                />
                <Text style={styles.inputSuffix}>dias</Text>
              </View>
              <Button title={saving ? "Salvando..." : "Salvar"} onPress={handleUpdateWateringSchedule} disabled={saving} fullWidth />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit hour modal */}
      <Modal visible={editHourModalVisible} transparent animationType="fade" onRequestClose={() => setEditHourModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditHourModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Horario da Rega</Text>
              <Text style={styles.modalSubtitle}>Defina o horario do lembrete de rega (0-23h)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={editingHour}
                  onChangeText={(text) => {
                    const num = text.replace(/[^0-9]/g, "");
                    if (num.length > 0) {
                      setEditingHour(Math.max(0, Math.min(23, parseInt(num))).toString());
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
              <Button title={saving ? "Salvando..." : "Salvar"} onPress={handleUpdateHour} disabled={saving} fullWidth />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.surface },
  scrollContent: { paddingBottom: Spacing.xl },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.surface, gap: Spacing.md },
  loadingText: { fontFamily: Typography.fontFamily.bodyMedium, fontSize: Typography.fontSize.base, color: theme.onSurfaceVariant, marginTop: Spacing.sm },
  errorText: { fontFamily: Typography.fontFamily.bodyMedium, fontSize: Typography.fontSize.lg, color: theme.onSurfaceVariant, marginBottom: Spacing.md },

  // Hero
  heroContainer: { width: '100%', height: 400, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroOverlayContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
  heroTextContainer: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  heroName: { fontFamily: Typography.fontFamily.headlineBold, fontSize: Typography.fontSize['3xl'], color: '#ffffff', marginBottom: Spacing.xs },
  heroScientific: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.base, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' },
  editImageBadge: { position: 'absolute', bottom: Spacing.xl + 4, right: Spacing.lg, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: BorderRadius.full, width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  contentPadding: { padding: Spacing.lg },

  // Action row
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  actionButton: { flex: 1 },

  // Care grid
  sectionTitle: { fontFamily: Typography.fontFamily.headlineSemiBold, fontSize: Typography.fontSize.lg, color: theme.onSurface, marginBottom: Spacing.md },
  careGrid: { gap: Spacing.md, marginBottom: Spacing.xl },
  careCardFull: { width: '100%' },
  careCardHalf: { alignItems: 'flex-start', gap: Spacing.xs },
  careCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  careCardTitle: { fontFamily: Typography.fontFamily.bodySemiBold, fontSize: Typography.fontSize.sm, color: theme.onSurface },
  careCardValue: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant },
  careText: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.base, color: theme.onSurface },
  wateringRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: Spacing.sm },
  pillButton: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm + 2, borderRadius: BorderRadius.full, marginHorizontal: 2 },
  pillButtonText: { fontFamily: Typography.fontFamily.bodySemiBold, fontSize: Typography.fontSize.sm },
  lastWateredText: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant },

  // Description
  descriptionCard: { marginBottom: Spacing.md },
  descriptionText: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, lineHeight: 22, color: theme.onSurfaceVariant },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: theme.surfaceContainerLowest, borderRadius: BorderRadius['2xl'], padding: Spacing.lg, width: '100%', maxWidth: 400, ...Shadows.lg },
  modalTitle: { fontFamily: Typography.fontFamily.headlineBold, fontSize: Typography.fontSize.xl, color: theme.onSurface, marginBottom: Spacing.sm, textAlign: 'center' },
  modalSubtitle: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.sm, color: theme.onSurfaceVariant, marginBottom: Spacing.lg, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md },
  input: { flex: 1, backgroundColor: theme.surfaceContainerLow, borderRadius: BorderRadius.lg, padding: Spacing.md, fontSize: Typography.fontSize.lg, textAlign: 'center', color: theme.onSurface, fontFamily: Typography.fontFamily.bodyMedium },
  inputSuffix: { fontFamily: Typography.fontFamily.bodyRegular, fontSize: Typography.fontSize.base, color: theme.onSurfaceVariant },
});
