import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  iconColor?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '🌱', iconName, iconColor, title, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = Colors.light;

  const renderIcon = () => {
    if (iconName) {
      return (
        <MaterialCommunityIcons
          name={iconName}
          size={80}
          color={iconColor || theme.primary}
          style={styles.iconComponent}
        />
      );
    }
    if (typeof icon === 'string') {
      return <Text style={styles.icon}>{icon}</Text>;
    }
    return <View style={styles.iconComponent}>{icon}</View>;
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: Spacing.lg }}
        />
      )}
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
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  iconComponent: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
});
