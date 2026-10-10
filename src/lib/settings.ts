import { ChargeMode } from 'shared/types';

export type SlipWidthMm = 58 | 80 | 90;

export interface AppSettings {
  shopName: string;
  defaultRatePaisa: number;     // e.g. 200000 for Rs. 2000
  defaultTareG: number;         // e.g. 0
  chargeMode: ChargeMode;       // 'add' | 'deduct'
  roundToRupee: boolean;        // default: true
  slipWidthMm: SlipWidthMm;     // default: 90
}

const SETTINGS_KEY = 'mandi_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'Al-Madina Mandi Commission Shop',
  defaultRatePaisa: 200000,
  defaultTareG: 0,
  chargeMode: 'add',
  roundToRupee: true,
  slipWidthMm: 90,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}
