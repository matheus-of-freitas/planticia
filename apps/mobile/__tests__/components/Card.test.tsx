import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Spacing } from '../../constants/theme';

describe('Card', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', () => {
    const { getByText } = render(
      <Card><Text>Card content</Text></Card>
    );
    expect(getByText('Card content')).toBeTruthy();
  });

  it('default variant is elevated', () => {
    const { toJSON } = render(
      <Card><Text>Elevated</Text></Card>
    );
    const tree = toJSON();
    // elevated variant applies surfaceContainerLowest backgroundColor and shadow
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.backgroundColor).toBeDefined();
  });

  it('noPadding removes padding', () => {
    const { toJSON } = render(
      <Card noPadding><Text>No pad</Text></Card>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.padding).toBeUndefined();
  });

  it('custom style is applied', () => {
    const { toJSON } = render(
      <Card style={{ marginTop: 99 }}><Text>Styled</Text></Card>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.marginTop).toBe(99);
  });

  it('different variants render', () => {
    const variants = ['elevated', 'filled', 'flat'] as const;
    for (const variant of variants) {
      const { getByText, unmount } = render(
        <Card variant={variant}><Text>{`V-${variant}`}</Text></Card>
      );
      expect(getByText(`V-${variant}`)).toBeTruthy();
      unmount();
    }
  });
});
