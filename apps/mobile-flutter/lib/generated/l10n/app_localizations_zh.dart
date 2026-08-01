// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'Iron Vault';

  @override
  String get welcomeTitle => 'Iron Vault';

  @override
  String get welcomeSubtitle => '兼容 Ledger Nano X 的硬件钱包';

  @override
  String get createWallet => '创建新钱包';

  @override
  String get importWallet => '导入钱包';

  @override
  String get enigmaWallet => 'Enigma 设置';

  @override
  String get unlockTitle => '输入 PIN';

  @override
  String get unlockSubtitle => '输入 6 位 PIN 解锁';

  @override
  String get attemptsRemaining => '剩余尝试次数';

  @override
  String get lockedOut => '已锁定';

  @override
  String get resetWallet => '重置钱包';

  @override
  String get entropyTitle => '收集随机数';

  @override
  String get entropyInstruction => '点击屏幕任意位置收集随机数';

  @override
  String get entropyProgress => '次触摸';

  @override
  String get generateMnemonicTitle => '您的恢复短语';

  @override
  String get generateMnemonicWarning =>
      '按顺序记录这 12 个单词。不要与任何人分享。任何拥有这些单词的人都可以访问您的资金。';

  @override
  String get iveWrittenItDown => '我已记录';

  @override
  String get continueButton => '继续';

  @override
  String get verifyMnemonicTitle => '验证恢复短语';

  @override
  String verifyWordPosition(Object position) {
    return '选择第 $position 个单词';
  }

  @override
  String get importMnemonicTitle => '导入钱包';

  @override
  String get importMnemonicHint => '输入 12 个恢复短语单词，用空格分隔';

  @override
  String get pasteFromClipboard => '粘贴';

  @override
  String wordsCount(Object count) {
    return '$count / 12 个单词';
  }

  @override
  String get validMnemonic => '有效的恢复短语';

  @override
  String get invalidMnemonic => '无效的恢复短语';

  @override
  String get import => '导入';

  @override
  String get setPinTitle => '创建 PIN';

  @override
  String get setPinSubtitle => '输入 6 位 PIN';

  @override
  String get confirmPin => '确认 PIN';

  @override
  String get confirmPinSubtitle => '确认您的 6 位 PIN';

  @override
  String get pinMismatch => 'PIN 不匹配，请重试';

  @override
  String get changePinTitle => '修改 PIN';

  @override
  String get enterOldPin => '输入旧 PIN';

  @override
  String get enterNewPin => '输入新 PIN';

  @override
  String get enterNewPinSubtitle => '输入新的 6 位 PIN';

  @override
  String get confirmNewPin => '确认新 PIN';

  @override
  String get confirmNewPinSubtitle => '确认您的新 6 位 PIN';

  @override
  String get incorrectPin => 'PIN 不正确';

  @override
  String get cancel => '取消';

  @override
  String get vaultTitle => '钱包';

  @override
  String get noAccounts => '尚无账户';

  @override
  String get settings => '设置';

  @override
  String get backupSeed => '备份助记词';

  @override
  String get accountDetail => '账户详情';

  @override
  String get address => '地址';

  @override
  String get copyAddress => '复制地址';

  @override
  String get derivationPath => '派生路径';

  @override
  String get bleEnabled => 'BLE 已启用';

  @override
  String get signTransaction => '签名交易';

  @override
  String get transaction => '交易签名';

  @override
  String get transactionDetails => '交易详情';

  @override
  String get from => '发送方';

  @override
  String get to => '接收方';

  @override
  String get value => '金额';

  @override
  String get networkFee => '网络费用';

  @override
  String get chain => '链';

  @override
  String get approve => '批准';

  @override
  String get reject => '拒绝';

  @override
  String get transactionApproved => '交易已签名';

  @override
  String get transactionRejected => '交易已拒绝';

  @override
  String get settingsTitle => '设置';

  @override
  String get appearance => '外观';

  @override
  String get theme => '主题';

  @override
  String get darkMode => '深色模式';

  @override
  String get lightMode => '浅色模式';

  @override
  String get language => '语言';

  @override
  String get security => '安全';

  @override
  String get changePin => '修改 PIN';

  @override
  String get resetWalletTitle => '重置钱包';

  @override
  String get resetWalletConfirm => '确定要删除所有钱包数据吗？此操作不可撤销。';

  @override
  String get reset => '重置';

  @override
  String get bleName => 'BLE 名称';

  @override
  String get bleNameHint => '输入 BLE 设备名称';

  @override
  String get about => '关于';

  @override
  String get version => '版本';

  @override
  String get backupSeedTitle => '备份助记词';

  @override
  String get backupSeedWarning => '永远不要分享您的助记词！任何人拥有这些单词都可以访问您的资金。';

  @override
  String get copyToClipboard => '复制到剪贴板';

  @override
  String get copiedToClipboard => '已复制到剪贴板！';

  @override
  String get enigmaTitle => 'Enigma 钱包';

  @override
  String get enigmaDescription => '通过难忘的短语和密钥确定性生成钱包。';

  @override
  String get enterRiddle => '输入谜语';

  @override
  String get enterSecretKey => '输入密钥';

  @override
  String get generateWallet => '生成钱包';

  @override
  String get enigmaMnemonicTitle => 'Enigma 恢复短语';

  @override
  String get enigmaMnemonicWarning => '保存这 24 个单词。您可以随时用谜语和密钥重新生成它们。';

  @override
  String get processing => '处理中';

  @override
  String get done => '完成';

  @override
  String get error => '错误';

  @override
  String get success => '成功';

  @override
  String get addAccount => '添加账户';

  @override
  String get startBle => '启动 BLE';

  @override
  String get stopBle => '停止 BLE';

  @override
  String get bleLogs => 'BLE 日志';

  @override
  String get fingerprint => '指纹';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageChinese => '中文';

  @override
  String get languageJapanese => '日本語';

  @override
  String get languageKorean => '한국어';

  @override
  String get bluetooth => '蓝牙';

  @override
  String get deleteAllWalletData => '删除此设备上的所有钱包数据';

  @override
  String get ledgerCompatible => '兼容 Ledger Nano X';

  @override
  String get forgotPin => '忘记 PIN？';

  @override
  String get unexpectedError => '意外错误，请重试。';

  @override
  String get generateWithTouch => '通过触摸生成新的助记词';

  @override
  String get restoreFromSeed => '从助记词恢复钱包';

  @override
  String get advancedEnigma => '通过 Enigma 生成钱包';

  @override
  String get tapRandomly => '在屏幕上随机点击以收集熵值来生成恢复短语。';

  @override
  String get retry => '重试';

  @override
  String get correct => '正确！';

  @override
  String get incorrectTryAgain => '错误 — 再试一次';

  @override
  String get whichWord => '您写下了哪个单词？';

  @override
  String get enterPinToReveal => '输入 PIN 以显示助记词';

  @override
  String get yourSeedPhrase => '您的助记词';

  @override
  String get writeDown12Words => '按顺序记录这 12 个单词并安全保管。';

  @override
  String get makeSurePrivate => '请确保您在私密环境中查看。';

  @override
  String get pleaseTryAgainLater => '请稍后重试或重置钱包。';

  @override
  String get yourRiddle => '您的谜语';

  @override
  String get secretKey => '密钥';

  @override
  String get mnemonicLanguage => '助记词语言';

  @override
  String get enterMemorablePhrase => '输入一个难忘的短语、问题或谜语...';

  @override
  String get tipLongUnique => '提示：使用长且独特的谜语和密钥以获取最大安全性。';

  @override
  String get yourEnigmaSeedPhrase => '您的 Enigma 种子短语';

  @override
  String get continueToSetPin => '继续设置 PIN';

  @override
  String get noMnemonicGenerated => '未生成助记词。请返回重试。';

  @override
  String get writeDown24Words => '按顺序记录这 24 个单词并安全保管。任何人拥有这些单词都可访问您的资金。';

  @override
  String get neverShareSeed => '永远不要分享您的助记词！';

  @override
  String get passphraseOptional => '密码短语（可选）';

  @override
  String get advancedBip39Passphrase => '高级：添加 BIP39 密码短语（可选）';

  @override
  String get enterPassphraseOptional => '输入密码短语（可选）';

  @override
  String get bip39PassphraseExplanation =>
      'BIP39 密码短语可以创建一个完全不同的钱包。如果使用，您必须记住它——无法恢复。';

  @override
  String get displayLanguage => '显示语言';

  @override
  String get displayLanguageNote => '显示语言仅影响单词的显示方式，不影响钱包的生成方式。';

  @override
  String get leaveEmptyStandard => '留空以使用标准 Enigma 钱包。';

  @override
  String get seedDerivedFromEnglish => '该种子源自英文助记词。无论显示语言如何，它始终相同。';

  @override
  String get historyTab => '历史';

  @override
  String get noSigningHistory => '暂无签名历史';

  @override
  String get transactionSignaturesWillAppear => '交易签名将显示在此处';

  @override
  String get signed => '已签名';

  @override
  String get rejectedStatus => '已拒绝';

  @override
  String get failedStatus => '失败';

  @override
  String get signingAddress => '签名地址';

  @override
  String get statusWord => '状态字';

  @override
  String get payload => '负载';

  @override
  String get justNow => '刚刚';

  @override
  String get noAccountSelected => '未选择账户';

  @override
  String get publicKey => '公钥';

  @override
  String get bleAccess => 'BLE 访问';

  @override
  String get enabled => '已启用';

  @override
  String get disabled => '已禁用';

  @override
  String get blePeripheral => 'BLE 外设';

  @override
  String get connected => '已连接';

  @override
  String get broadcasting => '广播中';

  @override
  String get advertisingAs => '正在以 Ledger Nano X 身份广播，等待连接。';

  @override
  String get startBleBroadcasting => '启动 BLE 广播以接受签名请求。';

  @override
  String get noBleActivity => '暂无 BLE 活动';

  @override
  String get dataHex => '数据十六进制';

  @override
  String get dataSize => '数据大小';

  @override
  String get decodedAction => '解码操作';

  @override
  String get eip712TypedData => 'EIP-712 类型化数据';

  @override
  String get domainHash => '域哈希';

  @override
  String get structHash => '结构哈希';

  @override
  String get messageToSign => '待签名消息';

  @override
  String get gasLimit => 'Gas 限制';

  @override
  String get gasPrice => 'Gas 价格';

  @override
  String get maxFee => '最大费用';

  @override
  String get priorityFee => '优先费用';

  @override
  String get nonce => 'Nonce';

  @override
  String get chainId => '链 ID';

  @override
  String showAll(Object bytes) {
    return '显示全部（$bytes 字节）';
  }

  @override
  String get showLess => '收起';

  @override
  String get rawSignature => '原始签名';

  @override
  String get signatureResult => '签名结果';

  @override
  String get amount => '数量';

  @override
  String get spender => '支出方';

  @override
  String get methodLabel => '方法';

  @override
  String get messageLabel => '消息';
}
