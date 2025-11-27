import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Login() {
  const { session, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌱</Text>
      <Text style={styles.title}>Plantícia</Text>
      <Text style={styles.subtitle}>Cuide das suas plantas com inteligência</Text>
      <View style={{ marginTop: 40 }}>
        <Button title="Entrar com Google" onPress={signInWithGoogle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#2E7D32",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});