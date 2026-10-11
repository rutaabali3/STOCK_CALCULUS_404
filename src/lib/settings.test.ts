import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  DEFAULT_SETTINGS,
  DEFAULT_SLIP_CUSTOMIZATION,
  AppSettings,
} from './settings';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('Settings & Slip Customization', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('loads default settings with default slip customization when empty', () => {
    const settings = loadSettings();
    expect(settings.shopName).toBe('Al-Madina Mandi Commission Shop');
    expect(settings.slipWidthMm).toBe(90);
    expect(settings.slipCustomization).toEqual(DEFAULT_SLIP_CUSTOMIZATION);
    expect(settings.slipCustomization.showBagsGrid).toBe(true);
    expect(settings.slipCustomization.showParties).toBe(true);
    expect(settings.slipCustomization.compactMode).toBe(false);
  });

  it('merges legacy stored settings without slipCustomization cleanly', () => {
    const legacy = {
      shopName: 'Kisan Traders',
      defaultRatePaisa: 220000,
      defaultTareG: 1000,
      chargeMode: 'deduct',
      roundToRupee: false,
      slipWidthMm: 80,
      theme: 'dark',
    };
    localStorage.setItem('mandi_settings_v1', JSON.stringify(legacy));

    const settings = loadSettings();
    expect(settings.shopName).toBe('Kisan Traders');
    expect(settings.slipWidthMm).toBe(80);
    expect(settings.chargeMode).toBe('deduct');
    expect(settings.roundToRupee).toBe(false);
    expect(settings.slipCustomization).toBeDefined();
    expect(settings.slipCustomization.showBagsGrid).toBe(true);
    expect(settings.slipCustomization.shopSubtitle).toBe('Mandi Commission Shop');
  });

  it('saves and loads customized slip options', () => {
    const customized: AppSettings = {
      ...DEFAULT_SETTINGS,
      shopName: 'Punjab Grain Market',
      slipWidthMm: 58,
      slipCustomization: {
        ...DEFAULT_SLIP_CUSTOMIZATION,
        shopSubtitle: 'Commission & Aadhat Agent',
        shopPhone: '0300-9876543',
        shopAddress: 'Gala Mandi Sahiwal',
        footerText: 'Thank you for your business!',
        showBagsGrid: false,
        compactMode: true,
        fontSize: 'sm',
      },
    };

    saveSettings(customized);
    const loaded = loadSettings();

    expect(loaded.shopName).toBe('Punjab Grain Market');
    expect(loaded.slipWidthMm).toBe(58);
    expect(loaded.slipCustomization.shopSubtitle).toBe('Commission & Aadhat Agent');
    expect(loaded.slipCustomization.shopPhone).toBe('0300-9876543');
    expect(loaded.slipCustomization.shopAddress).toBe('Gala Mandi Sahiwal');
    expect(loaded.slipCustomization.footerText).toBe('Thank you for your business!');
    expect(loaded.slipCustomization.showBagsGrid).toBe(false);
    expect(loaded.slipCustomization.compactMode).toBe(true);
    expect(loaded.slipCustomization.fontSize).toBe('sm');
  });
});
