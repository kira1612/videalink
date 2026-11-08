import React, { useState, useEffect } from 'react';
import { automationsApi, devicesApi } from '../services/api';
import { Zap, Plus, Edit2, Trash2, Clock, Activity, ArrowRight, X, Loader2, Play } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAuto, setEditingAuto] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [conditionType, setConditionType] = useState('time'); // time, sensor
  const [conditionTime, setConditionTime] = useState('18:00');
  const [conditionDevice, setConditionDevice] = useState('');
  const [conditionOperator, setConditionOperator] = useState('>');
  const [conditionValue, setConditionValue] = useState('');
  
  const [actionDevice, setActionDevice] = useState('');
  const [actionCommand, setActionCommand] = useState('turn_on');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [autoRes, devRes] = await Promise.all([
        automationsApi.list(),
        devicesApi.list()
      ]);
      setAutomations(autoRes.data);
      setDevices(devRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (auto = null) => {
    if (auto) {
      setEditingAuto(auto);
      setName(auto.name);
      
      const cond = auto.condition || {};
      if (cond.type === 'time') {
        setConditionType('time');
        setConditionTime(cond.value || '18:00');
      } else {
        setConditionType('sensor');
        setConditionDevice(cond.device_id || '');
        setConditionOperator(cond.operator || '>');
        setConditionValue(cond.value || '');
      }

      const act = auto.action || {};
      setActionDevice(act.device_id || '');
      setActionCommand(act.command || 'turn_on');
    } else {
      setEditingAuto(null);
      setName('');
      setConditionType('time');
      setConditionTime('18:00');
      setConditionDevice(devices.length > 0 ? devices[0].id : '');
      setConditionOperator('>');
      setConditionValue('30');
      setActionDevice(devices.length > 0 ? devices[0].id : '');
      setActionCommand('turn_on');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      name,
      is_active: true,
      condition: conditionType === 'time' 
        ? { type: 'time', value: conditionTime }
        : { type: 'sensor', device_id: conditionDevice, operator: conditionOperator, value: conditionValue },
      action: { type: 'device', device_id: actionDevice, command: actionCommand }
    };

    try {
      if (editingAuto) await automationsApi.update(editingAuto.id, payload);
      else await automationsApi.create(payload);
      closeModal();
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan skenario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus skenario ini?')) {
      try {
        await automationsApi.delete(id);
        fetchData();
      } catch (e) {
        alert('Gagal menghapus');
      }
    }
  };

  const toggleStatus = async (auto) => {
    try {
      await automationsApi.update(auto.id, { ...auto, is_active: !auto.is_active });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper untuk me-render Teks "Jika (Condition)" ke bahasa manusia
  const renderConditionText = (cond) => {
    if (!cond) return 'Kondisi tidak valid';
    if (cond.type === 'time') {
      return <span>Waktu menunjukkan pukul <strong className="text-slate-100">{cond.value}</strong></span>;
    }
    if (cond.type === 'sensor') {
      const dev = devices.find(d => d.id == cond.device_id);
      return <span>Data <strong className="text-slate-100">{dev ? dev.name : `Device #${cond.device_id}`}</strong> adalah <strong className="text-slate-100">{cond.operator} {cond.value}</strong></span>;
    }
    return 'Kondisi tidak diketahui';
  };

  // Helper untuk me-render Teks "Maka (Action)"
  const renderActionText = (act) => {
    if (!act) return 'Aksi tidak valid';
    const dev = devices.find(d => d.id == act.device_id);
    const cmd = act.command === 'turn_on' ? 'Nyalakan' : 'Matikan';
    return <span><strong className="text-slate-100">{cmd}</strong> {dev ? dev.name : `Device #${act.device_id}`}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Zap className="text-primary-400" size={22} /> Skenario Cerdas (Automations)
          </h1>
          <p className="text-slate-400 text-[13px] mt-0.5">Otomatisasi rutinitas perangkat IoT rumah Anda secara mandiri.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 text-xs self-start"
        >
          <Plus size={16} />
          <span>Buat Skenario</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="vision-card h-56 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {automations.map(auto => (
            <div key={auto.id} className="vision-card p-6 relative overflow-hidden group">
              {/* Dekorasi Glow */}
              <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-all ${auto.is_active ? 'bg-primary-500' : 'bg-slate-600'}`} />
              
              <div className="relative z-10 flex justify-between items-start mb-5">
                <div className="flex items-center gap-3.5">
                  <button 
                    onClick={() => toggleStatus(auto)}
                    className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${auto.is_active ? 'bg-primary-500 shadow-[0_0_14px_rgb(var(--primary-500)/0.45)]' : 'bg-slate-700'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${auto.is_active ? 'translate-x-5 shadow-sm' : ''}`} />
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-100 text-[16px] leading-tight">{auto.name}</h3>
                    <p className={`text-[11px] font-bold mt-0.5 ${auto.is_active ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {auto.is_active ? '● Skenario Aktif' : '○ Sedang Dijeda'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openModal(auto)} className="p-2 vision-inner-box text-slate-400 hover:text-primary-400 rounded-xl transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(auto.id)} className="p-2 vision-inner-box text-slate-400 hover:text-rose-400 rounded-xl transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              
              <div className="relative z-10 flex flex-col gap-2">
                {/* Blok JIKA */}
                <div className="vision-inner-box rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="vision-icon-box w-9 h-9 rounded-xl flex-shrink-0">
                    {auto.condition?.type === 'time' ? <Clock size={16} /> : <Activity size={16} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-primary-400 uppercase tracking-wider mb-0.5">JIKA (Trigger)</p>
                    <p className="text-[13px] text-slate-300">{renderConditionText(auto.condition)}</p>
                  </div>
                </div>
                
                {/* Garis Panah */}
                <div className="flex justify-center -my-2.5 relative z-20">
                  <div className="w-7 h-7 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center shadow-md">
                    <ArrowRight size={13} className="text-primary-400 rotate-90" />
                  </div>
                </div>

                {/* Blok MAKA */}
                <div className="vision-inner-box rounded-2xl p-4 flex items-center gap-3.5 border border-emerald-500/20">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <Play size={15} className="ml-0.5 fill-current" />
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-0.5">MAKA (Action)</p>
                    <p className="text-[13px] text-slate-300">{renderActionText(auto.action)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {automations.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 vision-card">
              <div className="vision-icon-box w-14 h-14 rounded-2xl mb-4">
                <Zap size={26} />
              </div>
              <p className="text-slate-100 font-bold mb-1">Belum ada skenario pintar.</p>
              <p className="text-slate-400 text-sm max-w-sm text-center">Buat rumah Anda hidup secara mandiri. Tambahkan skenario untuk mengotomatisasi lampu, AC, dan perangkat lainnya.</p>
              <button onClick={() => openModal()} className="mt-6 btn-primary text-xs">
                Buat Skenario Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL BUILDER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Zap size={20} className="text-amber-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 leading-tight">
                    {editingAuto ? 'Edit Skenario' : 'Skenario Baru'}
                  </h2>
                  <p className="text-[12px] text-slate-500">Konfigurasi alur kerja IF-THEN</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-100 transition-colors bg-slate-800 p-2 rounded-lg"><X size={16} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Skenario</label>
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="misal: Lampu Teras Menyala Malam Hari"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Divider Line in middle for Desktop */}
                <div className="hidden md:block absolute left-1/2 top-8 bottom-0 w-px bg-slate-800" />
                
                {/* Blok KIRI: KONDISI */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> KONDISI (JIKA)
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Tipe Pemicu</label>
                    <select value={conditionType} onChange={e => setConditionType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none">
                      <option value="time">Berdasarkan Waktu (Jadwal)</option>
                      <option value="sensor">Berdasarkan Data Sensor</option>
                    </select>
                  </div>

                  {conditionType === 'time' ? (
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Pilih Waktu (HH:MM)</label>
                      <input type="time" required value={conditionTime} onChange={e => setConditionTime(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">Perangkat / Sensor</label>
                        <select required value={conditionDevice} onChange={e => setConditionDevice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none">
                          <option value="">Pilih Perangkat...</option>
                          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <label className="block text-xs text-slate-500 mb-1.5">Kondisi</label>
                          <select value={conditionOperator} onChange={e => setConditionOperator(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2.5 text-sm text-slate-200 outline-none">
                            <option value=">">Lebih dari (&gt;)</option>
                            <option value="<">Kurang dari (&lt;)</option>
                            <option value="==">Sama dengan (=)</option>
                          </select>
                        </div>
                        <div className="w-2/3">
                          <label className="block text-xs text-slate-500 mb-1.5">Nilai (Value)</label>
                          <input type="text" required value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="misal: 30" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none" />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Blok KANAN: AKSI */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> AKSI (MAKA)
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Target Perangkat</label>
                    <select required value={actionDevice} onChange={e => setActionDevice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500">
                      <option value="">Pilih Perangkat untuk Dikontrol...</option>
                      {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Perintah</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button" 
                        onClick={() => setActionCommand('turn_on')}
                        className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${actionCommand === 'turn_on' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}
                      >
                        Nyalakan (ON)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setActionCommand('turn_off')}
                        className={`py-2.5 rounded-lg text-sm font-bold border transition-all ${actionCommand === 'turn_off' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'}`}
                      >
                        Matikan (OFF)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:opacity-50 transition-colors">
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Simpan Skenario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
