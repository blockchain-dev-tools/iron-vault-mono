// Pure HD derivation helpers — no React/RN dependencies.

export function buildDefaultPath(chain: 'eth' | 'sol', idx: number): string {
  return chain === 'eth'
    ? `m/44'/60'/0'/0/${idx}`
    : `m/44'/501'/${idx}'/0'`;
}

export function parseDefaultIndex(chain: 'eth' | 'sol', path: string): number {
  const segs = path.split('/');
  if (chain === 'eth') return parseInt(segs[segs.length - 1], 10);
  return parseInt(segs[3].replace("'", ''), 10);
}

export function isDefaultPath(chain: 'eth' | 'sol', path: string): boolean {
  const re = chain === 'eth'
    ? /^m\/44'\/60'\/0'\/0\/\d+$/
    : /^m\/44'\/501'\/\d+'\/0'$/;
  return re.test(path);
}

export function computeNextDefaultPath(
  chain: 'eth' | 'sol',
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
