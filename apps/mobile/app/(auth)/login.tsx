import { View, Text, StyleSheet, Animated } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../../components/ui/Button";
import { Colors, Typography, Spacing, BorderRadius, Gradients, GlassEffect } from "../../constants/theme";

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
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* Organic gradient blobs */}
      <View style={styles.blobContainer}>
        <LinearGradient
          colors={[...Gradients.biophilic]}
          style={[styles.blob, styles.blobTop]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={[...Gradients.biophilicLight]}
          style={[styles.blob, styles.blobBottom]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Glass card */}
        <View style={styles.glassCard}>
          {/* Brand icon */}
          <LinearGradient
            colors={[...Gradients.biophilic]}
            style={styles.iconCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialCommunityIcons name="sprout" size={48} color={theme.onPrimary} />
          </LinearGradient>

          <Text style={[styles.title, { color: theme.primary }]}>Planticia</Text>
          <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
            Bem-vindo de volta ao seu jardim!
          </Text>

          <Button
            title="Entrar com Google"
            onPress={signInWithGoogle}
            size="lg"
            fullWidth
            icon={<MaterialCommunityIcons name="google" size={20} color={theme.onPrimary} />}
            style={styles.googleButton}
          />

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: theme.outlineVariant }]} />
            <Text style={[styles.dividerText, { color: theme.onSurfaceVariant }]}>
              A NATUREZA ESTA A ESPERA
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.outlineVariant }]} />
          </View>

          <Text style={[styles.footer, { color: theme.onSurfaceVariant }]}>
            Gratuito · Sem anuncios · Privado
          </Text>
        </View>

        {/* Floating quote */}
        <Text style={[styles.quote, { color: theme.onSurfaceVariant }]}>
          {'"Nas profundezas de suas raizes, todas as flores guardam a luz."'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  blobTop: {
    top: -80,
    right: -60,
  },
  blobBottom: {
    bottom: -40,
    left: -80,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  glassCard: {
    width: '100%',
    backgroundColor: GlassEffect.background,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize['4xl'],
    marginBottom: Spacing.sm,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
  googleButton: {
    marginBottom: Spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.xs,
    letterSpacing: 0.8,
    marginHorizontal: Spacing.md,
  },
  footer: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  quote: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
});
