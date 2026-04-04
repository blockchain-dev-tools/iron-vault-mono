import {
  deriveEthPrivateKey, btcMasterFingerprint, serializeXpub, sha256d,
  p2wpkhAddress, secp256k1PublicKey, signSecp256k1DER,
} from '@iron-vault/crypto';
import { parseBip32Path, bytesToHex } from '../parser';
import { requireSeed, maybeDeferred, ulog, btcSession, clearBtcSession, startBtcSessionTimer } from './shared';
import * as shared from './shared';

// ── BTC New App handler (CLA E1 + F8) ────────────────────────────────────────

export async function handleBtc(
  cla: number, ins: number, p1: number, _p2: number, data: Uint8Array,
): Promise<string | null> {
  // CLA F8 INS 01 = CONTINUE response from host
  if (cla === 0xf8 && ins === 0x01) return handleContinue(data);

  if (cla !== 0xe1) return null;

  switch (ins) {
    case 0x00: return handleGetExtendedPubkey(p1, data);  // GET_EXTENDED_PUBKEY
    case 0x02: return handleRegisterWallet(p1, data);     // REGISTER_WALLET
    case 0x03: return handleGetWalletAddress(data);       // GET_WALLET_ADDRESS
    case 0x04: return handleSignPsbt(p1, data);           // SIGN_PSBT
    case 0x05: return handleGetMasterFingerprint();       // GET_MASTER_FINGERPRINT
    case 0x10: return handleBtcSignMessage(data);         // SIGN_MESSAGE
    default:   return null;
  }
}

// ── GET_MASTER_FINGERPRINT — E1 05 ───────────────────────────────────────────

async function handleGetMasterFingerprint(): Promise<string> {
  const seed = await requireSeed();
  const fingerprint = btcMasterFingerprint(seed);
  ulog(`[BTC] master fingerprint: ${bytesToHex(fingerprint)}`);
  const resp = new Uint8Array(6);
  resp.set(fingerprint, 0);
  resp[4] = 0x90; resp[5] = 0x00;
  return bytesToHex(resp);
}

// ── GET_EXTENDED_PUBKEY — E1 00 ──────────────────────────────────────────────

async function handleGetExtendedPubkey(_p1: number, data: Uint8Array): Promise<string> {
  const { path } = parseBip32Path(data);
  const seed = await requireSeed();
  const xpubStr = serializeXpub(seed, path);
  ulog(`[BTC] xpub at m/${path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/')}: ${xpubStr.slice(0, 12)}…`);
  const xpubBytes = new TextEncoder().encode(xpubStr);
  const resp = new Uint8Array(1 + xpubBytes.length + 2);
  resp[0] = xpubBytes.length;
  resp.set(xpubBytes, 1);
  resp[1 + xpubBytes.length] = 0x90;
  resp[2 + xpubBytes.length] = 0x00;
  return bytesToHex(resp);
}

// ── REGISTER_WALLET — E1 02 ──────────────────────────────────────────────────

async function handleRegisterWallet(_p1: number, data: Uint8Array): Promise<string> {
  // Format: wallet_type(1) + threshold(1) + num_keys(1) + wallet_name_len(1) + wallet_name
  let i = 0;
  const _walletType = data[i++] ?? 0;
  const _threshold = data[i++] ?? 0;
  const _numKeys = data[i++] ?? 0;
  const nameLen = data[i++] ?? 0;
  const nameBytes = data.slice(i, i + nameLen);

  // Deterministic wallet_id = sha256d(name_bytes), hmac = sha256d(wallet_id)
  const walletId = sha256d(nameBytes);
  const hmac = sha256d(walletId);

  const resp = new Uint8Array(32 + 32 + 2);
  resp.set(walletId, 0);
  resp.set(hmac, 32);
  resp[64] = 0x90; resp[65] = 0x00;

  const name = new TextDecoder().decode(nameBytes);
  ulog(`[BTC] REGISTER_WALLET "${name}" id=${bytesToHex(walletId).slice(0, 16)}…`);
  return bytesToHex(resp);
}

// ── GET_WALLET_ADDRESS — E1 03 ───────────────────────────────────────────────

async function handleGetWalletAddress(data: Uint8Array): Promise<string> {
  // display(1) + wallet_id(32) + change(1) + address_index(4, big-endian)
  if (data.length < 38) return '6700';
  const change = data[33] ?? 0;
  const index = ((data[34]! << 24) | (data[35]! << 16) | (data[36]! << 8) | data[37]!) >>> 0;

  // BIP-84: m/84'/0'/0'/{change}/{index}
  const path = [0x80000054, 0x80000000, 0x80000000, change, index];
  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);
  const pubKey = secp256k1PublicKey(privKey, true); // compressed 33 bytes
  const address = p2wpkhAddress(pubKey);
  ulog(`[BTC] wallet address ${change}/${index}: ${address}`);

  const addrBytes = new TextEncoder().encode(address);
  const resp = new Uint8Array(1 + addrBytes.length + 2);
  resp[0] = addrBytes.length;
  resp.set(addrBytes, 1);
  resp[1 + addrBytes.length] = 0x90;
  resp[2 + addrBytes.length] = 0x00;
  return bytesToHex(resp);
}

