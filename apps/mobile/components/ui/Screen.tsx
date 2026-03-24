import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  noPadding?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, noPadding = false, style }: ScreenProps) {
  const theme = Colors.light;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.surface,
        },
        !noPadding && { padding: Spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}
