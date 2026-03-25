import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TopAppBar } from '../../components/ui/TopAppBar';

describe('TopAppBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('default title "Planticia"', () => {
    const { getByText } = render(<TopAppBar />);
    expect(getByText('Planticia')).toBeTruthy();
  });

  it('custom title renders', () => {
    const { getByText } = render(<TopAppBar title="My Plants" />);
    expect(getByText('My Plants')).toBeTruthy();
  });

  it('back button calls onBack', () => {
    const onBack = jest.fn();
    const { UNSAFE_root } = render(<TopAppBar onBack={onBack} />);
    // Find all TouchableOpacity-like pressable elements; the back button contains arrow-left icon
    const allNodes = UNSAFE_root.findAll(
      (node) => node.props.onPress !== undefined
    );
    // The first pressable node with onPress is the back button
    const backButton = allNodes[0];
    fireEvent.press(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('showBack=false hides back button', () => {
    const onBack = jest.fn();
    const { toJSON } = render(<TopAppBar onBack={onBack} showBack={false} />);
    const tree = JSON.stringify(toJSON());
    // When showBack is false, a plain View placeholder is rendered instead of a TouchableOpacity with arrow-left
    expect(tree).not.toContain('arrow-left');
  });

  it('right icon renders when provided', () => {
    const onRightPress = jest.fn();
    const { toJSON } = render(
      <TopAppBar rightIcon="cog" onRightPress={onRightPress} />
    );
    const tree = JSON.stringify(toJSON());
    // The right icon should render a MaterialCommunityIcons with name "cog"
    expect(tree).toContain('MaterialCommunityIcons');
  });
});
