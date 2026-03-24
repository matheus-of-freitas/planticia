import { Image, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { compressImage } from "../../utils/compressImage";
import { supabase } from "../../libs/supabaseClient";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { useAlert } from "../../context/AlertContext";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "../../constants/theme";

const theme = Colors.light;

export default function Preview() {
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const { showAlert } = useAlert();

  if (!uri) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.emptyText, { color: theme.onSurfaceVariant }]}>
          Nenhuma imagem encontrada.
        </Text>
      </View>
    );
  }

  async function uploadImage() {
    setUploading(true);
    try {
      const compressed = await compressImage(uri);

      const base64 = await FileSystem.readAsStringAsync(compressed, {
        encoding: "base64",
      });

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const fileName = `plants/${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from("plant-images")
        .upload(fileName, byteArray, {
          contentType: "image/jpeg",
        });

      if (error) {
        console.error("Upload error:", error);
        showAlert({ type: 'error', title: 'Erro', message: 'Erro ao fazer upload da imagem.' });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("plant-images")
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;

      router.push({
        pathname: "/(plants)/add",
        params: { imageUrl },
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.inverseSurface }]}>
      <Image
        source={{ uri }}
        style={styles.image}
      />
      <View style={[styles.bottomBar, { backgroundColor: theme.surfaceContainerLow }]}>
        {uploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.onSurfaceVariant }]}>
              Processando imagem...
            </Text>
          </View>
        ) : (
          <Button title="Usar esta Foto" onPress={uploadImage} variant="primary" fullWidth />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
  },
  image: {
    flex: 1,
    width: "100%",
    resizeMode: "contain",
  },
  bottomBar: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  loadingContainer: {
    alignItems: "center",
    padding: Spacing.md,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
  },
});
