import { parseApdu, bytesToHex } from './parser';
import { SW, SW_DESCRIPTIONS, INS } from './constants';
import { type ApduPreset, APDU_PRESETS } from './presets';

export interface FieldInfo {
  hex: string;
  value: number;
  meaning: string;
}

export interface InsField extends FieldInfo {
  name: string;
}

export interface DataField {
  hex: string;
  ascii: string;
  description: string;
}

export interface ApduFieldBreakdown {
  raw: string;
  cla: FieldInfo;
  ins: InsField;
  p1: FieldInfo;
  p2: FieldInfo;
  lc: { hex: string; value: number };
  data: DataField;
  matchedPreset?: ApduPreset;
}

export interface StatusWordInfo {
  hex: string;
  name: string;
  meaning: string;
}

type ClaInsKey = string; // `${cla}_${ins}`

const INS_NAMES: Record<ClaInsKey, string> = {
  // Global / B0
  [`0xe0_0x${INS.GET_VERSION.toString(16).padStart(2, '0')}`]: 'GET_VERSION',
  [`0xe0_0x${INS.GET_DEVICE_INFO.toString(16).padStart(2, '0')}`]: 'GET_DEVICE_INFO',
  [`0xe0_0x${INS.OPEN_APP.toString(16).padStart(2, '0')}`]: 'OPEN_APP',
  [`0xe0_0x${INS.QUIT_APP.toString(16).padStart(2, '0')}`]: 'QUIT_APP',
  [`0xb0_0x${INS.GET_APP_AND_VERSION.toString(16).padStart(2, '0')}`]: 'GET_APP_AND_VERSION',

  // Ethereum (CLA E0)
  [`0xe0_0x${INS.ETH_GET_ADDRESS.toString(16).padStart(2, '0')}`]: 'GET_ETH_ADDRESS',
  [`0xe0_0x${INS.ETH_SIGN_TX.toString(16).padStart(2, '0')}`]: 'SIGN_ETH_TX',
  [`0xe0_0x${INS.ETH_GET_APP_CONFIG.toString(16).padStart(2, '0')}`]: 'GET_APP_CONFIGURATION',
  [`0xe0_0x${INS.ETH_SIGN_PERSONAL_MSG.toString(16).padStart(2, '0')}`]: 'SIGN_PERSONAL_MESSAGE',
  [`0xe0_0x${INS.ETH_PROVIDE_ERC20.toString(16).padStart(2, '0')}`]: 'PROVIDE_ERC20_TOKEN_INFO',
  [`0xe0_0x${INS.ETH_SIGN_EIP712.toString(16).padStart(2, '0')}`]: 'SIGN_EIP_712',
  [`0xe0_0x${INS.ETH_PROVIDE_NFT.toString(16).padStart(2, '0')}`]: 'PROVIDE_NFT',
  [`0xe0_0x${INS.ETH_GET_CHALLENGE.toString(16).padStart(2, '0')}`]: 'GET_CHALLENGE',
  [`0xe0_0x${INS.ETH_PROVIDE_DOMAIN.toString(16).padStart(2, '0')}`]: 'PROVIDE_DOMAIN_NAME',
  [`0xe0_0x${INS.ETH_GET_PUBLIC_KEY.toString(16).padStart(2, '0')}`]: 'GET_PUBLIC_KEY',

  // Solana (CLA E0, app=Solana — same CLA/INS values as ETH but different routing)
  [`0xe0_0x${INS.SOL_GET_PUBKEY.toString(16).padStart(2, '0')}`]: 'GET_SOLANA_PUBKEY',
  [`0xe0_0x${INS.SOL_SIGN_MSG.toString(16).padStart(2, '0')}`]: 'SIGN_SOLANA',
  [`0xe0_0x${INS.SOL_SIGN_TX.toString(16).padStart(2, '0')}`]: 'SIGN_SOLANA_TX',
  [`0xe0_0x${INS.SOL_GET_ADDRESS.toString(16).padStart(2, '0')}`]: 'GET_SOLANA_ADDRESS',

  // Bitcoin (CLA E1)
  [`0xe1_0x${INS.BTC_GET_XPUB.toString(16).padStart(2, '0')}`]: 'GET_EXTENDED_PUBKEY',
  [`0xe1_0x${INS.BTC_REGISTER_WALLET.toString(16).padStart(2, '0')}`]: 'REGISTER_WALLET',
  [`0xe1_0x${INS.BTC_GET_WALLET_ADDR.toString(16).padStart(2, '0')}`]: 'GET_WALLET_ADDRESS',
  [`0xe1_0x${INS.BTC_SIGN_PSBT.toString(16).padStart(2, '0')}`]: 'SIGN_PSBT',
  [`0xe1_0x${INS.BTC_SIGN_MESSAGE.toString(16).padStart(2, '0')}`]: 'SIGN_BTC_MESSAGE',

  // Tron (CLA 0x14)
  [`0x14_0x${INS.TRON_GET_PUBKEY.toString(16).padStart(2, '0')}`]: 'GET_TRON_PUBKEY',
  [`0x14_0x${INS.TRON_SIGN_TX.toString(16).padStart(2, '0')}`]: 'SIGN_TRON_TX',
  [`0x14_0x${INS.TRON_SIGN_PERSONAL.toString(16).padStart(2, '0')}`]: 'SIGN_TRON_PERSONAL',

  // Sui (CLA 0x07)
  [`0x07_0x${INS.SUI_GET_PUBKEY.toString(16).padStart(2, '0')}`]: 'GET_SUI_PUBKEY',
  [`0x07_0x${INS.SUI_SIGN_TX.toString(16).padStart(2, '0')}`]: 'SIGN_SUI_TX',
  [`0x07_0x${INS.SUI_SIGN_PERSONAL.toString(16).padStart(2, '0')}`]: 'SIGN_SUI_PERSONAL',
};

