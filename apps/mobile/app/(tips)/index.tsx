import { Text, View, StyleSheet } from "react-native";

export default function Tips() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.title}>Dicas de Cuidado</Text>
      <Text style={styles.subtitle}>Funcionalidade em desenvolvimento</Text>
      <Text style={styles.description}>
        Em breve você terá acesso a dicas personalizadas de cuidado para suas plantas, artigos sobre jardinagem e muito mais.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});