import { describe, it, expect, beforeEach } from 'vitest'
import { createSimulatorBridge } from '../lib/apdu-bridge'
import { clearSignSessions } from '@iron-vault/apdu'

// Standard BIP-39 test mnemonic — derives known addresses
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'

beforeEach(() => {
  clearSignSessions()
})

describe('createSimulatorBridge', () => {
  it('responds to GET_VERSION (E0 01)', async () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC })
    const response = await bridge.injectApdu('e001000000')
    // Response ends with 9000 status
    expect(response.endsWith('9000')).toBe(true)
    // First 4 bytes are target_id = 0x33000004
    expect(response.startsWith('33000004')).toBe(true)
  })

  it('initial state is unlocked when initialUnlocked=true', () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC, initialUnlocked: true })
    expect(bridge.getState().screen).toBe('unlocked')
  })

  it('initial state is locked by default', () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC })
    expect(bridge.getState().screen).toBe('locked')
  })

  it('OPEN_APP (E0 D8) transitions state to unlocked', async () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC })
    // E0 D8 00 00 08 "Ethereum" — 45 74 68 65 72 65 75 6d
    await bridge.injectApdu('e0d8000008457468657265756d')
    expect(bridge.getState().screen).toBe('unlocked')
  })

  it('reset returns state to locked', async () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC, initialUnlocked: true })
    expect(bridge.getState().screen).toBe('unlocked')
    bridge.reset()
    expect(bridge.getState().screen).toBe('locked')
  })

  it('GET_ETH_ADDRESS returns pubkey+address ending in 9000', async () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC, initialUnlocked: true })
    // E0 02 00 00 Lc [path: 5 components m/44'/60'/0'/0/0]
    // Path bytes: 05 8000002c 8000003c 80000000 00000000 00000000 = 21 bytes = 0x15
    const pathData = '058000002c8000003c800000000000000000000000'
    const lc = (pathData.length / 2).toString(16).padStart(2, '0')
    const apdu = `e0020000${lc}${pathData}`
    const response = await bridge.injectApdu(apdu)
    expect(response.endsWith('9000')).toBe(true)
    // pubkey_len(1) + pubkey(65) + addr_len(1) + addr_ascii(40) + status(2) = 109 bytes = 218 hex chars
    expect(response.length).toBeGreaterThanOrEqual(218)
  })

  it('onStateChange fires callback on state transition', async () => {
    const bridge = createSimulatorBridge({ mnemonic: TEST_MNEMONIC })
    const states: string[] = []
    const unsub = bridge.onStateChange(s => states.push(s.screen))
    await bridge.injectApdu('e0d8000008457468657265756d')
    bridge.reset()
    unsub()
    expect(states).toContain('unlocked')
    expect(states[states.length - 1]).toBe('locked')
  })
})
