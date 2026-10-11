import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Md3Button } from './md3/Md3Button';

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // Check for app updates every 60 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 max-w-lg mx-auto bg-md-inverse-surface text-md-inverse-on-surface p-3.5 rounded-2xl shadow-md-3 border border-white/10 flex items-center justify-between z-50 animate-fade-in text-xs font-semibold">
      <div className="flex items-center gap-2.5">
        <RefreshCw className="w-4 h-4 text-md-inverse-primary animate-spin" />
        <span>New version available!</span>
      </div>

      <div className="flex items-center gap-2">
        <Md3Button
          variant="filled"
          size="sm"
          onClick={() => updateServiceWorker(true)}
          className="!h-8 !px-3 !text-xs !bg-md-inverse-primary !text-md-on-primary"
        >
          Update Now
        </Md3Button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1 rounded-full text-md-inverse-on-surface/80 hover:text-md-inverse-on-surface hover:bg-white/10"
          aria-label="Dismiss update"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
