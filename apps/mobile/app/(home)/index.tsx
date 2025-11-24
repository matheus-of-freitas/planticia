import { Text, View, Button } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { signOut } = useAuth();

  return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
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

      <Button title="Logout" onPress={signOut} />
    </View>
  );
}