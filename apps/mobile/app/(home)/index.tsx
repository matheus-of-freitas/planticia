import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 16 }}>Home Screen</Text>

      <Link href="/(plants)" style={{ marginBottom: 8 }}>
        My Plants
      </Link>

      <Link href="/(diagnosis)/diagnose" style={{ marginBottom: 8 }}>
        Diagnose a Plant
      </Link>

      <Link href="/(tips)" style={{ marginBottom: 8 }}>
        Tips
      </Link>
    </View>
  );
}