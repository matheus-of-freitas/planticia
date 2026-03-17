import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AlertProvider } from "../context/AlertContext";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import * as SplashScreenExpo from "expo-splash-screen";
import { SplashScreen } from "../components/ui/SplashScreen";
import { Colors, Typography } from "../constants/theme";

SplashScreenExpo.preventAutoHideAsync();

function HeaderRight() {
  const { signOut, session } = useAuth();
  const theme = Colors.light;

  if (!session) return null;
  return (
    <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
      <Text style={{ color: theme.primary, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.medium }}>
        Sair
      </Text>
    </TouchableOpacity>
  );
}

function RootStack() {
  const router = useRouter();
  const theme = Colors.light;
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
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: Typography.fontWeight.semibold,
        },
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
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onSplashFinish = useCallback(async () => {
    setShowSplash(false);
    await SplashScreenExpo.hideAsync();
  }, []);

  if (!appIsReady) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onFinish={onSplashFinish} />;
  }

  return (
    <AlertProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </AlertProvider>
  );
}