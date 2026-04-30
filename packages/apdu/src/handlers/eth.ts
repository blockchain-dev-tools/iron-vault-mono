import {
  deriveEthPrivateKey, ethPubKeyToAddress, tronAddressFromPrivKey,
  signEthTransaction, signEthPersonalMessage, signEthEip712,
} from '@iron-vault/crypto';
import { parseBip32Path, rlpTotalLength, bytesToHex } from '../parser';
import {
  requireSeed, maybeDeferred, ulog,
  clearEthSign, clearEthPersonal,
  startEthSignTimer, startEthPersonalTimer,
  setLastToken, setLastNft, setLastDomain, getLastDomain,
} from './shared';

// Shared mutable state refs (imported by ref, not value)
import * as shared from './shared';

// ── ETH App handler (CLA E0) ──────────────────────────────────────────────────

export async function handleEth(
  ins: number, p1: number, p2: number, data: Uint8Array,
): Promise<string | null> {
  switch (ins) {
    case 0x02: return handleGetEthAddress(p2, data);        // GET_ETH_ADDRESS
    case 0x04: return handleEthSign(p1, data);              // SIGN_ETH_TRANSACTION
    case 0x06: return buildGetAppConfiguration();           // GET_APP_CONFIGURATION
    case 0x08: return handleEthPersonalSign(p1, data);      // SIGN_PERSONAL_MESSAGE
    case 0x0a: return handleProvideErc20(data);             // PROVIDE_ERC20_TOKEN_INFO
    case 0x0c: return handleEthEip712Sign(p1, data);        // SIGN_EIP_712_MESSAGE
    case 0x0e: return '9000';                               // SIGN_ETH_TX_WITH_PLUGIN (stub)
    case 0x10: return '9000';                               // PROVIDE_TRUSTED_NAME (stub)
    case 0x12: return handleEthEip712Sign(p1, data);        // SIGN_ETH_EIP_712_FILTERED (same as 0x0c)
    case 0x14: return handleProvideNftMetadata(data);       // PROVIDE_NFT_METADATA
    case 0x16: return '9000';                               // SET_PLUGIN (stub)
    case 0x18: return handleEthSign(p1, data);              // SIGN_ETH_TX_BATCH (delegate to sign)
    case 0x1a: return '9000';                               // PROVIDE_TRUSTED_CONTRACT_NAME (stub)
    case 0x1c: return buildGetChallenge();                  // GET_CHALLENGE
    case 0x1e: return handleEthEip712Sign(p1, data);        // SIGN_EIP_712_FILTERED_CHUNKS
    case 0x20: return '9000';                               // PROVIDE_DELEGATE_KEY (stub)
    case 0x22: return handleProvideDomainName(p1, data);    // PROVIDE_DOMAIN_NAME
    case 0x24: return '9000';                               // REVOKE_DOMAIN_NAME (stub)
    case 0x26: return '01 9000'.replace(/ /g, '');         // GET_BLIND_SIGN_ENABLED
    case 0x28: return handleGetEthAddress(p2, data);        // GET_PUBLIC_KEY (same as 0x02)
    case 0x2a: return handleEthEip712Sign(p1, data);        // SIGN_TYPED_DATA
    default:   return null;                                  // unknown INS
  }
}

// ── GET_APP_CONFIGURATION — E0 06 ─────────────────────────────────────────────

function buildGetAppConfiguration(): string {
  // arbitrary_data_enabled(1) + erc20_provision_needed(1) + major(1) + minor(1) + patch(1) + 9000
  return bytesToHex(new Uint8Array([0x01, 0x00, 0x01, 0x0a, 0x03, 0x90, 0x00]));
}

// ── GET_BLIND_SIGN_ENABLED — E0 26 ───────────────────────────────────────────

// Already inlined above as literal.

// ── GET_CHALLENGE — E0 1C ─────────────────────────────────────────────────────

function buildGetChallenge(): string {
  const nonce = new Uint8Array(4);
  globalThis.crypto.getRandomValues(nonce);
  ulog(`[CHALLENGE] nonce: ${bytesToHex(nonce)}`);
  const resp = new Uint8Array(6);
  resp.set(nonce, 0);
  resp[4] = 0x90; resp[5] = 0x00;
  return bytesToHex(resp);
}

// ── PROVIDE_ERC20_TOKEN_INFO — E0 0A ─────────────────────────────────────────

