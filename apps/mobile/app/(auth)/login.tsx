import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Login() {
  const { session, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/(home)");
    }
  }, [session, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 24 }}>Login with Google</Text>
      <Button title="Sign in with Google" onPress={signInWithGoogle} />
    </View>
  );
}