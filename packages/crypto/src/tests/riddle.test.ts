/**
 * 谜语模式 (Enigma Wallet) 测试 — 与 apps/mobile/src/screens/EnigmaScreen/index.tsx 逻辑一致
 *
 * 原理：
 *   ① 选词表语言 → 把谜语文本拆成 token（CJK 按字切，其他按空格切）
 *   ② 每个 token 查 BIP-39 词表索引（0–2047）→ 转 4 位 hex → 拼接到 64 hex 字符
 *   ③ sha256(熵hex) ‖ sha256(密钥) → sha256 → 32 字节最终熵
 *   ④ entropyToMnemonic(熵, 'en') → 24 词英文助记词
 *   ⑤ 助记词 + passphrase → 种子 → 5 链 HD 派生
 */

import { describe, it, expect } from 'vitest';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { TextEncoder } from 'util';

import { entropyToMnemonic, mnemonicToSeed, reencodeMnemonic, BIP39_WORDLISTS } from '../mnemonic';
import type { Bip39Language } from '../mnemonic';
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from '../hdkey';
import { ethPubKeyToAddress, solanaPubKey } from '../signer';
import {
  p2wpkhAddress,
  tronAddressFromPrivKey,
  suiAddress,
  secp256k1PublicKey,
} from '../btc';

// ── 以下逻辑直接移植自 apps/mobile/src/screens/EnigmaScreen/index.tsx ─────────

// CJK 语言：按字切分（每个汉字是一个独立的 BIP-39 词）
const CJK_LANGS = new Set<Bip39Language>(['zh-Hans', 'zh-Hant', 'ja']);

// 词表缓存：word → index
const _wordIndexCache = new Map<Bip39Language, Map<string, number>>();
function getWordIndex(lang: Bip39Language): Map<string, number> {
  if (!_wordIndexCache.has(lang)) {
    _wordIndexCache.set(lang, new Map(BIP39_WORDLISTS[lang].map((w, i) => [w, i])));
  }
  return _wordIndexCache.get(lang)!;
}

/** 按语言切分谜语文本 */
function tokenize(text: string, lang: Bip39Language): string[] {
  if (CJK_LANGS.has(lang)) {
    return text.split('').filter(c => c.trim() !== '');
  }
  return text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
}

const HEX_CAP = 64;
const HEX_PER_WORD = 4;

/** EnigmaScreen.deriveEntropy 的精确实现 */
function deriveEntropy(text: string, lang: Bip39Language, salt: string): Uint8Array {
  const wordIndex = getWordIndex(lang);
  const tokens = tokenize(text, lang);

  let entropyHex = '';
  for (const token of tokens) {
    if (entropyHex.length >= HEX_CAP) break;
    const index = wordIndex.get(token);
    if (index !== undefined) {
      entropyHex += index.toString(16).padStart(HEX_PER_WORD, '0');
    }
  }

  entropyHex = entropyHex.padEnd(HEX_CAP, '0');

  const entropyHash = sha256(hexToBytes(entropyHex));
  const saltHash = sha256(new TextEncoder().encode(salt));
  const combined = new Uint8Array(64);
  combined.set(entropyHash, 0);
  combined.set(saltHash, 32);
  return sha256(combined);
}

// ── 解析 BIP-32 路径 ───────────────────────────────────────────────────────────

function parsePath(path: string): number[] {
  return path
    .split('/')
    .slice(1)
    .map(seg => {
      const hardened = seg.endsWith("'");
      const index = parseInt(hardened ? seg.slice(0, -1) : seg, 10);
      return hardened ? (0x80000000 | index) >>> 0 : index;
    });
}

function pathToString(components: number[]): string {
  return 'm/' + components.map(c => {
    const h = (c & 0x80000000) !== 0;
    const i = c & 0x7fffffff;
    return h ? `${i}'` : `${i}`;
  }).join('/');
}

const PATHS = {
  eth:  parsePath("m/44'/60'/0'/0/0"),
  sol:  parsePath("m/44'/501'/0'/0'"),
  btc:  parsePath("m/84'/0'/0'/0/0"),
  tron: parsePath("m/44'/195'/0'/0/0"),
  sui:  parsePath("m/44'/784'/0'/0'/0'"),
};

