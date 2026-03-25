import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, Platform } from 'react-native';
import { GlassView } from '../../components/ui/GlassView';
import { BorderRadius } from '../../constants/theme';

describe('GlassView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', () => {
    const { getByText } = render(
      <GlassView><Text>Glass content</Text></GlassView>
    );
    expect(getByText('Glass content')).toBeTruthy();
  });

  it('default borderRadius applied', () => {
    const { toJSON } = render(
      <GlassView><Text>Default radius</Text></GlassView>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.borderRadius).toBe(BorderRadius.lg);
  });

  it('renders Android fallback with semi-transparent background', () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android' as typeof Platform.OS;

    const { getByText } = render(
      <GlassView><Text>Android glass</Text></GlassView>
    );
    expect(getByText('Android glass')).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('custom style applies', () => {
    const { toJSON } = render(
      <GlassView style={{ marginTop: 10 }}><Text>Styled</Text></GlassView>
    );
    const tree = toJSON();
    const styles = Array.isArray(tree?.props?.style)
      ? Object.assign({}, ...tree.props.style.filter(Boolean))
      : tree?.props?.style;
    expect(styles?.marginTop).toBe(10);
  });
});
