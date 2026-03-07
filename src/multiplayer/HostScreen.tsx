import { useState } from 'react';
import { createOffer } from './webrtc';
import type { P2PConnection, OfferResult } from './webrtc';
import type { Role } from '../engine';

interface HostScreenProps {
  onConnected: (connection: P2PConnection, hostRole: Role) => void;
  onBack: () => void;
}

export function HostScreen({ onConnected, onBack }: HostScreenProps) {
  const [hostRole, setHostRole] = useState<Role>('tiger');
  const [offerCode, setOfferCode] = useState<string>('');
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [offerResult, setOfferResult] = useState<OfferResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleCreateGame = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const result = await createOffer();
      setOfferCode(result.offerCode);
      setOfferResult(result);
    } catch (e) {
      setError('Failed to create game. Check your network connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(offerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the textarea content
      const textarea = document.querySelector('[data-testid="offer-code"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleConnect = async () => {
    if (!offerResult || !answerInput.trim()) return;
    setIsConnecting(true);
    setError('');
    try {
      const connection = await offerResult.applyAnswer(answerInput.trim());
      onConnected(connection, hostRole);
    } catch (e) {
      setError('Failed to connect. Make sure you pasted the correct response code.');
      setIsConnecting(false);
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
        data-testid="host-back-btn"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--accent)' }}>
        Host Game
      </h1>

      {/* Role picker */}
      {!offerCode && (
        <>
          <div className="mb-6">
            <h2
              className="text-sm font-semibold mb-2 uppercase tracking-wider text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              Play as
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setHostRole('tiger')}
                className="min-w-[100px] min-h-[44px] px-5 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: hostRole === 'tiger' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: hostRole === 'tiger' ? '#ffffff' : 'var(--text-primary)',
                }}
                data-testid="host-role-tiger"
              >
                Tiger
              </button>
              <button
                onClick={() => setHostRole('goat')}
                className="min-w-[100px] min-h-[44px] px-5 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: hostRole === 'goat' ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: hostRole === 'goat' ? '#ffffff' : 'var(--text-primary)',
                }}
                data-testid="host-role-goat"
              >
                Goat
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isGenerating}
            className="min-h-[44px] px-8 py-3 font-bold rounded-lg text-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--legal-move-stroke)', color: '#ffffff' }}
            data-testid="create-game-btn"
          >
            {isGenerating ? 'Generating invite code...' : 'Create Game'}
          </button>

          {isGenerating && (
            <p className="text-sm mt-2 animate-pulse" style={{ color: 'var(--text-secondary)' }}>
              Gathering network info...
            </p>
          )}
        </>
      )}

      {/* Offer code display */}
      {offerCode && (
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Step 1: Invite */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--accent)', color: '#000' }}>1</span>
              Invite Your Friend
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Send this code to your friend and wait for them to generate a response holding their setup.
            </p>
            <div className="flex gap-2 relative">
              <textarea
                readOnly
                value={offerCode}
                className="flex-1 h-14 rounded-lg p-2 text-xs font-mono resize-none"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--board-line)',
                }}
                data-testid="offer-code"
              />
              <button
                onClick={handleCopyCode}
                className="px-4 rounded-lg font-bold text-sm transition-colors flex items-center justify-center min-w-[100px]"
                style={{
                  backgroundColor: copied ? 'var(--status-success)' : 'var(--accent)',
                  color: copied ? '#ffffff' : '#000000',
                }}
                data-testid="copy-offer-btn"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Step 2: Connect */}
          <div className={`p-4 rounded-xl transition-opacity duration-300 ${!copied && !answerInput ? 'opacity-50' : 'opacity-100'}`} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--board-line)' }}>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--board-line)', color: 'var(--text-primary)' }}>2</span>
              Complete Connection
            </h2>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
              Paste the <strong style={{ color: 'var(--text-primary)' }}>Response Code</strong> they send back to you here.
            </p>
            <textarea
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Paste response code here..."
              className="w-full h-14 rounded-lg p-3 text-xs font-mono resize-none mb-3"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                color: 'var(--text-primary)',
                border: `1px solid ${answerInput ? 'var(--accent)' : 'var(--board-line)'}`,
              }}
              data-testid="answer-input"
            />
            <button
              onClick={handleConnect}
              disabled={!answerInput.trim() || isConnecting}
              className="w-full min-h-[44px] font-bold rounded-lg transition-transform hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-50"
              style={{
                backgroundColor: answerInput.trim() ? 'var(--legal-move-stroke)' : 'var(--board-line)',
                color: answerInput.trim() ? '#ffffff' : 'var(--text-secondary)'
              }}
              data-testid="host-connect-btn"
            >
              {isConnecting ? 'Finishing Handshake...' : 'Start Game'}
            </button>
          </div>

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
        <p className="mt-3 text-sm" style={{ color: 'var(--status-error)' }} data-testid="host-error">
          {error}
        </p>
      )}
    </div>
  );
}
