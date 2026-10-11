import React, { useEffect, useState } from 'react';
import { syncWorker, SyncState } from '../lib/sync';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export const SyncBadge: React.FC = () => {
  const [state, setState] = useState<SyncState>(syncWorker.getState());

  useEffect(() => {
    return syncWorker.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  if (state.isSyncing) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-md-tertiary-container text-md-on-tertiary-container rounded-full text-xs font-semibold select-none shadow-sm animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-current" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (state.lastError) {
    return (
      <button
        type="button"
        title={state.lastError}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-md-error-container text-md-on-error-container rounded-full text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm focus:outline-none"
        onClick={() => syncWorker.triggerSync()}
      >
        <AlertCircle className="w-3.5 h-3.5 text-current" />
        <span>Sync Error</span>
      </button>
    );
  }

  if (state.pendingCount > 0) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-md-surface-container-high border border-md-outline-variant/60 text-md-on-surface rounded-full text-xs font-semibold cursor-pointer hover:bg-md-surface-container-highest active:scale-95 transition-all focus:outline-none"
        onClick={() => syncWorker.triggerSync()}
        title="Tap to sync pending slips"
      >
        <CloudOff className="w-3.5 h-3.5 text-md-on-surface-variant" />
        <span>{state.pendingCount} Pending</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3 py-1 bg-md-primary-container text-md-on-primary-container rounded-full text-xs font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all focus:outline-none"
      onClick={() => syncWorker.triggerSync()}
      title="All slips synced to server (tap to refresh)"
    >
      <Cloud className="w-3.5 h-3.5 text-current" />
      <span>Synced</span>
    </button>
  );
};
