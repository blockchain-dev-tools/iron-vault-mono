import type { WalletStorage } from '@iron-vault/wallet';

class LocalStorageWalletStorage implements WalletStorage {
  async getItem(key: string) { return localStorage.getItem(key); }
  async setItem(key: string, value: string) { localStorage.setItem(key, value); }
  async removeItem(key: string) { localStorage.removeItem(key); }
}

export const walletStorage: WalletStorage = new LocalStorageWalletStorage();
