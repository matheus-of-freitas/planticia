import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Tips() {
  return (
    <View style={{ flex: 1, justifyContent:"center", alignItems:"center" }}>
      <Text style={{ marginBottom: 16 }}>Tips Area</Text>

      <Link href="/(tips)/123">
        Open Example Article
      </Link>
    </View>
  );
}