// ── 核心：谜语模式生成器（匹配 app 逻辑）───────────────────────────────────────

interface EnigmaResult {
  lang: Bip39Language;
  text: string;
  salt: string;
  matchedTokens: number;
  passphrase: string;
  mnemonic: string;       // 英文助记词（app 默认生成英文）
  mnemonicZh: string;     // 简体中文助记词（通过 reencodeMnemonic 转换）
  seedHex: string;
  accounts: {
    eth:  { path: string; address: string };
    sol:  { path: string; address: string };
    btc:  { path: string; address: string };
    tron: { path: string; address: string };
    sui:  { path: string; address: string };
  };
}

async function enigmaGenerate(
  text: string,
  lang: Bip39Language,
  salt: string,
  passphrase = '',
): Promise<EnigmaResult> {
  const finalEntropy = deriveEntropy(text, lang, salt);
  // 助记词始终使用所选语言生成（与 Rust enigma.rs 行为完全一致）
  const mnemonic = entropyToMnemonic(finalEntropy, lang);
  // 额外展示简体中文版本
  const mnemonicZh = lang === 'zh-Hans'
    ? mnemonic
    : reencodeMnemonic(mnemonic, lang, 'zh-Hans');
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  const ethPriv  = deriveEthPrivateKey(seed, PATHS.eth);
  const solPriv  = deriveSolanaPrivateKey(seed, PATHS.sol);
  const btcPriv  = deriveEthPrivateKey(seed, PATHS.btc);
  const tronPriv = deriveEthPrivateKey(seed, PATHS.tron);
  const suiPriv  = deriveSolanaPrivateKey(seed, PATHS.sui);

  const ethAddr  = ethPubKeyToAddress(ethPriv).address;
  const solPub   = solanaPubKey(solPriv);
  const btcPub   = secp256k1PublicKey(btcPriv, true);
  const btcAddr  = p2wpkhAddress(btcPub);
  const tronAddr = tronAddressFromPrivKey(tronPriv).address;
  const suiAddr  = suiAddress(solanaPubKey(suiPriv));

  const { base58 } = await import('@scure/base');

  // 统计实际匹配了多少个 token（最多 16）
  const wordIndex = getWordIndex(lang);
  const tokens = tokenize(text, lang);
  let matched = 0;
  let hexLen = 0;
  for (const t of tokens) {
    if (hexLen >= HEX_CAP) break;
    if (wordIndex.has(t)) { matched++; hexLen += HEX_PER_WORD; }
  }

  return {
    lang,
    text,
    salt,
    matchedTokens: matched,
    passphrase,
    mnemonic,
    mnemonicZh,
    seedHex: bytesToHex(seed),
    accounts: {
      eth:  { path: pathToString(PATHS.eth),  address: '0x' + ethAddr },
      sol:  { path: pathToString(PATHS.sol),  address: base58.encode(solPub) },
      btc:  { path: pathToString(PATHS.btc),  address: btcAddr },
      tron: { path: pathToString(PATHS.tron), address: tronAddr },
      sui:  { path: pathToString(PATHS.sui),  address: suiAddr },
    },
  };
}

