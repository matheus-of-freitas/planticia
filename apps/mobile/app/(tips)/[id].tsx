import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function Article() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent:"center", alignItems:"center" }}>
      <Text>Article ID: {id}</Text>
    </View>
  );
}