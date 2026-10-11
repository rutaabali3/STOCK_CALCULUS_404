import {
  getMandiDB,
  getPendingSlips,
  saveSlipRecord,
  getSlipRecord,
  resetSlipSyncStatus,
  resetAllRejectedSlips,
  LocalSlipRecord,
} from './db';
import { SlipPayload, CalcResult } from 'shared/types';

export interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncListener = (state: SyncState) => void;

/**
 * Converts a database row returned from Neon Postgres (/api/slips)
 * into a full LocalSlipRecord for IndexedDB.
 */
export function convertServerSlipToLocalRecord(r: any): LocalSlipRecord {
  const bagCount = Number(r.bag_count) || (Array.isArray(r.weightsG) ? r.weightsG.length : 1);
  const grossG = Number(r.gross_g) || 0;
  const tarePerBagG = Number(r.tare_per_bag_g) || 0;
  const netG = Number(r.net_g) || 0;
  const ratePaisa = Number(r.rate_paisa) || 0;
  const amountPaisa = Number(r.amount_paisa) || 0;
  const commissionPaisa = Number(r.commission_paisa) || 0;
  const labourPaisa = Number(r.labour_paisa) || 0;
  const chargesPaisa = commissionPaisa + labourPaisa;
  const totalPaisa = Number(r.total_paisa) || 0;
  const totalRupees = Number(r.total_rupees) || 0;
  const mannUnitsTimes1000 = Math.round((netG * 1000) / 40000);

  const commission = r.commission_type
    ? r.commission_type === 'percent'
      ? { type: 'percent' as const, hundredthsPct: Number(r.commission_value) }
      : { type: 'fixed' as const, paisa: Number(r.commission_value) }
    : undefined;

  const labour = r.labour_type
    ? r.labour_type === 'fixed'
      ? { type: 'fixed' as const, paisa: Number(r.labour_value) }
      : { type: 'perBag' as const, paisa: Number(r.labour_value) }
    : undefined;

  const weightsG: number[] = Array.isArray(r.weightsG)
    ? r.weightsG.map((w: any) => Number(w))
    : [];

  const createdAt = typeof r.created_at === 'string'
    ? r.created_at
    : new Date(r.created_at).toISOString();

  const payload: SlipPayload = {
    id: r.id,
    createdAt,
    deviceId: r.device_id || undefined,
    seller: r.seller || undefined,
    buyer: r.buyer || undefined,
    receiptName: r.receipt_name || undefined,
    note: r.note || undefined,
    weightsG,
    ratePaisa,
    tarePerBagG,
    commission,
    labour,
    chargeMode: r.charge_mode === 'deduct' ? 'deduct' : 'add',
    roundToRupee: Boolean(r.round_to_rupee),
  };

  const calcResult: CalcResult = {
    bagCount,
    grossG,
    tareG: tarePerBagG * bagCount,
    netG,
    mannUnitsTimes1000,
    amountPaisa,
    commissionPaisa,
    labourPaisa,
    chargesPaisa,
    totalPaisa,
    totalRupees,
  };

  const voided = r.voided_at
    ? {
        at: typeof r.voided_at === 'string' ? r.voided_at : new Date(r.voided_at).toISOString(),
        reason: r.void_reason || 'Voided',
        syncStatus: 'synced' as const,
      }
    : undefined;

  return {
    id: r.id,
    slipCode: r.slip_code,
    createdAt,
    payload,
    calcResult,
    syncStatus: 'synced',
    syncedAt: r.received_at ? new Date(r.received_at).toISOString() : new Date().toISOString(),
    voided,
  };
}

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

  /**
   * Pulls slips from Neon Postgres into local IndexedDB.
   * Ensures new browsers/devices or fresh logins display existing slips.
   */
  public async pullFromCloud(token?: string): Promise<number> {
    if (!navigator.onLine) return 0;

    let authToken = token;
    if (!authToken) {
      const db = await getMandiDB();
      const auth = await db.get('auth', 'current');
      authToken = auth?.token;
    }
    if (!authToken) return 0;

    try {
      const res = await fetch('/api/slips?limit=300', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) return 0;

      const data = await res.json();
      const serverSlips: any[] = data?.slips || [];
      let importedCount = 0;

      for (const row of serverSlips) {
        if (!row.id) continue;
        const local = await getSlipRecord(row.id);
        if (!local) {
          const record = convertServerSlipToLocalRecord(row);
          await saveSlipRecord(record);
          importedCount++;
        } else {
          let changed = false;
          if (!local.voided && row.voided_at) {
            local.voided = {
              at: typeof row.voided_at === 'string' ? row.voided_at : new Date(row.voided_at).toISOString(),
              reason: row.void_reason || 'Voided',
              syncStatus: 'synced',
            };
            changed = true;
          }
          if (local.syncStatus !== 'synced') {
            local.syncStatus = 'synced';
            local.syncError = undefined;
            changed = true;
          }
          if (changed) {
            await saveSlipRecord(local);
          }
        }
      }

      return importedCount;
    } catch (err) {
      console.error('Failed to pull slips from cloud:', err);
      return 0;
    }
  }

  /**
   * Full bidirectional sync:
   * 1. Pushes any pending/local slips to Neon Postgres
   * 2. Pulls all cloud slips into local IndexedDB
   */
  public async triggerSync(): Promise<void> {
    if (this.isRunning || !navigator.onLine) return;

    this.isRunning = true;
    this.lastError = null;
    this.notify();

    try {
      const db = await getMandiDB();
      const auth = await db.get('auth', 'current');
      if (!auth?.token) {
        this.isRunning = false;
        this.notify();
        return;
      }

      // Step 1: Push any pending slips
      const pending = await getPendingSlips();
      this.pendingCount = pending.length;

      if (pending.length > 0) {
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
          await db.delete('auth', 'current');
          this.lastError = 'Session expired. Please log in again.';
          this.isRunning = false;
          this.notify();
          return;
        }

        if (res.ok) {
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
        }
      }

      // Step 2: Always Pull latest slips from cloud
      await this.pullFromCloud(auth.token);

      this.lastSyncedAt = new Date();
      await this.updatePendingCount();
    } catch (err: unknown) {
      this.lastError = err instanceof Error ? err.message : 'Sync network error';
    } finally {
      this.isRunning = false;
      this.notify();
    }
  }

  public async retrySlip(id: string): Promise<void> {
    await resetSlipSyncStatus(id);
    await this.updatePendingCount();
    await this.triggerSync();
  }

  public async retryAllRejected(): Promise<number> {
    const count = await resetAllRejectedSlips();
    await this.updatePendingCount();
    if (count > 0) {
      await this.triggerSync();
    }
    return count;
  }

  public destroy() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }
}

export const syncWorker = new SyncWorker();
