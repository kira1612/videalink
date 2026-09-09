import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Database, Webhook, Wifi, TrendingUp, ArrowRight, Activity, Clock, AlertTriangle } from 'lucide-react';
import { dashboardApi, devicesApi } from '../services/api';
import { RealtimeLineChart, MultiLineChart } from '../components/Charts/RealtimeChart';
import { StatusBadge } from '../components/UI/Badge';

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="stat-card hover:border-slate-600/50 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-100 mb-1">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function ActivityItem({ item }) {
  const config = {
    info: { dot: 'bg-cyan-400' },
    warning: { dot: 'bg-amber-400' },
    error: { dot: 'bg-rose-400' },
    success: { dot: 'bg-emerald-400' },
  };
  const c = config[item.type] || config.info;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-700/20 px-2 rounded-lg -mx-2 transition-colors">
      <span className={`mt-1.5 flex-shrink-0 block w-2 h-2 rounded-full ${c.dot}`}></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300 truncate">{item.event}</p>
        <p className="text-xs text-slate-500">{item.device}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-600 flex-shrink-0">
        <Clock size={11} />{item.time}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const getUserTz = () => {
    try {
      const u = JSON.parse(localStorage.getItem('iot_user') || '{}');
      return u.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch { return 'Asia/Jakarta'; }
  };

  const [time, setTime] = useState(new Date());
  const [userTz, setUserTz] = useState(getUserTz);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [recentDevices, setRecentDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUserTz(getUserTz()); // pick up any timezone change from Settings
    }, 1000);

    // Listen for user-updated event (Settings save)
    const onUpdate = () => setUserTz(getUserTz());
    window.addEventListener('user-updated', onUpdate);
    
    return () => {
      clearInterval(t);
      window.removeEventListener('user-updated', onUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, devicesRes] = await Promise.all([
          dashboardApi.stats(),
          dashboardApi.activity(),
          devicesApi.list(),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
        // Tampilkan 4 perangkat terbaru (diurutkan dari backend, jadi cukup ambil 4 pertama)
        setRecentDevices(devicesRes.data.slice(0, 4));
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Platform Overview</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: userTz })}
            {' · '}<span className="font-mono text-cyan-400">
              {time.toLocaleTimeString('id-ID', { timeZone: userTz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </p>
        </div>
        <Link to="/app/devices" className="btn-primary flex items-center gap-2 text-sm">
          All Devices <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={stats?.total_devices} sub={`${stats?.online_devices ?? 0} online`} icon={Cpu} color="bg-gradient-to-br from-cyan-500 to-blue-600" />
        <StatCard label="Online" value={stats?.online_devices} sub={`${stats?.warning_devices ?? 0} warning`} icon={Wifi} color="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard label="Data Points" value={stats?.total_data_points?.toLocaleString()} sub={`${stats?.total_buckets ?? 0} buckets`} icon={Database} color="bg-gradient-to-br from-violet-500 to-purple-600" trend="+1.2k/hr" />
        <StatCard label="Endpoints" value={stats?.active_endpoints} sub={`of ${stats?.total_endpoints ?? 0} total`} icon={Webhook} color="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MultiLineChart title="Live Sensor Data — ESP32-Sensor-Lab (simulated)" series={[
            { key: 'temperature', label: 'Temperature (°C)', base: 28, variance: 3 },
            { key: 'humidity', label: 'Humidity (%)', base: 62, variance: 8 },
          ]} />
        </div>
        <RealtimeLineChart title="Power Consumption (W)" color="#f59e0b" unit="W" baseValue={145} variance={20} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity size={15} className="text-cyan-400" /> Active Devices
            </h3>
            <Link to="/app/devices" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-800/50 rounded-lg animate-pulse" />)}</div>
          ) : recentDevices.length > 0 ? (
            <div className="space-y-2">
              {recentDevices.map(device => (
                <Link key={device.id} to={`/app/devices/${device.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-700/40 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Cpu size={14} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">{device.name}</p>
                      <p className="text-xs text-slate-500">{device.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">{device.ip}</span>
                    <StatusBadge status={device.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">No online devices</p>
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-4">
            <Clock size={15} className="text-cyan-400" /> Recent Activity
          </h3>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-800/50 rounded animate-pulse" />)}</div>
          ) : activity.map(item => <ActivityItem key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  );
}
