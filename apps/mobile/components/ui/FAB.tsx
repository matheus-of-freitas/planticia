import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Shadows, Spacing } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: number;
}

export function FAB({ onPress, iconName = 'plus', size = 64 }: FABProps) {
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
      <MaterialCommunityIcons name={iconName} size={size / 2} color="#FFFFFF" />
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
});
