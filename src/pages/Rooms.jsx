import React, { useState, useEffect } from 'react';
import { roomsApi } from '../services/api';
import { Home, Plus, Edit2, Trash2, X, Loader2, LayoutGrid, Box } from 'lucide-react';
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
    } catch (err) {
      alert('Gagal menyimpan data.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus ruangan ini beserta relasinya?')) {
      try {
        await roomsApi.delete(id);
        fetchRooms();
      } catch (err) {
        alert('Gagal menghapus ruangan.');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Home className="text-primary-400" /> Manajemen Ruangan
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola daftar ruangan dan rancang tata letak 3D rumah Anda.</p>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutGrid size={16} /> Data Ruangan
          </button>
          <button 
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${activeTab === '3d' ? 'bg-primary-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Box size={16} /> 3D Floor Plan
          </button>
        </div>
      </div>

      {activeTab === '3d' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative" style={{ height: 'calc(100vh - 180px)' }}>
          {selectedRoomId ? (
            <div className="absolute inset-0 overflow-y-auto">
              <FloorPlan hideHeader={true} roomId={selectedRoomId} key={selectedRoomId} />
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Box size={48} className="mb-4 text-slate-700" />
              <p>Silakan pilih ruangan dari tab <strong>Data Ruangan</strong> terlebih dahulu.</p>
              <button 
                onClick={() => setActiveTab('list')}
                className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors"
              >
                Kembali ke Data Ruangan
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/20"
            >
              <Plus size={18} />
              <span>Tambah Ruangan</span>
            </button>
          </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-primary-500/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
                    <Home size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-lg">{room.name}</h3>
                    <p className="text-sm text-slate-400">{room.devices_count} Perangkat terhubung</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { setSelectedRoomId(room.id); setActiveTab('3d'); }} 
                    className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Box size={14} /> Desain 3D
                  </button>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => handleOpenModal(room)} className="p-2 bg-slate-800 text-slate-400 hover:text-primary-400 rounded-lg transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(room.id)} className="p-2 bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {rooms.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <Home size={48} className="text-slate-700 mb-4" />
              <p className="text-slate-400">Belum ada ruangan yang dibuat.</p>
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
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
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
