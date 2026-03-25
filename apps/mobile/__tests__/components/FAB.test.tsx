import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FAB } from '../../components/ui/FAB';

describe('FAB', () => {
  beforeEach(() => jest.clearAllMocks());

  it('standard FAB renders (circular)', () => {
    const { toJSON } = render(<FAB onPress={() => {}} />);
    const tree = toJSON();
    // Standard FAB has width/height = size (56 default) and borderRadius = size/2
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.width).toBe(56);
    expect(styles?.height).toBe(56);
    expect(styles?.borderRadius).toBe(28);
  });

  it('extended FAB renders label', () => {
    const { getByText } = render(
      <FAB onPress={() => {}} label="Add plant" />
    );
    expect(getByText('Add plant')).toBeTruthy();
  });

  it('onPress fires', () => {
    const onPress = jest.fn();
    const { UNSAFE_root } = render(<FAB onPress={onPress} />);
    fireEvent.press(UNSAFE_root);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('custom style applies', () => {
    const { toJSON } = render(
      <FAB onPress={() => {}} style={{ bottom: 100 }} />
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.bottom).toBe(100);
  });
});
