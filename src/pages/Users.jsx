import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users as UsersIcon,
  Shield,
  Trash2,
  UserPlus,
  Plus,
  Search,
  X,
  RefreshCw,
  Check,
  Crown,
  Pencil,
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { userApi } from '../services/api';
import { formatBillingDate } from '../utils/billingFormat';
import Swal from 'sweetalert2';

function getInitials(name) {
  const safe = (name || 'U').trim();
  return safe
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function UserFormModal({ open, user, onClose, onSuccess }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'user',
    });
    setShowPassword(false);
    setErrorMsg('');
    setBusy(false);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const fieldStyle = {
    backgroundColor: 'rgb(var(--surface-800) / 0.45)',
    borderColor: 'rgb(var(--surface-700) / 0.75)',
    color: 'rgb(var(--surface-50))',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    if (!trimmedName) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    if (!isEdit && form.password.length < 8) {
      setErrorMsg('Kata sandi minimal harus 8 karakter.');
      return;
    }
    if (isEdit && form.password && form.password.length < 8) {
      setErrorMsg('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      role: form.role,
    };
    if (form.password) {
      payload.password = form.password;
    }

    setBusy(true);
    try {
      if (isEdit) {
        await userApi.updateById(user.id, payload);
      } else {
        await userApi.create(payload);
      }
      await onSuccess();
      onClose();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: isEdit ? 'Data pengguna diperbarui.' : 'Pengguna baru ditambahkan.',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal menyimpan data pengguna. Silakan coba lagi.'
      );
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: 'rgb(var(--surface-900))',
          borderColor: 'rgb(var(--surface-700) / 0.7)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.5)' }}
        >
          <div>
            <h2
              id="user-modal-title"
              className="text-sm font-bold"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
              {isEdit ? `Memperbarui akses untuk ${user.name}` : 'Undang anggota baru ke workspace.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup modal pengguna"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-[background-color] duration-150 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
            style={{ color: 'rgb(var(--surface-400))' }}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="user-form-name"
              className="block text-xs font-semibold"
              style={{ color: 'rgb(var(--surface-200))' }}
            >
              Nama Lengkap
            </label>
            <input
              id="user-form-name"
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full min-h-[40px] px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
              style={fieldStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-form-email"
              className="block text-xs font-semibold"
              style={{ color: 'rgb(var(--surface-200))' }}
            >
              Alamat Email
            </label>
            <input
              id="user-form-email"
              type="email"
              placeholder="nama@perusahaan.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full min-h-[40px] px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
              style={fieldStyle}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-form-password"
              className="block text-xs font-semibold"
              style={{ color: 'rgb(var(--surface-200))' }}
            >
              {isEdit ? 'Kata Sandi Baru' : 'Kata Sandi'}{' '}
              {isEdit && (
                <span className="font-normal" style={{ color: 'rgb(var(--surface-400))' }}>
                  (opsional)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="user-form-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 8 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full min-h-[40px] pl-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center"
                style={{ color: 'rgb(var(--surface-400))' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <span
              className="block text-xs font-semibold"
              style={{ color: 'rgb(var(--surface-200))' }}
            >
              Peran Akses
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'user',
                  label: 'Standard User',
                  desc: 'Kelola device sendiri',
                },
                {
                  id: 'admin',
                  label: 'Administrator',
                  desc: 'Akses penuh & kelola tim',
                },
              ].map((roleOpt) => {
                const active = form.role === roleOpt.id;
                return (
                  <button
                    key={roleOpt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm({ ...form, role: roleOpt.id })}
                    className="p-2.5 rounded-lg border text-left transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                    style={{
                      backgroundColor: active
                        ? 'rgb(var(--primary-500) / 0.1)'
                        : 'rgb(var(--surface-800) / 0.3)',
                      borderColor: active
                        ? 'rgb(var(--primary-500))'
                        : 'rgb(var(--surface-700) / 0.6)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'rgb(var(--surface-50))' }}
                      >
                        {roleOpt.label}
                      </span>
                      {active && (
                        <Check size={13} style={{ color: 'rgb(var(--primary-400))' }} />
                      )}
                    </div>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      {roleOpt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium"
              style={{
                backgroundColor: 'rgb(244 63 94 / 0.08)',
                borderColor: 'rgb(244 63 94 / 0.3)',
                color: 'rgb(251 113 133)',
              }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div
            className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="min-h-[40px] px-4 rounded-lg text-xs font-semibold border transition-[background-color] duration-150 disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'rgb(var(--surface-700) / 0.7)',
                color: 'rgb(var(--surface-200))',
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: 'rgb(var(--primary-500))' }}
            >
              {busy ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                'Simpan Perubahan'
              ) : (
                'Buat Akun'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalUser, setModalUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorState, setErrorState] = useState(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('iot_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setErrorState(null);

    try {
      const res = await userApi.list();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const status = err?.response?.status;
      setErrorState({
        forbidden: status === 403,
        message:
          status === 403
            ? 'Halaman manajemen anggota hanya dapat diakses oleh akun Administrator.'
            : err?.response?.data?.message ||
              'Gagal memuat daftar pengguna. Periksa koneksi server dan coba lagi.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleOpenCreate = () => {
    setModalUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (targetUser) => {
    setModalUser(targetUser);
    setModalOpen(true);
  };

  const handleDelete = (targetUser) => {
    if (targetUser.id === currentUser.id) return;

    Swal.fire({
      title: `Hapus ${targetUser.name}?`,
      text: 'Akun beserta aksesnya akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await userApi.delete(targetUser.id);
        setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Akun ${targetUser.name} dihapus.`,
          showConfirmButton: false,
          timer: 2000,
        });
      } catch (err) {
        Swal.fire({
          title: 'Gagal Menghapus',
          text: err?.response?.data?.message || err?.message || 'Terjadi kesalahan.',
          icon: 'error',
        });
      }
    });
  };

  const adminCount = useMemo(
    () => users.filter((u) => u.role === 'admin').length,
    [users]
  );
  const standardCount = users.length - adminCount;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      if (!matchesRole) return false;
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  if (!loading && errorState?.forbidden) {
    return (
      <div className="max-w-md mx-auto py-16">
        <div className="ops-surface p-7 text-center space-y-4">
          <div
            className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center"
            style={{
              backgroundColor: 'rgb(244 63 94 / 0.1)',
              color: 'rgb(251 113 133)',
            }}
          >
            <Lock size={18} />
          </div>
          <div className="space-y-1">
            <h1
              className="text-base font-bold"
              style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
            >
              Akses Terbatas
            </h1>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
            >
              {errorState.message}
            </p>
          </div>
          <Link
            to="/app/dashboard"
            className="min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5"
            style={{ backgroundColor: 'rgb(var(--primary-500))' }}
          >
            <ArrowLeft size={14} />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 max-w-6xl mx-auto">
      {/* Compact Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
          >
            Pengguna
          </h1>
          <p
            className="text-xs"
            style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
          >
            Kelola anggota workspace dan peran akses platform IoT.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="self-start sm:self-auto min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-[filter,transform] duration-150 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-400))]"
          style={{ backgroundColor: 'rgb(var(--primary-500))' }}
        >
          <Plus size={15} />
          Tambah Pengguna
        </button>
      </div>

      {/* Error Recovery */}
      {errorState && !errorState.forbidden && (
        <div
          role="alert"
          className="ops-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ borderColor: 'rgb(244 63 94 / 0.4)' }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorState.message}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="min-h-[36px] px-3.5 rounded-lg text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: 'rgb(var(--primary-500))' }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Unified Table Surface */}
      <div className="ops-surface overflow-hidden">
        {/* Toolbar */}
        <div
          className="px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3"
          style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
        >
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'rgb(var(--surface-400))' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              aria-label="Cari pengguna"
              className="w-full min-h-[38px] pl-9 pr-8 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.4)',
                borderColor: 'rgb(var(--surface-700) / 0.65)',
                color: 'rgb(var(--surface-50))',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded flex items-center justify-center"
                style={{ color: 'rgb(var(--surface-400))' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2">
            <div
              role="tablist"
              aria-label="Filter Peran"
              className="inline-flex p-0.5 rounded-lg border"
              style={{
                backgroundColor: 'rgb(var(--surface-800) / 0.45)',
                borderColor: 'rgb(var(--surface-700) / 0.6)',
              }}
            >
              {[
                { id: 'all', label: `Semua (${users.length})` },
                { id: 'admin', label: `Admin (${adminCount})` },
                { id: 'user', label: `User (${standardCount})` },
              ].map((pill) => {
                const active = roleFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setRoleFilter(pill.id)}
                    className="min-h-[32px] px-2.5 rounded-md text-[11px] font-semibold tabular-nums transition-[background-color,color] duration-150"
                    style={{
                      backgroundColor: active
                        ? 'rgb(var(--surface-700) / 0.85)'
                        : 'transparent',
                      color: active ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              aria-label="Muat ulang daftar pengguna"
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-[background-color,transform] duration-150 active:scale-95 disabled:opacity-50"
              style={{
                borderColor: 'rgb(var(--surface-700) / 0.6)',
                color: 'rgb(var(--surface-300))',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-4 space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg"
                style={{ backgroundColor: 'rgb(var(--surface-800) / 0.45)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <UsersIcon
              size={24}
              className="mx-auto"
              style={{ color: 'rgb(var(--surface-500))' }}
            />
            <div className="space-y-1">
              <div
                className="text-sm font-semibold"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {search || roleFilter !== 'all'
                  ? 'Tidak ada pengguna yang cocok'
                  : 'Belum ada anggota tim'}
              </div>
              <p
                className="text-xs max-w-sm mx-auto"
                style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
              >
                {search || roleFilter !== 'all'
                  ? 'Coba ubah kata kunci pencarian atau filter peran.'
                  : 'Tambahkan anggota pertama untuk mengakses workspace ini.'}
              </p>
            </div>
            {search || roleFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('all');
                }}
                className="min-h-[36px] px-3.5 rounded-lg border text-xs font-semibold"
                style={{
                  borderColor: 'rgb(var(--surface-700) / 0.7)',
                  color: 'rgb(var(--surface-200))',
                }}
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="min-h-[36px] px-3.5 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5"
                style={{ backgroundColor: 'rgb(var(--primary-500))' }}
              >
                <Plus size={14} />
                Tambah Pengguna
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Compact List */}
            <div
              className="divide-y sm:hidden"
              style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}
            >
              {filtered.map((user) => {
                const isAdmin = user.role === 'admin';
                const isSelf = user.id === currentUser.id;
                return (
                  <div key={user.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                        style={{
                          backgroundColor: 'rgb(var(--surface-800))',
                          color: 'rgb(var(--surface-200))',
                          outline: '1px solid rgba(255,255,255,0.08)',
                          outlineOffset: '-1px',
                        }}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs font-semibold truncate"
                            style={{ color: 'rgb(var(--surface-50))' }}
                          >
                            {user.name}
                          </span>
                          {isSelf && (
                            <span
                              className="text-[10px] font-semibold"
                              style={{ color: 'rgb(var(--primary-400))' }}
                            >
                              • Anda
                            </span>
                          )}
                        </div>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: 'rgb(var(--surface-400))' }}
                        >
                          {user.email}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold ${
                            isAdmin ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isAdmin ? <Crown size={10} /> : <Shield size={10} />}
                          {isAdmin ? 'Administrator' : 'Standard User'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-[background-color] duration-150 hover:bg-slate-500/10"
                        style={{ color: 'rgb(var(--surface-300))' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => handleDelete(user)}
                        aria-label={isSelf ? 'Akun sendiri' : `Hapus ${user.name}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-[background-color] duration-150 hover:bg-rose-500/10 disabled:opacity-30"
                        style={{ color: 'rgb(251 113 133)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Clean Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      borderColor: 'rgb(var(--surface-700) / 0.45)',
                      color: 'rgb(var(--surface-400))',
                    }}
                  >
                    <th className="py-2.5 pl-4 pr-4">Pengguna</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Peran</th>
                    <th className="py-2.5 px-4">Bergabung</th>
                    <th className="py-2.5 pl-4 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y text-xs"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.35)' }}
                >
                  {filtered.map((user) => {
                    const isAdmin = user.role === 'admin';
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr
                        key={user.id}
                        className="group transition-[background-color] duration-150 hover:bg-slate-500/[0.06]"
                      >
                        <td className="py-3 pl-4 pr-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
                              style={{
                                backgroundColor: 'rgb(var(--surface-800))',
                                color: 'rgb(var(--surface-200))',
                                outline: '1px solid rgba(255,255,255,0.08)',
                                outlineOffset: '-1px',
                              }}
                            >
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="font-semibold"
                                style={{ color: 'rgb(var(--surface-50))' }}
                              >
                                {user.name}
                              </span>
                              {isSelf && (
                                <span
                                  className="text-[11px] font-medium"
                                  style={{ color: 'rgb(var(--primary-400))' }}
                                >
                                  (Anda)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td
                          className="py-3 px-4 whitespace-nowrap"
                          style={{ color: 'rgb(var(--surface-300))' }}
                        >
                          {user.email}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              isAdmin ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                            style={{
                              backgroundColor: isAdmin
                                ? 'rgb(245 158 11 / 0.1)'
                                : 'rgb(16 185 129 / 0.1)',
                            }}
                          >
                            {isAdmin ? <Crown size={11} /> : <Shield size={11} />}
                            {isAdmin ? 'Administrator' : 'Standard User'}
                          </span>
                        </td>

                        <td
                          className="py-3 px-4 whitespace-nowrap tabular-nums"
                          style={{ color: 'rgb(var(--surface-400))' }}
                        >
                          {formatBillingDate(user.created_at)}
                        </td>

                        <td className="py-3 pl-4 pr-4 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(user)}
                              title={`Edit ${user.name}`}
                              aria-label={`Edit ${user.name}`}
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-[background-color,color] duration-150 hover:bg-slate-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                              style={{ color: 'rgb(var(--surface-300))' }}
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleDelete(user)}
                              title={
                                isSelf
                                  ? 'Tidak dapat menghapus akun sendiri'
                                  : `Hapus ${user.name}`
                              }
                              aria-label={
                                isSelf
                                  ? 'Tidak dapat menghapus akun sendiri'
                                  : `Hapus ${user.name}`
                              }
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center transition-[background-color,color] duration-150 hover:bg-rose-500/15 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              style={{ color: 'rgb(251 113 133)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <UserFormModal
        open={modalOpen}
        user={modalUser}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadData(true)}
      />
    </div>
  );
}
