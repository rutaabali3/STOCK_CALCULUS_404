import React, { useState } from 'react';
import { getMandiDB } from '../lib/db';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('Too many failed attempts. Please try again in 15 minutes.');
        }
        throw new Error(data?.error?.message || 'Invalid PIN entered');
      }

      // Store token in IndexedDB
      const db = await getMandiDB();
      await db.put('auth', { token: data.token, expiresAt: data.expiresAt }, 'current');

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen p-4 flex flex-col justify-center space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-forest text-wheat rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-forest">Unlock Online Sync</h1>
        <p className="text-xs text-mist">
          Enter your shop PIN to connect to the cloud database and sync your weighment records.
        </p>
      </div>

      <form onSubmit={handleUnlock} className="space-y-4 bg-white p-5 rounded-2xl border border-moss/20 shadow-md">
        <div>
          <label className="block text-xs font-bold text-mist uppercase tracking-wider mb-1.5">
            Security PIN
          </label>
          <input
            type="password"
            autoFocus
            inputMode="numeric"
            placeholder="••••••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError(null);
            }}
            className="w-full h-12 px-4 text-center tracking-widest text-xl font-black bg-cream/40 border-2 border-moss/30 rounded-xl focus:border-forest focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 font-semibold text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !pin.trim()}
          className="w-full h-12 bg-forest hover:bg-forest/90 active:scale-[0.98] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
        >
          <span>{loading ? 'Unlocking...' : 'Connect to Shop'}</span>
          <ArrowRight className="w-4 h-4 text-wheat" />
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-xs font-bold text-mist hover:text-ink flex items-center justify-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Offline</span>
          </button>
        )}
      </form>
    </div>
  );
};
