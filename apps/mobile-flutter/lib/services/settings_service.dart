import 'package:flutter/material.dart';

import '../core/interfaces/settings_repository.dart';

/// Manages app settings — theme, locale, store-passphrase preference.
///
/// All persistence I/O is delegated to [ISettingsRepository].
/// This service is pure business logic: it owns the in-memory state,
/// calls persistence, and fires [notifyListeners] on every change.
///
/// Mirrors the settings slice of `AppState` in the pre-refactor codebase.
class SettingsService extends ChangeNotifier {
  final ISettingsRepository _repo;

  // ignore: prefer_initializing_formals
  SettingsService({required ISettingsRepository repo}) : _repo = repo;

  // ── Theme ──────────────────────────────────────────────────────────

  ThemeMode _themeMode = ThemeMode.dark;
  ThemeMode get themeMode => _themeMode;

  /// Toggles between [ThemeMode.dark] and [ThemeMode.light].
  void toggleTheme() {
    _themeMode =
        _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    _repo.setThemeMode(_themeMode);
    notifyListeners();
  }

  // ── Locale / Language ──────────────────────────────────────────────

  Locale _locale = const Locale('en');
  Locale get locale => _locale;

  /// Sets the display language and persists the choice.
  void setLocale(Locale locale) {
    _locale = locale;
    _repo.setLocale(locale);
    notifyListeners();
  }

  // ── Store Passphrase ───────────────────────────────────────────────

  bool _storePassphrase = false;
  bool get storePassphrase => _storePassphrase;

  /// Sets whether the BIP-39 passphrase should be remembered.
  void setStorePassphrase(bool value) {
    _storePassphrase = value;
    _repo.setStorePassphrase(value);
    notifyListeners();
  }

  // ── Load persisted settings ────────────────────────────────────────

  /// Reads saved preferences from the repository.
  /// Call on startup before building the widget tree.
  Future<void> loadSettings() async {
    try {
      final data = await _repo.loadSettings();
      _themeMode = data.themeMode;
      _locale = data.locale;
      _storePassphrase = data.storePassphrase;
    } catch (_) {
      // Repository unavailable (e.g. test environment).
      // Keep default values.
    }
    notifyListeners();
  }

  // ── Locale parsing utility ─────────────────────────────────────────

  /// Parses a locale string like "en", "zh_CN", "ja" into a [Locale].
  // ignore: unused_element
  Locale _parseLocale(String s) {
    final parts = s.split('_');
    if (parts.length == 2) {
      return Locale(parts[0], parts[1]);
    }
    return Locale(parts[0]);
  }
}
