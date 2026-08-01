import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:go_router/go_router.dart';

import 'app/app_state.dart';
import 'core/router.dart';
import 'data/repositories/settings_repository_impl.dart';
import 'data/repositories/wallet_repository_impl.dart';
import 'generated/l10n/app_localizations.dart';
import 'infrastructure/ble/ble_peripheral.dart';
import 'infrastructure/ffi/crypto_service_adapter.dart';
import 'infrastructure/persistence/shared_prefs_storage.dart';
import 'services/account_service.dart';
import 'services/mnemonic_service.dart';
import 'services/pin_auth_service.dart';
import 'services/settings_service.dart';
import 'services/wallet_service.dart';
import 'ui/theme/app_theme.dart';

/// Global navigator key for navigation from non-Widget code.
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (kDebugMode) {
    SemanticsBinding.instance.ensureSemantics();
  }
  runApp(const IronVaultApp());
}

class IronVaultApp extends StatefulWidget {
  const IronVaultApp({super.key});

  @override
  State<IronVaultApp> createState() => _IronVaultAppState();
}

class _IronVaultAppState extends State<IronVaultApp> {
  final AppState _appState = AppState(
    settingsService: SettingsService(
      repo: SettingsRepositoryImpl(),
    ),
  );

  /// Stable GoRouter — created once after hasWallet resolves.
  /// Never recreated on theme/locale changes to avoid navigation reset.
  GoRouter? _router;

  @override
  void initState() {
    super.initState();
    _initApp();
  }

  Future<void> _initApp() async {
    // Load persisted settings.
    await _appState.loadSettings();

    // Build the dependency chain:
    //   Storage → WalletRepositoryImpl
    //   ICryptoService (CryptoServiceAdapter)
    //   → PinAuthService, AccountService, MnemonicService
    //   → WalletService
    final storage = SharedPreferencesStorage();
    final crypto = const CryptoServiceAdapter();
    final walletRepo = WalletRepositoryImpl(storage);

    final pinAuthService = PinAuthService(crypto: crypto, repo: walletRepo);
    final accountService = AccountService(crypto: crypto);
    final mnemonicService = MnemonicService(crypto: crypto);
    _appState.mnemonicService = mnemonicService;

    final walletService = WalletService(
      pinAuth: pinAuthService,
      accountService: accountService,
      mnemonicService: mnemonicService,
      repo: walletRepo,
    );

    await _appState.resolveWallet(walletService);

    // Create GoRouter ONCE — stable reference prevents navigation reset
    // on theme/locale changes triggered by AppState listeners.
    _router = createRouter(
      initialHasWallet: _appState.hasWallet ?? false,
      appState: _appState,
    );

    // Inject sign-request navigation callback.
    _appState.onSignRequest = _navigateToTransaction;

    // Initialize BLE peripheral for Ledger Nano X compatibility.
    final blePeripheral = BlePeripheral();
    _appState.blePeripheral = blePeripheral;
  }

  /// Navigate to the transaction confirmation screen when a sign
  /// request arrives from BLE.
  void _navigateToTransaction() {
    _router?.go('/transaction');
  }

  @override
  void dispose() {
    _appState.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _appState,
      builder: (context, _) {
        final hasWallet = _appState.hasWallet;

        // Startup flash prevention: render nothing until wallet check
        // AND router creation both complete.
        if (hasWallet == null || _router == null) {
          return MaterialApp(
            title: 'Iron Vault',
            debugShowCheckedModeBanner: false,
            themeMode: _appState.themeMode,
            darkTheme: darkTheme,
            theme: lightTheme,
            locale: _appState.locale,
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const SizedBox.shrink(),
          );
        }

        return MaterialApp.router(
          title: 'Iron Vault',
          debugShowCheckedModeBanner: false,
          themeMode: _appState.themeMode,
          darkTheme: darkTheme,
          theme: lightTheme,
          locale: _appState.locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          routerConfig: _router!,
        );
      },
    );
  }
}
