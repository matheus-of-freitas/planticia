import { Stack } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function HeaderRight() {
  const { signOut, session } = useAuth();
  if (!session) return null;
  return (
    <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
      <Text style={{ color: "#007AFF", fontSize: 16 }}>Sair</Text>
    </TouchableOpacity>
  );
}

function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: "Minhas Plantas",
          headerRight: () => <HeaderRight />
        }}
      />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(plants)" options={{ headerShown: false }} />
      <Stack.Screen name="(diagnosis)" options={{ headerShown: false }} />
      <Stack.Screen name="(tips)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  );
}