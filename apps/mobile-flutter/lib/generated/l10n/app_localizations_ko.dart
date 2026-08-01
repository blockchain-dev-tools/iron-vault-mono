// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Korean (`ko`).
class AppLocalizationsKo extends AppLocalizations {
  AppLocalizationsKo([String locale = 'ko']) : super(locale);

  @override
  String get appTitle => 'Iron Vault';

  @override
  String get welcomeTitle => 'Iron Vault';

  @override
  String get welcomeSubtitle => 'Ledger Nano X 호환 하드웨어 지갑';

  @override
  String get createWallet => '새 지갑 만들기';

  @override
  String get importWallet => '지갑 가져오기';

  @override
  String get enigmaWallet => 'Enigma 설정';

  @override
  String get unlockTitle => 'PIN 입력';

  @override
  String get unlockSubtitle => '잠금 해제를 위해 6자리 PIN 입력';

  @override
  String get attemptsRemaining => '남은 시도 횟수';

  @override
  String get lockedOut => '잠김';

  @override
  String get resetWallet => '지갑 초기화';

  @override
  String get entropyTitle => '엔트로피 수집';

  @override
  String get entropyInstruction => '화면 아무 곳이나 터치하여 엔트로피 수집';

  @override
  String get entropyProgress => '터치';

  @override
  String get generateMnemonicTitle => '복구 구문';

  @override
  String get generateMnemonicWarning =>
      '이 12개 단어를 순서대로 적어두세요. 절대 다른 사람과 공유하지 마세요. 이 단어를 가진 사람은 누구나 자금에 접근할 수 있습니다.';

  @override
  String get iveWrittenItDown => '기록했습니다';

  @override
  String get continueButton => '계속';

  @override
  String get verifyMnemonicTitle => '구문 확인';

  @override
  String verifyWordPosition(Object position) {
    return '단어 #$position 선택';
  }

  @override
  String get importMnemonicTitle => '지갑 가져오기';

  @override
  String get importMnemonicHint => '12단어 복구 구문을 공백으로 구분하여 입력';

  @override
  String get pasteFromClipboard => '붙여넣기';

  @override
  String wordsCount(Object count) {
    return '$count / 12 단어';
  }

  @override
  String get validMnemonic => '유효한 복구 구문';

  @override
  String get invalidMnemonic => '유효하지 않은 복구 구문';

  @override
  String get import => '가져오기';

  @override
  String get setPinTitle => 'PIN 생성';

  @override
  String get setPinSubtitle => '6자리 PIN 입력';

  @override
  String get confirmPin => 'PIN 확인';

  @override
  String get confirmPinSubtitle => '6자리 PIN 재입력';

  @override
  String get pinMismatch => 'PIN이 일치하지 않습니다. 다시 시도하세요.';

  @override
  String get changePinTitle => 'PIN 변경';

  @override
  String get enterOldPin => '현재 PIN 입력';

  @override
  String get enterNewPin => '새 PIN 입력';

  @override
  String get enterNewPinSubtitle => '새 6자리 PIN 입력';

  @override
  String get confirmNewPin => '새 PIN 확인';

  @override
  String get confirmNewPinSubtitle => '새 6자리 PIN 재입력';

  @override
  String get incorrectPin => '잘못된 PIN';

  @override
  String get cancel => '취소';

  @override
  String get vaultTitle => '보관함';

  @override
  String get noAccounts => '계정이 없습니다';

  @override
  String get settings => '설정';

  @override
  String get backupSeed => '시드 백업';

  @override
  String get accountDetail => '계정 세부정보';

  @override
  String get address => '주소';

  @override
  String get copyAddress => '주소 복사';

  @override
  String get derivationPath => '파생 경로';

  @override
  String get bleEnabled => 'BLE 활성화';

  @override
  String get signTransaction => '거래 서명';

  @override
  String get transaction => '거래 서명';

  @override
  String get transactionDetails => '거래 세부정보';

  @override
  String get from => '보내는 주소';

  @override
  String get to => '받는 주소';

  @override
  String get value => '금액';

  @override
  String get networkFee => '네트워크 수수료';

  @override
  String get chain => '체인';

  @override
  String get approve => '승인';

  @override
  String get reject => '거부';

