import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Database, Webhook, Settings,
  Wifi, ChevronLeft, ChevronRight, Bell, LogOut,
  Zap, Activity, Menu, X, Users
} from 'lucide-react';
import { authApi } from '../../services/api';
import { VideaLinkLogo } from '../VideaLinkLogo';

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/devices', icon: Cpu, label: 'Devices' },
  { to: '/app/buckets', icon: Database, label: 'Data Buckets' },
  { to: '/app/endpoints', icon: Webhook, label: 'Endpoints' },
  { to: '/app/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iot_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', avatar: 'AD', role: 'admin' };
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const saved = localStorage.getItem('iot_user');
      if (saved) setCurrentUser(JSON.parse(saved));
    };
    window.addEventListener('user-updated', handleUserUpdate);
    return () => window.removeEventListener('user-updated', handleUserUpdate);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const avatar = getInitials(currentUser.name);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {} // ignore errors on logout
    localStorage.removeItem('iot_token');
    localStorage.removeItem('iot_user');
    navigate('/');
  };

  const visibleNavItems = navItems.filter(item => !item.adminOnly || currentUser.role === 'admin');

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-slate-900 border-r border-slate-800
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 min-h-[72px]">
        <VideaLinkLogo size={32} showText={!collapsed} textSize={14} subSize={7} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Main Menu</p>
        )}
        {visibleNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Status indicator */}
      {!collapsed && (
        <div className="px-3 py-2 mx-2 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-emerald-400 font-medium">Platform Online</span>
          </div>
        </div>
      )}

      {/* User info */}
      <div className={`border-t border-slate-800 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {avatar}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email || 'Admin'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
