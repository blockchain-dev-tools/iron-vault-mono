## 问题描述

Solana 地址疑似错误，排查原因。

## 排查结论

**Rust SDK 的 Solana 地址推导完全正确。** 使用官方 JS 库 (`micro-ed25519-hdkey` + `@solana/kit`) 的测试用例与 Rust SDK 的输出全部 10 个地址完全一致。

测试助记词：`neither lonely flavor argue grass remind eye tag avocado spot unusual intact`
路径格式：`m/44'/501'/{i}'/0'`

对比结果：

| 路径 | 官方 JS | Rust SDK | 结果 |
|---|---|---|---|
| `m/44'/501'/0'/0'` | `5vftMkHL72JaJG6ExQfGAsT2uGVHpRR7oTNUPMs68Y2N` | 相同 | ✅ |
| `m/44'/501'/1'/0'` | `GcXbfQ5yY3uxCyBNDPBbR5FjumHf89E7YHXuULfGDBBv` | 相同 | ✅ |
| `m/44'/501'/2'/0'` | `7QPgyQwNLqnoSwHEuK8wKy2Y3Ani6EHoZRihTuWkwxbc` | 相同 | ✅ |
| `m/44'/501'/3'/0'` | `5aE8UprEEWtpVskhxo3f8ETco2kVKiZT9SS3D5Lcg8s2` | 相同 | ✅ |
| `m/44'/501'/4'/0'` | `5n6afo6LZmzH1J4R38ZCaNSwaztLjd48nWwToLQkCHxp` | 相同 | ✅ |
| `m/44'/501'/5'/0'` | `2Gr1hWnbaqGXMghicSTHncqV7GVLLddNFJDC7YJoso8M` | 相同 | ✅ |
| `m/44'/501'/6'/0'` | `BNMDY3tCyYbayMzBjZm8RW59unpDWcQRfVmWXCJhLb7D` | 相同 | ✅ |
| `m/44'/501'/7'/0'` | `9CySTpi4iC85gMW6G4BMoYbNBsdyJrfseHoGmViLha63` | 相同 | ✅ |
| `m/44'/501'/8'/0'` | `ApteF7PmUWS8Lzm6tJPkWgrxSFW5LwYGWCUJ2ByAec91` | 相同 | ✅ |
| `m/44'/501'/9'/0'` | `6frdqXQAgJMyKwmZxkLYbdGjnYTvUceh6LNhkQt2siQp` | 相同 | ✅ |

## Rust SDK 地址推导流程

```
助记词 → bip39::Mnemonic::to_seed("") → 64 bytes seed
    → SLIP-10 derive_ed25519_private_key(seed, path) → 32 bytes private key
    → ed25519::public_key_bytes(&privkey) → 32 bytes public key
    → bs58::encode(&pubkey).into_string() → Solana base58 address
```

## 结论

实际是误报，地址计算没有问题。Rust SDK 的 Solana 地址推导逻辑正确，无需修改。

## 参考

官方测试用例（`micro-ed25519-hdkey` + `@solana/kit`）：
import { HDKey } from "micro-ed25519-hdkey";
import * as bip39 from "bip39";
import { createKeyPairSignerFromPrivateKeyBytes } from "@solana/kit";

const mnemonic =
  "neither lonely flavor argue grass remind eye tag avocado spot unusual intact";
const seed = bip39.mnemonicToSeedSync(mnemonic);
const hd = HDKey.fromMasterSeed(seed.toString("hex"));

for (let i = 0; i < 10; i++) {
  const path = `m/44'/501'/${i}'/0'`;
  const child = hd.derive(path);

  const signer = await createKeyPairSignerFromPrivateKeyBytes(
    new Uint8Array(child.privateKey),
  );
  // The signer object has the address directly
  console.log(`${path} => ${signer.address}`);
}

m/44'/501'/0'/0' => 5vftMkHL72JaJG6ExQfGAsT2uGVHpRR7oTNUPMs68Y2N
m/44'/501'/1'/0' => GcXbfQ5yY3uxCyBNDPBbR5FjumHf89E7YHXuULfGDBBv
m/44'/501'/2'/0' => 7QPgyQwNLqnoSwHEuK8wKy2Y3Ani6EHoZRihTuWkwxbc
m/44'/501'/3'/0' => 5aE8UprEEWtpVskhxo3f8ETco2kVKiZT9SS3D5Lcg8s2
m/44'/501'/4'/0' => 5n6afo6LZmzH1J4R38ZCaNSwaztLjd48nWwToLQkCHxp
m/44'/501'/5'/0' => 2Gr1hWnbaqGXMghicSTHncqV7GVLLddNFJDC7YJoso8M
m/44'/501'/6'/0' => BNMDY3tCyYbayMzBjZm8RW59unpDWcQRfVmWXCJhLb7D
m/44'/501'/7'/0' => 9CySTpi4iC85gMW6G4BMoYbNBsdyJrfseHoGmViLha63
m/44'/501'/8'/0' => ApteF7PmUWS8Lzm6tJPkWgrxSFW5LwYGWCUJ2ByAec91
m/44'/501'/9'/0' => 6frdqXQAgJMyKwmZxkLYbdGjnYTvUceh6LNhkQt2siQp