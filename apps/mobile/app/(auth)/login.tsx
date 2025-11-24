import { Text, View, Button } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { signInWithGoogle, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/(home)");
    }
  }, [session, router]);

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ marginBottom: 24 }}>Login with Google</Text>

      <Button title="Sign in with Google" onPress={signInWithGoogle} />
    </View>
  );
}