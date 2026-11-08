import React, { useState, useEffect } from 'react';
import { roomsApi } from '../services/api';
import { Home, Plus, Edit2, Trash2, X, Loader2, LayoutGrid, Box } from 'lucide-react';
import Swal from 'sweetalert2';
import FloorPlan from './FloorPlan';

export default function Rooms() {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | '3d'
  const [selectedRoomId, setSelectedRoomId] = useState(null); // ID ruangan yang sedang di-edit 3D-nya
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Gagal menyimpan data.',
        background: '#0f172a',
        color: '#f1f5f9',
        confirmButtonColor: '#3b82f6'
      });
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
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 ${activeTab === '3d' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Box size={15} /> 3D Floor Plan
          </button>
        </div>
      </div>

      {activeTab === '3d' ? (
        <div className="vision-card overflow-hidden relative" style={{ height: 'calc(100vh - 180px)' }}>
          {selectedRoomId ? (
            <div className="absolute inset-0 overflow-y-auto">
              <FloorPlan hideHeader={true} roomId={selectedRoomId} roomName={rooms.find(r => r.id === selectedRoomId)?.name} key={selectedRoomId} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <div className="vision-icon-box w-14 h-14 rounded-2xl mb-4">
                <Box size={28} />
              </div>
              <p className="text-sm">Silakan pilih ruangan dari tab <strong className="text-slate-100">Data Ruangan</strong> terlebih dahulu.</p>
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
          <div className="flex justify-end">
            <button 
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2 text-xs"
            >
              <Plus size={16} />
              <span>Tambah Ruangan</span>
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
          {rooms.map(room => (
            <div key={room.id} className="vision-card p-6 hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="vision-icon-box w-12 h-12 rounded-2xl flex-shrink-0">
                    <Home size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-[16px]">{room.name}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{room.devices_count} Perangkat terhubung</p>
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
                    <button onClick={() => handleOpenModal(room)} className="p-2 vision-inner-box text-slate-400 hover:text-primary-400 rounded-xl transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(room.id)} className="p-2 vision-inner-box text-slate-400 hover:text-rose-400 rounded-xl transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
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
