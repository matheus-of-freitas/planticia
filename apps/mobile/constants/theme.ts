import { Platform } from 'react-native';

// Biophilic Editorial Design System
// Palette derived from forest floor to canopy

export const BrandColors = {
  primary: '#173809',        // Deep Forest
  primaryContainer: '#2d4f1e', // Forest Container
  primaryFixed: '#c5efad',   // Light Leaf
  primaryFixedDim: '#a9d293', // Muted Leaf
  onPrimary: '#ffffff',
  onPrimaryContainer: '#98c083',
  onPrimaryFixed: '#062100',
  onPrimaryFixedVariant: '#2d4f1e',

  secondary: '#4a6549',      // Soft Sage
  secondaryContainer: '#ccebc7', // Light Sage
  onSecondary: '#ffffff',
  onSecondaryContainer: '#506b4f',
  secondaryFixed: '#ccebc7',
  secondaryFixedDim: '#b0cfad',

  tertiary: '#432b22',       // Earthy Brown
  tertiaryContainer: '#5b4137', // Dark Earth
  onTertiary: '#ffffff',
  onTertiaryContainer: '#d2aea1',
  tertiaryFixed: '#ffdbce',
  tertiaryFixedDim: '#e4beb2',

  success: '#4CAF50',
  warning: '#FFA726',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
  info: '#29B6F6',
};

export const Colors = {
  light: {
    // Text (new tokens + backward compat aliases)
    onSurface: '#181c1a',
    onSurfaceVariant: '#43493e',
    text: '#181c1a',
    textSecondary: '#43493e',
    textTertiary: '#73796d',

    // Surfaces
    surface: '#f7faf6',
    surfaceBright: '#f7faf6',
    surfaceDim: '#d8dbd7',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f1f4f0',
    surfaceContainer: '#ecefeb',
    surfaceContainerHigh: '#e6e9e5',
    surfaceContainerHighest: '#e0e3df',
    // Backward compat
    background: '#f7faf6',
    backgroundSecondary: '#f1f4f0',
    backgroundTertiary: '#ecefeb',

    // Brand
    primary: BrandColors.primary,
    primaryContainer: BrandColors.primaryContainer,
    primaryLight: BrandColors.primaryContainer,  // compat alias
    primaryDark: BrandColors.primary,            // compat alias
    primaryFixed: BrandColors.primaryFixed,
    primaryFixedDim: BrandColors.primaryFixedDim,
    onPrimary: BrandColors.onPrimary,
    onPrimaryContainer: BrandColors.onPrimaryContainer,

    secondary: BrandColors.secondary,
    secondaryContainer: BrandColors.secondaryContainer,
    onSecondary: BrandColors.onSecondary,
    onSecondaryContainer: BrandColors.onSecondaryContainer,
    accent: BrandColors.secondaryContainer,      // compat alias

    tertiary: BrandColors.tertiary,
    tertiaryContainer: BrandColors.tertiaryContainer,
    tertiaryFixed: BrandColors.tertiaryFixed,

    // Status
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: BrandColors.error,
    errorContainer: BrandColors.errorContainer,
    info: BrandColors.info,

    // Outline (replaces border)
    outline: '#73796d',
    outlineVariant: '#c3c8bb',
    border: '#c3c8bb',          // compat alias
    borderLight: '#e0e3df',     // compat alias

    // Inverse
    inverseSurface: '#2d312f',
    inversePrimary: '#a9d293',
    inverseOnSurface: '#eef2ee',

    // UI Elements
    shadow: 'rgba(24, 28, 26, 0.06)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    surfaceTint: '#446733',

    // Card
    card: '#ffffff',
    cardShadow: 'rgba(24, 28, 26, 0.06)',
  },
  dark: {
    // Text
    onSurface: '#e0e3df',
    onSurfaceVariant: '#c3c8bb',
    text: '#e0e3df',
    textSecondary: '#c3c8bb',
    textTertiary: '#73796d',

    // Surfaces
    surface: '#101410',
    surfaceBright: '#363a35',
    surfaceDim: '#101410',
    surfaceContainerLowest: '#0b0f0b',
    surfaceContainerLow: '#181c1a',
    surfaceContainer: '#1c201e',
    surfaceContainerHigh: '#262a28',
    surfaceContainerHighest: '#313533',
    background: '#101410',
    backgroundSecondary: '#181c1a',
    backgroundTertiary: '#1c201e',

    // Brand
    primary: BrandColors.primaryFixedDim,
    primaryContainer: BrandColors.primaryContainer,
    primaryLight: BrandColors.primaryFixed,
    primaryDark: BrandColors.primary,
    primaryFixed: BrandColors.primaryFixed,
    primaryFixedDim: BrandColors.primaryFixedDim,
    onPrimary: BrandColors.onPrimaryFixed,
    onPrimaryContainer: BrandColors.onPrimaryContainer,

    secondary: BrandColors.secondaryFixedDim,
    secondaryContainer: '#334d33',
    onSecondary: '#07200b',
    onSecondaryContainer: BrandColors.secondaryContainer,
    accent: BrandColors.secondaryFixedDim,

    tertiary: BrandColors.tertiaryFixedDim,
    tertiaryContainer: BrandColors.tertiaryContainer,
    tertiaryFixed: BrandColors.tertiaryFixed,

    // Status
    success: BrandColors.success,
    warning: BrandColors.warning,
    error: '#ffb4ab',
    errorContainer: '#93000a',
    info: BrandColors.info,

    // Outline
    outline: '#8d9387',
    outlineVariant: '#43493e',
    border: '#43493e',
    borderLight: '#313533',

    // Inverse
    inverseSurface: '#e0e3df',
    inversePrimary: '#2d4f1e',
    inverseOnSurface: '#2d312f',

    // UI Elements
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    surfaceTint: '#a9d293',

    // Card
    card: '#1c201e',
    cardShadow: 'rgba(0, 0, 0, 0.2)',
  },
};

