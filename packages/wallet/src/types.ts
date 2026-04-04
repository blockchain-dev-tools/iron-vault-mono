import type { WalletAccounts } from '@iron-vault/crypto';

export type { WalletAccounts };

export interface WalletStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
