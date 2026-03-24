import React, { ReactNode } from 'react';
import { View, ViewStyle, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassEffect, BorderRadius } from '../../constants/theme';

interface GlassViewProps {
  children: ReactNode;
  intensity?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function GlassView({
  children,
  intensity = GlassEffect.blurIntensity,
  style,
  borderRadius = BorderRadius.lg,
}: GlassViewProps) {
  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    ...(style as object),
  };

  // BlurView works well on iOS; on Android use semi-transparent fallback
  if (Platform.OS === 'android') {
    return (
      <View style={[containerStyle, styles.androidFallback]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={intensity} tint="light" style={containerStyle}>
      <View style={styles.innerContent}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  androidFallback: {
    backgroundColor: GlassEffect.background,
  },
  innerContent: {
    backgroundColor: GlassEffect.background,
  },
});
