export interface ColorTokens {
  primary: string;
  onPrimary: string;
  bg: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  text: string;
  text2: string;
  textDisabled: string;
  border: string;
  borderVariant: string;
  error: string;
  errorContainer: string;
  // Primary alpha variants for tinted backgrounds
  primary8: string;
  primary12: string;
  primary15: string;
  primary25: string;
}

export const DARK: ColorTokens = {
  primary:             '#8FC322',
  onPrimary:           '#0D1A00',
  bg:                  '#0F0F0F',
  surface:             '#1A1A1A',
  surfaceContainer:    '#242424',
  surfaceContainerLow: '#1E1E1E',
  text:                '#F0F0F0',
  text2:               '#9AA0A6',
  textDisabled:        '#555555',
  border:              '#2A2A2A',
  borderVariant:       '#333333',
  error:               '#CF6679',
  errorContainer:      'rgba(207,102,121,0.12)',
  primary8:            'rgba(143,195,34,0.08)',
  primary12:           'rgba(143,195,34,0.12)',
  primary15:           'rgba(143,195,34,0.15)',
  primary25:           'rgba(143,195,34,0.25)',
};

// Light palette — matches web prototype (#FFFFFF bg, #5f8a0e primary)
export const LIGHT: ColorTokens = {
  primary:             '#5f8a0e',
  onPrimary:           '#F3F7E6',
  bg:                  '#FFFFFF',
  surface:             '#FFFFFF',
  surfaceContainer:    '#F2F7E8',
  surfaceContainerLow: '#F8FBF2',
  text:                '#1A2200',
  text2:               '#5A6640',
  textDisabled:        '#9AA88A',
  border:              '#C8D8A0',
  borderVariant:       '#D0DDB8',
  error:               '#CF6679',
  errorContainer:      'rgba(207,102,121,0.12)',
  primary8:            'rgba(95,138,14,0.08)',
  primary12:           'rgba(95,138,14,0.12)',
  primary15:           'rgba(95,138,14,0.15)',
  primary25:           'rgba(95,138,14,0.25)',
};

// Backward-compatible default export (dark) — used by apps/prototype, packages/apdu, etc.
export const C = DARK;

export const R = {
  sm:  6,
  lg: 12,
  xl: 18,
} as const;