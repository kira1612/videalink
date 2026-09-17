import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Database, Plus, Search, Trash2, Clock, HardDrive, X, Cpu,
  MoreVertical, Settings2, ArrowUpRight, Activity, Filter,
  RefreshCw, LayoutGrid, List, Check, Zap, Server, Network
} from 'lucide-react';
import { bucketsApi, devicesApi } from '../services/api';
import Swal from 'sweetalert2';

/* ────────────────────────────────────────────────────────────────────────
   Status config
──────────────────────────────────────────────────────────────────────── */
const ST = {
  active:   { label: 'Active',   dot: 'rgb(var(--primary-500))', bg: 'rgb(var(--primary-500)/0.12)', border: 'rgb(var(--primary-500)/0.18)', text: 'rgb(var(--primary-500))', topBorder: 'rgb(var(--primary-500))', glow: 'rgb(var(--primary-500)/0.1)', ping: true },
  disabled: { label: 'Disabled', dot: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.15)', text: '#64748b', topBorder: '#334155', glow: 'transparent',          ping: false },
};

/* ────────────────────────────────────────────────────────────────────────
   BUCKET CARD (Grid)
──────────────────────────────────────────────────────────────────────── */
function BucketCard({ bucket, onToggle, onDelete, activeDropdown, setActiveDropdown }) {
  const dropRef  = useRef(null);
  const isOpen   = activeDropdown === bucket.id;
  const st       = bucket.enabled ? ST.active : ST.disabled;
  const lastSeen = bucket.last_write
    ? new Date(bucket.last_write).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : 'Never';

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
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.15)' }}>
            <Database size={22} style={{ color: 'rgb(var(--primary-400))' }} />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full" style={{ background: 'rgb(var(--surface-900))', border: '1.5px solid rgb(var(--surface-800))' }}>
              <span className="relative flex h-2 w-2">
                {st.ping && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70" style={{ background: st.dot }} />}
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: st.dot }} />
              </span>
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <Link to={`/app/buckets/${bucket.id}`} className="text-[15px] font-extrabold text-slate-100 transition-colors leading-tight truncate block hover-text-primary-400"
                  onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--primary-400))'}
                  onMouseLeave={e => e.currentTarget.style.color = ''}>
              {bucket.name}
            </Link>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{bucket.description || 'No description'}</p>
          </div>

          <div className="relative flex-shrink-0" ref={dropRef}>
            <button onClick={e => { e.stopPropagation(); setActiveDropdown(isOpen ? null : bucket.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-400 hover:bg-slate-800 transition-all">
              <MoreVertical size={14} />
            </button>
            {isOpen && (
              <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1" style={{ animation: 'fadeInDown .1s ease-out' }} onClick={e => e.stopPropagation()}>
                <Link to={`/app/buckets/${bucket.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <ArrowUpRight size={13} style={{ color: 'rgb(var(--primary-400))' }} /> View Data
                </Link>
                <button onClick={() => { onToggle(bucket); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  {bucket.enabled ? <><Activity size={13} className="text-amber-400"/> Disable</> : <><Check size={13} className="text-emerald-400"/> Enable</>}
                </button>
                <div className="h-px bg-slate-800 my-1 mx-3" />
                <button onClick={() => { onDelete(bucket.id); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">
                  <Trash2 size={13} /> Delete Bucket
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
            {st.label}
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 px-2.5 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <Cpu size={11} style={{ color: 'rgb(var(--primary-400))' }} /> {bucket.device || 'Unlinked'}
          </span>
        </div>
      </div>

      <div className="px-5 pb-4 grid grid-cols-2 gap-3 border-t border-slate-800/60 pt-4 mt-auto">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><HardDrive size={9} /> Records</p>
          <p className="text-[12px] font-bold text-slate-300 truncate">{bucket.records?.toLocaleString() || 0}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><Server size={9} /> Storage Size</p>
          <p className="text-[12px] font-semibold text-slate-400 truncate">{bucket.size || '0 B'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 mb-1 flex items-center gap-1"><Clock size={9} /> Last Write</p>
          <p className="text-[12px] font-semibold text-slate-400">{lastSeen}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   BUCKET ROW (List)
──────────────────────────────────────────────────────────────────────── */
function BucketRow({ bucket, onToggle, onDelete, activeDropdown, setActiveDropdown }) {
  const dropRef = useRef(null);
  const isOpen  = activeDropdown === bucket.id;
  const st      = bucket.enabled ? ST.active : ST.disabled;

  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/25 transition-colors">
      <div className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.08)', border: '1px solid rgb(var(--primary-500)/0.12)' }}>
        <Database size={16} style={{ color: 'rgb(var(--primary-400))' }} />
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[1.5px] border-slate-900" style={{ background: st.dot }} />
      </div>

      <div className="flex-1 sm:w-48 sm:flex-none min-w-0">
        <Link to={`/app/buckets/${bucket.id}`} className="text-[13px] font-bold text-slate-200 transition-colors block truncate"
              onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--primary-400))'}
              onMouseLeave={e => e.currentTarget.style.color = ''}>{bucket.name}</Link>
        <p className="text-[11px] text-slate-600 truncate flex items-center gap-1"><Cpu size={10} style={{ color: 'rgb(var(--primary-500)/0.7)' }} /> {bucket.device || 'Unlinked'}</p>
      </div>

      <div className="hidden sm:block flex-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold" style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
          {st.ping && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: st.dot }} /><span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: st.dot }} /></span>}
          {st.label}
        </span>
      </div>

      <span className="hidden md:block w-24 text-[12px] font-mono text-slate-400 truncate">{bucket.records?.toLocaleString() || 0}</span>
      <span className="hidden lg:block w-24 text-[12px] font-mono text-slate-500 truncate">{bucket.size || '0 B'}</span>
      <span className="hidden xl:block w-32 text-[11px] text-slate-600">
        {bucket.last_write ? new Date(bucket.last_write).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : 'Never'}
      </span>

      <div className="relative flex-shrink-0 ml-auto" ref={dropRef}>
        <button onClick={e => { e.stopPropagation(); setActiveDropdown(isOpen ? null : bucket.id); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all">
          <MoreVertical size={14} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1" style={{ animation: 'fadeInDown .1s ease-out' }} onClick={e => e.stopPropagation()}>
            <Link to={`/app/buckets/${bucket.id}`} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"><ArrowUpRight size={13} style={{ color: 'rgb(var(--primary-400))' }} /> View Data</Link>
            <button onClick={() => { onToggle(bucket); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
              {bucket.enabled ? <><Activity size={13} className="text-amber-400"/> Disable</> : <><Check size={13} className="text-emerald-400"/> Enable</>}
            </button>
            <div className="h-px bg-slate-800 my-1 mx-3" />
            <button onClick={() => { onDelete(bucket.id); setActiveDropdown(null); }} className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10"><Trash2 size={13} /> Delete Bucket</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   ADD BUCKET MODAL
──────────────────────────────────────────────────────────────────────── */
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

function FieldSection({ icon: Icon, title, color }) {
  return (
    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: color.bg }}>
        <Icon size={11} style={{ color: color.fg }} />
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: color.fg }}>{title}</p>
    </div>
  );
}

function AddBucketModal({ onClose, onSuccess, devices }) {
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    
    if (!data.name || !data.device_id) {
      return Swal.fire({ title: 'Required', text: 'Name and Target Device are required.', icon: 'warning', background: '#1e293b', color: '#f8fafc' });
    }

    setBusy(true);
    try {
      await bucketsApi.create({
        name: data.name,
        device_id: data.device_id,
        description: data.description,
        mqtt_topic: data.mqtt_topic,
        fields: data.fields ? data.fields.split(',').map(f => f.trim()).filter(Boolean) : [],
      });
      onSuccess();
      onClose();
      Swal.fire({ title: 'Bucket created!', icon: 'success', background: '#1e293b', color: '#f8fafc' });
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]" style={{ animation: 'fadeInDown .15s ease-out' }}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.2)' }}>
              <Database size={16} style={{ color: 'rgb(var(--primary-400))' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-100">Create Data Bucket</h2>
              <p className="text-[11px] text-slate-500">Store time-series data</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"><X size={16} /></button>
        </div>

        <form id="modal-form" onSubmit={submit} className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="space-y-4">
            <FieldSection icon={Database} title="Bucket Configuration" color={{ bg: 'rgb(var(--primary-500)/0.12)', fg: 'rgb(var(--primary-400))' }} />
            
            <Field label="Bucket Name" required hint="e.g. env_sensors">
              <input name="name" type="text" placeholder="temperature_logs" className="input-field w-full" />
            </Field>

            <Field label="Target Device" required>
              <select name="device_id" className="input-field w-full appearance-none">
                <option value="">Select a device...</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
              </select>
            </Field>

            <Field label="Fields" hint="Comma separated (e.g. temp, humidity)">
              <input name="fields" type="text" placeholder="temp, humidity, pressure" className="input-field w-full" />
            </Field>

            <Field label="Description">
              <textarea name="description" rows={2} placeholder="What data is stored here?" className="input-field w-full resize-none" />
            </Field>
          </div>

          <div className="space-y-4">
            <FieldSection icon={Network} title="Ingestion Settings" color={{ bg: 'rgba(51,65,85,0.5)', fg: 'rgb(148,163,184)' }} />
            <Field label="MQTT Topic (Optional)" hint="Listen to this exact topic">
              <input name="mqtt_topic" type="text" placeholder="viki/home/sensor/temp" className="input-field w-full font-mono text-[12px]" />
            </Field>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[13px]">Cancel</button>
          <button type="submit" form="modal-form" disabled={busy} className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
          >
            {busy ? <><RefreshCw size={13} className="animate-spin" /> Creating…</> : <><Check size={13} /> Create Bucket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════ */
export default function Buckets() {
  const [buckets, setBuckets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [view, setView]       = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [bRes, dRes] = await Promise.all([bucketsApi.list(), devicesApi.list()]);
      setBuckets(bRes.data);
      setDevices(dRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleToggle = async (bucket) => {
    try {
      await bucketsApi.toggle(bucket.id);
      setBuckets(buckets.map(b => b.id === bucket.id ? { ...b, enabled: !b.enabled } : b));
    } catch (e) { console.error(e); }
  };

  const handleDelete = id => {
    Swal.fire({ title: 'Delete bucket?', text: 'All recorded data will be lost forever.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155', confirmButtonText: 'Delete', background: '#1e293b', color: '#f8fafc' })
      .then(async r => {
        if (!r.isConfirmed) return;
        try { await bucketsApi.delete(id); setBuckets(buckets.filter(b => b.id !== id)); Swal.fire({ title: 'Deleted!', icon: 'success', background: '#1e293b', color: '#f8fafc' }); }
        catch (err) { Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' }); }
      });
  };

  const filtered = buckets.filter(b => 
    (b.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (b.device || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = buckets.filter(b => b.enabled).length;
  const totalRecords = buckets.reduce((acc, b) => acc + (b.records || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px]">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1.5 h-7 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(to bottom, rgb(var(--primary-400)), rgb(var(--primary-700)))' }} />
            <h1 className="text-[22px] font-black text-slate-100 tracking-tight">Data Buckets</h1>
            {!loading && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">{buckets.length}</span>
            )}
          </div>
          <p className="text-[13px] text-slate-500 ml-4">Store, manage, and query time-series data from devices</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white self-start transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
        >
          <Plus size={16} /> Create Bucket
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Buckets', count: buckets.length, dot: 'rgb(var(--primary-400))', bg: 'rgb(var(--primary-500)/0.08)', border: 'rgb(var(--primary-500)/0.18)' },
          { label: 'Active',        count: activeCount,    dot: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
          { label: 'Total Records', count: totalRecords.toLocaleString(), dot: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.2)' },
        ].map(s => (
          <div key={s.label} className="relative rounded-2xl px-4 py-4 overflow-hidden" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="absolute right-3 top-3 w-5 h-5 rounded-full opacity-20" style={{ background: s.dot }} />
            {loading
              ? <div className="h-8 w-12 bg-slate-800 rounded-lg animate-pulse mb-1.5" />
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
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search buckets by name or device…"
            className="w-full bg-slate-800/60 border border-slate-700/60 text-[13px] text-slate-300 placeholder-slate-600 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:bg-slate-800 transition-all focus:outline-none"
            onFocus={e => e.target.style.borderColor = 'rgb(var(--primary-500)/0.5)'}
            onBlur={e => e.target.style.borderColor = ''}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"><X size={13} /></button>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {[{ v: 'grid', I: LayoutGrid }, { v: 'list', I: List }].map(({ v, I }) => (
            <button key={v} onClick={() => setView(v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={view === v ? { background: 'rgb(var(--surface-800))', color: 'rgb(var(--surface-100))' } : { color: 'rgb(100,116,139)' }}
            >
              <I size={14} />
            </button>
          ))}
          <div className="w-px h-5 bg-slate-800 mx-0.5" />
          <button onClick={loadData} disabled={refreshing} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : ''}>
          {[1,2,3,4].map(i => <div key={i} className={`bg-slate-900 border border-slate-800 rounded-2xl animate-pulse ${view === 'grid' ? 'h-[220px]' : 'h-16 mb-0.5'}`} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Database size={28} className="text-slate-700" />
          </div>
          <p className="text-[15px] font-black text-slate-500 mb-1">{search ? `No results for "${search}"` : 'No data buckets yet'}</p>
          <p className="text-[13px] text-slate-600 max-w-xs mb-6">{search ? 'Try a different keyword.' : 'Store and query historical data from your devices.'}</p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 text-[13px] font-bold px-6 py-2.5 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}>
              <Plus size={15} /> Create Bucket
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(b => <BucketCard key={b.id} bucket={b} onToggle={handleToggle} onDelete={handleDelete} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />)}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-800/40 border-b border-slate-800">
            <div className="w-9 flex-shrink-0" />
            {['Bucket', 'Status', 'Records', 'Size', 'Last Write', ''].map((h, i) => (
              <span key={i} className={`text-[10px] font-black uppercase tracking-widest text-slate-600 ${[,'flex-1 sm:w-48 sm:flex-none','hidden sm:block flex-1','hidden md:block w-24','hidden lg:block w-24','hidden xl:block w-32','w-7 ml-auto'][i+1] || ''}`}>{h}</span>
            ))}
          </div>
          {filtered.map(b => <BucketRow key={b.id} bucket={b} onToggle={handleToggle} onDelete={handleDelete} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} />)}
        </div>
      )}

      {showAdd && <AddBucketModal onClose={() => setShowAdd(false)} onSuccess={loadData} devices={devices} />}
    </div>
  );
}
