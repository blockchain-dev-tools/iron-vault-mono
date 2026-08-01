/// Record of a completed signing operation — persisted in-memory
/// for the History screen.
///
/// Created whenever a pending sign request is approved or rejected.
/// Approved records carry the signature result; rejected records
/// have null [signatureHex].
class SignatureRecord {
  /// When the signing was approved or rejected.
  final DateTime timestamp;

  /// Chain identifier: 'ethereum', 'solana', 'bitcoin', 'tron', 'sui',
  /// 'personal_msg', 'eip712'.
  final String chain;

  /// Derivation path string (e.g. "m/44'/60'/0'/0/0").
  final String derivationPath;

  /// Signing address derived from seed + path.
  final String signingAddress;

  /// Hex-encoded payload that was signed.
  final String payloadHex;

  /// Parsed transaction data (from Rust SDK), if available.
  final Map<String, dynamic>? parsedData;

  /// Whether the user approved the request.
  final bool isApproved;

  /// Hex-encoded signature bytes (null if rejected or failed).
  final String? signatureHex;

  /// Combined 16-bit status word (0x9000 = success).
  final int statusWord;

  /// Whether the signing completed successfully (SW = 0x9000).
  bool get isSuccess => statusWord == 0x9000;

  const SignatureRecord({
    required this.timestamp,
    required this.chain,
    required this.derivationPath,
    required this.signingAddress,
    required this.payloadHex,
    this.parsedData,
    required this.isApproved,
    this.signatureHex,
    required this.statusWord,
  });
}
