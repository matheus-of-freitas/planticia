import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator, TouchableOpacity, Text } from "react-native";

function HeaderRight() {
  const { signOut } = useAuth();
  return (
    <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
      <Text style={{ color: "#007AFF", fontSize: 16 }}>Sair</Text>
    </TouchableOpacity>
  );
}

export default function PlantsLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace("/(auth)/login");
  }, [loading, session, router]);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen name="add" options={{ title: "Adicionar Planta" }} />
      <Stack.Screen name="camera" options={{ title: "Tirar Foto" }} />
      <Stack.Screen name="preview" options={{ title: "Visualizar" }} />
      <Stack.Screen name="identify" options={{ title: "Identificação" }} />
      <Stack.Screen name="details" options={{ title: "Detalhes" }} />
    </Stack>
  );
}