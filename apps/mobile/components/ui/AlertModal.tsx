import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export type AlertType = 'error' | 'success' | 'warning' | 'confirm' | 'info';

export interface AlertConfig {
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertModalProps {
  visible: boolean;
  config: AlertConfig | null;
  onDismiss: () => void;
}

const iconMap: Record<AlertType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  error: 'alert-circle',
  success: 'check-circle',
  warning: 'alert',
  confirm: 'alert',
  info: 'information',
};

export function AlertModal({ visible, config, onDismiss }: AlertModalProps) {
  const theme = Colors.light;

  if (!config) return null;

  const iconColor = config.type === 'error' || config.type === 'confirm'
    ? theme.error
    : config.type === 'success'
    ? theme.success
    : config.type === 'warning'
    ? theme.warning
    : theme.info;

  const isConfirm = config.type === 'confirm';

  function handleConfirm() {
    config?.onConfirm?.();
    onDismiss();
  }

  function handleCancel() {
    config?.onCancel?.();
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.cardWrapper}
        >
          <View style={[styles.card, { backgroundColor: theme.surfaceContainerLowest }]}>
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '1A' }]}>
              <MaterialCommunityIcons
                name={iconMap[config.type]}
                size={32}
                color={iconColor}
              />
            </View>

            <Text style={[styles.title, { color: theme.onSurface }]}>{config.title}</Text>
            <Text style={[styles.message, { color: theme.onSurfaceVariant }]}>{config.message}</Text>

            <View style={isConfirm ? styles.buttonRow : styles.buttonSingle}>
              {isConfirm && (
                <Button
                  title={config.cancelText || 'Cancelar'}
                  onPress={handleCancel}
                  variant="outline"
                  size="md"
                  style={styles.cancelButton}
                />
              )}
              <Button
                title={config.confirmText || 'OK'}
                onPress={handleConfirm}
                variant="primary"
                size="md"
                fullWidth={!isConfirm}
                style={[
                  isConfirm && styles.confirmButton,
                  isConfirm && { backgroundColor: theme.error },
                ]}
                textStyle={isConfirm ? { color: theme.onError } : undefined}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const theme = Colors.light;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamily.headlineBold,
    fontSize: Typography.fontSize.xl,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontFamily: Typography.fontFamily.bodyRegular,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  buttonSingle: {
    width: '100%',
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
