import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Cpu, MoreVertical, X, Shuffle, Check,
  Settings2, Info, RefreshCw, LayoutGrid, List,
  MapPin, Clock, Zap, Signal, ChevronRight, ArrowUpRight,
  Activity, WifiOff, AlertTriangle,
} from 'lucide-react';
import { devicesApi } from '../services/api';
import Swal from 'sweetalert2';
import { TypeBadge } from '../components/UI/Badge';

/* ────────────────────────────────────────────────────────────────────────
   Status config — all inline, no Tailwind color classes
──────────────────────────────────────────────────────────────────────── */
const ST = {
  online:  { label: 'Online',  dot: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.18)',  text: '#34d399', topBorder: '#34d399', glow: 'rgba(16,185,129,0.1)',  ping: true  },
  warning: { label: 'Warning', dot: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.18)',  text: '#fbbf24', topBorder: '#f59e0b', glow: 'rgba(245,158,11,0.08)', ping: false },
  offline: { label: 'Offline', dot: '#64748b', bg: 'rgba(100,116,139,0.1)',  border: 'rgba(100,116,139,0.15)', text: '#64748b', topBorder: '#334155', glow: 'transparent',           ping: false },
};

/* ────────────────────────────────────────────────────────────────────────
   DEVICE CARD
──────────────────────────────────────────────────────────────────────── */
function DeviceCard({ device, onDelete, activeDropdown, setActiveDropdown }) {
  const dropRef  = useRef(null);
  const isOpen   = activeDropdown === device.id;
  const st       = ST[device.status] || ST.offline;
  const lastSeen = device.last_seen_at
    ? new Date(device.last_seen_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null;

  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderTopColor: st.topBorder,
        borderTopWidth: '2px',
        boxShadow: `0 0 0 0 transparent`,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 32px ${st.glow}, 0 1px 0 rgba(255,255,255,0.04) inset`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* ── Header ── */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.15)' }}>
            <Cpu size={22} style={{ color: 'rgb(var(--primary-400))' }} />
            {/* Live dot */}
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full" style={{ background: 'rgb(var(--surface-900))', border: '1.5px solid rgb(var(--surface-800))' }}>
              <span className="relative flex h-2 w-2">
                {st.ping && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: st.dot }} />}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: st.dot }} />
              </span>
            </span>
          </div>

          {/* Name + type */}
          <div className="flex-1 min-w-0">
            <Link
              to={`/app/devices/${device.id}`}
              className="text-[15px] font-extrabold text-slate-100 hover:text-primary-400 transition-colors leading-tight truncate block"
            >
              {device.name}
            </Link>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {device.type}
              <span className="mx-1 text-slate-700">·</span>
              <span className="font-mono">{device.protocol?.toUpperCase() || 'HTTP'}</span>
            </p>
          </div>

          {/* Dropdown */}
          <div className="relative flex-shrink-0" ref={dropRef}>
            <button
              onClick={e => { e.stopPropagation(); setActiveDropdown(isOpen ? null : device.id); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-400 hover:bg-slate-800 transition-all"
            >
              <MoreVertical size={14} />
            </button>
            {isOpen && (
              <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1" style={{ animation: 'fadeInDown .1s ease-out' }} onClick={e => e.stopPropagation()}>
                <Link to={`/app/devices/${device.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <ArrowUpRight size={13} style={{ color: 'rgb(var(--primary-400))' }} /> View Details
                </Link>
                <Link to={`/app/devices/${device.id}?edit=true`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <Settings2 size={13} className="text-slate-500" /> Edit Device
                </Link>
                <div className="h-px bg-slate-800 my-1 mx-3" />
                <button onClick={() => { onDelete(device.id); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <X size={13} /> Delete Device
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          {device.status === 'online' && <Activity size={11} className="animate-pulse" />}
          {device.status === 'warning' && <AlertTriangle size={11} />}
          {device.status === 'offline' && <WifiOff size={11} />}
          {st.label}
          {device.status === 'online' && <span className="opacity-60 font-normal">· responding</span>}
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><Signal size={9} /> IP Address</p>
          <p className="text-[12px] font-mono font-bold text-slate-300 truncate">{device.ip || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><MapPin size={9} /> Location</p>
          <p className="text-[12px] font-semibold text-slate-400 truncate">{device.location || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><Zap size={9} /> Protocol</p>
          <p className="text-[12px] font-bold text-slate-400">{device.protocol?.toUpperCase() || 'HTTP'}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><Clock size={9} /> Last Seen</p>
          <p className="text-[12px] font-semibold text-slate-400">{lastSeen || '—'}</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-800/20 flex items-center justify-between mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {device.tags?.slice(0, 3).map(t => (
            <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/60">{t}</span>
          ))}
          {(device.tags?.length ?? 0) === 0 && <span className="text-[10px] text-slate-700">No tags</span>}
        </div>
        <Link to={`/app/devices/${device.id}`} className="flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-200" style={{ color: 'rgb(var(--primary-400))' }}>
          Open <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   DEVICE ROW  (list)
──────────────────────────────────────────────────────────────────────── */
function DeviceRow({ device, onDelete, activeDropdown, setActiveDropdown }) {
  const dropRef = useRef(null);
  const isOpen  = activeDropdown === device.id;
  const st      = ST[device.status] || ST.offline;

  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/25 transition-colors">
      <div className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.08)', border: '1px solid rgb(var(--primary-500)/0.12)' }}>
        <Cpu size={16} style={{ color: 'rgb(var(--primary-400))' }} />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-slate-900" style={{ background: st.dot }} />
      </div>

      <div className="flex-1 sm:w-48 sm:flex-none min-w-0">
        <Link to={`/app/devices/${device.id}`} className="text-[13px] font-bold text-slate-200 hover:text-primary-400 transition-colors block truncate">{device.name}</Link>
        <p className="text-[11px] text-slate-600 truncate">{device.type}</p>
      </div>

      <div className="hidden sm:block flex-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          {st.ping && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: st.dot }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: st.dot }} /></span>}
          {st.label}
        </span>
      </div>

      <span className="hidden md:block w-32 text-[12px] font-mono text-slate-500 truncate">{device.ip || '—'}</span>
      <span className="hidden lg:block w-28 text-[12px] text-slate-500 truncate">{device.location || '—'}</span>
      <span className="hidden lg:block w-16 text-[11px] font-bold text-slate-600 uppercase">{device.protocol || 'HTTP'}</span>
      <span className="hidden xl:block w-16 text-[11px] text-slate-600">
        {device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
      </span>

      <div className="relative flex-shrink-0 ml-auto" ref={dropRef}>
        <button
          onClick={e => { e.stopPropagation(); setActiveDropdown(isOpen ? null : device.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreVertical size={14} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1" style={{ animation: 'fadeInDown .1s ease-out' }} onClick={e => e.stopPropagation()}>
            <Link to={`/app/devices/${device.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"><ArrowUpRight size={13} style={{ color: 'rgb(var(--primary-400))' }} /> View Details</Link>
            <Link to={`/app/devices/${device.id}?edit=true`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"><Settings2 size={13} className="text-slate-500" /> Edit</Link>
            <div className="h-px bg-slate-800 my-1 mx-3" />
            <button onClick={() => { onDelete(device.id); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10"><X size={13} /> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   ADD DEVICE MODAL
──────────────────────────────────────────────────────────────────────── */
function AddDeviceModal({ onClose, onSuccess }) {
  const [protocol, setProtocol] = useState('http');
  const [creds, setCreds]       = useState('');
  const [busy, setBusy]         = useState(false);

  const genCreds = () => {
    const ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    setCreds(Array.from({ length: 24 }, () => ch[Math.floor(Math.random() * ch.length)]).join(''));
  };

  const submit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (!d.id)   return Swal.fire({ title: 'Required', text: 'Enter a Device ID.', icon: 'warning', background: '#1e293b', color: '#f8fafc' });
    if (!d.type) return Swal.fire({ title: 'Required', text: 'Select a type.', icon: 'warning', background: '#1e293b', color: '#f8fafc' });
    setBusy(true);
    try {
      await devicesApi.create({ name: d.name || d.id, type: d.type, protocol: d.protocol || 'http', broker_config: d.protocol === 'mqtt' ? { host: d.broker_host, port: d.broker_port, topic: d.broker_topic } : null, credentials: d.credentials, location: 'N/A' });
      onSuccess(); onClose();
      Swal.fire({ title: 'Device added!', icon: 'success', background: '#1e293b', color: '#f8fafc' });
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]" style={{ animation: 'fadeInDown .15s ease-out' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.2)' }}>
              <Cpu size={17} style={{ color: 'rgb(var(--primary-400))' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-100">Add New Device</h2>
              <p className="text-[11px] text-slate-500">Register a device to this platform</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"><X size={16} /></button>
        </div>

        <form id="modal-form" onSubmit={submit} className="overflow-y-auto flex-1 p-6 space-y-5">
          <FieldSection icon={Cpu} title="Device Configuration" accent>
            <Field label="Device ID" required hint="Unique identifier, e.g. esp32-lab-01">
              <input name="id" type="text" placeholder="esp32-lab-01" className="input-field" />
            </Field>
            <Field label="Device Type" required>
              <select name="type" className="input-field" defaultValue="Generic IoT">
                <option value="Generic IoT">Generic IoT Device</option>
                <option value="ESP32">ESP32</option>
                <option value="ESP8266">ESP8266</option>
                <option value="Arduino Uno">Arduino Uno</option>
                <option value="Raspberry Pi 4">Raspberry Pi 4</option>
                <option value="NodeMCU">NodeMCU</option>
              </select>
            </Field>
            <Field label="Protocol">
              <div className="grid grid-cols-2 gap-2">
                {['http', 'mqtt'].map(p => (
                  <button key={p} type="button" onClick={() => setProtocol(p)}
                    className="py-2.5 rounded-xl text-[13px] font-bold border transition-all flex items-center justify-center gap-2"
                    style={protocol === p
                      ? { background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', color: 'white', border: 'none', boxShadow: '0 4px 14px rgb(var(--primary-500)/0.35)' }
                      : { background: 'transparent', color: 'rgb(100,116,139)', borderColor: 'rgb(51,65,85)' }
                    }
                  >
                    {protocol === p && <Check size={13} />}
                    {p === 'http' ? 'HTTP / REST' : 'MQTT'}
                  </button>
                ))}
              </div>
              <input type="hidden" name="protocol" value={protocol} />
            </Field>

            {protocol === 'mqtt' && (
              <div className="rounded-xl border border-slate-800 p-4 space-y-3 bg-slate-800/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">MQTT Broker</p>
                <Field label="Host"><input name="broker_host" type="text" placeholder="mqtt.example.com" className="input-field" required /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Port"><input name="broker_port" type="number" defaultValue="1883" className="input-field" required /></Field>
                  <Field label="Topic (opt.)"><input name="broker_topic" type="text" placeholder="home/sensor" className="input-field" /></Field>
                </div>
              </div>
            )}

            <Field label="Credentials">
              <div className="relative">
                <input name="credentials" type="text" placeholder="Token or API key" className="input-field font-mono text-[12px] pr-28" value={creds} onChange={e => setCreds(e.target.value)} />
                <button type="button" onClick={genCreds} className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                  <Shuffle size={11} /> Generate
                </button>
              </div>
            </Field>
          </FieldSection>

          <FieldSection icon={Info} title="Device Information">
            <Field label="Display Name" hint="Optional, defaults to Device ID">
              <input name="name" type="text" placeholder="My Sensor Node" className="input-field" />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={2} placeholder="What does this device monitor?" className="input-field resize-none" />
            </Field>
          </FieldSection>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[13px]">Cancel</button>
          <button type="submit" form="modal-form" disabled={busy} className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
          >
            {busy ? <><RefreshCw size={13} className="animate-spin" /> Adding…</> : <><Check size={13} /> Add Device</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <label className="text-[12px] font-bold text-slate-400">{label}</label>
        {required && <span className="text-[10px] font-bold text-rose-500">required</span>}
        {hint && <span className="text-[11px] text-slate-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function FieldSection({ icon: Icon, title, accent = false, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: accent ? 'rgb(var(--primary-500)/0.12)' : 'rgba(51,65,85,0.5)' }}>
          <Icon size={11} style={{ color: accent ? 'rgb(var(--primary-400))' : 'rgb(100,116,139)' }} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: accent ? 'rgb(var(--primary-400))' : 'rgb(71,85,105)' }}>{title}</p>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════ */
export default function Devices() {
  const [devices, setDevices]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [tab, setTab]                   = useState('all');
  const [showAdd, setShowAdd]           = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [view, setView]                 = useState('grid');
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setRefreshing(true);
    try { setDevices((await devicesApi.list()).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleDelete = id =>
    Swal.fire({ title: 'Delete device?', text: 'Cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Delete', background: '#1e293b', color: '#f8fafc' })
      .then(async r => {
        if (!r.isConfirmed) return;
        try { await devicesApi.delete(id); load(); Swal.fire({ title: 'Deleted!', icon: 'success', background: '#1e293b', color: '#f8fafc' }); }
        catch (err) { Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' }); }
      });

  const counts = {
    all:     devices.length,
    online:  devices.filter(d => d.status === 'online').length,
    warning: devices.filter(d => d.status === 'warning').length,
    offline: devices.filter(d => d.status === 'offline').length,
  };

  const filtered = devices.filter(d =>
    (tab === 'all' || d.status === tab) &&
    (d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase()))
  );

  const TABS = [
    { key: 'all',     label: 'All',     color: null },
    { key: 'online',  label: 'Online',  color: '#34d399' },
    { key: 'warning', label: 'Warning', color: '#fbbf24' },
    { key: 'offline', label: 'Offline', color: '#64748b' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px]">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1.5 h-7 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(to bottom, rgb(var(--primary-400)), rgb(var(--primary-700)))' }} />
            <h1 className="text-[22px] font-black text-slate-100 tracking-tight">Devices</h1>
            {!loading && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">{devices.length}</span>
            )}
          </div>
          <p className="text-[13px] text-slate-500 ml-4">Manage and monitor your connected IoT fleet</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white self-start transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
        >
          <Plus size={16} /> Add Device
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',   count: counts.all,     dot: 'rgb(var(--primary-400))', bg: 'rgb(var(--primary-500)/0.08)', border: 'rgb(var(--primary-500)/0.18)' },
          { label: 'Online',  count: counts.online,  dot: '#34d399',               bg: 'rgba(52,211,153,0.08)',         border: 'rgba(52,211,153,0.2)' },
          { label: 'Warning', count: counts.warning, dot: '#fbbf24',               bg: 'rgba(251,191,36,0.08)',         border: 'rgba(251,191,36,0.2)' },
          { label: 'Offline', count: counts.offline, dot: '#64748b',               bg: 'rgba(100,116,139,0.06)',        border: 'rgba(100,116,139,0.15)' },
        ].map(s => (
          <div key={s.label} className="relative rounded-2xl px-4 py-4 overflow-hidden" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="absolute right-3 top-3 w-5 h-5 rounded-full opacity-20" style={{ background: s.dot }} />
            {loading
              ? <div className="h-8 w-10 bg-slate-800 rounded-lg animate-pulse mb-1" />
              : <p className="text-[26px] font-black text-slate-100 leading-none mb-1.5">{s.count}</p>
            }
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
              <p className="text-[12px] font-bold text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search devices…"
            className="w-full bg-slate-800/60 border border-slate-700/60 text-[13px] text-slate-300 placeholder-slate-600 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:bg-slate-800 focus:border-primary-500/50 transition-all"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"><X size={13} /></button>}
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-0.5 bg-slate-800/60 border border-slate-700/60 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={tab === t.key ? { background: 'rgb(var(--surface-800))', color: 'rgb(var(--surface-100))' } : { color: 'rgb(100,116,139)' }}
            >
              {t.color && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: t.color }} />}
              {t.label}
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-900/60 text-slate-500">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {[{ v: 'grid', I: LayoutGrid }, { v: 'list', I: List }].map(({ v, I }) => (
            <button key={v} onClick={() => setView(v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={view === v ? { background: 'rgb(var(--surface-800))', color: 'rgb(var(--surface-100))' } : { color: 'rgb(100,116,139)' }}
            >
              <I size={14} />
            </button>
          ))}
          <div className="w-px h-5 bg-slate-800 mx-0.5" />
          <button onClick={load} disabled={refreshing} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : ''}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className={`bg-slate-900 border border-slate-800 rounded-2xl animate-pulse ${view === 'grid' ? 'h-[270px]' : 'h-14 mb-0.5'}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Cpu size={28} className="text-slate-700" />
          </div>
          <p className="text-[15px] font-black text-slate-500 mb-1">{search ? `No results for "${search}"` : 'No devices found'}</p>
          <p className="text-[13px] text-slate-600 max-w-xs mb-6">{search ? 'Try a different keyword.' : 'Get started by adding your first device.'}</p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-[13px] font-bold px-6 py-2.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}>
              <Plus size={15} /> Add First Device
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => <DeviceCard key={d.id} device={d} onDelete={handleDelete} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />)}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-800/40 border-b border-slate-800">
            <div className="w-9 flex-shrink-0" />
            {['Device', 'Status', 'IP Address', 'Location', 'Protocol', 'Last Seen', ''].map((h, i) => (
              <span key={i} className={`text-[10px] font-black uppercase tracking-widest text-slate-600 ${[,'flex-1 sm:w-48 sm:flex-none','hidden sm:flex flex-1','hidden md:block w-32','hidden lg:block w-28','hidden lg:block w-16','hidden xl:block w-16','w-7 ml-auto'][i+1] || ''}`}>{h}</span>
            ))}
          </div>
          {filtered.map(d => <DeviceRow key={d.id} device={d} onDelete={handleDelete} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />)}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-center text-[12px] text-slate-600">
          <span className="font-bold text-slate-400">{filtered.length}</span> of <span className="font-bold text-slate-400">{devices.length}</span> devices
        </p>
      )}

      {showAdd && <AddDeviceModal onClose={() => setShowAdd(false)} onSuccess={load} />}
    </div>
  );
}
