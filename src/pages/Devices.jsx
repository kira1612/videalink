import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Cpu, MoreVertical, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { devicesApi } from '../services/api';
import Swal from 'sweetalert2';
import { StatusBadge } from '../components/UI/Badge';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [randomCreds, setRandomCreds] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [addProtocol, setAddProtocol] = useState('http');

  const generateRandomCreds = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRandomCreds(result);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Close dropdown when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await devicesApi.list();
      setDevices(res.data);
    } catch (err) {
      console.error('Error fetching devices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
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
          fetchDevices();
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

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Devices</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your connected IoT devices</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} /> Add Device
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search devices..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 glass-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDevices.map(device => (
            <div key={device.id} className="glass-card p-5 hover:border-slate-600/50 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Cpu size={24} className="text-cyan-400" />
                  </div>
                  <div>
                    <Link to={`/app/devices/${device.id}`} className="font-semibold text-slate-200 hover:text-cyan-400 transition-colors text-lg">
                      {device.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {device.type} • {device.protocol?.toUpperCase() || 'HTTP'}
                    </p>
                  </div>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === device.id ? null : device.id); }} 
                    className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeDropdown === device.id && (
                    <div className="absolute right-0 mt-2 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                      <Link to={`/app/devices/${device.id}`} className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">View Details</Link>
                      <Link to={`/app/devices/${device.id}?edit=true`} className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">Edit Device</Link>
                      <div className="border-t border-slate-700 my-1"></div>
                      <button 
                        onClick={() => { handleDelete(device.id); setActiveDropdown(null); }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Status</p>
                  <div className="mt-1"><StatusBadge status={device.status} /></div>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">IP Address</p>
                  <p className="text-slate-300 font-mono mt-1">{device.ip || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Location</p>
                  <p className="text-slate-300 mt-1">{device.location || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Last Seen</p>
                  <p className="text-slate-300 mt-1">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString() : '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {device.tags?.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700/50">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link to={`/app/devices/${device.id}`} className="text-xs text-cyan-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-2xl my-auto animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Add Device</h3>
                <p className="text-slate-400 text-sm mt-1">Configure a new device to connect to the platform</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="add-device-form" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData);
                
                // Manual validation
                if (!data.id) {
                  Swal.fire({
                    title: 'Warning',
                    text: 'Please enter a Device Id.',
                    icon: 'warning',
                    background: '#1e293b',
                    color: '#f8fafc'
                  });
                  return;
                }
                if (!data.type) {
                  Swal.fire({
                    title: 'Warning',
                    text: 'Please select a Device Type.',
                    icon: 'warning',
                    background: '#1e293b',
                    color: '#f8fafc'
                  });
                  return;
                }
                
                // Map the form data to what the backend expects
                const payload = {
                  name: data.name || data.id, // Fallback to id if name is empty
                  type: data.type,
                  protocol: data.protocol || 'http',
                  broker_config: data.protocol === 'mqtt' ? {
                    host: data.broker_host,
                    port: data.broker_port,
                    topic: data.broker_topic,
                  } : null,
                  credentials: data.credentials,
                  location: 'N/A', // Default or take from somewhere else if needed
                };

                try {
                  await devicesApi.create(payload);
                  setShowAddModal(false);
                  fetchDevices();
                  Swal.fire({
                    title: 'Success',
                    text: 'Device added successfully!',
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
                  <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <Cpu size={16} /> Device Configuration
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Type <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <select name="type" className="input-field w-full appearance-none" defaultValue="Generic IoT">
                        <option value="Generic IoT">Generic IoT Device</option>
                        <option value="ESP32">ESP32</option>
                        <option value="ESP8266">ESP8266</option>
                        <option value="Arduino">Arduino</option>
                        <option value="Raspberry Pi">Raspberry Pi</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Protocol <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <select 
                        name="protocol" 
                        className="input-field w-full appearance-none" 
                        value={addProtocol}
                        onChange={(e) => setAddProtocol(e.target.value)}
                      >
                        <option value="http">HTTP/REST</option>
                        <option value="mqtt">MQTT</option>
                      </select>
                    </div>
                  </div>

                  {addProtocol === 'mqtt' && (
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                      <h5 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">MQTT Broker Settings</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">Broker Host</label>
                        <div className="md:col-span-2">
                          <input name="broker_host" type="text" placeholder="e.g. mqtt.example.com" className="input-field w-full" required={addProtocol === 'mqtt'} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">Broker Port</label>
                        <div className="md:col-span-2">
                          <input name="broker_port" type="number" placeholder="e.g. 1883" defaultValue="1883" className="input-field w-full" required={addProtocol === 'mqtt'} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-medium text-slate-400">MQTT Topic (Optional)</label>
                        <div className="md:col-span-2">
                          <input name="broker_topic" type="text" placeholder="e.g. viki/home/sensor/temp" className="input-field w-full" />
                          <p className="text-xs text-slate-500 mt-1">Leave empty to use default topic.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Id <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <input name="id" type="text" placeholder="Enter device identifier" className="input-field w-full" />
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
                  <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> Device Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Device Name <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2">
                      <input name="name" type="text" placeholder="Optional device name" className="input-field w-full" />
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
                  <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700/50 pb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Advanced Options
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Asset Type <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-slate-900" />
                      <select name="assetType" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Type...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Asset Group <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-slate-900" />
                      <select name="assetGroup" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Group...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Product <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-slate-900" />
                      <select name="product" className="input-field w-full opacity-50 cursor-not-allowed" disabled>
                        <option>Select Product...</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">Enabled <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></label>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="enabled" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
            
                <div className="pt-6 border-t border-slate-700/50 flex justify-end gap-3 sticky bottom-0">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-6">Cancel</button>
                  <button type="submit" className="btn-primary px-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Add Device
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
