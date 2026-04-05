import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  shadow?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  variant?: 'elevated' | 'filled' | 'flat';
  noPadding?: boolean;
}

export function Card({
  children,
  style,
  padding = 'md',
  shadow = 'md',
  variant = 'elevated',
  noPadding = false,
}: CardProps) {
  const theme = Colors.light;

  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: theme.surfaceContainerLowest,
      ...(shadow !== 'none' ? Shadows[shadow] : {}),
    },
    filled: {
      backgroundColor: theme.surfaceContainerLow,
    },
    flat: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <View
      style={[
        styles.card,
        variantStyles[variant],
        !noPadding && { padding: Spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
  },
});
