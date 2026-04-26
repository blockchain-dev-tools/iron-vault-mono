import * as Keychain from 'react-native-keychain';
import type { WalletStorage } from '@iron-vault/wallet';

const SERVICE_PREFIX = 'com.ironvault';

// Keys that require biometric/device-passcode authentication to read.
// Protects against root-level Keychain extraction while the device is unlocked.
const BIOMETRIC_KEYS = new Set(['wallet.mnemonic']);

class SecureWalletStorage implements WalletStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const opts: Keychain.Options = { service: `${SERVICE_PREFIX}.${key}` };
      if (BIOMETRIC_KEYS.has(key)) {
        opts.authenticationPrompt = {
          title: 'Iron Vault',
          subtitle: 'Authenticate to access your wallet',
          cancel: 'Cancel',
        };
      }
      const result = await Keychain.getGenericPassword(opts);
      return result ? result.password : null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const opts: Keychain.Options = {
      service: `${SERVICE_PREFIX}.${key}`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    };
    if (BIOMETRIC_KEYS.has(key)) {
      opts.accessControl = Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE;
    }
    await Keychain.setGenericPassword('v', value, opts);
  }

  async removeItem(key: string): Promise<void> {
    await Keychain.resetGenericPassword({
      service: `${SERVICE_PREFIX}.${key}`,
    });
  }
}

export const walletStorage: WalletStorage = new SecureWalletStorage();

// Mnemonic convenience helpers — stored at key 'wallet.mnemonic'
export async function storeMnemonic(mnemonic: string): Promise<void> {
  await walletStorage.setItem('wallet.mnemonic', mnemonic);
}

export async function loadMnemonic(): Promise<string | null> {
  return walletStorage.getItem('wallet.mnemonic');
}

export async function hasMnemonic(): Promise<boolean> {
  return (await walletStorage.getItem('wallet.mnemonic')) !== null;
}

export async function clearMnemonic(): Promise<void> {
  await walletStorage.removeItem('wallet.mnemonic');
}
