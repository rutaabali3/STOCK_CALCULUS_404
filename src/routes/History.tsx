import React, { useState, useEffect, useMemo } from 'react';
import { LocalSlipRecord, getAllSlipRecords, voidSlipRecord } from '../lib/db';
import { formatDecimal } from 'shared/decimal';
import { Search, Ban, Eye, ArrowLeft, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Md3Button } from '../components/md3/Md3Button';
import { Md3Dialog } from '../components/md3/Md3Dialog';
import { Md3TextField } from '../components/md3/Md3TextField';
import { Md3Chip } from '../components/md3/Md3Chip';
import { syncWorker } from '../lib/sync';

interface HistoryProps {
  onSelectSlip: (record: LocalSlipRecord) => void;
  onBack: () => void;
}

type FilterStatus = 'all' | 'pending' | 'synced' | 'rejected' | 'voided';

export const History: React.FC<HistoryProps> = ({ onSelectSlip, onBack }) => {
  const [records, setRecords] = useState<LocalSlipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  // Void modal state
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState<string | null>(null);

  useEffect(() => {
    loadSlips();
    const unsub = syncWorker.subscribe((state) => {
      if (!state.isSyncing) {
        loadSlips();
      }
    });
    return unsub;
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

  const rejectedSlips = useMemo(
    () => records.filter((r) => r.syncStatus === 'rejected' && !r.voided),
    [records]
  );

  const handleRetrySlip = async (id: string) => {
    await syncWorker.retrySlip(id);
    await loadSlips();
  };

  const handleRetryAll = async () => {
    await syncWorker.retryAllRejected();
    await loadSlips();
  };

  const filteredSlips = useMemo(() => {
    let list = records;

    if (activeFilter === 'pending') {
      list = list.filter((r) => r.syncStatus === 'pending' && !r.voided);
    } else if (activeFilter === 'synced') {
      list = list.filter((r) => r.syncStatus === 'synced' && !r.voided);
    } else if (activeFilter === 'rejected') {
      list = list.filter((r) => r.syncStatus === 'rejected' && !r.voided);
    } else if (activeFilter === 'voided') {
      list = list.filter((r) => Boolean(r.voided));
    }

    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const codeMatch = r.slipCode.toLowerCase().includes(q);
      const sellerMatch = r.payload.seller?.toLowerCase().includes(q) ?? false;
      const buyerMatch = r.payload.buyer?.toLowerCase().includes(q) ?? false;
      return codeMatch || sellerMatch || buyerMatch;
    });
  }, [records, searchTerm, activeFilter]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pb-4 border-b border-md-outline-variant/20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-md-on-surface-variant hover:text-md-on-surface hover:bg-md-on-surface/[0.08] transition-colors"
            aria-label="Back to weighment"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-md-on-surface tracking-tight">
              Weighment History
            </h1>
            <p className="text-xs text-md-on-surface-variant font-medium mt-0.5">
              {records.length} Total Records
            </p>
          </div>
        </div>
      </header>

      {/* Search and Filters Bar */}
      <div className="space-y-3">
        {/* MD3 Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-md-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search seller, buyer, or slip code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 sm:h-14 pl-12 pr-4 text-base bg-md-surface-container-high text-md-on-surface border border-md-outline/40 rounded-full focus:outline-none focus:border-2 focus:border-md-primary focus:ring-4 focus:ring-md-primary/10 shadow-xs transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Md3Chip
            label={`All (${records.length})`}
            selected={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          <Md3Chip
            label="Pending Sync"
            selected={activeFilter === 'pending'}
            onClick={() => setActiveFilter('pending')}
          />
          <Md3Chip
            label="Synced"
            selected={activeFilter === 'synced'}
            onClick={() => setActiveFilter('synced')}
          />
          {rejectedSlips.length > 0 && (
            <Md3Chip
              label={`Rejected (${rejectedSlips.length})`}
              selected={activeFilter === 'rejected'}
              onClick={() => setActiveFilter('rejected')}
              className="!border-md-error/40 text-md-error"
            />
          )}
          <Md3Chip
            label="Voided"
            selected={activeFilter === 'voided'}
            onClick={() => setActiveFilter('voided')}
          />
        </div>
      </div>

      {/* Rejected Slips Alert Banner */}
      {rejectedSlips.length > 0 && (
        <div className="p-4 rounded-2xl bg-md-error-container/20 border border-md-error/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-md-error shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-bold text-md-on-surface">
                {rejectedSlips.length} {rejectedSlips.length === 1 ? 'slip is' : 'slips are'} marked Rejected
              </p>
              <p className="text-xs text-md-on-surface-variant">
                Postgres database tables have been auto-initialized. Click to retry syncing now.
              </p>
            </div>
          </div>
          <Md3Button
            variant="filled"
            size="sm"
            onClick={handleRetryAll}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            className="!bg-md-error !text-md-on-error shrink-0 font-bold self-start sm:self-auto"
          >
            Retry Sync ({rejectedSlips.length})
          </Md3Button>
        </div>
      )}

      {/* List of Slips in Responsive Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-md-on-surface-variant">
          Loading weighment slips...
        </div>
      ) : filteredSlips.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-md-outline-variant/50 rounded-3xl bg-md-surface-container-low">
          <p className="text-sm font-medium text-md-on-surface-variant">
            {searchTerm || activeFilter !== 'all'
              ? 'No matching slips found.'
              : 'No slips saved yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`p-4 rounded-2xl border transition-all duration-200 bg-md-surface-container-low flex flex-col justify-between gap-3 shadow-sm hover:shadow-md-2 ${
                  isVoided
                    ? 'border-md-error/30 bg-md-error-container/10 opacity-75'
                    : 'border-md-outline-variant/30 hover:border-md-outline-variant'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-md-primary tracking-tight">
                          #{rec.slipCode}
                        </span>
                        {isVoided && (
                          <span className="px-2 py-0.5 bg-md-error text-md-on-error text-[10px] font-black uppercase rounded-full">
                            VOID
                          </span>
                        )}
                        {/* Sync Status Badge */}
                        {rec.syncStatus === 'synced' ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-md-primary">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Synced</span>
                          </span>
                        ) : rec.syncStatus === 'rejected' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-[11px] font-bold text-md-error">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRetrySlip(rec.id);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold bg-md-error/15 text-md-error hover:bg-md-error hover:text-md-on-error rounded-full transition-colors flex items-center gap-1"
                              title="Retry syncing this slip"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-md-on-surface-variant">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-md-on-surface-variant mt-0.5 block">
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-black tabular-nums ${
                          isVoided ? 'line-through text-md-on-surface-variant' : 'text-md-on-surface'
                        }`}
                      >
                        Rs. {rec.calcResult.totalRupees.toLocaleString('en-PK')}
                      </div>
                      <span className="text-xs text-md-on-surface-variant font-semibold tabular-nums">
                        {rec.calcResult.bagCount} Bags • {formatDecimal(rec.calcResult.netG, 3)} kg
                      </span>
                    </div>
                  </div>

                  {/* Seller / Buyer Tags if provided */}
                  {(rec.payload.seller || rec.payload.buyer) && (
                    <div className="text-xs text-md-on-surface-variant flex items-center gap-3 pt-2 border-t border-md-outline-variant/15 font-medium">
                      {rec.payload.seller && (
                        <span>
                          S: <strong className="text-md-on-surface">{rec.payload.seller}</strong>
                        </span>
                      )}
                      {rec.payload.buyer && (
                        <span>
                          B: <strong className="text-md-on-surface">{rec.payload.buyer}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejected Error Notice */}
                  {rec.syncStatus === 'rejected' && (
                    <div className="text-[11px] text-md-error bg-md-error-container/20 px-2.5 py-1.5 rounded-xl border border-md-error/25 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {rec.syncError || 'Sync failed. Click Retry to upload to database.'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetrySlip(rec.id)}
                        className="underline text-[10px] font-bold shrink-0 hover:opacity-80"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Void reason notice */}
                  {isVoided && rec.voided?.reason && (
                    <p className="text-[11px] text-md-error italic bg-md-error-container/30 px-2 py-1 rounded-lg">
                      Void reason: {rec.voided.reason}
                    </p>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-md-outline-variant/15">
                  {!isVoided && (
                    <button
                      type="button"
                      onClick={() => {
                        setVoidingId(rec.id);
                        setVoidReason('');
                        setVoidError(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-md-on-surface-variant hover:text-md-error flex items-center gap-1 rounded-full hover:bg-md-error/10 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Void</span>
                    </button>
                  )}

                  <Md3Button
                    variant="tonal"
                    size="sm"
                    onClick={() => onSelectSlip(rec)}
                    icon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Slip
                  </Md3Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MD3 Void Modal Dialog */}
      <Md3Dialog
        open={Boolean(voidingId)}
        onClose={() => setVoidingId(null)}
        title="Void Weighment Slip"
        icon={<Ban className="w-5 h-5 text-md-error" />}
        actions={
          <>
            <Md3Button
              variant="text"
              size="sm"
              onClick={() => setVoidingId(null)}
            >
              Cancel
            </Md3Button>
            <Md3Button
              variant="filled"
              size="sm"
              onClick={handleConfirmVoid}
              className="!bg-md-error !text-md-on-error"
            >
              Confirm Void
            </Md3Button>
          </>
        }
      >
        <div className="space-y-3 pt-1">
          <p className="text-xs text-md-on-surface-variant">
            Slips are never deleted. Please enter a reason to permanently mark this slip as voided.
          </p>
          <Md3TextField
            placeholder="e.g. Incorrect weight entry, cancelled deal"
            value={voidReason}
            error={voidError}
            onChange={(e) => {
              setVoidReason(e.target.value);
              if (voidError) setVoidError(null);
            }}
          />
        </div>
      </Md3Dialog>
    </div>
  );
};
