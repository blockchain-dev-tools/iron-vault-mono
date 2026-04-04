import { bytesToHex } from '../parser';
import { currentApp, ulog } from './shared';

// ── OS command handler ────────────────────────────────────────────────────────
// Returns null if the command is not an OS command (router falls through).

export async function handleOs(
  cla: number, ins: number, _p1: number, _p2: number, data: Uint8Array,
): Promise<string | null> {
  // GET_APP_AND_VERSION — B0 01
  if (cla === 0xb0 && ins === 0x01) return buildGetAppAndVersion();

  // OPEN_APP — E0 D8
  if (cla === 0xe0 && ins === 0xd8) {
    // Import shared state setter to avoid circular — handled in handler.ts router
    // The router calls setCurrentApp directly; we just ack here.
    return null; // handled by router before calling handlers
  }

  // QUIT_APP — E0 A7
  if (cla === 0xe0 && ins === 0xa7) {
    // Reset done in router; return success
    return null; // handled in router
  }

  // GET_DEVICE_INFO — E0 E2
  if (cla === 0xe0 && ins === 0xe2) return buildGetDeviceInfo();

  return null; // not an OS command
}

// ── Response builders ─────────────────────────────────────────────────────────

function buildGetVersion(): string {
  // target_id(4) + flags(1) + se_ver_len(1) + se_ver + flags_len(1) + flags(4) + mcu_ver_len(1) + mcu_ver + 9000
  const seVer = strToBytes('2.1.0');
  const flags = new Uint8Array([0, 0, 0, 0]);
  const mcuVer = new Uint8Array([...strToBytes('1.13'), 0]);
  const resp = new Uint8Array(4 + 1 + seVer.length + 1 + 4 + 1 + mcuVer.length + 2);
  let i = 0;
  resp[i++] = 0x33; resp[i++] = 0x00; resp[i++] = 0x00; resp[i++] = 0x04;
  resp[i++] = seVer.length; resp.set(seVer, i); i += seVer.length;
  resp[i++] = 4; resp.set(flags, i); i += 4;
  resp[i++] = mcuVer.length; resp.set(mcuVer, i); i += mcuVer.length;
  resp[i++] = 0x90; resp[i] = 0x00;
  return bytesToHex(resp);
}

export function buildGetAppAndVersion(): string {
  const verStr = currentApp === 'Solana' ? '1.3.0' :
                 currentApp === 'Bitcoin' ? '2.1.0' :
                 currentApp === 'Tron' ? '0.5.0' :
                 currentApp === 'Sui' ? '0.1.0' :
                 '1.10.3'; // Ethereum default
  const name = strToBytes(currentApp);
  const ver = strToBytes(verStr);
  const flags = new Uint8Array([0x02]);
  const resp = new Uint8Array(1 + 1 + name.length + 1 + ver.length + 1 + 1 + 2);
  let i = 0;
  resp[i++] = 0x01;
  resp[i++] = name.length; resp.set(name, i); i += name.length;
  resp[i++] = ver.length; resp.set(ver, i); i += ver.length;
  resp[i++] = 1; resp.set(flags, i); i += 1;
  resp[i++] = 0x90; resp[i] = 0x00;
  return bytesToHex(resp);
}

function buildGetDeviceInfo(): string {
  // target_id(4) + se_ver_len(1) + se_ver + mcu_bl_ver_len(1) + mcu_bl_ver
  // + mcu_ver_len(1) + mcu_ver + hw_rev(1) + lang(1) + onboarded(1) + recovery(1) + 9000
  const seVer = strToBytes('2.1.0');
  const mcuBlVer = strToBytes('1.13');
  const mcuVer = strToBytes('1.13');
  const parts: number[] = [
    0x33, 0x00, 0x00, 0x04,                      // target_id
    seVer.length, ...seVer,                        // se version
    mcuBlVer.length, ...mcuBlVer,                  // MCU bootloader version
    mcuVer.length, ...mcuVer,                      // MCU version
    0x00,                                          // hw revision
    0x00,                                          // language (English)
    0x01,                                          // onboarded = true
    0x00,                                          // recovery mode off
    0x90, 0x00,                                    // SW OK
  ];
  return bytesToHex(new Uint8Array(parts));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
