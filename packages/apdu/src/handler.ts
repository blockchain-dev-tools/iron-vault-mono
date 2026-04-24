import { parseApdu, bytesToHex } from './parser';
import { handleOs, buildGetAppAndVersion } from './handlers/os';
import { handleEth } from './handlers/eth';
import { handleSol } from './handlers/sol';
import { handleBtc } from './handlers/btc';
import { handleTron } from './handlers/tron';
import { handleSui } from './handlers/sui';
import {
  ulog, resetSharedState,
  clearSignSessions,
  type SignRequestData,
} from './handlers/shared';
import * as shared from './handlers/shared';

export { clearSignSessions, resetSharedState };
export { getLastToken, getLastNft, getLastDomain } from './handlers/shared';

// ── Public API (setters) ──────────────────────────────────────────────────────

const VALID_APPS = new Set(['Ethereum', 'Solana', 'Bitcoin', 'Tron', 'Sui', 'BOLOS']);

export function setCurrentApp(app: string) {
  if (!VALID_APPS.has(app)) {
    ulog(`[APP] setCurrentApp rejected: unknown app "${app}"`);
    return;
  }
  shared.S.currentApp = app;
  ulog(`[APP] switched to ${app}`);
}

export function setLogFn(fn: (msg: string) => void) {
  shared.S._uiLog = fn;
}

export function setMnemonicProvider(fn: () => Promise<string | null>) {
  shared.S._mnemonicProvider = fn;
  // Invalidate seed cache when provider changes
  shared.S._seedCache = null;
}

export function setSignRequestHandler(fn: ((req: SignRequestData) => Promise<string>) | null) {
  shared.S._signHandler = fn;
}

export type { SignRequestData } from './handlers/shared';

// ── Main APDU dispatcher ──────────────────────────────────────────────────────

export async function handleApdu(hexApdu: string): Promise<string> {
  const { cla, ins, p1, p2, data } = parseApdu(hexApdu);

  try {
    // ── OS layer (always checked first, regardless of currentApp) ─────────────
    // OPEN_APP — E0 D8
    if (cla === 0xe0 && ins === 0xd8) {
      if (data.length > 0) {
        const name = new TextDecoder().decode(data);
        const VALID_APPS = new Set(['Ethereum', 'Solana', 'Bitcoin', 'Tron', 'Sui', 'BOLOS']);
        if (!VALID_APPS.has(name)) {
          ulog(`[OS] OPEN_APP rejected: unknown app "${name}"`);
          return '6a80';
        }
        shared.S.currentApp = name;
      }
      ulog(`[OS] OPEN_APP → ${shared.S.currentApp}`);
      return '9000';
    }
    // QUIT_APP — E0 A7
    if (cla === 0xe0 && ins === 0xa7) {
      shared.S.currentApp = 'BOLOS';
      ulog('[OS] QUIT_APP → BOLOS');
      return '9000';
    }
    // GET_VERSION (E0 01) + GET_APP_AND_VERSION (B0 01) + GET_DEVICE_INFO (E0 E2)
    const osResult = await handleOs(cla, ins, p1, p2, data);
    if (osResult !== null) return osResult;

    // ── App-specific routing ──────────────────────────────────────────────────
    // BTC New App (CLA E1 or F8 for CONTINUE)
    if (cla === 0xe1 || cla === 0xf8) {
      return (await handleBtc(cla, ins, p1, p2, data)) ?? '6d00';
    }
    // Tron App (CLA 0x14)
    if (cla === 0x14) {
      return (await handleTron(ins, p1, p2, data)) ?? '6d00';
    }
    // Sui App (CLA 0x07)
    if (cla === 0x07) {
      return (await handleSui(ins, p1, p2, data)) ?? '6d00';
    }

    // CLA E0: dispatch by currentApp
    if (cla === 0xe0) {
      if (shared.S.currentApp === 'Solana') {
        return (await handleSol(ins, p1, p2, data)) ?? '6d00';
      }
      // Default: Ethereum App
      return (await handleEth(ins, p1, p2, data)) ?? '6d00';
    }

    return '6d00'; // INS_NOT_SUPPORTED
  } catch (e: any) {
    ulog('[APDU ERROR] ' + (e?.message ?? String(e)));
    return '6f00';
  }
}
