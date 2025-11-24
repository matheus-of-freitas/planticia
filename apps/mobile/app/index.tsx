import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 12 }}>Welcome to Plantícia 🌱</Text>

      <Link href="/(auth)/login">
        Go to Login
      </Link>
    </View>
  );
}