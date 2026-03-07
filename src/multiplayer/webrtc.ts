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

// ─── Encoding Helpers ────────────────────────────────────────────────────────

const supportsCompression =
  typeof CompressionStream !== 'undefined' && typeof Blob !== 'undefined';

/** Encodes a string to a shareable Base64 code (compressed when available) */
async function encodeString(str: string): Promise<string> {
  if (!supportsCompression) {
    return btoa(str);
  }
  const stream = new Blob([str]).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const chunks: Uint8Array[] = [];
  for await (const chunk of compressedStream as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const result = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return btoa(String.fromCharCode.apply(null, Array.from(result)));
}

/** Decodes a Base64 code back to the original string (handles both compressed and plain) */
async function decodeString(b64Str: string): Promise<string> {
  const binaryString = atob(b64Str);

  // Detect gzip magic bytes (0x1f, 0x8b)
  const isGzip = binaryString.length >= 2 &&
    binaryString.charCodeAt(0) === 0x1f &&
    binaryString.charCodeAt(1) === 0x8b;

  if (!isGzip) {
    return binaryString;
  }

  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const stream = new Blob([bytes]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const chunks: Uint8Array[] = [];
  for await (const chunk of decompressedStream as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const result = new Uint8Array(chunks.reduce((acc, val) => acc + val.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(result);
}

// ─── WebRTC Helpers ──────────────────────────────────────────────────────────

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

    pc.onicecandidate = (event) => {
      if (event.candidate === null) {
        clearTimeout(timer);
        resolve();
      }
    };

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
  const offerCode = await encodeString(JSON.stringify({ type: localDesc.type, sdp: localDesc.sdp }));

  const connection = wrapChannel(pc, channel);

  const applyAnswer = async (answerCode: string): Promise<P2PConnection> => {
    const decompressed = await decodeString(answerCode);
    const answerDesc = JSON.parse(decompressed);
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

  // Build connection wrapper that wires up the data channel when it arrives.
  // ondatachannel only fires after ICE connectivity is established (i.e. after
  // the host applies our answer), so we must NOT await it here — otherwise
  // the answer code never gets returned and both sides deadlock.
  const messageCallbacks: ((data: string) => void)[] = [];
  const stateCallbacks: ((state: string) => void)[] = [];
  let channel: RTCDataChannel | null = null;

  pc.ondatachannel = (event) => {
    channel = event.channel;
    channel.onmessage = (e: MessageEvent) => {
      const data = typeof e.data === 'string' ? e.data : String(e.data);
      for (const cb of messageCallbacks) cb(data);
    };
  };

  pc.onconnectionstatechange = () => {
    for (const cb of stateCallbacks) cb(pc.connectionState);
  };

  const decompressed = await decodeString(offerCode);
  const offerDesc = JSON.parse(decompressed);
  await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitForICE(pc);

  const localDesc = pc.localDescription!;
  const answerCode = await encodeString(JSON.stringify({ type: localDesc.type, sdp: localDesc.sdp }));

  const connection: P2PConnection = {
    send(msg: P2PMessage) {
      if (channel && channel.readyState === 'open') {
        channel.send(encodeMessage(msg));
      }
    },
    close() {
      if (channel) channel.close();
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

  return { answerCode, connection };
}
