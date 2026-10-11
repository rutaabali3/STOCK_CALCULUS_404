import { ChargeMode } from 'shared/types';

export type SlipWidthMm = 58 | 80 | 90;
export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  shopName: string;
  defaultRatePaisa: number;     // e.g. 200000 for Rs. 2000
  defaultTareG: number;         // e.g. 0
  chargeMode: ChargeMode;       // 'add' | 'deduct'
  roundToRupee: boolean;        // default: true
  slipWidthMm: SlipWidthMm;     // default: 90
  theme: ThemeMode;             // default: 'system'
}

const SETTINGS_KEY = 'mandi_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'Al-Madina Mandi Commission Shop',
  defaultRatePaisa: 200000,
  defaultTareG: 0,
  chargeMode: 'add',
  roundToRupee: true,
  slipWidthMm: 90,
  theme: 'system',
};

export function applyTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      applyTheme(DEFAULT_SETTINGS.theme);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
    applyTheme(settings.theme || 'system');
    return settings;
  } catch {
    applyTheme(DEFAULT_SETTINGS.theme);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applyTheme(settings.theme || 'system');
  } catch {
    // ignore
  }
}
