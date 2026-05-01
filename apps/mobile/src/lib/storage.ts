import * as Keychain from 'react-native-keychain';
import type { WalletStorage } from '@iron-vault/wallet';

const SERVICE_PREFIX = 'com.ironvault';

class SecureWalletStorage implements WalletStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({
        service: `${SERVICE_PREFIX}.${key}`,
      });
      return result ? result.password : null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await Keychain.setGenericPassword('v', value, {
      service: `${SERVICE_PREFIX}.${key}`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
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