function handleProvideErc20(data: Uint8Array): string {
  let i = 0;
  const tickerLen = data[i++] ?? 0;
  const ticker = new TextDecoder().decode(data.slice(i, i + tickerLen)); i += tickerLen;
  const decimals = data[i++] ?? 0;
  const contract = bytesToHex(data.slice(i, i + 20)); i += 20;
  const chainId = ((data[i]! << 24) | (data[i+1]! << 16) | (data[i+2]! << 8) | data[i+3]!) >>> 0;
  setLastToken({ ticker, decimals, contractAddr: '0x' + contract, chainId });
  ulog(`[ERC20] ${ticker} (${decimals} dec) @ 0x${contract} chainId=${chainId}`);
  return '9000';
}

// ── PROVIDE_NFT_METADATA — E0 14 ─────────────────────────────────────────────

function handleProvideNftMetadata(data: Uint8Array): string {
  let i = 0;
  const nameLen = data[i++] ?? 0;
  const name = new TextDecoder().decode(data.slice(i, i + nameLen)); i += nameLen;
  const contract = bytesToHex(data.slice(i, i + 20)); i += 20;
  const chainId = ((data[i]! << 24) | (data[i+1]! << 16) | (data[i+2]! << 8) | data[i+3]!) >>> 0;
  setLastNft({ name, contractAddr: '0x' + contract, chainId });
  ulog(`[NFT] "${name}" @ 0x${contract} chainId=${chainId}`);
  return '9000';
}

// ── PROVIDE_DOMAIN_NAME — E0 22 ──────────────────────────────────────────────

function handleProvideDomainName(_p1: number, data: Uint8Array): string {
  // First frame has 2-byte length prefix; we just read whatever bytes follow
  let offset = 0;
  if (data.length >= 2) {
    const len = (data[0]! << 8) | data[1]!;
    offset = 2;
    const domainBytes = data.slice(offset, offset + len);
    try {
      setLastDomain(new TextDecoder('utf-8', { fatal: true }).decode(domainBytes));
    } catch {
      setLastDomain(bytesToHex(domainBytes));
    }
  } else {
    // Continuation: append (simplified — store as hex)
    const more = new TextDecoder('utf-8', { fatal: false }).decode(data);
    setLastDomain((getLastDomain() ?? '') + more);
  }
  ulog(`[DOMAIN] ${getLastDomain()}`);
  return '9000';
}

// ── GET_ETH_ADDRESS — E0 02 ───────────────────────────────────────────────────

async function handleGetEthAddress(p2: number, data: Uint8Array): Promise<string> {
  const withChainCode = (p2 & 0x01) === 0x01;
  const { path } = parseBip32Path(data);
  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);

  // Tron coin type = 195 (hardened: 0x800000C3). OKX sends E0 02 with Tron paths;
  // respond with Tron base58 address instead of Ethereum hex.
  const isTronPath = path.length >= 2 && path[1] === (0x80000000 | 195);
  if (isTronPath) {
    const { uncompressedPubKey, address } = tronAddressFromPrivKey(privKey);
    const addrBytes = new TextEncoder().encode(address);
    const resp = new Uint8Array(1 + 65 + 1 + addrBytes.length + 2);
    let i = 0;
    resp[i++] = 0x41;
    resp.set(uncompressedPubKey, i); i += 65;
    resp[i++] = addrBytes.length;
    resp.set(addrBytes, i); i += addrBytes.length;
    resp[i++] = 0x90; resp[i] = 0x00;
    return bytesToHex(resp);
  }

  const { pubKey, address } = ethPubKeyToAddress(privKey);
  const addrBytes = new TextEncoder().encode(address);
  const chainCode = new Uint8Array(32); // zeroed (simplified)
  const extraLen = withChainCode ? 32 : 0;
  const resp = new Uint8Array(1 + 65 + 1 + 40 + extraLen + 2);
  let i = 0;
  resp[i++] = 0x41;
  resp.set(pubKey, i); i += 65;
  resp[i++] = 0x28;
  resp.set(addrBytes, i); i += 40;
  if (withChainCode) { resp.set(chainCode, i); i += 32; }
  resp[i++] = 0x90; resp[i] = 0x00;
  return bytesToHex(resp);
}

// ── SIGN_ETH_TRANSACTION — E0 04 ─────────────────────────────────────────────