  @override
  String get transactionApproved => '거래가 서명되었습니다';

  @override
  String get transactionRejected => '거래가 거부되었습니다';

  @override
  String get settingsTitle => '설정';

  @override
  String get appearance => '화면';

  @override
  String get theme => '테마';

  @override
  String get darkMode => '다크 모드';

  @override
  String get lightMode => '라이트 모드';

  @override
  String get language => '언어';

  @override
  String get security => '보안';

  @override
  String get changePin => 'PIN 변경';

  @override
  String get resetWalletTitle => '지갑 초기화';

  @override
  String get resetWalletConfirm => '정말로 모든 지갑 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.';

  @override
  String get reset => '초기화';

  @override
  String get bleName => 'BLE 이름';

  @override
  String get bleNameHint => 'BLE 장치 이름 입력';

  @override
  String get about => '정보';

  @override
  String get version => '버전';

  @override
  String get backupSeedTitle => '시드 백업';

  @override
  String get backupSeedWarning =>
      '시드 구문을 절대 공유하지 마세요! 이 단어를 가진 사람은 누구나 자금에 접근할 수 있습니다.';

  @override
  String get copyToClipboard => '클립보드에 복사';

  @override
  String get copiedToClipboard => '클립보드에 복사되었습니다!';

  @override
  String get enigmaTitle => 'Enigma 지갑';

  @override
  String get enigmaDescription => '기억하기 쉬운 문구와 비밀 키로 결정적 지갑을 생성합니다.';

  @override
  String get enterRiddle => '수수께끼 입력';

  @override
  String get enterSecretKey => '비밀 키 입력';

  @override
  String get generateWallet => '지갑 생성';

  @override
  String get enigmaMnemonicTitle => 'Enigma 복구 구문';

  @override
  String get enigmaMnemonicWarning =>
      '이 24개 단어를 저장하세요. 수수께끼와 비밀 키로 언제든지 다시 생성할 수 있습니다.';

  @override
  String get processing => '처리 중';

  @override
  String get done => '완료';

  @override
  String get error => '오류';

  @override
  String get success => '성공';

  @override
  String get addAccount => '계정 추가';

  @override
  String get startBle => 'BLE 시작';

  @override
  String get stopBle => 'BLE 중지';

  @override
  String get bleLogs => 'BLE 로그';

  @override
  String get fingerprint => '지문';

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
  String get deleteAllWalletData => '이 기기에서 모든 지갑 데이터 삭제';

  @override
  String get ledgerCompatible => 'Ledger Nano X 호환';

  @override
  String get forgotPin => 'PIN을 잊으셨나요?';

  @override
  String get unexpectedError => '예기치 않은 오류가 발생했습니다. 다시 시도하세요.';

  @override
  String get generateWithTouch => '터치 엔트로피로 새 시드 구문 생성';

  @override
  String get restoreFromSeed => '시드 구문에서 지갑 복원';

  @override
  String get advancedEnigma => 'Enigma를 통한 고급 엔트로피 생성';

  @override
  String get tapRandomly => '화면을 무작위로 터치하여 복구 구문을 위한 엔트로피를 수집하세요.';

  @override
  String get retry => '다시 시도';

  @override
  String get correct => '정답!';

  @override
  String get incorrectTryAgain => '오답 — 다시 시도하세요';

  @override
  String get whichWord => '어떤 단어를 기록했나요?';

  @override
  String get enterPinToReveal => '시드 구문을 보려면 PIN을 입력하세요';

  @override
  String get yourSeedPhrase => '내 시드 구문';

  @override
  String get writeDown12Words => '이 12개 단어를 순서대로 적고 안전하게 보관하세요.';

  @override
  String get makeSurePrivate => '확인하기 전에 개인적인 공간에 있는지 확인하세요.';

  @override
  String get pleaseTryAgainLater => '나중에 다시 시도하거나 지갑을 초기화하세요.';

  @override
  String get yourRiddle => '내 수수께끼';

  @override
  String get secretKey => '비밀 키';

  @override
  String get mnemonicLanguage => '니모닉 언어';

  @override
  String get enterMemorablePhrase => '기억에 남는 문구, 질문 또는 수수께끼를 입력하세요...';

