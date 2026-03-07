import { useState } from 'react';
import { joinWithOffer } from './webrtc';
import type { P2PConnection } from './webrtc';

interface JoinScreenProps {
  onConnected: (connection: P2PConnection) => void;
  onBack: () => void;
}

export function JoinScreen({ onConnected, onBack }: JoinScreenProps) {
  const [offerInput, setOfferInput] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState<P2PConnection | null>(null);

  const handleJoin = async () => {
    if (!offerInput.trim()) return;
    setIsJoining(true);
    setError('');
    try {
      const result = await joinWithOffer(offerInput.trim());
      setAnswerCode(result.answerCode);
      setConnection(result.connection);

      // Listen for data channel open / connection established
      result.connection.onStateChange((state) => {
        if (state === 'connected') {
          onConnected(result.connection);
        }
      });
    } catch (e) {
      setError('Failed to join. Make sure you pasted the correct invite code.');
      setIsJoining(false);
    }
  };

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(answerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.querySelector('[data-testid="answer-code"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <button
        onClick={onBack}
        className="self-start mb-4 px-3 py-1 text-sm"
        style={{ color: 'var(--text-secondary)' }}
        data-testid="join-back-btn"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
        Join Game
      </h1>

      {/* Paste offer code */}
      {!answerCode && (
        <div className="w-full max-w-md">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Paste the invite code from your friend:
          </p>
          <textarea
            value={offerInput}
            onChange={(e) => setOfferInput(e.target.value)}
            placeholder="Paste invite code here..."
            className="w-full h-24 rounded-lg p-3 text-xs font-mono resize-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--text-secondary)',
            }}
            data-testid="offer-input"
          />
          <button
            onClick={handleJoin}
            disabled={!offerInput.trim() || isJoining}
            className="mt-2 min-h-[44px] px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-colors disabled:opacity-50"
            data-testid="join-game-btn"
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </div>
      )}

      {/* Answer code display */}
      {answerCode && (
        <div className="w-full max-w-md">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Send this response code back to your friend:
          </p>
          <textarea
            readOnly
            value={answerCode}
            className="w-full h-24 rounded-lg p-3 text-xs font-mono resize-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
            }}
            data-testid="answer-code"
          />
          <button
            onClick={handleCopyResponse}
            className="mt-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            style={{
              backgroundColor: copied ? '#22c55e' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
            data-testid="copy-answer-btn"
          >
            {copied ? 'Copied!' : 'Copy Response'}
          </button>

          <p
            className="mt-4 text-sm animate-pulse"
            style={{ color: 'var(--text-secondary)' }}
          >
            Waiting for host to connect...
          </p>
        </div>
      )}

      {/* Network limitation note */}
      <p
        className="mt-6 text-xs text-center max-w-sm"
        style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
      >
        Note: This may not work on some corporate/university networks (symmetric NAT).
      </p>

      {error && (
        <p className="mt-3 text-sm text-red-400" data-testid="join-error">
          {error}
        </p>
      )}
    </div>
  );
}
