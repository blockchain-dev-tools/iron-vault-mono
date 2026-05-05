import type { SimulatorBridge } from '@iron-vault/simulator';
import { fromHex, toHex } from './ble-transport';

export interface ApduTransport {
  exchange(hex: string): Promise<string>;
  isConnected(): boolean;
  disconnect(): void;
}

export function createSimulatorTransport(bridge: SimulatorBridge): ApduTransport {
  return {
    async exchange(hex: string): Promise<string> {
      return bridge.injectApdu(hex);
    },
    isConnected() {
      return true;
    },
    disconnect() {
      bridge.reset();
    },
  };
}

export function createBleTransport(
  exchangeRaw: (apdu: Uint8Array) => Promise<Uint8Array>,
  disconnectFn: () => void,
): ApduTransport {
  let connected = true;

  return {
    async exchange(hex: string): Promise<string> {
      const apdu = fromHex(hex);
      const response = await exchangeRaw(apdu);
      return toHex(response).replace(/\s+/g, '');
    },
    isConnected() {
      return connected;
    },
    disconnect() {
      connected = false;
      disconnectFn();
    },
  };
}

export { type SimulatorBridge } from '@iron-vault/simulator';
