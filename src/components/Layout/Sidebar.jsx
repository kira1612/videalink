import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Database, Webhook, Settings,
  ChevronLeft, ChevronRight, LogOut, Users,
  Home, Zap, BookOpen, HelpCircle
} from 'lucide-react';
import { authApi } from '../../services/api';
import Swal from 'sweetalert2';

const navGroups = [
  {
    label: null,
    items: [
      { to: '/app/dashboard',   icon: Home,            label: 'Dashboard' },
      { to: '/app/devices',     icon: Cpu,             label: 'Devices' },
      { to: '/app/buckets',     icon: Database,        label: 'Data Buckets' },
      { to: '/app/endpoints',   icon: Webhook,         label: 'Endpoints' },
      { to: '/app/rooms',       icon: LayoutDashboard, label: 'Rooms' },
      { to: '/app/automations', icon: Zap,             label: 'Automations' },
    ],
  },
  {
    label: 'ACCOUNT PAGES',
    items: [
      { to: '/app/users',    icon: Users,    label: 'Users', adminOnly: true },
      { to: '/app/settings', icon: Settings, label: 'Settings' },
      { to: '/app/guide',    icon: BookOpen, label: 'Panduan IoT' },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iot_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', role: 'admin' };
  });
  const [transparentSidebar, setTransparentSidebar] = useState(() => {
    return localStorage.getItem('iot_transparent_sidebar') !== 'false';
  });

  useEffect(() => {
    const h = () => {
      const s = localStorage.getItem('iot_user');
      if (s) setCurrentUser(JSON.parse(s));
      setTransparentSidebar(localStorage.getItem('iot_transparent_sidebar') !== 'false');
    };
    window.addEventListener('user-updated', h);
    window.addEventListener('theme-updated', h);
    return () => {
      window.removeEventListener('user-updated', h);
      window.removeEventListener('theme-updated', h);
    };
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Keluar dari Videa Link?',
      text: 'Anda harus login kembali untuk mengakses dashboard.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try { await authApi.logout(); } catch (e) {}
      localStorage.removeItem('iot_token');
      localStorage.removeItem('iot_user');
      navigate('/');
      setTimeout(() => window.dispatchEvent(new Event('user-updated')), 10);
    }
  };

  const visibleGroups = navGroups
    .filter(g => !g.adminOnly || currentUser.role === 'admin')
    .map(g => ({ ...g, items: g.items.filter(i => !i.adminOnly || currentUser.role === 'admin') }))
    .filter(g => g.items.length > 0);

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        border-r border-slate-800/60
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[78px]' : 'w-[256px]'}
      `}
      style={{
        background: transparentSidebar
          ? 'linear-gradient(111.84deg, rgb(var(--surface-900) / 0.68) 59.3%, rgb(var(--surface-800) / 0.42) 100%)'
          : 'rgb(var(--surface-900))',
        backdropFilter: transparentSidebar ? 'blur(28px)' : 'none',
        WebkitBackdropFilter: transparentSidebar ? 'blur(28px)' : 'none',
      }}
    >
      {/* ── Brand Header (Vision UI Style, Theme Reactive) ── */}
      <div
        className={`
          flex items-center pt-6 pb-4 flex-shrink-0 relative
          ${collapsed ? 'justify-center px-2' : 'px-6 gap-3'}
        `}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{
            background: 'rgb(var(--primary-500) / 0.15)',
            border: '1px solid rgb(var(--primary-500) / 0.3)',
          }}
        >
          <div
            className="w-5 h-5 transition-colors duration-500"
            style={{
              backgroundColor: 'rgb(var(--primary-400))',
              maskImage: `url('/new_videa_link_icon.png')`,
              WebkitMaskImage: `url('/new_videa_link_icon.png')`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
            }}
            title="Videa Link"
          />
        </div>

        {!collapsed && (
          <span className="text-[13px] font-extrabold tracking-[0.18em] text-slate-100 uppercase select-none truncate">
            VIDEA LINK
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg
            text-slate-400 hover:text-slate-100 hover:bg-slate-800
            transition-all duration-200
            ${collapsed
              ? 'absolute -right-3 top-7 bg-slate-900 border border-slate-700 shadow-md'
              : 'ml-auto'
            }
          `}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Vision UI Fading Gradient Divider */}
      <div
        className="mx-5 mb-3 h-px flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgb(var(--primary-400) / 0.45) 50%, transparent 100%)',
        }}
      />

      {/* ── Navigation ── */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {visibleGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && !collapsed && (
              <p className="px-6 mb-2 mt-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-300 select-none">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-4 my-3 h-px bg-slate-800/80" />
            )}
            <div className="px-3.5 space-y-1">
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
                        relative flex items-center rounded-[15px] cursor-pointer
                        transition-all duration-200 group
                        ${collapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3.5 py-2.5'}
                        ${isActive
                          ? 'bg-slate-800/95 text-slate-100 shadow-lg'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/45'
                        }
                      `}
                      style={
                        isActive
                          ? { border: '1px solid rgb(var(--primary-500) / 0.2)' }
                          : {}
                      }
                    >
                      {/* Vision UI Theme-Reactive Icon Box */}
                      <div
                        className={`
                          w-[30px] h-[30px] rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200
                          ${isActive
                            ? 'text-white'
                            : 'bg-slate-800 group-hover:bg-slate-700'
                          }
                        `}
                        style={
                          isActive
                            ? {
                                background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                                boxShadow: '0 4px 12px rgb(var(--primary-500) / 0.45)',
                              }
                            : {
                                color: 'rgb(var(--primary-400))',
                              }
                        }
                      >
                        <Icon size={15} />
                      </div>

                      {!collapsed && (
                        <span
                          className={`text-[13px] transition-colors truncate ${
                            isActive ? 'font-bold text-slate-100' : 'font-medium text-slate-400 group-hover:text-slate-100'
                          }`}
                        >
                          {label}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Vision UI Bottom "Need help?" Card + Logout (Theme-Reactive) ── */}
      {!collapsed ? (
        <div className="px-4 pb-4 pt-2 flex-shrink-0 space-y-3">
          {/* Need Help Card — Uses Active Theme Primary Gradient */}
          <div
            className="relative rounded-2xl p-4 overflow-hidden border border-white/15"
            style={{
              background: 'linear-gradient(135deg, rgb(var(--primary-500)) 0%, rgb(var(--primary-700)) 55%, rgb(var(--primary-900)) 100%)',
              boxShadow: '0 14px 28px rgb(var(--primary-500) / 0.28)',
            }}
          >
            {/* Decorative wave circles */}
            <div
              className="absolute -top-10 -right-8 w-28 h-28 rounded-full blur-xl pointer-events-none opacity-45"
              style={{ background: 'rgb(var(--primary-300))' }}
            />
            <div
              className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-40"
              style={{ background: 'rgb(var(--primary-400))' }}
            />

            <div className="relative z-10">
              <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mb-3 shadow-md">
                <HelpCircle size={16} style={{ color: 'rgb(var(--primary-600))' }} />
              </div>
              <h4 className="text-[13px] font-extrabold text-white leading-tight">Need help?</h4>
              <p className="text-[11px] text-white/80 mt-0.5 mb-3">Pelajari panduan integrasi IoT</p>
              <Link
                to="/app/guide"
                className="block w-full text-center py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-white transition-all duration-200 hover:brightness-110"
                style={{
                  background: 'rgba(6, 11, 40, 0.72)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                DOCUMENTATION
              </Link>
            </div>
          </div>

          {/* Compact User & Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-800/75 hover:bg-rose-500/15 border border-slate-700/60 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                style={{ background: 'rgb(var(--primary-500))' }}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-[12px] font-semibold text-slate-200 group-hover:text-rose-400 truncate">
                {currentUser.name}
              </span>
            </div>
            <LogOut size={14} className="flex-shrink-0 text-slate-400 group-hover:text-rose-400" />
          </button>
        </div>
      ) : (
        <div className="p-3 flex flex-col items-center gap-2 border-t border-slate-800/60">
          <Link
            to="/app/guide"
            title="Need help? Documentation"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'rgb(var(--primary-500))' }}
          >
            <HelpCircle size={16} />
          </Link>
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  );
}
