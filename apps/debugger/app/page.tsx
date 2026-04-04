'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectLedgerBle, scanDevices, fromHex, toHex,
  SERVICE_UUID, type BleTransport, type ScannedDevice,
} from '../lib/ble-transport';
import {
  COMMANDS, decodeResponse, type Command, type DecodedResponse,
} from '../lib/apdu-commands';

// ── Types ─────────────────────────────────────────────────────────────────────

type LogDir = 'tx' | 'rx' | 'info' | 'apdu' | 'decoded' | 'error';

interface LogEntry {
  id: number;
  ts: string;
  dir: LogDir;
  hex: string;
  label?: string;
  decoded?: DecodedResponse;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0;
function newId() { return ++_id; }

function now() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0')}`;
}

const DIR_STYLE: Record<LogDir, string> = {
  tx:      'text-primary',
  rx:      'text-green',
  info:    'text-text2',
  apdu:    'text-yellow',
  decoded: 'text-white',
  error:   'text-red',
};

const DIR_LABEL: Record<LogDir, string> = {
  tx:      '→ TX',
  rx:      '← RX',
  info:    'ℹ',
  apdu:    '⬆ APDU',
  decoded: '⬇ RESP',
  error:   '✗ ERR',
};

const GROUPS = [...new Set(COMMANDS.map(c => c.group))];

// ── Main Component ────────────────────────────────────────────────────────────

