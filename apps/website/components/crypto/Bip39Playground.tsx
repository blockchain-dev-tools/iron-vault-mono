'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  generateMnemonic,
  validateMnemonic,
  mnemonicToSeed,
  mnemonicToEntropy,
  deriveAccountsFromPaths,
  btcMasterFingerprint,
} from '@iron-vault/crypto'
import type { WalletAccounts, Account } from '@iron-vault/crypto'

function toHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const ALL_CHAINS = ['eth', 'sol', 'btc', 'tron', 'sui'] as const
type ChainKey = (typeof ALL_CHAINS)[number]

const CHAIN_LABELS: Record<ChainKey, string> = {
  eth: 'ETH',
  sol: 'SOL',
  btc: 'BTC',
  tron: 'TRON',
  sui: 'SUI',
}

const DEFAULT_PATHS: Record<ChainKey, string[]> = {
  eth: ["m/44'/60'/0'/0/0", "m/44'/60'/0'/0/1"],
  sol: ["m/44'/501'/0'/0'", "m/44'/501'/1'/0'"],
  btc: ["m/84'/0'/0'/0/0", "m/84'/0'/0'/0/1"],
  tron: ["m/44'/195'/0'/0/0"],
  sui: ["m/44'/784'/0'/0'/0'"],
}

