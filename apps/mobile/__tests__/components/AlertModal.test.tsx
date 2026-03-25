import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AlertModal, AlertConfig } from '../../components/ui/AlertModal';

describe('AlertModal', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseConfig: AlertConfig = {
    type: 'info',
    title: 'Test Title',
    message: 'Test message body',
  };

  it('returns null when config is null', () => {
    const { toJSON } = render(
      <AlertModal visible={true} config={null} onDismiss={() => {}} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders title and message', () => {
    const { getByText } = render(
      <AlertModal visible={true} config={baseConfig} onDismiss={() => {}} />
    );
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test message body')).toBeTruthy();
  });

  it('shows confirm button by default with "OK" text', () => {
    const { getByText } = render(
      <AlertModal visible={true} config={baseConfig} onDismiss={() => {}} />
    );
    expect(getByText('OK')).toBeTruthy();
  });

  it('confirm type shows two buttons', () => {
    const confirmConfig: AlertConfig = {
      type: 'confirm',
      title: 'Confirm?',
      message: 'Are you sure?',
    };
    const { getByText } = render(
      <AlertModal visible={true} config={confirmConfig} onDismiss={() => {}} />
    );
    expect(getByText('Cancelar')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
  });

  it('onConfirm callback called', () => {
    const onConfirm = jest.fn();
    const onDismiss = jest.fn();
    const config: AlertConfig = {
      type: 'info',
      title: 'Confirm',
      message: 'Click OK',
      onConfirm,
    };
    const { getByText } = render(
      <AlertModal visible={true} config={config} onDismiss={onDismiss} />
    );
    fireEvent.press(getByText('OK'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('onCancel callback called on cancel press', () => {
    const onCancel = jest.fn();
    const onDismiss = jest.fn();
    const config: AlertConfig = {
      type: 'confirm',
      title: 'Cancel Test',
      message: 'Click cancel',
      onCancel,
    };
    const { getByText } = render(
      <AlertModal visible={true} config={config} onDismiss={onDismiss} />
    );
    fireEvent.press(getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('custom confirmText and cancelText', () => {
    const config: AlertConfig = {
      type: 'confirm',
      title: 'Custom',
      message: 'Custom buttons',
      confirmText: 'Yes, delete',
      cancelText: 'No, keep',
    };
    const { getByText } = render(
      <AlertModal visible={true} config={config} onDismiss={() => {}} />
    );
    expect(getByText('Yes, delete')).toBeTruthy();
    expect(getByText('No, keep')).toBeTruthy();
  });
});