export const Typography = {
  // Font Families (custom loaded fonts)
  fontFamily: {
    headlineRegular: 'PlusJakartaSans_400Regular',
    headlineSemiBold: 'PlusJakartaSans_600SemiBold',
    headlineBold: 'PlusJakartaSans_700Bold',
    headlineExtraBold: 'PlusJakartaSans_800ExtraBold',
    bodyRegular: 'BeVietnamPro_400Regular',
    bodyMedium: 'BeVietnamPro_500Medium',
    bodySemiBold: 'BeVietnamPro_600SemiBold',
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    display: 56,
    displaySm: 44,
  },

  // Font Weights
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#181c1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#181c1a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#181c1a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 32,
    elevation: 8,
  },
  xl: {
    shadowColor: '#181c1a',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 12,
  },
};

// Reusable gradient configs
export const Gradients = {
  biophilic: ['#173809', '#2d4f1e'] as const,
  biophilicLight: ['#2d4f1e', '#4a6549'] as const,
  surfaceFade: ['rgba(23,56,9,0)', 'rgba(23,56,9,0.6)'] as const,
  heroOverlay: ['rgba(23,56,9,0.35)', 'rgba(23,56,9,0)', 'rgba(23,56,9,0.4)'] as const,
};

// Glassmorphism config
export const GlassEffect = {
  background: 'rgba(247, 250, 246, 0.7)',
  backgroundDark: 'rgba(16, 20, 16, 0.7)',
  blurIntensity: 20,
  borderColor: 'rgba(195, 200, 187, 0.15)',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'PlusJakartaSans_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'PlusJakartaSans_400Regular',
    serif: 'serif',
    rounded: 'PlusJakartaSans_400Regular',
    mono: 'monospace',
  },
  web: {
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Plus Jakarta Sans', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
