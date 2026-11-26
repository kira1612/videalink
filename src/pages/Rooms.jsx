import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { roomsApi, devicesApi } from '../services/api';
import {
  Home,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ArrowLeft,
  Box,
  Pin,
  Cpu,
  ArrowUpRight,
  Search,
  Layers,
} from 'lucide-react';
import Swal from 'sweetalert2';
import FloorPlan from './FloorPlan';
import {
  PREF_KEYS,
  getUserJsonPref,
  setUserJsonPref,
  getUserScopedKey,
} from '../utils/dashboardPrefs';
import { useBillingQuota } from '../hooks/useBillingQuota';
import QuotaNoticeBanner, {
  handleQuotaError,
  promptQuotaUpgrade,
} from '../components/Billing/QuotaNoticeBanner';

/* ─────────────────────────────────────────────────────────────────────────
   Helper: Read saved 3D floor plan summary (element count & dimensions)
───────────────────────────────────────────────────────────────────────── */
function getRoomLayoutMeta(roomId) {
  try {
    const saved =
      localStorage.getItem(getUserScopedKey(`iot_layout_walls_${roomId}`)) ||
      (roomId !== 'default' ? localStorage.getItem(`iot_layout_walls_${roomId}`) : null);
    const parsed = saved ? JSON.parse(saved) : null;
    const items = [];

    const pushWall = (w, ox = 0, oz = 0, gRot = 0, gsx = 1, gsz = 1) => {
      if (!w || w.hidden || w.type === 'text_label' || w.type === 'furniture') return;
      const cosG = Math.cos(gRot);
      const sinG = Math.sin(gRot);
      const lx = (w.position?.[0] || 0) * gsx;
      const lz = (w.position?.[2] || 0) * gsz;
      items.push({
        cx: ox + lx * cosG + lz * sinG,
        cz: oz - lx * sinG + lz * cosG,
        sx: (w.scale?.[0] || 1) * gsx,
        sz: (w.scale?.[2] || 0.35) * gsz,
      });
    };

    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed.forEach((w) => {
        if (w.type === 'custom_group' && Array.isArray(w.children)) {
          const gx = w.position?.[0] || 0;
          const gz = w.position?.[2] || 0;
          const gRot = w.rotation?.[1] || 0;
          const gsx = w.scale?.[0] || 1;
          const gsz = w.scale?.[2] || 1;
          w.children.forEach((c) => pushWall(c, gx, gz, gRot, gsx, gsz));
        } else {
          pushWall(w);
        }
      });
    }

    if (items.length === 0) {
      return { segments: 4, widthM: '9.4', depthM: '9.0', isDefault: true };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    items.forEach((s) => {
      const r = Math.max(s.sx, s.sz) / 2;
      minX = Math.min(minX, s.cx - r);
      maxX = Math.max(maxX, s.cx + r);
      minZ = Math.min(minZ, s.cz - r);
      maxZ = Math.max(maxZ, s.cz + r);
    });

    return {
      segments: items.length,
      widthM: Math.max(1, maxX - minX).toFixed(1),
      depthM: Math.max(1, maxZ - minZ).toFixed(1),
      isDefault: false,
    };
  } catch {
    return { segments: 4, widthM: '9.4', depthM: '9.0', isDefault: true };
  }
}

