import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Plants() {
  return (
    <View style={{ flex: 1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ marginBottom: 16 }}>Plant List (placeholder)</Text>

      <Link href="/(plants)/add">
        Add Plant
      </Link>
    </View>
  );
}