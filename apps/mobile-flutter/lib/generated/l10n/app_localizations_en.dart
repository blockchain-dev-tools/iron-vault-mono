// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Iron Vault';

  @override
  String get welcomeTitle => 'Iron Vault';

  @override
  String get welcomeSubtitle => 'Your Ledger Nano X Compatible Hardware Wallet';

  @override
  String get createWallet => 'Create New Wallet';

  @override
  String get importWallet => 'Import Existing';

  @override
  String get enigmaWallet => 'Enigma Setup';

  @override
  String get unlockTitle => 'Enter PIN';

  @override
  String get unlockSubtitle => 'Enter your 6-digit PIN to unlock';

  @override
  String get attemptsRemaining => 'Attempts remaining';

  @override
  String get lockedOut => 'Locked out';

  @override
  String get resetWallet => 'Reset Wallet';

  @override
  String get entropyTitle => 'Collect Entropy';

  @override
  String get entropyInstruction =>
      'Tap anywhere on the screen to collect entropy';

  @override
  String get entropyProgress => 'touches';

  @override
  String get generateMnemonicTitle => 'Your Recovery Phrase';

  @override
  String get generateMnemonicWarning =>
      'Write down these 12 words in order. Never share them with anyone. Anyone with these words can access your funds.';

  @override
  String get iveWrittenItDown => 'I\'ve written it down';

  @override
  String get continueButton => 'Continue';

  @override
  String get verifyMnemonicTitle => 'Verify Your Phrase';

  @override
  String verifyWordPosition(Object position) {
    return 'Select word #$position';
  }

  @override
  String get importMnemonicTitle => 'Import Wallet';

  @override
  String get importMnemonicHint =>
      'Enter your 12-word recovery phrase, separated by spaces';

  @override
  String get pasteFromClipboard => 'Paste';

  @override
  String wordsCount(Object count) {
    return '$count / 12 words';
  }

  @override
  String get validMnemonic => 'Valid recovery phrase';

  @override
  String get invalidMnemonic => 'Invalid recovery phrase';

  @override
  String get import => 'Import';

  @override
  String get setPinTitle => 'Create PIN';

  @override
  String get setPinSubtitle => 'Enter your 6-digit PIN';

  @override
  String get confirmPin => 'Confirm PIN';

  @override
  String get confirmPinSubtitle => 'Confirm your 6-digit PIN';

  @override
  String get pinMismatch => 'PINs do not match. Try again.';

  @override
  String get changePinTitle => 'Change PIN';

  @override
  String get enterOldPin => 'Enter your old PIN';

  @override
  String get enterNewPin => 'Enter your new PIN';

  @override
  String get enterNewPinSubtitle => 'Enter your new 6-digit PIN';

  @override
  String get confirmNewPin => 'Confirm New PIN';

  @override
  String get confirmNewPinSubtitle => 'Confirm your new 6-digit PIN';

  @override
  String get incorrectPin => 'Incorrect PIN';

  @override
  String get cancel => 'Cancel';

  @override
  String get vaultTitle => 'Vault';

  @override
  String get noAccounts => 'No accounts yet';

  @override
  String get settings => 'Settings';

  @override
  String get backupSeed => 'Backup Seed';

  @override
  String get accountDetail => 'Account Details';

  @override
  String get address => 'Address';

  @override
  String get copyAddress => 'Copy Address';

  @override
  String get derivationPath => 'Derivation Path';

  @override
  String get bleEnabled => 'BLE Enabled';

  @override
  String get signTransaction => 'Sign Transaction';

  @override
  String get transaction => 'Transaction Signing';

  @override
  String get transactionDetails => 'Transaction Details';

  @override
  String get from => 'From';

  @override
  String get to => 'To';

  @override
  String get value => 'Value';

  @override
  String get networkFee => 'Network Fee';

  @override
  String get chain => 'Chain';

  @override
  String get approve => 'Approve';

  @override
  String get reject => 'Reject';

  @override
  String get transactionApproved => 'Transaction signed';

  @override
  String get transactionRejected => 'Transaction rejected';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get appearance => 'Appearance';

  @override
  String get theme => 'Theme';

  @override
  String get darkMode => 'Dark Mode';

  @override
  String get lightMode => 'Light Mode';

  @override
  String get language => 'Language';

  @override
  String get security => 'Security';

  @override
  String get changePin => 'Change PIN';

  @override
  String get resetWalletTitle => 'Reset Wallet';

  @override
  String get resetWalletConfirm =>
      'Are you sure? This will delete all wallet data and cannot be undone.';

  @override
  String get reset => 'Reset';

  @override
  String get bleName => 'BLE Name';

  @override
  String get bleNameHint => 'Enter BLE device name';

  @override
  String get about => 'About';

  @override
  String get version => 'Version';

  @override
  String get backupSeedTitle => 'Backup Seed';

  @override
  String get backupSeedWarning =>
      'Never share your seed phrase! Anyone with these words can access your funds.';

  @override
  String get copyToClipboard => 'Copy to Clipboard';

  @override
  String get copiedToClipboard => 'Copied to clipboard!';

  @override
  String get enigmaTitle => 'Enigma Wallet';

  @override
  String get enigmaDescription =>
      'Generate a deterministic wallet from a memorable phrase and secret key.';

  @override
  String get enterRiddle => 'Enter your riddle';

  @override
  String get enterSecretKey => 'Enter your secret key';

  @override
  String get generateWallet => 'Generate Wallet';

  @override
  String get enigmaMnemonicTitle => 'Enigma Recovery Phrase';

  @override
  String get enigmaMnemonicWarning =>
      'Save these 24 words. You can regenerate them anytime with your riddle and secret key.';

  @override
  String get processing => 'Processing';

  @override
  String get done => 'Done';

  @override
  String get error => 'Error';

  @override
  String get success => 'Success';

  @override
  String get addAccount => 'Add Account';

  @override
  String get startBle => 'Start BLE';

  @override
  String get stopBle => 'Stop BLE';

  @override
  String get bleLogs => 'BLE Logs';

  @override
  String get fingerprint => 'Fingerprint';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageChinese => '中文';

  @override
  String get languageJapanese => '日本語';

  @override
  String get languageKorean => '한국어';

  @override
  String get bluetooth => 'Bluetooth';

  @override
  String get deleteAllWalletData => 'Delete all wallet data from this device';

  @override
  String get ledgerCompatible => 'Ledger Nano X Compatible';

  @override
  String get forgotPin => 'Forgot PIN?';

  @override
  String get unexpectedError => 'Unexpected error. Please try again.';

  @override
  String get generateWithTouch =>
      'Generate a new seed phrase with touch entropy';

  @override
  String get restoreFromSeed => 'Restore a wallet from your seed phrase';

  @override
  String get advancedEnigma => 'Advanced entropy generation with Enigma';

  @override
  String get tapRandomly =>
      'Tap randomly across the screen to collect entropy for your recovery phrase.';

  @override
  String get retry => 'Retry';

  @override
  String get correct => 'Correct!';

  @override
  String get incorrectTryAgain => 'Incorrect — try again';

  @override
  String get whichWord => 'Which word did you write down?';

  @override
  String get enterPinToReveal => 'Enter your PIN to reveal the seed phrase';

  @override
  String get yourSeedPhrase => 'Your Seed Phrase';

  @override
  String get writeDown12Words =>
      'Write these 12 words down and store them securely.';

  @override
  String get makeSurePrivate =>
      'Make sure you are in a private place before viewing.';

  @override
  String get pleaseTryAgainLater =>
      'Please try again later or reset your wallet.';

  @override
  String get yourRiddle => 'Your Riddle';

  @override
  String get secretKey => 'Secret Key';

  @override
  String get mnemonicLanguage => 'Mnemonic Language';

  @override
  String get enterMemorablePhrase =>
      'Enter a memorable phrase, question, or riddle...';

  @override
  String get tipLongUnique =>
      'Tip: Use a long, unique riddle and secret key for maximum security.';

  @override
  String get yourEnigmaSeedPhrase => 'Your Enigma Seed Phrase';

  @override
  String get continueToSetPin => 'Continue to Set PIN';

  @override
  String get noMnemonicGenerated =>
      'No mnemonic generated. Please go back and try again.';

  @override
  String get writeDown24Words =>
      'Write down these 24 words in order and store them securely. Anyone with these words can access your funds.';

  @override
  String get neverShareSeed => 'Never share your seed phrase!';

  @override
  String get passphraseOptional => 'Passphrase (optional)';

  @override
  String get advancedBip39Passphrase =>
      'Advanced: Add BIP39 passphrase (optional)';

  @override
  String get enterPassphraseOptional => 'Enter passphrase (optional)';

  @override
  String get bip39PassphraseExplanation =>
      'A BIP39 passphrase creates a completely different wallet. If you use one, you MUST remember it — there is no way to recover it.';

  @override
  String get displayLanguage => 'Display Language';

  @override
  String get displayLanguageNote =>
      'The display language only affects how the words look, not how the wallet is generated.';

  @override
  String get leaveEmptyStandard => 'Leave empty for standard Enigma wallet.';

  @override
  String get seedDerivedFromEnglish =>
      'This seed is derived from the English mnemonic. It will always be the same regardless of display language.';

  @override
  String get historyTab => 'History';

  @override
  String get noSigningHistory => 'No signing history';

  @override
  String get transactionSignaturesWillAppear =>
      'Transaction signatures will appear here';

  @override
  String get signed => 'Signed';

  @override
  String get rejectedStatus => 'Rejected';

  @override
  String get failedStatus => 'Failed';

  @override
  String get signingAddress => 'Signing Address';

  @override
  String get statusWord => 'Status Word';

  @override
  String get payload => 'Payload';

  @override
  String get justNow => 'Just now';

  @override
  String get noAccountSelected => 'No account selected';

  @override
  String get publicKey => 'Public Key';

  @override
  String get bleAccess => 'BLE Access';

  @override
  String get enabled => 'Enabled';

  @override
  String get disabled => 'Disabled';

  @override
  String get blePeripheral => 'BLE Peripheral';

  @override
  String get connected => 'Connected';

  @override
  String get broadcasting => 'Broadcasting';

  @override
  String get advertisingAs =>
      'Advertising as Ledger Nano X. Ready for connections.';

  @override
  String get startBleBroadcasting =>
      'Start BLE broadcasting to accept signing requests.';

  @override
  String get noBleActivity => 'No BLE activity yet';

  @override
  String get dataHex => 'Data hex';

  @override
  String get dataSize => 'Data size';

  @override
  String get decodedAction => 'Decoded Action';

  @override
  String get eip712TypedData => 'EIP-712 Typed Data';

  @override
  String get domainHash => 'Domain Hash';

  @override
  String get structHash => 'Struct Hash';

  @override
  String get messageToSign => 'Message to sign';

  @override
  String get gasLimit => 'Gas Limit';

  @override
  String get gasPrice => 'Gas Price';

  @override
  String get maxFee => 'Max Fee';

  @override
  String get priorityFee => 'Priority Fee';

  @override
  String get nonce => 'Nonce';

  @override
  String get chainId => 'Chain ID';

  @override
  String showAll(Object bytes) {
    return 'Show all ($bytes bytes)';
  }

  @override
  String get showLess => 'Show less';

  @override
  String get rawSignature => 'Raw Signature';

  @override
  String get signatureResult => 'Signature Result';

  @override
  String get amount => 'Amount';

  @override
  String get spender => 'Spender';

  @override
  String get methodLabel => 'Method';

  @override
  String get messageLabel => 'Message';
}
