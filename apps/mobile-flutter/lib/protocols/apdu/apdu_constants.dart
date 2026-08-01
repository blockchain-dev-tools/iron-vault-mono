/// APDU protocol constants — CLA, INS, SW enums matching Ledger APDU spec.
///
/// Ported from iron-vault-mono: `packages/apdu/src/constants.ts`
///
/// CLA byte mapping (per AGENTS.md and mono constants):
///   0xb0 — Ethereum (app-specific)
///   0xe0 — OS commands / Solana / Ethereum
///   0xe1 — Bitcoin (legacy)
///   0xf8 — Bitcoin (extended)
///   0x14 — Tron
///   0x07 — Sui
library;

/// Class byte (CLA) identifiers — determines which chain/service handles
/// the APDU command.
class Cla {
  Cla._();

  /// OS commands + Ethereum + Solana.
  static const int os = 0xe0;

  /// Global / OS-level commands (GET_APP_AND_VERSION etc.).
  static const int global = 0xb0;

  /// Bitcoin (legacy).
  static const int bitcoin = 0xe1;

  /// Bitcoin (extended protocol).
  static const int bitcoinExt = 0xf8;

  /// Tron.
  static const int tron = 0x14;

  /// Sui.
  static const int sui = 0x07;
}

/// Instruction codes (INS) — the specific operation within a CLA namespace.
///
/// These follow the Ledger APDU specification.
class Ins {
  Ins._();

  // ── OS / common instructions (CLA 0xe0) ────────────────────────────────

  /// Returns the firmware / app version string.
  /// CLA E0 → getVersion, CLA B0 → getAppAndVersion (both INS 0x01).
  static const int getVersion = 0x01;

  /// Get Ethereum address (Ledger standard ETH_GET_ADDRESS).
  /// When CLA is NOT 0xE0, returns the app name string.
  static const int getAppName = 0x02;

  /// Get public key for Ethereum or Solana (chain determined by P1/P2).
  /// NOTE: 0x02 also routes to getPublicKey when CLA=0xE0.
  ///
  /// 0x04 is NOT used for getPublicKey — it maps to ETH_SIGN per the
  /// standard Ledger Ethereum APDU protocol. Use 0x02 for address queries.
  static const int getPublicKey = 0x02;

  // ── Ethereum signing instructions (CLA 0xe0 — Ledger standard) ─────────

  /// Sign an Ethereum transaction (RLP-encoded).
  /// Standard Ledger Ethereum app uses INS 0x04 for ETH_SIGN.
  /// INS 0x06 is kept as a backward-compatible alias for custom clients.
  static const int ethSign = 0x04;

  /// Sign an Ethereum transaction (RLP-encoded) — backward compat alias.
  /// Original iron-vault-mono custom INS code; retained so old clients
  /// (custom wallets, internal tests) continue to work.
  static const int signEthTx = 0x06;

  /// Sign an Ethereum personal message (EIP-191).
  static const int signEthPersonalMessage = 0x08;

  // ── Solana instructions (CLA 0xe0, different P1) ───────────────────────

  /// Sign a Solana message (uses off-chain message format).
  static const int signSolMessage = 0x0A;

  // ── EIP-712 typed data signing (CLA 0xe0) ──────────────────────────────

  /// Start EIP-712 typed data signing — send domain/struct data.
  static const int ethSignEip712Domain = 0x0C;

  /// Finish EIP-712 typed data signing — sign the computed hashes.
  static const int ethSignEip712Struct = 0x0D;

  // ── Bitcoin instructions (CLA 0xe1 / 0xf8) ─────────────────────────────

  /// Get Bitcoin wallet public key / xpub.
  static const int btcGetWalletPublicKey = 0x40;

  /// Sign a Bitcoin transaction (PSBT or raw TX input).
  static const int btcSignTx = 0x44;

  // ── Tron instructions (CLA 0x14) ───────────────────────────────────────

  /// Get Tron public key / address.
  static const int tronGetPublicKey = 0x02;

  /// Sign a Tron transaction.
  static const int tronSignTx = 0x04;

  // ── Sui instructions (CLA 0x07) ────────────────────────────────────────

  /// Get Sui public key / address.
  static const int suiGetPublicKey = 0x02;

  /// Sign a Sui transaction.
  static const int suiSignTx = 0x04;
}

/// Status word (SW) — returned as SW1+SW2 in every APDU response.
///
/// Constants represent the combined 16-bit value (sw1 << 8 | sw2).
/// Use [isSuccess] to check for the standard success code.
class Sw {
  Sw._();

  /// Command completed successfully.
  static const int success = 0x9000;

  /// Incorrect P1/P2 parameters.
  static const int incorrectP1P2 = 0x6A86;

  /// Wrong data length (LC mismatch).
  static const int wrongDataLength = 0x6A87;

  /// Instruction code not supported for this CLA.
  static const int insNotSupported = 0x6D00;

  /// Class byte not supported.
  static const int claNotSupported = 0x6E00;

  /// Unknown / generic error.
  static const int unknownError = 0x6F00;

  /// Conditions of use not satisfied (e.g. wallet locked).
  static const int conditionsNotSatisfied = 0x6985;

  /// Security status not satisfied (e.g. PIN not verified).
  static const int securityStatusNotSatisfied = 0x6982;

  /// Wrong data / invalid parameter value.
  static const int wrongData = 0x6A80;

  /// Referenced file or data not found.
  static const int fileNotFound = 0x6A82;

  /// Returns `true` if the status word indicates success.
  static bool isSuccess(int sw) => sw == success;
}
