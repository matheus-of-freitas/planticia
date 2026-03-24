import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [fadeAnim, scaleAnim, logoRotateAnim, onFinish]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: logoRotate },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons name="sprout" size={120} color={theme.primary} />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Planticia</Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>
          Cuide das suas plantas
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize['4xl'],
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
  },
});
