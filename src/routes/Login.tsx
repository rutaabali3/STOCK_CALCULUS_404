import React, { useState } from 'react';
import { getMandiDB } from '../lib/db';
import { Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Md3Button } from '../components/md3/Md3Button';
import { Md3Card } from '../components/md3/Md3Card';

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
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-md-primary-container text-md-on-primary-container rounded-3xl flex items-center justify-center mx-auto shadow-md-1">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-md-on-surface tracking-tight">
          Unlock Online Sync
        </h1>
        <p className="text-xs text-md-on-surface-variant leading-relaxed">
          Enter your shop PIN to connect to the cloud database and sync your weighment records.
        </p>
      </div>

      <Md3Card variant="elevated" rounded="3xl" className="p-6 space-y-5">
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant text-center">
              Security PIN
            </label>
            <div className="bg-md-surface-container-lowest border-2 border-md-outline-variant focus-within:border-md-primary rounded-2xl transition-all shadow-xs">
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
                className="w-full h-14 px-4 text-center tracking-widest text-2xl font-black bg-transparent text-md-on-surface focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-md-error font-semibold text-center px-2 py-1 bg-md-error-container/30 rounded-lg">
              {error}
            </p>
          )}

          <Md3Button
            type="submit"
            variant="filled"
            size="lg"
            loading={loading}
            disabled={!pin.trim()}
            trailingIcon={<ArrowRight className="w-4 h-4 ml-1" />}
            className="w-full h-13 font-bold"
          >
            Connect to Shop
          </Md3Button>

          {onCancel && (
            <Md3Button
              type="button"
              variant="text"
              size="sm"
              onClick={onCancel}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="w-full text-xs text-md-on-surface-variant hover:text-md-on-surface"
            >
              Continue Offline
            </Md3Button>
          )}
        </form>
      </Md3Card>
    </div>
  );
};
