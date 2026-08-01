import 'package:flutter/material.dart';

import 'color_tokens.dart';

/// Builds a [ThemeData] from [ColorTokens] for a given [Brightness].
ThemeData _buildTheme(ColorTokens c, Brightness b) {
  return ThemeData(
    useMaterial3: true,
    brightness: b,
    colorScheme: ColorScheme(
      brightness: b,
      primary: c.primary,
      onPrimary: c.onPrimary,
      secondary: c.primary,
      onSecondary: c.onPrimary,
      error: c.error,
      onError: Colors.white,
      surface: c.surface,
      onSurface: c.text,
      outline: c.border,
      surfaceContainerHighest: c.surface,
    ),
    scaffoldBackgroundColor: c.bg,
    appBarTheme: AppBarTheme(
      backgroundColor: c.surface,
      foregroundColor: c.text,
      elevation: 0,
      scrolledUnderElevation: 2,
      shadowColor: Colors.black26,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(R.lg),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(R.lg),
        ),
      ),
    ),
  );
}

/// Dark theme used by [MaterialApp.darkTheme].
final ThemeData darkTheme = _buildTheme(ColorTokens.dark, Brightness.dark);

/// Light theme used by [MaterialApp.theme].
final ThemeData lightTheme = _buildTheme(ColorTokens.light, Brightness.light);
