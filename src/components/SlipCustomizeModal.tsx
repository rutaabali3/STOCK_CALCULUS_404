import React, { useState } from 'react';
import { SlipCustomization, SlipFontSize } from '../lib/settings';
import { Md3Dialog } from './md3/Md3Dialog';
import { Md3Button } from './md3/Md3Button';
import { Md3TextField } from './md3/Md3TextField';
import { Md3Switch } from './md3/Md3Switch';
import { Md3SegmentedButton } from './md3/Md3SegmentedButton';
import { Store, Eye, Printer, RotateCcw, Check, Sparkles } from 'lucide-react';

export interface SlipCustomizeModalProps {
  open: boolean;
  onClose: () => void;
  customization: SlipCustomization;
  onChangeCustomization: (custom: SlipCustomization) => void;
  shopName: string;
  onChangeShopName: (name: string) => void;
  slipWidthMm: 58 | 80 | 90;
  onChangeSlipWidthMm: (width: 58 | 80 | 90) => void;
  onResetDefaults: () => void;
  onSaveAsDefault?: () => void;
}

type TabKey = 'header' | 'sections' | 'layout';

export const SlipCustomizeModal: React.FC<SlipCustomizeModalProps> = ({
  open,
  onClose,
  customization,
  onChangeCustomization,
  shopName,
  onChangeShopName,
  slipWidthMm,
  onChangeSlipWidthMm,
  onResetDefaults,
  onSaveAsDefault,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('header');
  const [saveAsDefaultCheck, setSaveAsDefaultCheck] = useState(true);

  const update = (patch: Partial<SlipCustomization>) => {
    onChangeCustomization({
      ...customization,
      ...patch,
    });
  };

  const handleDone = () => {
    if (saveAsDefaultCheck && onSaveAsDefault) {
      onSaveAsDefault();
    }
    onClose();
  };

  return (
    <Md3Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      icon={<Sparkles className="w-5 h-5 text-md-primary" />}
      title="Customize Slip"
      actions={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-xs font-semibold text-md-error hover:underline flex items-center gap-1 p-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onSaveAsDefault && (
              <label className="flex items-center gap-1.5 text-xs text-md-on-surface-variant font-medium cursor-pointer mr-2 select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefaultCheck}
                  onChange={(e) => setSaveAsDefaultCheck(e.target.checked)}
                  className="rounded text-md-primary focus:ring-md-primary w-3.5 h-3.5 cursor-pointer"
                />
                <span>Save as Default</span>
              </label>
            )}

            <Md3Button variant="filled" size="sm" onClick={handleDone} icon={<Check className="w-4 h-4" />}>
              Done
            </Md3Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-md-on-surface-variant">
          Adjust header branding, choose which elements appear, and format the slip layout. Changes are reflected live on the preview.
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-md-outline-variant/30 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'header'
                ? 'bg-md-primary-container text-md-on-primary-container'
                : 'text-md-on-surface-variant hover:bg-md-surface-container'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Shop & Header</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'sections'
                ? 'bg-md-primary-container text-md-on-primary-container'
                : 'text-md-on-surface-variant hover:bg-md-surface-container'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visible Items</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
              activeTab === 'layout'
                ? 'bg-md-primary-container text-md-on-primary-container'
                : 'text-md-on-surface-variant hover:bg-md-surface-container'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Layout & Print</span>
          </button>
        </div>

        {/* TAB 1: SHOP & HEADER */}
        {activeTab === 'header' && (
          <div className="space-y-3.5 py-1">
            <Md3TextField
              label="Shop / Business Title"
              value={shopName}
              onChange={(e) => onChangeShopName(e.target.value)}
              placeholder="e.g. Al-Madina Mandi Commission Shop"
            />

            <Md3TextField
              label="Shop Tagline / Subtitle"
              value={customization.shopSubtitle ?? 'Mandi Commission Shop'}
              onChange={(e) => update({ shopSubtitle: e.target.value })}
              placeholder="e.g. Mandi Commission Shop (Leave blank to hide)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Md3TextField
                label="Phone / WhatsApp Contact"
                value={customization.shopPhone ?? ''}
                onChange={(e) => update({ shopPhone: e.target.value })}
                placeholder="e.g. 0300-1234567"
              />

              <Md3TextField
                label="Shop Address / Market Location"
                value={customization.shopAddress ?? ''}
                onChange={(e) => update({ shopAddress: e.target.value })}
                placeholder="e.g. Shop #12, Ghalla Mandi"
              />
            </div>
          </div>
        )}

        {/* TAB 2: VISIBLE SECTIONS */}
        {activeTab === 'sections' && (
          <div className="space-y-2 py-1 max-h-[50vh] overflow-y-auto pr-1">
            <div className="text-xs font-bold uppercase tracking-wider text-md-primary mb-2">
              Toggle Slip Sections
            </div>

            {/* Bag Weights Grid */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Bag Weights Grid
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show individual weight chips for each bag weighed
                </span>
              </div>
              <Md3Switch
                checked={customization.showBagsGrid !== false}
                onChange={(checked) => update({ showBagsGrid: checked })}
                ariaLabel="Show bag weights grid"
              />
            </div>

            {/* Seller & Buyer */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Seller & Buyer Details
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show customer and party names when provided
                </span>
              </div>
              <Md3Switch
                checked={customization.showParties !== false}
                onChange={(checked) => update({ showParties: checked })}
                ariaLabel="Show seller and buyer details"
              />
            </div>

            {/* Date & Time */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Date & Time
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Display weighment timestamp on slip
                </span>
              </div>
              <Md3Switch
                checked={customization.showDate !== false}
                onChange={(checked) => update({ showDate: checked })}
                ariaLabel="Show date and time"
              />
            </div>

            {/* Slip Code */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Slip Code / ID
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Display unique serial code (e.g. #1011-ABCD)
                </span>
              </div>
              <Md3Switch
                checked={customization.showSlipCode !== false}
                onChange={(checked) => update({ showSlipCode: checked })}
                ariaLabel="Show slip code"
              />
            </div>

            {/* Mann Equivalent */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Mann Equivalent Line
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show standard 1 Mann = 40 kg conversion line
                </span>
              </div>
              <Md3Switch
                checked={customization.showMann !== false}
                onChange={(checked) => update({ showMann: checked })}
                ariaLabel="Show Mann equivalent"
              />
            </div>

            {/* Tare Deduction */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Tare & Net Weight Breakdown
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show per-bag deduction and net weight calculation
                </span>
              </div>
              <Md3Switch
                checked={customization.showTare !== false}
                onChange={(checked) => update({ showTare: checked })}
                ariaLabel="Show tare deduction"
              />
            </div>

            {/* Gross Weight */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Gross Weight Line
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show total un-deducted gross weight
                </span>
              </div>
              <Md3Switch
                checked={customization.showGrossWeight !== false}
                onChange={(checked) => update({ showGrossWeight: checked })}
                ariaLabel="Show gross weight"
              />
            </div>

            {/* Rate per Mann */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Rate per Mann Line
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show applied rate in summary breakdown
                </span>
              </div>
              <Md3Switch
                checked={customization.showRate !== false}
                onChange={(checked) => update({ showRate: checked })}
                ariaLabel="Show rate per Mann"
              />
            </div>

            {/* Base Amount */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Base Amount Line
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show subtotal before commission and mazdoori
                </span>
              </div>
              <Md3Switch
                checked={customization.showBaseAmount !== false}
                onChange={(checked) => update({ showBaseAmount: checked })}
                ariaLabel="Show base amount"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Footer Banner
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Show bottom statement or closing message
                </span>
              </div>
              <Md3Switch
                checked={customization.showFooter !== false}
                onChange={(checked) => update({ showFooter: checked })}
                ariaLabel="Show footer"
              />
            </div>
          </div>
        )}

        {/* TAB 3: LAYOUT & PRINT */}
        {activeTab === 'layout' && (
          <div className="space-y-4 py-1">
            {/* Slip Width */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
                Thermal Print Paper Width
              </label>
              <Md3SegmentedButton<58 | 80 | 90>
                value={slipWidthMm}
                onChange={onChangeSlipWidthMm}
                className="w-full justify-center"
                options={[
                  { value: 58, label: '58 mm (Mini POS)' },
                  { value: 80, label: '80 mm (Standard POS)' },
                  { value: 90, label: '90 mm (Full Receipt)' },
                ]}
              />
            </div>

            {/* Compact Mode Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-md-surface-container-low border border-md-outline-variant/15">
              <div>
                <span className="block text-xs font-bold text-md-on-surface">
                  Compact Paper-Saving Mode
                </span>
                <span className="text-[11px] text-md-on-surface-variant">
                  Tighter vertical padding & margins to minimize thermal paper roll usage
                </span>
              </div>
              <Md3Switch
                checked={Boolean(customization.compactMode)}
                onChange={(checked) => update({ compactMode: checked })}
                ariaLabel="Compact mode"
              />
            </div>

            {/* Font Scale */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-md-on-surface-variant">
                Print Font Scaling
              </label>
              <Md3SegmentedButton<SlipFontSize>
                value={customization.fontSize || 'base'}
                onChange={(fontSize) => update({ fontSize })}
                className="w-full justify-center"
                options={[
                  { value: 'sm', label: 'Compact / Small' },
                  { value: 'base', label: 'Standard' },
                  { value: 'lg', label: 'Large / High Contrast' },
                ]}
              />
            </div>

            {/* Custom Footer Message */}
            <Md3TextField
              label="Custom Footer Slogan / Notice"
              value={customization.footerText ?? 'Standard: 1 Mann = 40 kg • Computer Generated Slip'}
              onChange={(e) => update({ footerText: e.target.value })}
              placeholder="e.g. Shukriya! Phir Tashreef Layen"
            />
          </div>
        )}
      </div>
    </Md3Dialog>
  );
};
