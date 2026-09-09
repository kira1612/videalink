import { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw } from 'lucide-react';

export default function Navbar({ title, subtitle }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iot_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', email: 'admin' };
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

  return (
    <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search devices..."
            className="bg-slate-800 border border-slate-700 text-slate-300 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 w-52 focus:outline-none focus:border-cyan-500 focus:w-64 transition-all duration-200"
          />
        </div>

        {/* Refresh */}
        <button className="btn-ghost p-2" title="Refresh">
          <RefreshCw size={16} />
        </button>

        {/* Notifications */}
        <button className="btn-ghost p-2 relative" title="Notifications">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700 mx-1"></div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {avatar}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-100">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