// ── SIGN_MESSAGE — E1 10 ─────────────────────────────────────────────────────

async function handleBtcSignMessage(data: Uint8Array): Promise<string> {
  const { path, rest } = parseBip32Path(data);
  if (rest.length < 4) return '6700';
  const msgLen = ((rest[0]! << 24) | (rest[1]! << 16) | (rest[2]! << 8) | rest[3]!) >>> 0;
  const msgBytes = rest.slice(4, 4 + msgLen);

  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);

  // Bitcoin message prefix: "\x18Bitcoin Signed Message:\n" + varint(len) + msg
  const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
  const lenByte = new Uint8Array([msgBytes.length < 0xfd ? msgBytes.length : 0xfd]);
  const prefixed = new Uint8Array(prefix.length + lenByte.length + msgBytes.length);
  prefixed.set(prefix, 0);
  prefixed.set(lenByte, prefix.length);
  prefixed.set(msgBytes, prefix.length + lenByte.length);

  const hash = sha256d(prefixed);

  return await maybeDeferred(
    'btc', msgBytes,
    () => {
      const der = signSecp256k1DER(hash, privKey);
      const resp = new Uint8Array(1 + der.length + 2);
      resp[0] = der.length;
      resp.set(der, 1);
      resp[1 + der.length] = 0x90;
      resp[2 + der.length] = 0x00;
      return bytesToHex(resp);
    },
    { data: `BTC message sign` },
  );
}

// ── SIGN_PSBT — E1 04 (initiates CONTINUE FSM) ───────────────────────────────

async function handleSignPsbt(_p1: number, data: Uint8Array): Promise<string> {
  const { path, rest } = parseBip32Path(data);
  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);

  startBtcSessionTimer();
  shared.S.btcSession = {
    command: 'SIGN_PSBT',
    frames: Array.from(rest),
    expectingContinue: true,
    clientCmd: 0x40, // GET_PREIMAGE — ask host for preimage
    privKey,
  };

  ulog(`[BTC PSBT] session started, ${rest.length}b, returning CONTINUE(0x40)`);
  // Return CONTINUE SW: 0x61 + payload_len(1) + client_cmd(1) + zero_padding(3)
  const payload = new Uint8Array([0x40, 0x00, 0x00, 0x00]); // GET_PREIMAGE, 4-byte context
  const resp = new Uint8Array(2 + payload.length);
  resp[0] = 0x61;                  // CONTINUE SW high byte
  resp[1] = payload.length;        // payload length
  resp.set(payload, 2);
  return bytesToHex(resp);
}

// ── CONTINUE — F8 01 ─────────────────────────────────────────────────────────

async function handleContinue(data: Uint8Array): Promise<string> {
  if (!shared.S.btcSession) {
    ulog('[BTC CONTINUE] no active session');
    return '6f00';
  }

  const session = shared.S.btcSession;
  session.frames.push(...Array.from(data));
  ulog(`[BTC CONTINUE] +${data.length}b, total: ${session.frames.length}b`);

  if (session.clientCmd === 0x40) {
    // Preimage received — now we have enough to sign
    const msgBytes = new Uint8Array(session.frames);
    const privKey = session.privKey!;
    clearBtcSession();

    const hash = sha256d(msgBytes);
    return await maybeDeferred(
      'btc', msgBytes,
      () => {
        const der = signSecp256k1DER(hash, privKey);
        // Response: sig_count(1) + input_index(4) + sig(n) + 9000
        const resp = new Uint8Array(1 + 4 + der.length + 2);
        resp[0] = 0x01; // 1 signature
        // input_index = 0
        resp.set(der, 5);
        resp[5 + der.length] = 0x90;
        resp[6 + der.length] = 0x00;
        return bytesToHex(resp);
      },
      { data: 'PSBT sign' },
    );
  }

  // More data needed — return another CONTINUE
  const payload = new Uint8Array([0x00, 0x00, 0x00, 0x00]); // YIELD
  session.clientCmd = 0x00;
  const resp = new Uint8Array(2 + payload.length);
  resp[0] = 0x61;
  resp[1] = payload.length;
  resp.set(payload, 2);
  return bytesToHex(resp);
}
