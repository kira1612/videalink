import { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Home, Cpu, Database, Zap, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageMeta = {
  '/app/dashboard':   { title: 'Dashboard',         subtitle: 'Platform overview and live metrics' },
  '/app/devices':     { title: 'Devices',           subtitle: 'Manage your connected IoT devices' },
  '/app/buckets':     { title: 'Data Buckets',      subtitle: 'Time-series data storage and export' },
  '/app/endpoints':   { title: 'Endpoints',         subtitle: 'Actions and integrations management' },
  '/app/rooms':       { title: 'Rooms',             subtitle: 'Smart home rooms and zone management' },
  '/app/automations': { title: 'Automations',       subtitle: 'Automated rules and triggers' },
  '/app/floorplan':   { title: 'Floor Plan',        subtitle: 'Interactive 2D/3D spatial device map' },
  '/app/users':       { title: 'User Management',   subtitle: 'Manage platform accounts and permissions' },
  '/app/billing':     { title: 'Langganan',         subtitle: 'Paket langganan, kuota, dan tagihan' },
  '/app/settings':    { title: 'Settings',          subtitle: 'Account and platform configuration' },
  '/app/guide':       { title: 'Panduan & Docs',    subtitle: 'Dokumentasi teknis, setup broker, bucket, dan firmware' },
};

const mobileNavItems = [
  { to: '/app/dashboard', icon: Home, label: 'Home' },
  { to: '/app/devices', icon: Cpu, label: 'Devices' },
  { to: '/app/buckets', icon: Database, label: 'Buckets' },
  { to: '/app/automations', icon: Zap, label: 'Rules' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const key = Object.keys(pageMeta).find(k => location.pathname.startsWith(k)) || '/app/dashboard';
  const { title, subtitle } = pageMeta[key];
  const isDeviceDetail = location.pathname.startsWith('/app/devices/') && location.pathname !== '/app/devices';
  const isBucketDetail = location.pathname.startsWith('/app/buckets/') && location.pathname !== '/app/buckets';

  const resolvedTitle = isDeviceDetail ? 'Device Detail' : isBucketDetail ? 'Bucket Detail' : title;
  const resolvedSubtitle = isDeviceDetail
    ? 'Real-time device monitoring and control'
    : isBucketDetail
    ? 'Bucket telemetry stream and schema'
    : subtitle;

  return (
    <div className="min-h-[100dvh] flex bg-slate-950 relative overflow-x-hidden transition-colors duration-300">
      {/* ── Ambient Vision UI Theme-Reactive Glow Backdrop ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div
          className="absolute -top-[15%] left-[20%] w-[620px] h-[620px] rounded-full blur-[150px] opacity-25 transition-all duration-500"
          style={{ background: 'radial-gradient(circle, rgb(var(--primary-500)) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[35%] -right-[10%] w-[680px] h-[680px] rounded-full blur-[160px] opacity-20 transition-all duration-500"
          style={{ background: 'radial-gradient(circle, rgb(var(--primary-600)) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[20%] left-[30%] w-[580px] h-[580px] rounded-full blur-[150px] opacity-15 transition-all duration-500"
          style={{ background: 'radial-gradient(circle, rgb(var(--primary-400)) 0%, transparent 70%)' }}
        />
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div
        className={`relative flex-1 flex flex-col min-h-[100dvh] transition-all duration-300 w-full min-w-0 ${
          collapsed ? 'lg:ml-[78px]' : 'lg:ml-[256px]'
        } ml-0`}
      >
        <Navbar
          title={resolvedTitle}
          subtitle={resolvedSubtitle}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 px-3 sm:px-6 pb-24 lg:pb-8 pt-2 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (Thumb-Zone Access) ── */}
      <nav
        aria-label="Navigasi cepat mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur-xl px-2 pt-1.5 shadow-[0_-6px_24px_-8px_rgba(15,23,42,0.18)]"
        style={{
          backgroundColor: 'rgb(var(--surface-900) / 0.94)',
          borderColor: 'rgb(var(--surface-700) / 0.65)',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[46px] rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary-400 bg-primary-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              <Icon size={18} />
              <span className="text-[10px] mt-0.5 leading-none">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka semua menu"
            className="flex flex-col items-center justify-center min-h-[46px] rounded-xl text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            <Menu size={18} />
            <span className="text-[10px] mt-0.5 leading-none">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
