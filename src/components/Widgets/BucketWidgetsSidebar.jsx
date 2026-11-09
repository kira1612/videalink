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
  Activity,
  Layers,
  ChevronRight,
  LayoutGrid,
  Home,
  Cpu,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Pin,
  Box,
  Wifi,
  Webhook,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { bucketsApi, roomsApi } from '../../services/api';
import { Gauge as BklitGauge, AreaSparkline as BklitAreaSparkline } from '../Charts/bklit';
import SmartSwitchWidget from './SmartSwitchWidget';
import ThermostatWidget from './ThermostatWidget';
import FloorPlan from '../../pages/FloorPlan';

/* ─────────────────────────────────────────────────────────────────────────
   Fallback Data for Live Previews in Sidebar
───────────────────────────────────────────────────────────────────────── */
const FALLBACK_DEVICES = [
  { id: 'd1', name: 'ESP32-Sensor-Lab-01', protocol: 'MQTT', ip: '192.168.1.101', status: 'online' },
  { id: 'd2', name: 'Smart-Gateway-Floor2', protocol: 'MQTT', ip: '192.168.1.104', status: 'online' },
  { id: 'd3', name: 'HVAC-Controller-Node', protocol: 'HTTP', ip: '192.168.1.112', status: 'warning' },
];

const FALLBACK_ACTIVITY = [
  { id: 'a1', event: 'Payload MQTT Diterima (QoS 1)', device: 'ESP32-Sensor-Lab-01', time: 'Baru saja', type: 'success' },
  { id: 'a2', event: 'Sinkronisasi Data Bucket Aktif', device: 'Telemetry Stream', time: '2 mnt lalu', type: 'info' },
  { id: 'a3', event: 'Peringatan Ambang Suhu (>32°C)', device: 'HVAC-Controller-Node', time: '8 mnt lalu', type: 'warning' },
];

