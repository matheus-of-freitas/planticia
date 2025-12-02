import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({ children, style, padding = 'md', shadow = 'md' }: CardProps) {
  const theme = Colors.light;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          padding: Spacing[padding],
        },
        Shadows[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
  },
});
