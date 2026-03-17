import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface LoadingScreenProps {
  message?: string;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
}

export function LoadingScreen({ message = 'Carregando...', iconName, iconColor }: LoadingScreenProps) {
  const theme = Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {iconName && (
        <MaterialCommunityIcons
          name={iconName}
          size={48}
          color={iconColor || theme.primary}
          style={styles.icon}
        />
      )}
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.md,
  },
  message: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
});
