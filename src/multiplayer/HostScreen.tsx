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
      className="min-h-screen flex flex-col items-center justify-center p-4"
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
                className={`min-w-[100px] min-h-[44px] px-5 py-2 rounded-lg font-semibold transition-colors ${
                  hostRole === 'tiger'
                    ? 'bg-amber-600 text-white'
                    : ''
                }`}
                style={
                  hostRole !== 'tiger'
                    ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                    : undefined
                }
                data-testid="host-role-tiger"
              >
                Tiger
              </button>
              <button
                onClick={() => setHostRole('goat')}
                className={`min-w-[100px] min-h-[44px] px-5 py-2 rounded-lg font-semibold transition-colors ${
                  hostRole === 'goat'
                    ? 'bg-amber-600 text-white'
                    : ''
                }`}
                style={
                  hostRole !== 'goat'
                    ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }
                    : undefined
                }
                data-testid="host-role-goat"
              >
                Goat
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={isGenerating}
            className="min-h-[44px] px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-colors disabled:opacity-50"
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
        <div className="w-full max-w-md">
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Share this code with your friend:
          </p>
          <textarea
            readOnly
            value={offerCode}
            className="w-full h-24 rounded-lg p-3 text-xs font-mono resize-none"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
            }}
            data-testid="offer-code"
          />
          <button
            onClick={handleCopyCode}
            className="mt-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            style={{
              backgroundColor: copied ? '#22c55e' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
            data-testid="copy-offer-btn"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>

          <div className="mt-6">
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Paste their response code below:
            </p>
            <textarea
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder="Paste response code here..."
              className="w-full h-24 rounded-lg p-3 text-xs font-mono resize-none"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--text-secondary)',
              }}
              data-testid="answer-input"
            />
            <button
              onClick={handleConnect}
              disabled={!answerInput.trim() || isConnecting}
              className="mt-2 min-h-[44px] px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              data-testid="host-connect-btn"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
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
        <p className="mt-3 text-sm text-red-400" data-testid="host-error">
          {error}
        </p>
      )}
    </div>
  );
}
