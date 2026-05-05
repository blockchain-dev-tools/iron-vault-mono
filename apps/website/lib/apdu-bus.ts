import { create } from 'zustand'

interface PendingRequest {
  id: string
  hex: string
  resolve: (responseHex: string) => void
  reject: (reason: string) => void
}

interface ApduBusState {
  pendingRequest: Omit<PendingRequest, 'resolve' | 'reject'> | null
  _pending: PendingRequest | null

  /** Called by debugger to send a command. Returns response hex. */
  dispatch(hex: string): Promise<string>

  /** Send multiple commands sequentially with optional interval (ms). Useful for multi-frame replay. */
  dispatchSequence(hexes: string[], intervalMs?: number): Promise<string[]>

  /** Called by simulator panel when it has processed the command */
  resolve(id: string, responseHex: string): void

  /** Called by simulator panel on error */
  reject(id: string, reason: string): void
}

let _idCounter = 0

export const useApduBus = create<ApduBusState>((set, get) => ({
  pendingRequest: null,
  _pending: null,

  dispatch(hex) {
    return new Promise<string>((resolve, reject) => {
      const id = String(++_idCounter)
      const pending: PendingRequest = { id, hex, resolve, reject }
      set({ pendingRequest: { id, hex }, _pending: pending })
    })
  },

  async dispatchSequence(hexes, intervalMs = 500) {
    const responses: string[] = []
    for (const hex of hexes) {
      const resp = await get().dispatch(hex)
      responses.push(resp)
      if (intervalMs > 0) {
        await new Promise(r => setTimeout(r, intervalMs))
      }
    }
    return responses
  },

  resolve(id, responseHex) {
    const pending = get()._pending
    if (pending && pending.id === id) {
      set({ pendingRequest: null, _pending: null })
      pending.resolve(responseHex)
    }
  },

  reject(id, reason) {
    const pending = get()._pending
    if (pending && pending.id === id) {
      set({ pendingRequest: null, _pending: null })
      pending.reject(reason)
    }
  },
}))
