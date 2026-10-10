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
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-wheat/20 border border-wheat/40 rounded-full text-xs font-bold text-forest">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-wheat" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (state.lastError) {
    return (
      <div
        title={state.lastError}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 border border-red-300 rounded-full text-xs font-bold text-red-700 cursor-pointer"
        onClick={() => syncWorker.triggerSync()}
      >
        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
        <span>Sync Error</span>
      </div>
    );
  }

  if (state.pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 bg-cream border border-moss/30 rounded-full text-xs font-bold text-forest cursor-pointer hover:bg-cream/60"
        onClick={() => syncWorker.triggerSync()}
        title="Tap to sync pending slips"
      >
        <CloudOff className="w-3.5 h-3.5 text-mist" />
        <span>{state.pendingCount} Pending</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 bg-moss/10 border border-moss/30 rounded-full text-xs font-bold text-moss cursor-pointer"
      onClick={() => syncWorker.triggerSync()}
      title="All slips synced to server"
    >
      <Cloud className="w-3.5 h-3.5" />
      <span>Synced</span>
    </div>
  );
};
