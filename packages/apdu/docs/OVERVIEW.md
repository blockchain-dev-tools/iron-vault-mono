# packages/apdu — APDU Handler Overview

## Purpose

`packages/apdu` implements a software emulation of a Ledger Nano X device's APDU command processing layer. It receives raw APDU hex strings (as the real device would over BLE) and produces response hex strings, supporting the complete set of commands required by OKX Wallet, MetaMask, Ledger Live, and other host applications.

## Architecture

```
handleApdu(hexApdu)
    │
    ├─ OS layer (CLA E0 inline)
    │   ├─ OPEN_APP  (E0 D8)
    │   ├─ QUIT_APP  (E0 A7)
    │   └─ handleOs() → GET_VERSION, GET_APP_AND_VERSION, GET_DEVICE_INFO
    │
    ├─ BTC New App  (CLA E1 / F8)  → handleBtc()
    ├─ Tron App     (CLA 0x14)     → handleTron()
    ├─ Sui App      (CLA 0x07)     → handleSui()
    │
    └─ CLA E0 dispatch by currentApp
        ├─ Solana  → handleSol()
        └─ default → handleEth()
```

## Module Structure

| File | Responsibility |
|------|---------------|
| `src/handler.ts` | Public API: `handleApdu`, setters, APDU router |
| `src/handlers/shared.ts` | All mutable state, seed cache, sign sessions, timers |
| `src/handlers/os.ts` | OS-level commands (5 commands) |
| `src/handlers/eth.ts` | Ethereum App — CLA E0 (21 commands) |
| `src/handlers/sol.ts` | Solana App — CLA E0 when currentApp=Solana (7 commands) |
| `src/handlers/btc.ts` | Bitcoin New App — CLA E1 + CONTINUE FSM (7+1 commands) |
| `src/handlers/tron.ts` | Tron App — CLA 0x14 (4 commands) |
| `src/handlers/sui.ts` | Sui App — CLA 0x07 (4 commands) |
| `src/parser.ts` | APDU parsing utilities |
| `src/index.ts` | Package exports |

## Public API

```typescript
// Main entry point
handleApdu(hexApdu: string): Promise<string>

// Configuration setters (call before first APDU)
setCurrentApp(app: string): void            // 'Ethereum' | 'Solana' | 'BOLOS'
setMnemonicProvider(fn: () => Promise<string | null>): void
setSignRequestHandler(fn: ((req: SignRequestData) => Promise<string>) | null): void
setLogFn(fn: (msg: string) => void): void

// State management
clearSignSessions(): void    // abort all pending sign sessions
resetSharedState(): void     // full reset (for testing)

// Inspect last seen metadata
getLastToken(): ERC20Info | null
getLastNft(): NftInfo | null
getLastDomain(): string | null

// Type export
export type { SignRequestData }
```

## Dependency Graph

```
packages/apdu  →  @iron-vault/crypto  (only dependency)
                      ↓
              @noble/curves, @noble/hashes, @scure/bip32, @scure/base
```

`packages/apdu` has **no direct `@noble` or `@scure` imports**. All cryptographic operations are delegated to `packages/crypto`.

## Status Word Reference

| SW | Meaning |
|----|---------|
| `9000` | Success |
| `6d00` | INS not supported |
| `6b00` | Wrong P1/P2 |
| `6700` | Wrong length |
| `6f00` | Internal error |
| `6985` | User rejected (sign request denied) |
| `61XX` | CONTINUE — more data expected (BTC New App) |
