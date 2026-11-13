import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsApi } from '../services/api';
import { Home, Plus, Edit2, Trash2, X, Loader2, LayoutGrid, Box, Pin, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import FloorPlan from './FloorPlan';
import { PREF_KEYS, getUserJsonPref, setUserJsonPref } from '../utils/dashboardPrefs';
import { useBillingQuota } from '../hooks/useBillingQuota';
import QuotaNoticeBanner, {
  handleQuotaError,
  promptQuotaUpgrade,
} from '../components/Billing/QuotaNoticeBanner';

export default function Rooms() {
  const navigate = useNavigate();
  const { refreshQuota, getResourceQuota } = useBillingQuota();
  const roomQuota = getResourceQuota('rooms');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | '3d'
  const [selectedRoomId, setSelectedRoomId] = useState(null); // ID ruangan yang sedang di-edit 3D-nya
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedRoomIds, setPinnedRoomIds] = useState(() => {
    try {
      const set = new Set();
      const pinned = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      if (Array.isArray(pinned)) {
        pinned.forEach((r) => set.add(String(r.id ?? r)));
      }
      return set;
    } catch {
      return new Set();
    }
  });

  const syncPinnedRooms = useCallback(() => {
    try {
      const set = new Set();
      const pinned = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      if (Array.isArray(pinned)) {
        pinned.forEach((r) => set.add(String(r.id ?? r)));
      }
      setPinnedRoomIds(set);
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener('rooms-widgets-updated', syncPinnedRooms);
    window.addEventListener('dashboard-prefs-updated', syncPinnedRooms);
    window.addEventListener('storage', syncPinnedRooms);
    return () => {
      window.removeEventListener('rooms-widgets-updated', syncPinnedRooms);
      window.removeEventListener('dashboard-prefs-updated', syncPinnedRooms);
      window.removeEventListener('storage', syncPinnedRooms);
    };
  }, [syncPinnedRooms]);

  const handleTogglePinRoom = (room) => {
    const rId = String(room?.id ?? room?.roomId);
    if (!rId || rId === 'undefined') return;
    const isCurrentlyPinned = pinnedRoomIds.has(rId);
    const safeName = (room?.name && !room.name.includes('undefined')) ? room.name : 'Ruangan 3D';

    try {
      // Hanya kirim / lepas dari daftar Sidebar Widget (tidak langsung taruh di Dashboard utama)
      let pinnedList = getUserJsonPref(PREF_KEYS.PINNED_ROOMS, []);
      if (!Array.isArray(pinnedList)) pinnedList = [];
      if (isCurrentlyPinned) {
        pinnedList = pinnedList.filter((r) => String(r.id ?? r) !== rId);
      } else if (!pinnedList.some((r) => String(r.id ?? r) === rId)) {
        pinnedList.push({
          id: rId,
          name: safeName,
          icon: room?.icon || 'home',
          devices_count: room?.devices_count || 0,
        });
      }
      setUserJsonPref(PREF_KEYS.PINNED_ROOMS, pinnedList);
    } catch (e) {
      console.error(e);
    }

    syncPinnedRooms();
    window.dispatchEvent(new CustomEvent('rooms-widgets-updated'));

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: isCurrentlyPinned ? 'info' : 'success',
      title: isCurrentlyPinned
        ? `Ruangan "${safeName}" dilepas dari Sidebar Widget`
        : `Ruangan "${safeName}" dikirim ke Sidebar Widget!`,
      showConfirmButton: false,
      timer: 2000,
      background: '#0f172a',
      color: '#f1f5f9',
    });
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', icon: 'home' });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomsApi.list();
      setRooms(res.data);
      refreshQuota();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({ name: room.name, icon: room.icon || 'home' });
    } else {
      if (roomQuota.blocked) {
        promptQuotaUpgrade({
          navigate,
          resourceLabel: roomQuota.label,
          planName: roomQuota.planName,
          current: roomQuota.current,
          limit: roomQuota.limit,
        });
        return;
      }
      setEditingRoom(null);
      setFormData({ name: '', icon: 'home' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await roomsApi.update(editingRoom.id, formData);
      } else {
        await roomsApi.create(formData);
      }
      handleCloseModal();
      fetchRooms();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Berhasil menyimpan data',
        showConfirmButton: false,
        timer: 3000,
        background: '#0f172a',
        color: '#f1f5f9',
        iconColor: '#10b981'
      });
    } catch (err) {
      if (!handleQuotaError(err, navigate, handleCloseModal)) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err?.response?.data?.message || 'Gagal menyimpan data.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#3b82f6'
        });
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus ruangan?',
      text: "Data ruangan beserta relasinya akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9'
    });

    if (result.isConfirmed) {
      try {
        await roomsApi.delete(id);
        fetchRooms();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Ruangan berhasil dihapus',
          showConfirmButton: false,
          timer: 3000,
          background: '#0f172a',
          color: '#f1f5f9',
          iconColor: '#10b981'
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Terjadi kesalahan saat menghapus ruangan.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#3b82f6'
        });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black text-slate-100 flex items-center gap-2.5 tracking-tight">
            <Home className="text-primary-400" size={22} /> Manajemen Ruangan
          </h1>
          <p className="text-slate-400 text-[13px] mt-0.5">Kelola daftar ruangan dan rancang tata letak 3D rumah Anda.</p>
        </div>
        
        <div className="vision-inner-box flex rounded-2xl p-1">
          <button 
            onClick={() => { setActiveTab('list'); fetchRooms(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeTab === 'list' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutGrid size={15} /> Data Ruangan
          </button>
          <button 
            onClick={() => {
              if (!selectedRoomId && rooms.length > 0) {
                setSelectedRoomId(rooms[0].id);
              }
              setActiveTab('3d');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeTab === '3d' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Box size={15} /> 3D Floor Plan
          </button>
        </div>
      </div>

      {activeTab === '3d' ? (
        <div className="vision-card overflow-hidden relative flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
          {rooms.length > 0 && (
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xs font-bold text-slate-400 shrink-0">Ruangan Aktif:</span>
                <select
                  value={selectedRoomId || rooms[0]?.id || ''}
                  onChange={(e) => setSelectedRoomId(Number(e.target.value) || e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-100 focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.devices_count || 0} Perangkat)
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => { setActiveTab('list'); fetchRooms(); }}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Daftar Ruangan →
              </button>
            </div>
          )}

          {(selectedRoomId || (rooms.length > 0 ? rooms[0].id : null)) ? (
            <div className="flex-1 relative overflow-hidden">
              <FloorPlan
                hideHeader={true}
                roomId={selectedRoomId || rooms[0].id}
                roomName={rooms.find(r => r.id === (selectedRoomId || rooms[0].id))?.name || 'Ruangan 3D'}
                key={selectedRoomId || rooms[0].id}
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <div className="vision-icon-box w-14 h-14 rounded-2xl mb-4">
                <Box size={28} />
              </div>
              <p className="text-sm">Silakan buat ruangan dari tab <strong className="text-slate-100">Data Ruangan</strong> terlebih dahulu.</p>
              <button 
                onClick={() => setActiveTab('list')}
                className="mt-4 btn-primary text-xs"
              >
                Kembali ke Data Ruangan
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <QuotaNoticeBanner quota={roomQuota} />

          <div className="flex justify-end">
            <button 
              onClick={() => handleOpenModal()}
              className={roomQuota.blocked
                ? 'flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border text-rose-300 bg-rose-500/10 border-rose-500/35 hover:bg-rose-500/15 transition-colors'
                : 'btn-primary flex items-center gap-2 text-xs'}
            >
              {roomQuota.blocked ? <Lock size={15} /> : <Plus size={16} />}
              <span>{roomQuota.blocked ? (roomQuota.unavailable ? 'Fitur Terkunci • Upgrade' : 'Kuota Penuh • Upgrade') : 'Tambah Ruangan'}</span>
            </button>
          </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="vision-card p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map(room => {
            const isPinned = pinnedRoomIds.has(String(room.id));
            return (
              <div key={room.id} className="vision-card p-6 hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="vision-icon-box w-12 h-12 rounded-2xl flex-shrink-0">
                      <Home size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 text-[16px]">{room.name}</h3>
                        {isPinned && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pinned Dashboard
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{room.devices_count || 0} Perangkat terhubung</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => { setSelectedRoomId(room.id); setActiveTab('3d'); }} 
                      className="flex items-center justify-center gap-1.5 bg-primary-500/15 text-primary-400 border border-primary-500/30 hover:bg-primary-500 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    >
                      <Box size={13} /> Desain 3D
                    </button>
                    <div className="flex gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => handleTogglePinRoom(room)}
                        title={isPinned ? 'Lepas Ruangan dari Sidebar Widget' : 'Kirim Ruangan ke Sidebar Widget'}
                        className={`p-2 rounded-xl border transition-all ${
                          isPinned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20 hover:bg-amber-500/30'
                            : 'vision-inner-box text-slate-400 hover:text-amber-300 border-transparent'
                        }`}
                      >
                        <Pin size={13} className={isPinned ? 'fill-amber-400 text-amber-400' : ''} />
                      </button>
                      <button onClick={() => handleOpenModal(room)} className="p-2 vision-inner-box text-slate-400 hover:text-primary-400 rounded-xl transition-colors" title="Edit Ruangan"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(room.id)} className="p-2 vision-inner-box text-slate-400 hover:text-rose-400 rounded-xl transition-colors" title="Hapus Ruangan"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {rooms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 vision-card">
              <div className="vision-icon-box w-14 h-14 rounded-2xl mb-4">
                <Home size={28} />
              </div>
              <p className="text-slate-300 font-bold">Belum ada ruangan yang dibuat.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-800/60">
              <h2 className="text-xl font-bold text-slate-100">
                {editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">Nama Ruangan</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="misal: Ruang Tamu, Kamar Utama"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingRoom ? 'Simpan Perubahan' : 'Buat Ruangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
