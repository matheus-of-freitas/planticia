import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { EmptyState } from '../../components/ui/EmptyState';

describe('EmptyState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders title and message', () => {
    const { getByText } = render(
      <EmptyState title="No plants" message="Add your first plant" />
    );
    expect(getByText('No plants')).toBeTruthy();
    expect(getByText('Add your first plant')).toBeTruthy();
  });

  it('default emoji icon renders', () => {
    const { getByText } = render(
      <EmptyState title="Empty" message="Nothing here" />
    );
    // Default icon is the emoji '🌱'
    expect(getByText('🌱')).toBeTruthy();
  });

  it('iconName renders MaterialCommunityIcons', () => {
    const { toJSON } = render(
      <EmptyState title="Custom Icon" message="With icon name" iconName="flower" />
    );
    const tree = JSON.stringify(toJSON());
    // The mock renders MaterialCommunityIcons as a string element
    expect(tree).toContain('MaterialCommunityIcons');
  });

  it('renders React node as icon', () => {
    const customIcon = <Text>CustomIcon</Text>;
    const { getByText } = render(
      <EmptyState title="Node Icon" message="With React node" icon={customIcon} />
    );
    expect(getByText('CustomIcon')).toBeTruthy();
  });

  it('action button shown when actionLabel + onAction provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        title="Empty"
        message="Nothing"
        actionLabel="Add plant"
        onAction={onAction}
      />
    );
    const button = getByText('Add plant');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('action button hidden when no actionLabel', () => {
    const { queryByText } = render(
      <EmptyState title="Empty" message="Nothing" />
    );
    expect(queryByText('Add plant')).toBeNull();
  });
});
