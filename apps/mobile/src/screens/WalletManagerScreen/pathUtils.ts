// Pure HD derivation helpers — no React/RN dependencies.
import type { Chain } from '@iron-vault/wallet';

export function buildDefaultPath(chain: Chain, idx: number): string {
  switch (chain) {
    case 'eth':  return `m/44'/60'/0'/0/${idx}`;
    case 'sol':  return `m/44'/501'/${idx}'/0'`;
    case 'btc':  return `m/84'/0'/${idx}'/0/0`;
    case 'tron': return `m/44'/195'/0'/0/${idx}`;
    case 'sui':  return `m/44'/784'/${idx}'/0'/0'`;
  }
}

export function parseDefaultIndex(chain: Chain, path: string): number {
  const segs = path.split('/');
  switch (chain) {
    case 'eth':  return parseInt(segs[segs.length - 1], 10);           // last segment
    case 'sol':  return parseInt(segs[3].replace("'", ''), 10);        // m/44'/501'/{i}'/0'
    case 'btc':  return parseInt(segs[3].replace("'", ''), 10);        // m/84'/0'/{i}'/0/0
    case 'tron': return parseInt(segs[segs.length - 1], 10);           // last segment
    case 'sui':  return parseInt(segs[3].replace("'", ''), 10);        // m/44'/784'/{i}'/0'/0'
  }
}

export function isDefaultPath(chain: Chain, path: string): boolean {
  const re: Record<Chain, RegExp> = {
    eth:  /^m\/44'\/60'\/0'\/0\/\d+$/,
    sol:  /^m\/44'\/501'\/\d+'\/0'$/,
    btc:  /^m\/84'\/0'\/\d+'\/0\/0$/,
    tron: /^m\/44'\/195'\/0'\/0\/\d+$/,
    sui:  /^m\/44'\/784'\/\d+'\/0'\/0'$/,
  };
  return re[chain].test(path);
}

export function computeNextDefaultPath(
  chain: Chain,
  accts: { path: string; custom: boolean }[],
): string {
  const defaults = accts.filter(a => !a.custom && isDefaultPath(chain, a.path));
  const maxIdx = defaults.length > 0
    ? Math.max(...defaults.map(a => parseDefaultIndex(chain, a.path)))
    : -1;
  const allPaths = new Set(accts.map(a => a.path));
  let idx = maxIdx + 1;
  while (allPaths.has(buildDefaultPath(chain, idx))) idx++;
  return buildDefaultPath(chain, idx);
}
