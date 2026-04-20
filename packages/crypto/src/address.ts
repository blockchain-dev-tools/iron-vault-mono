import { base58 } from "@scure/base";
import { mnemonicToSeed } from "./mnemonic";
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from "./hdkey";
import { ethPubKeyToAddress, solanaPubKey } from "./signer";
import { p2wpkhAddress, tronAddressFromPrivKey, suiAddress, secp256k1PublicKey } from "./btc";

export interface Account {
  full: string;
  short: string;
  path: string;
  custom: boolean;
}

export interface WalletAccounts {
  eth: Account[];
  sol: Account[];
  btc: Account[];
  tron: Account[];
  sui: Account[];
}

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-5);
}

function parsePath(path: string): number[] {
  return path
    .split('/')
    .slice(1) // remove leading 'm'
    .map(seg => {
      const hardened = seg.endsWith("'");
      const index = parseInt(hardened ? seg.slice(0, -1) : seg, 10);
      return hardened ? (0x80000000 | index) >>> 0 : index;
    });
}

/** Derive accounts using explicit path lists. Each account is derived at its exact path. */
export async function deriveAccountsFromPaths(
  mnemonic: string,
  ethPaths: string[],
  solPaths: string[],
  passphrase = '',
  ethCustom: boolean[] = [],
  solCustom: boolean[] = [],
  btcPaths: string[] = [],
  tronPaths: string[] = [],
  suiPaths: string[] = [],
  btcCustom: boolean[] = [],
  tronCustom: boolean[] = [],
  suiCustom: boolean[] = [],
): Promise<WalletAccounts> {
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  const eth: Account[] = ethPaths.map((path, i) => {
    const priv = deriveEthPrivateKey(seed, parsePath(path));
    const { address } = ethPubKeyToAddress(priv);
    const full = "0x" + address;
    return { full, short: shortAddr(full), path, custom: ethCustom[i] ?? false };
  });

  const sol: Account[] = solPaths.map((path, i) => {
    const solPriv = deriveSolanaPrivateKey(seed, parsePath(path));
    const pubBytes = solanaPubKey(solPriv);
    const full = base58.encode(pubBytes);
    return { full, short: shortAddr(full), path, custom: solCustom[i] ?? false };
  });

  const btc: Account[] = btcPaths.map((path, i) => {
    const priv = deriveEthPrivateKey(seed, parsePath(path));
    const compressedPub = secp256k1PublicKey(priv, true);
    const full = p2wpkhAddress(compressedPub);
    return { full, short: shortAddr(full), path, custom: btcCustom[i] ?? false };
  });

  const tron: Account[] = tronPaths.map((path, i) => {
    const priv = deriveEthPrivateKey(seed, parsePath(path));
    const { address } = tronAddressFromPrivKey(priv);
    return { full: address, short: shortAddr(address), path, custom: tronCustom[i] ?? false };
  });

  const sui: Account[] = suiPaths.map((path, i) => {
    const priv = deriveSolanaPrivateKey(seed, parsePath(path));
    const pubBytes = solanaPubKey(priv);
    const full = suiAddress(pubBytes);
    return { full, short: shortAddr(full), path, custom: suiCustom[i] ?? false };
  });

  return { eth, sol, btc, tron, sui };
}

/** @deprecated Use deriveAccountsFromPaths for new code. Kept for backward compatibility. */
export async function deriveWalletAccounts(
  mnemonic: string,
  ethCount = 1,
  solCount = 1,
  passphrase = '',
): Promise<WalletAccounts> {
  const ethPaths = Array.from({ length: ethCount }, (_, i) => `m/44'/60'/0'/0/${i}`);
  const solPaths = Array.from({ length: solCount }, (_, i) => `m/44'/501'/${i}'/0'`);
  return deriveAccountsFromPaths(mnemonic, ethPaths, solPaths, passphrase);
}
