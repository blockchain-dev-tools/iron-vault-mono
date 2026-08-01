// minimal_theme.dart — Exercise 1: BuildContext & InheritedWidget.
//
// Goal:
//   Understand what BuildContext is, the Widget / Element / RenderObject
//   three-layer tree, and implement a lightweight theme system using
//   InheritedWidget (no ThemeData, no Provider).
//
// How it works:
//   1. [MinimalTheme] holds colors + typography (immutable data).
//   2. [MinimalThemeProvider] is an InheritedWidget that makes the
//      theme available to all descendants via `context.dependOn...`.
//   3. The [`BuildContext` extension] adds convenient `.colors` /
//      `.typography` getters so you never call the provider directly.
//
// Key insight:
//   `context.dependOnInheritedWidgetOfExactType<MinimalThemeProvider>()`
//   does two things: (a) returns the nearest ancestor provider, and
//   (b) registers the calling context as a *dependent* — when the
//   provider rebuilds, all dependents rebuild too.

import 'package:flutter/material.dart';

// ─── Data layer ────────────────────────────────────────────────────

class AppColors {
  final Color primary;
  final Color background;
  final Color surface;
  final Color text;
  final Color error;
  final Color onPrimary;

  const AppColors({
    required this.primary,
    required this.background,
    required this.surface,
    required this.text,
    required this.error,
    required this.onPrimary,
  });

  static const dark = AppColors(
    primary: Color(0xFF8FC322),
    background: Color(0xFF0F0F0F),
    surface: Color(0xFF1A1A1A),
    text: Color(0xFFFFFFFF),
    error: Color(0xFFCF6679),
    onPrimary: Color(0xFF000000),
  );

  static const light = AppColors(
    primary: Color(0xFF5F8A0E),
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFF5F5F5),
    text: Color(0xFF000000),
    error: Color(0xFFB00020),
    onPrimary: Color(0xFFFFFFFF),
  );
}

class AppTypography {
  final TextStyle heading;
  final TextStyle body;
  final TextStyle caption;
  final TextStyle label;

  const AppTypography({
    required this.heading,
    required this.body,
    required this.caption,
    required this.label,
  });

  static const dark = AppTypography(
    heading: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: Color(0xFFFFFFFF),
    ),
    body: TextStyle(fontSize: 16, color: Color(0xFFFFFFFF)),
    caption: TextStyle(fontSize: 12, color: Color(0xFFBDBDBD)),
    label: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFFFFFFFF)),
  );

  static const light = AppTypography(
    heading: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: Color(0xFF000000),
    ),
    body: TextStyle(fontSize: 16, color: Color(0xFF212121)),
    caption: TextStyle(fontSize: 12, color: Color(0xFF757575)),
    label: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF212121)),
  );
}

// ─── Theme container ───────────────────────────────────────────────

class MinimalTheme {
  final AppColors colors;
  final AppTypography typography;

  const MinimalTheme({required this.colors, required this.typography});

  static const dark = MinimalTheme(colors: AppColors.dark, typography: AppTypography.dark);
  static const light = MinimalTheme(colors: AppColors.light, typography: AppTypography.light);
}

// ─── InheritedWidget ───────────────────────────────────────────────

class MinimalThemeProvider extends InheritedWidget {
  final MinimalTheme theme;

  const MinimalThemeProvider({
    super.key,
    required this.theme,
    required super.child,
  });

  /// Returns the nearest [MinimalThemeProvider] above [context].
  ///
  /// This call registers [context] as a *dependent* of the provider.
  /// When the provider's [theme] changes, all dependents rebuild.
  static MinimalTheme of(BuildContext context) {
    final provider = context.dependOnInheritedWidgetOfExactType<MinimalThemeProvider>();
    assert(provider != null, 'No MinimalThemeProvider found in context tree');
    return provider!.theme;
  }

  @override
  bool updateShouldNotify(MinimalThemeProvider oldWidget) => theme != oldWidget.theme;
}

// ─── Convenience extension on BuildContext ─────────────────────────
//
// Instead of writing `MinimalThemeProvider.of(context).colors`
// everywhere, just use `context.colors`.

extension MinimalThemeContext on BuildContext {
  MinimalTheme get minimalTheme => MinimalThemeProvider.of(this);
  AppColors get colors => MinimalThemeProvider.of(this).colors;
  AppTypography get typography => MinimalThemeProvider.of(this).typography;
}

// ─── Usage example (widget tree) ───────────────────────────────────
//
// Wrap at the root:
//
//   MinimalThemeProvider(
//     theme: MinimalTheme.dark,
//     child: MaterialApp(...),
//   )
//
// Consume anywhere:
//
//   Container(
//     color: context.colors.background,
//     child: Text('Hello', style: context.typography.heading),
//   )
//
// Switch theme dynamically:
//
//   MinimalThemeProvider(
//     theme: isDark ? MinimalTheme.dark : MinimalTheme.light,
//     child: ...
//   )
//
// Because [AppColors] and [AppTypography] are deeply immutable
// (all fields are `final`), the provider's `updateShouldNotify`
// comparison is cheap.
