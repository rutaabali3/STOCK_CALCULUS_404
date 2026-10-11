import { ChargeMode } from 'shared/types';

export type SlipWidthMm = 58 | 80 | 90;
export type ThemeMode = 'system' | 'light' | 'dark';
export type SlipFontSize = 'sm' | 'base' | 'lg';

export interface SlipCustomization {
  shopSubtitle?: string;
  shopPhone?: string;
  shopAddress?: string;
  footerText?: string;
  showBagsGrid?: boolean;       // default: true
  showGrossWeight?: boolean;    // default: true
  showTare?: boolean;           // default: true
  showNetWeight?: boolean;      // default: true
  showMann?: boolean;           // default: true
  showRate?: boolean;           // default: true
  showBaseAmount?: boolean;     // default: true
  showParties?: boolean;        // default: true
  showDate?: boolean;           // default: true
  showSlipCode?: boolean;       // default: true
  showFooter?: boolean;         // default: true
  compactMode?: boolean;        // default: false
  fontSize?: SlipFontSize;      // default: 'base'
}

export interface AppSettings {
  shopName: string;
  shopSubtitle?: string;
  shopPhone?: string;
  shopAddress?: string;
  footerText?: string;
  defaultRatePaisa: number;     // e.g. 200000 for Rs. 2000
  defaultTareG: number;         // e.g. 0
  chargeMode: ChargeMode;       // 'add' | 'deduct'
  roundToRupee: boolean;        // default: true
  slipWidthMm: SlipWidthMm;     // default: 90
  theme: ThemeMode;             // default: 'system'
  slipCustomization: SlipCustomization;
}

const SETTINGS_KEY = 'mandi_settings_v1';

export const DEFAULT_SLIP_CUSTOMIZATION: SlipCustomization = {
  shopSubtitle: 'Mandi Commission Shop',
  shopPhone: '',
  shopAddress: '',
  footerText: 'Standard: 1 Mann = 40 kg • Computer Generated Slip',
  showBagsGrid: true,
  showGrossWeight: true,
  showTare: true,
  showNetWeight: true,
  showMann: true,
  showRate: true,
  showBaseAmount: true,
  showParties: true,
  showDate: true,
  showSlipCode: true,
  showFooter: true,
  compactMode: false,
  fontSize: 'base',
};

export const DEFAULT_SETTINGS: AppSettings = {
  shopName: 'Al-Madina Mandi Commission Shop',
  shopSubtitle: 'Mandi Commission Shop',
  shopPhone: '',
  shopAddress: '',
  footerText: 'Standard: 1 Mann = 40 kg • Computer Generated Slip',
  defaultRatePaisa: 200000,
  defaultTareG: 0,
  chargeMode: 'add',
  roundToRupee: true,
  slipWidthMm: 90,
  theme: 'system',
  slipCustomization: DEFAULT_SLIP_CUSTOMIZATION,
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
    const slipCustomization: SlipCustomization = {
      ...DEFAULT_SLIP_CUSTOMIZATION,
      ...(parsed.shopSubtitle !== undefined ? { shopSubtitle: parsed.shopSubtitle } : {}),
      ...(parsed.shopPhone !== undefined ? { shopPhone: parsed.shopPhone } : {}),
      ...(parsed.shopAddress !== undefined ? { shopAddress: parsed.shopAddress } : {}),
      ...(parsed.footerText !== undefined ? { footerText: parsed.footerText } : {}),
      ...(parsed.slipCustomization || {}),
    };

    const settings: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...parsed,
      shopSubtitle: slipCustomization.shopSubtitle,
      shopPhone: slipCustomization.shopPhone,
      shopAddress: slipCustomization.shopAddress,
      footerText: slipCustomization.footerText,
      slipCustomization,
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
