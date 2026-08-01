// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Japanese (`ja`).
class AppLocalizationsJa extends AppLocalizations {
  AppLocalizationsJa([String locale = 'ja']) : super(locale);

  @override
  String get appTitle => 'Iron Vault';

  @override
  String get welcomeTitle => 'Iron Vault';

  @override
  String get welcomeSubtitle => 'Ledger Nano X互換ハードウェアウォレット';

  @override
  String get createWallet => '新規ウォレット作成';

  @override
  String get importWallet => 'ウォレットをインポート';

  @override
  String get enigmaWallet => 'Enigmaセットアップ';

  @override
  String get unlockTitle => 'PINを入力';

  @override
  String get unlockSubtitle => '6桁のPINを入力してロック解除';

  @override
  String get attemptsRemaining => '残り試行回数';

  @override
  String get lockedOut => 'ロックアウト';

  @override
  String get resetWallet => 'ウォレットをリセット';

  @override
  String get entropyTitle => 'エントロピー収集';

  @override
  String get entropyInstruction => '画面の任意の場所をタップしてエントロピーを収集';

  @override
  String get entropyProgress => 'タップ';

  @override
  String get generateMnemonicTitle => 'リカバリーフレーズ';

  @override
  String get generateMnemonicWarning =>
      'これら12の単語を順番に書き留めてください。誰とも共有しないでください。これらの単語があれば誰でも資金にアクセスできます。';

  @override
  String get iveWrittenItDown => '書き留めました';

  @override
  String get continueButton => '続ける';

  @override
  String get verifyMnemonicTitle => 'フレーズを確認';

  @override
  String verifyWordPosition(Object position) {
    return '単語 #$position を選択';
  }

  @override
  String get importMnemonicTitle => 'ウォレットをインポート';

  @override
  String get importMnemonicHint => '12語のリカバリーフレーズをスペース区切りで入力';

  @override
  String get pasteFromClipboard => '貼り付け';

  @override
  String wordsCount(Object count) {
    return '$count / 12 語';
  }

  @override
  String get validMnemonic => '有効なリカバリーフレーズ';

  @override
  String get invalidMnemonic => '無効なリカバリーフレーズ';

  @override
  String get import => 'インポート';

  @override
  String get setPinTitle => 'PINを作成';

  @override
  String get setPinSubtitle => '6桁のPINを入力';

  @override
  String get confirmPin => 'PIN確認';

  @override
  String get confirmPinSubtitle => '6桁のPINを再入力';

  @override
  String get pinMismatch => 'PINが一致しません。再試行してください。';

  @override
  String get changePinTitle => 'PIN変更';

  @override
  String get enterOldPin => '現在のPINを入力';

  @override
  String get enterNewPin => '新しいPINを入力';

  @override
  String get enterNewPinSubtitle => '新しい6桁のPINを入力';

  @override
  String get confirmNewPin => '新しいPINを確認';

  @override
  String get confirmNewPinSubtitle => '新しい6桁のPINを再入力';

  @override
  String get incorrectPin => 'PINが正しくありません';

  @override
  String get cancel => 'キャンセル';

  @override
  String get vaultTitle => '保管庫';

  @override
  String get noAccounts => 'アカウントがありません';

  @override
  String get settings => '設定';

  @override
  String get backupSeed => 'シードバックアップ';

  @override
  String get accountDetail => 'アカウント詳細';

  @override
  String get address => 'アドレス';

  @override
  String get copyAddress => 'アドレスをコピー';

  @override
  String get derivationPath => '導出パス';

  @override
  String get bleEnabled => 'BLE有効';

  @override
  String get signTransaction => '取引に署名';

  @override
  String get transaction => '取引署名';

  @override
  String get transactionDetails => '取引詳細';

  @override
  String get from => '送信元';

  @override
  String get to => '送信先';

  @override
  String get value => '金額';

  @override
  String get networkFee => 'ネットワーク手数料';

  @override
  String get chain => 'チェーン';

  @override
  String get approve => '承認';

  @override
  String get reject => '拒否';

  @override
  String get transactionApproved => '取引が署名されました';

