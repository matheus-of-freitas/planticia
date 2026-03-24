import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/theme";

export default function PlantsLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const theme = Colors.light;

  useEffect(() => {
    if (!loading && !session) router.replace("/(auth)/login");
  }, [loading, session, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.surface }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.surface },
      }}
    >
      <Stack.Screen name="add" />
      <Stack.Screen name="camera" />
      <Stack.Screen name="preview" />
      <Stack.Screen name="identify" />
      <Stack.Screen name="details" />
    </Stack>
  );
}
