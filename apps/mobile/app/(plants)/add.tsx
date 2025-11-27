import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function AddPlant() {
  const router = useRouter();

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
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar uma Planta</Text>
      <Text style={styles.subtitle}>
        Tire uma foto ou escolha uma imagem da galeria para identificar sua planta
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Tirar Foto" onPress={takePhoto} />
        <Button title="Escolher da Galeria" onPress={pickPhoto} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
});
