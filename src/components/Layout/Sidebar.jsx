import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Database, Webhook, Settings,
  ChevronLeft, ChevronRight, LogOut, Users, Radio,
} from 'lucide-react';
import { authApi } from '../../services/api';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Manage',
    items: [
      { to: '/app/devices',   icon: Cpu,      label: 'Devices' },
      { to: '/app/buckets',   icon: Database,  label: 'Data Buckets' },
      { to: '/app/endpoints', icon: Webhook,   label: 'Endpoints' },
    ],
  },
  {
    label: 'Admin',
    adminOnly: true,
    items: [{ to: '/app/users', icon: Users, label: 'Users', adminOnly: true }],
  },
  {
    label: 'System',
    items: [{ to: '/app/settings', icon: Settings, label: 'Settings' }],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iot_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', role: 'admin' };
  });

  useEffect(() => {
    const h = () => {
      const s = localStorage.getItem('iot_user');
      if (s) setCurrentUser(JSON.parse(s));
    };
    window.addEventListener('user-updated', h);
    return () => window.removeEventListener('user-updated', h);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch (e) {}
    localStorage.removeItem('iot_token');
    localStorage.removeItem('iot_user');
    window.dispatchEvent(new Event('user-updated'));
    navigate('/');
  };

  const visibleGroups = navGroups
    .filter(g => !g.adminOnly || currentUser.role === 'admin')
    .map(g => ({ ...g, items: g.items.filter(i => !i.adminOnly || currentUser.role === 'admin') }))
    .filter(g => g.items.length > 0);

  const userInitials = currentUser.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-slate-950 border-r border-slate-800/70
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
      `}
      style={{ boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}
    >
      {/* ── Logo ── */}
      <div
        className={`
          flex items-center min-h-[60px] flex-shrink-0 border-b border-slate-800/70
          ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}
        `}
      >
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <img src="/videa_link_icon.png" alt="VideaLink Icon" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg
            text-slate-500 hover:text-slate-300 hover:bg-slate-800
            transition-all duration-200
            ${collapsed
              ? 'absolute -right-3 top-[18px] bg-slate-900 border border-slate-700 shadow-md'
              : 'ml-auto'
            }
          `}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
            {!collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600 select-none">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-4 mb-3 h-px bg-slate-800" />
            )}
            <div className="px-2 space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className="block"
                >
                  {({ isActive }) => (
                    <div
                      className={`
                        relative flex items-center rounded-xl cursor-pointer
                        transition-all duration-200 group
                        ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                        ${isActive
                          ? 'bg-primary-500/[0.12] text-primary-400'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                        }
                      `}
                      style={isActive ? { boxShadow: 'inset 0 0 0 1px rgb(var(--primary-500) / 0.18)' } : {}}
                    >
                      {/* Active accent bar */}
                      {isActive && !collapsed && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                          style={{ background: 'rgb(var(--primary-400))' }}
                        />
                      )}

                      <Icon
                        size={17}
                        className="flex-shrink-0 transition-colors"
                        style={isActive ? { color: 'rgb(var(--primary-400))' } : {}}
                      />

                      {!collapsed && (
                        <span
                          className={`text-[13px] font-semibold transition-colors truncate ${
                            isActive ? 'text-primary-300' : ''
                          }`}
                          style={isActive ? { color: 'rgb(var(--primary-300))' } : {}}
                        >
                          {label}
                        </span>
                      )}

                      {/* Collapsed active indicator */}
                      {isActive && collapsed && (
                        <span
                          className="absolute -right-px top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                          style={{ background: 'rgb(var(--primary-400))' }}
                        />
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Status ── */}
      {!collapsed && (
        <div
          className="mx-3 mb-3 px-3 py-2.5 rounded-xl border"
          style={{
            background: 'rgb(var(--primary-500) / 0.08)',
            borderColor: 'rgb(var(--primary-500) / 0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: 'rgb(var(--primary-400))' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'rgb(var(--primary-400))' }} />
            </span>
            <span className="text-[11px] font-bold" style={{ color: 'rgb(var(--primary-300))' }}>
              All systems operational
            </span>
          </div>
        </div>
      )}

      {/* ── User footer ── */}
      <div className={`flex-shrink-0 border-t border-slate-800/70 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div
            className="w-[38px] h-[38px] rounded-[14px] flex items-center justify-center text-white text-[13px] font-bold overflow-hidden cursor-pointer flex-shrink-0"
            title={currentUser.name}
            style={{
              backgroundColor: 'rgb(var(--primary-500))',
              boxShadow: '0 0 0 3px rgb(var(--primary-500) / 0.2)',
            }}
          >
            {currentUser.avatar && !currentUser.avatar.startsWith('#')
              ? <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              : userInitials}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-[38px] h-[38px] rounded-[14px] flex items-center justify-center text-white text-[13px] font-bold overflow-hidden flex-shrink-0"
              style={{
                backgroundColor: 'rgb(var(--primary-500))',
                boxShadow: '0 0 0 3px rgb(var(--primary-500) / 0.2)',
              }}
            >
              {currentUser.avatar && !currentUser.avatar.startsWith('#')
                ? <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                : userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white leading-none truncate">{currentUser.name}</p>
              <p className="text-[12px] text-slate-400 font-medium leading-none truncate mt-1">{currentUser.email || 'Administrator'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 flex-shrink-0"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