/* ─────────────────────────────────────────────────────────────────────────
   Actual Visual Widget Card for Built-In Dashboard Widgets
───────────────────────────────────────────────────────────────────────── */
function BuiltInWidgetCard({
  widget,
  onToggle,
  stats,
  recentDevices = [],
  recentActivity = [],
  currentUser,
}) {
  const isVisible = widget.visible !== false;
  const totalDev = stats?.total_devices ?? 2;
  const onlineDev = stats?.online_devices ?? 1;
  const totalPoints = stats?.total_data_points ?? 9013;
  const activeEndpoints = stats?.active_endpoints ?? 1;
  const totalEndpoints = stats?.total_endpoints ?? 2;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  const renderActualWidgetVisual = () => {
    switch (widget.id) {
      case 'metrik':
        return (
          <div className="vision-card p-4 space-y-2.5 border border-slate-800/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  Metrik Telemetri IoT
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary-400">4 Stat Cards</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="vision-inner-box p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Total Devices</p>
                  <p className="text-sm font-black text-slate-100 mt-0.5">{totalDev} Unit</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center">
                  <Cpu size={14} />
                </div>
              </div>
              <div className="vision-inner-box p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Online Now</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">{onlineDev} Aktif</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wifi size={14} />
                </div>
              </div>
              <div className="vision-inner-box p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Data Points</p>
                  <p className="text-sm font-black text-slate-100 mt-0.5">{totalPoints.toLocaleString()}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Database size={14} />
                </div>
              </div>
              <div className="vision-inner-box p-3 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Endpoints</p>
                  <p className="text-sm font-black text-slate-100 mt-0.5">
                    {activeEndpoints}/{totalEndpoints}
                  </p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Webhook size={14} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="vision-card relative overflow-hidden p-5 border border-slate-800/90 min-h-[165px] flex flex-col justify-between">
            {/* Background Isometric Core Graphic */}
            <svg
              viewBox="0 0 200 160"
              fill="none"
              className="absolute right-0 bottom-0 w-36 h-32 opacity-40 pointer-events-none"
            >
              <polygon
                points="110,30 165,62 110,94 55,62"
                fill="rgb(var(--primary-500) / 0.25)"
                stroke="rgb(var(--primary-400))"
                strokeWidth="1.5"
              />
              <polygon
                points="55,62 110,94 110,138 55,106"
                fill="rgb(var(--primary-600) / 0.35)"
                stroke="rgb(var(--primary-500))"
                strokeWidth="1.5"
              />
              <polygon
                points="165,62 110,94 110,138 165,106"
                fill="rgb(var(--primary-500) / 0.18)"
                stroke="rgb(var(--primary-400))"
                strokeWidth="1.5"
              />
              <circle cx="110" cy="62" r="8" fill="#ffffff" />
            </svg>

            <div className="relative z-10 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Welcome back,</p>
                <h4 className="text-lg font-extrabold text-slate-100 leading-tight mt-0.5">
                  {currentUser?.name || 'Administrator'}
                </h4>
                <p className="text-[11px] text-slate-300 mt-1 max-w-[200px] leading-snug">
                  Pantau telemetri & kendalikan perangkat IoT secara real-time.
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-black text-slate-100 leading-none">{timeStr}</p>
                <p className="text-[10px] font-bold text-primary-400 mt-1">{dateStr}</p>
              </div>
            </div>

            <div className="relative z-10 pt-3 flex items-center justify-between text-[11px] font-bold text-primary-400">
              <span>Kelola Perangkat IoT →</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/70 text-[10px] text-slate-300">
                IoT Edge Core
              </span>
            </div>
          </div>
        );

      case 'devices_table': {
        const rows = (recentDevices && recentDevices.length > 0 ? recentDevices : FALLBACK_DEVICES).slice(0, 3);
        return (
          <div className="vision-card p-4 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-extrabold text-slate-100 leading-tight">
                  Connected IoT Devices
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>{onlineDev} perangkat online</span>
                </p>
              </div>
              <span className="text-[10px] font-bold text-primary-400">Lihat Semua →</span>
            </div>

            <div className="divide-y divide-slate-800/70">
              {rows.map((dev, i) => {
                const isOnline = dev.status === 'online';
                const pct = isOnline ? 100 : dev.status === 'warning' ? 60 : 20;
                return (
                  <div key={dev.id || i} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
                        <Cpu size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate">{dev.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{dev.ip || 'MQTT Node'}</p>
                      </div>
                    </div>
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-slate-300">{pct}%</span>
                        <span
                          className={`font-extrabold uppercase ${
                            isOnline ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {dev.status || 'offline'}
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'recent_activity': {
        const logs = (recentActivity && recentActivity.length > 0 ? recentActivity : FALLBACK_ACTIVITY).slice(0, 3);
        const iconMap = {
          info: { Icon: Activity, color: 'rgb(var(--primary-400))' },
          warning: { Icon: AlertCircle, color: '#fbbf24' },
          error: { Icon: XCircle, color: '#f43f5e' },
          success: { Icon: CheckCircle2, color: '#10b981' },
        };
        return (
          <div className="vision-card p-4 border border-slate-800/90 space-y-3">
            <div>
              <h4 className="text-[14px] font-extrabold text-slate-100 leading-tight">Recent Activity</h4>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={12} className="text-emerald-400" />
                <span>Live Log aktivitas sistem & sensor</span>
              </p>
            </div>
            <div className="space-y-2.5">
              {logs.map((item, idx) => {
                const cfg = iconMap[item.type] || iconMap.info;
                const Icon = cfg.Icon;
                return (
                  <div key={item.id || idx} className="flex items-start gap-2.5 relative">
                    <div
                      className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"
                      style={{ color: cfg.color }}
                    >
                      <Icon size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100 truncate">{item.event}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.device} • <span className="text-slate-500">{item.time}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'switch_living':
        return (
          <SmartSwitchWidget
            title="Lampu Ruang Tamu"
            initialState={true}
            topic="home/living-room/light"
            className="min-h-[230px]"
          />
        );

      case 'switch_porch':
        return (
          <SmartSwitchWidget
            title="Lampu Teras"
            initialState={false}
            topic="home/porch/light"
            className="min-h-[230px]"
          />
        );

      case 'thermostat_ac':
        return (
          <ThermostatWidget
            title="Living Room AC"
            initialValue={22}
            min={16}
            max={30}
            className="min-h-[240px]"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Actual Widget Visual */}
      {renderActualWidgetVisual()}

      {/* Action Bar: Taruh / Lepas dari Dashboard */}
      <div className="flex items-center justify-between gap-2 px-1">
        {isVisible ? (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5">
              <Check size={13} className="text-emerald-400 stroke-[3]" />
              <span>Terpasang di Dashboard</span>
            </div>
            <button
              type="button"
              onClick={() => onToggle && onToggle(widget.id, false)}
              className="py-1.5 px-3.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-700/70 hover:border-rose-500/30 transition-all cursor-pointer"
            >
              Lepas
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggle && onToggle(widget.id, true)}
            className="w-full py-2 px-3 rounded-xl text-xs font-black bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="stroke-[3]" />
            <span>Taruh di Dashboard Utama</span>
          </button>
        )}
      </div>
    </div>
  );
}

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
  const primaryField =
    widget?.field !== 'multi' && widget?.field
      ? widget.field
      : widget?.config?.fields?.[0] || 'telemetry';
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
   Main Component: BucketWidgetsSidebar (Redesigned 2-Tab Widget Library)
───────────────────────────────────────────────────────────────────────── */
export default function BucketWidgetsSidebar({
  isOpen,
  onClose,
  placedWidgetIds = new Set(),
  onAddToDashboard,
  onRemoveFromDashboard,
  builtInWidgets = [],
  onToggleBuiltInWidget,
  placedRoomIds = new Set(),
  onPlaceRoomWidget,
  onRemoveRoomWidget,
  dashboardStats = null,
  recentDevices = [],
  recentActivity = [],
  currentUser = null,
}) {
  // 'builtin' (Widget Bawaan & Rooms) | 'bucket' (Dari Bucket)
  const [activeTab, setActiveTab] = useState('builtin');

  const [pinnedWidgets, setPinnedWidgets] = useState(() => {
    try {
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [bucketRecords, setBucketRecords] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucketFilter, setSelectedBucketFilter] = useState('all');

  // Picker modal state for choosing widgets directly from Data Buckets
  const [showBucketPicker, setShowBucketPicker] = useState(false);
  const [allBuckets, setAllBuckets] = useState([]);
  const [activePickerBucketId, setActivePickerBucketId] = useState(null);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Sync pinned bucket widgets
  const loadPinnedWidgets = useCallback(() => {
    try {
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      setPinnedWidgets(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);

  // Fetch rooms list
  const fetchRoomsList = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await roomsApi.list();
      const apiRooms = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRooms(apiRooms);
    } catch {
      try {
        const raw = localStorage.getItem('iot_dashboard_pinned_rooms');
        if (raw) setRooms(JSON.parse(raw));
      } catch {}
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    loadPinnedWidgets();
    fetchRoomsList();
    window.addEventListener('bucket-widgets-updated', loadPinnedWidgets);
    window.addEventListener('rooms-widgets-updated', fetchRoomsList);
    window.addEventListener('storage', loadPinnedWidgets);
    return () => {
      window.removeEventListener('bucket-widgets-updated', loadPinnedWidgets);
      window.removeEventListener('rooms-widgets-updated', fetchRoomsList);
      window.removeEventListener('storage', loadPinnedWidgets);
    };
  }, [loadPinnedWidgets, fetchRoomsList]);

  useEffect(() => {
    if (isOpen) {
      fetchRoomsList();
      loadPinnedWidgets();
    }
  }, [isOpen, fetchRoomsList, loadPinnedWidgets]);

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

  // Open Bucket Widget Picker Modal
  const handleOpenBucketPicker = async () => {
    setShowBucketPicker(true);
    setLoadingBuckets(true);
    try {
      const res = await bucketsApi.list();
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAllBuckets(list);
      if (list.length > 0 && !activePickerBucketId) {
        setActivePickerBucketId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load buckets:', err);
    } finally {
      setLoadingBuckets(false);
    }
  };

  const handleTogglePinFromBucketModal = (bucket, widget) => {
    const compositeId = `${bucket.id}_${widget.id}`;
    setPinnedWidgets((prev) => {
      const exists = prev.some(
        (p) => String(p.id) === String(compositeId) || (String(p.bucketId) === String(bucket.id) && String(p.widgetId) === String(widget.id))
      );
      let next;
      if (exists) {
        next = prev.filter(
          (p) => String(p.id) !== String(compositeId) && !(String(p.bucketId) === String(bucket.id) && String(p.widgetId) === String(widget.id))
        );
      } else {
        next = [
          ...prev,
          {
            id: compositeId,
            bucketId: bucket.id,
            bucketName: bucket.name,
            widgetId: widget.id,
            widget,
            pinnedAt: new Date().toISOString(),
          },
        ];
      }
      try {
        localStorage.setItem('iot_dashboard_pinned_bucket_widgets', JSON.stringify(next));
      } catch {}
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bucket-widgets-updated'));
      }, 0);
      return next;
    });
  };

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
      title: 'Widget dilepas dari daftar Bucket',
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

  const activeBuiltInCount = useMemo(() => {
    const builtInCount = builtInWidgets.filter((w) => w.visible !== false).length;
    return builtInCount + placedRoomIds.size;
  }, [builtInWidgets, placedRoomIds]);

  const activePickerBucket = useMemo(
    () => allBuckets.find((b) => String(b.id) === String(activePickerBucketId)) || allBuckets[0],
    [allBuckets, activePickerBucketId]
  );

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
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] max-w-[95vw] flex flex-col bg-slate-900/98 border-l border-slate-700/80 shadow-[-25px_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Top Laser Glow Accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent pointer-events-none" />

        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 flex-shrink-0">
              <LayoutGrid size={17} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-black text-slate-100 tracking-tight truncate">
                Katalog Widget
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                Kelola widget bawaan, ruangan & data bucket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {activeTab === 'bucket' && (
              <>
                <button
                  type="button"
                  onClick={() => fetchBucketTelemetry(true)}
                  disabled={refreshing}
                  className="p-2 rounded-xl text-slate-400 hover:text-primary-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Perbarui data telemetri sekarang"
                >
                  <RefreshCw size={14} className={refreshing ? 'animate-spin text-primary-400' : ''} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenBucketPicker}
                  className="p-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25 transition-all cursor-pointer"
                  title="Pilih widget dari Data Bucket"
                >
                  <Plus size={15} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/70 hover:bg-rose-500/20 border border-slate-700/60 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Tutup sidebar"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── 2 Segmented Tabs: Widget Bawaan vs Dari Bucket ── */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800/90">
            <button
              type="button"
              onClick={() => setActiveTab('builtin')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'builtin'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers size={14} />
              <span>Widget Bawaan</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                  activeTab === 'builtin'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {activeBuiltInCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bucket')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'bucket'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database size={14} />
              <span>Dari Bucket</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${
                  activeTab === 'bucket'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {pinnedWidgets.length}
              </span>
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════
           TAB 1: WIDGET BAWAAN (ACTUAL WIDGET VISUALS) & RUANGAN 3D (ROOMS)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'builtin' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            {/* Section 1: Built-in System Widgets (Rendered with Actual Widget UI) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary-400" />
                  Widget Bawaan Dashboard
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {builtInWidgets.filter((w) => w.visible !== false).length}/{builtInWidgets.length} Aktif
                </span>
              </div>

              <div className="space-y-4">
                {builtInWidgets.map((w) => (
                  <BuiltInWidgetCard
                    key={w.id}
                    widget={w}
                    onToggle={onToggleBuiltInWidget}
                    stats={dashboardStats}
                    recentDevices={recentDevices}
                    recentActivity={recentActivity}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            </div>

            {/* Section 2: Pin Rooms to Dashboard (With Live 3D Floor Plan Preview) */}
            <div className="space-y-4 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Box size={12} className="text-amber-400" />
                  Ruangan 3D (Rooms)
                </span>
                <Link
                  to="/app/rooms"
                  onClick={onClose}
                  className="text-[11px] font-bold text-primary-400 hover:text-primary-300 flex items-center gap-0.5"
                >
                  <span>Kelola 3D</span>
                  <ChevronRight size={12} />
                </Link>
              </div>

              {loadingRooms ? (
                <div className="space-y-3">
                  {[1, 2].map((n) => (
                    <div key={n} className="vision-card h-56 animate-pulse p-4" />
                  ))}
                </div>
              ) : rooms.length === 0 ? (
                <div className="vision-card p-5 text-center space-y-2.5 border border-dashed border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
                    <Box size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-300">Belum Ada Ruangan 3D</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Buat ruangan di menu Rooms untuk menyematkan denah 3D ruangan ke Dashboard.
                  </p>
                  <Link
                    to="/app/rooms"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500 hover:text-white transition-all"
                  >
                    <Plus size={13} />
                    <span>Buat Ruangan</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => {
                    const isRoomPlaced =
                      placedRoomIds.has(String(room.id)) ||
                      placedRoomIds.has(`room_widget_${room.id}`);
                    return (
                      <div key={room.id} className="space-y-2">
                        <div
                          className={`vision-card p-4 relative overflow-hidden transition-all duration-200 border ${
                            isRoomPlaced
                              ? 'border-amber-500/40 bg-slate-900/95'
                              : 'border-slate-800/90 bg-slate-900/70 hover:border-slate-700'
                          }`}
                        >
                          {/* Room Header */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                  3D FLOOR PLAN
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  • {room.devices_count ?? 0} Perangkat
                                </span>
                              </div>
                              <h4 className="text-[14px] font-extrabold text-slate-100 truncate mt-1">
                                {room.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                to="/app/rooms"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                                title="Buka di Halaman Rooms"
                              >
                                <ExternalLink size={13} />
                              </Link>
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950"
                                style={{
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                }}
                              >
                                <Box size={13} />
                              </div>
                            </div>
                          </div>

                          {/* Live 3D Floor Plan Preview */}
                          <div className="w-full h-[200px] rounded-xl overflow-hidden bg-slate-950 relative">
                            {isOpen && (
                              <FloorPlan
                                hideHeader={true}
                                isWidget={true}
                                roomId={room.id}
                                roomName={room.name}
                              />
                            )}
                          </div>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between gap-2 px-1">
                          {isRoomPlaced ? (
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5">
                                <Check size={13} className="text-emerald-400 stroke-[3]" />
                                <span>Terpasang di Dashboard</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onRemoveRoomWidget && onRemoveRoomWidget(room.id)}
                                className="py-1.5 px-3.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-700/70 hover:border-rose-500/30 transition-all cursor-pointer"
                              >
                                Lepas
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onPlaceRoomWidget && onPlaceRoomWidget(room)}
                              className="w-full py-2 px-3 rounded-xl text-xs font-black bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus size={14} className="stroke-[3]" />
                              <span>Taruh di Dashboard Utama</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             TAB 2: WIDGET DARI DATA BUCKET
          ═══════════════════════════════════════════════════════════════════ */
          <>
            {/* Bucket Filter Pills (if multiple buckets pinned) */}
            {uniqueBuckets.length > 1 && (
              <div className="px-3.5 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/20 shrink-0">
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
                    Belum Ada Widget Bucket
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mb-4">
                    Pilih widget dari Data Bucket Anda atau klik ikon <strong>Pin</strong> pada halaman detail Data Bucket.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenBucketPicker}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-primary-500/25 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Pilih Widget Bucket</span>
                    </button>
                    <Link
                      to="/app/buckets"
                      onClick={onClose}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      Ke Data Buckets
                    </Link>
                  </div>
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
          </>
        )}

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          {activeTab === 'builtin' ? (
            <Link
              to="/app/rooms"
              onClick={onClose}
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold transition-colors"
            >
              <span>Manajemen Ruangan 3D</span>
              <ChevronRight size={13} />
            </Link>
          ) : (
            <Link
              to="/app/buckets"
              onClick={onClose}
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold transition-colors"
            >
              <span>Semua Data Bucket</span>
              <ChevronRight size={13} />
            </Link>
          )}
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sinkronisasi Aktif
          </span>
        </div>
      </aside>

      {/* ── Modal Picker: Pilih Widget dari Data Bucket ── */}
      {showBucketPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="vision-card w-full max-w-2xl border border-slate-700/80 bg-slate-900/98 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100">
                    Pilih Widget dari Data Bucket
                  </h3>
                  <p className="text-xs text-slate-400">
                    Centang widget yang ingin ditampilkan di tab Dari Bucket
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBucketPicker(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {loadingBuckets ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Memuat daftar Data Bucket...
              </div>
            ) : allBuckets.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                Belum ada Data Bucket yang tersedia.
              </div>
            ) : (
              <>
                {/* Bucket Tabs */}
                <div className="px-5 py-3 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-950/40">
                  {allBuckets.map((b) => {
                    const bWidgets = Array.isArray(b.widgets) ? b.widgets : [];
                    const isSelected = String(activePickerBucket?.id) === String(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActivePickerBucketId(b.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Database size={12} />
                        <span>{b.name}</span>
                        <span className="opacity-75">({bWidgets.length})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Widgets Grid in Selected Bucket */}
                <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {(Array.isArray(activePickerBucket?.widgets) ? activePickerBucket.widgets : []).length === 0 ? (
                    <div className="col-span-full py-10 text-center text-xs text-slate-400">
                      Belum ada widget yang dibuat di Data Bucket ini.
                    </div>
                  ) : (
                    (activePickerBucket?.widgets || []).map((w) => {
                      const compositeId = `${activePickerBucket.id}_${w.id}`;
                      const isChecked = pinnedWidgets.some(
                        (p) =>
                          String(p.id) === String(compositeId) ||
                          (String(p.bucketId) === String(activePickerBucket.id) &&
                            String(p.widgetId) === String(w.id))
                      );
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => handleTogglePinFromBucketModal(activePickerBucket, w)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                            isChecked
                              ? 'border-primary-500 bg-primary-500/10 shadow-md shadow-primary-500/10'
                              : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary-400">
                              {w.type} • {w.field}
                            </p>
                            <h4 className="text-sm font-extrabold text-slate-100 truncate mt-1">
                              {w.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Sensor telemetry
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all ${
                              isChecked
                                ? 'bg-primary-500 border-primary-400 text-white'
                                : 'border-slate-700 bg-slate-900/60 text-transparent'
                            }`}
                          >
                            <Check size={14} className="stroke-[3]" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tersemat: <strong className="text-primary-400">{pinnedWidgets.length}</strong> widget
              </span>
              <button
                type="button"
                onClick={() => setShowBucketPicker(false)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 transition-all cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
