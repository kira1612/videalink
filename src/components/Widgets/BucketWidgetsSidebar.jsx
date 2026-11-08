import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  ExternalLink,
  PinOff,
  RefreshCw,
  Plus,
  X,
  Check,
  AlertCircle,
  Hash,
  Activity,
  Layers,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { bucketsApi } from '../../services/api';
import { Gauge as BklitGauge, AreaSparkline as BklitAreaSparkline } from '../Charts/bklit';

/* ─────────────────────────────────────────────────────────────────────────
   Animated Number for Smooth Live Value Ticks
───────────────────────────────────────────────────────────────────────── */
export function AnimatedSidebarNumber({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const target = parseFloat(value);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }
    const current = parseFloat(displayValue);
    if (isNaN(current) || Math.abs(target - current) < 0.01) {
      setDisplayValue(value);
      return;
    }

    const start = current;
    const diff = target - start;
    const duration = 400;
    const startTime = performance.now();

    const update = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = start + diff * ease;

      const decimals = (value.toString().split('.')[1] || '').length;
      setDisplayValue(nextVal.toFixed(Math.min(2, decimals)));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(update);
  }, [value]);

  return <span>{displayValue ?? '-'}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────
   Single Pinned Bucket Widget Item Renderer
───────────────────────────────────────────────────────────────────────── */
function PinnedWidgetItem({
  item,
  records,
  onUnpin,
  isPlacedOnDashboard = false,
  onAddToDashboard,
  onRemoveFromDashboard,
}) {
  const { widget, bucketId, bucketName } = item;
  const primaryField = widget?.field !== 'multi' && widget?.field ? widget.field : (widget?.config?.fields?.[0] || 'telemetry');
  const latestRecord = records && records.length > 0 ? records[records.length - 1] : null;
  const rawValue = latestRecord ? latestRecord[primaryField] : undefined;
  const numVal = parseFloat(rawValue) || 0;
  const unit = widget?.unit || '';
  const color = widget?.color || widget?.config?.color || 'rgb(var(--primary-400))';

  // Format sparkline data
  const sparkData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records.slice(-15).map((r) => ({
      val: parseFloat(r[primaryField]) || 0,
    }));
  }, [records, primaryField]);

  return (
    <div className="vision-card p-4 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-300 flex flex-col justify-between">
      {/* Laser Top Glow */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-70 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      {/* Header: Bucket Badge, Title, and Action Controls */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary-500/10 text-primary-300 border border-primary-500/20 truncate max-w-[140px]">
              {bucketName || 'Data Bucket'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              • {widget.field}
            </span>
          </div>
          <h4 className="text-[13px] font-extrabold text-slate-100 truncate group-hover:text-primary-300 transition-colors">
            {widget.title}
          </h4>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Link
            to={`/app/buckets/${bucketId}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800 transition-colors"
            title="Buka Data Bucket ini"
          >
            <ExternalLink size={13} />
          </Link>
          <button
            type="button"
            onClick={() => onUnpin(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Lepas widget dari sidebar"
          >
            <PinOff size={13} />
          </button>
        </div>
      </div>

      {/* Widget Body Visual Based on Type */}
      <div className="my-1.5">
        {widget.type === 'gauge' ? (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="w-[170px]">
              <BklitGauge
                value={Math.min(
                  100,
                  Math.max(
                    0,
                    Math.round(
                      ((numVal - (widget.config?.min || 0)) /
                        ((widget.config?.max || 100) - (widget.config?.min || 0) || 1)) *
                        100
                    )
                  )
                )}
                centerValue={numVal}
                totalNotches={30}
                defaultLabel={widget.field}
                suffix={unit ? ` ${unit}` : ''}
                activeFill={color}
                glow={true}
                height={125}
              />
            </div>
            <div className="flex items-center justify-between w-full text-[10px] text-slate-400 px-2 mt-1">
              <span>Min: {widget.config?.min ?? 0}</span>
              <span className="font-extrabold text-emerald-400">Live</span>
              <span>Max: {widget.config?.max ?? 100}</span>
            </div>
          </div>
        ) : widget.type === 'stat' ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between px-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-100 tracking-tight">
                  <AnimatedSidebarNumber value={rawValue ?? '-'} />
                </span>
                {unit && (
                  <span className="text-sm font-bold text-primary-400">
                    {unit}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </div>

            {sparkData.length > 1 && (
              <div className="h-8 w-full pt-1">
                <BklitAreaSparkline
                  data={sparkData}
                  dataKey="val"
                  color={color}
                  height={30}
                  endDot={true}
                />
              </div>
            )}
          </div>
        ) : (
          /* Default Line / Area / Generic Visual */
          <div className="space-y-2">
            <div className="flex items-baseline justify-between px-1">
              <span className="text-2xl font-black text-slate-100">
                <AnimatedSidebarNumber value={rawValue ?? '-'} />
                {unit && <span className="text-xs font-bold text-primary-400 ml-1">{unit}</span>}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {widget.type}
              </span>
            </div>
            {sparkData.length > 1 ? (
              <div className="h-10 w-full pt-1">
                <BklitAreaSparkline
                  data={sparkData}
                  dataKey="val"
                  color={color}
                  height={38}
                  endDot={true}
                />
              </div>
            ) : (
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, numVal))}%`,
                    background: color,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          Diperbarui:{' '}
          {latestRecord?.created_at
            ? new Date(latestRecord.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : 'Realtime'}
        </span>
        <span className="font-mono text-slate-500">QoS 1</span>
      </div>

      {/* Action: Taruh di Dashboard Utama / Lepas dari Dashboard */}
      {isPlacedOnDashboard ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm">
            <Check size={13} className="text-emerald-400 stroke-[3]" />
            <span>Terpasang di Dashboard</span>
          </div>
          <button
            type="button"
            onClick={() => onRemoveFromDashboard && onRemoveFromDashboard(item.id)}
            className="py-1.5 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-700/70 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Hapus dari grid dashboard utama"
          >
            Lepas
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onAddToDashboard && onAddToDashboard(item)}
          className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-black bg-primary-500 hover:bg-primary-600 active:scale-95 text-white shadow-md shadow-primary-500/25 transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
          title="Tempatkan widget telemetri ini ke Grid Dashboard Utama"
        >
          <Plus size={14} className="stroke-[3] group-hover:rotate-90 transition-transform" />
          <span>Taruh di Dashboard Utama</span>
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Component: BucketWidgetsSidebar
───────────────────────────────────────────────────────────────────────── */
export default function BucketWidgetsSidebar({
  isOpen,
  onClose,
  placedWidgetIds = new Set(),
  onAddToDashboard,
  onRemoveFromDashboard,
}) {
  const [pinnedWidgets, setPinnedWidgets] = useState(() => {
    try {
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [bucketRecords, setBucketRecords] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucketFilter, setSelectedBucketFilter] = useState('all');

  // Sync pinned widgets across tabs / window events
  const loadPinnedWidgets = useCallback(() => {
    try {
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      setPinnedWidgets(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  useEffect(() => {
    loadPinnedWidgets();
    window.addEventListener('bucket-widgets-updated', loadPinnedWidgets);
    window.addEventListener('storage', loadPinnedWidgets);
    return () => {
      window.removeEventListener('bucket-widgets-updated', loadPinnedWidgets);
      window.removeEventListener('storage', loadPinnedWidgets);
    };
  }, [loadPinnedWidgets]);

  // Fetch telemetry records for unique buckets in pinned widgets
  const fetchBucketTelemetry = useCallback(
    async (isManual = false) => {
      if (pinnedWidgets.length === 0) return;
      if (isManual) setRefreshing(true);

      const uniqueBucketIds = [...new Set(pinnedWidgets.map((p) => p.bucketId))];
      const newRecords = {};

      await Promise.all(
        uniqueBucketIds.map(async (bId) => {
          try {
            const res = await bucketsApi.records(bId);
            newRecords[bId] = res.data?.records || res.data || [];
          } catch (err) {
            console.error(`Failed to load records for bucket ${bId}:`, err);
          }
        })
      );

      setBucketRecords((prev) => ({ ...prev, ...newRecords }));
      if (isManual) {
        setTimeout(() => setRefreshing(false), 400);
      }
    },
    [pinnedWidgets]
  );

  useEffect(() => {
    fetchBucketTelemetry();
    const iv = setInterval(() => fetchBucketTelemetry(false), 6000);
    return () => clearInterval(iv);
  }, [fetchBucketTelemetry]);

  // Unpin action
  const handleUnpin = useCallback((widgetId) => {
    const targetId = String(widgetId);
    setPinnedWidgets((prev) => {
      const next = prev.filter((p) => {
        const pId = String(p.id);
        const pWid = String(p.widgetId || '');
        return pId !== targetId && pWid !== targetId;
      });
      try {
        localStorage.setItem('iot_dashboard_pinned_bucket_widgets', JSON.stringify(next));
      } catch {}
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bucket-widgets-updated'));
      }, 0);
      return next;
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Widget dilepas dari Sidebar',
      showConfirmButton: false,
      timer: 1800,
      background: '#0f172a',
      color: '#f8fafc',
    });
  }, []);

  // Filtered widgets
  const filteredWidgets = useMemo(() => {
    if (selectedBucketFilter === 'all') return pinnedWidgets;
    return pinnedWidgets.filter((p) => String(p.bucketId) === String(selectedBucketFilter));
  }, [pinnedWidgets, selectedBucketFilter]);

  // Unique bucket list for filter tabs
  const uniqueBuckets = useMemo(() => {
    const map = new Map();
    for (const p of pinnedWidgets) {
      if (!map.has(p.bucketId)) {
        map.set(p.bucketId, p.bucketName || 'Bucket');
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [pinnedWidgets]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] max-w-[95vw] flex flex-col bg-slate-900/98 border-l border-slate-700/80 shadow-[-25px_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Top Laser Glow Accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent pointer-events-none" />

        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700/60 flex items-center justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md shadow-primary-500/30 flex-shrink-0">
              <Database size={15} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-100 tracking-tight truncate">
                  Bucket Widgets
                </h3>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-black bg-primary-500 text-white leading-none">
                  {pinnedWidgets.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Live telemetri dari data bucket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => fetchBucketTelemetry(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800 transition-colors"
              title="Perbarui data telemetri sekarang"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary-400' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 border border-slate-700/60 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Tutup sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Bucket Filter Pills (if multiple buckets pinned) */}
        {uniqueBuckets.length > 1 && (
          <div className="px-3.5 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/20">
            <button
              type="button"
              onClick={() => setSelectedBucketFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all whitespace-nowrap ${
                selectedBucketFilter === 'all'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Semua ({pinnedWidgets.length})
            </button>
            {uniqueBuckets.map((b) => {
              const count = pinnedWidgets.filter((p) => String(p.bucketId) === String(b.id)).length;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBucketFilter(b.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all whitespace-nowrap ${
                    String(selectedBucketFilter) === String(b.id)
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {b.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Widgets Feed List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {pinnedWidgets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/5 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-3.5 shadow-lg shadow-primary-500/10">
                <Database size={26} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-100 mb-1">
                Belum Ada Widget Terkirim
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mb-4">
                Buka halaman detail Data Bucket, lalu klik ikon <strong>Pin (📌)</strong> pada widget sensor untuk mengirimkannya ke daftar ini.
              </p>
              <Link
                to="/app/buckets"
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-primary-500/25"
              >
                <span>Buka Data Buckets</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : filteredWidgets.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Tidak ada widget untuk bucket yang dipilih.
            </div>
          ) : (
            filteredWidgets.map((item) => {
              const isPlaced =
                placedWidgetIds.has(String(item.id)) ||
                placedWidgetIds.has(String(item.widgetId)) ||
                placedWidgetIds.has(`bucket_widget_${item.id}`);
              return (
                <PinnedWidgetItem
                  key={item.id}
                  item={item}
                  records={bucketRecords[item.bucketId] || []}
                  onUnpin={handleUnpin}
                  isPlacedOnDashboard={isPlaced}
                  onAddToDashboard={onAddToDashboard}
                  onRemoveFromDashboard={onRemoveFromDashboard}
                />
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-700/60 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <Link
            to="/app/buckets"
            className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold transition-colors"
          >
            <span>Kelola di Data Buckets</span>
            <ChevronRight size={13} />
          </Link>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sinkronisasi Aktif
          </span>
        </div>
      </aside>
    </>
  );
}
