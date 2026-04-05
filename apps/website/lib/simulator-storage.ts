import type { WalletStorage } from '@iron-vault/wallet'

/** In-memory WalletStorage for the devtools simulator.
 *  Uses localStorage if available (browser), falls back to a plain Map.
 */
class DevtoolsWalletStorage implements WalletStorage {
  private store = new Map<string, string>()

  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`devtools.${key}`)
    }
    return this.store.get(key) ?? null
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`devtools.${key}`, value)
    } else {
      this.store.set(key, value)
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`devtools.${key}`)
    } else {
      this.store.delete(key)
    }
  }
}

export const devtoolsStorage: WalletStorage = new DevtoolsWalletStorage()
