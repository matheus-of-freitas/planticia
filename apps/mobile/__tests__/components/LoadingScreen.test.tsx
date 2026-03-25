import React from 'react';
import { render } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

describe('LoadingScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('default message "Carregando..."', () => {
    const { getByText } = render(<LoadingScreen />);
    expect(getByText('Carregando...')).toBeTruthy();
  });

  it('custom message renders', () => {
    const { getByText } = render(<LoadingScreen message="Analyzing..." />);
    expect(getByText('Analyzing...')).toBeTruthy();
  });

  it('ActivityIndicator always present', () => {
    const { UNSAFE_getByType } = render(<LoadingScreen />);
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('iconName shown when provided', () => {
    const { toJSON } = render(<LoadingScreen iconName="leaf" />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('MaterialCommunityIcons');
  });
});
