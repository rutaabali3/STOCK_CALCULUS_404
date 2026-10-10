import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

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
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-forest text-cream p-3 rounded-xl shadow-2xl border border-wheat/40 flex items-center justify-between z-50 animate-fade-in text-xs font-semibold">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-wheat animate-spin" />
        <span>New version available!</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1 bg-wheat text-forest font-bold rounded-lg shadow-sm hover:bg-wheat/90 active:scale-95 transition-all"
        >
          Update Now
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1 text-cream/70 hover:text-white"
          aria-label="Dismiss update"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
