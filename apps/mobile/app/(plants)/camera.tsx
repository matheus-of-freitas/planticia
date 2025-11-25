import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { View, Button, Text } from "react-native";
import { useRouter } from "expo-router";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View>
        <Text>No camera permission</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
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
    <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          marginBottom: 50,
          alignItems: "center",
        }}
      >
        <Button title="Take Photo" onPress={takePhoto} />
      </View>
    </CameraView>
  );
}