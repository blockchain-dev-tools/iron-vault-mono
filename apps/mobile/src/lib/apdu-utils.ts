/** APDU command name decoder — used by the BLE session activity log. */

function parseBip32PathStr(dataHex: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < dataHex.length; i += 2)
    bytes.push(parseInt(dataHex.slice(i, i + 2), 16));
  if (bytes.length < 1) return '';
  const depth = bytes[0];
  const parts: string[] = [];
  for (let i = 0; i < depth; i++) {
    const off = 1 + i * 4;
    if (off + 4 > bytes.length) break;
    const val = ((bytes[off] << 24) | (bytes[off+1] << 16) | (bytes[off+2] << 8) | bytes[off+3]) >>> 0;
    const hardened = (val & 0x80000000) !== 0;
    parts.push((val & 0x7fffffff) + (hardened ? "'" : ''));
  }
  return parts.length ? 'm/' + parts.join('/') : '';
}

export function apduName(hex: string): string {
  const h = hex.replace(/\s/g, '').toUpperCase();
  const cla = h.slice(0, 2);
  const ins = h.slice(2, 4);
  const dataHex = h.length > 10 ? h.slice(10) : '';
  if (cla === 'E0') {
    if (ins === '01') return 'GET_VERSION';
    if (ins === '02') {
      const p = parseBip32PathStr(dataHex);
      return p ? `GET_ETH_ADDRESS ${p}` : 'GET_ETH_ADDRESS';
    }
    if (ins === '04') return 'SIGN_ETH_TX';
    if (ins === '05') {
      const p = parseBip32PathStr(dataHex);
      return p ? `GET_SOL_PUBKEY ${p}` : 'GET_SOL_PUBKEY';
    }
    if (ins === '06') return 'SIGN_SOL_MSG';
    if (ins === 'D8') {
      const appName = dataHex ? Buffer.from(dataHex, 'hex').toString('utf8') : '';
      return appName ? `OPEN_APP(${appName})` : 'OPEN_APP';
    }
  }
  if (cla === 'B0' && ins === '01') return 'GET_APP_VERSION';
  if (cla === 'E1') return 'BTC(unsupported)';
  return `CLA=${cla} INS=${ins}`;
}
