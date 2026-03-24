import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../constants/theme";
import { TopAppBar } from "../../components/ui/TopAppBar";
import { EditorialHeader } from "../../components/ui/EditorialHeader";
import { useAlert } from "../../context/AlertContext";

export default function AddPlant() {
  const router = useRouter();
  const theme = Colors.light;
  const { showAlert } = useAlert();

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        type: 'warning',
        title: 'Permissao Necessaria',
        message: 'Permissao de camera e necessaria para tirar fotos.',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      router.push({
        pathname: "/(plants)/identify" as any,
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      router.push({
        pathname: "/(plants)/identify" as any,
        params: { imageUri: result.assets[0].uri },
      });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <TopAppBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <EditorialHeader
          label="NOVA PLANTA"
          title="Inicie a jornada da sua planta"
          subtitle="Nossa IA vai identificar a especie e criar um guia de cuidados personalizado"
        />

        {/* Take Photo Card */}
        <TouchableOpacity
          onPress={takePhoto}
          activeOpacity={0.7}
          style={[styles.actionCard, { backgroundColor: theme.surfaceContainerLow }]}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="camera" size={28} color={theme.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.onSurface }]}>Tirar uma Foto</Text>
            <Text style={[styles.actionDescription, { color: theme.onSurfaceVariant }]}>
              Aponte sua camera para as folhas para identificação instantanea
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
        </TouchableOpacity>

        {/* Pick from Gallery Card */}
        <TouchableOpacity
          onPress={pickPhoto}
          activeOpacity={0.7}
          style={[styles.actionCard, { backgroundColor: theme.surfaceContainerLow }]}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: theme.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="image-multiple" size={28} color={theme.secondary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: theme.onSurface }]}>Carregar da Galeria</Text>
            <Text style={[styles.actionDescription, { color: theme.onSurfaceVariant }]}>
              Selecione uma foto existente da sua galeria
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.outlineVariant} />
        </TouchableOpacity>

        {/* Tip pill */}
        <View style={[styles.tipPill, { backgroundColor: theme.surfaceContainer }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.secondary} />
          <Text style={[styles.tipText, { color: theme.onSurfaceVariant }]}>
            Dica: Certifique-se de que a iluminacao seja natural para melhores resultados
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  actionTitle: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.base,
    marginBottom: 2,
  },
  actionDescription: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  tipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
