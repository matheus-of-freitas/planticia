import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface EditorialHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function EditorialHeader({ label, title, subtitle, style }: EditorialHeaderProps) {
  const theme = Colors.light;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.secondary }]}>{label}</Text>
      )}
      <Text style={[styles.title, { color: theme.onSurface }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize['3xl'],
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
});
