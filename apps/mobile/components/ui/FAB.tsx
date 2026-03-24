import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Shadows, Spacing, BorderRadius } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label?: string;
  size?: number;
  style?: ViewStyle;
}

export function FAB({ onPress, iconName = 'plus', label, size = 56, style }: FABProps) {
  const theme = Colors.light;

  // Extended FAB (with label)
  if (label) {
    return (
      <TouchableOpacity
        style={[
          styles.fab,
          styles.extended,
          {
            backgroundColor: theme.primaryContainer,
            ...Shadows.lg,
          },
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name={iconName} size={22} color={theme.onPrimaryContainer} />
        <Text style={[styles.label, { color: theme.onPrimaryContainer }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Standard circular FAB
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: theme.primaryContainer,
          width: size,
          height: size,
          borderRadius: size / 2,
          ...Shadows.lg,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={iconName} size={size * 0.43} color={theme.onPrimaryContainer} />
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
  extended: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    height: 56,
  },
  label: {
    fontFamily: Typography.fontFamily.bodySemiBold,
    fontSize: Typography.fontSize.sm,
  },
});
