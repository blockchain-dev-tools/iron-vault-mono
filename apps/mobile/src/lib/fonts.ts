// Custom font family constants
// Weights available:
//   SpaceGrotesk: 400 (Regular), 600 (SemiBold), 700 (Bold)
//   Manrope:      400 (Regular), 500 (Medium), 700 (Bold), 800 (ExtraBold)

export const Fonts = {
  // Space Grotesk — headlines, labels, buttons
  spaceGrotesk: {
    regular:  'SpaceGrotesk_400Regular',
    semiBold: 'SpaceGrotesk_600SemiBold',
    bold:     'SpaceGrotesk_700Bold',
  },
  // Manrope — body text, descriptions
  manrope: {
    regular:   'Manrope_400Regular',
    medium:    'Manrope_500Medium',
    bold:      'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
} as const;