import 'package:flutter/material.dart';

import '../core/interfaces/wallet_service.dart';
import '../core/models/apdu_message.dart';
import '../core/models/signature_record.dart';
import '../infrastructure/ble/ble_peripheral.dart';
import '../infrastructure/ffi/crypto_service_adapter.dart';
import '../biz/apdu_handler.dart';
import '../biz/ble_session.dart';
import '../biz/sign_confirmation.dart';
import '../services/mnemonic_service.dart';
import '../services/settings_service.dart';

/// Global application state — wallet lifecycle, BLE peripheral lifecycle,
/// settings delegation, and navigation tracking.
///
/// Business logic for APDU dispatch, auto-lock, and sign-interception is
/// delegated to [BleSession] and [SignConfirmation].
///
/// Uses [ChangeNotifier] + Flutter's built-in [ListenableBuilder].
class AppState extends ChangeNotifier {
  // ── Settings (delegated) ────────────────────────────────────────────

  final SettingsService _settingsService;
  SettingsService get settingsService => _settingsService;

  // Convenience accessors for theme/locale (delegated).
  ThemeMode get themeMode => _settingsService.themeMode;
  Locale get locale => _settingsService.locale;
  bool get storePassphrase => _settingsService.storePassphrase;

  AppState({required SettingsService settingsService})
      : _settingsService = settingsService {
    _settingsService.addListener(_onSettingsChanged);
    _signConfirmation = SignConfirmation(
      crypto: const CryptoServiceAdapter(),
      apduHandler: _apduHandler,
    );
    _signConfirmation.onRequestPending = () {
      // Forward to the navigation callback set by main.dart.
      onSignRequest?.call();
    };
  }

  void _onSettingsChanged() {
    notifyListeners(); // Bubble settings changes up to UI.
  }

  /// Load persisted settings on startup.
  Future<void> loadSettings() => _settingsService.loadSettings();

  // ── Wallet ─────────────────────────────────────────────────────────

  /// `null` = unknown (splash), resolved to `true` / `false`.
  bool? _hasWallet;
  bool? get hasWallet => _hasWallet;

  /// The active [IWalletService] instance, set after startup.
  IWalletService? _walletService;
  IWalletService? get walletService => _walletService;

  /// Sets the wallet service and notifies listeners.
  set walletService(IWalletService? ws) {
    _walletService = ws;
    notifyListeners();
  }

  // ── Mnemonic Service ──────────────────────────────────────────────

  MnemonicService? _mnemonicService;
  MnemonicService? get mnemonicService => _mnemonicService;
  set mnemonicService(MnemonicService? ms) {
    _mnemonicService = ms;
    notifyListeners();
  }

  /// Checks whether a wallet exists on this device, caches the
  /// [WalletService], and creates the [BleSession].
  Future<void> resolveWallet(IWalletService ws) async {
    _walletService = ws;
    _hasWallet = await ws.hasWallet();

    // Create (or recreate) BleSession now that we have the wallet service.
    _bleSession?.dispose();
    _bleSession = BleSession(
      walletService: ws,
      apduHandler: _apduHandler,
      signConfirmation: _signConfirmation,
    );
    _bleSession!.onWalletLocked = () => notifyListeners();
    _bleSession!.trySetApduContext();

    notifyListeners();
  }

  // ── Auto-lock (delegated) ──────────────────────────────────────────

  void onAppBackgrounded() {
    _bleSession?.onAppBackgrounded();
  }

  void onAppForegrounded() {
    _bleSession?.onAppForegrounded();
  }

  // ── BLE Peripheral ─────────────────────────────────────────────────

  BlePeripheral? _blePeripheral;
  BlePeripheral? get blePeripheral => _blePeripheral;

  final ApduHandler _apduHandler = ApduHandler();
  late final SignConfirmation _signConfirmation;
  BleSession? _bleSession;

  set blePeripheral(BlePeripheral? bp) {
    _blePeripheral = bp;
    _bleSession?.blePeripheral = bp;
    notifyListeners();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  Sign confirmation — delegates to SignConfirmation
  // ═══════════════════════════════════════════════════════════════════

  /// Callback for triggering navigation from non-Widget code.
  /// Injected by [main.dart] or router setup.
  void Function()? onSignRequest;

  /// Proxy to [_signConfirmation.pendingRequest].
  PendingSignRequest? get pendingRequest => _signConfirmation.pendingRequest;

  /// Proxy to [_signConfirmation.lastSignResult].
  Map<String, dynamic>? get lastSignResult => _signConfirmation.lastSignResult;

  /// The user approved the pending sign request.
  ///
  /// The sign callback is passed to [SignConfirmation.approve] which
  /// handles the response via [ApduHandler] and sends it over BLE.
  Future<void> approveSign() async {
    await _signConfirmation.approve(() {
      final req = _signConfirmation.pendingRequest!;
      final response = _apduHandler.handle(req.command);
      final bytes = response.toBytes();
      _blePeripheral?.sendApduResponse(bytes);
      return bytes;
    });
    notifyListeners();
  }

  /// The user rejected the pending sign request.
  ///
  /// Sends an error APDU response over BLE via the callback passed to
  /// [SignConfirmation.reject].
  Future<void> rejectSign() async {
    await _signConfirmation.reject(() {
      final resp = ApduResponse(data: null, sw1: 0x69, sw2: 0x85);
      final bytes = resp.toBytes();
      _blePeripheral?.sendApduResponse(bytes);
      return bytes;
    });
    notifyListeners();
  }

  /// Clear the last sign result (after the result screen is dismissed).
  void clearLastSignResult() {
    _signConfirmation.clearLastSignResult();
    notifyListeners();
  }

  /// History of all completed signing operations (approved/rejected/timeout).
  List<SignatureRecord> get signHistory => _signConfirmation.history;

  // ── BLE advertising ─────────────────────────────────────────────────

  Future<void> startBleAdvertising() async {
    await _bleSession?.startAdvertising();
  }

  Future<void> stopBleAdvertising() async {
    await _bleSession?.stopAdvertising();
  }

  // ── Navigation ─────────────────────────────────────────────────────

  String? _currentScreen;
  String? get currentScreen => _currentScreen;

  void setScreen(String screen) {
    _currentScreen = screen;
    notifyListeners();
  }

  // ── Cleanup ────────────────────────────────────────────────────────

  @override
  void dispose() {
    _settingsService.removeListener(_onSettingsChanged);
    _bleSession?.dispose();
    _signConfirmation.dispose();
    _blePeripheral?.dispose();
    super.dispose();
  }
}
