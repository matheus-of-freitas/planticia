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
        <View style={[styles.iconCircle, { backgroundColor: theme.surfaceContainerLow }]}>
          <MaterialCommunityIcons
            name={iconName}
            size={64}
            color={iconColor || theme.primary}
          />
        </View>
      );
    }
    if (typeof icon === 'string') {
      return <Text style={styles.icon}>{icon}</Text>;
    }
    return <View style={styles.iconCircle}>{icon}</View>;
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
      <Text style={[styles.title, { color: theme.onSurface }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.onSurfaceVariant }]}>{message}</Text>
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
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize['2xl'],
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
});