export default function DebuggerPage() {
  const [transport, setTransport] = useState<BleTransport | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawInput, setRawInput] = useState('E0 01 00 00 00');
  const [sending, setSending] = useState(false);
  const [lastCmd, setLastCmd] = useState<Command | undefined>();
  const [activeGroup, setActiveGroup] = useState(GROUPS[0]);
  const logRef = useRef<HTMLDivElement>(null);

  // Scan modal state
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Map<string, ScannedDevice>>(new Map());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const stopScanRef = useRef<(() => void) | null>(null);

  const addLog = useCallback((dir: LogDir, hex: string, label?: string, decoded?: DecodedResponse) => {
    setLogs(prev => [...prev.slice(-500), { id: newId(), ts: now(), dir, hex, label, decoded }]);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  // Disconnect
  const handleDisconnect = () => {
    transport?.disconnect();
    setTransport(null);
    addLog('info', '', '已断开');
  };

  // Start custom scan modal
  const handleOpenScan = async () => {
    setScannedDevices(new Map());
    setShowScan(true);
    setScanning(true);
    try {
      const stop = await scanDevices((d) => {
        setScannedDevices(prev => {
          const next = new Map(prev);
          next.set(d.device.id, d);
          return next;
        });
      }, 8000);
      stopScanRef.current = stop;
    } catch (e: any) {
      if (e?.message === 'NO_SCAN_API') {
        // Fallback: use browser native picker (shows all devices user allows)
        addLog('info', '', '⚠️  实验性扫描 API 不可用，使用系统蓝牙选择器');
        setShowScan(false);
        setScanning(false);
        setConnecting(true);
        try {
          const t = await connectLedgerBle((dir, hex, label) => addLog(dir as LogDir, hex, label));
          setTransport(t);
          t.device.addEventListener('gattserverdisconnected', () => setTransport(null));
        } catch (err: any) {
          addLog('error', '', err?.message ?? String(err));
        } finally {
          setConnecting(false);
        }
        return;
      }
      addLog('error', '', `扫描失败: ${e?.message}`);
      setShowScan(false);
    } finally {
      setScanning(false);
    }
  };

  const handleStopScan = () => {
    stopScanRef.current?.();
    stopScanRef.current = null;
    setScanning(false);
  };

  // Connect to a specific scanned device
  const handleConnectDevice = async (d: ScannedDevice) => {
    setConnectingId(d.device.id);
    handleStopScan();
    try {
      const t = await connectLedgerBle(
        (dir, hex, label) => addLog(dir as LogDir, hex, label),
        d.device,
      );
      setTransport(t);
      t.device.addEventListener('gattserverdisconnected', () => setTransport(null));
      setShowScan(false);
    } catch (e: any) {
      addLog('error', '', `连接失败: ${e?.message}`);
    } finally {
      setConnectingId(null);
    }
  };

  // Send APDU
  const sendAPDU = async (apduBytes: Uint8Array, cmd?: Command) => {
    if (!transport || sending) return;
    setSending(true);
    setLastCmd(cmd);
    const hexStr = toHex(apduBytes);
    addLog('apdu', hexStr, cmd?.label);
    try {
      const resp = await transport.exchange(apduBytes);
      const decoded = decodeResponse(resp, cmd);
      addLog('decoded', toHex(resp), cmd?.label, decoded);
    } catch (e: any) {
      addLog('error', '', `Exchange failed: ${e?.message}`);
    } finally {
      setSending(false);
    }
  };

  const handlePreset = (cmd: Command) => {
    const apdus = cmd.build();
    // Send first APDU (multi-chunk handled by transport)
    sendAPDU(apdus[0], cmd);
  };

  const handleRawSend = () => {
    try {
      const bytes = fromHex(rawInput);
      sendAPDU(bytes);
    } catch (e: any) {
      addLog('error', '', `Invalid hex: ${e?.message}`);
    }
  };

  const isConnected = !!transport;

  return (
    <div className="flex flex-col h-screen bg-bg text-white">
      {/* ── Header ── */}
      <header className="flex items-center gap-4 px-6 py-3 bg-card border-b border-card2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔑</span>
          <span className="font-bold text-lg">BLE Wallet Debugger</span>
          <span className="text-text2 text-xs ml-1">OKX Ledger 模拟器</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Connection status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
            ${isConnected ? 'bg-green/10 border border-green/30 text-green'
              : 'bg-card2 text-text2'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green animate-pulse' : 'bg-gray-600'}`} />
            {isConnected ? `已连接: ${transport.device.name ?? 'Ledger'}` : '未连接'}
          </div>

          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition
                bg-red/20 border border-red/40 text-red hover:bg-red/30">
              断开
            </button>
          ) : (
            <button
              onClick={handleOpenScan}
              disabled={connecting}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition
                bg-primary hover:bg-primary/80 text-white
                disabled:opacity-50 disabled:cursor-not-allowed">
              {connecting ? '连接中...' : '🔍 扫描设备'}
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Preset Commands ── */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-card2 bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2 text-xs text-text2 uppercase tracking-widest">预设指令</div>

          {/* Group tabs */}
          <div className="flex flex-col gap-0.5 px-2 pb-2 shrink-0">
            {GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`text-left text-sm px-3 py-1.5 rounded-md transition
                  ${activeGroup === g ? 'bg-primary/20 text-primary font-medium' : 'text-text2 hover:bg-card2'}`}>
                {g}
              </button>
            ))}
          </div>

          <div className="h-px bg-card2 mx-2" />

          {/* Commands for active group */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {COMMANDS.filter(c => c.group === activeGroup).map(cmd => (
              <button
                key={cmd.label}
                onClick={() => handlePreset(cmd)}
                disabled={!isConnected || sending}
                title={cmd.description}
                className="text-left w-full px-3 py-2.5 rounded-lg bg-card2 hover:bg-white/5
                  border border-transparent hover:border-primary/30
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition group">
                <div className="text-sm font-mono font-medium text-white group-hover:text-primary transition">
                  {cmd.label}
                </div>
                <div className="text-xs text-text2 mt-0.5 leading-tight">{cmd.description}</div>
              </button>
            ))}
          </div>

          {/* OKX full flow shortcut */}
          <div className="p-3 border-t border-card2 shrink-0">
            <button
              disabled={!isConnected || sending}
              onClick={async () => {
                if (!transport) return;
                const flow = [
                  COMMANDS.find(c => c.label === 'GET_VERSION')!,
                  COMMANDS.find(c => c.label === 'GET_APP_AND_VERSION')!,
                  COMMANDS.find(c => c.label === 'OPEN_APP Ethereum')!,
                  COMMANDS.find(c => c.label === 'GET_ETH_ADDRESS #0')!,
                ];
                for (const cmd of flow) {
                  await new Promise<void>(res => {
                    setTimeout(async () => { await handlePreset(cmd); res(); }, 300);
                  });
                }
              }}
              className="w-full py-2 rounded-lg bg-primary/20 border border-primary/40
                text-primary text-sm font-semibold hover:bg-primary/30
                disabled:opacity-40 disabled:cursor-not-allowed transition">
              ▶ 模拟 OKX 连接流程
            </button>
          </div>
        </aside>

        {/* ── Center: Log ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-card2 bg-card shrink-0">
            <span className="text-xs text-text2 uppercase tracking-widest">APDU 日志</span>
            <button
              onClick={() => setLogs([])}
              className="ml-auto text-xs text-text2 hover:text-white transition px-2 py-1 rounded hover:bg-card2">
              清空
            </button>
          </div>

          {/* Log entries */}
          <div ref={logRef} className="flex-1 overflow-y-auto font-mono text-xs p-4 space-y-1">
            {logs.length === 0 && (
              <div className="text-text2 text-center pt-16">
                连接设备后，APDU 通信将在此显示
              </div>
            )}
            {logs.map(entry => (
              <LogRow key={entry.id} entry={entry} />
            ))}
          </div>

          {/* ── Raw APDU input ── */}
          <div className="border-t border-card2 bg-card p-4 shrink-0">
            <div className="text-xs text-text2 mb-2 uppercase tracking-widest">自定义 APDU</div>
            <div className="flex gap-2">
              <input
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRawSend()}
                placeholder="E0 01 00 00 00"
                className="flex-1 bg-card2 border border-card2 focus:border-primary/50
                  rounded-lg px-3 py-2 font-mono text-sm text-white
                  outline-none transition placeholder:text-gray-600"
              />
              <button
                onClick={handleRawSend}
                disabled={!isConnected || sending}
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white text-sm
                  font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition">
                {sending ? '...' : '发送'}
              </button>
            </div>
          </div>
        </main>

        {/* ── Right: Decoded Response ── */}
        <aside className="w-72 shrink-0 flex flex-col border-l border-card2 bg-card overflow-hidden">
          <div className="px-4 pt-4 pb-2 text-xs text-text2 uppercase tracking-widest shrink-0">
            响应解析
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {(() => {
              const last = [...logs].reverse().find(l => l.decoded);
              if (!last?.decoded) {
                return <div className="text-text2 text-sm">等待响应...</div>;
              }
              const d = last.decoded;
              const isOk = d.sw === '9000';
              return (
                <div className="space-y-3">
                  {/* Status word */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                    ${isOk ? 'bg-green/10 border border-green/30 text-green'
                            : 'bg-red/10 border border-red/30 text-red'}`}>
                    <span className="font-mono">{d.sw}</span>
                    <span className="text-xs font-normal">{d.swLabel}</span>
                  </div>

                  {/* Command */}
                  {last.label && (
                    <div className="text-xs text-text2">
                      指令: <span className="text-white font-mono">{last.label}</span>
                    </div>
                  )}

                  {/* Fields */}
                  {d.fields.map(f => (
                    <div key={f.key} className="bg-card2 rounded-lg p-3">
                      <div className="text-xs text-text2 mb-1">{f.key}</div>
                      <div className="text-xs font-mono text-white break-all leading-relaxed">
                        {f.value}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Device info summary */}
          <div className="border-t border-card2 p-4 shrink-0">
            <div className="text-xs text-text2 mb-2">调试信息</div>
            <div className="text-xs font-mono space-y-1 text-text2">
              <div>BLE: {isConnected ? <span className="text-green">已连接</span> : <span>未连接</span>}</div>
              <div>总包数: {logs.filter(l => l.dir === 'tx' || l.dir === 'rx').length}</div>
              <div>APDU: {logs.filter(l => l.dir === 'apdu').length} 条</div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Scan Modal ── */}
      {showScan && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-card border border-card2 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-card2">
              <div>
                <h2 className="text-base font-semibold">扫描附近设备</h2>
                <p className="text-xs text-text2 mt-0.5">
                  🔑 标记为 Ledger 服务的设备可直接连接
                </p>
              </div>
              <div className="flex items-center gap-3">
                {scanning ? (
                  <button
                    onClick={handleStopScan}
                    className="text-xs px-3 py-1.5 rounded-lg bg-card2 text-text2 hover:text-white transition">
                    停止扫描
                  </button>
                ) : (
                  <button
                    onClick={() => { setScannedDevices(new Map()); handleOpenScan(); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition">
                    重新扫描
                  </button>
                )}
                <button
                  onClick={() => { handleStopScan(); setShowScan(false); }}
                  className="text-text2 hover:text-white text-xl leading-none transition">
                  ×
                </button>
              </div>
            </div>

            {/* Scanning indicator */}
            {scanning && (
              <div className="flex items-center gap-2 px-6 py-2 bg-primary/5 border-b border-card2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary">
                  扫描中... 已发现 {scannedDevices.size} 个设备
                </span>
              </div>
            )}

            {/* Device list */}
            <div className="flex-1 overflow-y-auto divide-y divide-card2">
              {scannedDevices.size === 0 ? (
                <div className="text-center py-16 text-text2 text-sm">
                  {scanning ? '正在扫描附近蓝牙设备...' : '未发现设备，请重新扫描'}
                </div>
              ) : (
                [...scannedDevices.values()]
                  .sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
                  .map(d => (
                    <DeviceRow
                      key={d.device.id}
                      device={d}
                      connecting={connectingId === d.device.id}
                      onConnect={() => handleConnectDevice(d)}
                    />
                  ))
              )}
            </div>

            {/* Footer note */}
            <div className="px-6 py-3 border-t border-card2 text-xs text-text2">
              ⚠️ 需要 Chrome 并开启
              <code className="mx-1 bg-card2 px-1 rounded">
                chrome://flags/#enable-experimental-web-platform-features
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DeviceRow ─────────────────────────────────────────────────────────────────

function DeviceRow({
  device, connecting, onConnect,
}: { device: ScannedDevice; connecting: boolean; onConnect: () => void }) {
  const rssiBar = (rssi: number | null) => {
    if (rssi === null) return '—';
    if (rssi >= -60) return '▂▄▆█';
    if (rssi >= -75) return '▂▄▆░';
    if (rssi >= -90) return '▂▄░░';
    return '▂░░░';
  };
  const rssiColor = (rssi: number | null) => {
    if (rssi === null) return 'text-text2';
    if (rssi >= -60) return 'text-green';
    if (rssi >= -75) return 'text-yellow';
    return 'text-red';
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0
        ${device.isLedger ? 'bg-primary/15' : 'bg-card2'}`}>
        {device.isLedger ? '🔑' : '📡'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{device.name}</span>
          {device.isLedger && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium shrink-0">
              Ledger
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="font-mono text-xs text-text2 truncate">{device.device.id.slice(0, 16)}…</span>
          <span className={`font-mono text-xs shrink-0 ${rssiColor(device.rssi)}`}>
            {rssiBar(device.rssi)} {device.rssi ?? '?'} dBm
          </span>
        </div>
        {device.uuids.length > 0 && (
          <div className="text-xs text-text2 truncate mt-0.5">
            {device.uuids.length} service{device.uuids.length > 1 ? 's' : ''}
            {device.isLedger && <span className="text-primary ml-1">✓ Ledger UUID</span>}
          </div>
        )}
      </div>

      {/* Connect button */}
      <button
        onClick={onConnect}
        disabled={connecting}
        className={`shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition
          ${device.isLedger
            ? 'bg-primary hover:bg-primary/80 text-white'
            : 'bg-card2 hover:bg-white/10 text-text2 hover:text-white'}
          disabled:opacity-50 disabled:cursor-not-allowed`}>
        {connecting ? '连接中...' : '连接'}
      </button>
    </div>
  );
}

// ── LogRow ─────────────────────────────────────────────────────────────────────

function LogRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDecoded = !!entry.decoded;

  return (
    <div
      className={`flex gap-2 leading-5 cursor-pointer group
        ${hasDecoded ? 'hover:bg-white/[0.02] rounded px-1 -mx-1' : ''}`}
      onClick={() => hasDecoded && setExpanded(v => !v)}>
      <span className="text-gray-600 shrink-0 w-28">{entry.ts}</span>
      <span className={`shrink-0 w-16 ${DIR_STYLE[entry.dir]}`}>{DIR_LABEL[entry.dir]}</span>
      <span className="flex-1 break-all">
        {entry.label && (
          <span className="text-yellow mr-1">[{entry.label}]</span>
        )}
        {entry.hex || <span className="text-text2 italic">{entry.label ?? ''}</span>}
        {hasDecoded && (
          <span className="ml-1 text-text2 group-hover:text-white">
            {expanded ? '▲' : '▼'}
          </span>
        )}
        {expanded && entry.decoded && (
          <div className="mt-1 space-y-1 pl-2 border-l border-card2">
            <div className={`text-xs ${entry.decoded.sw === '9000' ? 'text-green' : 'text-red'}`}>
              SW: {entry.decoded.sw} — {entry.decoded.swLabel}
            </div>
            {entry.decoded.fields.map(f => (
              <div key={f.key} className="text-xs">
                <span className="text-text2">{f.key}: </span>
                <span className="text-white">{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </span>
    </div>
  );
}
