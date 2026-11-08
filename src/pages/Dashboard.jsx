import { useState, useEffect, useMemo, useCallback, useRef, Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Database, Webhook, Wifi, ArrowRight,
  CheckCircle2, MoreHorizontal, MoreVertical,
  Smile, Activity, Zap, Server, Clock,
  AlertCircle, XCircle, Layers, Sparkles, TrendingUp,
  Pencil, Check, RotateCcw, Eye, EyeOff, GripVertical, SlidersHorizontal, Plus,
  PanelRight, PanelRightClose, ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2';
import BucketWidgetsSidebar from '../components/Widgets/BucketWidgetsSidebar';
import { WidgetChart, CHART_TYPES, CHART_VARIANTS } from './BucketDetail';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AreaChart as BklitAreaChart,
  Area as BklitArea,
  BarChart as BklitBarChart,
  Bar as BklitBar,
  BarSquares as BklitBarSquares,
  LineChart as BklitLineChart,
  Line as BklitLine,
  Gauge as BklitGauge,
  AreaSparkline as BklitAreaSparkline,
  Grid as BklitGrid,
  XAxis as BklitXAxis,
  ChartTooltip as BklitChartTooltip,
  curveNatural,
  curveStep,
} from '../components/Charts/bklit';
import { dashboardApi, devicesApi, bucketsApi } from '../services/api';
import { StatusBadge } from '../components/UI/Badge';
import ThermostatWidget from '../components/Widgets/ThermostatWidget';
import SmartSwitchWidget from '../components/Widgets/SmartSwitchWidget';

/* ─────────────────────────────────────────────────────────────────────────
   Telemetry & Sensor Chart Data (Vision UI Style + IoT Context)
───────────────────────────────────────────────────────────────────────── */
const initialTelemetryStream = [
  { time: '00:00', sensorA: 480, sensorB: 210 },
  { time: '02:00', timeLabel: 'Feb', sensorA: 230, sensorB: 240 },
  { time: '04:00', timeLabel: 'Mar', sensorA: 210, sensorB: 300 },
  { time: '06:00', timeLabel: 'Apr', sensorA: 350, sensorB: 340 },
  { time: '08:00', timeLabel: 'May', sensorA: 370, sensorB: 270 },
  { time: '10:00', timeLabel: 'Jun', sensorA: 460, sensorB: 220 },
  { time: '12:00', timeLabel: 'Jul', sensorA: 360, sensorB: 250 },
  { time: '14:00', timeLabel: 'Aug', sensorA: 310, sensorB: 210 },
  { time: '16:00', timeLabel: 'Sep', sensorA: 350, sensorB: 130 },
  { time: '18:00', timeLabel: 'Oct', sensorA: 220, sensorB: 170 },
  { time: '20:00', timeLabel: 'Nov', sensorA: 400, sensorB: 185 },
  { time: '22:00', timeLabel: 'Dec', sensorA: 430, sensorB: 140 },
];

const brokerThroughputBars = [
  { slot: '01', msg: 330 },
  { slot: '02', msg: 230 },
  { slot: '03', msg: 120 },
  { slot: '04', msg: 295 },
  { slot: '05', msg: 500 },
  { slot: '06', msg: 420 },
  { slot: '07', msg: 480 },
  { slot: '08', msg: 290 },
  { slot: '09', msg: 165 },
];

const fallbackIoTDevices = [
  {
    id: 'd1',
    name: 'ESP32-Sensor-Lab-01',
    location: 'Ruang Server Utama',
    ip: '192.168.1.101',
    protocol: 'MQTT',
    completion: 100,
    status: 'online',
  },
  {
    id: 'd2',
    name: 'Smart-Gateway-Floor2',
    location: 'Lantai 2 • Ruang Kontrol',
    ip: '192.168.1.104',
    protocol: 'MQTT',
    completion: 92,
    status: 'online',
  },
  {
    id: 'd3',
    name: 'NodeMCU-HVAC-Monitor',
    location: 'Living Room AC',
    ip: '192.168.1.112',
    protocol: 'HTTP',
    completion: 85,
    status: 'online',
  },
  {
    id: 'd4',
    name: 'RPi4-Edge-Aggregator',
    location: 'Gudang Logistik',
    ip: '192.168.1.120',
    protocol: 'MQTT',
    completion: 60,
    status: 'warning',
  },
];

const fallbackIoTActivity = [
  { id: 1, event: 'Payload MQTT diterima (QoS 1)', device: 'ESP32-Sensor-Lab-01', time: 'BARU SAJA', type: 'success' },
  { id: 2, event: 'Sinkronisasi Bucket Telemetry', device: 'Bucket sensors-prod', time: '5 MENIT LALU', type: 'info' },
  { id: 3, event: 'Webhook Endpoint Terpicu', device: 'Alert Suhu > 30°C', time: '18 MENIT LALU', type: 'warning' },
  { id: 4, event: 'Perangkat Terhubung Kembali', device: 'Smart-Gateway-Floor2', time: '1 JAM LALU', type: 'success' },
  { id: 5, event: 'Otomasi Lampu Teras Aktif', device: 'Jadwal Otomatis 18:00', time: '2 JAM LALU', type: 'info' },
];

function VisionChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="vision-card px-3.5 py-2.5 shadow-2xl text-xs">
      <p className="text-slate-400 font-semibold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="font-bold text-slate-100 flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: entry.color || 'rgb(var(--primary-500))' }}
          />
          {entry.name}: <span className="text-primary-400">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   1. Vision UI High-Tech IoT Metric Cards (Bento, Sparkline, & Compact)
───────────────────────────────────────────────────────────────────────── */
function DeviceProgressBar({ online, total }) {
  const onlinePct = total > 0 ? Math.round((online / total) * 100) : 0;
  return (
    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-700/40">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <span>Ketersediaan Node</span>
        <span className={onlinePct > 0 ? "text-emerald-400 font-bold" : "text-slate-400"}>
          {online} / {total} Unit ({onlinePct}%)
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${onlinePct}%` }}
        />
      </div>
    </div>
  );
}

function SignalPulseWave({ isOnline, latency = '24ms' }) {
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/40 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
        <span>{isOnline ? 'MQTT Broker Live' : 'Node Standby'}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-slate-400">{latency}</span>
        <div className="flex items-end gap-0.5 h-3">
          <span className={`w-1 rounded-sm ${isOnline ? 'bg-emerald-400 h-1.5' : 'bg-slate-600 h-1'}`} />
          <span className={`w-1 rounded-sm ${isOnline ? 'bg-emerald-400 h-2.5' : 'bg-slate-600 h-1'}`} />
          <span className={`w-1 rounded-sm ${isOnline ? 'bg-emerald-400 h-3.5' : 'bg-slate-600 h-1'}`} />
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ label = 'Throughput Telemetri' }) {
  const sparkData = [
    { v: 18 }, { v: 26 }, { v: 22 }, { v: 34 }, { v: 29 }, { v: 42 }, { v: 38 }, { v: 49 },
  ];
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/40">
      <div className="text-[11px] font-medium text-slate-400">
        <span>{label}</span>
      </div>
      <div className="w-24 h-6 flex items-center">
        <BklitAreaSparkline
          data={sparkData}
          dataKey="v"
          color="rgb(var(--primary-400))"
          width={96}
          height={22}
          showHighlight={true}
          interactive={false}
        />
      </div>
    </div>
  );
}

function EndpointPipeline({ active, total }) {
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/40 text-[11px]">
      <div className="flex items-center gap-1.5 text-slate-400 font-medium truncate">
        <span className="text-primary-400 font-bold">MQTT</span>
        <span className="text-slate-600">→</span>
        <span>Webhook Relay</span>
      </div>
      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
        active > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-slate-700/40 text-slate-400'
      }`}>
        {total === 0 ? '0 Route' : `${active} / ${total} Aktif`}
      </span>
    </div>
  );
}

