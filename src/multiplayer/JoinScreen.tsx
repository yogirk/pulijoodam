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
  const [, setConnection] = useState<P2PConnection | null>(null);

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
      className="min-h-screen-safe flex flex-col items-center justify-center p-4"
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

      {/* Handshake Flow */}
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Step 1: Accept Invite */}
        <div className={`p-4 rounded-xl transition-opacity duration-300 ${answerCode ? 'opacity-50' : 'opacity-100'}`} style={{ backgroundColor: 'var(--bg-secondary)', border: `1px solid ${!answerCode ? 'var(--accent)' : 'var(--board-line)'}` }}>
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: !answerCode ? 'var(--accent)' : 'var(--text-primary)' }}>
            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: !answerCode ? 'var(--accent)' : 'var(--board-line)', color: !answerCode ? '#000' : 'var(--text-primary)' }}>1</span>
            Accept Invite
          </h2>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Paste the code your friend sent you to generate your response.
          </p>
          <textarea
            value={offerInput}
            onChange={(e) => setOfferInput(e.target.value)}
            disabled={!!answerCode}
            placeholder="Paste invite code here..."
            className="w-full h-14 rounded-lg p-3 text-xs font-mono resize-none mb-3"
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: 'var(--text-primary)',
              border: `1px solid ${offerInput ? 'var(--text-secondary)' : 'var(--board-line)'}`,
            }}
            data-testid="offer-input"
          />
          {!answerCode && (
            <button
              onClick={handleJoin}
              disabled={!offerInput.trim() || isJoining}
              className="w-full min-h-[44px] px-8 font-bold rounded-lg transition-transform hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
              style={{ backgroundColor: offerInput.trim() ? 'var(--legal-move-stroke)' : 'var(--board-line)', color: offerInput.trim() ? '#ffffff' : 'var(--text-secondary)' }}
              data-testid="join-game-btn"
            >
              {isJoining ? 'Generating Response...' : 'Next Step'}
            </button>
          )}
        </div>

        {/* Step 2: Send Response */}
        {answerCode && (
          <div className="p-4 rounded-xl slide-down fade-in" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>2</span>
              Send Response
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Send this response code back. <strong>The game will start as soon as they connect!</strong>
            </p>
            <div className="flex gap-2 relative">
              <textarea
                readOnly
                value={answerCode}
                className="flex-1 h-14 rounded-lg p-2 text-xs font-mono resize-none"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: 'var(--status-success)',
                  border: '1px solid var(--board-line)',
                }}
                data-testid="answer-code"
              />
              <button
                onClick={handleCopyResponse}
                className="px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center min-w-[100px]"
                style={{
                  backgroundColor: copied ? 'var(--status-success)' : 'var(--accent)',
                  color: copied ? '#ffffff' : '#000000',
                }}
                data-testid="copy-answer-btn"
              >
                {copied ? 'Copied!' : 'Copy Response'}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--status-warning)' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--status-warning)' }}>
                Waiting for Host to Connect...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Network limitation note */}
      <p
        className="mt-6 text-xs text-center max-w-sm"
        style={{ color: 'var(--text-secondary)', opacity: 0.7 }}
      >
        Note: This may not work on some corporate/university networks (symmetric NAT).
      </p>

      {error && (
        <p className="mt-3 text-sm" style={{ color: 'var(--status-error)' }} data-testid="join-error">
          {error}
        </p>
      )}
    </div>
  );
}