async function handleEthSign(p1: number, data: Uint8Array): Promise<string> {
  if (p1 === 0x00) {
    const { path, rest } = parseBip32Path(data);
    const pathStr = path.map(c => ((c & 0x80000000) ? (c & 0x7fffffff) + "'" : c)).join('/');
    const seed = await requireSeed();
    const privKey = deriveEthPrivateKey(seed, path);
    const { address } = ethPubKeyToAddress(privKey);
    const expected = rlpTotalLength(rest);
    startEthSignTimer();
    shared.S.ethSign = { privKey, rlp: Array.from(rest) };
    if (expected > 0 && rest.length >= expected) {
      const txBytes = rest.slice(0, expected);
      clearEthSign();
      return await maybeDeferred('eth', txBytes, () => bytesToHex(signEthTransaction(privKey, txBytes)), decodeEthTx(txBytes));
    }
    ulog(`[ETH SIGN] path: m/${pathStr} addr: 0x${address} — waiting chunks (${rest.length}/${expected})`);
    return '9000';
  }
  if (p1 === 0x80) {
    if (!shared.S.ethSign) return '6f00';
    shared.S.ethSign.rlp.push(...Array.from(data));
    const expected = rlpTotalLength(shared.S.ethSign.rlp);
    if (expected > 0 && shared.S.ethSign.rlp.length >= expected) {
      const txBytes = new Uint8Array(shared.S.ethSign.rlp);
      const savedKey = shared.S.ethSign.privKey;
      clearEthSign();
      return await maybeDeferred('eth', txBytes, () => bytesToHex(signEthTransaction(savedKey, txBytes)), decodeEthTx(txBytes));
    }
    return '9000';
  }
  return '6b00';
}

// ── SIGN_PERSONAL_MESSAGE — E0 08 ────────────────────────────────────────────

async function handleEthPersonalSign(p1: number, data: Uint8Array): Promise<string> {
  if (p1 === 0x00) {
    const { path, rest } = parseBip32Path(data);
    if (rest.length < 4) return '6700';
    const msgLen = ((rest[0]! << 24) | (rest[1]! << 16) | (rest[2]! << 8) | rest[3]!) >>> 0;
    const firstChunk = rest.slice(4);
    const seed = await requireSeed();
    const privKey = deriveEthPrivateKey(seed, path);
    startEthPersonalTimer();
    shared.S.ethPersonal = { privKey, msgLen, msg: Array.from(firstChunk) };
    if (shared.S.ethPersonal.msg.length >= msgLen) {
      const msgBytes = new Uint8Array(shared.S.ethPersonal.msg.slice(0, msgLen));
      clearEthPersonal();
      const preview = tryUtf8(msgBytes);
      return await maybeDeferred('eth', msgBytes, () => bytesToHex(signEthPersonalMessage(privKey, msgBytes)), { data: `personal_sign: "${preview}"` });
    }
    ulog(`[PERSONAL SIGN] waiting chunks (${shared.S.ethPersonal.msg.length}/${msgLen})`);
    return '9000';
  }
  if (p1 === 0x80) {
    if (!shared.S.ethPersonal) return '6f00';
    shared.S.ethPersonal.msg.push(...Array.from(data));
    if (shared.S.ethPersonal.msg.length >= shared.S.ethPersonal.msgLen) {
      const msgBytes = new Uint8Array(shared.S.ethPersonal.msg.slice(0, shared.S.ethPersonal.msgLen));
      const savedKey = shared.S.ethPersonal.privKey;
      clearEthPersonal();
      const preview = tryUtf8(msgBytes);
      return await maybeDeferred('eth', msgBytes, () => bytesToHex(signEthPersonalMessage(savedKey, msgBytes)), { data: `personal_sign: "${preview}"` });
    }
    return '9000';
  }
  return '6b00';
}

// ── SIGN_EIP_712 — E0 0C / 12 / 1E / 2A ─────────────────────────────────────

async function handleEthEip712Sign(p1: number, data: Uint8Array): Promise<string> {
  if (p1 !== 0x00) return '6b00';
  const { path, rest } = parseBip32Path(data);
  if (rest.length < 64) return '6700';
  const domainHash = rest.slice(0, 32);
  const structHash = rest.slice(32, 64);
  const seed = await requireSeed();
  const privKey = deriveEthPrivateKey(seed, path);
  ulog(`[EIP-712] domain: ${bytesToHex(domainHash).slice(0, 16)}… struct: ${bytesToHex(structHash).slice(0, 16)}…`);
  const combined = new Uint8Array(64);
  combined.set(domainHash, 0);
  combined.set(structHash, 32);
  return await maybeDeferred(
    'eth', combined,
    () => bytesToHex(signEthEip712(privKey, domainHash, structHash)),
    { data: `EIP-712 domain ${bytesToHex(domainHash).slice(0, 12)}…` },
  );
}

