// ── Chain identifiers ──────────────────────────────────────────────

export type ChainId = 'ethereum' | 'solana' | 'bitcoin' | 'tron' | 'sui';

// ── CLA (Class) bytes ──────────────────────────────────────────────

export const CLA = {
  /** Generic Ledger application command */
  APP: 0xe0,
  /** Global / OS-level command */
  GLOBAL: 0xb0,
  /** Bitcoin New App (CLA E1) */
  BTC: 0xe1,
  /** Tron App (CLA 0x14) */
  TRON: 0x14,
  /** Sui App (CLA 0x07) */
  SUI: 0x07,
  /** Bitcoin CONTINUE protocol */
  CONTINUE: 0xf8,
} as const;

// ── INS (Instruction) codes ────────────────────────────────────────
// Organized by chain / app domain.

export const INS = {
  // ── OS / System ──────────────────────────────────────────────────
  GET_VERSION:           0x01,   // CLA E0 — also B0 01 GET_APP_AND_VERSION
  GET_APP_AND_VERSION:   0x01,   // CLA B0
  GET_DEVICE_INFO:       0xe2,   // CLA E0
  OPEN_APP:              0xd8,   // CLA E0
  QUIT_APP:              0xa7,   // CLA E0

  // ── Ethereum (CLA E0) ────────────────────────────────────────────
  ETH_GET_ADDRESS:         0x02,
  ETH_SIGN_TX:             0x04,
  ETH_GET_APP_CONFIG:      0x06,
  ETH_SIGN_PERSONAL_MSG:   0x08,
  ETH_PROVIDE_ERC20:       0x0a,
  ETH_SIGN_EIP712:         0x0c,
  ETH_SIGN_TX_PLUGIN:      0x0e,  // stub
  ETH_PROVIDE_TRUSTED_NAME:0x10,  // stub
  ETH_SIGN_EIP712_FILTERED:0x12,  // same as 0x0c
  ETH_PROVIDE_NFT:         0x14,
  ETH_SET_PLUGIN:          0x16,  // stub
  ETH_SIGN_TX_BATCH:       0x18,  // delegates to 0x04
  ETH_PROVIDE_CONTRACT:    0x1a,  // stub
  ETH_GET_CHALLENGE:       0x1c,
  ETH_SIGN_EIP712_CHUNKS:  0x1e,
  ETH_PROVIDE_DELEGATE:    0x20,  // stub
  ETH_PROVIDE_DOMAIN:      0x22,
  ETH_REVOKE_DOMAIN:       0x24,  // stub
  ETH_GET_BLIND_SIGN:      0x26,
  ETH_GET_PUBLIC_KEY:      0x28,  // alias for 0x02
  ETH_SIGN_TYPED_DATA:     0x2a,

  // ── Solana (CLA E0, app=Solana) ──────────────────────────────────
  SOL_GET_APP_CONFIG:      0x01,
  SOL_SIGN_OFFLINE:        0x03,
  SOL_SIGN_MSG:            0x04,
  SOL_GET_PUBKEY:          0x05,
  SOL_SIGN_TX:             0x06,
  SOL_GET_ADDRESS:         0x07,
  SOL_GET_APP_CONFIG_V2:    0x08,

  // ── Bitcoin (CLA E1) ─────────────────────────────────────────────
  BTC_GET_XPUB:            0x00,
  BTC_REGISTER_WALLET:     0x02,
  BTC_GET_WALLET_ADDR:     0x03,
  BTC_SIGN_PSBT:           0x04,
  BTC_GET_MASTER_FP:       0x05,
  BTC_SIGN_MESSAGE:        0x10,
  BTC_CONTINUE:            0x01,   // CLA F8

  // ── Tron (CLA 0x14) ──────────────────────────────────────────────
  TRON_GET_APP_CONFIG:     0x01,
  TRON_GET_PUBKEY:         0x02,
  TRON_SIGN_TX:            0x04,
  TRON_SIGN_PERSONAL:      0x08,

  // ── Sui (CLA 0x07) ───────────────────────────────────────────────
  SUI_GET_APP_CONFIG:      0x01,
  SUI_GET_PUBKEY:          0x02,
  SUI_SIGN_TX:             0x03,
  SUI_SIGN_PERSONAL:       0x04,
} as const;

// ── P1 (Parameter 1) constants ─────────────────────────────────────

export const P1 = {
  /** First chunk — contains BIP32 path */
  FIRST_CHUNK:  0x00,
  /** Continuation chunk — more data follows */
  MORE_CHUNKS:  0x80,
  /** Final chunk — end of data */
  LAST_CHUNK:   0x90,
  /** ETH sign mode: hash (default) */
  SIGN_HASH:    0x00,
} as const;

// ── Status Words ───────────────────────────────────────────────────

export const SW = {
  /** Success */
  OK:                      '9000',
  /** User rejected / conditions not satisfied */
  DENY:                    '6985',
  /** Wrong P1 or P2 parameter */
  WRONG_P1P2:              '6A86',
  /** Wrong data length */
  WRONG_DATA_LENGTH:       '6A87',
  /** INS not supported */
  INS_NOT_SUPPORTED:       '6D00',
  /** CLA not supported */
  CLA_NOT_SUPPORTED:       '6E00',
  /** Invalid data (e.g. unknown app name) */
  INVALID_DATA:            '6A80',
  /** BTC CONTINUE protocol — command interrupted, client action needed */
  INTERRUPTED_EXECUTION:   'E000',
  /** Internal error */
  INTERNAL_ERROR:          '6F00',
} as const;

// ── Human-readable SW descriptions ─────────────────────────────────

export const SW_DESCRIPTIONS: Record<string, string> = {
  [SW.OK]:                 'Success',
  [SW.DENY]:               'Rejected by user',
  [SW.WRONG_P1P2]:         'Incorrect P1/P2 parameter',
  [SW.WRONG_DATA_LENGTH]:  'Wrong data length',
  [SW.INS_NOT_SUPPORTED]:  'Instruction not supported',
  [SW.CLA_NOT_SUPPORTED]:  'Class not supported',
  [SW.INVALID_DATA]:       'Invalid data',
  [SW.INTERRUPTED_EXECUTION]: 'Command interrupted — CONTINUE required',
  [SW.INTERNAL_ERROR]:     'Internal error',
};

// ── Chain metadata ─────────────────────────────────────────────────

export const CHAIN_INFO: Record<ChainId, {
  name: string;
  appName: string;
  cla: number;
  insRange: [number, number][];
}> = {
  ethereum: {
    name: 'Ethereum',
    appName: 'Ethereum',
    cla: CLA.APP,
    insRange: [[0x02, 0x2a]],
  },
  solana: {
    name: 'Solana',
    appName: 'Solana',
    cla: CLA.APP,
    insRange: [[0x01, 0x08]],
  },
  bitcoin: {
    name: 'Bitcoin',
    appName: 'Bitcoin',
    cla: CLA.BTC,
    insRange: [[0x00, 0x05], [0x10, 0x10]],
  },
  tron: {
    name: 'Tron',
    appName: 'Tron',
    cla: CLA.TRON,
    insRange: [[0x01, 0x08]],
  },
  sui: {
    name: 'Sui',
    appName: 'Sui',
    cla: CLA.SUI,
    insRange: [[0x01, 0x04]],
  },
};
