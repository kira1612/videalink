import React, { useState, useEffect, useMemo, useCallback, useRef, Component, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Database, Webhook, Wifi, ArrowRight,
  CheckCircle2, MoreHorizontal, MoreVertical,
  Smile, Activity, Zap, Server, Clock,
  AlertCircle, XCircle, Layers, Sparkles, TrendingUp,
  Pencil, Check, RotateCcw, Eye, EyeOff, GripVertical, SlidersHorizontal, Plus,
  PanelRight, PanelRightClose, ExternalLink, Home, Box, Power, Loader2,
  LayoutGrid, ChevronLeft, ChevronRight, Palette
} from 'lucide-react';
import Swal from 'sweetalert2';
import BucketWidgetsSidebar from '../components/Widgets/BucketWidgetsSidebar';
import { WidgetChart, CHART_TYPES, CHART_VARIANTS, MULTI_SERIES_TYPES } from './BucketDetail';
import FloorPlan from './FloorPlan';
import {
  DndContext,
  closestCorners,
  closestCenter,
  pointerWithin,
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
import { dashboardApi, devicesApi, bucketsApi, mqttApi, roomsApi } from '../services/api';
import {
  PREF_KEYS,
  getUserJsonPref,
  setUserJsonPref,
  resetUserDashboardPrefs,
  hydratePrefsFromUser,
  getStoredUser,
} from '../utils/dashboardPrefs';
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
    <div className={`vision-card p-4 sm:p-5 relative overflow-hidden group transition-all duration-300 hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 flex flex-col justify-between w-full min-w-0 max-w-full ${className || 'min-h-[160px]'}`}>
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

const METRIC_DESIGN_STYLES = [
  { id: 'vision', label: 'Klasik' },
  { id: 'bento',  label: 'Bento' },
  { id: 'strip',  label: 'Strip' },
  { id: 'ring',   label: 'Ring' },
];

const METRIC_BADGE_COLORS = {
  positive: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  rose:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
  neutral:  'bg-slate-700/50 text-slate-300 border-slate-600/30',
  primary:  'bg-primary-500/15 text-primary-400 border-primary-500/30',
};

function MetricWidgetsGroup({
  metricStyle = 'vision',
  cols = 12,
  height = 'normal',
  totalDev = 0,
  onlineDev = 0,
  totalPoints = 0,
  activeEndpoints = 0,
  totalEndpoints = 0,
  loading = false,
}) {
  const isHalf = cols <= 6;
  const gridColsClass = isHalf ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4';

  const cardMinH =
    height === 'compact'
      ? 'min-h-[130px]'
      : height === 'tall'
      ? 'min-h-[195px]'
      : 'min-h-[160px]';

  const stripMinH =
    height === 'compact'
      ? 'min-h-[110px]'
      : height === 'tall'
      ? 'min-h-[175px]'
      : 'min-h-[135px]';

  const metricItems = [
    {
      key: 'devices',
      label: 'Total Devices',
      value: `${totalDev} Unit`,
      subLabel: `${onlineDev}/${totalDev} aktif`,
      pct: totalDev > 0 ? Math.round((onlineDev / totalDev) * 100) : 0,
      badgeText: totalDev > 0 ? `${onlineDev}/${totalDev} Aktif` : '0 Terdaftar',
      badgeVariant: onlineDev > 0 ? 'positive' : 'neutral',
      badgeIcon: CheckCircle2,
      icon: Cpu,
      accentBg: 'bg-primary-500/15 text-primary-400 border-primary-500/25',
      leftBorder: 'border-l-primary-500',
      barColor: 'from-primary-500 to-primary-400',
      ringStroke: 'rgb(var(--primary-400))',
      iconColor: 'text-primary-400',
      shortDesc: 'Node terdaftar',
      footerWidget: <DeviceProgressBar online={onlineDev} total={totalDev} />,
    },
    {
      key: 'online',
      label: 'Online Now',
      value: `${onlineDev} Aktif`,
      subLabel: onlineDev > 0 ? 'MQTT Live' : 'Standby',
      pct: totalDev > 0 ? Math.round((onlineDev / totalDev) * 100) : 0,
      badgeText:
        totalDev === 0
          ? 'Standby'
          : onlineDev === 0
          ? 'Semua Offline'
          : onlineDev === totalDev
          ? '100% Online'
          : `${Math.round((onlineDev / totalDev) * 100)}% Online`,
      badgeVariant:
        totalDev === 0
          ? 'neutral'
          : onlineDev === 0
          ? 'rose'
          : onlineDev === totalDev
          ? 'positive'
          : 'warning',
      badgeIcon: Wifi,
      icon: Wifi,
      accentBg: onlineDev > 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border-rose-500/25',
      leftBorder: onlineDev > 0 ? 'border-l-emerald-400' : 'border-l-rose-400',
      barColor: onlineDev > 0 ? 'from-emerald-500 to-teal-400' : 'from-rose-500 to-rose-400',
      ringStroke: onlineDev > 0 ? '#10b981' : '#f43f5e',
      iconColor: onlineDev > 0 ? 'text-emerald-400' : 'text-rose-400',
      shortDesc: onlineDev > 0 ? 'Broker terhubung' : 'Node offline',
      footerWidget: <SignalPulseWave isOnline={onlineDev > 0} latency="24ms" />,
    },
    {
      key: 'points',
      label: 'Data Points',
      value: totalPoints.toLocaleString(),
      subLabel: 'Throughput real-time',
      pct: totalPoints > 0 ? 78 : 0,
      badgeText: '+1.2k / jam',
      badgeVariant: 'positive',
      badgeIcon: TrendingUp,
      icon: Database,
      accentBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      leftBorder: 'border-l-cyan-400',
      barColor: 'from-cyan-500 to-sky-400',
      ringStroke: '#06b6d4',
      iconColor: 'text-cyan-400',
      shortDesc: 'Payload sensor',
      footerWidget: <MiniSparkline label="Throughput Sensor Real-Time" />,
    },
    {
      key: 'endpoints',
      label: 'Active Endpoints',
      value: `${activeEndpoints} / ${totalEndpoints}`,
      subLabel: 'MQTT → Webhook',
      pct: totalEndpoints > 0 ? Math.round((activeEndpoints / totalEndpoints) * 100) : 0,
      badgeText:
        totalEndpoints === 0
          ? '0 Endpoint'
          : activeEndpoints === totalEndpoints
          ? '100% Synced'
          : `${activeEndpoints} Synced`,
      badgeVariant:
        totalEndpoints === 0
          ? 'neutral'
          : activeEndpoints === totalEndpoints
          ? 'positive'
          : 'warning',
      badgeIcon: Webhook,
      icon: Webhook,
      accentBg: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
      leftBorder: 'border-l-amber-400',
      barColor: 'from-amber-500 to-orange-400',
      ringStroke: '#f59e0b',
      iconColor: 'text-amber-400',
      shortDesc: 'Integrasi relay',
      footerWidget: <EndpointPipeline active={activeEndpoints} total={totalEndpoints} />,
    },
  ];

  // Style 3: Unified Strip (Vercel-inspired horizontal analytics strip)
  if (metricStyle === 'strip') {
    return (
      <div className={`vision-card relative overflow-hidden w-full min-w-0 max-w-full ${stripMinH}`}>
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent pointer-events-none" />
        <div
          className={`grid grid-cols-1 ${
            isHalf
              ? 'sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x'
              : 'sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 xl:divide-x'
          } divide-slate-700/40 h-full`}
        >
          {metricItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="p-4 sm:p-5 flex flex-col justify-between gap-3 hover:bg-primary-500/[0.04] transition-colors min-w-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${item.accentBg}`}>
                      <Icon size={13} />
                    </span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      METRIC_BADGE_COLORS[item.badgeVariant] || METRIC_BADGE_COLORS.neutral
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  {loading ? (
                    <div className="h-7 w-24 rounded-lg bg-slate-800 animate-pulse" />
                  ) : (
                    <h3 className="text-2xl sm:text-[26px] font-black text-slate-100 tracking-tight leading-none truncate">
                      {item.value}
                    </h3>
                  )}
                  <span className="text-[10px] font-medium text-slate-400 truncate">{item.subLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Style 2: Bento Minimalist
  if (metricStyle === 'bento') {
    return (
      <div className={`grid grid-cols-1 ${gridColsClass} gap-3.5 sm:gap-5 w-full min-w-0 max-w-full`}>
        {metricItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`vision-card p-4 sm:p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-500/35 flex flex-col justify-between w-full min-w-0 max-w-full border-l-2 ${item.leftBorder} ${cardMinH}`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.accentBg}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-100 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{item.shortDesc}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                    METRIC_BADGE_COLORS[item.badgeVariant] || METRIC_BADGE_COLORS.neutral
                  }`}
                >
                  {item.badgeText}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-end justify-between gap-3">
                <div>
                  {loading ? (
                    <div className="h-7 w-24 rounded-lg bg-slate-800 animate-pulse" />
                  ) : (
                    <h3 className="text-2xl sm:text-[26px] font-black text-slate-100 tracking-tight leading-none">
                      {item.value}
                    </h3>
                  )}
                </div>
                <div className="w-20 shrink-0 text-right space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400">{item.pct}%</span>
                  <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.barColor} transition-all duration-500`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Style 4: Radial Progress Rings
  if (metricStyle === 'ring') {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className={`grid grid-cols-1 ${gridColsClass} gap-3.5 sm:gap-5 w-full min-w-0 max-w-full`}>
        {metricItems.map((item) => {
          const Icon = item.icon;
          const dashOffset =
            circumference - (Math.min(100, Math.max(0, item.pct)) / 100) * circumference;

          return (
            <div
              key={item.key}
              className={`vision-card p-4 sm:p-5 relative overflow-hidden group transition-all duration-300 hover:border-primary-500/35 flex items-center justify-between gap-3 w-full min-w-0 max-w-full ${cardMinH}`}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                  {item.label}
                </p>
                {loading ? (
                  <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
                ) : (
                  <h3 className="text-2xl sm:text-[28px] font-black text-slate-100 tracking-tight leading-none">
                    {item.value}
                  </h3>
                )}
                <div className="pt-0.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      METRIC_BADGE_COLORS[item.badgeVariant] || METRIC_BADGE_COLORS.neutral
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>
              </div>

              {/* Circular SVG Gauge Ring */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4.5"
                    className="text-slate-700/40"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    fill="none"
                    stroke={item.ringStroke}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center ${item.iconColor}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Style 1 (Default): Classic Vision Stat Cards
  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-3.5 sm:gap-5 w-full min-w-0 max-w-full`}>
      {metricItems.map((item) => (
        <VisionStatCard
          key={item.key}
          label={item.label}
          value={item.value}
          badgeText={item.badgeText}
          badgeVariant={item.badgeVariant}
          badgeIcon={item.badgeIcon}
          icon={item.icon}
          loading={loading}
          className={cardMinH}
          footerWidget={item.footerWidget}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   2. Multi-Style Interactive Hero Artwork for Videa Link IoT Platform
      Styles: 'iot-core' | 'smart-home' | 'orbital' | 'aurora'
───────────────────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────────────
   Isolated Real-Time Clock Component (Zero Full-Dashboard Re-render Lag)
───────────────────────────────────────────────────────────────────────── */
const HeroLiveClock = memo(function HeroLiveClock({ userTz }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeParts = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: userTz || 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(now);
    } catch {
      return [];
    }
  }, [now, userTz]);

  const hourStr = timeParts.find((p) => p.type === 'hour')?.value || '00';
  const minStr  = timeParts.find((p) => p.type === 'minute')?.value || '00';
  const secStr  = timeParts.find((p) => p.type === 'second')?.value || '00';

  const dateStr = useMemo(() => {
    try {
      return now.toLocaleDateString('id-ID', {
        timeZone: userTz || 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [now, userTz]);

  const dayStr = useMemo(() => {
    try {
      return now.toLocaleDateString('id-ID', {
        timeZone: userTz || 'Asia/Jakarta',
        weekday: 'long',
      });
    } catch {
      return '';
    }
  }, [now, userTz]);

  return (
    <div className="select-none text-left sm:text-right flex-shrink-0">
      <div className="inline-flex items-baseline gap-1.5">
        <span className="text-[26px] sm:text-[34px] font-black text-slate-100 tracking-tight leading-none drop-shadow-sm font-mono">
          {hourStr}:{minStr}
        </span>
        <span className="text-[12px] sm:text-[13px] font-extrabold text-primary-400 tracking-tight leading-none font-mono">
          {secStr}
        </span>
      </div>
      <p className="text-[10px] sm:text-[11px] font-bold text-slate-300 mt-1">
        {dayStr}, {dateStr}
      </p>
    </div>
  );
});

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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
            className="w-[140px] sm:w-[210px] md:w-[245px] h-auto animate-float opacity-35 sm:opacity-85"
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
  { id: 'hero', title: 'Welcome Hero Banner', cols: 12, height: 'normal', visible: true },
  { id: 'devices_table', title: 'Connected IoT Devices', cols: 8, height: 'normal', visible: true },
  { id: 'recent_activity', title: 'Recent Activity', cols: 4, height: 'normal', visible: true },
  { id: 'switch_living', title: 'Lampu Ruang Tamu', cols: 4, height: 'normal', visible: true },
  { id: 'switch_porch', title: 'Lampu Teras', cols: 4, height: 'normal', visible: true },
  { id: 'thermostat_ac', title: 'Living Room AC', cols: 4, height: 'normal', visible: true },
];

const REMOVED_LEGACY_WIDGET_IDS = new Set([
  'health',
  'tracking',
  'telemetry_chart',
  'infrastructure_chart',
  'quick_controls',
]);

const STANDARD_ALLOWED_COLS = [3, 4, 6, 8, 9, 12];

const ALLOWED_COLS = {
  metrik: [6, 8, 12],
  hero: [3, 4, 6, 8, 9, 12],
  devices_table: [3, 4, 6, 8, 9, 12],
  recent_activity: [3, 4, 6, 8, 9, 12],
  switch_living: [3, 4, 6, 8, 9, 12],
  switch_porch: [3, 4, 6, 8, 9, 12],
  thermostat_ac: [3, 4, 6, 8, 9, 12],
};

const COL_SPAN_CLASSES = {
  3: 'col-span-1 md:col-span-3 lg:col-span-3',
  4: 'col-span-1 md:col-span-3 lg:col-span-4',
  5: 'col-span-1 md:col-span-3 lg:col-span-5',
  6: 'col-span-1 md:col-span-3 lg:col-span-6',
  7: 'col-span-1 md:col-span-6 lg:col-span-7',
  8: 'col-span-1 md:col-span-6 lg:col-span-8',
  9: 'col-span-1 md:col-span-6 lg:col-span-9',
  12: 'col-span-1 md:col-span-6 lg:col-span-12',
};

const COL_LABELS = {
  3: '1/4',
  4: '1/3',
  5: '5/12',
  6: '1/2',
  7: '7/12',
  8: '2/3',
  9: '3/4',
  12: 'Full',
};

const HEIGHT_LABELS = {
  compact: 'Compact',
  normal: 'Normal',
  tall: 'Tall',
};

const DEFAULT_STYLES = {
  heroStyle: 'iot-core',
  metricStyle: 'vision',
  telemetryMode: 'smooth',
  barMode: 'rounded',
  healthGaugeMode: 'notches',
  safetyGaugeMode: 'solid',
};

function computeDashboardResize(mode, dx, dy, startCols, startHeight, allowedCols) {
  const allowed = allowedCols && allowedCols.length > 0 ? allowedCols : STANDARD_ALLOWED_COLS;
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
        <div className="vision-card p-4 sm:p-6 flex flex-col items-center justify-center text-center min-h-[220px] border border-rose-500/30 bg-rose-500/5 w-full min-w-0 max-w-full overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5">
            <AlertCircle size={20} />
          </div>
          <h4 className="text-sm font-bold text-slate-100 mb-1">Gagal Menampilkan Card</h4>
          <p className="text-xs text-slate-400 max-w-xs mb-2">
            Terjadi kendala saat merender komponen telemetri ini.
          </p>
          {this.state.error && (
            <div className="text-[11px] font-mono text-rose-300 max-w-md bg-rose-950/60 p-2.5 rounded-xl mb-3 border border-rose-800/80 text-left overflow-x-auto w-full">
              <p className="font-bold text-rose-200">{this.state.error?.name}: {this.state.error?.message}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
            {this.props.onRemove && (
              <button
                type="button"
                onClick={this.props.onRemove}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer"
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

function RoomDashboardCardContent({ widget, devices = [], rooms = [] }) {
  const cleanRoomName = useMemo(() => {
    let name = widget.roomName;
    if (!name || name.includes('undefined') || name.includes('null')) {
      if (widget.title && !widget.title.includes('undefined') && !widget.title.includes('null')) {
        name = widget.title.replace(/^Ruangan:\s*/i, '').trim();
      }
    }
    if (!name || name.includes('undefined') || name.includes('null')) {
      const found = (rooms || []).find((r) => String(r.id) === String(widget.roomId));
      if (found?.name) name = found.name;
    }
    return name || 'Ruang Tamu';
  }, [widget.roomName, widget.title, widget.roomId, rooms]);

  const roomDevices = useMemo(
    () => (devices || []).filter((d) => Number(d.room_id) === Number(widget.roomId)),
    [devices, widget.roomId]
  );

  const onlineCount = useMemo(
    () => roomDevices.filter((d) => d.status === 'online').length,
    [roomDevices]
  );

  const cardHeightClass =
    widget.height === 'compact'
      ? 'h-[240px] min-h-[240px]'
      : widget.height === 'tall'
      ? 'h-[420px] min-h-[420px]'
      : 'h-[320px] min-h-[320px]';

  return (
    <div
      className={`vision-card p-4 sm:p-6 relative group flex flex-col justify-between transition-all duration-300 ease-out overflow-hidden min-w-0 max-w-full ${cardHeightClass}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Home size={11} /> Ruangan 3D
            </span>
          </div>
          <h4 className="text-[17px] font-black text-slate-100 leading-tight truncate tracking-tight" title={cleanRoomName}>
            {cleanRoomName}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
            <span className="font-mono font-bold text-amber-400">{roomDevices.length} Perangkat</span>
            <span className="text-slate-600">•</span>
            <span className={`font-mono font-bold ${onlineCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {onlineCount} Aktif
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/app/rooms"
            className="p-2 rounded-xl border bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border-slate-700/60 transition-all cursor-pointer"
            title="Kelola Ruangan di Manajemen Ruangan"
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Body: Dedicated 3D Floor Plan */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col justify-between mt-3">
        <div className="w-full h-full rounded-2xl overflow-hidden relative bg-slate-950">
          <FloorPlan
            hideHeader={true}
            isWidget={true}
            roomId={widget.roomId}
            roomName={cleanRoomName}
            initialDevices={roomDevices}
          />
        </div>
      </div>
    </div>
  );
}

function loadDashboardWidgets() {
  try {
    const parsed = getUserJsonPref(PREF_KEYS.LAYOUT, []);
    const merged = [];

    if (Array.isArray(parsed) && parsed.length > 0) {
      for (const w of parsed) {
        if (!w || REMOVED_LEGACY_WIDGET_IDS.has(w.id)) continue;

        const def = DEFAULT_DASHBOARD_WIDGETS.find((d) => d.id === w.id);
        if (def) {
          // Migrate legacy 5/12 or 7/12 widths to clean 12-col multiples so no awkward gaps remain
          let cleanCols = w.cols || def.cols;
          if (w.id === 'hero' && (cleanCols === 5 || cleanCols === 7)) {
            cleanCols = 12;
          } else if (cleanCols === 5) {
            cleanCols = 6;
          } else if (cleanCols === 7) {
            cleanCols = 8;
          }
          merged.push({
            ...def,
            ...w,
            cols: cleanCols,
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
        } else if (w.type === 'room_widget') {
          let safeName = w.roomName;
          if (!safeName || safeName.includes('undefined') || safeName.includes('null')) {
            if (w.title && !w.title.includes('undefined') && !w.title.includes('null')) {
              safeName = w.title.replace(/^Ruangan:\s*/i, '').trim();
            }
          }
          if (!safeName || safeName.includes('undefined')) {
            safeName = 'Ruangan 3D';
          }
          merged.push({
            ...w,
            roomName: safeName,
            title: safeName,
            cols: w.cols || 6,
            height: w.height || 'normal',
            visible: w.visible !== false,
          });
        }
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
    const base = getUserJsonPref(PREF_KEYS.STYLES, {}) || {};
    return {
      ...DEFAULT_STYLES,
      ...base,
      heroStyle: base.heroStyle || DEFAULT_STYLES.heroStyle,
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
  allowedCols = STANDARD_ALLOWED_COLS,
  styleOptions = null,
  activeStyle = null,
  onChangeStyle = null,
  onResize,
  onMoveOrder,
  onToggleVisibility,
  editMode,
  children,
}) {
  const [resizing, setResizing] = useState(false);
  const [ghostSize, setGhostSize] = useState(null);
  const startDragRef = useRef(null);
  const cardRef = useRef(null);

  const cleanTitle = useMemo(() => {
    let t = title || 'Widget';
    if (t.includes('undefined') || t.includes('null')) {
      return 'Ruangan 3D';
    }
    if (t.startsWith('Ruangan: ')) {
      return t.replace(/^Ruangan:\s*/i, '');
    }
    return t;
  }, [title]);

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

  const colClass = COL_SPAN_CLASSES[cols] || 'col-span-1 md:col-span-6 lg:col-span-12';

  return (
    <div
      ref={setCombinedRef}
      style={style}
      className={`${colClass} relative transition-all duration-200 min-w-0 max-w-full w-full ${
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
        <div className="flex flex-col gap-1.5 px-3 py-2 mb-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl shadow-xl animate-fade-in text-xs select-none w-full min-w-0">
          {/* Top Row: Drag Handle, Quick Position Arrows, Label, and Hide Action */}
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <button
                type="button"
                {...attributes}
                {...listeners}
                className="p-1 rounded-lg text-slate-400 hover:text-primary-400 hover:bg-slate-800 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                title="Tahan & geser untuk memindahkan posisi card ke mana saja"
              >
                <GripVertical size={14} />
              </button>
              {onMoveOrder && (
                <div className="flex items-center bg-slate-950/70 rounded-lg border border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMoveOrder(id, -1)}
                    className="p-1 text-slate-400 hover:text-primary-400 hover:bg-slate-800 rounded-l-lg transition-colors cursor-pointer"
                    title="Geser posisi ke kiri / atas"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveOrder(id, 1)}
                    className="p-1 text-slate-400 hover:text-primary-400 hover:bg-slate-800 rounded-r-lg transition-colors cursor-pointer"
                    title="Geser posisi ke kanan / bawah"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
              {id?.startsWith('room_widget_') && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                  Ruangan
                </span>
              )}
              <span className="font-extrabold text-slate-200 truncate text-[11px] tracking-wide ml-0.5">
                {cleanTitle}
              </span>
            </div>

            {/* Quick Hide Action (Always pinned at top-right corner) */}
            <button
              type="button"
              onClick={() => onToggleVisibility(id, false)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Sembunyikan / lepas card ini dari dashboard"
            >
              <EyeOff size={14} />
            </button>
          </div>

          {/* Bottom Row: Width Pills & Height Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full min-w-0 pt-0.5">
            {/* Width pills */}
            {allowedCols && allowedCols.length > 1 && (
              <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800 shrink-0 overflow-x-auto no-scrollbar max-w-full">
                {allowedCols.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onResize(id, { cols: c })}
                    className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
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
            <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: 'compact', label: 'Cmp' },
                { id: 'normal',  label: 'Norm' },
                { id: 'tall',    label: 'Tall' },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onResize(id, { height: h.id })}
                  className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
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

            {/* Design Style Switcher Pills (if supported by widget) */}
            {styleOptions && styleOptions.length > 0 && onChangeStyle && (
              <div className="flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-xl border border-slate-800 shrink-0 overflow-x-auto no-scrollbar max-w-full">
                <span className="pl-1.5 pr-0.5 text-emerald-400 flex items-center shrink-0" title="Pilih Desain Widget">
                  <Palette size={11} />
                </span>
                {styleOptions.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onChangeStyle(st.id)}
                    className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeStyle === st.id
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-[0_2px_8px_rgba(16,185,129,0.4)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                    title={`Ganti desain: ${st.label}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Content Wrapper */}
      <div className={`w-full h-full relative min-w-0 max-w-full ${resizing ? 'pointer-events-none select-none' : ''}`}>
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

  const [userTz, setUserTz]           = useState(getUserTz);
  const [stats, setStats]             = useState(null);
  const [activity, setActivity]       = useState([]);
  const [recentDevices, setRecentDev] = useState([]);
  const [rooms, setRooms]             = useState([]);
  const [loading, setLoading]         = useState(true);

  // Customization & Edit Mode State (Hydrated & isolated per active user)
  const [editMode, setEditMode]                 = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useState(() => {
    const u = getStoredUser();
    if (u?.id) hydratePrefsFromUser(u);
    return loadDashboardWidgets();
  });
  const [dashboardStyles, setDashboardStyles]   = useState(loadDashboardStyles);

  // Right Sidebar: Widget Catalog State (Only opened inside Kustomisasi Dashboard)
  const [bucketSidebarOpen, setBucketSidebarOpen] = useState(false);

  const getPinnedCatalogCount = () => {
    const bList = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
    const rList = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
    return (Array.isArray(bList) ? bList.length : 0) + (Array.isArray(rList) ? rList.length : 0);
  };

  const [pinnedCount, setPinnedCount] = useState(getPinnedCatalogCount);

  useEffect(() => {
    const syncCount = () => {
      setPinnedCount(getPinnedCatalogCount());
    };
    const syncRooms = () => {
      syncCount();
      setDashboardWidgets(loadDashboardWidgets());
    };
    const syncAllPrefs = () => {
      syncCount();
      setDashboardWidgets(loadDashboardWidgets());
      setDashboardStyles(loadDashboardStyles());
    };
    window.addEventListener('bucket-widgets-updated', syncCount);
    window.addEventListener('rooms-widgets-updated', syncRooms);
    window.addEventListener('dashboard-prefs-updated', syncAllPrefs);
    window.addEventListener('storage', syncAllPrefs);
    return () => {
      window.removeEventListener('bucket-widgets-updated', syncCount);
      window.removeEventListener('rooms-widgets-updated', syncRooms);
      window.removeEventListener('dashboard-prefs-updated', syncAllPrefs);
      window.removeEventListener('storage', syncAllPrefs);
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
      setUserJsonPref(PREF_KEYS.SIDEBAR_OPEN, next, { syncToServer: false });
      return next;
    });
  };

  // DnD Sensors & Smart Pointer Collision Detection (so differently-sized cards swap effortlessly)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const smartCollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCenter(args);
  }, []);

  const updateDashboardStyle = useCallback((key, value) => {
    setDashboardStyles((prev) => {
      const next = { ...prev, [key]: value };
      setUserJsonPref(PREF_KEYS.STYLES, next);
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
      if (oldIndex === -1 || newIndex === -1) return items;
      const reordered = arrayMove(items, oldIndex, newIndex);
      setUserJsonPref(PREF_KEYS.LAYOUT, reordered);
      return reordered;
    });
  }, []);

  const handleMoveWidgetOrder = useCallback((id, direction) => {
    setDashboardWidgets((items) => {
      const visibleIndices = items
        .map((w, idx) => (w.visible !== false ? idx : -1))
        .filter((idx) => idx !== -1);
      const currentPosInVisible = visibleIndices.findIndex((idx) => items[idx].id === id);
      if (currentPosInVisible === -1) return items;
      const targetPosInVisible = currentPosInVisible + direction;
      if (targetPosInVisible < 0 || targetPosInVisible >= visibleIndices.length) return items;

      const fromIdx = visibleIndices[currentPosInVisible];
      const toIdx = visibleIndices[targetPosInVisible];
      const reordered = arrayMove(items, fromIdx, toIdx);
      setUserJsonPref(PREF_KEYS.LAYOUT, reordered);
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
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
      return updated;
    });
  }, []);

  const handleToggleVisibility = useCallback((id, visible) => {
    setDashboardWidgets((items) => {
      const target = items.find((w) => w.id === id);
      let updated;
      if ((target?.type === 'bucket_widget' || target?.type === 'room_widget') && !visible) {
        // Lepas dari dashboard utama, tetapi biarkan tetap tersimpan di daftar sematan sidebar
        updated = items.filter((w) => w.id !== id);
      } else {
        updated = items.map((w) => (w.id === id ? { ...w, visible } : w));
      }
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
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

  // Placed Room IDs on the main dashboard
  const placedRoomIds = useMemo(() => {
    const set = new Set();
    for (const w of dashboardWidgets) {
      if (w.type === 'room_widget' && w.visible !== false) {
        if (w.roomId != null) set.add(String(w.roomId));
        set.add(String(w.id));
      }
    }
    return set;
  }, [dashboardWidgets]);

  // Built-in widgets list for the sidebar's "Widget Bawaan" tab
  const builtInWidgets = useMemo(
    () =>
      DEFAULT_DASHBOARD_WIDGETS.map((def) => {
        const found = dashboardWidgets.find((w) => w.id === def.id);
        return found || def;
      }),
    [dashboardWidgets]
  );

  const handlePlaceRoomWidget = useCallback((room) => {
    const rId = String(room?.id ?? room?.roomId ?? 1);
    const cardId = `room_widget_${rId}`;
    const roomTitleName = (room?.name && !room.name.includes('undefined'))
      ? room.name
      : (room?.roomName && !room.roomName.includes('undefined'))
      ? room.roomName
      : 'Ruangan 3D';

    setDashboardWidgets((prev) => {
      if (prev.some((w) => w.id === cardId || (w.type === 'room_widget' && String(w.roomId) === rId))) {
        return prev;
      }
      const newWidget = {
        id: cardId,
        type: 'room_widget',
        roomId: rId,
        roomName: roomTitleName,
        roomIcon: room?.icon || room?.roomIcon || 'home',
        title: roomTitleName,
        cols: 6,
        height: 'normal',
        visible: true,
      };
      const updated = [...prev, newWidget];
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);

      let pinnedList = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      if (!Array.isArray(pinnedList)) pinnedList = [];
      if (!pinnedList.some((r) => String(r.id ?? r) === rId)) {
        pinnedList.push({
          id: rId,
          name: roomTitleName,
          icon: room?.icon || room?.roomIcon || 'home',
          devices_count: room?.devices_count || 0,
        });
        setUserJsonPref(PREF_KEYS.PINNED_ROOMS, pinnedList);
      }
      return updated;
    });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Ruangan "${roomTitleName}" dipasang ke Dashboard!`,
      showConfirmButton: false,
      timer: 1800,
      background: '#0f172a',
      color: '#f8fafc',
    });
  }, []);

  const handleRemoveRoomWidget = useCallback((roomId) => {
    const targetId = String(roomId);
    const cardId = `room_widget_${targetId}`;

    setDashboardWidgets((prev) => {
      const updated = prev.filter(
        (w) => w.id !== cardId && !(w.type === 'room_widget' && String(w.roomId) === targetId)
      );
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
      return updated;
    });
  }, []);

  const handlePlaceBucketWidget = useCallback((item) => {
    const cardId = `bucket_widget_${item.id}`;
    setDashboardWidgets((prev) => {
      if (prev.some((w) => w.id === cardId || w.bucketWidgetId === item.id)) {
        return prev;
      }
      const colSpan = item.widget?.type === 'container' || item.widget?.w === '3' ? 12 : item.widget?.w === '2' ? 8 : 4;
      const initialHeight = item.widget?.h === 'tall' ? 'tall' : 'normal';
      const newWidget = {
        id: cardId,
        type: 'bucket_widget',
        bucketWidgetId: item.id,
        bucketId: item.bucketId,
        bucketName: item.bucketName || 'Data Bucket',
        widget: item.widget,
        title: item.widget?.title || `${item.bucketName} - ${item.widget?.field || 'Telemetry'}`,
        cols: colSpan,
        height: initialHeight,
        visible: true,
      };
      const updated = [...prev, newWidget];
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
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
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
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
      const pinned = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
      if (Array.isArray(pinned)) {
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
    const iv = setInterval(fetchDashboardBucketRecords, 8000);
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
      setUserJsonPref(PREF_KEYS.LAYOUT, updated);
      return updated;
    });
  }, []);

  const resetDashboard = useCallback(async () => {
    const res = await Swal.fire({
      title: 'Reset Dashboard?',
      text: 'Layout tata letak, ukuran card, dan preferensi style visual Anda akan dikembalikan ke setelan awal.',
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
      resetUserDashboardPrefs();
      setDashboardWidgets(DEFAULT_DASHBOARD_WIDGETS);
      setDashboardStyles(DEFAULT_STYLES);
      Swal.fire({
        title: 'Tersimpan!',
        text: 'Dashboard Anda telah dikembalikan ke setelan bawaan.',
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
    const h = () => {
      setUserTz(getUserTz());
      try {
        const s = localStorage.getItem('iot_user');
        if (s) {
          const parsed = JSON.parse(s);
          setCurrentUser(parsed);
          hydratePrefsFromUser(parsed);
          setDashboardWidgets(loadDashboardWidgets());
          setDashboardStyles(loadDashboardStyles());
          setPinnedCount(getPinnedCatalogCount());
        }
      } catch {}
    };
    window.addEventListener('user-updated', h);
    return () => window.removeEventListener('user-updated', h);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [sR, aR, dR, rR, bR] = await Promise.all([
          dashboardApi.stats().catch(() => null),
          dashboardApi.activity().catch(() => ({ data: [] })),
          devicesApi.list().catch(() => ({ data: [] })),
          roomsApi.list().catch(() => null),
          bucketsApi.list().catch(() => null),
        ]);
        const devicesList = Array.isArray(dR?.data) ? dR.data : (dR?.data?.data || []);
        const activityList = Array.isArray(aR?.data) ? aR.data : (aR?.data?.data || []);
        const loadedRooms = rR ? (Array.isArray(rR.data) ? rR.data : (rR.data?.data || [])) : [];
        const loadedBuckets = bR ? (Array.isArray(bR.data) ? bR.data : (bR.data?.data || [])) : [];

        setRecentDev(devicesList);
        setActivity(activityList);
        if (rR) setRooms(loadedRooms);
        setStats(
          sR?.data || {
            total_devices: devicesList.length,
            online_devices: devicesList.filter((d) => d.status === 'online').length,
            warning_devices: devicesList.filter((d) => d.status === 'warning').length,
            total_data_points: 0,
            total_buckets: 0,
            active_endpoints: 0,
            total_endpoints: 0,
          }
        );

        // Strict resource ownership guard: keep only room/bucket widgets owned by the logged-in user
        const ownedRoomIds = new Set(loadedRooms.map((r) => String(r.id)));
        const ownedBucketIds = new Set(loadedBuckets.map((b) => String(b.id)));

        if (rR || bR) {
          setDashboardWidgets((prev) => {
            let changed = false;
            const filtered = prev
              .filter((w) => {
                if (w.type === 'room_widget' && rR) {
                  if (!ownedRoomIds.has(String(w.roomId))) {
                    changed = true;
                    return false;
                  }
                }
                if (w.type === 'bucket_widget' && bR) {
                  if (!ownedBucketIds.has(String(w.bucketId))) {
                    changed = true;
                    return false;
                  }
                }
                return true;
              })
              .map((w) => {
                if (w.type === 'room_widget' && rR) {
                  const found = loadedRooms.find((r) => String(r.id) === String(w.roomId));
                  if (found && (w.roomName !== found.name || w.title !== found.name)) {
                    changed = true;
                    return {
                      ...w,
                      roomId: found.id,
                      roomName: found.name,
                      title: found.name,
                    };
                  }
                }
                return w;
              });

            if (changed) {
              setUserJsonPref(PREF_KEYS.LAYOUT, filtered);
              return filtered;
            }
            return prev;
          });

          if (rR) {
            const currentPinnedRooms = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
            if (Array.isArray(currentPinnedRooms) && currentPinnedRooms.length > 0) {
              const validPinnedRooms = currentPinnedRooms.filter((r) =>
                ownedRoomIds.has(String(r.id ?? r.roomId ?? r))
              );
              if (validPinnedRooms.length !== currentPinnedRooms.length) {
                setUserJsonPref(PREF_KEYS.PINNED_ROOMS, validPinnedRooms);
                window.dispatchEvent(new CustomEvent('rooms-widgets-updated'));
              }
            }
          }

          if (bR) {
            const currentPinnedBuckets = getUserJsonPref(PREF_KEYS.PINNED_BUCKETS, []);
            if (Array.isArray(currentPinnedBuckets) && currentPinnedBuckets.length > 0) {
              const validPinnedBuckets = currentPinnedBuckets.filter((p) =>
                ownedBucketIds.has(String(p.bucketId))
              );
              if (validPinnedBuckets.length !== currentPinnedBuckets.length) {
                setUserJsonPref(PREF_KEYS.PINNED_BUCKETS, validPinnedBuckets);
                window.dispatchEvent(new CustomEvent('bucket-widgets-updated'));
              }
            }
          }
        }
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
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

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

  const activityIcons = {
    info:    { Icon: Activity,     color: 'rgb(var(--primary-400))' },
    warning: { Icon: AlertCircle,  color: '#fbbf24' },
    error:   { Icon: XCircle,      color: '#f43f5e' },
    success: { Icon: CheckCircle2, color: '#10b981' },
  };

  const getActivityVisual = (item) => {
    const ev = (item.event || '').toLowerCase();
    if (ev.includes('hapus') || ev.includes('delete')) {
      return { Icon: XCircle, color: '#f43f5e', bg: 'bg-rose-500/15 border-rose-500/30' };
    }
    if (ev.includes('ruangan') || ev.includes('room')) {
      return { Icon: Home, color: '#f59e0b', bg: 'bg-amber-500/15 border-amber-500/30' };
    }
    if (ev.includes('perangkat') || ev.includes('device')) {
      return { Icon: Cpu, color: '#10b981', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    }
    if (ev.includes('bucket') || ev.includes('data')) {
      return { Icon: Database, color: '#38bdf8', bg: 'bg-sky-500/15 border-sky-500/30' };
    }
    if (ev.includes('otomasi') || ev.includes('automation')) {
      return { Icon: Sparkles, color: '#a855f7', bg: 'bg-purple-500/15 border-purple-500/30' };
    }
    if (ev.includes('endpoint') || ev.includes('webhook')) {
      return { Icon: Webhook, color: '#ec4899', bg: 'bg-pink-500/15 border-pink-500/30' };
    }
    if (ev.includes('saklar') || ev.includes('lampu') || ev.includes('kontrol')) {
      return { Icon: Zap, color: '#eab308', bg: 'bg-yellow-500/15 border-yellow-500/30' };
    }
    if (item.type === 'success' || ev.includes('tambah')) {
      return { Icon: CheckCircle2, color: '#10b981', bg: 'bg-emerald-500/15 border-emerald-500/30' };
    }
    if (item.type === 'warning') {
      return { Icon: AlertCircle, color: '#fbbf24', bg: 'bg-amber-500/15 border-amber-500/30' };
    }
    return { Icon: Activity, color: 'rgb(var(--primary-400))', bg: 'bg-primary-500/15 border-primary-500/30' };
  };

  /* ─────────────────────────────────────────────────────────────────────────
     Render Specific Widget Content cleanly
  ───────────────────────────────────────────────────────────────────────── */
  const renderWidgetContent = (widget) => {
    if (widget.type === 'room_widget') {
      return <RoomDashboardCardContent widget={widget} devices={recentDevices} rooms={rooms} />;
    }

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
          className={`vision-card p-4 sm:p-6 relative group flex flex-col justify-between transition-all duration-300 ease-out overflow-hidden min-w-0 max-w-full ${cardHeightClass}`}
        >
          {/* Header (Exactly identical to Data Bucket) */}
          <div className="flex items-start justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="min-w-0">
                <h4 className="text-[15px] font-extrabold text-slate-100 leading-tight truncate">
                  {widget.title || widgetDef.title || `${widget.bucketName} - ${widgetDef.field}`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                  {typeLabel} • <span className="font-mono text-primary-400">
                    {Array.isArray(MULTI_SERIES_TYPES) && MULTI_SERIES_TYPES.includes(widgetDef.type)
                      ? (widgetDef.config?.fields?.length > 0 ? widgetDef.config.fields.join(' + ') : (widgetDef.field !== 'multi' ? widgetDef.field : 'Multi-Series'))
                      : `${widgetDef.field || 'telemetry'}${widgetDef.unit ? ` (${widgetDef.unit})` : ''}`}
                  </span>
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
        return (
          <MetricWidgetsGroup
            metricStyle={dashboardStyles.metricStyle || 'vision'}
            cols={widget.cols}
            height={widget.height || 'normal'}
            totalDev={totalDev}
            onlineDev={onlineDev}
            totalPoints={totalPoints}
            activeEndpoints={activeEndpoints}
            totalEndpoints={totalEndpoints}
            loading={loading}
          />
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
          <div className={`vision-card relative overflow-hidden p-4 sm:p-7 ${heroHeightClass} transition-[height] duration-300 ease-out w-full min-w-0 max-w-full flex flex-col justify-between group`}>
            <HeroArtwork variant={dashboardStyles.heroStyle} />

            {/* Top Row: Left Welcome Identity + Right Bold Android Clock */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="max-w-[280px]">
                <p className="text-[12px] sm:text-[13px] text-slate-400 font-medium">Welcome back,</p>
                <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-100 tracking-tight mt-0.5 mb-1.5 sm:mb-2.5">
                  {currentUser?.name || 'Administrator'}
                </h2>
                <p className="text-[12px] sm:text-[13px] text-slate-300 leading-relaxed">
                  Glad to see you again!
                  <br />
                  Pantau telemetri & kendalikan perangkat IoT Anda secara real-time.
                </p>
              </div>

              <HeroLiveClock userTz={userTz} />
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

      case 'devices_table': {
        const tableLimit =
          widget.height === 'compact' ? 3 : widget.height === 'tall' ? 8 : 5;
        const tableHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        const deviceRows = (recentDevices || []).slice(0, tableLimit).map((dev) => {
          const st = dev.status || 'offline';
          return {
            id: dev.id,
            name: dev.name,
            location: dev.location || 'IoT Node',
            ip: dev.ip || (st === 'online' ? 'MQTT Connected' : '-'),
            protocol: (dev.protocol || 'MQTT').toUpperCase(),
            completion: st === 'online' ? 100 : st === 'warning' ? 60 : 0,
            status: st,
          };
        });
        return (
          <div className={`vision-card p-4 sm:p-6 w-full min-w-0 max-w-full overflow-hidden ${tableHeightClass} transition-[height] duration-300 ease-out flex flex-col justify-between`}>
            <div className="flex items-start justify-between gap-2 mb-4 shrink-0">
              <div className="min-w-0">
                <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-100 leading-tight truncate">Connected IoT Devices</h3>
                <p className="text-[11px] sm:text-[12px] text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                  {onlineDev > 0 ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">
                    <strong className={onlineDev > 0 ? 'text-emerald-400' : 'text-slate-200'}>
                      {onlineDev} perangkat online
                    </strong>{' '}
                    dari {totalDev} terdaftar
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to="/app/devices"
                  className="text-[11px] font-bold text-primary-400 hover:text-primary-300 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors whitespace-nowrap"
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

            {deviceRows.length > 0 ? (
              <div className="overflow-x-auto no-scrollbar -mx-1 px-1 w-full min-w-0 flex-1">
                <table className="w-full text-left border-collapse min-w-[440px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4">PERANGKAT</th>
                      <th className="pb-3 px-4">PROTOKOL</th>
                      <th className="pb-3 px-4">IP ADDRESS</th>
                      <th className="pb-3 pl-4">STATUS & HEALTH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deviceRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-800/35 transition-colors group">
                        <td className="py-3.5 pr-4">
                          <Link
                            to={`/app/devices/${row.id}`}
                            className="flex items-center gap-3"
                          >
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                              style={{
                                background:
                                  row.status === 'offline'
                                    ? 'rgba(100, 116, 139, 0.35)'
                                    : 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
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
                                background:
                                  row.status === 'online'
                                    ? 'rgb(var(--primary-500))'
                                    : row.status === 'warning'
                                    ? '#f59e0b'
                                    : '#f43f5e',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-5 border border-dashed border-slate-700/60 rounded-2xl bg-slate-900/20">
                <div className="w-11 h-11 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center mb-2.5">
                  <Cpu size={20} />
                </div>
                <p className="text-[13px] font-bold text-slate-200">
                  {loading ? 'Memuat daftar perangkat...' : 'Belum ada perangkat IoT terdaftar'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-[290px] mt-1 mb-3 leading-relaxed">
                  Daftarkan perangkat ESP32, NodeMCU, atau gateway Anda untuk memantau status online/offline secara langsung.
                </p>
                {!loading && (
                  <Link
                    to="/app/devices"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-extrabold bg-primary-500 hover:bg-primary-600 text-white shadow-sm shadow-primary-500/25 transition-all"
                  >
                    <Plus size={13} className="stroke-[3]" />
                    <span>Tambah Perangkat</span>
                  </Link>
                )}
              </div>
            )}
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
          <div className={`vision-card p-4 sm:p-6 w-full min-w-0 max-w-full overflow-hidden ${actHeightClass} transition-[height] duration-300 ease-out flex flex-col justify-between`}>
            <div className="mb-4 shrink-0">
              <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-100 leading-tight">Recent Activity</h3>
              <p className="text-[11px] sm:text-[12px] text-slate-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-slate-200">Aktivitas Riil</strong> riwayat aksi & sistem Anda
                </span>
              </p>
            </div>

            {loading ? (
              <div className="space-y-3 flex-1 min-h-0">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center gap-3 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-slate-800 rounded" />
                      <div className="h-2.5 w-1/3 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-3.5 sm:space-y-4 relative overflow-y-auto no-scrollbar flex-1 min-h-0 pr-1">
                {activity.slice(0, actLimit).map((item, idx, arr) => {
                  const visual = getActivityVisual(item);
                  const Icon = visual.Icon;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={item.id || idx} className="flex items-start gap-3.5 relative">
                      {!isLast && (
                        <span className="absolute left-[13px] top-7 bottom-[-14px] w-[2px] bg-slate-800" />
                      )}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10 border ${visual.bg}`}
                        style={{ color: visual.color }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-100 leading-snug truncate" title={item.event}>
                          {item.event}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                          {item.device} • <span className="text-slate-500 font-semibold">{item.time}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-3 vision-inner-box rounded-2xl">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-2 border border-slate-700/60">
                  <Activity size={16} />
                </div>
                <p className="text-[12px] font-extrabold text-slate-200">Belum Ada Aktivitas</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">
                  Aksi saat Anda menambahkan atau mengelola perangkat, ruangan, dan bucket akan otomatis muncul di sini.
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'switch_living': {
        const swHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <SmartSwitchWidget
            title="Lampu Ruang Tamu"
            initialState={true}
            topic="home/living-room/light"
            className={swHeightClass}
          />
        );
      }

      case 'switch_porch': {
        const swHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <SmartSwitchWidget
            title="Lampu Teras"
            initialState={false}
            topic="home/porch/light"
            className={swHeightClass}
          />
        );
      }

      case 'thermostat_ac': {
        const thHeightClass =
          widget.height === 'compact'
            ? 'h-[240px] min-h-[240px]'
            : widget.height === 'tall'
            ? 'h-[420px] min-h-[420px]'
            : 'h-[320px] min-h-[320px]';
        return (
          <ThermostatWidget
            title="Living Room AC"
            initialValue={22}
            min={16}
            max={30}
            className={thHeightClass}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 pb-8 animate-fade-in max-w-[1600px] mx-auto relative w-full min-w-0">
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
                    setUserJsonPref(PREF_KEYS.SIDEBAR_OPEN, false, { syncToServer: false });
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

        {/* ── Hidden Widgets Drawer (Only visible in Edit Mode when there are hidden cards) ── */}
        {editMode && hiddenWidgets.length > 0 && (
          <div className="vision-card p-3.5 border border-primary-500/40 bg-primary-500/[0.04] flex flex-wrap items-center gap-2 animate-fade-in">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <Eye size={13} className="text-slate-400" />
              Card Tersembunyi:
            </span>
            {hiddenWidgets.map((hw) => (
              <button
                key={hw.id}
                type="button"
                onClick={() => handleToggleVisibility(hw.id, true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-primary-300 border border-slate-700 transition-all cursor-pointer"
                title="Klik untuk menampilkan kembali di dashboard"
              >
                <Plus size={12} className="text-emerald-400" />
                <span>{hw.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Dynamic Grid of Dashboard Cards (Sequential Top-to-Bottom Placement) ── */}
        <DndContext
          sensors={sensors}
          collisionDetection={smartCollisionDetection}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start w-full min-w-0">
              {visibleWidgets.map((widget) => (
                <SortableDashboardCard
                  key={widget.id}
                  id={widget.id}
                  title={widget.type === 'room_widget' ? (widget.roomName || widget.title || 'Ruangan 3D') : widget.title}
                  cols={widget.cols}
                  height={widget.height || 'normal'}
                  allowedCols={
                    widget.type === 'bucket_widget' || widget.type === 'room_widget'
                      ? STANDARD_ALLOWED_COLS
                      : (ALLOWED_COLS[widget.id] || STANDARD_ALLOWED_COLS)
                  }
                  styleOptions={
                    widget.id === 'metrik'
                      ? METRIC_DESIGN_STYLES
                      : widget.id === 'hero'
                      ? HERO_ARTWORK_STYLES
                      : null
                  }
                  activeStyle={
                    widget.id === 'metrik'
                      ? (dashboardStyles.metricStyle || 'vision')
                      : widget.id === 'hero'
                      ? (dashboardStyles.heroStyle || 'iot-core')
                      : null
                  }
                  onChangeStyle={
                    widget.id === 'metrik'
                      ? (val) => updateDashboardStyle('metricStyle', val)
                      : widget.id === 'hero'
                      ? (val) => updateDashboardStyle('heroStyle', val)
                      : null
                  }
                  onResize={handleResizeWidget}
                  onMoveOrder={handleMoveWidgetOrder}
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

      {/* ── Floating Right Icon Trigger: ONLY in Edit Mode (Icon Only, No Text) ── */}
      {editMode && !bucketSidebarOpen && (
        <button
          type="button"
          onClick={() => {
            setBucketSidebarOpen(true);
            setUserJsonPref(PREF_KEYS.SIDEBAR_OPEN, true, { syncToServer: false });
          }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 w-11 h-11 flex items-center justify-center rounded-l-2xl bg-slate-900/95 hover:bg-slate-800 border-y border-l border-primary-500/50 shadow-[-4px_4px_25px_rgba(var(--primary-500),0.3)] text-primary-300 hover:text-white transition-all group cursor-pointer backdrop-blur-md"
          title="Buka Katalog Widget"
        >
          <LayoutGrid size={18} className="text-primary-400 group-hover:scale-110 transition-transform" />
          {pinnedCount > 0 && (
            <span className="absolute -top-1.5 left-1.5 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-extrabold bg-primary-500 text-white flex items-center justify-center border border-slate-900">
              {pinnedCount}
            </span>
          )}
        </button>
      )}

      {/* ── Right Sidebar: 2-Tab Widget Catalog (Built-in + Rooms & Data Bucket Widgets) ── */}
      <BucketWidgetsSidebar
        key={currentUser?.id || 'guest'}
        isOpen={bucketSidebarOpen}
        onClose={() => {
          setBucketSidebarOpen(false);
          setUserJsonPref(PREF_KEYS.SIDEBAR_OPEN, false, { syncToServer: false });
        }}
        builtInWidgets={builtInWidgets}
        onToggleBuiltInWidget={handleToggleVisibility}
        placedRoomIds={placedRoomIds}
        onPlaceRoomWidget={handlePlaceRoomWidget}
        onRemoveRoomWidget={handleRemoveRoomWidget}
        placedWidgetIds={placedWidgetIds}
        onAddToDashboard={handlePlaceBucketWidget}
        onRemoveFromDashboard={handleRemoveBucketWidgetFromDashboard}
        dashboardStats={stats}
        recentDevices={recentDevices}
        recentActivity={activity}
        currentUser={currentUser}
      />
    </div>
  );
}