  @override
  String get transactionRejected => '取引が拒否されました';

  @override
  String get settingsTitle => '設定';

  @override
  String get appearance => '外観';

  @override
  String get theme => 'テーマ';

  @override
  String get darkMode => 'ダークモード';

  @override
  String get lightMode => 'ライトモード';

  @override
  String get language => '言語';

  @override
  String get security => 'セキュリティ';

  @override
  String get changePin => 'PIN変更';

  @override
  String get resetWalletTitle => 'ウォレットをリセット';

  @override
  String get resetWalletConfirm => '本当にすべてのウォレットデータを削除しますか？この操作は元に戻せません。';

  @override
  String get reset => 'リセット';

  @override
  String get bleName => 'BLE名';

  @override
  String get bleNameHint => 'BLEデバイス名を入力';

  @override
  String get about => 'について';

  @override
  String get version => 'バージョン';

  @override
  String get backupSeedTitle => 'シードバックアップ';

  @override
  String get backupSeedWarning =>
      'シードフレーズを絶対に共有しないでください！これらの単語があれば誰でも資金にアクセスできます。';

  @override
  String get copyToClipboard => 'クリップボードにコピー';

  @override
  String get copiedToClipboard => 'クリップボードにコピーしました！';

  @override
  String get enigmaTitle => 'Enigmaウォレット';

  @override
  String get enigmaDescription => '記憶に残るフレーズと秘密鍵から決定論的ウォレットを生成します。';

  @override
  String get enterRiddle => '謎を入力';

  @override
  String get enterSecretKey => '秘密鍵を入力';

  @override
  String get generateWallet => 'ウォレットを生成';

  @override
  String get enigmaMnemonicTitle => 'Enigmaリカバリーフレーズ';

  @override
  String get enigmaMnemonicWarning => 'これら24の単語を保存してください。謎と秘密鍵を使っていつでも再生成できます。';

  @override
  String get processing => '処理中';

  @override
  String get done => '完了';

  @override
  String get error => 'エラー';

  @override
  String get success => '成功';

  @override
  String get addAccount => 'アカウント追加';

  @override
  String get startBle => 'BLE開始';

  @override
  String get stopBle => 'BLE停止';

  @override
  String get bleLogs => 'BLEログ';

  @override
  String get fingerprint => '指紋';

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
  String get deleteAllWalletData => 'このデバイスからすべてのウォレットデータを削除';

  @override
  String get ledgerCompatible => 'Ledger Nano X互換';

  @override
  String get forgotPin => 'PINをお忘れですか？';

  @override
  String get unexpectedError => '予期しないエラーが発生しました。再試行してください。';

  @override
  String get generateWithTouch => 'タッチエントロピーで新しいシードフレーズを生成';

  @override
  String get restoreFromSeed => 'シードフレーズからウォレットを復元';

  @override
  String get advancedEnigma => 'Enigmaによる高度なエントロピー生成';

  @override
  String get tapRandomly => '画面をランダムにタップしてリカバリーフレーズのエントロピーを収集してください。';

  @override
  String get retry => '再試行';

  @override
  String get correct => '正解！';

  @override
  String get incorrectTryAgain => '不正解 — もう一度';

  @override
  String get whichWord => '書き留めた単語はどれですか？';

  @override
  String get enterPinToReveal => 'PINを入力してシードフレーズを表示';

  @override
  String get yourSeedPhrase => 'あなたのシードフレーズ';

  @override
  String get writeDown12Words => 'これら12の単語を順番に書き留め、安全に保管してください。';

  @override
  String get makeSurePrivate => '閲覧する前に、プライベートな場所にいることを確認してください。';

  @override
  String get pleaseTryAgainLater => '後でもう一度試すか、ウォレットをリセットしてください。';

  @override
  String get yourRiddle => 'あなたの謎';

  @override
  String get secretKey => '秘密鍵';

  @override
  String get mnemonicLanguage => 'ニーモニック言語';

  @override
  String get enterMemorablePhrase => '覚えやすいフレーズ、質問、または謎を入力...';