function formatEnigmaResult(r: EnigmaResult): string {
  const chains: Array<keyof typeof r.accounts> = ['eth', 'sol', 'btc', 'tron', 'sui'];
  const chainLabels: Record<string, string> = {
    eth: 'Ethereum (ETH)', sol: 'Solana (SOL)', btc: 'Bitcoin (BTC)',
    tron: 'Tron (TRON)', sui: 'Sui (SUI)',
  };

  // 助记词实际使用的语言
  const langLabels: Record<string, string> = {
    en: 'English', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文',
    ja: 'Japanese', ko: 'Korean', fr: 'French', es: 'Spanish',
    it: 'Italian', cs: 'Czech', pt: 'Portuguese',
  };
  const primaryLang = langLabels[r.lang] ?? r.lang;
  const wc = r.mnemonic.split(/[\s\u3000]+/).length;

  const lines = [
    '━'.repeat(58),
    '  Enigma Wallet · 谜语模式测试结果',
    `  词表语言: ${r.lang.padEnd(8)}  |  匹配词数: ${r.matchedTokens}/16`,
    '━'.repeat(58),
    '',
    `  谜语文本: ${r.text.length > 50 ? r.text.slice(0, 50) + '…' : r.text}`,
    `  密钥     : ${r.salt}`,
    `  Passphrase: ${r.passphrase || '(空)'}`,
    '',
    `  ── ${primaryLang} (${wc} 词) ──`,
    `    ${r.mnemonic}`,
  ];

  // 如果助记词不是中文，额外展示中文版
  if (r.mnemonicZh !== r.mnemonic) {
    lines.push(
      `  ── 简体中文 (${r.mnemonicZh.split(' ').length} 词) ──`,
      `    ${r.mnemonicZh}`,
    );
  }

  lines.push(
    `  Seed (hex, ${r.seedHex.length / 2} bytes)`,
    `    ${r.seedHex}`,
    '',
    '  Chain' + ' '.repeat(16) + '│ Path' + ' '.repeat(25) + '│ Address',
    '  ' + '─'.repeat(56),
    ...chains.map(ch =>
      `  ${(chainLabels[ch] ?? ch).padEnd(20)}│ ${r.accounts[ch].path.padEnd(30)}│ ${r.accounts[ch].address}`),
    '',
    '  ✓ 同一谜语文本 + 同一密钥 → 确定性结果',
    `  ✓ 助记词为 ${primaryLang} BIP-39，可用标准钱包恢复`,
    '━'.repeat(58),
  );

  return lines.join('\n');
}

// ── 测试用例 ──────────────────────────────────────────────────────────────────

