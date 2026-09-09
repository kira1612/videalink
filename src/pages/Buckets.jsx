import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, Plus, Search, Download, Trash2, ToggleLeft, ToggleRight, Clock, HardDrive, Filter, X, Cpu } from 'lucide-react';
import { bucketsApi, devicesApi } from '../services/api';
import { StatusBadge } from '../components/UI/Badge';
import Swal from 'sweetalert2';

export default function Buckets() {
  const [buckets, setBuckets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchBuckets();
    fetchDevices();
  }, []);

  const fetchBuckets = async () => {
    try {
      const res = await bucketsApi.list();
      setBuckets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await devicesApi.list();
      setDevices(res.data);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const handleToggle = async (bucket) => {
    try {
      await bucketsApi.toggle(bucket.id);
      setBuckets(buckets.map(b => b.id === bucket.id ? { ...b, enabled: !b.enabled } : b));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bucket and all its records?')) return;
    try {
      await bucketsApi.delete(id);
      setBuckets(buckets.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };


  const handleCreateBucket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    if (!data.name || !data.device_id) {
      Swal.fire({
        title: 'Error',
        text: 'Bucket Name and Device are required.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      });
      return;
    }

    const payload = {
      name: data.name,
      device_id: data.device_id,
      description: data.description,
      mqtt_topic: data.mqtt_topic,
      fields: data.fields ? data.fields.split(',').map(f => f.trim()).filter(f => f) : [],
    };

    try {
      await bucketsApi.create(payload);
      setShowAddModal(false);
      fetchBuckets();
      Swal.fire({
        title: 'Success',
        text: 'Bucket created successfully!',
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
    }
  };

  const filteredBuckets = Array.isArray(buckets) ? buckets.filter(b => {
    const nameMatch = (b?.name || '').toLowerCase().includes((search || '').toLowerCase());
    const deviceMatch = (b?.device || '').toLowerCase().includes((search || '').toLowerCase());
    return nameMatch || deviceMatch;
  }) : [];

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Data Buckets</h2>
          <p className="text-slate-400 text-sm mt-1">Store and manage time-series data from your devices</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} /> Create Bucket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search buckets by name or device..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2 justify-center">
          <Filter size={18} /> Filter
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 glass-card animate-pulse" />)}
        </div>
      ) : buckets.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <Database size={48} className="text-slate-600 mb-4" />
          <h3 className="text-xl font-medium text-slate-200 mb-2">No data buckets found</h3>
          <p className="text-slate-500 mb-6 max-w-md">You haven't created any data buckets yet. Create one to start storing time-series data from your devices.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            Create Your First Bucket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBuckets.map(bucket => (
            <div key={bucket.id} className="glass-card overflow-hidden transition-all duration-300">
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
                      <Database size={24} className="text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-200">{bucket.name}</h3>
                        <StatusBadge status={bucket.enabled ? 'online' : 'offline'} label={bucket.enabled ? 'Active' : 'Disabled'} />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{bucket.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><Cpu size={14} className="text-cyan-400"/> {bucket.device}</span>
                        <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-purple-400"/> {bucket.records?.toLocaleString() || 0} records ({bucket.size})</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400"/> Last write: {bucket.last_write ? new Date(bucket.last_write).toLocaleString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 lg:justify-end lg:w-64 border-t lg:border-t-0 border-slate-700/50 pt-4 lg:pt-0">
                    <button onClick={() => handleToggle(bucket)} className={`transition-colors ${bucket.enabled ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-400'}`} title={bucket.enabled ? 'Disable bucket' : 'Enable bucket'}>
                      {bucket.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <Link to={`/app/buckets/${bucket.id}`} className="btn-secondary text-xs px-3 py-1.5 flex-1 flex items-center justify-center">
                      View Data
                    </Link>
                    <button onClick={() => handleDelete(bucket.id)} className="w-8 h-8 flex items-center justify-center rounded bg-slate-800 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Delete bucket">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-card w-full max-w-lg my-auto animate-scale-in flex flex-col">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/80 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Create Data Bucket</h3>
                <p className="text-slate-400 text-sm mt-1">Configure a new bucket to store data</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleCreateBucket} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bucket Name</label>
                  <input name="name" type="text" placeholder="e.g. temperature_logs" className="input-field w-full" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Target Device</label>
                  <select name="device_id" className="input-field w-full appearance-none" required>
                    <option value="">Select a device...</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fields (comma separated)</label>
                  <input name="fields" type="text" placeholder="e.g. temperature, humidity" className="input-field w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">MQTT Topic (Optional)</label>
                  <input name="mqtt_topic" type="text" placeholder="e.g. viki/home/sensor/temp" className="input-field w-full" />
                  <p className="text-xs text-slate-500 mt-1">Listen to this exact topic to store data into this bucket.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea name="description" placeholder="Optional description..." className="input-field w-full min-h-[80px] resize-y"></textarea>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-6">Cancel</button>
                  <button type="submit" className="btn-primary px-6">Create Bucket</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
