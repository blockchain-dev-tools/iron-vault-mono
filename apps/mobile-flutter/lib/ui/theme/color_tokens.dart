import 'package:flutter/material.dart';

/// Design tokens ported from `packages/theme/src/index.ts` in iron-vault-mono.
///
/// Usage:
/// ```dart
/// Container(color: ColorTokens.dark.bg)
/// Text('Hello', style: TextStyle(color: ColorTokens.dark.text))
/// ```
class ColorTokens {
  final Color primary;
  final Color bg;
  final Color surface;
  final Color text;
  final Color error;
  final Color onPrimary;
  final Color onBg;
  final Color border;

  const ColorTokens({
    required this.primary,
    required this.bg,
    required this.surface,
    required this.text,
    required this.error,
    required this.onPrimary,
    required this.onBg,
    required this.border,
  });

  static const dark = ColorTokens(
    primary: Color(0xFF8FC322),
    bg: Color(0xFF0F0F0F),
    surface: Color(0xFF1A1A1A),
    text: Color(0xFFFFFFFF),
    error: Color(0xFFCF6679),
    onPrimary: Color(0xFF000000),
    onBg: Color(0xFFFFFFFF),
    border: Color(0xFF333333),
  );

  static const light = ColorTokens(
    primary: Color(0xFF5F8A0E),
    bg: Color(0xFFFFFFFF),
    surface: Color(0xFFFFFFFF),
    text: Color(0xFF212121),
    error: Color(0xFFB00020),
    onPrimary: Color(0xFFFFFFFF),
    onBg: Color(0xFF212121),
    border: Color(0xFFE0E0E0),
  );
}

/// Corner radius constants matching iron-vault-mono design system.
///
/// - [sm] = 6.0 — small corners (cards, inputs)
/// - [lg] = 12.0 — medium corners (buttons, dialogs)
/// - [xl] = 18.0 — large corners (sheets, panels)
///
/// No `R.md` — use [lg] for medium corners.
class R {
  R._();

  static const double sm = 6.0;
  static const double lg = 12.0;
  static const double xl = 18.0;
}