describe('Enigma Wallet 谜语模式（与 app 逻辑一致）', () => {

  // ================================================================
  // 示例 1：中文谜语（唐诗）+ zh-Hans 词表
  //   每个汉字都是一个独立 token，
  //   逐字查 BIP-39 简体中文词表→取索引→拼 hex→加盐→SHA256→熵→英文助记词
  // ================================================================
  it('中文谜语 "静夜思" + zh-Hans 词表 + 密钥 + 无 passphrase', async () => {
    const r = await enigmaGenerate(
      '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
      'zh-Hans',
      '1234',
    );

    // 中文 zh-Hans 24 词
    const zhWords = r.mnemonic.split(' ');
    expect(zhWords).toHaveLength(24);
    // 每个词都应在简体中文 BIP-39 词表中
    for (const word of zhWords) {
      expect(BIP39_WORDLISTS['zh-Hans']).toContain(word);
    }

    // 确认至少匹配到了词表里的字（静夜思里很多汉字在 BIP-39 简体中文词表中）
    expect(r.matchedTokens).toBeGreaterThan(0);

    // 地址格式校验
    expect(r.accounts.eth.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(r.accounts.sol.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(r.accounts.btc.address).toMatch(/^bc1q[a-z0-9]{38,58}$/);
    expect(r.accounts.tron.address).toMatch(/^T[a-zA-Z0-9]{33}$/);
    expect(r.accounts.sui.address).toMatch(/^0x[a-f0-9]{64}$/);

    console.log('\n' + formatEnigmaResult(r));
  });

  // ================================================================
  // 示例 2：英文谜语 + en 词表
  //   按空格切分单词，每个单词查 BIP-39 英文词表索引
  // ================================================================
  it('英文谜语 + en 词表 + 密钥', async () => {
    const r = await enigmaGenerate(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      'en',
      'secret-key',
    );

    // 16 个 abandon 都匹配成功 → 16/16 匹配
    expect(r.matchedTokens).toBe(16);
    expect(r.mnemonic.split(' ')).toHaveLength(24);

    // 全部 abandon + 1 about 在一段 BIP-39 token 中，
    // sha256(sha256(16×0000) ‖ sha256(secret-key)) 应产生确定结果
    expect(r.mnemonic).toBeTruthy();

    console.log(formatEnigmaResult(r));
  });

  // ================================================================
  // 示例 3：日文谜语 + ja 词表
  //   日文 BIP-39 词表是假名（如 あいこくしん），
  //   但任何字符包括汉字（如 "語"）都能作为 token，不在词表中则跳过
  // ================================================================
  it('日文文本 + ja 词表（CJK 按字切分，仅单字在词表中才匹配）', async () => {
    // 注意：BIP-39 日文词表条目是多假名单词（如「あいこくしん」），
    // CJK 按字切分后单字不在词表中，所以匹配数为 0，
    // 熵完全来源于 sha256(salt)，结果仍为确定性的 24 词助记词
    const r = await enigmaGenerate('あいこくしん', 'ja', 'salt123');

    // 日文助记词用 ideographic space（\u3000）分隔
    const jaWords = r.mnemonic.split(/[\s\u3000]+/);
    expect(jaWords).toHaveLength(24);
    expect(r.matchedTokens).toBe(0);
    expect(r.accounts.eth.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(r.accounts.sol.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);

    console.log(formatEnigmaResult(r));
  });

  // ================================================================
  // 示例 4：同一输入 → 确定性结果
  // ================================================================
  it('相同输入产生完全相同的结果（确定性）', async () => {
    const a = await enigmaGenerate('床前明月光', 'zh-Hans', 'test-key', 'my-pass');
    const b = await enigmaGenerate('床前明月光', 'zh-Hans', 'test-key', 'my-pass');

    expect(a.mnemonic).toBe(b.mnemonic);
    expect(a.seedHex).toBe(b.seedHex);
    expect(a.accounts.eth.address).toBe(b.accounts.eth.address);
    expect(a.accounts.sol.address).toBe(b.accounts.sol.address);
    expect(a.accounts.btc.address).toBe(b.accounts.btc.address);
    expect(a.accounts.tron.address).toBe(b.accounts.tron.address);
    expect(a.accounts.sui.address).toBe(b.accounts.sui.address);
  });

  // ================================================================
  // 示例 5：不同密钥 → 不同结果（即使谜语文本相同）
  // ================================================================
  it('不同密钥产生完全不同的助记词和地址', async () => {
    const a = await enigmaGenerate('明月', 'zh-Hans', 'key-A');
    const b = await enigmaGenerate('明月', 'zh-Hans', 'key-B');

    expect(a.mnemonic).not.toBe(b.mnemonic);
    expect(a.accounts.eth.address).not.toBe(b.accounts.eth.address);
    expect(a.accounts.sol.address).not.toBe(b.accounts.sol.address);
    expect(a.accounts.btc.address).not.toBe(b.accounts.btc.address);
    expect(a.accounts.tron.address).not.toBe(b.accounts.tron.address);
    expect(a.accounts.sui.address).not.toBe(b.accounts.sui.address);
  });

  // ================================================================
  // 示例 6：不同 passphrase → 不同种子 → 不同地址（助记词相同）
  // ================================================================
  it('不同 passphrase 产生不同地址（助记词相同）', async () => {
    const a = await enigmaGenerate('人生得意须尽欢', 'zh-Hans', '8888', '');
    const b = await enigmaGenerate('人生得意须尽欢', 'zh-Hans', '8888', 'extra-pass');

    // 助记词相同（熵只依赖文本+语言+密钥）
    expect(a.mnemonic).toBe(b.mnemonic);
    // 但种子不同 → 所有地址不同
    expect(a.seedHex).not.toBe(b.seedHex);
    expect(a.accounts.eth.address).not.toBe(b.accounts.eth.address);
    expect(a.accounts.sol.address).not.toBe(b.accounts.sol.address);
  });

  // ================================================================
  // 示例 7：标准 BIP-44 路径验证
  // ================================================================
  it('默认路径与 @iron-vault/wallet 标准路径一致', async () => {
    const r = await enigmaGenerate('test', 'en', 'salt');
    expect(r.accounts.eth.path).toBe("m/44'/60'/0'/0/0");
    expect(r.accounts.sol.path).toBe("m/44'/501'/0'/0'");
    expect(r.accounts.btc.path).toBe("m/84'/0'/0'/0/0");
    expect(r.accounts.tron.path).toBe("m/44'/195'/0'/0/0");
    expect(r.accounts.sui.path).toBe("m/44'/784'/0'/0'/0'");
  });
});
