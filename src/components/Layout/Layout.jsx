import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
  '/app/settings':    { title: 'Settings',          subtitle: 'Account and platform configuration' },
  '/app/guide':       { title: 'Panduan & Docs',    subtitle: 'Dokumentasi teknis, setup broker, bucket, dan firmware' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
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
    <div className="min-h-screen flex bg-slate-950 relative overflow-x-hidden transition-colors duration-300">
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

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        className={`relative flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-[78px]' : 'ml-[256px]'
        }`}
      >
        <Navbar title={resolvedTitle} subtitle={resolvedSubtitle} />
        <main className="flex-1 px-6 pb-8 pt-2 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
