import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SlipPayload, CalcResult } from 'shared/types';
import { AppSettings, DEFAULT_SETTINGS } from './settings';

export type SyncStatus = 'pending' | 'synced' | 'rejected';

export interface LocalSlipRecord {
  id: string; // ULID
  slipCode: string;
  createdAt: string; // ISO 8601 string
  payload: SlipPayload;
  calcResult: CalcResult;
  syncStatus: SyncStatus;
  syncError?: string;
  syncedAt?: string;
  voided?: {
    at: string;
    reason: string;
    syncStatus: SyncStatus;
  };
}

export interface AuthRecord {
  token: string;
  expiresAt: string;
}

interface MandiDB extends DBSchema {
  slips: {
    key: string;
    value: LocalSlipRecord;
    indexes: {
      'by-created': string;
      'by-syncStatus': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  auth: {
    key: string;
    value: AuthRecord;
  };
}

const DB_NAME = 'mandi_db_v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MandiDB>> | null = null;

export function getMandiDB(): Promise<IDBPDatabase<MandiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MandiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Slips store
        if (!db.objectStoreNames.contains('slips')) {
          const slipStore = db.createObjectStore('slips', { keyPath: 'id' });
          slipStore.createIndex('by-created', 'createdAt');
          slipStore.createIndex('by-syncStatus', 'syncStatus');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Auth store
        if (!db.objectStoreNames.contains('auth')) {
          db.createObjectStore('auth');
        }
      },
    });
  }
  return dbPromise;
}

// Request persistent storage on mobile (Chrome/Android/Firefox)
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

// Device ID management
const DEVICE_ID_KEY = 'mandi_device_id_v1';
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/* -------------------------------------------------------------
 * AUTH REPOSITORY
 * ------------------------------------------------------------- */

export async function getAuthRecord(): Promise<AuthRecord | undefined> {
  const db = await getMandiDB();
  return await db.get('auth', 'current');
}

export async function setAuthRecord(auth: AuthRecord): Promise<void> {
  const db = await getMandiDB();
  await db.put('auth', auth, 'current');
}

export async function clearAuthRecord(): Promise<void> {
  const db = await getMandiDB();
  await db.delete('auth', 'current');
}

export async function isSessionValid(): Promise<boolean> {
  try {
    const auth = await getAuthRecord();
    if (!auth?.token || !auth.expiresAt) return false;
    return new Date(auth.expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------
 * SLIPS REPOSITORY
 * ------------------------------------------------------------- */

export async function saveSlipRecord(record: LocalSlipRecord): Promise<void> {
  const db = await getMandiDB();
  await db.put('slips', record);
}

export async function getSlipRecord(id: string): Promise<LocalSlipRecord | undefined> {
  const db = await getMandiDB();
  return await db.get('slips', id);
}

export async function getAllSlipRecords(): Promise<LocalSlipRecord[]> {
  const db = await getMandiDB();
  const records = await db.getAllFromIndex('slips', 'by-created');
  // Reverse chronological (newest first)
  return records.reverse();
}

export async function getPendingSlips(): Promise<LocalSlipRecord[]> {
  const db = await getMandiDB();
  return await db.getAllFromIndex('slips', 'by-syncStatus', 'pending');
}

export async function resetSlipSyncStatus(id: string): Promise<void> {
  const db = await getMandiDB();
  const tx = db.transaction('slips', 'readwrite');
  const record = await tx.store.get(id);
  if (record) {
    record.syncStatus = 'pending';
    record.syncError = undefined;
    await tx.store.put(record);
  }
  await tx.done;
}

export async function resetAllRejectedSlips(): Promise<number> {
  const db = await getMandiDB();
  const tx = db.transaction('slips', 'readwrite');
  const all = await tx.store.getAll();
  let count = 0;
  for (const record of all) {
    if (record.syncStatus === 'rejected') {
      record.syncStatus = 'pending';
      record.syncError = undefined;
      await tx.store.put(record);
      count++;
    }
  }
  await tx.done;
  return count;
}

export async function voidSlipRecord(id: string, reason: string): Promise<LocalSlipRecord | null> {
  const db = await getMandiDB();
  const tx = db.transaction('slips', 'readwrite');
  const record = await tx.store.get(id);

  if (!record) {
    await tx.done;
    return null;
  }

  // Idempotent void: if already voided, retain original voided timestamp
  if (!record.voided) {
    record.voided = {
      at: new Date().toISOString(),
      reason,
      syncStatus: 'pending',
    };
    await tx.store.put(record);
  }

  await tx.done;
  return record;
}

/* -------------------------------------------------------------
 * SETTINGS REPOSITORY
 * ------------------------------------------------------------- */

export async function getStoredSettings(): Promise<AppSettings> {
  const db = await getMandiDB();
  const saved = await db.get('settings', 'current');
  if (!saved) return DEFAULT_SETTINGS;
  const slipCustomization = {
    ...DEFAULT_SETTINGS.slipCustomization,
    ...(saved.shopSubtitle !== undefined ? { shopSubtitle: saved.shopSubtitle } : {}),
    ...(saved.shopPhone !== undefined ? { shopPhone: saved.shopPhone } : {}),
    ...(saved.shopAddress !== undefined ? { shopAddress: saved.shopAddress } : {}),
    ...(saved.footerText !== undefined ? { footerText: saved.footerText } : {}),
    ...(saved.slipCustomization || {}),
  };
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    shopSubtitle: slipCustomization.shopSubtitle,
    shopPhone: slipCustomization.shopPhone,
    shopAddress: slipCustomization.shopAddress,
    footerText: slipCustomization.footerText,
    slipCustomization,
  };
}

export async function setStoredSettings(settings: AppSettings): Promise<void> {
  const db = await getMandiDB();
  await db.put('settings', settings, 'current');
}

/* -------------------------------------------------------------
 * BACKUP / RESTORE REPOSITORY
 * ------------------------------------------------------------- */

export interface BackupData {
  version: 1;
  exportedAt: string;
  settings: AppSettings;
  slips: LocalSlipRecord[];
}

export async function exportBackupData(): Promise<BackupData> {
  const slips = await getAllSlipRecords();
  const settings = await getStoredSettings();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    slips,
  };
}

export async function importBackupData(data: BackupData): Promise<{ imported: number; skipped: number }> {
  if (data.version !== 1 || !Array.isArray(data.slips)) {
    throw new Error('Invalid backup file format');
  }

  const db = await getMandiDB();
  const tx = db.transaction(['slips', 'settings'], 'readwrite');
  let imported = 0;
  let skipped = 0;

  for (const slip of data.slips) {
    const existing = await tx.objectStore('slips').get(slip.id);
    if (!existing) {
      await tx.objectStore('slips').put(slip);
      imported++;
    } else {
      skipped++;
    }
  }

  if (data.settings) {
    await tx.objectStore('settings').put(data.settings, 'current');
  }

  await tx.done;
  return { imported, skipped };
}
