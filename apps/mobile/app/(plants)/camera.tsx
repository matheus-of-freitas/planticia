import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "../../constants/theme";

const theme = Colors.light;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.loadingText, { color: theme.onSurfaceVariant }]}>
          Carregando câmera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.secondaryContainer }]}>
          <MaterialCommunityIcons name="camera-off" size={40} color={theme.secondary} />
        </View>
        <Text style={[styles.title, { color: theme.onSurface }]}>
          Permissão de Câmera Necessária
        </Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
          Precisamos de acesso à câmera para tirar fotos das suas plantas
        </Text>
        <View style={styles.buttonWrapper}>
          <Button title="Conceder Permissão" onPress={requestPermission} variant="primary" />
        </View>
      </View>
    );
  }

  async function takePhoto() {
    const photo = await cameraRef.current?.takePictureAsync();
    if (!photo) return;

    router.push({
      pathname: "/(plants)/preview",
      params: { uri: photo.uri },
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto} activeOpacity={0.7}>
          <View style={[styles.captureButtonInner, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize.xl,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
  },
  buttonWrapper: {
    marginTop: Spacing.xl,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.surfaceContainerLowest,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#181c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
});
