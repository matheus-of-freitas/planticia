import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Spacing } from '../../constants/theme';

describe('Screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', () => {
    const { getByText } = render(
      <Screen><Text>Hello Screen</Text></Screen>
    );
    expect(getByText('Hello Screen')).toBeTruthy();
  });

  it('noPadding removes padding', () => {
    const { toJSON } = render(
      <Screen noPadding><Text>No pad</Text></Screen>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.padding).toBeUndefined();
  });

  it('custom style applies', () => {
    const { toJSON } = render(
      <Screen style={{ marginTop: 42 }}><Text>Styled</Text></Screen>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.marginTop).toBe(42);
  });
});