export default function Rooms() {
  const navigate = useNavigate();
  const { refreshQuota, getResourceQuota } = useBillingQuota();
  const roomQuota = getResourceQuota('rooms');
  const [activeTab, setActiveTab] = useState('list'); // 'list' | '3d'
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    const safeName = room?.name && !room.name.includes('undefined') ? room.name : 'Ruangan 3D';

    try {
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
        ? `Ruangan "${safeName}" dilepas dari Dashboard`
        : `Ruangan "${safeName}" disematkan ke Dashboard`,
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

  const fetchRooms = useCallback(async () => {
    try {
      const [roomsRes, devicesRes] = await Promise.allSettled([
        roomsApi.list(),
        devicesApi.list(),
      ]);
      if (roomsRes.status === 'fulfilled') {
        setRooms(Array.isArray(roomsRes.value.data) ? roomsRes.value.data : []);
      }
      if (devicesRes.status === 'fulfilled') {
        const list = Array.isArray(devicesRes.value.data)
          ? devicesRes.value.data
          : devicesRes.value.data?.data || [];
        setDevices(list);
      }
      refreshQuota();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [refreshQuota]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const devicesByRoom = useMemo(() => {
    const map = new Map();
    devices.forEach((dev) => {
      if (dev?.room_id == null) return;
      const key = String(dev.room_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(dev);
    });
    return map;
  }, [devices]);

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
        title: editingRoom ? 'Perubahan ruangan disimpan' : 'Ruangan baru berhasil dibuat',
        showConfirmButton: false,
        timer: 2500,
        background: '#0f172a',
        color: '#f1f5f9',
        iconColor: '#10b981',
      });
    } catch (err) {
      if (!handleQuotaError(err, navigate, handleCloseModal)) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menyimpan',
          text: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data ruangan.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#3b82f6',
        });
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus ruangan ini?',
      text: 'Data ruangan beserta relasinya akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      background: '#0f172a',
      color: '#f1f5f9',
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
          timer: 2500,
          background: '#0f172a',
          color: '#f1f5f9',
          iconColor: '#10b981',
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: 'Terjadi kesalahan saat menghapus ruangan.',
          background: '#0f172a',
          color: '#f1f5f9',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const openRoom3D = (roomId) => {
    setSelectedRoomId(roomId);
    setActiveTab('3d');
  };

  const totalConnectedDevices = useMemo(
    () => rooms.reduce((sum, r) => sum + Number(r.devices_count || 0), 0),
    [rooms]
  );

  const onlineLinkedDevices = useMemo(() => {
    let count = 0;
    rooms.forEach((r) => {
      const list = devicesByRoom.get(String(r.id)) || [];
      count += list.filter((d) => d.status === 'online').length;
    });
    return count;
  }, [rooms, devicesByRoom]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) => String(r.name || '').toLowerCase().includes(q));
  }, [rooms, searchQuery]);

  const quotaLabel =
    roomQuota?.limit === -1 || roomQuota?.limit == null
      ? `${rooms.length} / ∞`
      : `${roomQuota.current ?? rooms.length} / ${roomQuota.limit}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px]">
      {/* ── 1. HEADER (Matches Devices & Buckets Design) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-1.5 h-7 rounded-full flex-shrink-0"
              style={{
                background: 'linear-gradient(to bottom, rgb(var(--primary-400)), rgb(var(--primary-700)))',
              }}
            />
            <h1 className="text-[22px] font-black text-slate-100 tracking-tight">
              Manajemen Ruangan
            </h1>
            {!loading && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500 tabular-nums">
                {rooms.length}
              </span>
            )}
          </div>
          <p className="text-[13px] text-slate-500 ml-4">
            Kelola daftar ruangan, pantau perangkat IoT, dan rancang denah 3D Anda
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {activeTab === '3d' ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                fetchRooms();
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 font-bold text-[13px] transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Kembali ke Daftar</span>
            </button>
          ) : (
            !roomQuota.blocked && (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))',
                  boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)',
                }}
              >
                <Plus size={16} />
                <span>Ruangan Baru</span>
              </button>
            )
          )}
        </div>
      </div>

      {activeTab === '3d' ? (
        <div
          className="vision-card overflow-hidden relative flex flex-col border border-slate-700/80 rounded-2xl shadow-xl"
          style={{ height: 'calc(100vh - 170px)', minHeight: '620px' }}
        >
          {(selectedRoomId || (rooms.length > 0 ? rooms[0].id : null)) ? (() => {
            const activeRoomId = selectedRoomId || rooms[0].id;
            const activeRoomObj = rooms.find((r) => String(r.id) === String(activeRoomId)) || rooms[0];
            return (
              <div className="flex-1 relative overflow-hidden">
                <FloorPlan
                  hideHeader={true}
                  roomId={activeRoomId}
                  roomName={activeRoomObj?.name || 'Ruangan 3D'}
                  roomsList={rooms}
                  onSelectRoom={(id) => setSelectedRoomId(Number(id) || id)}
                  isPinned={pinnedRoomIds.has(String(activeRoomId))}
                  onTogglePin={() => activeRoomObj && handleTogglePinRoom(activeRoomObj)}
                  onBackToList={() => {
                    setActiveTab('list');
                    fetchRooms();
                  }}
                  key={activeRoomId}
                />
              </div>
            );
          })() : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-center mb-4 text-primary-400">
                <Box size={26} />
              </div>
              <p className="text-sm font-semibold text-slate-200">Belum ada ruangan untuk ditampilkan di 3D</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Buat ruangan pertama Anda di Daftar Ruangan untuk mulai menyusun denah dan menaruh sensor IoT.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="mt-4 btn-primary text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Kembali ke Daftar Ruangan
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <QuotaNoticeBanner quota={roomQuota} />

          {/* ── 2. CLEAN ROOM LIST TABLE ── */}
          <div className="rounded-2xl bg-slate-900 border border-slate-700/75 shadow-sm overflow-hidden">
            {/* List Toolbar (Search when > 1 room) */}
            {rooms.length > 1 && (
              <div className="px-5 py-3.5 border-b border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-xs">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari ruangan..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/60 border border-slate-700/70 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium tabular-nums">
                  Menampilkan {filteredRooms.length} dari {rooms.length} ruangan
                </span>
              </div>
            )}

            {/* Desktop Column Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 border-b border-slate-700/60 bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-4">Ruangan</div>
              <div className="col-span-4">Perangkat IoT</div>
              <div className="col-span-2">Denah 3D</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>

            {loading ? (
              <div className="divide-y divide-slate-700/60">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-slate-800" />
                        <div className="h-3 w-20 rounded bg-slate-800/70" />
                      </div>
                    </div>
                    <div className="h-8 w-28 rounded-xl bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="divide-y divide-slate-700/60">
                {filteredRooms.map((room) => {
                  const isPinned = pinnedRoomIds.has(String(room.id));
                  const roomDevices = devicesByRoom.get(String(room.id)) || [];
                  const devCount = Math.max(Number(room.devices_count || 0), roomDevices.length);
                  const layoutMeta = getRoomLayoutMeta(room.id);

                  return (
                    <div
                      key={room.id}
                      className="group px-5 py-4 hover:bg-slate-800/35 transition-colors grid grid-cols-1 md:grid-cols-12 items-center gap-4"
                    >
                      {/* Col 1: Room Name & Pin Badge */}
                      <div className="md:col-span-4 flex items-center gap-3.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => openRoom3D(room.id)}
                          className="w-10 h-10 rounded-xl bg-primary-500/12 border border-primary-500/25 group-hover:bg-primary-500 group-hover:text-white text-primary-400 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          title={`Buka denah 3D ${room.name}`}
                        >
                          <Home size={18} />
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openRoom3D(room.id)}
                              className="font-bold text-sm text-slate-100 hover:text-primary-400 transition-colors truncate cursor-pointer text-left"
                            >
                              {room.name}
                            </button>
                            {isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                <Pin size={9} className="fill-amber-400" />
                                Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 tabular-nums md:hidden">
                            {devCount} perangkat · {layoutMeta.widthM} × {layoutMeta.depthM} m
                          </p>
                        </div>
                      </div>

                      {/* Col 2: Connected IoT Devices */}
                      <div className="md:col-span-4 flex flex-wrap items-center gap-1.5 min-w-0">
                        {roomDevices.length > 0 ? (
                          <>
                            {roomDevices.slice(0, 3).map((dev) => {
                              const isOnline = dev.status === 'online';
                              return (
                                <Link
                                  key={dev.id}
                                  to={`/app/devices/${dev.id}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-700/70 hover:border-primary-500/40 text-xs font-medium text-slate-200 transition-colors max-w-[165px]"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                                    }`}
                                  />
                                  <span className="truncate">{dev.name}</span>
                                </Link>
                              );
                            })}
                            {roomDevices.length > 3 && (
                              <span className="px-2 py-1 rounded-lg bg-slate-800/80 text-[11px] font-bold text-slate-400 tabular-nums">
                                +{roomDevices.length - 3}
                              </span>
                            )}
                          </>
                        ) : devCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium tabular-nums">
                            <Cpu size={13} className="text-primary-400" />
                            {devCount} perangkat terhubung
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Belum ada perangkat</span>
                        )}
                      </div>

                      {/* Col 3: Floor Plan Meta */}
                      <div className="hidden md:flex md:col-span-2 items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                        <Layers size={13} className="text-slate-500 shrink-0" />
                        <span>
                          {layoutMeta.widthM}×{layoutMeta.depthM}m
                        </span>
                        <span className="text-slate-600">·</span>
                        <span>{layoutMeta.segments} seg</span>
                      </div>

                      {/* Col 4: Actions */}
                      <div className="md:col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openRoom3D(room.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/12 hover:bg-primary-500 text-primary-400 hover:text-white border border-primary-500/25 hover:border-primary-500 text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          <Box size={13} />
                          <span>3D</span>
                          <ArrowUpRight size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePinRoom(room)}
                          title={isPinned ? 'Lepas dari Dashboard' : 'Sematkan ke Dashboard'}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            isPinned
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/35 hover:bg-amber-500/25'
                              : 'bg-slate-800/70 text-slate-400 hover:text-amber-400 border-slate-700/70'
                          }`}
                        >
                          <Pin size={13} className={isPinned ? 'fill-amber-400' : ''} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenModal(room)}
                          title="Edit Nama Ruangan"
                          className="w-8 h-8 rounded-lg bg-slate-800/70 border border-slate-700/70 text-slate-400 hover:text-primary-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(room.id)}
                          title="Hapus Ruangan"
                          className="w-8 h-8 rounded-lg bg-slate-800/70 border border-slate-700/70 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/70 flex items-center justify-center text-primary-400 mb-3">
                  <Home size={22} />
                </div>
                <p className="text-slate-100 font-bold text-sm">
                  {searchQuery.trim() ? 'Ruangan tidak ditemukan' : 'Belum ada ruangan'}
                </p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm">
                  {searchQuery.trim()
                    ? `Tidak ada ruangan yang cocok dengan "${searchQuery}".`
                    : 'Tambahkan ruangan pertama untuk mulai menyusun denah 3D dan menautkan perangkat IoT.'}
                </p>
                {!searchQuery.trim() && !roomQuota.blocked && (
                  <button
                    type="button"
                    onClick={() => handleOpenModal()}
                    className="mt-4 btn-primary inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-bold cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Buat Ruangan Pertama</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── 3. CREATE / EDIT ROOM MODAL ── */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 !mt-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/70">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-100">
                      {editingRoom ? 'Ubah Nama Ruangan' : 'Buat Ruangan Baru'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {editingRoom
                        ? 'Perbarui identitas ruangan pada denah 3D dan daftar perangkat.'
                        : 'Ruangan baru otomatis siap dirancang di 3D Floor Plan.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nama Ruangan
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Ruang Tamu, Lab Sensor, Gudang Utama"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-700/70">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary px-5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      <span>{editingRoom ? 'Simpan Perubahan' : 'Buat Ruangan'}</span>
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
