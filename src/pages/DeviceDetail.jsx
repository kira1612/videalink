import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Cpu, Activity, Settings, Database, Trash2, Edit, CloudUpload, CloudDownload, Globe, Zap, Clock, MapPin } from 'lucide-react';
import { devicesApi } from '../services/api';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/UI/Badge';
import { MultiLineChart } from '../components/Charts/RealtimeChart';

export default function DeviceDetail() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [randomCreds, setRandomCreds] = useState('');
  const [editProtocol, setEditProtocol] = useState('http');
  const navigate = useNavigate();
  const location = useLocation();

  const generateRandomCreds = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
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
    const fetchDevice = async () => {
      try {
        const res = await devicesApi.get(id);
        setDevice(res.data);
      } catch (err) {
        console.error('Error fetching device', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
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
        <Link to="/app/devices" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
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

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-500/5 group-hover:bg-primary-500/10 transition-colors" />
          <CloudUpload size={20} className="absolute right-3 bottom-3 text-primary-500/20" />
          <p className="text-3xl font-light text-primary-400">1.2 MB</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Transmitted Data</p>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          <CloudDownload size={20} className="absolute right-3 bottom-3 text-blue-500/20" />
          <p className="text-3xl font-light text-blue-400">840 KB</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Received Data</p>
        </div>
        <div className="glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
          <Globe size={20} className="absolute right-3 bottom-3 text-indigo-500/20" />
          <p className="text-2xl font-light text-indigo-400 font-mono tracking-tight">{device.ip || '0.0.0.0'}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">IP Address</p>
        </div>
        <div className={`glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden group ${device.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <Zap size={20} className={`absolute right-3 bottom-3 ${device.status === 'online' ? 'text-emerald-500/20' : 'text-rose-500/20'}`} />
          <p className={`text-3xl font-light ${device.status === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {device.status === 'online' ? 'Online' : 'Offline'}
          </p>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Device State</p>
        </div>
      </div>

      {/* Last Connection Banner */}
      <div className="glass-card p-3 flex items-center gap-3 bg-slate-800/40">
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
          <Clock size={18} className="text-slate-400" />
        </div>
        <div>
          <p className="text-lg text-slate-200">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}</p>
          <p className="text-xs text-slate-500">Last connection</p>
        </div>
      </div>

      {/* Live Transmission Chart */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2"><Activity size={18} className="text-primary-400" /> Live Transmission</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-slate-400">Live</span>
          </div>
        </div>
        <div className="h-64 w-full">
          <MultiLineChart 
            title="" 
            series={[{ key: 'tx', label: 'Transmitted', base: 40, variance: 15 }, { key: 'rx', label: 'Received', base: 20, variance: 10 }]} 
          />
        </div>
      </div>

      {/* Device Location Map Placeholder */}
      <div className="glass-card p-0 overflow-hidden relative group">
        <div className="p-4 bg-slate-900/80 backdrop-blur-md absolute top-0 w-full z-10 flex items-center gap-2 border-b border-slate-700/50">
          <MapPin size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-200">Device Location</h3>
        </div>
        <div className="h-64 w-full bg-slate-800 flex items-center justify-center relative overflow-hidden">
          {/* Faux Map Background */}
          <div className="absolute inset-0 bg-grid opacity-20"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-10">
            <div className="w-4 h-4 bg-primary-500 rounded-full shadow-[0_0_15px_rgb(var(--primary-500)/0.8)] animate-pulse"></div>
            <div className="mt-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-700/50 text-xs text-slate-300">
              {device.location || 'Unknown Location'}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Data & Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Daily Data Transmission</h3>
          <div className="h-48 w-full">
            <MultiLineChart 
              title="" 
              series={[{ key: 'data', label: 'Data', base: 100, variance: 50 }]} 
            />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Report for last 30 days</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Total Data</span>
                <span className="text-blue-400 font-medium">1.2 MB</span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-500">Total Connections</span>
                <span className="text-slate-400">142</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[75%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Total Sent</span>
                <span className="text-emerald-400 font-medium">840 KB</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[60%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Total Received</span>
                <span className="text-rose-400 font-medium">360 KB</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 w-[30%] rounded-full"></div>
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
              These statistics represents the total effective payload used in the last 30 days.
            </p>
          </div>
        </div>
      </div>
      
      {/* Connection Instructions */}
      <div className="glass-card p-6 mt-6">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <Settings size={18} className="text-violet-400" /> Connection Instructions
        </h3>
        
        {device.protocol === 'mqtt' ? (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Configure your device to connect to our MQTT broker and publish data to the following topic.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Host</p>
                <p className="text-slate-200 font-mono text-sm">{device.broker_config?.host || 'mqtt.videa-iot.com'}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Port</p>
                <p className="text-slate-200 font-mono text-sm">{device.broker_config?.port || '1883'}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1">Publish Topic</p>
                <p className="text-primary-400 font-mono text-sm break-all">{device.broker_config?.topic || `iot-platform/devices/${device.id}/telemetry`}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 md:col-span-2">
                <p className="text-xs text-slate-500 mb-1">Payload Format (JSON)</p>
                <pre className="text-emerald-400 font-mono text-sm mt-2 p-3 bg-slate-950 rounded-md overflow-x-auto">
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
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">Endpoint URL</p>
              <p className="text-primary-400 font-mono text-sm break-all">http://your-server/api/v1/buckets/[BUCKET_ID]/records</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">cURL Example</p>
              <pre className="text-emerald-400 font-mono text-sm mt-2 p-3 bg-slate-950 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST http://your-server/api/v1/buckets/1/records \\
-H "Content-Type: application/json" \\
-d '{"temperature": 25.4, "humidity": 60}'`}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl my-auto animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Edit Device</h3>
                <p className="text-slate-400 text-sm mt-1">Update device settings</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="edit-device-form" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                
                try {
                  await devicesApi.update(id, {
                    name: data.name || device.name,
                    type: data.type,
                    protocol: editProtocol,
                    broker_config: editProtocol === 'mqtt' ? {
                      host: data.broker_host,
                      port: data.broker_port,
                      topic: data.broker_topic,
                    } : null,
                    credentials: data.credentials,
                    // If we want to capture description or location later
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
              }} className="space-y-8">
                
                {/* Device Configuration */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <Cpu size={16} /> Device Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Type <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <select name="type" className="input-field w-full appearance-none" defaultValue={device.type}>
                        <option value="IOTMP">IOTMP Device (Thinger.io protocol)</option>
                        <option value="MQTT">MQTT Device</option>
                        <option value="HTTP">HTTP Device</option>
                        <option value="ESP32">ESP32</option>
                        <option value="Raspberry Pi 4">Raspberry Pi 4</option>
                        <option value="Arduino Uno">Arduino Uno</option>
                        <option value="ESP8266">ESP8266</option>
                        <option value="NodeMCU">NodeMCU</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Protocol <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <select 
                        name="protocol" 
                        className="input-field w-full appearance-none" 
                        value={editProtocol}
                        onChange={(e) => setEditProtocol(e.target.value)}
                      >
                        <option value="http">HTTP/REST</option>
                        <option value="mqtt">MQTT</option>
                      </select>
                    </div>
                  </div>

                  {editProtocol === 'mqtt' && (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                      <h5 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">MQTT Broker Settings</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">Broker Host</label>
                        <div className="md:col-span-2">
                          <input name="broker_host" type="text" placeholder="e.g. mqtt.example.com" defaultValue={device.broker_config?.host || ''} className="input-field w-full" required={editProtocol === 'mqtt'} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">Broker Port</label>
                        <div className="md:col-span-2">
                          <input name="broker_port" type="number" placeholder="e.g. 1883" defaultValue={device.broker_config?.port || '1883'} className="input-field w-full" required={editProtocol === 'mqtt'} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">MQTT Topic (Optional)</label>
                        <div className="md:col-span-2">
                          <input name="broker_topic" type="text" placeholder="e.g. viki/home/sensor/temp" defaultValue={device.broker_config?.topic || ''} className="input-field w-full" />
                          <p className="text-xs text-slate-500 mt-1">Leave empty to use default topic.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Id <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <input name="id" type="text" placeholder="Enter device identifier" defaultValue={device.id} className="input-field w-full" disabled />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Credentials <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 relative">
                      <input name="credentials" type="text" placeholder="Enter device credentials" className="input-field w-full pr-24" value={randomCreds} onChange={(e) => setRandomCreds(e.target.value)} />
                      <button type="button" onClick={generateRandomCreds} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-colors">
                        Random <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Device Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> Device Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Name <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <input name="name" type="text" placeholder="Optional device name" defaultValue={device.name} className="input-field w-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mt-2">Device Description <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <textarea name="description" placeholder="Optional device description" className="input-field w-full min-h-[80px] resize-y" />
                    </div>
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Advanced Options
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Asset Type <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-slate-900" />
                      <select name="assetType" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Type...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Asset Group <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-slate-900" />
                      <select name="assetGroup" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Group...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Product <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-slate-900" />
                      <select name="product" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Product...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Enabled <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="enabled" className="sr-only peer" defaultChecked={device.status !== 'offline'} />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700/50 flex justify-end gap-3 sticky bottom-0">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-6">Cancel</button>
                  <button type="submit" className="btn-primary px-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Save Changes
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