function VisionStatCard({
  label,
  value,
  badgeText,
  badgeVariant = 'positive',
  badgeIcon: BadgeIcon,
  icon: Icon,
  footerWidget,
  loading,
  className = '',
}) {
  const badgeColors = {
    positive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    rose:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
    neutral:  'bg-slate-700/50 text-slate-300 border-slate-600/30',
    primary:  'bg-primary-500/15 text-primary-400 border-primary-500/30',
  };

  return (
    <div className={`vision-card p-5 relative overflow-hidden group transition-all duration-300 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 flex flex-col justify-between ${className || 'min-h-[160px]'}`}>
      {/* Top Edge Laser Accent */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary-500/40 to-transparent pointer-events-none" />

      {/* Ambient Radial Theme Glow in Background */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary-500/10 blur-2xl group-hover:bg-primary-500/15 transition-all pointer-events-none" />

      {/* Background Watermark Icon — Dynamic Theme Color (Stationary, No Movement) */}
      {Icon && (
        <div className="absolute -right-2 top-2 sm:right-1 sm:top-1 pointer-events-none text-primary-500/[0.08] dark:text-primary-400/[0.11] group-hover:text-primary-500/[0.16] dark:group-hover:text-primary-400/[0.18] transition-opacity duration-300 select-none">
          <Icon size={96} strokeWidth={1.3} />
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10">
        {/* Top Header Row: Category Label (Left) + Status Badge (Right) */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
            {label}
          </p>

          {badgeText && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeColors[badgeVariant] || badgeColors.neutral} flex-shrink-0 shadow-sm`}
            >
              {BadgeIcon && <BadgeIcon size={12} className="flex-shrink-0" />}
              {badgeText}
            </span>
          )}
        </div>

        {/* Value Section */}
        <div className="mt-3">
          {loading ? (
            <div className="h-8 w-28 rounded-lg bg-slate-800 animate-pulse my-0.5" />
          ) : (
            <h3 className="text-[27px] sm:text-[30px] font-black text-slate-100 tracking-tight leading-none drop-shadow-sm">
              {value}
            </h3>
          )}
        </div>
      </div>

      {/* Bottom Micro-Telemetry Widget */}
      {!loading && footerWidget && (
        <div className="relative z-10 pt-2">
          {footerWidget}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2. Multi-Style Interactive Hero Artwork for Videa Link IoT Platform
      Styles: 'iot-core' | 'smart-home' | 'orbital' | 'aurora'
───────────────────────────────────────────────────────────────────────── */
const HERO_ARTWORK_STYLES = [
  { id: 'iot-core',    label: 'IoT Edge Core' },
  { id: 'smart-home',  label: 'Smart Home 3D' },
  { id: 'orbital',     label: 'Orbital Radar' },
  { id: 'cyber-wave',  label: 'Telemetry Wave' },
  { id: 'neural-mesh', label: 'Mesh Topology' },
  { id: 'aurora',      label: 'Glass Prism' },
];

function HeroArtwork({ variant = 'iot-core' }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none rounded-[20px]">
      {/* Theme-reactive atmospheric glow */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background:
            'radial-gradient(circle at 76% 48%, rgb(var(--primary-500) / 0.28) 0%, rgb(var(--primary-600) / 0.12) 42%, rgb(var(--surface-900) / 0.96) 80%)',
        }}
      />
      <div
        className="absolute right-[2%] top-[6%] w-[260px] h-[260px] rounded-full blur-[70px] opacity-45 transition-all duration-500"
        style={{ background: 'radial-gradient(circle, rgb(var(--primary-400)) 0%, rgb(var(--primary-600)) 55%, transparent 75%)' }}
      />

      {/* Subtle perspective cyber grid on the right */}
      <div
        className="absolute right-0 inset-y-0 w-[68%] opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--primary-500) / 0.18) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--primary-500) / 0.18) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(circle at 68% 50%, black 15%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 68% 50%, black 15%, transparent 75%)',
        }}
      />

      {/* Centered Wrapper in Lower-Right Zone (below Top-Right Clock, above Bottom Edge) */}
      <div className="absolute right-[-8px] sm:right-[10px] top-[76px] bottom-[8px] flex items-center justify-center pointer-events-none">
        {/* ── VARIANT 1: 3D ISOMETRIC IOT EDGE CORE (DEFAULT) ── */}
        {variant === 'iot-core' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <defs>
              <linearGradient id="isoTop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-400))" stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgb(var(--primary-500))" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="isoLeft" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="rgb(var(--primary-700))" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="isoRight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-600))" stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgb(var(--primary-800))" stopOpacity="0.98" />
              </linearGradient>
              <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.32" />
                <stop offset="100%" stopColor="rgb(var(--primary-700))" stopOpacity="0.14" />
              </linearGradient>
            </defs>

            {/* Outer Orbital Telemetry Ring */}
            <ellipse
              cx="235"
              cy="185"
              rx="145"
              ry="68"
              stroke="rgb(var(--primary-500))"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <ellipse
              cx="235"
              cy="185"
              rx="115"
              ry="52"
              stroke="rgb(var(--primary-500))"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />

            {/* Isometric Base Platform */}
            <polygon
              points="235,125 345,180 235,235 125,180"
              fill="url(#plateGrad)"
              stroke="rgb(var(--primary-500))"
              strokeOpacity="0.7"
              strokeWidth="1.8"
            />
            <polygon
              points="235,140 325,185 235,230 145,185"
              fill="rgb(var(--primary-500) / 0.16)"
              stroke="rgb(var(--primary-400))"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />

            {/* Glowing Circuit Traces on Base */}
            <path d="M235 180 L165 145 L130 145" stroke="rgb(var(--primary-500))" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="130" cy="145" r="4.5" fill="rgb(var(--primary-500))" />
            <path d="M235 180 L310 145 L345 145" stroke="rgb(var(--primary-500))" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="345" cy="145" r="4.5" fill="rgb(var(--primary-500))" />
            <path d="M235 180 L175 218 L140 218" stroke="rgb(var(--primary-500))" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="140" cy="218" r="4.5" fill="rgb(var(--primary-500))" />
            <path d="M235 180 L300 218 L335 218" stroke="rgb(var(--primary-500))" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="335" cy="218" r="4.5" fill="rgb(var(--primary-500))" />

            {/* Central 3D Isometric Edge Processor Cube */}
            <polygon points="235,88 290,116 235,144 180,116" fill="url(#isoTop)" stroke="rgb(var(--primary-300))" strokeWidth="1.2" />
            <polygon points="180,116 235,144 235,198 180,170" fill="url(#isoLeft)" />
            <polygon points="290,116 235,144 235,198 290,170" fill="url(#isoRight)" />
            <polygon points="235,100 268,116 235,132 202,116" fill="#ffffff" fillOpacity="0.88" />

            {/* Vertical Laser Uplink Beam */}
            <line x1="235" y1="30" x2="235" y2="116" stroke="rgb(var(--primary-500))" strokeWidth="2.5" strokeDasharray="4 4" />
            <circle cx="235" cy="30" r="6" fill="rgb(var(--primary-500))" />
            <circle cx="235" cy="30" r="12" stroke="rgb(var(--primary-500))" strokeOpacity="0.55" strokeWidth="1.8" />

            {/* Floating Satellite Node 1 (Left - MQTT) */}
            <g transform="translate(88, 76)">
              <polygon points="32,0 64,16 32,32 0,16" fill="url(#isoTop)" />
              <polygon points="0,16 32,32 32,56 0,40" fill="url(#isoLeft)" />
              <polygon points="64,16 32,32 32,56 64,40" fill="url(#isoRight)" />
            </g>

            {/* Floating Satellite Node 2 (Right - Sensor) */}
            <g transform="translate(296, 68)">
              <polygon points="28,0 56,14 28,28 0,14" fill="url(#isoTop)" />
              <polygon points="0,14 28,28 28,50 0,36" fill="url(#isoLeft)" />
              <polygon points="56,14 28,28 28,50 56,36" fill="url(#isoRight)" />
            </g>

            {/* Floating Satellite Node 3 (Bottom Front - Gateway) */}
            <g transform="translate(207, 232)">
              <polygon points="28,0 56,14 28,28 0,14" fill="url(#isoTop)" />
              <polygon points="0,14 28,28 28,48 0,34" fill="url(#isoLeft)" />
              <polygon points="56,14 28,28 28,48 56,34" fill="url(#isoRight)" />
            </g>
          </svg>
        )}

        {/* ── VARIANT 2: 3D HOLOGRAPHIC SMART HOME TWIN ── */}
        {variant === 'smart-home' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <polygon
              points="235,140 365,205 235,270 105,205"
              fill="rgb(var(--primary-500) / 0.18)"
              stroke="rgb(var(--primary-500))"
              strokeWidth="2"
            />
            <polygon points="155,195 235,235 235,175 155,135" fill="rgb(var(--primary-600) / 0.72)" stroke="rgb(var(--primary-400))" strokeWidth="1.5" />
            <polygon points="315,195 235,235 235,175 315,135" fill="rgb(var(--primary-700) / 0.82)" stroke="rgb(var(--primary-400))" strokeWidth="1.5" />
            <polygon points="235,72 325,135 235,175 145,135" fill="rgb(var(--primary-500) / 0.85)" stroke="rgb(var(--primary-300))" strokeWidth="2" />
            <polygon points="175,162 215,182 215,208 175,188" fill="#ffffff" fillOpacity="0.88" />
            <polygon points="255,182 295,162 295,188 255,208" fill="#ffffff" fillOpacity="0.78" />

            <path d="M215 52 A 28 28 0 0 1 255 52" stroke="rgb(var(--primary-500))" strokeWidth="3" strokeLinecap="round" />
            <path d="M202 40 A 45 45 0 0 1 268 40" stroke="rgb(var(--primary-500))" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
            <path d="M188 28 A 62 62 0 0 1 282 28" stroke="rgb(var(--primary-500))" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.55" />
            <circle cx="235" cy="62" r="5" fill="rgb(var(--primary-500))" />

            <rect x="95" y="95" width="68" height="28" rx="8" fill="rgb(var(--surface-800))" stroke="rgb(var(--primary-500))" strokeWidth="1.5" />
            <circle cx="111" cy="109" r="5" fill="#10b981" />
            <line x1="122" y1="109" x2="150" y2="109" stroke="rgb(var(--primary-500))" strokeWidth="3" strokeLinecap="round" />

            <rect x="308" y="88" width="74" height="28" rx="8" fill="rgb(var(--surface-800))" stroke="rgb(var(--primary-500))" strokeWidth="1.5" />
            <circle cx="324" cy="102" r="5" fill="rgb(var(--primary-500))" />
            <line x1="335" y1="102" x2="368" y2="102" stroke="rgb(var(--primary-400))" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}

        {/* ── VARIANT 3: CYBERNETIC ORBITAL RADAR & TELEMETRY SPHERE ── */}
        {variant === 'orbital' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <circle cx="240" cy="168" r="118" stroke="rgb(var(--primary-500))" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="8 6" />
            <circle cx="240" cy="168" r="92" stroke="rgb(var(--primary-500))" strokeOpacity="0.55" strokeWidth="1.8" />
            <circle cx="240" cy="168" r="64" fill="rgb(var(--primary-500) / 0.22)" stroke="rgb(var(--primary-500))" strokeWidth="2" />

            <ellipse cx="240" cy="168" rx="64" ry="26" stroke="rgb(var(--primary-400))" strokeOpacity="0.75" strokeWidth="1.6" />
            <ellipse cx="240" cy="168" rx="26" ry="64" stroke="rgb(var(--primary-400))" strokeOpacity="0.75" strokeWidth="1.6" />
            <ellipse cx="240" cy="168" rx="112" ry="38" transform="rotate(-24 240 168)" stroke="rgb(var(--primary-500))" strokeWidth="2.2" />
            <ellipse cx="240" cy="168" rx="112" ry="38" transform="rotate(28 240 168)" stroke="rgb(var(--primary-500))" strokeOpacity="0.65" strokeWidth="1.6" />

            <circle cx="240" cy="168" r="14" fill="rgb(var(--primary-500))" />
            <circle cx="138" cy="212" r="7" fill="rgb(var(--primary-500))" />
            <circle cx="342" cy="124" r="7" fill="#10b981" />
            <circle cx="192" cy="95" r="5" fill="rgb(var(--primary-500))" />
            <circle cx="295" cy="238" r="6" fill="rgb(var(--primary-500))" />
          </svg>
        )}

        {/* ── VARIANT 4: ABSTRACT GLASS PRISM & AURORA ORBS ── */}
        {variant === 'aurora' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <defs>
              <linearGradient id="prism1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-400))" stopOpacity="0.85" />
                <stop offset="100%" stopColor="rgb(var(--primary-600))" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="prism2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.85" />
                <stop offset="100%" stopColor="rgb(var(--primary-700))" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <rect
              x="165"
              y="55"
              width="150"
              height="150"
              rx="36"
              transform="rotate(15 240 130)"
              fill="url(#prism1)"
              stroke="rgb(var(--primary-400))"
              strokeOpacity="0.7"
              strokeWidth="1.8"
            />
            <rect
              x="145"
              y="95"
              width="150"
              height="150"
              rx="36"
              transform="rotate(-12 220 170)"
              fill="url(#prism2)"
              stroke="rgb(var(--primary-300))"
              strokeOpacity="0.8"
              strokeWidth="1.8"
            />
            <circle cx="275" cy="110" r="34" fill="rgb(var(--primary-500))" fillOpacity="0.8" />
            <circle cx="175" cy="215" r="24" fill="rgb(var(--primary-400))" fillOpacity="0.75" />
          </svg>
        )}

        {/* ── VARIANT 5: TELEMETRY HARMONIC WAVE MATRIX ── */}
        {variant === 'cyber-wave' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <defs>
              <linearGradient id="waveFill1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-500))" stopOpacity="0.65" />
                <stop offset="100%" stopColor="rgb(var(--primary-600))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="waveFill2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--primary-400))" stopOpacity="0.55" />
                <stop offset="100%" stopColor="rgb(var(--primary-500))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M 60 220 C 120 110, 175 260, 235 140 C 295 20, 345 210, 405 120 L 405 290 L 60 290 Z"
              fill="url(#waveFill1)"
            />
            <path
              d="M 60 220 C 120 110, 175 260, 235 140 C 295 20, 345 210, 405 120"
              stroke="rgb(var(--primary-500))"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 60 185 C 125 255, 185 85, 250 185 C 310 275, 355 95, 405 165 L 405 290 L 60 290 Z"
              fill="url(#waveFill2)"
            />
            <path
              d="M 60 185 C 125 255, 185 85, 250 185 C 310 275, 355 95, 405 165"
              stroke="rgb(var(--primary-400))"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="235" cy="140" r="6" fill="#ffffff" stroke="rgb(var(--primary-500))" strokeWidth="3" />
            <circle cx="250" cy="185" r="5" fill="#10b981" />
            <circle cx="330" cy="108" r="6" fill="rgb(var(--primary-500))" />
            <line x1="235" y1="65" x2="235" y2="134" stroke="rgb(var(--primary-500))" strokeWidth="1.5" strokeDasharray="3 3" />
            <rect x="195" y="38" width="80" height="24" rx="7" fill="rgb(var(--surface-800))" stroke="rgb(var(--primary-500))" strokeWidth="1.5" />
            <circle cx="209" cy="50" r="4" fill="#10b981" />
            <line x1="219" y1="50" x2="262" y2="50" stroke="rgb(var(--primary-500))" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}

        {/* ── VARIANT 6: AI MESH TOPOLOGY CONSTELLATION ── */}
        {variant === 'neural-mesh' && (
          <svg
            viewBox="0 0 420 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[210px] sm:w-[245px] h-auto animate-float"
          >
            <g stroke="rgb(var(--primary-500))" strokeOpacity="0.55" strokeWidth="1.8">
              <line x1="240" y1="165" x2="145" y2="95" />
              <line x1="240" y1="165" x2="335" y2="88" />
              <line x1="240" y1="165" x2="358" y2="195" />
              <line x1="240" y1="165" x2="275" y2="265" />
              <line x1="240" y1="165" x2="148" y2="238" />
              <line x1="145" y1="95" x2="245" y2="58" />
              <line x1="335" y1="88" x2="245" y2="58" />
              <line x1="335" y1="88" x2="358" y2="195" />
              <line x1="358" y1="195" x2="275" y2="265" />
              <line x1="275" y1="265" x2="148" y2="238" />
              <line x1="148" y1="238" x2="145" y2="95" />
            </g>

            <polygon
              points="240,122 278,144 278,186 240,208 202,186 202,144"
              fill="rgb(var(--primary-500) / 0.32)"
              stroke="rgb(var(--primary-500))"
              strokeWidth="2.2"
            />
            <circle cx="240" cy="165" r="14" fill="rgb(var(--primary-500))" />

            {[
              [145, 95, 10],
              [335, 88, 11],
              [358, 195, 9],
              [275, 265, 10],
              [148, 238, 9],
              [245, 58, 8],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r + 6} fill="rgb(var(--primary-500) / 0.25)" stroke="rgb(var(--primary-500))" strokeWidth="1.4" />
                <circle cx={cx} cy={cy} r={r} fill="rgb(var(--primary-500))" />
              </g>
            ))}
          </svg>
        )}
      </div>

      {/* Left-to-right surface fade for crisp text contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgb(var(--surface-900) / 0.94) 0%, rgb(var(--surface-900) / 0.68) 46%, transparent 100%)',
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard Widget Configuration, Layout Constants, & Sortable Card
───────────────────────────────────────────────────────────────────────── */
const DEFAULT_DASHBOARD_WIDGETS = [
  { id: 'metrik', title: 'Metrik Telemetri IoT', cols: 12, height: 'normal', visible: true },
  { id: 'hero', title: 'Welcome Hero Banner', cols: 5, height: 'normal', visible: true },
  { id: 'health', title: 'Device Health Rate', cols: 3, height: 'normal', visible: true },
  { id: 'tracking', title: 'Telemetry Tracking', cols: 4, height: 'normal', visible: true },
  { id: 'telemetry_chart', title: 'Live Telemetry Overview', cols: 7, height: 'normal', visible: true },
  { id: 'infrastructure_chart', title: 'Active Infrastructure', cols: 5, height: 'normal', visible: true },
  { id: 'devices_table', title: 'Connected IoT Devices', cols: 8, height: 'normal', visible: true },
  { id: 'recent_activity', title: 'Recent Activity', cols: 4, height: 'normal', visible: true },
  { id: 'quick_controls', title: 'Smart Home Controls', cols: 12, height: 'normal', visible: true },
];

const ALLOWED_COLS = {
  metrik: [6, 12],
  hero: [4, 5, 6, 7, 8, 12],
  health: [3, 4, 6, 12],
  tracking: [3, 4, 6, 12],
  telemetry_chart: [6, 7, 8, 12],
  infrastructure_chart: [4, 5, 6, 12],
  devices_table: [6, 8, 12],
  recent_activity: [4, 6, 12],
  quick_controls: [6, 12],
};

const COL_SPAN_CLASSES = {
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
  5: 'lg:col-span-5',
  6: 'lg:col-span-6',
  7: 'lg:col-span-7',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
};

const COL_LABELS = {
  3: '1/4',
  4: '1/3',
  5: '5/12',
  6: '1/2',
  7: '7/12',
  8: '2/3',
  12: 'Full',
};

const HEIGHT_LABELS = {
  compact: 'Compact',
  normal: 'Normal',
  tall: 'Tall',
};

const DEFAULT_STYLES = {
  heroStyle: 'iot-core',
  telemetryMode: 'smooth',
  barMode: 'rounded',
  healthGaugeMode: 'notches',
  safetyGaugeMode: 'solid',
};

function computeDashboardResize(mode, dx, dy, startCols, startHeight, allowedCols) {
  const allowed = allowedCols && allowedCols.length > 0 ? allowedCols : [12];
  let targetCols = startCols;
  let targetH = startHeight || 'normal';
  let activeAxis = mode;

  // 1. Calculate column target with symmetrical thresholds
  const currentIndex = allowed.indexOf(startCols);
  let newCols = startCols;
  if (currentIndex !== -1) {
    if (dx > 120) {
      newCols = allowed[Math.min(allowed.length - 1, currentIndex + 2)];
    } else if (dx > 40) {
      newCols = allowed[Math.min(allowed.length - 1, currentIndex + 1)];
    } else if (dx < -120) {
      newCols = allowed[Math.max(0, currentIndex - 2)];
    } else if (dx < -40) {
      newCols = allowed[Math.max(0, currentIndex - 1)];
    }
  }

  // 2. Calculate height target ('compact' | 'normal' | 'tall')
  const heights = ['compact', 'normal', 'tall'];
  const curHIndex = heights.indexOf(startHeight) !== -1 ? heights.indexOf(startHeight) : 1;
  let newHIndex = curHIndex;

  if (curHIndex === 0) { // compact
    if (dy > 120) newHIndex = 2; // tall
    else if (dy > 35) newHIndex = 1; // normal
  } else if (curHIndex === 1) { // normal
    if (dy > 35) newHIndex = 2; // tall
    else if (dy < -35) newHIndex = 0; // compact
  } else if (curHIndex === 2) { // tall
    if (dy < -120) newHIndex = 0; // compact
    else if (dy < -35) newHIndex = 1; // normal
  }
  const newH = heights[newHIndex];

  // 3. Axis locking
  if (mode === 'height') {
    targetCols = startCols;
    targetH = newH;
    activeAxis = 'height';
  } else if (mode === 'width') {
    targetCols = newCols;
    targetH = startHeight;
    activeAxis = 'width';
  } else {
    // mode === 'both'
    if (dx <= 0 && dy <= 0) {
      targetCols = newCols;
      targetH = newH;
      activeAxis = (newCols !== startCols && newH !== startHeight) ? 'both' : (newCols !== startCols ? 'width' : 'height');
    } else if (dy > 0 && dy > Math.abs(dx) * 1.5) {
      targetCols = startCols;
      targetH = newH;
      activeAxis = 'height';
    } else if (dx > 0 && dx > Math.abs(dy) * 1.5) {
      targetCols = newCols;
      targetH = startHeight;
      activeAxis = 'width';
    } else {
      targetCols = newCols;
      targetH = newH;
      activeAxis = 'both';
    }
  }

  return { targetCols, targetH, activeAxis };
}

class CardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Dashboard card render error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="vision-card p-6 flex flex-col items-center justify-center text-center min-h-[220px] border border-rose-500/30 bg-rose-500/5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5">
            <AlertCircle size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-100 mb-1">Gagal Menampilkan Card</h4>
          <p className="text-xs text-slate-400 max-w-xs mb-3">
            Terjadi kendala saat merender komponen telemetri ini.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Coba Lagi
            </button>
            {this.props.onRemove && (
              <button
                type="button"
                onClick={this.props.onRemove}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
              >
                Hapus dari Dashboard
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function loadDashboardWidgets() {
  try {
    const raw = localStorage.getItem('iot_dashboard_layout');
    if (!raw) return DEFAULT_DASHBOARD_WIDGETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DASHBOARD_WIDGETS;
    const merged = [];
    for (const w of parsed) {
      const def = DEFAULT_DASHBOARD_WIDGETS.find((d) => d.id === w.id);
      if (def) {
        merged.push({
          ...def,
          ...w,
          cols: w.cols || def.cols,
          height: w.height || def.height || 'normal',
          visible: w.visible !== false,
        });
      } else if (w.type === 'bucket_widget') {
        merged.push({
          ...w,
          cols: w.cols || 4,
          height: w.height || 'normal',
          visible: w.visible !== false,
        });
      }
    }
    for (const def of DEFAULT_DASHBOARD_WIDGETS) {
      if (!merged.some((m) => m.id === def.id)) {
        merged.push(def);
      }
    }
    return merged;
  } catch {
    return DEFAULT_DASHBOARD_WIDGETS;
  }
}

function loadDashboardStyles() {
  try {
    const saved = localStorage.getItem('iot_dashboard_styles');
    const legacyHero = localStorage.getItem('iot_hero_artwork');
    const base = saved ? JSON.parse(saved) : {};
    return {
      ...DEFAULT_STYLES,
      ...base,
      heroStyle: base.heroStyle || legacyHero || DEFAULT_STYLES.heroStyle,
    };
  } catch {
    return DEFAULT_STYLES;
  }
}

function SortableDashboardCard({
  id,
  title,
  cols,
  height = 'normal',
  allowedCols = [12],
  onResize,
  onToggleVisibility,
  editMode,
  children,
}) {
  const [resizing, setResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const startDragRef = useRef(null);
  const cardRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode || resizing });

  const setCombinedRef = (el) => {
    setNodeRef(el);
    cardRef.current = el;
  };

  const handlePointerDown = (e, mode) => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture(e.pointerId);
    } catch {}

    const rect = cardRef.current?.getBoundingClientRect() || { width: 300, height: 260 };
    setResizing(true);
    startDragRef.current = {
      mode,
      x: e.clientX,
      y: e.clientY,
      startCols: cols,
      startH: height || 'normal',
      baseWidth: rect.width,
      baseHeight: rect.height,
      handleEl,
    };

    setGhostSize({
      w: rect.width,
      h: rect.height,
      targetCols: cols,
      targetH: height || 'normal',
      activeAxis: mode,
    });

    const handlePointerMove = (moveEvent) => {
      if (!startDragRef.current) return;
      const { mode, startCols, startH, baseWidth, baseHeight } = startDragRef.current;
      const dx = moveEvent.clientX - startDragRef.current.x;
      const dy = moveEvent.clientY - startDragRef.current.y;

      const { targetCols, targetH, activeAxis } = computeDashboardResize(
        mode,
        dx,
        dy,
        startCols,
        startH,
        allowedCols
      );

      setGhostSize({
        w: activeAxis === 'height' ? baseWidth : Math.max(180, baseWidth + dx),
        h: activeAxis === 'width' ? baseHeight : Math.max(160, baseHeight + dy),
        targetCols,
        targetH,
        activeAxis,
      });
    };

    const handlePointerUp = (upEvent) => {
      if (startDragRef.current?.handleEl) {
        try {
          startDragRef.current.handleEl.releasePointerCapture(upEvent.pointerId);
        } catch {}
      }
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (!startDragRef.current) return;
      const { mode, startCols, startH } = startDragRef.current;
      const dx = upEvent.clientX - startDragRef.current.x;
      const dy = upEvent.clientY - startDragRef.current.y;

      const { targetCols, targetH } = computeDashboardResize(
        mode,
        dx,
        dy,
        startCols,
        startH,
        allowedCols
      );

      setGhostSize(null);
      setResizing(false);
      onResize(id, { cols: targetCols, height: targetH });
      startDragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: resizing ? 'none' : transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging || resizing ? 40 : 'auto',
  };

  const colClass = COL_SPAN_CLASSES[cols] || 'lg:col-span-12';

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`col-span-1 ${colClass} relative transition-all duration-200 ${
        editMode
          ? 'ring-1 ring-primary-500/40 rounded-3xl p-1.5 bg-primary-500/[0.03] shadow-lg shadow-primary-500/5'
          : ''
      }`}
    >
      {/* Ghost Resize Box */}
      {ghostSize && (
        <div
          className={`absolute top-0 left-0 rounded-3xl border-2 border-dashed z-50 pointer-events-none backdrop-blur-[2px] flex items-center justify-center transition-none ${
            ghostSize.activeAxis === 'height'
              ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_30px_rgba(251,191,36,0.3)]'
              : ghostSize.activeAxis === 'width'
              ? 'border-primary-400 bg-primary-500/15 shadow-[0_0_30px_rgba(var(--primary-500),0.3)]'
              : 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_30px_rgba(6,182,212,0.3)]'
          }`}
          style={{ width: `${ghostSize.w}px`, height: `${ghostSize.h}px` }}
        >
          <span
            className={`px-3.5 py-1.5 rounded-xl bg-slate-900/95 border text-xs font-black shadow-2xl tracking-wider uppercase animate-pulse flex items-center gap-1.5 ${
              ghostSize.activeAxis === 'height'
                ? 'border-amber-400 text-amber-300'
                : ghostSize.activeAxis === 'width'
                ? 'border-primary-400 text-primary-300'
                : 'border-cyan-400 text-cyan-300'
            }`}
          >
            {ghostSize.activeAxis === 'height' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Tinggi: {HEIGHT_LABELS[ghostSize.targetH] || ghostSize.targetH}
              </>
            ) : ghostSize.activeAxis === 'width' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" />
                Lebar: {COL_LABELS[ghostSize.targetCols] || `${ghostSize.targetCols} col`}
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {COL_LABELS[ghostSize.targetCols] || `${ghostSize.targetCols} col`} • {HEIGHT_LABELS[ghostSize.targetH]}
              </>
            )}
          </span>
        </div>
      )}

      {/* Edit Mode Floating Card Header */}
      {editMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 mb-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-xl animate-fade-in text-xs select-none">
          {/* Drag Handle & Label */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="p-1 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors"
              title="Tahan & geser untuk memindahkan urutan card"
            >
              <GripVertical size={14} />
            </button>
            <span className="font-extrabold text-slate-200 truncate text-[11px] tracking-wide">
              {title}
            </span>
          </div>

          {/* Width Pills, Height Pills, & Hide Action */}
          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
            {/* Width pills */}
            {allowedCols && allowedCols.length > 1 && (
              <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800">
                {allowedCols.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onResize(id, { cols: c })}
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all ${
                      cols === c
                        ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(var(--primary-500),0.4)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={`Lebar: ${c}/12 kolom`}
                  >
                    {COL_LABELS[c] || `${c} col`}
                  </button>
                ))}
              </div>
            )}

            {/* Height pills (Cmp, Norm, Tall) */}
            <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800">
              {[
                { id: 'compact', label: 'Cmp' },
                { id: 'normal',  label: 'Norm' },
                { id: 'tall',    label: 'Tall' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onResize(id, { height: h.id })}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all ${
                    height === h.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_8px_rgba(245,158,11,0.4)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={`Tinggi: ${h.label}`}
                >
                  {h.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onToggleVisibility(id, false)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Sembunyikan card ini dari dashboard"
            >
              <EyeOff size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Card Content Wrapper */}
      <div className={`w-full h-full relative ${resizing ? 'pointer-events-none select-none' : ''}`}>
        {children}
      </div>

      {/* ── Separate Drag Handles for Independent Interactive Resize ── */}
      {editMode && (
        <>
          {/* Bottom Edge Handle: Height only ("Panjang/Tinggi") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'height')}
            className="absolute inset-x-12 bottom-0 h-4 cursor-ns-resize z-20 flex items-center justify-center group/b-handle touch-none select-none"
            title="Tarik ke bawah / atas: Mengubah tinggi (panjang) saja"
          >
            <div className="w-14 h-1.5 rounded-full bg-slate-600/70 group-hover/b-handle:bg-amber-400 group-hover/b-handle:w-20 group-hover/b-handle:shadow-[0_0_12px_rgba(251,191,36,0.8)] group-active/b-handle:bg-amber-300 transition-all duration-200" />
          </div>

          {/* Right Edge Handle: Width only ("Lebar / Kolom") */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'width')}
            className="absolute inset-y-12 right-0 w-4 cursor-ew-resize z-20 flex items-center justify-center group/r-handle touch-none select-none"
            title="Tarik ke kanan / kiri: Mengubah lebar (kolom) saja"
          >
            <div className="h-14 w-1.5 rounded-full bg-slate-600/70 group-hover/r-handle:bg-primary-400 group-hover/r-handle:h-20 group-hover/r-handle:shadow-[0_0_12px_rgba(var(--primary-500),0.8)] group-active/r-handle:bg-primary-300 transition-all duration-200" />
          </div>

          {/* Corner Handle: Corner resize with Intent Locking */}
          <div
            onPointerDown={(e) => handlePointerDown(e, 'both')}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 text-slate-500 hover:text-cyan-400 active:text-cyan-300 transition-colors z-20 select-none touch-none"
            title="Tarik sudut: Mengubah ukuran card (lebar & tinggi)"
          >
            <div className="w-4 h-4 flex items-end justify-end pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L0 12H12V0Z" fill="currentColor" opacity="0.4" />
                <path d="M12 6L6 12H12V6Z" fill="currentColor" />
              </svg>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard Page (Vision UI Layout + IoT Platform Context + Theme Reactive)
───────────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const getUserTz = () => {
    try {
      return (
        JSON.parse(localStorage.getItem('iot_user') || '{}').timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );
    } catch {
      return 'Asia/Jakarta';
    }
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const s = localStorage.getItem('iot_user');
      return s ? JSON.parse(s) : { name: 'Administrator' };
    } catch {
      return { name: 'Administrator' };
    }
  });

  const [time, setTime]               = useState(new Date());
  const [userTz, setUserTz]           = useState(getUserTz);
  const [stats, setStats]             = useState(null);
  const [activity, setActivity]       = useState([]);
  const [recentDevices, setRecentDev] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [telemetryData, setTelemetry] = useState(initialTelemetryStream);

  // Customization & Edit Mode State
  const [editMode, setEditMode]                 = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState(loadDashboardWidgets);
  const [dashboardStyles, setDashboardStyles]   = useState(loadDashboardStyles);

  // Right Sidebar: Pinned Bucket Widgets State (Only opened inside Kustomisasi Dashboard)
  const [bucketSidebarOpen, setBucketSidebarOpen] = useState(false);

  const [pinnedCount, setPinnedCount] = useState(() => {
    try {
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const syncCount = () => {
      try {
        const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
        setPinnedCount(raw ? JSON.parse(raw).length : 0);
      } catch {}
    };
    window.addEventListener('bucket-widgets-updated', syncCount);
    window.addEventListener('storage', syncCount);
    return () => {
      window.removeEventListener('bucket-widgets-updated', syncCount);
      window.removeEventListener('storage', syncCount);
    };
  }, []);

  useEffect(() => {
    const handleToggle = () => toggleBucketSidebar();
    window.addEventListener('toggle-bucket-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-bucket-sidebar', handleToggle);
  }, []);

  const toggleBucketSidebar = () => {
    setBucketSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('iot_dashboard_bucket_sidebar_open', JSON.stringify(next));
      return next;
    });
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateDashboardStyle = useCallback((key, value) => {
    setDashboardStyles((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem('iot_dashboard_styles', JSON.stringify(next));
        if (key === 'heroStyle') {
          localStorage.setItem('iot_hero_artwork', value);
        }
      } catch {}
      return next;
    });
  }, []);

  const cycleHeroStyle = useCallback(() => {
    const current = dashboardStyles.heroStyle || 'iot-core';
    const idx = HERO_ARTWORK_STYLES.findIndex((s) => s.id === current);
    const next = HERO_ARTWORK_STYLES[(idx + 1) % HERO_ARTWORK_STYLES.length].id;
    updateDashboardStyle('heroStyle', next);
  }, [dashboardStyles.heroStyle, updateDashboardStyle]);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDashboardWidgets((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(reordered));
      } catch {}
      return reordered;
    });
  }, []);

  const handleResizeWidget = useCallback((id, { cols, height }) => {
    setDashboardWidgets((items) => {
      const updated = items.map((w) => {
        if (w.id !== id) return w;
        return {
          ...w,
          cols: cols !== undefined ? cols : w.cols,
          height: height !== undefined ? height : (w.height || 'normal'),
        };
      });
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleToggleVisibility = useCallback((id, visible) => {
    setDashboardWidgets((items) => {
      const target = items.find((w) => w.id === id);
      let updated;
      if (target?.type === 'bucket_widget' && !visible) {
        updated = items.filter((w) => w.id !== id);
      } else {
        updated = items.map((w) => (w.id === id ? { ...w, visible } : w));
      }
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Placed bucket widget IDs on the main dashboard
  const placedWidgetIds = useMemo(() => {
    const set = new Set();
    for (const w of dashboardWidgets) {
      if (w.type === 'bucket_widget') {
        if (w.bucketWidgetId) set.add(String(w.bucketWidgetId));
        if (w.widget?.id) set.add(String(w.widget.id));
        set.add(String(w.id));
      }
    }
    return set;
  }, [dashboardWidgets]);

  const handlePlaceBucketWidget = useCallback((item) => {
    const cardId = `bucket_widget_${item.id}`;
    setDashboardWidgets((prev) => {
      if (prev.some((w) => w.id === cardId || w.bucketWidgetId === item.id)) {
        return prev;
      }
      // Standardize uniform default dimensions:
      // Width: 4 cols (1/3 width of 12-col dashboard, exactly matching 1-col of 3-col Data Bucket)
      // Height: 'normal' (standardized 320px uniform height)
      const colSpan = item.widget?.type === 'container' ? 12 : 4;
      const newWidget = {
        id: cardId,
        type: 'bucket_widget',
        bucketWidgetId: item.id,
        bucketId: item.bucketId,
        bucketName: item.bucketName || 'Data Bucket',
        widget: item.widget,
        title: item.widget?.title || `${item.bucketName} - ${item.widget?.field || 'Telemetry'}`,
        cols: colSpan,
        height: 'normal',
        visible: true,
      };
      const updated = [...prev, newWidget];
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${item.widget?.title || 'Widget'} ditaruh di Dashboard Utama!`,
      showConfirmButton: false,
      timer: 1800,
      background: '#0f172a',
      color: '#f8fafc',
    });
  }, []);

  const handleRemoveBucketWidgetFromDashboard = useCallback((itemId) => {
    const targetId = String(itemId);
    const cardId = `bucket_widget_${targetId}`;
    setDashboardWidgets((prev) => {
      const updated = prev.filter(
        (w) =>
          w.id !== cardId &&
          String(w.bucketWidgetId) !== targetId &&
          w.id !== targetId &&
          String(w.widget?.id) !== targetId
      );
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Fetch telemetry records for buckets on dashboard & pinned list
  const [bucketRecords, setBucketRecords] = useState({});

  const fetchDashboardBucketRecords = useCallback(async () => {
    try {
      const bucketIds = new Set();
      dashboardWidgets.forEach((w) => {
        if (w.type === 'bucket_widget' && w.bucketId) {
          bucketIds.add(w.bucketId);
        }
      });
      const raw = localStorage.getItem('iot_dashboard_pinned_bucket_widgets');
      if (raw) {
        const pinned = JSON.parse(raw);
        pinned.forEach((p) => {
          if (p.bucketId) bucketIds.add(p.bucketId);
        });
      }

      if (bucketIds.size === 0) return;

      const results = {};
      await Promise.all(
        Array.from(bucketIds).map(async (bId) => {
          try {
            const res = await bucketsApi.records(bId);
            results[bId] = res.data?.records || res.data || [];
          } catch {}
        })
      );
      setBucketRecords((prev) => ({ ...prev, ...results }));
    } catch {}
  }, [dashboardWidgets]);

  useEffect(() => {
    fetchDashboardBucketRecords();
    const iv = setInterval(fetchDashboardBucketRecords, 4000);
    return () => clearInterval(iv);
  }, [fetchDashboardBucketRecords]);

  const handleUpdateBucketWidgetVariant = useCallback((widgetId, variantId) => {
    setDashboardWidgets((prev) => {
      const updated = prev.map((w) => {
        if (w.id === widgetId) {
          const wDef = w.widget || {};
          const nextConfig = { ...(wDef.config || {}), variant: variantId };
          return {
            ...w,
            widget: { ...wDef, config: nextConfig },
          };
        }
        return w;
      });
      try {
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const resetDashboard = useCallback(async () => {
    const res = await Swal.fire({
      title: 'Reset Dashboard?',
      text: 'Layout tata letak, ukuran card, dan preferensi style visual akan dikembalikan ke setelan awal.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Kembalikan Default',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f8fafc',
    });
    if (res.isConfirmed) {
      try {
        localStorage.removeItem('iot_dashboard_layout');
        localStorage.removeItem('iot_dashboard_styles');
        localStorage.removeItem('iot_hero_artwork');
      } catch {}
      setDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
      setDashboardStyles(DEFAULT_STYLES);
      Swal.fire({
        title: 'Tersimpan!',
        text: 'Dashboard telah dikembalikan ke setelan bawaan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
    }
  }, []);

  const visibleWidgets = useMemo(
    () => dashboardWidgets.filter((w) => w.visible !== false),
    [dashboardWidgets]
  );
  const hiddenWidgets = useMemo(
    () => dashboardWidgets.filter((w) => w.visible === false),
    [dashboardWidgets]
  );

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUserTz(getUserTz());
    }, 1000);
    const h = () => {
      setUserTz(getUserTz());
      try {
        const s = localStorage.getItem('iot_user');
        if (s) setCurrentUser(JSON.parse(s));
      } catch {}
    };
    window.addEventListener('user-updated', h);
    return () => {
      clearInterval(t);
      window.removeEventListener('user-updated', h);
    };
  }, []);

  // Subtle live tick on the telemetry area chart
  useEffect(() => {
    const iv = setInterval(() => {
      setTelemetry((prev) => {
        const nextA = Math.max(150, Math.min(490, Math.round(340 + (Math.random() - 0.45) * 180)));
        const nextB = Math.max(110, Math.min(380, Math.round(220 + (Math.random() - 0.45) * 120)));
        const label = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return [...prev.slice(1), { time: label, sensorA: nextA, sensorB: nextB }];
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [sR, aR, dR] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.activity(),
          devicesApi.list(),
        ]);
        setStats(sR.data);
        setActivity(aR.data || []);
        setRecentDev(dR.data || []);
      } catch {
        setStats({
          total_devices: 0,
          online_devices: 0,
          warning_devices: 0,
          total_data_points: 0,
          total_buckets: 0,
          active_endpoints: 0,
          total_endpoints: 0,
        });
        setActivity([]);
        setRecentDev([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const timeParts = new Intl.DateTimeFormat('id-ID', {
    timeZone: userTz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(time);

  const hourStr = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const minStr  = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const secStr  = timeParts.find((p) => p.type === 'second')?.value || '00';

  const dayStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: userTz,
    weekday: 'long',
  }).format(time);

  const dateStr = new Intl.DateTimeFormat('id-ID', {
    timeZone: userTz,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(time);

  const hasRealDevices = recentDevices && recentDevices.length > 0;
  const totalDev = stats?.total_devices ?? 0;
  const onlineDev = stats?.online_devices ?? 0;
  const totalPoints = stats?.total_data_points ?? 0;
  const totalBuckets = stats?.total_buckets ?? 0;
  const activeEndpoints = stats?.active_endpoints ?? 0;
  const totalEndpoints = stats?.total_endpoints ?? 0;

  const healthPct =
    totalDev > 0
      ? Math.min(100, Math.max(80, Math.round((onlineDev / totalDev) * 100)))
      : 95;

  const safetyScore = 9.5;

  // Bklit UI Time-Series Data Stream
  const bklitTelemetry = useMemo(() => {
    const baseDate = new Date();
    baseDate.setMinutes(0, 0, 0);
    return telemetryData.map((d, idx) => ({
      ...d,
      date: new Date(baseDate.getTime() - (telemetryData.length - 1 - idx) * 3600000 * 2),
    }));
  }, [telemetryData]);

  const activityIcons = {
    info:    { Icon: Activity,     color: 'rgb(var(--primary-400))' },
    warning: { Icon: AlertCircle,  color: '#fbbf24' },
    error:   { Icon: XCircle,      color: '#f43f5e' },
    success: { Icon: CheckCircle2, color: '#10b981' },
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Render Specific Widget Content cleanly
  ───────────────────────────────────────────────────────────────────────── */
  const renderWidgetContent = (widget) => {
    if (widget.type === 'bucket_widget') {
      const recs = bucketRecords[widget.bucketId] || [];
      const widgetDef = widget.widget || widget || {};
      const color = widgetDef.color || widgetDef.config?.color || 'rgb(var(--primary-400))';
      const cardHeightClass =
        widget.height === 'compact'
          ? 'h-[240px] min-h-[240px]'
          : widget.height === 'tall'
          ? 'h-[420px] min-h-[420px]'
          : 'h-[320px] min-h-[320px]';

      const typeInfo = CHART_TYPES.find((c) => c.value === widgetDef.type);
      const WidgetIcon = typeInfo?.icon || Activity;
      const typeLabel = typeInfo?.label || widgetDef.type || 'Widget';
      const activeVariant =
        widgetDef.config?.variant ||
        (widgetDef.type === 'gauge'
          ? 'notches'
          : widgetDef.type === 'line'
          ? 'glow'
          : widgetDef.type === 'bar'
          ? 'rounded'
          : widgetDef.type === 'container'
          ? 'grid-2'
          : 'smooth');

      return (
        <div
          className={`vision-card p-6 relative group flex flex-col justify-between transition-all duration-300 ease-out overflow-hidden min-w-0 max-w-full ${cardHeightClass}`}
        >
          {/* Header (Exactly identical to Data Bucket) */}
          <div className="flex items-start justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="min-w-0">
                <h4 className="text-[15px] font-extrabold text-slate-100 leading-tight truncate">
                  {widget.title || widgetDef.title || `${widget.bucketName} - ${widgetDef.field}`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {typeLabel} • <span className="font-mono text-primary-400">{widgetDef.field || 'telemetry'}</span>
                  {widget.bucketName && (
                    <span className="text-slate-500"> • {widget.bucketName}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Link
                to={`/app/buckets/${widget.bucketId}`}
                className="p-1.5 rounded-xl border bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-primary-300 border-slate-700/60 transition-all"
                title="Buka Data Bucket ini"
              >
                <ExternalLink size={14} />
              </Link>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.4)',
                }}
              >
                <WidgetIcon size={14} />
              </div>
            </div>
          </div>

          {/* Chart Variant Quick Switcher (Bklit UI) - Only in Edit Mode */}
          {editMode && CHART_VARIANTS[widgetDef.type] && (
            <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 bg-slate-900/60 rounded-xl border border-slate-800/80 -mt-1 mb-1 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                Style:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {CHART_VARIANTS[widgetDef.type].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleUpdateBucketWidgetVariant(widget.id, v.id)}
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all whitespace-nowrap ${
                      activeVariant === v.id
                        ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(var(--primary-500),0.4)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={v.desc}
                  >
                    {v.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chart / Widget Content */}
          <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col justify-center transition-[height] duration-300 ease-out">
            <WidgetChart
              widget={{ ...widgetDef, h: widget.height }}
              chartData={recs}
              color={color}
              overrideVariant={activeVariant}
            />
          </div>
        </div>
      );
    }

    switch (widget.id) {
      case 'metrik': {
        const isHalf = widget.cols <= 6;
        const cardMinH =
          widget.height === 'compact'
            ? 'min-h-[135px]'
            : widget.height === 'tall'
            ? 'min-h-[195px]'
            : 'min-h-[160px]';
        return (
          <div className="space-y-3 w-full">
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-extrabold uppercase tracking-widest text-slate-400">
                Metrik Telemetri IoT
              </span>
            </div>

            <div className={`grid grid-cols-1 ${isHalf ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4'} gap-5`}>
              <VisionStatCard
                label="Total Devices"
                value={`${totalDev} Unit`}
                badgeText={totalDev > 0 ? `${onlineDev}/${totalDev} Aktif` : '0 Terdaftar'}
                badgeVariant={onlineDev > 0 ? 'positive' : 'neutral'}
                badgeIcon={CheckCircle2}
                icon={Cpu}
                loading={loading}
                className={cardMinH}
                footerWidget={<DeviceProgressBar online={onlineDev} total={totalDev} />}
              />

              <VisionStatCard
                label="Online Now"
                value={`${onlineDev} Aktif`}
                badgeText={
                  totalDev === 0
                    ? 'Standby'
                    : onlineDev === 0
                    ? 'Semua Offline'
                    : onlineDev === totalDev
                    ? '100% Online'
                    : `${Math.round((onlineDev / totalDev) * 100)}% Online`
                }
                badgeVariant={
                  totalDev === 0
                    ? 'neutral'
                    : onlineDev === 0
                    ? 'rose'
                    : onlineDev === totalDev
                    ? 'positive'
                    : 'warning'
                }
                badgeIcon={Wifi}
                icon={Wifi}
                loading={loading}
                className={cardMinH}
                footerWidget={<SignalPulseWave isOnline={onlineDev > 0} latency="24ms" />}
              />

              <VisionStatCard
                label="Data Points"
                value={totalPoints.toLocaleString()}
                badgeText="+1.2k / jam"
                badgeVariant="positive"
                badgeIcon={TrendingUp}
                icon={Database}
                loading={loading}
                className={cardMinH}
                footerWidget={<MiniSparkline label="Throughput Sensor Real-Time" />}
              />

              <VisionStatCard
                label="Active Endpoints"
                value={`${activeEndpoints} / ${totalEndpoints}`}
                badgeText={
                  totalEndpoints === 0
                    ? '0 Endpoint'
                    : activeEndpoints === totalEndpoints
                    ? '100% Synced'
                    : `${activeEndpoints} Synced`
                }
                badgeVariant={
                  totalEndpoints === 0
                    ? 'neutral'
                    : activeEndpoints === totalEndpoints
                    ? 'positive'
                    : 'warning'
                }
                badgeIcon={Webhook}
                icon={Webhook}
                loading={loading}
                className={cardMinH}
                footerWidget={<EndpointPipeline active={activeEndpoints} total={totalEndpoints} />}
              />
            </div>
          </div>
        );
      }

      case 'hero': {
        const heroHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <div className={`vision-card relative overflow-hidden p-7 ${heroHeightClass} transition-[height] duration-300 ease-out w-full flex flex-col justify-between group`}>
            <HeroArtwork variant={dashboardStyles.heroStyle} />

            {/* Top Row: Left Welcome Identity + Right Bold Android Clock */}
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="max-w-[260px]">
                <p className="text-[13px] text-slate-400 font-medium">Welcome back,</p>
                <h2 className="text-[26px] sm:text-[28px] font-extrabold text-slate-100 tracking-tight mt-0.5 mb-2.5">
                  {currentUser?.name || 'Administrator'}
                </h2>
                <p className="text-[13px] text-slate-300 leading-relaxed">
                  Glad to see you again!
                  <br />
                  Pantau telemetri & kendalikan perangkat IoT Anda secara real-time.
                </p>
              </div>

              <div className="select-none text-right flex-shrink-0">
                <div className="inline-flex items-baseline gap-1.5">
                  <span className="text-[30px] sm:text-[34px] font-black text-slate-100 tracking-tight leading-none drop-shadow-sm">
                    {hourStr}:{minStr}
                  </span>
                  <span className="text-[13px] font-extrabold text-primary-400 tracking-tight leading-none">
                    {secStr}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-300 mt-1">
                  {dayStr}, {dateStr}
                </p>
              </div>
            </div>

            {/* Bottom Row: Left Action Link + Visual Style Switcher (ONLY IN EDIT MODE) */}
            <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/app/devices"
                className="inline-flex items-center gap-2 text-[12px] font-bold text-slate-100 hover:text-primary-400 transition-colors group/btn"
              >
                Kelola Perangkat IoT
                <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
              </Link>

              {/* Style switcher is ONLY displayed in edit mode, and automatically saved */}
              {editMode && (
                <>
                  <span className="text-slate-600 select-none">•</span>
                  <button
                    type="button"
                    onClick={cycleHeroStyle}
                    title="Ganti Desain Visual Hero"
                    className="vision-inner-box px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 hover:text-primary-400 flex items-center gap-1.5 transition-all hover:scale-105 flex-shrink-0"
                  >
                    <Layers size={11} className="text-primary-400" />
                    <span>{HERO_ARTWORK_STYLES.find((s) => s.id === dashboardStyles.heroStyle)?.label}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }

      case 'health': {
        const healthHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        const healthGaugeH =
          widget.height === 'compact' ? 115 : widget.height === 'tall' ? 190 : 135;
        return (
          <div className={`vision-card p-6 flex flex-col justify-between ${healthHeightClass} transition-[height] duration-300 ease-out w-full`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Device Health Rate</h3>
                <p className="text-[12px] text-slate-400 mt-0.5">Dari seluruh node terdaftar</p>
              </div>

              {/* Style switcher is ONLY displayed in edit mode */}
              {editMode && (
                <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-700/50">
                  {[
                    { id: 'notches', label: 'Notch' },
                    { id: 'needle',  label: 'Needle' },
                    { id: 'solid',   label: 'Solid' },
                    { id: 'dots',    label: 'Dots' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateDashboardStyle('healthGaugeMode', m.id)}
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                        dashboardStyles.healthGaugeMode === m.id
                          ? 'bg-primary-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bklit UI Gauge + Glowing Center Theme Smiley Badge */}
            <div className="relative flex flex-col items-center justify-center my-1">
              <div className="w-[215px]">
                <BklitGauge
                  value={healthPct}
                  totalNotches={dashboardStyles.healthGaugeMode === 'needle' ? 42 : 36}
                  arcStyle={dashboardStyles.healthGaugeMode === 'solid' ? 'solid' : 'notches'}
                  needle={dashboardStyles.healthGaugeMode === 'needle' ? 'gradient' : false}
                  ruler={dashboardStyles.healthGaugeMode === 'needle'}
                  dots={dashboardStyles.healthGaugeMode === 'dots'}
                  sector={dashboardStyles.healthGaugeMode === 'solid'}
                  progressRing={dashboardStyles.healthGaugeMode === 'solid' || dashboardStyles.healthGaugeMode === 'notches'}
                  centerDisc={dashboardStyles.healthGaugeMode === 'needle'}
                  glow={true}
                  height={healthGaugeH}
                />
              </div>

              <div
                className="absolute bottom-3 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 0 20px rgb(var(--primary-500) / 0.6)',
                }}
              >
                <Smile size={22} />
              </div>
            </div>

            <div className="vision-inner-box px-5 py-3.5 flex items-start justify-between">
              <span className="text-[11px] font-medium text-slate-500">0%</span>
              <div className="text-center -mt-0.5">
                <p className="text-[24px] font-extrabold text-slate-100 leading-none">{healthPct}%</p>
                <p className="text-[11px] text-slate-400 mt-1">Uptime & Respons</p>
              </div>
              <span className="text-[11px] font-medium text-slate-500">100%</span>
            </div>
          </div>
        );
      }

      case 'tracking': {
        const trackingHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        const trackingGaugeH =
          widget.height === 'compact' ? 120 : widget.height === 'tall' ? 200 : 145;
        return (
          <div className={`vision-card p-6 flex flex-col justify-between ${trackingHeightClass} transition-[height] duration-300 ease-out w-full`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Telemetry Tracking</h3>
              <div className="flex items-center gap-1.5">
                {/* Style switcher ONLY in edit mode */}
                {editMode && (
                  <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-700/50">
                    {[
                      { id: 'solid',   label: 'Solid' },
                      { id: 'notches', label: 'Notch' },
                      { id: 'needle',  label: 'Needle' },
                      { id: 'dots',    label: 'Dots' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => updateDashboardStyle('safetyGaugeMode', m.id)}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded transition-all ${
                          dashboardStyles.safetyGaugeMode === m.id
                            ? 'bg-primary-500 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
                <Link
                  to="/app/buckets"
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-primary-400 transition-colors"
                  title="Buka Data Buckets"
                >
                  <MoreHorizontal size={16} />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto pt-3">
              <div className="flex flex-col gap-3.5 w-full sm:w-[44%]">
                <div className="vision-inner-box p-4">
                  <p className="text-[11px] font-medium text-slate-400">Data Buckets</p>
                  <p className="text-[16px] font-extrabold text-slate-100 mt-1">{totalBuckets} Bucket</p>
                </div>
                <div className="vision-inner-box p-4">
                  <p className="text-[11px] font-medium text-slate-400">Total Records</p>
                  <p className="text-[16px] font-extrabold text-slate-100 mt-1">{totalPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="relative flex items-center justify-center flex-1">
                <div className="w-[185px]">
                  <BklitGauge
                    value={Math.round(safetyScore * 10)}
                    centerValue={safetyScore}
                    defaultLabel="Skor Telemetri"
                    formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                    totalNotches={dashboardStyles.safetyGaugeMode === 'needle' ? 40 : 34}
                    startAngle={-Math.PI * 0.75}
                    endAngle={Math.PI * 0.75}
                    arcStyle={dashboardStyles.safetyGaugeMode === 'solid' ? 'solid' : 'notches'}
                    needle={dashboardStyles.safetyGaugeMode === 'needle' ? 'gradient' : false}
                    ruler={dashboardStyles.safetyGaugeMode === 'needle'}
                    dots={dashboardStyles.safetyGaugeMode === 'dots'}
                    sector={dashboardStyles.safetyGaugeMode === 'solid'}
                    progressRing={dashboardStyles.safetyGaugeMode === 'solid' || dashboardStyles.safetyGaugeMode === 'notches'}
                    centerDisc={dashboardStyles.safetyGaugeMode === 'needle'}
                    glow={true}
                    height={trackingGaugeH}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'telemetry_chart': {
        const chartH =
          widget.height === 'compact'
            ? 'h-[210px]'
            : widget.height === 'tall'
            ? 'h-[430px]'
            : 'h-[290px]';
        const chartInnerH =
          widget.height === 'compact'
            ? 'h-[200px]'
            : widget.height === 'tall'
            ? 'h-[420px]'
            : 'h-[280px]';
        return (
          <div className="vision-card p-6 flex flex-col justify-between w-full h-full">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Live Telemetry Overview</h3>
                <p className="text-[12px] text-slate-400 mt-1">
                  <span className="text-emerald-400 font-bold">(+Realtime)</span> aliran sensor Suhu & Kelembapan
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Variant Switcher Pills ONLY in edit mode */}
                {editMode && (
                  <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
                    {[
                      { id: 'smooth',  label: 'Smooth Flow' },
                      { id: 'stepped', label: 'Step Pulse' },
                      { id: 'glow',    label: 'Cyber Glow' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateDashboardStyle('telemetryMode', mode.id)}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                          dashboardStyles.telemetryMode === mode.id
                            ? 'bg-primary-500 text-white shadow-[0_2px_10px_rgba(var(--primary-500),0.4)]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="hidden xl:flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgb(var(--primary-500))' }} />
                    Stream A
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgb(var(--primary-300))' }} />
                    Stream B
                  </span>
                </div>
              </div>
            </div>

            <div className={`w-full ${chartH} pt-2 transition-[height] duration-300 ease-out`}>
              {dashboardStyles.telemetryMode === 'glow' ? (
                <BklitLineChart
                  data={bklitTelemetry}
                  xDataKey="date"
                  className={`w-full ${chartInnerH}`}
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <BklitGrid stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4,4" />
                  <BklitLine
                    dataKey="sensorA"
                    stroke="rgb(var(--primary-500))"
                    strokeWidth={2.5}
                    curve={curveNatural}
                    glow={{ blur: 10, opacity: 0.8 }}
                  />
                  <BklitLine
                    dataKey="sensorB"
                    stroke="rgb(var(--primary-300))"
                    strokeWidth={2}
                    curve={curveNatural}
                    glow={{ blur: 8, opacity: 0.6 }}
                  />
                  <BklitXAxis />
                  <BklitChartTooltip />
                </BklitLineChart>
              ) : (
                <BklitAreaChart
                  data={bklitTelemetry}
                  xDataKey="date"
                  className={`w-full ${chartInnerH}`}
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                >
                  <BklitGrid stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="4,4" />
                  <BklitArea
                    dataKey="sensorA"
                    stroke="rgb(var(--primary-500))"
                    fill="rgb(var(--primary-500))"
                    fillOpacity={0.35}
                    strokeWidth={2.5}
                    curve={dashboardStyles.telemetryMode === 'stepped' ? curveStep : curveNatural}
                  />
                  <BklitArea
                    dataKey="sensorB"
                    stroke="rgb(var(--primary-300))"
                    fill="rgb(var(--primary-300))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    curve={dashboardStyles.telemetryMode === 'stepped' ? curveStep : curveNatural}
                  />
                  <BklitXAxis />
                  <BklitChartTooltip />
                </BklitAreaChart>
              )}
            </div>
          </div>
        );
      }

      case 'infrastructure_chart': {
        const barH =
          widget.height === 'compact'
            ? 'h-[140px]'
            : widget.height === 'tall'
            ? 'h-[290px]'
            : 'h-[200px]';
        const barInnerH =
          widget.height === 'compact'
            ? 'h-[115px]'
            : widget.height === 'tall'
            ? 'h-[265px]'
            : 'h-[175px]';
        return (
          <div className="vision-card p-6 flex flex-col justify-between w-full h-full">
            {/* Top Switcher ONLY in edit mode */}
            {editMode && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-400" />
                  Bar Render:
                </span>
                <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
                  {[
                    { id: 'rounded', label: 'Rounded' },
                    { id: 'squares', label: 'Matrix' },
                    { id: 'depth',   label: '3D Depth' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateDashboardStyle('barMode', m.id)}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg transition-all ${
                        dashboardStyles.barMode === m.id
                          ? 'bg-primary-500 text-white shadow-[0_2px_8px_rgba(var(--primary-500),0.4)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={`vision-inner-box p-4 ${barH} w-full flex items-center justify-center transition-[height] duration-300 ease-out`}>
              <BklitBarChart
                data={brokerThroughputBars}
                xDataKey="slot"
                className={`w-full ${barInnerH}`}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                barGap={0.3}
              >
                <BklitGrid stroke="rgba(148, 163, 184, 0.06)" />
                {dashboardStyles.barMode === 'squares' ? (
                  <BklitBarSquares
                    dataKey="msg"
                    fill="rgb(var(--primary-500))"
                    squareGap={2.5}
                    squareRadius={0.25}
                  />
                ) : dashboardStyles.barMode === 'depth' ? (
                  <BklitBar
                    dataKey="msg"
                    fill="rgb(var(--primary-500))"
                    perspective={true}
                    lineCap="round"
                  />
                ) : (
                  <BklitBar
                    dataKey="msg"
                    fill="rgb(var(--primary-500))"
                    lineCap="round"
                  />
                )}
                <BklitChartTooltip />
              </BklitBarChart>
            </div>

            <div className="mt-5 mb-4">
              <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Active Infrastructure</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">
                <span className="text-emerald-400 font-bold">(+Realtime)</span> kapasitas node & trafik broker
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Devices',   value: String(totalDev),        icon: Cpu,      progress: 75 },
                { label: 'Online',    value: String(onlineDev),       icon: Wifi,     progress: healthPct },
                { label: 'Buckets',   value: String(totalBuckets),    icon: Database, progress: 65 },
                { label: 'Endpoints', value: String(activeEndpoints), icon: Webhook,  progress: 80 },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                        boxShadow: '0 2px 8px rgb(var(--primary-500) / 0.45)',
                      }}
                    >
                      <item.icon size={12} />
                    </div>
                    <span className="text-[12px] font-medium text-slate-400 truncate">{item.label}</span>
                  </div>
                  <p className="text-[16px] font-extrabold text-slate-100 leading-tight mb-2">{item.value}</p>
                  <div className="w-full h-1 rounded-full bg-slate-700/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.progress}%`,
                        background: 'rgb(var(--primary-500))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'devices_table': {
        const tableLimit =
          widget.height === 'compact' ? 3 : widget.height === 'tall' ? 8 : 5;
        const tableHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <div className={`vision-card p-6 w-full ${tableHeightClass} transition-[height] duration-300 ease-out flex flex-col justify-between`}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Connected IoT Devices</h3>
                <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>
                    <strong className="text-slate-200">{onlineDev} perangkat online</strong> dari {totalDev} terdaftar
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/app/devices"
                  className="text-[11px] font-bold text-primary-400 hover:text-primary-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  Lihat Semua →
                </Link>
                <Link
                  to="/app/devices"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
                >
                  <MoreVertical size={16} />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="pb-3 pr-4">PERANGKAT</th>
                    <th className="pb-3 px-4">PROTOKOL</th>
                    <th className="pb-3 px-4">IP ADDRESS</th>
                    <th className="pb-3 pl-4">STATUS & HEALTH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(hasRealDevices
                    ? recentDevices.slice(0, tableLimit).map((dev) => ({
                        id: dev.id,
                        isDevice: true,
                        name: dev.name,
                        location: dev.location || 'IoT Node',
                        ip: dev.ip || 'MQTT Active',
                        protocol: (dev.protocol || 'MQTT').toUpperCase(),
                        completion: dev.status === 'online' ? 100 : dev.status === 'warning' ? 60 : 20,
                        status: dev.status || 'offline',
                      }))
                    : fallbackIoTDevices.slice(0, tableLimit)
                  ).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/35 transition-colors group">
                      <td className="py-3.5 pr-4">
                        <Link
                          to={row.isDevice ? `/app/devices/${row.id}` : '/app/devices'}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                            }}
                          >
                            <Cpu size={15} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-100 group-hover:text-primary-400 transition-colors">
                              {row.name}
                            </p>
                            <p className="text-[11px] text-slate-500">{row.location}</p>
                          </div>
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                          style={{
                            background: 'rgb(var(--primary-500) / 0.12)',
                            color: 'rgb(var(--primary-300))',
                            border: '1px solid rgb(var(--primary-500) / 0.2)',
                          }}
                        >
                          {row.protocol}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[12px] font-mono font-bold text-slate-300">{row.ip}</span>
                      </td>

                      <td className="py-3.5 pl-4 min-w-[150px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-bold text-slate-200">{row.completion}%</span>
                          <StatusBadge status={row.status} />
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${row.completion}%`,
                              background: 'rgb(var(--primary-500))',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'recent_activity': {
        const actLimit =
          widget.height === 'compact' ? 3 : widget.height === 'tall' ? 8 : 6;
        const actHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <div className={`vision-card p-6 w-full ${actHeightClass} transition-[height] duration-300 ease-out flex flex-col justify-between`}>
            <div className="mb-5">
              <h3 className="text-[16px] font-extrabold text-slate-100 leading-tight">Recent Activity</h3>
              <p className="text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>
                  <strong className="text-slate-200">Live Log</strong> aktivitas sistem & sensor
                </span>
              </p>
            </div>

            <div className="space-y-4 relative">
              {(activity && activity.length > 0 ? activity.slice(0, actLimit) : fallbackIoTActivity.slice(0, actLimit)).map(
                (item, idx, arr) => {
                  const cfg = activityIcons[item.type] || activityIcons.info;
                  const Icon = cfg.Icon;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={item.id || idx} className="flex items-start gap-3.5 relative">
                      {!isLast && (
                        <span className="absolute left-[13px] top-7 bottom-[-14px] w-[2px] bg-slate-800" />
                      )}
                      <div
                        className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 relative z-10"
                        style={{ color: cfg.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-100 leading-snug truncate">
                          {item.event}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                          {item.device} • <span className="text-slate-500 uppercase">{item.time}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      }

      case 'quick_controls': {
        const isHalf = widget.cols <= 6;
        return (
          <div className={`grid grid-cols-1 ${isHalf ? 'grid-cols-1' : 'md:grid-cols-3'} gap-5 pt-1 w-full`}>
            <SmartSwitchWidget title="Lampu Ruang Tamu" initialState={true} topic="home/living-room/light" />
            <SmartSwitchWidget title="Lampu Teras" initialState={false} topic="home/porch/light" />
            <ThermostatWidget title="Living Room AC" initialValue={22} min={16} max={30} />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in max-w-[1600px] mx-auto relative">
      {/* ── Top Dashboard Header / Edit Mode Action Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                IoT Platform Overview
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Monitoring telemetri & otomasi cerdas end-to-end
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {editMode ? (
              <>
                {/* Toggle Bucket Widgets Right Sidebar (Only shown in Edit Mode) */}
                <button
                  type="button"
                  onClick={toggleBucketSidebar}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                    bucketSidebarOpen
                      ? 'bg-primary-500 text-white border-primary-400 shadow-md shadow-primary-500/25 ring-1 ring-primary-300/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                  }`}
                  title={bucketSidebarOpen ? 'Sembunyikan Sidebar Bucket Widget' : 'Buka Sidebar Bucket Widget'}
                >
                  <Database size={14} className={bucketSidebarOpen ? 'text-white' : 'text-primary-400'} />
                  <span>Bucket Widgets</span>
                  {pinnedCount > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${bucketSidebarOpen ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'}`}>
                      {pinnedCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetDashboard}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-sm"
                  title="Kembalikan layout & style ke setelan awal"
                >
                  <RotateCcw size={14} className="text-amber-400" />
                  <span>Reset Bawaan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false);
                    setBucketSidebarOpen(false);
                    localStorage.setItem('iot_dashboard_bucket_sidebar_open', JSON.stringify(false));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg shadow-primary-500/25 transition-all hover:brightness-110 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  }}
                >
                  <Check size={15} />
                  <span>Selesai Edit</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/70 transition-all shadow-sm group"
              >
                <Pencil size={13} className="text-primary-400 group-hover:scale-110 transition-transform" />
                <span>Kustomisasi Dashboard</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Edit Mode Banner & Hidden Widgets Drawer ── */}
        {editMode && (
          <div className="vision-card p-4 border border-primary-500/40 bg-primary-500/[0.04] space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-400 animate-ping" />
                <p className="text-xs font-bold text-slate-200">
                  <strong className="text-primary-400">Mode Kustomisasi Aktif:</strong> Drag ikon grip untuk geser posisi, klik pill ukuran (kolom & tinggi) atau tarik handle tepi/sudut untuk resize card, dan pilih style visual widget secara langsung.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={toggleBucketSidebar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/40 transition-all shadow-sm"
                >
                  <Database size={13} className="text-primary-400" />
                  <span>{bucketSidebarOpen ? 'Tutup Sidebar Bucket Widgets' : 'Buka Sidebar Bucket Widgets'}</span>
                </button>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-700/60 flex-shrink-0">
                  Perubahan tersimpan otomatis
                </span>
              </div>
            </div>

            {hiddenWidgets.length > 0 && (
              <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Eye size={13} className="text-slate-400" />
                  Card Tersembunyi:
                </span>
                {hiddenWidgets.map((hw) => (
                  <button
                    key={hw.id}
                    type="button"
                    onClick={() => handleToggleVisibility(hw.id, true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-primary-300 border border-slate-700 transition-all"
                    title="Klik untuk menampilkan kembali di dashboard"
                  >
                    <Plus size={12} className="text-emerald-400" />
                    <span>{hw.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Dynamic Grid of Dashboard Cards with Sortable Reorder ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {visibleWidgets.map((widget) => (
                <SortableDashboardCard
                  key={widget.id}
                  id={widget.id}
                  title={widget.title}
                  cols={widget.cols}
                  height={widget.height || 'normal'}
                  allowedCols={
                    widget.type === 'bucket_widget'
                      ? [3, 4, 6, 8, 12]
                      : (ALLOWED_COLS[widget.id] || [12])
                  }
                  onResize={handleResizeWidget}
                  onToggleVisibility={handleToggleVisibility}
                  editMode={editMode}
                >
                  <CardErrorBoundary onRemove={() => handleToggleVisibility(widget.id, false)}>
                    {renderWidgetContent(widget)}
                  </CardErrorBoundary>
                </SortableDashboardCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>

      {/* ── Floating Right Pill Tab: ONLY in Edit Mode ── */}
      {editMode && !bucketSidebarOpen && (
        <button
          type="button"
          onClick={() => {
            setBucketSidebarOpen(true);
            localStorage.setItem('iot_dashboard_bucket_sidebar_open', JSON.stringify(true));
          }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 pl-3.5 pr-2.5 py-2.5 rounded-l-2xl bg-slate-900/95 hover:bg-slate-800 border-y border-l border-primary-500/50 shadow-[-4px_4px_25px_rgba(var(--primary-500),0.3)] text-primary-300 hover:text-white transition-all group cursor-pointer backdrop-blur-md"
          title="Buka Sidebar Widget Data Bucket"
        >
          <Database size={15} className="text-primary-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span className="text-[11px] font-black tracking-wider uppercase hidden sm:inline">Bucket Widgets</span>
          {pinnedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-primary-500 text-white leading-none">
              {pinnedCount}
            </span>
          )}
        </button>
      )}

      {/* ── Right Sidebar: Bucket Telemetry Widgets ── */}
      <BucketWidgetsSidebar
        isOpen={bucketSidebarOpen}
        onClose={() => {
          setBucketSidebarOpen(false);
          localStorage.setItem('iot_dashboard_bucket_sidebar_open', JSON.stringify(false));
        }}
        placedWidgetIds={placedWidgetIds}
        onAddToDashboard={handlePlaceBucketWidget}
        onRemoveFromDashboard={handleRemoveBucketWidgetFromDashboard}
      />
    </div>
  );
}
