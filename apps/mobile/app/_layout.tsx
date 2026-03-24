import { Stack, useRouter } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { AlertProvider } from "../context/AlertContext";
import { useEffect, useRef, useState, useCallback } from "react";
import * as Notifications from "expo-notifications";
import * as SplashScreenExpo from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
} from "@expo-google-fonts/be-vietnam-pro";
import { SplashScreen } from "../components/ui/SplashScreen";
import { Colors } from "../constants/theme";

SplashScreenExpo.preventAutoHideAsync();

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
        contentStyle: { backgroundColor: theme.surface },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(plants)" />
      <Stack.Screen name="(diagnosis)" />
      <Stack.Screen name="(tips)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
  });

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

  if (!appIsReady || !fontsLoaded) {
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