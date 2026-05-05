import { setRequestLocale } from 'next-intl/server'
import ThreePanelLayout from '@/components/layout/ThreePanelLayout'
import Bip39Playground from '@/components/crypto/Bip39Playground'

interface Props {
  params: { locale: string }
}

export default function Bip39ToolPage({ params: { locale } }: Props) {
  setRequestLocale(locale)

  const isZh = locale === 'zh'

  return (
    <ThreePanelLayout
      center={
        <article className="px-10 py-8 max-w-3xl">
          <p className="font-label text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">
            {isZh ? '交互工具' : 'Interactive Tool'}
          </p>
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-6">
            {isZh ? 'BIP39 调试器' : 'BIP39 Playground'}
          </h1>

          <div className="prose">
            {isZh ? (
              <>
                <p>
                  这个工具让你探索 BIP39 助记词如何跨多条区块链生成钱包地址。你做的每次更改——输入单词、添加密码短语、调整派生路径——都会立即更新结果。
                </p>

                <h2>使用方法</h2>

                <ol>
                  <li><strong>输入助记词</strong>——手动输入，或点击 <em>生成 12 词</em> / <em>生成 24 词</em> 创建随机短语。</li>
                  <li><strong>添加密码短语（可选）</strong>——这相当于"第 25 个词"，会完全改变所有派生地址。</li>
                  <li><strong>观察结果</strong>——熵、种子和主密钥指纹会自动更新。</li>
                  <li><strong>探索路径</strong>——预设的 ETH、SOL、BTC、TRON 和 Sui 派生路径展示了对应的地址。你还可以添加自定义路径进行实验。</li>
                </ol>

                <h2>你看到的是什么</h2>

                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-on-surface">熵（Entropy）</dt>
                    <dd>生成助记词的原始随机字节。对于手动输入的助记词，这是从单词重建的。</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">种子（Seed）</dt>
                    <dd>64 字节的 BIP39 种子，通过 PBKDF2 从助记词 + 密码短语派生。这是 HD 钱包密钥树的根。</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">指纹（Fingerprint）</dt>
                    <dd>主密钥的 4 字节标识符，用于在导入其他钱包时确认你在正确的密钥树上。</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">派生路径</dt>
                    <dd>HD 密钥树中的"地址"：<code>m / purpose' / coin_type' / account' / change / index</code>。不同路径 = 同一助记词的不同地址。</dd>
                  </div>
                </dl>

                <h2>动手试试</h2>

                <p>
                  生成一个随机助记词，观察地址立即出现。然后尝试更改密码短语——每个地址都会改变，尽管助记词相同。这就是 BIP39 密码短语的力量（也是风险）。
                </p>

                <p>想了解工具背后的概念？</p>
                <ul>
                  <li><a href="/docs/crypto-reference/hd-wallet">什么是分层确定性钱包？</a></li>
                  <li><a href="/docs/crypto-reference/mnemonic-seed">助记词与种子详解</a></li>
                  <li><a href="/docs/crypto-reference/derivation-paths">派生路径指南</a></li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  This tool lets you explore how a BIP39 mnemonic phrase generates wallet addresses
                  across multiple blockchains. Every change you make — typing a word, adding a
                  passphrase, tweaking a derivation path — updates the results immediately.
                </p>

                <h2>How to use it</h2>

                <ol>
                  <li><strong>Enter a mnemonic</strong> — type one manually, or click <em>Generate 12</em> or <em>Generate 24</em> to create a random phrase.</li>
                  <li><strong>Add a passphrase (optional)</strong> — this acts as a &ldquo;25th word&rdquo; and completely changes all derived addresses.</li>
                  <li><strong>Watch the results</strong> — the entropy, seed, and master fingerprint update automatically.</li>
                  <li><strong>Explore paths</strong> — pre-populated derivation paths for ETH, SOL, BTC, TRON, and Sui show you the resulting addresses. Add custom paths to experiment.</li>
                </ol>

                <h2>What you&apos;re seeing</h2>

                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-on-surface">Entropy</dt>
                    <dd>The raw random bytes that generated your mnemonic. For a typed mnemonic, this is reconstructed from the words.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">Seed</dt>
                    <dd>The 64-byte BIP39 seed, derived from your mnemonic + passphrase via PBKDF2. This is the root of the HD wallet tree.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">Fingerprint</dt>
                    <dd>A 4-byte identifier for the master key, useful for verifying you&apos;re on the right tree when importing to other wallets.</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-on-surface">Derivation Path</dt>
                    <dd>The &ldquo;address&rdquo; in the HD tree: <code>m / purpose&apos; / coin_type&apos; / account&apos; / change / index</code>. Different paths = different addresses from the same seed.</dd>
                  </div>
                </dl>

                <h2>Try it</h2>

                <p>
                  Generate a random mnemonic and watch addresses appear. Then try changing the
                  passphrase — every address changes, even though the mnemonic is the same. This
                  is the power (and risk) of the BIP39 passphrase.
                </p>

                <p>
                  Want to understand the concepts behind the tool?
                </p>
                <ul>
                  <li><a href="/docs/crypto-reference/hd-wallet">What is an HD Wallet?</a></li>
                  <li><a href="/docs/crypto-reference/mnemonic-seed">Mnemonic &amp; Seed explained</a></li>
                  <li><a href="/docs/crypto-reference/derivation-paths">Derivation Paths guide</a></li>
                </ul>
              </>
            )}
          </div>
        </article>
      }
      right={<Bip39Playground />}
    />
  )
}
