import { View, Text, StyleSheet, Animated } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius } from "../../constants/theme";

export default function Login() {
  const { session, signInWithGoogle } = useAuth();
  const router = useRouter();
  const theme = Colors.light;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <LinearGradient
      colors={['#F1F8E9', '#FFFFFF']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.icon}>🌱</Text>
          <View style={[styles.logoBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>AI</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.primary }]}>Plantícia</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Cuide das suas plantas com inteligência artificial
        </Text>

        <View style={styles.features}>
          <FeatureItem icon="📸" text="Identifique plantas com foto" theme={theme} />
          <FeatureItem icon="💧" text="Lembretes de rega automáticos" theme={theme} />
          <FeatureItem icon="🩺" text="Diagnóstico de doenças" theme={theme} />
          <FeatureItem icon="📚" text="Dicas personalizadas de cuidado" theme={theme} />
        </View>

        <Button
          title="Entrar com Google"
          onPress={signInWithGoogle}
          size="lg"
          fullWidth
          style={styles.button}
        />

        <Text style={[styles.footer, { color: theme.textTertiary }]}>
          Gratuito • Sem anúncios • Privado
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text, theme }: { icon: string; text: string; theme: any }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  icon: {
    fontSize: 100,
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    maxWidth: 300,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingLeft: Spacing.md,
  },
  featureIcon: {
    fontSize: Typography.fontSize.xl,
    marginRight: Spacing.md,
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  footer: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});