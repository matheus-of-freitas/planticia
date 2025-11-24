import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Login() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 16 }}>Login Screen</Text>

      {/* TEMPORARY navigation until auth is implemented */}
      <Link href="/(home)">
        Continue (temp)
      </Link>
    </View>
  );
}