export default function Bip39Playground() {
  const [mnemonic, setMnemonic] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [entropy, setEntropy] = useState<string | null>(null)
  const [seed, setSeed] = useState<string | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<WalletAccounts | null>(null)
  const [computing, setComputing] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)
  const [customPaths, setCustomPaths] = useState<Record<ChainKey, string[]>>(
    () => Object.fromEntries(ALL_CHAINS.map((c) => [c, []])) as unknown as Record<ChainKey, string[]>,
  )
  const [customForm, setCustomForm] = useState<{
    open: boolean
    chain: ChainKey
    path: string
  }>({
    open: false,
    chain: 'eth',
    path: '',
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customPathsRef = useRef(customPaths)
  customPathsRef.current = customPaths

  // ── Build path config from defaults + custom paths ────────────────────────

  const buildPathConfig = useCallback((cp: Record<ChainKey, string[]>) => {
    const mkCustom = (defaultCount: number, extra: string[]) =>
      Array.from({ length: defaultCount }, () => false).concat(extra.map(() => true))

    return {
      eth: { paths: [...DEFAULT_PATHS.eth, ...cp.eth], custom: mkCustom(DEFAULT_PATHS.eth.length, cp.eth) },
      sol: { paths: [...DEFAULT_PATHS.sol, ...cp.sol], custom: mkCustom(DEFAULT_PATHS.sol.length, cp.sol) },
      btc: { paths: [...DEFAULT_PATHS.btc, ...cp.btc], custom: mkCustom(DEFAULT_PATHS.btc.length, cp.btc) },
      tron: { paths: [...DEFAULT_PATHS.tron, ...cp.tron], custom: mkCustom(DEFAULT_PATHS.tron.length, cp.tron) },
      sui: { paths: [...DEFAULT_PATHS.sui, ...cp.sui], custom: mkCustom(DEFAULT_PATHS.sui.length, cp.sui) },
    }
  }, [])

  // ── Derive everything ─────────────────────────────────────────────────────

  const computeAll = useCallback(
    async (m: string, p: string, cp: Record<ChainKey, string[]>) => {
      const trimmed = m.trim()
      if (!trimmed) {
        setEntropy(null); setSeed(null); setFingerprint(null); setAccounts(null); setValid(null)
        return
      }

      const isValid = validateMnemonic(trimmed)
      setValid(isValid)
      if (!isValid) {
        setEntropy(null); setSeed(null); setFingerprint(null); setAccounts(null)
        return
      }

      setComputing(true)

      try {
        const ent = mnemonicToEntropy(trimmed)
        setEntropy('0x' + toHex(ent))

        const s = await mnemonicToSeed(trimmed, p)
        setSeed('0x' + toHex(s))

        const fp = btcMasterFingerprint(s)
        setFingerprint('0x' + toHex(fp))

        const pathConfig = buildPathConfig(cp)
        const accts = await deriveAccountsFromPaths({
          mnemonic: trimmed,
          passphrase: p,
          ...pathConfig,
        })
        setAccounts(accts)
      } finally {
        setComputing(false)
      }
    },
    [buildPathConfig],
  )

  // ── Debounced derivation on mnemonic / passphrase change ──────────────────

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      computeAll(mnemonic, passphrase, customPathsRef.current)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mnemonic, passphrase, computeAll])

  // ── Re-derive when custom paths change (immediate) ────────────────────────

  useEffect(() => {
    const trimmed = mnemonic.trim()
    if (!trimmed || !validateMnemonic(trimmed)) return
    computeAll(mnemonic, passphrase, customPaths)
  }, [customPaths, mnemonic, passphrase, computeAll])

  const handleGenerate = (strength: 128 | 256) => {
    const m = generateMnemonic(strength)
    setMnemonic(m)
  }

  const addCustomPath = () => {
    const { chain, path } = customForm
    const trimmed = path.trim()
    if (!trimmed) return

    setCustomPaths((prev) => {
      if (prev[chain].includes(trimmed)) return prev
      return { ...prev, [chain]: [...prev[chain], trimmed] }
    })
    setCustomForm({ open: false, chain: 'eth', path: '' })
  }

  const showDetails = valid === true
  const hasAccounts = accounts != null

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="flex-shrink-0 px-3 pt-3 pb-2 space-y-2 border-b border-outline-variant">
        <div>
          <label className="block font-label text-xs text-on-surface-variant mb-1">
            Mnemonic (BIP-39)
          </label>
          <textarea
            value={mnemonic}
            onChange={(e) => setMnemonic(e.target.value)}
            rows={3}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:border-primary transition-colors"
            placeholder="Enter your 12 or 24 word mnemonic phrase..."
          />
          {valid === false && (
            <p className="font-label text-xs text-error mt-1">
              Invalid mnemonic — check spelling and word count
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerate(128)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-label text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">casino</span>
            <span>12 words</span>
          </button>
          <button
            onClick={() => handleGenerate(256)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-label text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">casino</span>
            <span>24 words</span>
          </button>
          <div className="flex items-center gap-1 px-2 py-1.5 border border-outline-variant rounded-lg text-xs font-label text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">translate</span>
            <span>en</span>
          </div>
        </div>

        <div>
          <label className="block font-label text-xs text-on-surface-variant mb-1">
            Passphrase (optional)
          </label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
            placeholder="BIP-39 passphrase (leave empty for none)"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {!showDetails && mnemonic.trim() && !computing && (
          <p className="text-xs text-on-surface-variant text-center py-4">
            Enter a valid mnemonic to see derived keys
          </p>
        )}
        {computing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="material-symbols-outlined text-primary text-base animate-spin">
              progress_activity
            </span>
            <span className="text-xs text-on-surface-variant">Computing...</span>
          </div>
        )}

        {showDetails && !computing && (
          <>
            <div>
              <h3 className="font-label text-xs text-on-surface-variant uppercase tracking-wide mb-2">
                Details
              </h3>
              <div className="space-y-2">
                <DetailRow label="Entropy" value={entropy} />
                <DetailRow label="Seed" value={seed} />
                <DetailRow label="Fingerprint" value={fingerprint} />
              </div>
            </div>

            <div>
              <h3 className="font-label text-xs text-on-surface-variant uppercase tracking-wide mb-2">
                Derived Addresses
              </h3>

              {hasAccounts &&
                ALL_CHAINS.map((chain) => {
                  const chainAccounts = accounts[chain]
                  if (!chainAccounts || chainAccounts.length === 0) return null
                  return (
                    <div key={chain} className="mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-label font-semibold bg-surface-container text-primary">
                          {CHAIN_LABELS[chain]}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {chainAccounts.map((acct: Account, i: number) => (
                          <div
                            key={`${chain}-${i}`}
                            className="flex items-start gap-2 bg-surface-container rounded-lg px-2.5 py-1.5"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-[11px] text-on-surface leading-tight break-all">
                                {acct.full}
                              </p>
                              <p className="font-mono text-[10px] text-on-surface-variant mt-0.5 leading-tight">
                                {acct.path}
                                {acct.custom && (
                                  <span className="ml-1 text-primary">(custom)</span>
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(acct.full)}
                              className="flex-shrink-0 mt-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
                              title="Copy address"
                            >
                              <span className="material-symbols-outlined text-sm">
                                content_copy
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>

            {customForm.open ? (
              <div className="bg-surface-container rounded-lg p-2.5 space-y-2 border border-outline-variant">
                <div className="flex items-center gap-2">
                  <select
                    value={customForm.chain}
                    onChange={(e) =>
                      setCustomForm((f) => ({ ...f, chain: e.target.value as ChainKey }))
                    }
                    className="bg-surface-container border border-outline-variant rounded px-2 py-1 text-xs font-label text-on-surface focus:outline-none focus:border-primary"
                  >
                    {ALL_CHAINS.map((c) => (
                      <option key={c} value={c}>
                        {CHAIN_LABELS[c]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customForm.path}
                    onChange={(e) => setCustomForm((f) => ({ ...f, path: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustomPath()
                    }}
                    className="flex-1 bg-surface-container border border-outline-variant rounded px-2 py-1 font-mono text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                    placeholder="m/44'/60'/0'/0/1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setCustomForm({ open: false, chain: 'eth', path: '' })}
                    className="px-3 py-1 text-xs font-label text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCustomPath}
                    disabled={!customForm.path.trim()}
                    className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-label font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCustomForm({ open: true, chain: 'eth', path: '' })}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-outline-variant rounded-lg text-xs font-label text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add Custom Path</span>
              </button>
            )}
          </>
        )}

        {!mnemonic.trim() && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">
              key
            </span>
            <p className="text-xs text-on-surface-variant text-center max-w-[240px]">
              Generate a mnemonic or paste one above to inspect derived keys and addresses
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-surface-container rounded-lg px-2.5 py-1.5">
      <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className="font-mono text-[11px] text-on-surface leading-tight break-all"
        title={value ?? ''}
      >
        {value ?? '\u2014'}
      </p>
    </div>
  )
}
