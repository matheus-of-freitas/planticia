import {
  BrandColors,
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Gradients,
  GlassEffect,
} from '../../constants/theme';

describe('Theme', () => {
  beforeEach(() => jest.clearAllMocks());

  it('BrandColors has primary, secondary, tertiary', () => {
    expect(BrandColors.primary).toBeDefined();
    expect(BrandColors.secondary).toBeDefined();
    expect(BrandColors.tertiary).toBeDefined();
    expect(typeof BrandColors.primary).toBe('string');
    expect(typeof BrandColors.secondary).toBe('string');
    expect(typeof BrandColors.tertiary).toBe('string');
  });

  it('Colors.light has required keys (surface, onSurface, primary)', () => {
    expect(Colors.light.surface).toBeDefined();
    expect(Colors.light.onSurface).toBeDefined();
    expect(Colors.light.primary).toBeDefined();
  });

  it('Colors.dark has required keys', () => {
    expect(Colors.dark.surface).toBeDefined();
    expect(Colors.dark.onSurface).toBeDefined();
    expect(Colors.dark.primary).toBeDefined();
  });

  it('Typography.fontSize values are numbers', () => {
    const fontSizes = Object.values(Typography.fontSize);
    for (const size of fontSizes) {
      expect(typeof size).toBe('number');
    }
    expect(fontSizes.length).toBeGreaterThan(0);
  });

  it('Spacing values are numbers', () => {
    const spacingValues = Object.values(Spacing);
    for (const val of spacingValues) {
      expect(typeof val).toBe('number');
    }
    expect(spacingValues.length).toBeGreaterThan(0);
  });

  it('BorderRadius values are numbers', () => {
    const radiusValues = Object.values(BorderRadius);
    for (const val of radiusValues) {
      expect(typeof val).toBe('number');
    }
    expect(radiusValues.length).toBeGreaterThan(0);
  });

  it('Shadows has sm/md/lg/xl with elevation', () => {
    const shadowKeys = ['sm', 'md', 'lg', 'xl'] as const;
    for (const key of shadowKeys) {
      expect(Shadows[key]).toBeDefined();
      expect(typeof Shadows[key].elevation).toBe('number');
      expect(Shadows[key].shadowColor).toBeDefined();
      expect(Shadows[key].shadowOffset).toBeDefined();
    }
  });
});
