import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageMeta = {
  '/app/dashboard': { title: 'Dashboard',         subtitle: 'Platform overview and live metrics' },
  '/app/devices':   { title: 'Devices',            subtitle: 'Manage your connected IoT devices' },
  '/app/buckets':   { title: 'Data Buckets',       subtitle: 'Time-series data storage and export' },
  '/app/endpoints': { title: 'Endpoints',          subtitle: 'Actions and integrations management' },
  '/app/users':     { title: 'User Management',    subtitle: 'Manage platform accounts and permissions' },
  '/app/settings':  { title: 'Settings',           subtitle: 'Account and platform configuration' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const key = Object.keys(pageMeta).find(k => location.pathname.startsWith(k)) || '/app/dashboard';
  const { title, subtitle } = pageMeta[key];
  const isDeviceDetail = location.pathname.startsWith('/app/devices/') && location.pathname !== '/app/devices';

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}
      >
        <Navbar
          title={isDeviceDetail ? 'Device Detail' : title}
          subtitle={isDeviceDetail ? 'Real-time device monitoring and control' : subtitle}
        />
        <main className="flex-1 p-5 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
