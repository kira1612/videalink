import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const pageMeta = {
  '/app/dashboard': { title: 'Dashboard', subtitle: 'Platform overview and live metrics' },
  '/app/devices': { title: 'Devices', subtitle: 'Manage your connected IoT devices' },
  '/app/buckets': { title: 'Data Buckets', subtitle: 'Time-series data storage and export' },
  '/app/endpoints': { title: 'Endpoints', subtitle: 'Actions and integrations management' },
  '/app/users': { title: 'User Management', subtitle: 'Manage platform accounts and permissions' },
  '/app/settings': { title: 'Settings', subtitle: 'Account and platform configuration' },
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // Match by prefix for device detail
  const key = Object.keys(pageMeta).find(k => location.pathname.startsWith(k)) || '/app/dashboard';
  const { title, subtitle } = pageMeta[key];

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Navbar
          title={location.pathname.startsWith('/app/devices/') ? 'Device Detail' : title}
          subtitle={location.pathname.startsWith('/app/devices/') ? 'Real-time device monitoring' : subtitle}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