  @override
  String get tipLongUnique => 'ヒント：最大限のセキュリティのために、長くてユニークな謎と秘密鍵を使用してください。';

  @override
  String get yourEnigmaSeedPhrase => 'あなたのEnigmaシードフレーズ';

  @override
  String get continueToSetPin => 'PIN設定に進む';

  @override
  String get noMnemonicGenerated => 'ニーモニックが生成されていません。戻ってもう一度試してください。';

  @override
  String get writeDown24Words =>
      'これら24の単語を順番に書き留め、安全に保管してください。これらの単語があれば誰でも資金にアクセスできます。';

  @override
  String get neverShareSeed => 'シードフレーズを絶対に共有しないでください！';

  @override
  String get passphraseOptional => 'パスフレーズ（任意）';

  @override
  String get advancedBip39Passphrase => '詳細設定：BIP39パスフレーズを追加（任意）';

  @override
  String get enterPassphraseOptional => 'パスフレーズを入力（任意）';

  @override
  String get bip39PassphraseExplanation =>
      'BIP39パスフレーズは完全に異なるウォレットを作成します。使用する場合は必ず覚えておいてください。復元する方法はありません。';

  @override
  String get displayLanguage => '表示言語';

  @override
  String get displayLanguageNote => '表示言語は単語の見た目にのみ影響し、ウォレットの生成方法には影響しません。';

  @override
  String get leaveEmptyStandard => '標準のEnigmaウォレットの場合は空欄にしてください。';

  @override
  String get seedDerivedFromEnglish =>
      'このシードは英語のニーモニックから派生しています。表示言語に関係なく常に同じです。';

  @override
  String get historyTab => '履歴';

  @override
  String get noSigningHistory => '署名履歴はありません';

  @override
  String get transactionSignaturesWillAppear => '取引署名がここに表示されます';

  @override
  String get signed => '署名済み';

  @override
  String get rejectedStatus => '拒否';

  @override
  String get failedStatus => '失敗';

  @override
  String get signingAddress => '署名アドレス';

  @override
  String get statusWord => 'ステータスワード';

  @override
  String get payload => 'ペイロード';

  @override
  String get justNow => 'たった今';

  @override
  String get noAccountSelected => 'アカウントが選択されていません';

  @override
  String get publicKey => '公開鍵';

  @override
  String get bleAccess => 'BLEアクセス';

  @override
  String get enabled => '有効';

  @override
  String get disabled => '無効';

  @override
  String get blePeripheral => 'BLEペリフェラル';

  @override
  String get connected => '接続済み';

  @override
  String get broadcasting => 'ブロードキャスト中';

  @override
  String get advertisingAs => 'Ledger Nano Xとしてアドバタイズ中。接続を待っています。';

  @override
  String get startBleBroadcasting => 'BLEブロードキャストを開始して署名リクエストを受け付けます。';

  @override
  String get noBleActivity => 'まだBLEアクティビティはありません';

  @override
  String get dataHex => 'データHEX';

  @override
  String get dataSize => 'データサイズ';

  @override
  String get decodedAction => 'デコードされたアクション';

  @override
  String get eip712TypedData => 'EIP-712型付きデータ';

  @override
  String get domainHash => 'ドメインハッシュ';

  @override
  String get structHash => '構造体ハッシュ';

  @override
  String get messageToSign => '署名するメッセージ';

  @override
  String get gasLimit => 'ガスリミット';

  @override
  String get gasPrice => 'ガス価格';

  @override
  String get maxFee => '最大手数料';

  @override
  String get priorityFee => '優先手数料';

  @override
  String get nonce => 'ノンス';

  @override
  String get chainId => 'チェーンID';

  @override
  String showAll(Object bytes) {
    return 'すべて表示（$bytes バイト）';
  }

  @override
  String get showLess => '折りたたむ';

  @override
  String get rawSignature => '生の署名';

  @override
  String get signatureResult => '署名結果';

  @override
  String get amount => '金額';

  @override
  String get spender => '支出者';

  @override
  String get methodLabel => 'メソッド';

  @override
  String get messageLabel => 'メッセージ';
}
