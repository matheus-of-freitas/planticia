import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Shadows, Spacing, Typography } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
  size?: number;
}

export function FAB({ onPress, icon = '+', size = 64 }: FABProps) {
  const theme = Colors.light;

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: theme.primary,
          width: size,
          height: size,
          borderRadius: size / 2,
          ...Shadows.lg,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, { fontSize: size / 2 }]}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.light,
    lineHeight: undefined,
  },
});