// ── RLP helpers ───────────────────────────────────────────────────────────────

function rlpItem(bytes: Uint8Array, off: number): { val: Uint8Array; next: number } {
  const f = bytes[off]!;
  if (f < 0x80) return { val: bytes.slice(off, off + 1), next: off + 1 };
  if (f < 0xb8) { const l = f - 0x80; return { val: bytes.slice(off + 1, off + 1 + l), next: off + 1 + l }; }
  if (f < 0xc0) {
    const lb = f - 0xb7; let l = 0;
    for (let i = 1; i <= lb; i++) l = (l << 8) | bytes[off + i]!;
    return { val: bytes.slice(off + 1 + lb, off + 1 + lb + l), next: off + 1 + lb + l };
  }
  if (f < 0xf8) { const l = f - 0xc0; return { val: bytes.slice(off + 1, off + 1 + l), next: off + 1 + l }; }
  const lb = f - 0xf7; let l = 0;
  for (let i = 1; i <= lb; i++) l = (l << 8) | bytes[off + i]!;
  return { val: bytes.slice(off + 1 + lb, off + 1 + lb + l), next: off + 1 + lb + l };
}

function rlpList(body: Uint8Array): Uint8Array[] {
  const items: Uint8Array[] = []; let o = 0;
  while (o < body.length) { const { val, next } = rlpItem(body, o); items.push(val); o = next; }
  return items;
}

function weiToEth(b: Uint8Array): string {
  if (!b.length) return '0 ETH';
  let n = BigInt(0); for (const x of b) n = (n << BigInt(8)) | BigInt(x);
  if (n === BigInt(0)) return '0 ETH';
  const eth = Number(n) / 1e18;
  return eth < 0.000001 ? `${n} wei` : `${eth.toFixed(6).replace(/\.?0+$/, '')} ETH`;
}

function fmtAddr(b: Uint8Array): string | undefined {
  if (!b.length) return undefined;
  const h = '0x' + bytesToHex(b);
  return h.length >= 10 ? h.slice(0, 8) + '…' + h.slice(-6) : h;
}

export function decodeEthTx(tx: Uint8Array): Record<string, unknown> {
  try {
    const type = tx[0]!;
    const isTyped = type === 0x01 || type === 0x02;
    const { val: body } = rlpItem(isTyped ? tx.slice(1) : tx, 0);
    const f = rlpList(body);
    const [gi, ti, vi, di] = type === 0x02 ? [4, 5, 6, 7] : type === 0x01 ? [3, 4, 5, 6] : [2, 3, 4, 5];
    const gasNum = parseInt(bytesToHex(f[gi] ?? new Uint8Array(0)) || '0', 16);
    const contractAddr = f[ti] ?? new Uint8Array(0);
    const dataBytes = f[di] ?? new Uint8Array(0);
    const dataHex = bytesToHex(dataBytes);
    if (dataHex.startsWith('a9059cbb') && dataBytes.length >= 68) {
      const recipient = dataBytes.slice(16, 36);
      const amtBytes = dataBytes.slice(36, 68);
      let n = BigInt(0); for (const b of amtBytes) n = (n << BigInt(8)) | BigInt(b);
      const chainId0 = isTyped ? parseInt(bytesToHex(f[0] ?? new Uint8Array(0)) || '0', 16) : (f.length >= 9 ? parseInt(bytesToHex(f[6] ?? new Uint8Array(0)) || '0', 16) : 0);
      return { to: fmtAddr(recipient), value: n.toString() + ' (token units)', gas: gasNum ? gasNum.toLocaleString() : undefined, data: `ERC-20 transfer · contract ${fmtAddr(contractAddr)}`, chainId: chainId0 || undefined };
    }
    const chainIdN = isTyped ? parseInt(bytesToHex(f[0] ?? new Uint8Array(0)) || '0', 16) : (f.length >= 9 ? parseInt(bytesToHex(f[6] ?? new Uint8Array(0)) || '0', 16) : undefined);
    return { to: fmtAddr(contractAddr), value: weiToEth(f[vi] ?? new Uint8Array(0)), gas: gasNum ? gasNum.toLocaleString() : undefined, data: dataBytes.length > 0 ? dataHex.slice(0, 16) + '…' : undefined, chainId: chainIdN || undefined };
  } catch { return {}; }
}

function tryUtf8(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).slice(0, 60); }
  catch { return bytesToHex(bytes).slice(0, 60); }
}
