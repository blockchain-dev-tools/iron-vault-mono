import { frameAPDU, unframeResponse } from '@iron-vault/apdu';
export { frameAPDU, unframeResponse };

// Ledger BLE GATT profile UUIDs
export const SERVICE_UUID = '13d63400-2c97-0004-0000-4c6564676572';
export const NOTIFY_UUID  = '13d63400-2c97-0004-0001-4c6564676572';
export const WRITE_UUID   = '13d63400-2c97-0004-0002-4c6564676572';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BleTransport {
  device: BluetoothDevice;
  write: BluetoothRemoteGATTCharacteristic;
  notify: BluetoothRemoteGATTCharacteristic;
  exchange: (apdu: Uint8Array) => Promise<Uint8Array>;
  disconnect: () => void;
}

export interface ScannedDevice {
  device: BluetoothDevice;
  name: string;
  rssi: number | null;
  isLedger: boolean;
  uuids: string[];
}

export type BleLogFn = (dir: 'tx' | 'rx' | 'info', hex: string, label?: string) => void;

// ── Scanning ──────────────────────────────────────────────────────────────────

export async function scanDevices(
  onFound: (d: ScannedDevice) => void,
  durationMs = 6000,
): Promise<() => void> {
  const bt = navigator.bluetooth as any;
  if (!bt.requestLEScan) throw new Error('NO_SCAN_API');

  const seen = new Map<string, ScannedDevice>();

  const handler = (e: Event) => {
    const ev = e as any;
    const device: BluetoothDevice = ev.device;
    const uuids: string[] = ev.uuids ?? [];
    const isLedger = uuids.some(
      (u: string) => u.toLowerCase() === SERVICE_UUID.toLowerCase(),
    );
    const entry: ScannedDevice = {
      device,
      name: device.name ?? 'Unknown',
      rssi: ev.rssi ?? null,
      isLedger,
      uuids,
    };
    seen.set(device.id, entry);
    onFound(entry);
  };

  bt.addEventListener('advertisementreceived', handler);
  const scan = await bt.requestLEScan({ acceptAllAdvertisements: true });

  const stop = () => {
    try { scan.stop(); } catch {}
    bt.removeEventListener('advertisementreceived', handler);
  };

  setTimeout(stop, durationMs);
  return stop;
}

// ── Connection ────────────────────────────────────────────────────────────────

export async function connectLedgerBle(
  onLog: BleLogFn,
  existingDevice?: BluetoothDevice,
): Promise<BleTransport> {
  const device = existingDevice ?? await navigator.bluetooth.requestDevice({
    filters: [{ services: [SERVICE_UUID] }],
    optionalServices: [SERVICE_UUID],
  });

  onLog('info', '', `连接中: ${device.name ?? 'Unknown'}`);

  const server  = await device.gatt!.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const write   = await service.getCharacteristic(WRITE_UUID);
  const notify  = await service.getCharacteristic(NOTIFY_UUID);
  await notify.startNotifications();

  onLog('info', '', `已连接 ✓  设备: ${device.name ?? device.id}`);

  let resolveResponse: ((v: Uint8Array) => void) | null = null;
  let rejectResponse:  ((e: Error) => void) | null = null;
  const pending: Uint8Array[] = [];
  let expectedLen = 0;

  notify.addEventListener('characteristicvaluechanged', (e: Event) => {
    const target = e.target as BluetoothRemoteGATTCharacteristic;
    const chunk = new Uint8Array(target.value!.buffer);
    onLog('rx', toHex(chunk));

    if (pending.length === 0) {
      expectedLen = (chunk[5] << 8) | chunk[6];
    }
    pending.push(chunk);

    let received = 0;
    for (let i = 0; i < pending.length; i++) {
      received += pending[i].length - (i === 0 ? 7 : 5);
    }
    if (received >= expectedLen && resolveResponse) {
      const resp = unframeResponse([...pending]);
      pending.length = 0;
      expectedLen = 0;
      resolveResponse(resp);
      resolveResponse = null;
      rejectResponse  = null;
    }
  });

  const exchange = async (apdu: Uint8Array): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      resolveResponse = resolve;
      rejectResponse  = reject;

      const frames = frameAPDU(apdu);
      (async () => {
        for (const frame of frames) {
          onLog('tx', toHex(frame));
          await write.writeValueWithResponse(frame.buffer as ArrayBuffer);
        }
      })().catch(err => {
        rejectResponse?.(err);
        resolveResponse = null;
        rejectResponse  = null;
      });

      setTimeout(() => {
        if (rejectResponse) {
          rejectResponse(new Error('Response timeout'));
          resolveResponse = null;
          rejectResponse  = null;
          pending.length  = 0;
        }
      }, 10_000);
    });
  };

  const disconnect = () => device.gatt?.disconnect();
  device.addEventListener('gattserverdisconnected', () =>
    onLog('info', '', '⚠️  设备已断开'),
  );

  return { device, write, notify, exchange, disconnect };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2) throw new Error('Odd-length hex string');
  const arr = new Uint8Array(clean.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}
