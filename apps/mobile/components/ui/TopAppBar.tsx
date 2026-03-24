import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, GlassEffect } from '../../constants/theme';

interface TopAppBarProps {
  onBack?: () => void;
  title?: string;
  rightIcon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onRightPress?: () => void;
  showBack?: boolean;
}

export function TopAppBar({
  onBack,
  title = 'Planticia',
  rightIcon,
  onRightPress,
  showBack = true,
}: TopAppBarProps) {
  const theme = Colors.light;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {
      paddingTop: insets.top,
      backgroundColor: GlassEffect.background,
    }]}>
      <View style={styles.content}>
        {showBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}

        <Text style={[styles.title, { color: theme.onSurface }]}>{title}</Text>

        {rightIcon && onRightPress ? (
          <TouchableOpacity onPress={onRightPress} style={styles.iconButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name={rightIcon} size={24} color={theme.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.headlineSemiBold,
    fontSize: Typography.fontSize.lg,
    flex: 1,
    textAlign: 'center',
  },
});
