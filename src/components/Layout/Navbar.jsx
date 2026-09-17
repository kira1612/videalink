import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, RefreshCw, Check, Activity, AlertCircle, CheckCircle2, XCircle, Cpu, Database, Webhook, Settings, LayoutDashboard, Users } from 'lucide-react';

const mockNotifications = [
  { id: 1, type: 'warning', title: 'Device offline',   body: 'ESP32-Lab-02 has been offline for 5m', time: '5m ago',  read: false },
  { id: 2, type: 'success', title: 'Data synced',      body: 'Bucket "sensors-prod" synced 1.2k rows',  time: '18m ago', read: false },
  { id: 3, type: 'info',    title: 'Endpoint triggered', body: 'Webhook /api/alert was triggered',     time: '1h ago',  read: true },
];

const notifType = {
  warning: { Icon: AlertCircle,  bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  success: { Icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  info:    { Icon: Activity,     bg: 'bg-primary-500/10', text: 'text-primary-400', dot: 'bg-primary-400' },
  error:   { Icon: XCircle,      bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400'   },
};

const pageIcons = {
  '/app/dashboard': LayoutDashboard,
  '/app/devices':   Cpu,
  '/app/buckets':   Database,
  '/app/endpoints': Webhook,
  '/app/users':     Users,
  '/app/settings':  Settings,
};

export default function Navbar({ title, subtitle }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('iot_user');
    return s ? JSON.parse(s) : { name: 'Admin', email: 'admin@platform.io' };
  });
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifs, setNotifs]           = useState(mockNotifications);
  const [searchFocus, setSearchFocus] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const notifRef = useRef(null);

  const unread = notifs.filter(n => !n.read).length;
  const PageIcon = Object.entries(pageIcons).find(([k]) => location.pathname.startsWith(k))?.[1];

  useEffect(() => {
    const h = () => { const s = localStorage.getItem('iot_user'); if (s) setCurrentUser(JSON.parse(s)); };
    window.addEventListener('user-updated', h);
    return () => window.removeEventListener('user-updated', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    if (notifOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notifOpen]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); window.location.reload(); }, 600);
  };

  const userInitials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-30 h-[60px] flex items-center px-5 gap-4 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/70">
      {/* Top accent line — theme reactive */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, rgb(var(--primary-500) / 0.85) 0%, rgb(var(--primary-400) / 0.35) 40%, transparent 100%)' }}
      />

      {/* ── Page identity ── */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {PageIcon && (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              background: 'rgb(var(--primary-500) / 0.1)',
              borderColor: 'rgb(var(--primary-500) / 0.2)',
            }}
          >
            <PageIcon size={14} style={{ color: 'rgb(var(--primary-400))' }} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[14px] font-extrabold text-slate-100 leading-tight truncate tracking-tight">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-500 leading-tight truncate">{subtitle}</p>}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">

        {/* Refresh */}
        <button
          id="navbar-refresh"
          onClick={handleRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200"
          title="Refresh"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notifications"
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full ring-[1.5px] ring-slate-950"
                style={{ background: 'rgb(var(--primary-400))' }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-11 w-[310px] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800"
              style={{ animation: 'fadeInDown 0.15s ease-out' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                  <span className="text-[13px] font-bold text-slate-200">Notifications</span>
                  {unread > 0 && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgb(var(--primary-500) / 0.15)', color: 'rgb(var(--primary-300))' }}
                    >
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button
                    onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}
                    className="text-[11px] font-semibold flex items-center gap-1"
                    style={{ color: 'rgb(var(--primary-400))' }}
                  >
                    <Check size={11} /> Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-800/60">
                {notifs.map(n => {
                  const t = notifType[n.type] || notifType.info;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setNotifs(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/60 transition-colors ${n.read ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${t.bg}`}>
                        <t.Icon size={13} className={t.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-300 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{n.time}</p>
                      </div>
                      {!n.read && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${t.dot}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 text-center border-t border-slate-800">
                <button className="text-[11px] font-semibold" style={{ color: 'rgb(var(--primary-400))' }}>
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
