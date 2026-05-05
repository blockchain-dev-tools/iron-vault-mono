import { CLA, INS } from './constants';
import { bytesToHex } from './parser';

export interface ApduPresetFieldInfo {
  cla: number;
  ins: number;
  insName: string;
  p1: number;
  p2: number;
  dataDescription: string;
}

export interface ApduPreset {
  label: string;
  hex: string;
  group: string;
  chain: string;
  description: string;
  fields: ApduPresetFieldInfo;
  references?: string[];
}

export const APDU_PRESETS: ApduPreset[] = [
  // ── System ──────────────────────────────────────────────────────
  {
    label: 'GET_VERSION',
    hex: 'e001000000',
    group: 'System',
    chain: 'os',
    description: 'Get the current app version (name + major.minor.patch).',
    fields: { cla: CLA.APP, ins: INS.GET_VERSION, insName: 'GET_VERSION', p1: 0x00, p2: 0x00, dataDescription: 'empty' },
  },
  {
    label: 'GET_APP_AND_VERSION',
    hex: 'b001000000',
    group: 'System',
    chain: 'os',
    description: 'Get the running app name and version (Ledger global command).',
    fields: { cla: CLA.GLOBAL, ins: INS.GET_APP_AND_VERSION, insName: 'GET_APP_AND_VERSION', p1: 0x00, p2: 0x00, dataDescription: 'empty' },
  },
  {
    label: 'OPEN_APP (Ethereum)',
    hex: 'e0d8000008457468657265756d',
    group: 'System',
    chain: 'os',
    description: 'Switch the active app to Ethereum. Data is the ASCII app name.',
    fields: { cla: CLA.APP, ins: INS.OPEN_APP, insName: 'OPEN_APP', p1: 0x00, p2: 0x00, dataDescription: '"Ethereum" (8 bytes)' },
  },
  {
    label: 'OPEN_APP (Solana)',
    hex: 'e0d8000006536f6c616e61',
    group: 'System',
    chain: 'os',
    description: 'Switch the active app to Solana.',
    fields: { cla: CLA.APP, ins: INS.OPEN_APP, insName: 'OPEN_APP', p1: 0x00, p2: 0x00, dataDescription: '"Solana" (6 bytes)' },
  },
  {
    label: 'PROVIDE_ERC20_TOKEN_INFO (USDC, mainnet)',
    hex: 'e00a00001f0455534443206a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000100',
    group: 'System',
    chain: 'ethereum',
    description: 'Provide ERC-20 token metadata to the ETH app (ticker, contract address, decimals).',
    fields: { cla: CLA.APP, ins: INS.ETH_PROVIDE_ERC20, insName: 'PROVIDE_ERC20_TOKEN_INFO', p1: 0x00, p2: 0x00, dataDescription: 'USDC / 0xA0b8... / 6 decimals' },
  },

  // ── Ethereum ─────────────────────────────────────────────────────
  {
    label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/0)",
    hex: 'e002000015058000002c8000003c800000000000000000000000',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Get the first Ethereum address from BIP-32 path 44/60/0/0/0.',
    fields: { cla: CLA.APP, ins: INS.ETH_GET_ADDRESS, insName: 'GET_ETH_ADDRESS', p1: 0x00, p2: 0x00, dataDescription: 'BIP32: 44/60/0/0/0 (21 bytes)' },
  },
  {
    label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/1)",
    hex: 'e002000015058000002c8000003c800000000000000000000001',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Get the second Ethereum address from BIP-32 path 44/60/0/0/1.',
    fields: { cla: CLA.APP, ins: INS.ETH_GET_ADDRESS, insName: 'GET_ETH_ADDRESS', p1: 0x00, p2: 0x00, dataDescription: 'BIP32: 44/60/0/0/1 (21 bytes)' },
  },
  {
    label: "GET_ETH_ADDRESS (m/44'/60'/0'/0/2)",
    hex: 'e002000015058000002c8000003c800000000000000000000002',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Get the third Ethereum address from BIP-32 path 44/60/0/0/2.',
    fields: { cla: CLA.APP, ins: INS.ETH_GET_ADDRESS, insName: 'GET_ETH_ADDRESS', p1: 0x00, p2: 0x00, dataDescription: 'BIP32: 44/60/0/0/2 (21 bytes)' },
  },
  {
    label: 'SIGN_ETH_TX (0.001 ETH → vitalik.eth, EIP-1559)',
    hex: 'e004000046058000002c8000003c80000000000000000000000002ef0180843b9aca008502540be40082520894d8da6bf26964af9d7eed9e03e53415d37aa9604587038d7ea4c6800080c0',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Sign an EIP-1559 transaction (0.001 ETH to vitalik.eth address). Multi-chunk: first frame with BIP32 path.',
    fields: { cla: CLA.APP, ins: INS.ETH_SIGN_TX, insName: 'SIGN_ETH_TX', p1: 0x00, p2: 0x00, dataDescription: 'BIP32 path + RLP-encoded EIP-1559 tx (70 bytes)' },
  },
  {
    label: 'SIGN_PERSONAL_MESSAGE ("Hello, IRON Vault!")',
    hex: 'e008000030058000002c8000003c8000000000000000000000000000001748656c6c6f2c2049524f4e205661756c7421',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Sign an EIP-191 personal message. Data: BIP32 path + message length + "Hello, IRON Vault!".',
    fields: { cla: CLA.APP, ins: INS.ETH_SIGN_PERSONAL_MSG, insName: 'SIGN_PERSONAL_MESSAGE', p1: 0x00, p2: 0x00, dataDescription: 'BIP32 path + "Hello, IRON Vault!" (48 bytes)' },
  },
  {
    label: 'SIGN_EIP_712_MESSAGE (sample typed data)',
    hex: 'e00c000055058000002c8000003c800000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    group: 'Ethereum',
    chain: 'ethereum',
    description: 'Sign an EIP-712 typed structured data message. Complex multi-chunk protocol.',
    fields: { cla: CLA.APP, ins: INS.ETH_SIGN_EIP712, insName: 'SIGN_EIP_712', p1: 0x00, p2: 0x00, dataDescription: 'BIP32 path + domain hash + message hash (85 bytes)' },
  },

  // ── Solana ───────────────────────────────────────────────────────
  {
    label: "GET_SOLANA_PUBKEY (m/44'/501'/0'/0')",
    hex: 'e005000011048000002c800001f58000000080000000',
    group: 'Solana',
    chain: 'solana',
    description: 'Get the first Solana pubkey from SLIP-10 path 44/501/0/0\'.',
    fields: { cla: CLA.APP, ins: INS.SOL_GET_PUBKEY, insName: 'GET_SOLANA_PUBKEY', p1: 0x00, p2: 0x00, dataDescription: 'BIP32: 44/501/0/0\' (17 bytes)' },
  },
  {
    label: "GET_SOLANA_PUBKEY (m/44'/501'/0'/1')",
    hex: 'e005000011048000002c800001f58000000080000001',
    group: 'Solana',
    chain: 'solana',
    description: 'Get the second Solana pubkey from SLIP-10 path 44/501/0/1\'.',
    fields: { cla: CLA.APP, ins: INS.SOL_GET_PUBKEY, insName: 'GET_SOLANA_PUBKEY', p1: 0x00, p2: 0x00, dataDescription: 'BIP32: 44/501/0/1\' (17 bytes)' },
  },
  {
    label: 'SIGN_SOLANA_MESSAGE ("Hello Solana")',
    hex: 'e00601001d048000002c800001f5800000008000000048656c6c6f20536f6c616e61',
    group: 'Solana',
    chain: 'solana',
    description: 'Sign a Solana message. P1=0x01 indicates first chunk with BIP32 path.',
    fields: { cla: CLA.APP, ins: INS.SOL_SIGN_MSG, insName: 'SIGN_SOLANA_MESSAGE', p1: 0x01, p2: 0x00, dataDescription: 'num_signers(1) + BIP32 path + "Hello Solana" (29 bytes)' },
  },
];