function claMeaning(cla: number): string {
  switch (cla) {
    case 0xe0: return 'Application command (Ledger app)';
    case 0xb0: return 'Global / OS-level command';
    case 0xe1: return 'Bitcoin New App';
    case 0x14: return 'Tron App';
    case 0x07: return 'Sui App';
    case 0xf8: return 'Bitcoin CONTINUE protocol';
    default:   return 'Unknown class';
  }
}

export function explainApdu(hex: string): ApduFieldBreakdown {
  const cleaned = hex.replace(/\s+/g, '');
  const parsed = parseApdu(cleaned);

  const insName = INS_NAMES[parsed.ins] ?? 'UNKNOWN';
  const dataHex = parsed.data.length > 0 ? bytesToHex(parsed.data) : '(empty)';
  let ascii = '';
  for (let i = 0; i < parsed.data.length; i++) {
    const b = parsed.data[i];
    ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
  }

  const matchedPreset = APDU_PRESETS.find(p => p.hex.replace(/\s+/g, '') === cleaned);

  return {
    raw: cleaned,
    cla: {
      hex: `0x${parsed.cla.toString(16).padStart(2, '0').toUpperCase()}`,
      value: parsed.cla,
      meaning: claMeaning(parsed.cla),
    },
    ins: {
      hex: `0x${parsed.ins.toString(16).padStart(2, '0').toUpperCase()}`,
      value: parsed.ins,
      name: insName,
      meaning: `Instruction: ${insName}`,
    },
    p1: {
      hex: `0x${parsed.p1.toString(16).padStart(2, '0').toUpperCase()}`,
      value: parsed.p1,
      meaning: parsed.p1 === 0x00 ? 'First chunk / default' : parsed.p1 === 0x80 ? 'Continuation chunk' : `Parameter: ${parsed.p1}`,
    },
    p2: {
      hex: `0x${parsed.p2.toString(16).padStart(2, '0').toUpperCase()}`,
      value: parsed.p2,
      meaning: parsed.p2 === 0x00 ? 'Not used' : `Parameter: ${parsed.p2}`,
    },
    lc: {
      hex: parsed.data.length.toString(16).padStart(2, '0').toUpperCase(),
      value: parsed.data.length,
    },
    data: {
      hex: dataHex,
      ascii,
      description: parsed.data.length === 0 ? 'No data' : `${parsed.data.length} bytes`,
    },
    matchedPreset,
  };
}

export function decodeStatusWord(sw: string): StatusWordInfo {
  const upper = sw.toUpperCase().padStart(4, '0');
  return {
    hex: `0x${upper}`,
    name: SW_DESCRIPTIONS[upper] ?? 'Unknown',
    meaning: SW_DESCRIPTIONS[upper] ?? 'Undefined status word',
  };
}

export function getInsName(cla: number, ins: number): string {
  if (cla === 0xe0 && ins === 0xd8) return 'OPEN_APP';
  if (cla === 0xe0 && ins === 0xa7) return 'QUIT_APP';
  if (cla === 0xb0 && ins === 0x01) return 'GET_APP_AND_VERSION';
  if (cla === 0xe0 && ins === 0xe2) return 'GET_DEVICE_INFO';
  const key = `0x${cla.toString(16)}_0x${ins.toString(16).padStart(2, '0')}` as ClaInsKey;
  return INS_NAMES[key] ?? 'UNKNOWN';
}