  @override
  String get tipLongUnique => '팁: 최대 보안을 위해 길고 고유한 수수께끼와 비밀 키를 사용하세요.';

  @override
  String get yourEnigmaSeedPhrase => '내 Enigma 시드 구문';

  @override
  String get continueToSetPin => 'PIN 설정으로 계속';

  @override
  String get noMnemonicGenerated => '니모닉이 생성되지 않았습니다. 돌아가서 다시 시도하세요.';

  @override
  String get writeDown24Words =>
      '이 24개 단어를 순서대로 적고 안전하게 보관하세요. 이 단어를 가진 사람은 누구나 자금에 접근할 수 있습니다.';

  @override
  String get neverShareSeed => '시드 구문을 절대 공유하지 마세요!';

  @override
  String get passphraseOptional => '암호문 (선택 사항)';

  @override
  String get advancedBip39Passphrase => '고급: BIP39 암호문 추가 (선택 사항)';

  @override
  String get enterPassphraseOptional => '암호문 입력 (선택 사항)';

  @override
  String get bip39PassphraseExplanation =>
      'BIP39 암호문은 완전히 다른 지갑을 생성합니다. 사용하는 경우 반드시 기억해야 합니다 — 복구할 방법이 없습니다.';

  @override
  String get displayLanguage => '표시 언어';

  @override
  String get displayLanguageNote =>
      '표시 언어는 단어의 모양에만 영향을 미치며 지갑 생성 방식에는 영향을 미치지 않습니다.';

  @override
  String get leaveEmptyStandard => '표준 Enigma 지갑의 경우 비워 두세요.';

  @override
  String get seedDerivedFromEnglish =>
      '이 시드는 영어 니모닉에서 파생되었습니다. 표시 언어에 관계없이 항상 동일합니다.';

  @override
  String get historyTab => '기록';

  @override
  String get noSigningHistory => '서명 기록 없음';

  @override
  String get transactionSignaturesWillAppear => '거래 서명이 여기에 표시됩니다';

  @override
  String get signed => '서명됨';

  @override
  String get rejectedStatus => '거부됨';

  @override
  String get failedStatus => '실패';

  @override
  String get signingAddress => '서명 주소';

  @override
  String get statusWord => '상태 워드';

  @override
  String get payload => '페이로드';

  @override
  String get justNow => '방금 전';

  @override
  String get noAccountSelected => '선택된 계정 없음';

  @override
  String get publicKey => '공개 키';

  @override
  String get bleAccess => 'BLE 접근';

  @override
  String get enabled => '활성화됨';

  @override
  String get disabled => '비활성화됨';

  @override
  String get blePeripheral => 'BLE 주변기기';

  @override
  String get connected => '연결됨';

  @override
  String get broadcasting => '브로드캐스팅 중';

  @override
  String get advertisingAs => 'Ledger Nano X로 광고 중입니다. 연결을 기다리고 있습니다.';

  @override
  String get startBleBroadcasting => 'BLE 브로드캐스팅을 시작하여 서명 요청을 수락하세요.';

  @override
  String get noBleActivity => '아직 BLE 활동 없음';

  @override
  String get dataHex => '데이터 HEX';

  @override
  String get dataSize => '데이터 크기';

  @override
  String get decodedAction => '디코딩된 작업';

  @override
  String get eip712TypedData => 'EIP-712 타입 데이터';

  @override
  String get domainHash => '도메인 해시';

  @override
  String get structHash => '구조체 해시';

  @override
  String get messageToSign => '서명할 메시지';

  @override
  String get gasLimit => '가스 한도';

  @override
  String get gasPrice => '가스 가격';

  @override
  String get maxFee => '최대 수수료';

  @override
  String get priorityFee => '우선 수수료';

  @override
  String get nonce => '논스';

  @override
  String get chainId => '체인 ID';

  @override
  String showAll(Object bytes) {
    return '모두 표시 ($bytes 바이트)';
  }

  @override
  String get showLess => '접기';

  @override
  String get rawSignature => '원시 서명';

  @override
  String get signatureResult => '서명 결과';

  @override
  String get amount => '금액';

  @override
  String get spender => '지출자';

  @override
  String get methodLabel => '메서드';

  @override
  String get messageLabel => '메시지';
}
