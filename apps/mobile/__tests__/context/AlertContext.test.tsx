import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { AlertProvider, useAlert } from '../../context/AlertContext';

function AlertTrigger() {
  const { showAlert } = useAlert();
  return (
    <TouchableOpacity
      testID="trigger"
      onPress={() =>
        showAlert({
          type: 'info',
          title: 'Test Alert',
          message: 'Alert body',
        })
      }
    >
      <Text>Trigger</Text>
    </TouchableOpacity>
  );
}

describe('AlertContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('useAlert throws outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAlert());
    }).toThrow('useAlert must be inside AlertProvider');
    spy.mockRestore();
  });

  it('AlertProvider renders children', () => {
    const { getByText } = render(
      <AlertProvider>
        <Text>Child content</Text>
      </AlertProvider>
    );
    expect(getByText('Child content')).toBeTruthy();
  });

  it('showAlert function exists', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AlertProvider>{children}</AlertProvider>
    );
    const { result } = renderHook(() => useAlert(), { wrapper });
    expect(typeof result.current.showAlert).toBe('function');
  });

  it('showAlert displays AlertModal with config', async () => {
    const { getByTestId, getByText } = render(
      <AlertProvider>
        <AlertTrigger />
      </AlertProvider>
    );

    await act(async () => {
      fireEvent.press(getByTestId('trigger'));
    });

    expect(getByText('Test Alert')).toBeTruthy();
    expect(getByText('Alert body')).toBeTruthy();
  });

  it('dismiss hides the alert', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <AlertProvider>
        <AlertTrigger />
      </AlertProvider>
    );

    // Show alert
    await act(async () => {
      fireEvent.press(getByTestId('trigger'));
    });
    expect(getByText('Test Alert')).toBeTruthy();

    // Dismiss by pressing OK
    await act(async () => {
      fireEvent.press(getByText('OK'));
    });

    // Alert should be dismissed (config set to null → renders null)
    expect(queryByText('Test Alert')).toBeNull();
  });
});
