import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function AddPlant() {
  const router = useRouter();

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission is required");
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
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ marginBottom: 20 }}>Add a plant</Text>

      <Button title="Take a Photo" onPress={takePhoto} />
      <View style={{ height: 16 }} />
      <Button title="Choose from Gallery" onPress={pickPhoto} />
    </View>
  );
}
