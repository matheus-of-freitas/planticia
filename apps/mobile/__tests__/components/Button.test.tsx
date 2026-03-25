import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, ActivityIndicator } from 'react-native';
import { Button } from '../../components/ui/Button';

describe('Button', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title text', () => {
    const { getByText } = render(<Button title="Press me" onPress={() => {}} />);
    expect(getByText('Press me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Tap" onPress={onPress} />);
    fireEvent.press(getByText('Tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator when loading', () => {
    const { UNSAFE_getByType } = render(
      <Button title="Loading" onPress={() => {}} loading />
    );
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('disabled prevents onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Disabled" onPress={onPress} disabled />
    );
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('different variants render (primary is default)', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
    for (const variant of variants) {
      const { getByText, unmount } = render(
        <Button title={`Variant-${variant}`} onPress={() => {}} variant={variant} />
      );
      expect(getByText(`Variant-${variant}`)).toBeTruthy();
      unmount();
    }
  });

  it('different sizes render', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const size of sizes) {
      const { getByText, unmount } = render(
        <Button title={`Size-${size}`} onPress={() => {}} size={size} />
      );
      expect(getByText(`Size-${size}`)).toBeTruthy();
      unmount();
    }
  });

  it('fullWidth applies', () => {
    const { toJSON } = render(
      <Button title="Full" onPress={() => {}} fullWidth />
    );
    const tree = toJSON();
    const rootStyle = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(rootStyle?.width).toBe('100%');
  });

  it('renders icon when provided', () => {
    const icon = <Text>IconElement</Text>;
    const { getByText } = render(
      <Button title="With Icon" onPress={() => {}} icon={icon} />
    );
    expect(getByText('IconElement')).toBeTruthy();
    expect(getByText('With Icon')).toBeTruthy();
  });
});
