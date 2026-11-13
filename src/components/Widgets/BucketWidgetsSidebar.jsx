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
  Power,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { bucketsApi, roomsApi, mqttApi } from '../../services/api';
import { PREF_KEYS, getUserJsonPref, setUserJsonPref } from '../../utils/dashboardPrefs';
import { Gauge as BklitGauge, AreaSparkline as BklitAreaSparkline } from '../Charts/bklit';
import { WidgetChart, CHART_TYPES, MULTI_SERIES_TYPES } from '../../pages/BucketDetail';
import SmartSwitchWidget from './SmartSwitchWidget';
import ThermostatWidget from './ThermostatWidget';
import FloorPlan from '../../pages/FloorPlan';

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
  const totalDev = stats?.total_devices ?? 0;
  const onlineDev = stats?.online_devices ?? 0;
  const totalPoints = stats?.total_data_points ?? 0;
  const activeEndpoints = stats?.active_endpoints ?? 0;
  const totalEndpoints = stats?.total_endpoints ?? 0;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

  const renderActualWidgetVisual = () => {
    switch (widget.id) {
      case 'metrik':
        return (
          <div className="vision-card p-4 border border-slate-800/90">
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
        const rows = (recentDevices || []).slice(0, 3);
        return (
          <div className="vision-card p-4 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-extrabold text-slate-100 leading-tight">
                  Connected IoT Devices
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  {onlineDev > 0 ? (
                    <CheckCircle2 size={12} className="text-emerald-400" />
                  ) : (
                    <AlertCircle size={12} className="text-slate-400" />
                  )}
                  <span>{onlineDev} perangkat online dari {totalDev} terdaftar</span>
                </p>
              </div>
              <span className="text-[10px] font-bold text-primary-400">Lihat Semua →</span>
            </div>

            {rows.length > 0 ? (
              <div className="divide-y divide-slate-800/70">
                {rows.map((dev, i) => {
                  const isOnline = dev.status === 'online';
                  const isWarning = dev.status === 'warning';
                  const pct = isOnline ? 100 : isWarning ? 60 : 0;
                  return (
                    <div key={dev.id || i} className="py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOnline
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Cpu size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{dev.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {dev.ip || (isOnline ? 'MQTT Node' : '-')}
                          </p>
                        </div>
                      </div>
                      <div className="w-24 shrink-0">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-slate-300">{pct}%</span>
                          <span
                            className={`font-extrabold uppercase ${
                              isOnline ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                            }`}
                          >
                            {dev.status || 'offline'}
                          </span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOnline ? 'bg-primary-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-5 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <p className="text-xs font-bold text-slate-300">Belum ada perangkat terdaftar</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Tambahkan device pada menu Perangkat</p>
              </div>
            )}
          </div>
        );
      }

      case 'recent_activity': {
        const logs = (recentActivity || []).slice(0, 3);
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
                <span>Aktivitas riil sistem & pengguna</span>
              </p>
            </div>
            {logs.length > 0 ? (
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
            ) : (
              <div className="py-5 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                <p className="text-xs font-bold text-slate-300">Belum ada aktivitas tercatat</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Aktivitas Anda akan muncul otomatis di sini</p>
              </div>
            )}
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
  const isMulti = Array.isArray(MULTI_SERIES_TYPES) && MULTI_SERIES_TYPES.includes(widget?.type);
  const typeInfo = CHART_TYPES.find((c) => c.value === widget?.type);
  const typeLabel = typeInfo?.label || widget?.type || 'Widget';

  const fieldSubtitle = isMulti
    ? (widget?.config?.fields?.length > 0 ? widget.config.fields.join(' + ') : (widget?.field !== 'multi' ? widget?.field : 'Multi-Series'))
    : `${widget?.field || 'telemetry'}${widget?.unit ? ` (${widget.unit})` : ''}`;

  const latestRecord = records && records.length > 0 ? records[records.length - 1] : null;
  const color = widget?.color || widget?.config?.color || 'rgb(var(--primary-400))';

  return (
    <div className="vision-card p-4 relative overflow-hidden group hover:border-primary-500/40 transition-all duration-300 flex flex-col justify-between">
      {/* Laser Top Glow */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-70 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      {/* Header: Bucket Badge, Title, Field, and Action Controls */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-primary-500/10 text-primary-300 border border-primary-500/20 truncate max-w-[140px]">
              {bucketName || 'Data Bucket'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              • {typeLabel}
            </span>
          </div>
          <h4 className="text-[14px] font-extrabold text-slate-100 truncate group-hover:text-primary-300 transition-colors">
            {widget.title}
          </h4>
          <p className="text-[11px] text-primary-400 font-mono mt-0.5 truncate">
            {fieldSubtitle}
          </p>
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

      {/* Widget Body Visual Render using authentic WidgetChart */}
      <div className="my-1 w-full min-h-[145px] overflow-hidden flex flex-col justify-center">
        <WidgetChart
          widget={{ ...widget, h: 'compact' }}
          chartData={records}
          color={color}
          overrideVariant={widget.config?.variant}
        />
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
   Sidebar Room Widget Card (Unified 3D Design matching Dashboard Card)
───────────────────────────────────────────────────────────────────────── */
function SidebarRoomWidgetCard({
  room,
  recentDevices = [],
  isRoomPlaced = false,
  onPlaceRoomWidget,
  onRemoveRoomWidget,
  onUnpinRoom,
  onClose,
}) {
  const roomId = room.id ?? room.roomId;
  const displayName = room.name || room.roomName || room.title || 'Ruangan IoT';

  const roomDevices = useMemo(
    () => (recentDevices || []).filter((d) => Number(d.room_id) === Number(roomId)),
    [recentDevices, roomId]
  );

  const onlineCount = useMemo(
    () => roomDevices.filter((d) => d.status === 'online').length,
    [roomDevices]
  );

  return (
    <div
      className={`vision-card p-4 relative overflow-hidden transition-all duration-300 flex flex-col justify-between border ${
        isRoomPlaced
          ? 'border-amber-500/40 bg-slate-900/95'
          : 'border-slate-800/90 bg-slate-900/70 hover:border-slate-700'
      }`}
    >
      {/* Top Amber Accent */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] opacity-80 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
        }}
      />

      {/* Room Header - Identik dengan Dashboard Utama */}
      <div className="flex items-start justify-between gap-2.5 mb-2 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Home size={11} /> Ruangan 3D
            </span>
          </div>
          <h4
            className="text-[15px] font-black text-slate-100 leading-tight truncate tracking-tight"
            title={displayName}
          >
            {displayName}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-400">
              {roomDevices.length || (room.devices_count ?? 0)} Perangkat
            </span>
            <span className="text-slate-600">•</span>
            <span
              className={`font-mono font-bold ${
                onlineCount > 0 ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {onlineCount} Aktif
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/app/rooms"
            onClick={onClose}
            className="p-1.5 rounded-lg border bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700/60 transition-all cursor-pointer"
            title="Kelola Ruangan di Manajemen Ruangan"
          >
            <ExternalLink size={13} />
          </Link>

          {onUnpinRoom && (
            <button
              type="button"
              onClick={() => onUnpinRoom(roomId)}
              className="p-1.5 rounded-lg border bg-slate-800/80 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border-slate-700/60 hover:border-rose-500/30 transition-all cursor-pointer"
              title="Lepas ruangan dari daftar sematan"
            >
              <PinOff size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Body: Dedicated 3D Top-Down View (Clean Canvas Preview) */}
      <div className="my-2 h-[185px] w-full rounded-2xl overflow-hidden relative bg-slate-950 border border-slate-800/80">
        <div className="w-full h-full pointer-events-none">
          <FloorPlan
            hideHeader={true}
            isWidget={true}
            isSidebarPreview={true}
            roomId={roomId}
            roomName={displayName}
            initialDevices={roomDevices}
          />
        </div>
      </div>

      {/* Action: Taruh di Dashboard Utama / Lepas dari Dashboard */}
      {isRoomPlaced ? (
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 py-1.5 px-3 rounded-xl text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 shadow-sm">
            <Check size={13} className="text-emerald-400 stroke-[3]" />
            <span>Terpasang di Dashboard</span>
          </div>
          <button
            type="button"
            onClick={() => onRemoveRoomWidget && onRemoveRoomWidget(roomId)}
            className="py-1.5 px-3 rounded-xl text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700/70 hover:border-rose-500/30 transition-all cursor-pointer"
            title="Lepas card ruangan ini dari Dashboard Utama"
          >
            Lepas
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onPlaceRoomWidget && onPlaceRoomWidget(room)}
          className="mt-1 w-full py-2 px-3 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Tempatkan widget ruangan ini ke Grid Dashboard Utama"
        >
          <Plus size={14} className="stroke-[3]" />
          <span>Taruh di Dashboard Utama</span>
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Helper: Synchronous Pinned Rooms Hydration from Per-User Storage
───────────────────────────────────────────────────────────────────────── */
const getInitialPinnedRooms = () => {
  try {
    const localPinnedList = [];
    const parsedPinned = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
    if (Array.isArray(parsedPinned)) {
      parsedPinned.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          localPinnedList.push({
            ...item,
            id: item.id ?? item.roomId,
            name: item.name || item.roomName || item.title || 'Ruangan 3D',
            icon: item.icon || item.roomIcon || 'home',
            devices_count: item.devices_count || 0,
          });
        }
      });
    }
    return localPinnedList;
  } catch {
    return [];
  }
};

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
    const list = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
    return Array.isArray(list) ? list : [];
  });

  const [rooms, setRooms] = useState(getInitialPinnedRooms);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [bucketRecords, setBucketRecords] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBucketFilter, setSelectedBucketFilter] = useState('all');

  // Picker modal state for choosing widgets directly from Data Buckets
  const [showBucketPicker, setShowBucketPicker] = useState(false);
  const [allBuckets, setAllBuckets] = useState([]);
  const [activePickerBucketId, setActivePickerBucketId] = useState(null);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Sync pinned bucket widgets (per active user)
  const loadPinnedWidgets = useCallback(() => {
    const list = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
    setPinnedWidgets(Array.isArray(list) ? list : []);
  }, []);

  // Fetch rooms list (filtered to ONLY pinned rooms owned by current user)
  const fetchRoomsList = useCallback(async () => {
    setRooms((current) => {
      if (!current || current.length === 0) {
        setLoadingRooms(true);
      }
      return current;
    });
    try {
      // 1. Gather all pinned room IDs from current user's pinned rooms list
      const pinnedIds = new Set();
      let localPinnedList = [];
      try {
        const parsed = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
        if (Array.isArray(parsed)) {
          localPinnedList = parsed;
          parsed.forEach((item) => {
            const id = typeof item === 'object' && item !== null ? (item.id ?? item.roomId) : item;
            if (id != null) pinnedIds.add(String(id));
          });
        }
      } catch (e) {
        console.error('Failed reading pinned rooms:', e);
      }

      if (pinnedIds.size === 0) {
        setRooms([]);
        setLoadingRooms(false);
        return;
      }

      // 2. Fetch full room info from API and filter ONLY pinned rooms owned by this user
      let combined = [];
      let apiSucceeded = false;
      try {
        const res = await roomsApi.list();
        const apiRooms = Array.isArray(res.data) ? res.data : res.data?.data || [];
        combined = apiRooms.filter((r) => pinnedIds.has(String(r.id)));
        apiSucceeded = true;
      } catch (err) {
        console.warn('Could not fetch rooms list from API:', err);
      }

      // Only merge fallback from local cache if API request failed
      if (!apiSucceeded) {
        pinnedIds.forEach((pId) => {
          if (!combined.some((c) => String(c.id) === String(pId))) {
            const fromLocal = localPinnedList.find((lp) => String(lp.id ?? lp.roomId) === String(pId));
            if (fromLocal) {
              combined.push({
                id: fromLocal.id ?? fromLocal.roomId ?? pId,
                name: fromLocal.name || fromLocal.roomName || fromLocal.title || 'Ruangan IoT',
                icon: fromLocal.icon || fromLocal.roomIcon || 'home',
                devices_count: fromLocal.devices_count || 0,
              });
            }
          }
        });
      }

      const normalized = combined.map((r) => ({
        ...r,
        id: r.id ?? r.roomId,
        name: r.name || r.roomName || r.title || 'Ruangan IoT',
        icon: r.icon || r.roomIcon || 'home',
        devices_count: r.devices_count || 0,
      }));
      setRooms(normalized);
    } catch {
      const list = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      setRooms(
        Array.isArray(list)
          ? list.map((r) => ({
              ...r,
              id: r.id ?? r.roomId,
              name: r.name || r.roomName || r.title || 'Ruangan IoT',
            }))
          : []
      );
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Unpin room from sidebar
  const handleUnpinRoom = useCallback((roomId) => {
    const targetId = String(roomId);
    try {
      // Update per-user pinned rooms (only removes from sidebar list)
      const currentPinned = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      if (Array.isArray(currentPinned)) {
        const nextPinned = currentPinned.filter((r) => {
          const id = typeof r === 'object' && r !== null ? (r.id ?? r.roomId) : r;
          return String(id) !== targetId;
        });
        setUserJsonPref(PREF_KEYS.PINNED_ROOMS, nextPinned);
      }

      setRooms((prev) => prev.filter((r) => String(r.id) !== targetId));
      window.dispatchEvent(new CustomEvent('rooms-widgets-updated'));

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Ruangan dilepas dari daftar sematan',
        showConfirmButton: false,
        timer: 1600,
        background: '#0f172a',
        color: '#f8fafc',
      });
    } catch (err) {
      console.error('Failed to unpin room:', err);
    }
  }, []);

  useEffect(() => {
    loadPinnedWidgets();
    fetchRoomsList();
    window.addEventListener('bucket-widgets-updated', loadPinnedWidgets);
    window.addEventListener('rooms-widgets-updated', fetchRoomsList);
    const handleSync = () => {
      loadPinnedWidgets();
      fetchRoomsList();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('dashboard-prefs-updated', handleSync);
    window.addEventListener('user-updated', handleSync);
    return () => {
      window.removeEventListener('bucket-widgets-updated', loadPinnedWidgets);
      window.removeEventListener('rooms-widgets-updated', fetchRoomsList);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('dashboard-prefs-updated', handleSync);
      window.removeEventListener('user-updated', handleSync);
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
    if (!isOpen) return;
    fetchBucketTelemetry();
    const iv = setInterval(() => fetchBucketTelemetry(false), 8000);
    return () => clearInterval(iv);
  }, [isOpen, fetchBucketTelemetry]);

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
      setUserJsonPref(PREF_KEYS.PINNED_BUCKETS, next);
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
      setUserJsonPref(PREF_KEYS.PINNED_BUCKETS, next);
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
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] max-w-[95vw] flex flex-col bg-slate-900/98 border-l border-slate-700/80 backdrop-blur-2xl transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0 shadow-[-20px_0_40px_rgba(0,0,0,0.45)] visible' : 'translate-x-full shadow-none pointer-events-none invisible'
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

        {isOpen && (
          <>
            {/* ── 3 Segmented Tabs: Widget Bawaan vs Ruangan 3D vs Dari Bucket ── */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800/90">
            <button
              type="button"
              onClick={() => setActiveTab('builtin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'builtin'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers size={13} />
              <span>Bawaan</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
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
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Box size={13} />
              <span>Ruangan</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                  activeTab === 'rooms'
                    ? 'bg-black/20 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {rooms.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bucket')}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                activeTab === 'bucket'
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database size={13} />
              <span>Bucket</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
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
           TAB 1: WIDGET BAWAAN DASHBOARD
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'builtin' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
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
        ) : activeTab === 'rooms' ? (
          /* ═══════════════════════════════════════════════════════════════════
             TAB 2: RUANGAN IOT (3D FLOOR PLAN & DEVICE LIST)
          ═══════════════════════════════════════════════════════════════════ */
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Box size={12} className="text-amber-400" />
                Ruangan Disematkan ({rooms.length})
              </span>
              <Link
                to="/app/rooms"
                onClick={onClose}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
              >
                <span>Kelola Ruangan</span>
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
              <div className="vision-card p-6 text-center space-y-3 border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Pin size={22} className="rotate-45" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-100">Belum Ada Ruangan yang Disematkan</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                  Hanya ruangan yang Anda beri tanda pin yang akan muncul di sini. Buka menu Ruangan lalu klik ikon Pin untuk menyematkan ruangan pilihan Anda.
                </p>
                <Link
                  to="/app/rooms"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25 transition-all"
                >
                  <Pin size={14} className="stroke-[2.5]" />
                  <span>Buka Menu Ruangan & Pin</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => {
                  const isRoomPlaced =
                    placedRoomIds.has(String(room.id)) ||
                    placedRoomIds.has(`room_widget_${room.id}`);
                  return (
                    <SidebarRoomWidgetCard
                      key={room.id}
                      room={room}
                      recentDevices={recentDevices}
                      isRoomPlaced={isRoomPlaced}
                      onPlaceRoomWidget={onPlaceRoomWidget}
                      onRemoveRoomWidget={onRemoveRoomWidget}
                      onUnpinRoom={handleUnpinRoom}
                      isOpen={isOpen}
                      onClose={onClose}
                    />
                  );
                })}
              </div>
            )}
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
          {activeTab === 'rooms' ? (
            <Link
              to="/app/rooms"
              onClick={onClose}
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold transition-colors"
            >
              <span>Buka Manajemen Ruangan</span>
              <ChevronRight size={13} />
            </Link>
          ) : activeTab === 'builtin' ? (
            <Link
              to="/app/devices"
              onClick={onClose}
              className="flex items-center gap-1 text-primary-400 hover:text-primary-300 font-bold transition-colors"
            >
              <span>Kelola Perangkat</span>
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
          </>
        )}
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
