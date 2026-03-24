import React, { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const theme = Colors.light;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.full,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    };

    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, minHeight: 36 },
      md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 48 },
      lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md + 4, minHeight: 56 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: theme.primary,
        ...Shadows.md,
      },
      secondary: {
        backgroundColor: theme.secondaryContainer,
        ...Shadows.sm,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.outlineVariant,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    const finalStyle = {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };

    if (fullWidth) {
      finalStyle.width = '100%';
    }

    if (disabled || loading) {
      finalStyle.opacity = 0.5;
    }

    return finalStyle;
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bodyMedium },
      md: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bodySemiBold },
      lg: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bodySemiBold },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: theme.onPrimary },
      secondary: { color: theme.onSecondaryContainer },
      outline: { color: theme.primary },
      ghost: { color: theme.primary },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? theme.primary : theme.onPrimary}
        />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
