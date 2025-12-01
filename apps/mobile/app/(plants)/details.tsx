import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  Button,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { rescheduleWateringNotification } from "../../libs/notifications";

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

      const response = await fetch("https://ubwoxfprrhpcjboyturx.functions.supabase.co/update-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  const router = useRouter();

  useEffect(() => {
    async function load() {
      if (!plantId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`https://ubwoxfprrhpcjboyturx.functions.supabase.co/get-details?plantId=${plantId}`);
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

      const response = await fetch("https://ubwoxfprrhpcjboyturx.functions.supabase.co/update-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      const response = await fetch("https://ubwoxfprrhpcjboyturx.functions.supabase.co/update-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text>Carregando planta...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Planta não encontrada</Text>
        <Button title="Voltar" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 16, paddingBottom: 100 }}>
        {plant.image_url ? (
          <Image
            source={{ uri: plant.image_url }}
            style={{
              width: "100%",
              height: 300,
              borderRadius: 12,
              marginBottom: 24,
            }}
            resizeMode="cover"
          />
        ) : null}

        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 8,
            textAlign: "center",
          }}>
          {plant.name}
        </Text>
        <Text
          style={{
            fontStyle: "italic",
            marginBottom: 24,
            textAlign: "center",
            color: "#666",
            fontSize: 16,
          }}>
          {plant.scientific_name}
        </Text>

        <View
          style={{
            backgroundColor: "#f5f5f5",
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            width: "100%",
          }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 12,
            }}>
            Informações de Cuidado
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 16, lineHeight: 24 }}>
              <Text style={{ fontWeight: "600" }}>Rega:</Text> A cada{" "}
            </Text>
            <TouchableOpacity
              onPress={openEditModal}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: "#007AFF",
                borderRadius: 6,
                marginHorizontal: 4,
              }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", lineHeight: 24 }}>
                {plant.watering_interval_days}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, lineHeight: 24 }}>, às </Text>
            <TouchableOpacity
              onPress={openEditHourModal}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: "#007AFF",
                borderRadius: 6,
                marginHorizontal: 4,
              }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", lineHeight: 24 }}>
                {(plant.watering_hour || 11).toString().padStart(2, "0")}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 16, lineHeight: 24 }}>h</Text>
          </View>
          {/* Modal for editing hour */}
          <Modal
            visible={editHourModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setEditHourModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setEditHourModalVisible(false)}>
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
                  />
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {plant.light_preference && (
            <Text
              style={{
                marginBottom: 8,
                fontSize: 16,
                lineHeight: 24,
              }}>
              <Text style={{ fontWeight: "600" }}>Luz:</Text>{" "}
              {plant.light_preference.charAt(0).toUpperCase() + plant.light_preference.slice(1)}
            </Text>
          )}

          {plant.last_watered_at && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                justifyContent: "space-between",
              }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#888",
                  flex: 1,
                }}>
                Última rega: {new Date(plant.last_watered_at).toLocaleDateString("pt-BR")}
              </Text>
              {isTodayWateringDay() && (
                <TouchableOpacity
                  onPress={handleMarkWateredNow}
                  disabled={saving}
                  style={{
                    marginLeft: 12,
                    backgroundColor: saving ? "#007AFF" : "#007AFF",
                    borderRadius: 8,
                    padding: 8,
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: saving ? 0.7 : 1,
                  }}
                  accessibilityLabel="Reguei agora">
                  {saving ? (
                    <ActivityIndicator color="#fff" size={18} />
                  ) : (
                    <Text style={{ fontSize: 20 }}>💧</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {plant.description && (
          <View
            style={{
              backgroundColor: "#f0f9ff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 8,
              }}>
              Dicas de Cuidado
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "#333",
              }}>
              {plant.description}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 24, gap: 12, width: "100%" }}>
          <Button
            title="Diagnosticar Problemas"
            onPress={() => router.push("/(diagnosis)/diagnose")}
          />
          <Button title="Mais Dicas de Cuidado" onPress={() => router.push("/(tips)")} />
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
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
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
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
  },
  inputSuffix: {
    fontSize: 16,
    color: "#666",
  },
});
