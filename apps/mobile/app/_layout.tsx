import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";

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
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received:", notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const plantId = response.notification.request.content.data.plantId as string;
      if (plantId) {
        console.log("Navigating to plant:", plantId);
        router.push({
          pathname: "/(plants)/details",
          params: { plantId: plantId },
        });
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

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