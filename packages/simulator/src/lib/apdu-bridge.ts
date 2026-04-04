import {
  handleApdu,
  setMnemonicProvider,
  setSignRequestHandler,
  clearSignSessions,
  type SignRequestData,
} from '@iron-vault/apdu';

export interface SimulatorState {
  screen: 'locked' | 'unlocked';
  pendingSign: SignRequestData | null;
}

export interface SimulatorBridgeOptions {
  mnemonic: string;
  initialUnlocked?: boolean;
}

export interface SimulatorBridge {
  injectApdu(hex: string): Promise<string>;
  getState(): SimulatorState;
  reset(): void;
  onStateChange(cb: (state: SimulatorState) => void): () => void;
  approvePendingSign(): void;
  rejectPendingSign(): void;
}

export function createSimulatorBridge({
  mnemonic,
  initialUnlocked = false,
}: SimulatorBridgeOptions): SimulatorBridge {
  let state: SimulatorState = {
    screen: initialUnlocked ? 'unlocked' : 'locked',
    pendingSign: null,
  };

  const listeners = new Set<(state: SimulatorState) => void>();

  function setState(patch: Partial<SimulatorState>) {
    state = { ...state, ...patch };
    for (const cb of listeners) cb(state);
  }

  setMnemonicProvider(async () => mnemonic);

  // Only resolve needed — rejection resolves with 6985 (CONDITIONS_NOT_SATISFIED)
  // per Ledger protocol. Never reject() the promise, which would cause 6f00 (INTERNAL_ERROR).
  let signResolve: ((sig: string) => void) | null = null;

  setSignRequestHandler(async (req: SignRequestData) => {
    return new Promise<string>((resolve) => {
      signResolve = resolve;
      setState({ pendingSign: req });
    });
  });

  return {
    async injectApdu(hex: string): Promise<string> {
      const resp = await handleApdu(hex);
      const cla = parseInt(hex.slice(0, 2), 16);
      const ins = parseInt(hex.slice(2, 4), 16);
      if (cla === 0xe0 && ins === 0xd8 && resp === '9000') {
        setState({ screen: 'unlocked' });
      }
      return resp;
    },

    getState(): SimulatorState {
      return { ...state };
    },

    reset() {
      clearSignSessions();
      if (signResolve) {
        signResolve('6985');
        signResolve = null;
      }
      setState({ screen: 'locked', pendingSign: null });
    },

    onStateChange(cb: (state: SimulatorState) => void): () => void {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    approvePendingSign() {
      if (state.pendingSign && signResolve) {
        const sig = state.pendingSign.sign();
        const res = signResolve;
        signResolve = null;
        setState({ pendingSign: null });
        res(sig);
      }
    },

    rejectPendingSign() {
      if (signResolve) {
        const res = signResolve;
        signResolve = null;
        setState({ pendingSign: null });
        res('6985'); // CONDITIONS_NOT_SATISFIED — correct Ledger protocol response
      }
    },
  };
}
