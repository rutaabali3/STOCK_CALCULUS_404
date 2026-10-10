import React, { useRef, useState } from 'react';
import { SlipCard } from '../components/SlipCard';
import { CalcResult } from 'shared/types';
import { ExtrasState } from '../components/ExtrasPanel';
import { AppSettings } from '../lib/settings';
import { shareOrDownloadSlip, generateSlipPng, downloadDataUrl } from '../lib/slipImage';
import { Share2, Download, PlusCircle, ArrowLeft, Check } from 'lucide-react';

export interface SlipData {
  slipCode: string;
  createdAt: Date;
  weightsG: number[];
  calcResult: CalcResult;
  extras: ExtrasState;
  rateStr: string;
}

interface SlipViewProps {
  slipData: SlipData;
  settings: AppSettings;
  onNewWeighing: () => void;
  onBackToWeighing?: () => void;
}

export const SlipView: React.FC<SlipViewProps> = ({
  slipData,
  settings,
  onNewWeighing,
  onBackToWeighing,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentWidthMm, setCurrentWidthMm] = useState<58 | 80 | 90>(settings.slipWidthMm);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const res = await shareOrDownloadSlip(cardRef.current, slipData.slipCode);
      if (res.method === 'shared') {
        showToast('Slip shared successfully');
      } else {
        showToast('Slip image downloaded');
      }
    } catch {
      showToast('Could not share slip');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await generateSlipPng(cardRef.current);
      downloadDataUrl(dataUrl, `mandi-slip-${slipData.slipCode}.png`);
      showToast('Slip image saved');
    } catch {
      showToast('Failed to save image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen p-4 pb-12 flex flex-col justify-between space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-moss/20">
        <div className="flex items-center gap-2">
          {onBackToWeighing && (
            <button
              type="button"
              onClick={onBackToWeighing}
              className="p-1 text-mist hover:text-forest transition-colors"
              aria-label="Back to current weighing"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-black text-forest">Weighment Slip</h1>
        </div>

        {/* Width Toggle (58mm vs 80mm vs 90mm) */}
        <div className="flex bg-white rounded-lg p-0.5 border border-moss/20 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentWidthMm(58)}
            className={`px-2 py-1 rounded-md transition-all ${
              currentWidthMm === 58
                ? 'bg-forest text-white shadow-sm'
                : 'text-mist hover:text-ink'
            }`}
          >
            58 mm
          </button>
          <button
            type="button"
            onClick={() => setCurrentWidthMm(80)}
            className={`px-2 py-1 rounded-md transition-all ${
              currentWidthMm === 80
                ? 'bg-forest text-white shadow-sm'
                : 'text-mist hover:text-ink'
            }`}
          >
            80 mm
          </button>
          <button
            type="button"
            onClick={() => setCurrentWidthMm(90)}
            className={`px-2 py-1 rounded-md transition-all ${
              currentWidthMm === 90
                ? 'bg-forest text-white shadow-sm'
                : 'text-mist hover:text-ink'
            }`}
          >
            90 mm
          </button>
        </div>
      </div>

      {/* Rendered Slip Card preview */}
      <div className="overflow-x-auto py-2 flex justify-center">
        <SlipCard
          ref={cardRef}
          slipCode={slipData.slipCode}
          createdAt={slipData.createdAt}
          shopName={settings.shopName}
          weightsG={slipData.weightsG}
          calcResult={slipData.calcResult}
          extras={slipData.extras}
          rateStr={slipData.rateStr}
          slipWidthMm={currentWidthMm}
          chargeMode={settings.chargeMode}
          roundToRupee={settings.roundToRupee}
        />
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-forest text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 z-50 text-sm font-semibold animate-fade-in">
          <Check className="w-4 h-4 text-wheat" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action Buttons Panel */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-md pt-2 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            disabled={loading}
            className="h-12 bg-wheat hover:bg-wheat/90 active:scale-[0.98] text-forest font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>{loading ? 'Processing...' : 'Share Slip'}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className="h-12 bg-white hover:bg-cream/40 border border-moss/30 active:scale-[0.98] text-forest font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Save Image</span>
          </button>
        </div>

        {/* Start New Weighing */}
        <button
          type="button"
          onClick={onNewWeighing}
          className="w-full h-12 bg-forest hover:bg-forest/90 active:scale-[0.98] text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <PlusCircle className="w-5 h-5 text-wheat" />
          <span>Start New Weighing</span>
        </button>
      </div>
    </div>
  );
};
