# BLE Transport & APDU Protocol

## GATT Profile

The Android phone exposes a GATT server that exactly mirrors the Ledger Nano X BLE service:

| Role | UUID |
|------|------|
| Service | `13d63400-2c97-0004-0000-4c6564676572` |
| Notify (RX from device) | `13d63400-2c97-0004-0001-4c6564676572` |
| Write (TX to device) | `13d63400-2c97-0004-0002-4c6564676572` |

The host writes to the Write characteristic and subscribes to Notify for responses.

## Frame Format

All APDUs are chunked into MTU-sized BLE packets (20 bytes safe maximum).

### First Packet (seq = 0)

```
Byte 0-1: Channel  (0x01 0x01)
Byte 2:   Tag      (0x05)
Byte 3-4: Sequence (0x00 0x00)
Byte 5-6: Total APDU length (big-endian)
Byte 7+:  APDU data (up to 13 bytes)
```

### Continuation Packets (seq > 0)

```
Byte 0-1: Channel  (0x01 0x01)
Byte 2:   Tag      (0x05)
Byte 3-4: Sequence number (big-endian)
Byte 5+:  APDU data (up to 15 bytes)
```

## APDU Command Format

```
CLA  INS  P1  P2  Lc  [Data...]
```

| Field | Size | Description |
|-------|------|-------------|
| CLA | 1 | Class byte (0xE0 = Ledger, 0xB0 = global) |
| INS | 1 | Instruction code |
| P1, P2 | 1 each | Parameters |
| Lc | 1 | Data length |
| Data | Lc | Command payload |

## Supported Commands

### GET_VERSION (E0 01 00 00 00)
Returns firmware version info.
```
Response: [target_id 4B] [version_str 4B] [flags 4B] [mcuVersion] [9000]
```

### GET_APP_AND_VERSION (B0 01 00 00 00)
Returns currently running app name and version.
```
Response: [01] [name_len] [name...] [ver_len] [version...] [9000]
```

### GET_ETH_ADDRESS (E0 02 P1 P2 data)
Derives and returns an Ethereum address.
```
P1: 0x00 = no display, 0x01 = display on screen
P2: 0x00 = no chain code
data: [path_count] [path[0] 4B] [path[1] 4B] ...
Response: [pubkey_len] [pubkey 65B] [addr_len] [addr 40B hex] [9000]
```

### SIGN_ETH_TX (E0 04 P1 P2 data)
Signs an Ethereum RLP-encoded transaction.
```
P1: 0x00 = first chunk (with path), 0x80 = subsequent chunks
data (first): [path_count] [path...] [rlp_tx_start...]
data (subsequent): [rlp_tx_continued...]
Response (last chunk only): [v 1B] [r 32B] [s 32B] [9000]
```

### GET_SOL_PUBKEY (E0 05 P1 P2 data)
Returns Solana public key (Ed25519).
```
P1: 0x00 = no display
data: [path_count] [path...]
Response: [pubkey 32B] [9000]
```

### SIGN_SOL_MSG (E0 06 P1 P2 data)
Signs a Solana message.
```
data: [path_count] [path...] [message...]
Response: [signature 64B] [9000]
```

## Response Status Words

| SW | Meaning |
|----|---------|
| `9000` | Success |
| `6985` | Conditions not satisfied (user rejected) |
| `6A80` | Incorrect data in command |
| `6D00` | Instruction not supported |
| `6E00` | CLA not supported |

## Connection Sequence (Web BLE)

```
navigator.bluetooth.requestDevice({
  filters: [{ services: ['13d63400-2c97-0004-0000-4c6564676572'] }]
})
  → device.gatt.connect()
  → server.getPrimaryService(SERVICE_UUID)
  → service.getCharacteristic(WRITE_UUID)
  → service.getCharacteristic(NOTIFY_UUID)
  → notify.startNotifications()
  → notify.addEventListener('characteristicvaluechanged', handler)
  → ready to exchange APDUs
```
