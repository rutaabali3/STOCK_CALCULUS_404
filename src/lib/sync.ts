import { getMandiDB, getPendingSlips, saveSlipRecord, LocalSlipRecord } from './db';
import { SlipPayload } from 'shared/types';

export interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncListener = (state: SyncState) => void;

class SyncWorker {
  private isRunning = false;
  private pendingCount = 0;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private intervalId: number | null = null;

  constructor() {
    this.updatePendingCount();
    this.initTriggers();
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): SyncState {
    return {
      isSyncing: this.isRunning,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public async updatePendingCount() {
    try {
      const pending = await getPendingSlips();
      this.pendingCount = pending.length;
      this.notify();
    } catch {
      // ignore
    }
  }

  private initTriggers() {
    // 1. Online event
    window.addEventListener('online', () => {
      this.triggerSync();
    });

    // 2. Visibility change to visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.triggerSync();
      }
    });

    // 3. Periodic timer every 60s
    this.intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.triggerSync();
      }
    }, 60000);
  }

  public async triggerSync(): Promise<void> {
    if (this.isRunning || !navigator.onLine) return;

    this.isRunning = true;
    this.lastError = null;
    this.notify();

    try {
      const db = await getMandiDB();
      const auth = await db.get('auth', 'current');
      if (!auth?.token) {
        // Not logged in to online server, stop
        this.isRunning = false;
        this.notify();
        return;
      }

      // Fetch pending slips (up to 50)
      const pending = await getPendingSlips();
      this.pendingCount = pending.length;
      if (pending.length === 0) {
        this.isRunning = false;
        this.notify();
        return;
      }

      const batch = pending.slice(0, 50);
      const payloads: SlipPayload[] = batch.map((b) => b.payload);

      const res = await fetch('/api/slips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ slips: payloads }),
      });

      if (res.status === 401) {
        // Clear token on 401
        await db.delete('auth', 'current');
        this.lastError = 'Session expired. Please log in again.';
        this.isRunning = false;
        this.notify();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const results: Array<{ id: string; status: 'created' | 'exists' | 'rejected'; error?: string }> =
        data.results || [];

      const resultMap = new Map(results.map((r) => [r.id, r]));

      for (const slip of batch) {
        const outcome = resultMap.get(slip.id);
        if (!outcome) continue;

        if (outcome.status === 'created' || outcome.status === 'exists') {
          const updated: LocalSlipRecord = {
            ...slip,
            syncStatus: 'synced',
            syncedAt: new Date().toISOString(),
            syncError: undefined,
          };
          await saveSlipRecord(updated);
        } else if (outcome.status === 'rejected') {
          const updated: LocalSlipRecord = {
            ...slip,
            syncStatus: 'rejected',
            syncError: outcome.error,
          };
          await saveSlipRecord(updated);
        }
      }

      this.lastSyncedAt = new Date();
      await this.updatePendingCount();
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : 'Sync network error';
    } finally {
      this.isRunning = false;
      this.notify();
    }
  }

  public destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }
}

export const syncWorker = new SyncWorker();
