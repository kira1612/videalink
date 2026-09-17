import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Database, Webhook, Wifi, TrendingUp, TrendingDown, ArrowRight,
  Activity, Clock, Zap, Globe, Server, BarChart3,
  CheckCircle2, XCircle, AlertCircle, ArrowUpRight,
} from 'lucide-react';
import { dashboardApi, devicesApi } from '../services/api';
import { RealtimeLineChart, MultiLineChart } from '../components/Charts/RealtimeChart';
import { StatusBadge } from '../components/UI/Badge';
import ThermostatWidget from '../components/Widgets/ThermostatWidget';

/* ─────────────────────────────────────────────────────────────────────────
   Stat Card — uses Tailwind slate for bg/text (light/dark adaptive)
   + CSS var inline only for primary-colored elements
───────────────────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, trend, trendUp = true, variant, loading }) {
  const isPrimary = variant === 'primary';
  const isTinted  = variant === 'tinted';
  const isNeutral = variant === 'neutral';

  /* Primary — fully colored card, uses CSS vars directly */
  if (isPrimary) {
    return (
      <div
        className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default"
        style={{
          background: 'linear-gradient(135deg, rgb(var(--primary-500)) 0%, rgb(var(--primary-700)) 100%)',
          border: '1px solid rgb(var(--primary-400) / 0.35)',
          boxShadow: '0 8px 32px rgb(var(--primary-600) / 0.3)',
        }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/20">
              <Icon size={20} className="text-white" />
            </div>
            {trend !== undefined && !loading && (
              <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-white/15 text-white">
                <TrendingUp size={11} /> {trend}
              </div>
            )}
          </div>
          {loading
            ? <div className="h-10 w-24 rounded-xl animate-pulse mb-2 bg-white/20" />
            : <p className="text-[32px] font-black tracking-tight text-white leading-none mb-2">{value ?? '—'}</p>}
          <p className="text-[13px] font-semibold text-white/75">{label}</p>
          {loading
            ? <div className="h-3.5 w-28 rounded mt-2 animate-pulse bg-white/15" />
            : sub ? <p className="text-[11px] mt-1.5 text-white/50">{sub}</p> : null}
        </div>
      </div>
    );
  }

  /* Tinted — dark bg with primary tint, adaptive */
  if (isTinted) {
    return (
      <div
        className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default bg-slate-900/80 border border-slate-800/60"
        style={{ boxShadow: 'inset 0 0 0 1px rgb(var(--primary-500) / 0.08)' }}
      >
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgb(var(--primary-500) / 0.08)' }}
        />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500) / 0.12)' }}>
              <Icon size={20} style={{ color: 'rgb(var(--primary-400))' }} />
            </div>
            {trend !== undefined && !loading && (
              <div
                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl"
                style={{
                  background: 'rgb(var(--primary-500) / 0.12)',
                  color: 'rgb(var(--primary-300))',
                  border: '1px solid rgb(var(--primary-500) / 0.2)',
                }}
              >
                {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {trend}
              </div>
            )}
          </div>
          {loading
            ? <div className="h-10 w-24 rounded-xl animate-pulse mb-2 bg-slate-700/50" />
            : <p className="text-[32px] font-black tracking-tight text-slate-100 leading-none mb-2">{value ?? '—'}</p>}
          <p className="text-[13px] font-semibold" style={{ color: 'rgb(var(--primary-300) / 0.85)' }}>{label}</p>
          {loading
            ? <div className="h-3.5 w-28 rounded mt-2 animate-pulse bg-slate-700/40" />
            : sub ? <p className="text-[11px] mt-1.5 text-slate-500">{sub}</p> : null}
        </div>
      </div>
    );
  }

  /* Default / Neutral — fully slate-based, perfect light/dark */
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-default ${isNeutral ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900/70 border border-slate-800/70'}`}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isNeutral ? 'bg-slate-800' : 'bg-primary-500/10'}`}>
            <Icon size={20} className={isNeutral ? 'text-slate-500' : 'text-primary-400'} />
          </div>
          {trend !== undefined && !loading && (
            <div className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <TrendingUp size={11} /> {trend}
            </div>
          )}
        </div>
        {loading
          ? <div className="h-10 w-24 rounded-xl animate-pulse mb-2 bg-slate-800" />
          : <p className="text-[32px] font-black tracking-tight text-slate-100 leading-none mb-2">{value ?? '—'}</p>}
        <p className="text-[13px] font-semibold text-slate-400">{label}</p>
        {loading
          ? <div className="h-3.5 w-28 rounded mt-2 animate-pulse bg-slate-800" />
          : sub ? <p className="text-[11px] mt-1.5 text-slate-500">{sub}</p> : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Panel — card wrapper using slate (light/dark adaptive)
───────────────────────────────────────────────────────────────────────── */
function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 bg-slate-900/70 border border-slate-800/70 ${className}`}>
      {children}
    </div>
  );
}

function PanelHeader({ icon: Icon, label, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary-500/10">
          <Icon size={13} className="text-primary-400" />
        </div>
        <span className="text-[13px] font-bold text-slate-200">{label}</span>
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Activity Item
───────────────────────────────────────────────────────────────────────── */
function ActivityItem({ item, isLast }) {
  const cfg = {
    info:    { Icon: Activity,     bg: 'bg-primary-500/10', text: 'text-primary-400' },
    warning: { Icon: AlertCircle,  bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
    error:   { Icon: XCircle,      bg: 'bg-rose-500/10',    text: 'text-rose-400'    },
    success: { Icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  };
  const c = cfg[item.type] || cfg.info;
  return (
    <div className={`flex items-start gap-3 py-2.5 ${!isLast ? 'border-b border-slate-800/60' : ''}`}>
      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
        <c.Icon size={13} className={c.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-300 leading-tight truncate">{item.event}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{item.device}</p>
      </div>
      <span className="text-[10px] text-slate-600 flex-shrink-0 pt-0.5 flex items-center gap-1">
        <Clock size={9} /> {item.time}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Quick Link
───────────────────────────────────────────────────────────────────────── */
function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-800/60 hover:border-primary-500/25 hover:bg-primary-500/[0.06] transition-all duration-200 group"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-500/10">
        <Icon size={15} className="text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-slate-300 group-hover:text-slate-100 transition-colors">{label}</p>
        <p className="text-[11px] text-slate-600 truncate">{desc}</p>
      </div>
      <ArrowUpRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard Page
───────────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const getUserTz = () => {
    try { return JSON.parse(localStorage.getItem('iot_user') || '{}').timezone || Intl.DateTimeFormat().resolvedOptions().timeZone; }
    catch { return 'Asia/Jakarta'; }
  };

  const [time, setTime]               = useState(new Date());
  const [userTz, setUserTz]           = useState(getUserTz);
  const [stats, setStats]             = useState(null);
  const [activity, setActivity]       = useState([]);
  const [recentDevices, setRecentDev] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const t = setInterval(() => { setTime(new Date()); setUserTz(getUserTz()); }, 1000);
    const u = () => setUserTz(getUserTz());
    window.addEventListener('user-updated', u);
    return () => { clearInterval(t); window.removeEventListener('user-updated', u); };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [sR, aR, dR] = await Promise.all([dashboardApi.stats(), dashboardApi.activity(), devicesApi.list()]);
        setStats(sR.data); setActivity(aR.data); setRecentDev(dR.data.slice(0, 5));
      } catch {
        setStats({ total_devices: 0, online_devices: 0, warning_devices: 0, total_data_points: 0, total_buckets: 0, active_endpoints: 0, total_endpoints: 0 });
        setActivity([]); setRecentDev([]);
      } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: userTz });
  const timeStr = time.toLocaleTimeString('id-ID', { timeZone: userTz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="space-y-5 pb-10 animate-fade-in max-w-[1400px]">

      {/* ── HERO HEADER ── */}
      <div className="relative rounded-2xl p-6 overflow-hidden bg-slate-900 border border-slate-800/80">
        {/* Radial accent bg */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: `radial-gradient(ellipse at 0% 60%, rgb(var(--primary-500) / 0.07) 0%, transparent 55%),
                              radial-gradient(ellipse at 95% 5%,  rgb(var(--primary-600) / 0.04) 0%, transparent 45%)`,
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgb(var(--primary-500) / 0.1)',
                  color: 'rgb(var(--primary-400))',
                  border: '1px solid rgb(var(--primary-500) / 0.2)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgb(var(--primary-400))' }} />
                Live
              </span>
              <span className="text-[11px] text-slate-500">IoT Platform</span>
            </div>

            <h1 className="text-2xl font-black text-slate-100 tracking-tight mb-1">Platform Overview</h1>
            <p className="text-[13px] text-slate-500">Realtime metrics and health status for all connected infrastructure.</p>

            {/* Date + clock */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700/60">
                <Clock size={11} /> {dateStr}
              </span>
              <span
                className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgb(var(--primary-500) / 0.1)',
                  color: 'rgb(var(--primary-300))',
                  border: '1px solid rgb(var(--primary-500) / 0.2)',
                }}
              >
                <Activity size={11} className="animate-pulse" /> {timeStr}
              </span>
            </div>
          </div>

          {/* CTA */}
          <Link
            to="/app/devices"
            className="inline-flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-lg self-start sm:self-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
              boxShadow: '0 4px 20px rgb(var(--primary-500) / 0.35)',
            }}
          >
            All Devices <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices"     value={stats?.total_devices}                       sub={`${stats?.online_devices ?? 0} devices online`}  icon={Cpu}      variant="primary" loading={loading} />
        <StatCard label="Online Now"        value={stats?.online_devices}                      sub={`${stats?.warning_devices ?? 0} warnings`}       icon={Wifi}     variant="tinted"  loading={loading} />
        <StatCard label="Data Points"       value={stats?.total_data_points?.toLocaleString()} sub={`${stats?.total_buckets ?? 0} buckets`}          icon={Database} variant="default" trend="+1.2k/hr" loading={loading} />
        <StatCard label="Active Endpoints"  value={stats?.active_endpoints}                    sub={`of ${stats?.total_endpoints ?? 0} total`}       icon={Webhook}  variant="neutral" loading={loading} />
      </div>

      {/* ── CHARTS & WIDGETS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MultiLineChart
            title="Live Sensor Data — ESP32-Sensor-Lab (simulated)"
            series={[
              { key: 'temperature', label: 'Temperature (°C)', base: 28, variance: 3 },
              { key: 'humidity',    label: 'Humidity (%)',      base: 62, variance: 8 },
            ]}
          />
        </div>
        <div className="flex flex-col gap-4">
          <ThermostatWidget title="Living Room AC" initialValue={22} min={16} max={30} />
        </div>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Active Devices */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            icon={Server}
            label="Active Devices"
            action={
              <Link to="/app/devices" className="flex items-center gap-1 text-[11px] font-bold text-primary-400 hover:text-primary-300 transition-colors">
                View all <ArrowRight size={11} />
              </Link>
            }
          />
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl animate-pulse bg-slate-800/70" />)}
            </div>
          ) : recentDevices.length > 0 ? (
            <div className="space-y-1">
              {recentDevices.map(dev => (
                <Link
                  key={dev.id}
                  to={`/app/devices/${dev.id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-500/10 border border-primary-500/10">
                      <Cpu size={15} className="text-primary-400/70" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-300 group-hover:text-slate-100 transition-colors leading-tight">{dev.name}</p>
                      <p className="text-[11px] text-slate-600 leading-tight">{dev.location || 'No location'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-600 font-mono hidden sm:block">{dev.ip}</span>
                    <StatusBadge status={dev.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <Cpu size={32} className="mx-auto mb-2 text-slate-800" />
              <p className="text-[13px] text-slate-600">No devices found</p>
            </div>
          )}
        </Panel>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Activity */}
          <Panel className="flex-1">
            <PanelHeader icon={BarChart3} label="Recent Activity" />
            {loading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-xl animate-pulse bg-slate-800/70" />)}
              </div>
            ) : activity.length > 0 ? (
              activity.slice(0, 5).map((item, i) => (
                <ActivityItem key={item.id} item={item} isLast={i === Math.min(4, activity.length - 1)} />
              ))
            ) : (
              <p className="text-[13px] text-slate-600 py-6 text-center">No recent activity</p>
            )}
          </Panel>

          {/* Quick Access */}
          <Panel>
            <PanelHeader icon={Zap} label="Quick Access" />
            <div className="space-y-1.5">
              <QuickLink to="/app/devices"   icon={Cpu}      label="Devices"      desc="Manage connected hardware" />
              <QuickLink to="/app/buckets"   icon={Database} label="Data Buckets" desc="Browse telemetry data" />
              <QuickLink to="/app/endpoints" icon={Webhook}  label="Endpoints"    desc="Configure webhooks" />
              <QuickLink to="/app/settings"  icon={Globe}    label="Settings"     desc="Platform preferences" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
