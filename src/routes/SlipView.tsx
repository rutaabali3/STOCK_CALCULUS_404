import React, { useRef, useState } from 'react';
import { SlipCard } from '../components/SlipCard';
import { CalcResult } from 'shared/types';
import { ExtrasState } from '../components/ExtrasPanel';
import { AppSettings } from '../lib/settings';
import { shareOrDownloadSlip, generateSlipPng, downloadDataUrl, generateSlipPdf } from '../lib/slipImage';
import { Share2, Download, PlusCircle, ArrowLeft, Check, FileText } from 'lucide-react';
import { Md3Button } from '../components/md3/Md3Button';
import { Md3SegmentedButton } from '../components/md3/Md3SegmentedButton';
import { Md3TextField } from '../components/md3/Md3TextField';

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
  const [customFileName, setCustomFileName] = useState<string>(
    slipData.extras.receiptName?.trim()
      ? `${slipData.extras.receiptName.trim()}-${slipData.slipCode}`
      : `mandi-slip-${slipData.slipCode}`
  );

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const res = await shareOrDownloadSlip(
        cardRef.current,
        slipData.slipCode,
        customFileName,
        currentWidthMm
      );
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

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const widthPx = currentWidthMm === 90 ? 648 : currentWidthMm === 80 ? 576 : 384;
      const dataUrl = await generateSlipPng(cardRef.current, widthPx);
      const name = customFileName.trim() ? customFileName.trim() : `mandi-slip-${slipData.slipCode}`;
      downloadDataUrl(dataUrl, name.toLowerCase().endsWith('.png') ? name : `${name}.png`);
      showToast('Slip image saved (PNG)');
    } catch {
      showToast('Failed to save image');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const name = customFileName.trim() ? customFileName.trim() : `mandi-slip-${slipData.slipCode}`;
      await generateSlipPdf(cardRef.current, name, currentWidthMm);
      showToast('Slip PDF saved');
    } catch {
      showToast('Failed to save PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-md-outline-variant/20 gap-3">
        <div className="flex items-center gap-3">
          {onBackToWeighing && (
            <button
              type="button"
              onClick={onBackToWeighing}
              className="p-2 -ml-2 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-on-surface/[0.08] transition-colors"
              aria-label="Back to current weighing"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-md-on-surface tracking-tight">
              Weighment Slip
            </h1>
            <p className="text-xs text-md-on-surface-variant font-medium mt-0.5">
              Code: #{slipData.slipCode}
            </p>
          </div>
        </div>

        {/* Width Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-md-on-surface-variant hidden md:inline">
            Print Width:
          </span>
          <Md3SegmentedButton<58 | 80 | 90>
            size="sm"
            value={currentWidthMm}
            onChange={setCurrentWidthMm}
            options={[
              { value: 58, label: '58 mm' },
              { value: 80, label: '80 mm' },
              { value: 90, label: '90 mm' },
            ]}
          />
        </div>
      </header>

      {/* Rendered Slip Card preview on MD3 Stage */}
      <div className="bg-md-surface-container-low rounded-3xl p-4 sm:p-6 border border-md-outline-variant/20 overflow-x-auto flex justify-start sm:justify-center shadow-inner">
        <div className="shrink-0 flex-none mx-auto">
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
      </div>

      {/* Action Controls Section */}
      <div className="space-y-4 max-w-xl mx-auto">
        {/* Custom File / Receipt Name */}
        <Md3TextField
          label="Custom File / Slip Name"
          value={customFileName}
          onChange={(e) => setCustomFileName(e.target.value)}
          placeholder={`mandi-slip-${slipData.slipCode}`}
        />

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-3">
          <Md3Button
            variant="filled"
            size="md"
            onClick={handleShare}
            disabled={loading}
            icon={<Share2 className="w-4 h-4" />}
          >
            {loading ? '...' : 'Share'}
          </Md3Button>

          <Md3Button
            variant="tonal"
            size="md"
            onClick={handleDownloadImage}
            disabled={loading}
            icon={<Download className="w-4 h-4" />}
          >
            PNG
          </Md3Button>

          <Md3Button
            variant="tonal"
            size="md"
            onClick={handleDownloadPdf}
            disabled={loading}
            icon={<FileText className="w-4 h-4" />}
          >
            PDF
          </Md3Button>
        </div>

        {/* Start New Weighing */}
        <Md3Button
          variant="elevated"
          size="lg"
          onClick={onNewWeighing}
          icon={<PlusCircle className="w-5 h-5 text-md-primary" />}
          className="w-full h-14 font-bold text-base shadow-md-2"
        >
          Start New Weighing
        </Md3Button>
      </div>

      {/* MD3 Success Notification Snackbar */}
      {successMsg && (
        <div className="fixed bottom-24 md:bottom-8 right-4 left-4 md:left-auto md:w-96 bg-md-inverse-surface text-md-inverse-on-surface px-5 py-3 rounded-2xl shadow-md-3 flex items-center justify-center gap-2 z-50 text-sm font-semibold animate-fade-in border border-white/10">
          <Check className="w-4 h-4 text-md-inverse-primary" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
