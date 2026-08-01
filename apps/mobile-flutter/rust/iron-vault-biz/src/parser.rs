use crate::errors::{ChainError, Result};
use iron_vault_crypto::rlp as crypto_rlp;

pub fn parse_sign_data(chain: &str, payload_hex: &str) -> Result<String> {
    let payload = hex::decode(payload_hex)
        .map_err(|e| ChainError::ParseError(format!("invalid hex: {e}")))?;
    if payload.is_empty() {
        return Err(ChainError::ParseError("empty payload".into()));
    }
    match chain {
        "ethereum" => parse_eth_tx(&payload),
        "personal_msg" => parse_personal_msg(&payload),
        "eip712" => parse_eip712(&payload),
        _ => parse_raw(&payload, chain),
    }
}

fn parse_eth_tx(payload: &[u8]) -> Result<String> {
    use rlp::Rlp;
    let (body, tx_type) = if !payload.is_empty() && payload[0] <= 0x7f {
        (&payload[1..], Some(payload[0]))
    } else {
        (payload, None)
    };
    let rlp = Rlp::new(body);
    let count = rlp.item_count().map_err(|e| ChainError::ParseError(format!("RLP error: {e}")))?;
    if count < 6 {
        return Err(ChainError::ParseError(format!("ETH tx RLP too few fields: {count} (need ≥6)")));
    }
    let (gas_idx, to_idx, value_idx, data_idx) = match tx_type {
        Some(0x02) | Some(0x01) => (4, 5, 6, 7),
        _ => (2, 3, 4, 5),
    };
    if count <= to_idx {
        return Err(ChainError::ParseError(format!("ETH tx RLP too few fields for type: {count} (need at least {})", to_idx + 1)));
    }
    let nonce = crypto_rlp::rlp_val_uint(&rlp.at(0).map_err(|e| ChainError::ParseError(format!("nonce: {e}")))?);
    let gas = crypto_rlp::rlp_val_uint(&rlp.at(gas_idx).map_err(|e| ChainError::ParseError(format!("gas: {e}")))?);
    let to = crypto_rlp::rlp_addr(&rlp.at(to_idx).map_err(|e| ChainError::ParseError(format!("to: {e}")))?);
    let value = crypto_rlp::rlp_val_uint(&rlp.at(value_idx).map_err(|e| ChainError::ParseError(format!("value: {e}")))?);
    let chain_id = match tx_type {
        Some(0x02) | Some(0x01) => crypto_rlp::rlp_val_uint(&rlp.at(0).map_err(|e| ChainError::ParseError(format!("chainId: {e}")))?),
        _ => if count > 6 {
            crypto_rlp::rlp_val_uint(&rlp.at(6).map_err(|e| ChainError::ParseError(format!("chainId: {e}")))?)
        } else { "0".to_string() }
    };
    let gas_price_idx = match tx_type {
        Some(0x02) | Some(0x01) => 3,
        _ => 1,
    };
    let gas_price = if count > gas_price_idx {
        crypto_rlp::rlp_val_uint(&rlp.at(gas_price_idx).map_err(|e| ChainError::ParseError(format!("gasPrice: {e}")))?)
    } else { "0".to_string() };
    let priority_fee = match tx_type {
        Some(0x02) | Some(0x01) => {
            if count > 2 {
                crypto_rlp::rlp_val_uint(&rlp.at(2).map_err(|e| ChainError::ParseError(format!("priorityFee: {e}")))?)
            } else { "0".to_string() }
        }
        _ => String::new(),
    };
    let priority_json = if !priority_fee.is_empty() {
        format!(r#","priorityFee":"{}""#, priority_fee)
    } else { String::new() };
    let data_raw = if count > data_idx {
        rlp.at(data_idx).ok().and_then(|r| r.data().ok()).unwrap_or(&[])
    } else { &[] };
    let data = format_data(data_raw);
    let decoded_action = decode_eth_tx_data(data_raw);
    let tx_type_str = match tx_type {
        Some(2) => "eip1559",
        Some(1) => "eip2930",
        _ => "legacy",
    };
    let action_json = match &decoded_action {
        Some(action) => format!(",\"action\":{}", action),
        None => String::new(),
    };
    Ok(format!(
        r#"{{"type":"eth_tx","to":"{}","value":"{}","gas":"{}","gasPrice":"{}","nonce":"{}","data":"{}","txType":"{}","chainId":"{}"{}{}}}"#,
        to, value, gas, gas_price, nonce, data, tx_type_str, chain_id, priority_json, action_json,
    ))
}

fn format_data(data_raw: &[u8]) -> String {
    if data_raw.is_empty() { "0x".to_string() } else { format!("0x{}", hex::encode(data_raw)) }
}

fn param_json(name: &str, value: &str, type_str: &str) -> String {
    let escaped_value = value.replace('\\', "\\\\").replace('"', "\\\"");
    format!(r#"{{"name":"{}","value":"{}","type":"{}"}}"#, name, escaped_value, type_str)
}

fn decode_eth_tx_data(data: &[u8]) -> Option<String> {
    if data.len() < 4 { return None; }
    let selector = &data[0..4];
    match selector {
        [0xa9, 0x05, 0x9c, 0xbb] => {
            if data.len() < 68 { return None; }
            let to_addr = hex::encode(&data[16..36]);
            let amount = crypto_rlp::bytes_to_decimal(&data[36..68]);
            let params = format!("{},{}",
                param_json("to", &format!("0x{}", to_addr), "address"),
                param_json("amount", &amount, "uint256"));
            Some(format!(r#"{{"method":"transfer","params":[{}]}}"#, params))
        }
        [0x09, 0x5e, 0xa7, 0xb3] => {
            if data.len() < 68 { return None; }
            let spender = hex::encode(&data[16..36]);
            let amount = crypto_rlp::bytes_to_decimal(&data[36..68]);
            let params = format!("{},{}",
                param_json("spender", &format!("0x{}", spender), "address"),
                param_json("amount", &amount, "uint256"));
            Some(format!(r#"{{"method":"approve","params":[{}]}}"#, params))
        }
        [0x23, 0xb8, 0x72, 0xdd] => {
            if data.len() < 100 { return None; }
            let from = hex::encode(&data[16..36]);
            let to_addr = hex::encode(&data[48..68]);
            let amount = crypto_rlp::bytes_to_decimal(&data[68..100]);
            let params = format!("{},{},{}",
                param_json("from", &format!("0x{}", from), "address"),
                param_json("to", &format!("0x{}", to_addr), "address"),
                param_json("amount", &amount, "uint256"));
            Some(format!(r#"{{"method":"transferFrom","params":[{}]}}"#, params))
        }
        _ => None,
    }
}

fn parse_personal_msg(payload: &[u8]) -> Result<String> {
    let message_hex = hex::encode(payload);
    let message = String::from_utf8(payload.to_vec()).unwrap_or_else(|_| format!("0x{}", message_hex));
    let escaped = message.replace('\\', "\\\\").replace('"', "\\\"")
        .replace('\n', "\\n").replace('\r', "\\r").replace('\t', "\\t");
    Ok(format!(r#"{{"type":"personal_msg","message":"{}","messageHex":"{}"}}"#, escaped, message_hex))
}

fn parse_eip712(payload: &[u8]) -> Result<String> {
    if payload.len() < 64 {
        return Err(ChainError::ParseError(format!("EIP-712 payload too short: {}", payload.len())));
    }
    let domain_hash = hex::encode(&payload[..32]);
    let struct_hash = hex::encode(&payload[32..64]);
    Ok(format!(r#"{{"type":"eip712","domainHash":"0x{}","structHash":"0x{}"}}"#, domain_hash, struct_hash))
}

fn parse_raw(payload: &[u8], chain: &str) -> Result<String> {
    let hex_str = hex::encode(payload);
    Ok(format!(r#"{{"type":"raw","hex":"0x{}","size":{},"chain":"{}"}}"#, hex_str, payload.len(), chain))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eth_tx_legacy() {
        let rlp_hex = "e8808504a817c800825208948ba1f109551bd432803012645ac136ddd64dba72872386f26fc1000080";
        let payload = hex::decode(rlp_hex).unwrap();
        let result = parse_eth_tx(&payload).unwrap();
        assert!(result.contains(r#""to":"0x8ba1f109551bd432803012645ac136ddd64dba72"#));
        assert!(result.contains(r#""value":"10000000000000000""#));
        assert!(result.contains(r#""gas":"21000""#));
    }

    #[test]
    fn eth_tx_eip1559() {
        let rlp_hex = "02ef01808459682f0085174876e800825208948ba1f109551bd432803012645ac136ddd64dba72872386f26fc1000080c0";
        let payload = hex::decode(rlp_hex).unwrap();
        let result = parse_eth_tx(&payload).unwrap();
        assert!(result.contains(r#""txType":"eip1559""#));
        assert!(result.contains(r#""chainId":"1""#));
        assert!(result.contains(r#""priorityFee":"1500000000""#));
    }

    #[test]
    fn personal_msg_utf8() {
        let result = parse_personal_msg(b"hello world").unwrap();
        assert!(result.contains(r#""message":"hello world""#));
    }

    #[test]
    fn eip712_valid() {
        let mut p = Vec::new();
        p.extend_from_slice(&[0xabu8; 32]);
        p.extend_from_slice(&[0xcdu8; 32]);
        let result = parse_eip712(&p).unwrap();
        assert!(result.contains(r#""domainHash":"0xabababababababababababababababababababababababababababababababab"#));
    }

    #[test]
    fn parse_sign_data_dispatches() {
        let r = parse_sign_data("ethereum", "e8808504a817c800825208948ba1f109551bd432803012645ac136ddd64dba72872386f26fc1000080").unwrap();
        assert!(r.contains(r#""type":"eth_tx""#));
    }

    #[test]
    fn decode_transfer() {
        let mut data = Vec::new();
        data.extend_from_slice(&hex::decode("a9059cbb").unwrap());
        data.extend_from_slice(&hex::decode("0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72").unwrap());
        data.extend_from_slice(&hex::decode("0000000000000000000000000000000000000000000000000de0b6b3a7640000").unwrap());
        let result = decode_eth_tx_data(&data).unwrap();
        assert!(result.contains(r#""method":"transfer""#));
    }

    #[test]
    fn decode_approve() {
        let mut data = Vec::new();
        data.extend_from_slice(&hex::decode("095ea7b3").unwrap());
        data.extend_from_slice(&hex::decode("0000000000000000000000008ba1f109551bd432803012645ac136ddd64dba72").unwrap());
        data.extend_from_slice(&hex::decode("00000000000000000000000000000000000000000000000000000000000f4240").unwrap());
        let result = decode_eth_tx_data(&data).unwrap();
        assert!(result.contains(r#""method":"approve""#));
    }

    #[test]
    fn decode_transfer_from() {
        let mut data = Vec::new();
        data.extend_from_slice(&hex::decode("23b872dd").unwrap());
        data.extend_from_slice(&hex::decode("0000000000000000000000001111111111111111111111111111111111111111").unwrap());
        data.extend_from_slice(&hex::decode("0000000000000000000000002222222222222222222222222222222222222222").unwrap());
        data.extend_from_slice(&hex::decode("00000000000000000000000000000000000000000000000000000000000001f4").unwrap());
        let result = decode_eth_tx_data(&data).unwrap();
        assert!(result.contains(r#""method":"transferFrom""#));
    }
}
