/**
 * Unified BLE peripheral abstraction for Android + iOS.
 *
 * Android native module: `BleModule`
 *   methods:  startAdvertising(), stopAdvertising(), sendApduResponse(hex)
 *   events:   onApduReceived, onBleLog, onBleStatus ('已连接' | '广播中' | ...)
 *
 * iOS native module: `BLEPeripheralModule`
 *   methods:  startBLEPeripheral(), stopBLEPeripheral(), sendResponse(hex)
 *   events:   onAPDU, onLog, onBLEStatus ('connected' | 'advertising' | ...)
 */
import {
  Platform,
  NativeModules,
  NativeEventEmitter,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';

const { BleModule, BLEPeripheralModule } = NativeModules;

// iOS emitter (only initialised on iOS to avoid errors on Android)
const iosEmitter =
  Platform.OS === 'ios' && BLEPeripheralModule
    ? new NativeEventEmitter(BLEPeripheralModule)
    : null;

// Normalise iOS English status strings → Android Chinese strings so all
// screens can share the same status-checking logic.
function normaliseStatus(s: string): string {
  switch (s) {
    case 'connected':    return '已连接';
    case 'advertising':  return '广播中';
    case 'disconnected': return '广播中'; // keep peripheral alive after disconnect
    case 'stopped':      return '已停止';
    default:             return s;
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────

export function startAdvertising(): void {
  if (Platform.OS === 'ios') {
    BLEPeripheralModule?.startBLEPeripheral();
  } else {
    BleModule?.startAdvertising();
  }
}

export function stopAdvertising(): void {
  if (Platform.OS === 'ios') {
    BLEPeripheralModule?.stopBLEPeripheral();
  } else {
    BleModule?.stopAdvertising();
  }
}

export function sendApduResponse(hexResponse: string): void {
  if (Platform.OS === 'ios') {
    BLEPeripheralModule?.sendResponse(hexResponse);
  } else {
    BleModule?.sendApduResponse(hexResponse);
  }
}

// ── Event subscriptions ───────────────────────────────────────────────────────

export function onApduReceived(
  handler: (hex: string) => void,
): EmitterSubscription {
  if (Platform.OS === 'ios') {
    return iosEmitter!.addListener('onAPDU', handler);
  }
  return DeviceEventEmitter.addListener('onApduReceived', handler);
}

export function onBleLog(
  handler: (msg: string) => void,
): EmitterSubscription {
  if (Platform.OS === 'ios') {
    return iosEmitter!.addListener('onLog', handler);
  }
  return DeviceEventEmitter.addListener('onBleLog', handler);
}

export function onBleStatus(
  handler: (status: string) => void,
): EmitterSubscription {
  if (Platform.OS === 'ios') {
    return iosEmitter!.addListener('onBLEStatus', (s: string) =>
      handler(normaliseStatus(s)),
    );
  }
  return DeviceEventEmitter.addListener('onBleStatus', handler);
}
