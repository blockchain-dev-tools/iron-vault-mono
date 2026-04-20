import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  handleApdu,
  setLogFn,
  setCurrentApp,
  setSignRequestHandler,
  setMnemonicProvider,
  clearSignSessions,
} from '@iron-vault/apdu';
import { walletStorage } from '../lib/storage';
import { useApp } from '../store/AppContext';
import { chainName } from '../lib/chains';
import { apduName } from '../lib/apdu-utils';
import {
  startAdvertising,
  stopAdvertising,
  sendApduResponse,
  onApduReceived,
  onBleLog,
  onBleStatus,
} from '../ble/BlePeripheral';

export type LogEntry = { time: string; msg: string };

export interface BleSessionResult {
  logs: LogEntry[];
  clearLogs: () => void;
  startBle: () => Promise<void>;
  stopBle: () => void;
}

const CHAIN_APP_NAME: Record<string, string> = {
  eth: 'Ethereum', sol: 'Solana', btc: 'Bitcoin', tron: 'Tron', sui: 'Sui',
};

export function useBleSession(
  activeChain: 'eth' | 'sol' | 'btc' | 'tron' | 'sui' | null,
  acct: { short: string },
): BleSessionResult {
  const { setBleState, setPendingTx, go } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const acctRef = useRef(acct);
  const goRef = useRef(go);
  const setPendingTxRef = useRef(setPendingTx);
  useEffect(() => { acctRef.current = acct; }, [acct]);
  useEffect(() => { goRef.current = go; }, [go]);
  useEffect(() => { setPendingTxRef.current = setPendingTx; }, [setPendingTx]);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toTimeString().slice(0, 5);
    setLogs(l => [...l.slice(-200), { time, msg }]);
  }, []);

  // ── APDU handler setup / teardown ────────────────────────────────────────
  useEffect(() => {
    if (!activeChain) return;

    setMnemonicProvider(() => walletStorage.getItem('wallet.mnemonic'));
    setCurrentApp(CHAIN_APP_NAME[activeChain] ?? 'Ethereum');
    setLogFn(addLog);

    setSignRequestHandler(async (req) => {
      return new Promise<string>((resolve) => {
        setPendingTxRef.current({
          chain: req.chain,
          type: req.decoded?.data ? 'erc20_transfer' : 'transfer',
          from: acctRef.current.short,
          to: req.decoded?.to ?? '?',
          amount: req.decoded?.value ?? '?',
          gas: req.decoded?.gas ?? '?',
          rawHex: Buffer.from(req.raw).toString('hex'),
          network: chainName(req.decoded?.chainId),
          sign: req.sign,
          resolve,
          reject: () => resolve('6985'),
        });
        goRef.current('Transaction');
      });
    });

    const apduSub = onApduReceived(async (hex: string) => {
      addLog(`← [${apduName(hex)}] ${hex.slice(0, 16)}…`);
      try {
        const resp = await handleApdu(hex);
        const sw = resp.slice(-4).toUpperCase();
        addLog(`→ ${sw === '9000' ? '✓' : '✗ ' + sw}  ${resp.slice(0, 16)}…`);
        sendApduResponse(resp);
      } catch (e: any) {
        addLog(`✗ ${e?.message}`);
        addLog('✗ 6F00 internal error');
        sendApduResponse('6f00');
      }
    });

    const logSub = onBleLog((msg: string) => addLog(msg));

    const statusSub = onBleStatus((status: string) => {
      if (status === '已连接') setBleState('connected');
      else if (status === '广播中') setBleState('broadcasting');
      else if (status === 'error' || status === '错误') setBleState('error');
    });

    return () => {
      apduSub.remove();
      logSub.remove();
      statusSub.remove();
      setLogFn(null as any);
      setSignRequestHandler(null);
    };
  }, [activeChain, addLog, setBleState]);

  // ── BLE advertising controls ─────────────────────────────────────────────
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || Platform.Version < 31) return true;
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);
    return Object.values(granted).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
  }, []);

  const startBle = useCallback(async () => {
    const ok = await requestPermissions();
    if (!ok) {
      setBleState('error');
      return;
    }
    try {
      startAdvertising();
      setBleState('broadcasting');
    } catch {
      setBleState('error');
    }
  }, [requestPermissions, setBleState]);

  const stopBle = useCallback(() => {
    stopAdvertising();
    clearSignSessions();
    setBleState('idle');
    setLogs([]);
  }, [setBleState]);

  return { logs, clearLogs: () => setLogs([]), startBle, stopBle };
}
