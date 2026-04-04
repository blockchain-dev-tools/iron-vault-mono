import { base58 } from "@scure/base";
import { mnemonicToSeed } from "./mnemonic";
import { deriveEthPrivateKey, deriveSolanaPrivateKey } from "./hdkey";
import { ethPubKeyToAddress, solanaPubKey } from "./signer";

export interface Account {
  full: string;
  short: string;
  path: string;
}

export interface WalletAccounts {
  eth: Account[];
  sol: Account[];
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
): Promise<WalletAccounts> {
  const seed = await mnemonicToSeed(mnemonic, passphrase);

  const eth: Account[] = ethPaths.map(path => {
    const priv = deriveEthPrivateKey(seed, parsePath(path));
    const { address } = ethPubKeyToAddress(priv);
    const full = "0x" + address;
    return { full, short: shortAddr(full), path };
  });

  const sol: Account[] = solPaths.map(path => {
    const solPriv = deriveSolanaPrivateKey(seed, parsePath(path));
    const pubBytes = solanaPubKey(solPriv);
    const full = base58.encode(pubBytes);
    return { full, short: shortAddr(full), path };
  });

  return { eth, sol };
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
