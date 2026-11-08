import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, Search, RefreshCw, Check, Activity, AlertCircle,
  CheckCircle2, XCircle, Settings, User
} from 'lucide-react';

const mockNotifications = [
  { id: 1, type: 'warning', title: 'Device offline',     body: 'ESP32-Lab-02 has been offline for 5m', time: '5m ago',  read: false },
  { id: 2, type: 'success', title: 'Data synced',        body: 'Bucket "sensors-prod" synced 1.2k rows', time: '18m ago', read: false },
  { id: 3, type: 'info',    title: 'Endpoint triggered', body: 'Webhook /api/alert was triggered',     time: '1h ago',  read: true },
];

const notifType = {
  warning: { Icon: AlertCircle,  bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  success: { Icon: CheckCircle2, bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  info:    { Icon: Activity,     bg: 'bg-primary-500/10', text: 'text-primary-400', dot: 'bg-primary-400' },
  error:   { Icon: XCircle,      bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400'   },
};

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('iot_user');
    return s ? JSON.parse(s) : { name: 'Administrator', email: 'admin@platform.io' };
  });
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifs, setNotifs]           = useState(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing]   = useState(false);
  const notifRef = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const h = () => {
      const s = localStorage.getItem('iot_user');
      if (s) setCurrentUser(JSON.parse(s));
    };
    window.addEventListener('user-updated', h);
    return () => window.removeEventListener('user-updated', h);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [notifOpen]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 600);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes('dev')) navigate('/app/devices');
    else if (q.includes('buck') || q.includes('data')) navigate('/app/buckets');
    else if (q.includes('end') || q.includes('hook')) navigate('/app/endpoints');
    else if (q.includes('room')) navigate('/app/rooms');
    else if (q.includes('auto')) navigate('/app/automations');
    else if (q.includes('set') || q.includes('prof')) navigate('/app/settings');
    else if (q.includes('doc') || q.includes('guide') || q.includes('panduan')) navigate('/app/guide');
  };

  return (
    <header className="sticky top-0 z-30 pt-5 pb-3 px-6 flex items-center justify-between gap-4 bg-slate-950/75 backdrop-blur-xl transition-colors duration-300">
      {/* ── Left: Vision UI Breadcrumb & Page Title ── */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-slate-400 font-normal">Pages</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-100 font-medium truncate">{title}</span>
        </div>
        <h1 className="text-[15px] font-extrabold text-slate-100 tracking-tight mt-0.5 truncate">
          {title}
        </h1>
      </div>

      {/* ── Right: Search Pill + User + Settings + Bell ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Search Input ("Type here...") */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type here..."
            className="w-[190px] lg:w-[220px] pl-9 pr-3.5 py-2 rounded-2xl text-[12px] text-slate-100 placeholder-slate-500 bg-slate-800/90 border border-slate-700/70 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
          />
        </form>

        {/* User / Profile Button */}
        <Link
          to="/app/settings"
          className="flex items-center gap-1.5 text-[12px] font-bold text-slate-300 hover:text-primary-400 transition-colors px-1.5 py-1"
          title="Profile & Account"
        >
          <User size={14} style={{ color: 'rgb(var(--primary-400))' }} />
          <span className="hidden md:inline truncate max-w-[120px]">
            {currentUser?.name || 'Sign In'}
          </span>
        </Link>

        {/* Settings Icon */}
        <Link
          to="/app/settings"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={15} />
        </Link>

        {/* Refresh Icon */}
        <button
          id="navbar-refresh"
          onClick={handleRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
          title="Refresh"
          aria-label="Refresh data"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            id="navbar-notifications"
            onClick={() => setNotifOpen(v => !v)}
            className="relative w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          >
            <Bell size={15} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full ring-[1.5px] ring-slate-950"
                style={{ background: 'rgb(var(--primary-500))' }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-11 w-[310px] rounded-2xl overflow-hidden shadow-2xl vision-card"
              style={{ animation: 'fadeInDown 0.15s ease-out' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Bell size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                  <span className="text-[13px] font-bold text-slate-100">Notifications</span>
                  {unread > 0 && (
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgb(var(--primary-500) / 0.2)', color: 'rgb(var(--primary-300))' }}
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
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors ${n.read ? 'opacity-50' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${t.bg}`}>
                        <t.Icon size={13} className={t.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-200 leading-tight">{n.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                      </div>
                      {!n.read && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${t.dot}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 text-center border-t border-slate-700/50">
                <button
                  onClick={() => setNotifOpen(false)}
                  className="text-[11px] font-semibold"
                  style={{ color: 'rgb(var(--primary-400))' }}
                >
                  Close notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
