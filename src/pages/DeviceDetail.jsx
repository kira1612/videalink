import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Cpu, Activity, Settings, Database, Trash2, Edit, CloudUpload, CloudDownload, Globe, Zap, Clock, MapPin, Shuffle, Check, X } from 'lucide-react';
import { devicesApi, roomsApi } from '../services/api';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/UI/Badge';
import { MultiLineChart } from '../components/Charts/RealtimeChart';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [randomCreds, setRandomCreds] = useState('');
  const [editProtocol, setEditProtocol] = useState('http');
  const navigate = useNavigate();
  const location = useLocation();

  const generateRandomCreds = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRandomCreds(result);
  };

  const handleDelete = async () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this device? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#f8fafc'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await devicesApi.delete(id);
          Swal.fire({
            title: 'Deleted!',
            text: 'Device deleted successfully!',
            icon: 'success',
            background: '#1e293b',
            color: '#f8fafc'
          });
          navigate('/app/devices');
        } catch (err) {
          Swal.fire({
            title: 'Error',
            text: 'Failed to delete device: ' + (err.response?.data?.message || err.message),
            icon: 'error',
            background: '#1e293b',
            color: '#f8fafc'
          });
        }
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchDevice = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await devicesApi.get(id);
        if (isMounted) {
          setDevice(prev => JSON.stringify(prev) === JSON.stringify(res.data) ? prev : res.data);
        }
      } catch (err) {
        console.error('Error fetching device', err);
      } finally {
        if (showLoading && isMounted) setLoading(false);
      }
    };

    fetchDevice(true);
    // Fetch rooms for room dropdown
    roomsApi.list().then(res => {
      if (isMounted) setRooms(res.data || []);
    }).catch(() => {});

    // Poll every 5s to reflect real-time online/offline status automatically
    const interval = setInterval(() => fetchDevice(false), 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (device && location.search.includes('edit=true')) {
      setRandomCreds(device.credentials || '');
      setEditProtocol(device.protocol || 'http');
      setShowEditModal(true);
      navigate(`/app/devices/${id}`, { replace: true });
    }
  }, [device, location.search, navigate, id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading device details...</div>;
  }

  if (!device) {
    return <div className="p-8 text-center text-rose-400">Device not found.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/app/devices" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100">{device.name}</h2>
          </div>
          <p className="text-slate-400 text-sm mt-1">{device.type} · ID: {device.id}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRandomCreds(device.credentials || ''); setEditProtocol(device.protocol || 'http'); setShowEditModal(true); }} className="btn-secondary flex items-center gap-2"><Edit size={14} /> Edit</button>
          <button onClick={handleDelete} className="btn-secondary text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Top Stats Cards — Vision UI Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Transmitted Data</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold text-slate-100 tracking-tight leading-none">
                {device.stats?.tx_formatted || '0 B'}
              </span>
              <span className="text-[11px] font-bold text-primary-400">TX</span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <CloudUpload size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Received Data</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold text-slate-100 tracking-tight leading-none">
                {device.stats?.rx_formatted || '0 B'}
              </span>
              <span className="text-[11px] font-bold text-emerald-400">RX</span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <CloudDownload size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">IP Address</p>
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-extrabold text-slate-100 font-mono tracking-tight leading-none">
                {device.ip || '0.0.0.0'}
              </span>
            </div>
          </div>
          <div className="vision-icon-box w-11 h-11 rounded-xl">
            <Globe size={20} strokeWidth={2.2} />
          </div>
        </div>

        <div className="vision-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-400 mb-1">Device State</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-[22px] font-extrabold tracking-tight leading-none ${device.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {device.status === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase">{device.protocol || 'HTTP'}</span>
            </div>
          </div>
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
            style={{
              background: device.status === 'online'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              boxShadow: device.status === 'online'
                ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                : '0 4px 14px rgba(244, 63, 94, 0.35)',
            }}
          >
            <Zap size={20} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Last Connection Banner */}
      <div className="vision-card p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="vision-inner-box w-11 h-11 rounded-xl flex items-center justify-center text-primary-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-100">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}</p>
            <p className="text-[11px] font-medium text-slate-400">Last telemetry heartbeat received</p>
          </div>
        </div>
        <StatusBadge status={device.status} />
      </div>

      {/* Live Transmission Chart */}
      <div className="vision-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[17px] font-bold text-slate-100 flex items-center gap-2">
              <Activity size={18} className="text-primary-400" /> Live Transmission
            </h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Real-time packet stream (TX / RX)</p>
          </div>
          <div className="vision-inner-box px-3 py-1.5 rounded-xl flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span className="text-xs font-bold text-slate-300">{device.status === 'online' ? 'Live Stream' : 'Idle (Offline)'}</span>
          </div>
        </div>
        <div className="w-full">
          <MultiLineChart 
            title="" 
            height={240}
            series={[{ key: 'tx', label: 'Transmitted (B/s)', base: 45, variance: 15 }, { key: 'rx', label: 'Received (B/s)', base: 20, variance: 8 }]} 
            initialData={device.stats?.history?.length > 0 ? device.stats.history : null}
            isOnline={device.status === 'online'}
          />
        </div>
      </div>

      {/* Device Location Map */}
      <div className="vision-card p-0 overflow-hidden relative group">
        <div className="p-4 bg-slate-900/80 backdrop-blur-md absolute top-0 w-full z-10 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary-400" />
            <h3 className="text-sm font-bold text-slate-100">Device Location & Placement</h3>
          </div>
          <span className="text-xs text-slate-300 font-mono px-3 py-1 rounded-xl vision-inner-box">
            {device.location ? device.location : 'Not Set (Set in Edit)'}
          </span>
        </div>
        <div className="h-56 w-full bg-slate-950/50 flex items-center justify-center relative overflow-hidden">
          {/* Subtle Cyber Grid */}
          <div className="absolute inset-0 bg-grid opacity-25"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-6">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${device.status === 'online' ? 'bg-primary-500 shadow-[0_0_20px_rgb(var(--primary-500)/0.9)] animate-pulse' : 'bg-slate-700'}`}>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
            <div className="mt-3 px-4 py-2 vision-inner-box rounded-xl shadow-lg text-xs font-bold text-slate-100 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {device.location && device.location !== 'N/A' ? device.location : `${device.name} • ${device.ip || 'Local Network'}`}
            </div>
            <span className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {device.location && device.location !== 'N/A' ? 'Configured Location' : 'Default Node Gateway'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Data & Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 vision-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-bold text-slate-100">Daily Data Transmission</h3>
            <span className="text-xs text-primary-400 font-mono font-bold px-2.5 py-1 rounded-lg vision-inner-box">
              Total: {device.stats?.total_records || 0} records
            </span>
          </div>
          <div className="w-full">
            <MultiLineChart 
              title="" 
              height={200}
              series={[{ key: 'data', label: 'Packets / Day', base: 0, variance: 0 }]} 
              initialData={device.stats?.daily_history || []}
              isOnline={device.status === 'online'}
            />
          </div>
        </div>
        <div className="vision-card p-6">
          <h3 className="text-[15px] font-bold text-slate-100 mb-4">Report for last 30 days</h3>
          
          <div className="space-y-4">
            <div className="vision-inner-box p-3.5 rounded-2xl">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400 font-medium">Total Data</span>
                <span className="text-primary-400 font-extrabold">{device.stats?.total_30d_fmt || '0 B'}</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Total Records</span>
                <span className="text-slate-300 font-bold">{device.stats?.records_30d || 0}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, ((device.stats?.records_30d || 0) / 100) * 100))}%` }}></div>
              </div>
            </div>

            <div className="vision-inner-box p-3.5 rounded-2xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-medium">Total Sent</span>
                <span className="text-emerald-400 font-extrabold">{device.stats?.tx_formatted || '0 B'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, ((device.stats?.tx_bytes || 0) / 10000) * 100))}%` }}></div>
              </div>
            </div>

            <div className="vision-inner-box p-3.5 rounded-2xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-medium">Total Received</span>
                <span className="text-rose-400 font-extrabold">{device.stats?.rx_formatted || '0 B'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(10, ((device.stats?.rx_bytes || 0) / 5000) * 100))}%` }}></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1">
              Statistik riil dari database berdasarkan pertukaran data telemetri yang tercatat.
            </p>
          </div>
        </div>
      </div>
      
      {/* Connection Instructions */}
      <div className="vision-card p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="vision-icon-box w-9 h-9 rounded-xl">
            <Settings size={17} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-100">Connection Instructions</h3>
            <p className="text-[12px] text-slate-400">Integration parameters for {device.protocol?.toUpperCase() || 'HTTP'}</p>
          </div>
        </div>
        
        {device.protocol === 'mqtt' ? (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Configure your device to connect to our MQTT broker and publish data to the following topic.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="vision-inner-box p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-semibold mb-1">Host</p>
                <p className="text-slate-100 font-mono text-sm font-bold">{device.broker_config?.host || 'test.mosquitto.org'}</p>
              </div>
              <div className="vision-inner-box p-4 rounded-2xl">
                <p className="text-xs text-slate-400 font-semibold mb-1">Port</p>
                <p className="text-slate-100 font-mono text-sm font-bold">{device.broker_config?.port || '1883'}</p>
              </div>
              <div className="vision-inner-box p-4 rounded-2xl md:col-span-2">
                <p className="text-xs text-slate-400 font-semibold mb-1">Publish Topic</p>
                <p className="text-primary-400 font-mono text-sm break-all font-bold">
                  {device.broker_config?.topic || (device.data_buckets && device.data_buckets[0]?.topic) || `videalink/devices/${(device.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`}
                </p>
                {device.data_buckets && device.data_buckets.length > 0 && device.data_buckets[0]?.topic && device.broker_config?.topic && device.data_buckets[0]?.topic !== device.broker_config?.topic && (
                  <p className="text-[11px] text-amber-400 mt-1 font-mono">
                    Topic Bucket Terhubung: <b>{device.data_buckets[0].topic}</b>
                  </p>
                )}
              </div>
              <div className="vision-inner-box p-4 rounded-2xl md:col-span-2">
                <p className="text-xs text-slate-400 font-semibold mb-1">Payload Format (JSON)</p>
                <pre className="text-emerald-400 font-mono text-sm mt-2 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-x-auto">
{`{
  "temperature": 25.4,
  "humidity": 60
}`}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Send a POST request to the REST API endpoint below to push data from your device.</p>
            <div className="vision-inner-box p-4 rounded-2xl">
              <p className="text-xs text-slate-400 font-semibold mb-1">Endpoint URL</p>
              <p className="text-primary-400 font-mono text-sm break-all font-bold">
                {window.location.origin}/api/v1/devices/{device.id}/telemetry
              </p>
            </div>
            <div className="vision-inner-box p-4 rounded-2xl">
              <p className="text-xs text-slate-400 font-semibold mb-1">cURL Example</p>
              <pre className="text-emerald-400 font-mono text-sm mt-2 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST "${window.location.origin}/api/v1/devices/${device.id}/telemetry" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${device.credentials || 'YOUR_DEVICE_TOKEN'}" \\
  -d '{"temperature": 25.4, "humidity": 60}'`}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-500/10 border border-primary-500/20 text-primary-400">
                  <Settings size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-100">Edit Device Settings</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Update device parameters and credentials</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="edit-device-form" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                const selectedRoom = rooms.find(r => String(r.id) === String(data.room_id));
                
                try {
                  await devicesApi.update(id, {
                    name: data.name?.trim() || device.name,
                    type: data.type,
                    room_id: data.room_id || null,
                    location: selectedRoom?.name || 'Unassigned',
                    protocol: editProtocol,
                    broker_config: editProtocol === 'mqtt' ? {
                      host: data.broker_host || 'test.mosquitto.org',
                      port: parseInt(data.broker_port || 1883, 10),
                      topic: data.broker_topic || `videalink/devices/${(data.name || device.name).toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
                    } : null,
                    credentials: randomCreds?.trim() || device.credentials,
                  });
                  setShowEditModal(false);
                  
                  // Refetch device details
                  const res = await devicesApi.get(id);
                  setDevice(res.data);
                  Swal.fire({
                    title: 'Success',
                    text: 'Device updated successfully!',
                    icon: 'success',
                    background: '#1e293b',
                    color: '#f8fafc'
                  });
                } catch (err) {
                  Swal.fire({
                    title: 'Error',
                    text: err.response?.data?.message || err.message,
                    icon: 'error',
                    background: '#1e293b',
                    color: '#f8fafc'
                  });
                  console.error(err);
                }
              }} className="space-y-6">
                
                {/* Hardware & Identity Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center bg-primary-500/10 text-primary-400">
                      <Cpu size={13} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">Hardware & Identity</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-300">Device Name</label>
                    <input name="name" type="text" placeholder="e.g. ESP32-Lab-01" defaultValue={device.name} className="input-field w-full" required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-300">Hardware Type</label>
                      <select name="type" className="input-field w-full" defaultValue={device.type}>
                        <option value="ESP32">ESP32 (Wi-Fi / BLE)</option>
                        <option value="ESP8266">ESP8266 / NodeMCU</option>
                        <option value="Raspberry Pi 4">Raspberry Pi (Edge Gateway)</option>
                        <option value="Arduino Uno">Arduino / Modbus</option>
                        <option value="Generic IoT">Generic IoT Device</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-300">Room (Ruangan)</label>
                      <select name="room_id" className="input-field w-full" defaultValue={device.room_id || ''}>
                        <option value="">No Room (Unassigned)</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Communication & Protocol Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center bg-primary-500/10 text-primary-400">
                      <Zap size={13} />
                    </div>
                    <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">Communication & Protocol</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-300">Primary Protocol</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['http', 'mqtt'].map(p => (
                        <button key={p} type="button" onClick={() => setEditProtocol(p)}
                          className="py-2.5 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-2"
                          style={editProtocol === p
                            ? { background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', color: 'white', border: 'none', boxShadow: '0 4px 14px rgb(var(--primary-500)/0.35)' }
                            : { background: 'transparent', color: 'rgb(100,116,139)', borderColor: 'rgb(51,65,85)' }
                          }
                        >
                          {editProtocol === p && <Check size={13} />}
                          {p === 'http' ? 'HTTP / REST Ingest' : 'MQTT Broker'}
                        </button>
                      ))}
                    </div>
                    <input type="hidden" name="protocol" value={editProtocol} />
                  </div>

                  {editProtocol === 'mqtt' && (
                    <div className="rounded-xl border border-slate-800 p-4 space-y-3 bg-slate-800/30">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">MQTT Broker Parameters</p>
                        <span className="text-[10px] text-emerald-400 font-mono">Live Sync</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Broker Host</label>
                        <input name="broker_host" type="text" defaultValue={device.broker_config?.host || 'test.mosquitto.org'} className="input-field w-full font-mono text-[12px]" required />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">Port</label>
                          <input name="broker_port" type="number" defaultValue={device.broker_config?.port || 1883} className="input-field w-full font-mono text-[12px]" required />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-400">MQTT Topic (Optional)</label>
                          <input name="broker_topic" type="text" defaultValue={device.broker_config?.topic || ''} placeholder="e.g. videalink/devices/node-01" className="input-field w-full font-mono text-[12px]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <label className="text-[12px] font-bold text-slate-300">Device Access Token (Credentials)</label>
                      <span className="text-[10px] text-slate-500">ID: {device.id}</span>
                    </div>
                    <div className="relative">
                      <input 
                        name="credentials" 
                        type="text" 
                        placeholder="Device credentials" 
                        className="input-field w-full font-mono text-[12px] pr-28" 
                        value={randomCreds} 
                        onChange={(e) => setRandomCreds(e.target.value)} 
                      />
                      <button 
                        type="button" 
                        onClick={generateRandomCreds} 
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      >
                        <Shuffle size={11} /> Generate
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-slate-900/95 py-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-5 py-2.5 text-[13px]">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl transition-all"
                    style={{ 
                      background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', 
                      boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' 
                    }}
                  >
                    <Check size={14} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
