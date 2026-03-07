import { encodeMessage } from './protocol';
import type { P2PMessage } from './protocol';

// ─── Constants ───────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const ICE_GATHER_TIMEOUT_MS = 15_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface P2PConnection {
  send(msg: P2PMessage): void;
  close(): void;
  onMessage(cb: (data: string) => void): void;
  onStateChange(cb: (state: string) => void): void;
  /** Test-only: simulate receiving a message on the data channel */
  _testTriggerMessage(data: string): void;
  /** Test-only: simulate a connection state change */
  _testTriggerStateChange(state: string): void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wait for ICE gathering to complete, with a timeout. */
function waitForICE(pc: RTCPeerConnection): Promise<void> {
  return new Promise<void>((resolve, _reject) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      // Timeout: use whatever candidates we have
      const desc = pc.localDescription;
      if (!desc || !desc.sdp || desc.sdp.indexOf('a=candidate') === -1) {
        // Check if we have any candidates at all -- if SDP has none,
        // it might still work if gathering produced inline candidates
        // Accept what we have even without explicit candidate lines
      }
      resolve();
    }, ICE_GATHER_TIMEOUT_MS);

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        resolve();
      }
    };
  });
}

/** Wrap a data channel into a P2PConnection interface. */
function wrapChannel(pc: RTCPeerConnection, channel: RTCDataChannel): P2PConnection {
  const messageCallbacks: ((data: string) => void)[] = [];
  const stateCallbacks: ((state: string) => void)[] = [];

  channel.onmessage = (e: MessageEvent) => {
    const data = typeof e.data === 'string' ? e.data : String(e.data);
    for (const cb of messageCallbacks) cb(data);
  };

  pc.onconnectionstatechange = () => {
    for (const cb of stateCallbacks) cb(pc.connectionState);
  };

  return {
    send(msg: P2PMessage) {
      channel.send(encodeMessage(msg));
    },
    close() {
      channel.close();
      pc.close();
    },
    onMessage(cb: (data: string) => void) {
      messageCallbacks.push(cb);
    },
    onStateChange(cb: (state: string) => void) {
      stateCallbacks.push(cb);
    },
    _testTriggerMessage(data: string) {
      for (const cb of messageCallbacks) cb(data);
    },
    _testTriggerStateChange(state: string) {
      for (const cb of stateCallbacks) cb(state);
    },
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface OfferResult {
  offerCode: string;
  applyAnswer: (answerCode: string) => Promise<P2PConnection>;
}

/**
 * Create a WebRTC offer for hosting a P2P game.
 * Returns a Base64-encoded offer code and a function to apply the answer.
 */
export async function createOffer(): Promise<OfferResult> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const channel = pc.createDataChannel('game', { ordered: true });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitForICE(pc);

  const localDesc = pc.localDescription!;
  const offerCode = btoa(JSON.stringify({ type: localDesc.type, sdp: localDesc.sdp }));

  const connection = wrapChannel(pc, channel);

  const applyAnswer = async (answerCode: string): Promise<P2PConnection> => {
    const answerDesc = JSON.parse(atob(answerCode));
    await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
    return connection;
  };

  return { offerCode, applyAnswer };
}

export interface JoinResult {
  answerCode: string;
  connection: P2PConnection;
}

/**
 * Join a P2P game by accepting an offer code.
 * Returns a Base64-encoded answer code and the connection.
 */
export async function joinWithOffer(offerCode: string): Promise<JoinResult> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // CRITICAL: Register ondatachannel BEFORE setRemoteDescription
  // to avoid race condition (Pitfall 2 from research)
  let resolveChannel: (ch: RTCDataChannel) => void;
  const channelPromise = new Promise<RTCDataChannel>((resolve) => {
    resolveChannel = resolve;
  });

  pc.ondatachannel = (event) => {
    resolveChannel!(event.channel);
  };

  const offerDesc = JSON.parse(atob(offerCode));
  await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForICE(pc);

  const localDesc = pc.localDescription!;
  const answerCode = btoa(JSON.stringify({ type: localDesc.type, sdp: localDesc.sdp }));

  const channel = await channelPromise;
  const connection = wrapChannel(pc, channel);

  return { answerCode, connection };
}
