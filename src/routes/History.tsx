import React, { useState, useEffect, useMemo } from 'react';
import { LocalSlipRecord, getAllSlipRecords, voidSlipRecord } from '../lib/db';
import { formatDecimal } from 'shared/decimal';
import { Search, Ban, Eye, ArrowLeft, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface HistoryProps {
  onSelectSlip: (record: LocalSlipRecord) => void;
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ onSelectSlip, onBack }) => {
  const [records, setRecords] = useState<LocalSlipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Void modal state
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  useEffect(() => {
    loadSlips();
  }, []);

  const loadSlips = async () => {
    setLoading(true);
    try {
      const data = await getAllSlipRecords();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidingId) return;
    if (voidReason.trim().length < 3) {
      setVoidError('Please enter a valid reason (min 3 characters)');
      return;
    }

    await voidSlipRecord(voidingId, voidReason.trim());
    setVoidingId(null);
    setVoidReason('');
    setVoidError(null);
    await loadSlips();
  };

  const filteredSlips = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return records;

    return records.filter((r) => {
      const codeMatch = r.slipCode.toLowerCase().includes(q);
      const sellerMatch = r.payload.seller?.toLowerCase().includes(q) ?? false;
      const buyerMatch = r.payload.buyer?.toLowerCase().includes(q) ?? false;
      return codeMatch || sellerMatch || buyerMatch;
    });
  }, [records, searchTerm]);

  return (
    <div className="w-full max-w-md mx-auto min-h-screen p-4 pb-12 flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-moss/20">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="p-1 text-mist hover:text-forest transition-colors"
              aria-label="Back to weighment"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-forest">Weighment History</h1>
          </div>
          <span className="text-xs font-bold text-mist">{records.length} Slips</span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search seller, buyer, or slip code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-9 pr-4 text-sm bg-white border border-moss/30 rounded-xl focus:border-forest focus:outline-none"
          />
        </div>

        {/* List of Slips */}
        {loading ? (
          <div className="py-12 text-center text-sm font-semibold text-mist">
            Loading history...
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-mist/30 rounded-xl bg-white/40">
            <p className="text-sm font-medium text-mist">
              {searchTerm ? 'No matching slips found.' : 'No slips saved yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSlips.map((rec) => {
              const isVoided = Boolean(rec.voided);
              const dateStr = new Date(rec.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={rec.id}
                  className={`p-3.5 rounded-xl border transition-all bg-white shadow-sm flex flex-col gap-2 ${
                    isVoided
                      ? 'border-red-200 bg-red-50/30 opacity-75'
                      : 'border-moss/20 hover:border-moss'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-forest tracking-tight">
                          #{rec.slipCode}
                        </span>
                        {isVoided && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-black uppercase rounded">
                            VOID
                          </span>
                        )}
                        {/* Sync Status Badge */}
                        {rec.syncStatus === 'synced' ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-moss">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Synced</span>
                          </span>
                        ) : rec.syncStatus === 'rejected' ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-mist">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-mist">{dateStr}</span>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-black tabular-nums ${
                          isVoided ? 'line-through text-mist' : 'text-forest'
                        }`}
                      >
                        Rs. {rec.calcResult.totalRupees.toLocaleString('en-PK')}
                      </div>
                      <span className="text-xs text-mist font-semibold tabular-nums">
                        {rec.calcResult.bagCount} Bags • {formatDecimal(rec.calcResult.netG, 3)} kg
                      </span>
                    </div>
                  </div>

                  {/* Seller / Buyer Tags if provided */}
                  {(rec.payload.seller || rec.payload.buyer) && (
                    <div className="text-xs text-ink/80 flex items-center gap-3 pt-1 border-t border-moss/10 font-medium">
                      {rec.payload.seller && <span>S: <strong>{rec.payload.seller}</strong></span>}
                      {rec.payload.buyer && <span>B: <strong>{rec.payload.buyer}</strong></span>}
                    </div>
                  )}

                  {/* Void reason notice */}
                  {isVoided && rec.voided?.reason && (
                    <p className="text-[11px] text-red-600 italic">
                      Void reason: {rec.voided.reason}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!isVoided && (
                      <button
                        type="button"
                        onClick={() => {
                          setVoidingId(rec.id);
                          setVoidReason('');
                          setVoidError(null);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-mist hover:text-red-600 flex items-center gap-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Void</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectSlip(rec)}
                      className="px-3 py-1 bg-cream border border-moss/30 hover:border-forest text-forest text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Slip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Void Reason Modal */}
      {voidingId && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-scale-in">
            <div>
              <h2 className="text-base font-black text-forest">Void Weighment Slip</h2>
              <p className="text-xs text-mist mt-0.5">
                Slips are never hard-deleted. Please provide a reason to mark this slip as void.
              </p>
            </div>

            <input
              type="text"
              placeholder="e.g. Incorrect weight entry, cancelled deal"
              value={voidReason}
              onChange={(e) => {
                setVoidReason(e.target.value);
                if (voidError) setVoidError(null);
              }}
              className="w-full h-11 px-3 text-sm bg-cream/40 border border-moss/30 rounded-xl focus:border-red-600 focus:outline-none"
            />

            {voidError && (
              <p className="text-xs text-red-600 font-semibold">{voidError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidingId(null)}
                className="px-4 py-2 text-xs font-bold text-mist hover:text-ink rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow"
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
