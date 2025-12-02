import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "../../constants/theme";

export default function AddPlant() {
  const router = useRouter();
  const theme = Colors.light;

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Permissão de câmera é necessária");
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={styles.iconLarge}>🌱</Text>
        <Text style={[styles.title, { color: theme.text }]}>Adicionar Planta</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Use sua câmera ou escolha uma foto para identificar automaticamente sua planta
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            onPress={takePhoto}
            activeOpacity={0.7}
            style={[styles.optionCard, { backgroundColor: theme.card, ...Shadows.md }]}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryLight]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.optionIcon}>📸</Text>
            </LinearGradient>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Tirar Foto</Text>
            <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
              Use a câmera para capturar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickPhoto}
            activeOpacity={0.7}
            style={[styles.optionCard, { backgroundColor: theme.card, ...Shadows.md }]}
          >
            <LinearGradient
              colors={[theme.secondary, theme.accent]}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.optionIcon}>🖼️</Text>
            </LinearGradient>
            <Text style={[styles.optionTitle, { color: theme.text }]}>Escolher Foto</Text>
            <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
              Selecione da galeria
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Para melhores resultados, tire fotos com boa iluminação e foque nas folhas
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: "center",
  },
  iconLarge: {
    fontSize: 80,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing.md,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  optionIcon: {
    fontSize: 40,
  },
  optionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
  infoBox: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  infoIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
