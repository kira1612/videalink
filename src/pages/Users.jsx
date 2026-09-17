import { useState, useEffect, useRef } from 'react';
import { userApi } from '../services/api';
import {
  Users as UsersIcon, Shield, Trash2, UserPlus, Plus,
  Search, X, RefreshCw, MoreVertical, Check, Mail, Crown, Pencil
} from 'lucide-react';
import Swal from 'sweetalert2';

/* ────────────────────────────────────────────────────────────────────────
   USER ROW (Table row with dropdown actions)
──────────────────────────────────────────────────────────────────────── */
function UserRow({ user, currentUserId, onDelete, onEdit, activeDropdown, setActiveDropdown }) {
  const dropRef = useRef(null);
  const isOpen  = activeDropdown === user.id;

  useEffect(() => {
    if (!isOpen) return;
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setActiveDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  const isAdmin = user.role === 'admin';
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/25 transition-colors">
      {/* Avatar */}
      <div
        className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-slate-200 overflow-hidden"
        style={{ background: 'rgb(var(--primary-500)/0.12)', border: '1px solid rgb(var(--primary-500)/0.18)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
        {initials}
      </div>

      {/* Name */}
      <div className="flex-1 sm:w-44 sm:flex-none min-w-0">
        <p className="text-[13px] font-bold text-slate-200 truncate group-hover:text-primary-400 transition-colors"
           style={{}}
           onMouseEnter={e => e.currentTarget.style.color = 'rgb(var(--primary-400))'}
           onMouseLeave={e => e.currentTarget.style.color = ''}
        >
          {user.name}
        </p>
        <p className="text-[11px] text-slate-600 truncate flex items-center gap-1">
          <Mail size={10} style={{ color: 'rgb(var(--primary-500)/0.7)' }} /> {user.email}
        </p>
      </div>

      {/* Email (wider viewport) */}
      <div className="hidden md:block flex-1 text-[12px] text-slate-400 font-medium truncate">{user.email}</div>

      {/* Role Badge */}
      <div className="hidden sm:block flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
          isAdmin
            ? 'text-rose-400'
            : 'text-emerald-400'
        }`}
          style={{
            background: isAdmin ? 'rgba(244,63,94,0.1)' : 'rgba(52,211,153,0.08)',
            border: isAdmin ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(52,211,153,0.2)',
          }}
        >
          {isAdmin ? <Crown size={11} /> : <UserPlus size={11} />}
          {isAdmin ? 'Administrator' : 'Standard User'}
        </span>
      </div>

      {/* Actions dropdown */}
      <div className="relative flex-shrink-0 ml-auto" ref={dropRef}>
        <button
          onClick={e => { e.stopPropagation(); setActiveDropdown(isOpen ? null : user.id); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all"
          title="Actions"
        >
          <MoreVertical size={14} />
        </button>
        {isOpen && (
          <div
            className="absolute right-0 top-8 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden py-1"
            style={{ animation: 'fadeInDown .1s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { onEdit(user); setActiveDropdown(null); }}
              className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Pencil size={13} className="text-primary-400" /> Edit User
            </button>
            {currentUserId !== user.id && (
              <>
                <div className="h-px bg-slate-800 my-1 mx-3" />
                <button
                  onClick={() => { onDelete(user.id); setActiveDropdown(null); }}
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={13} /> Delete User
                </button>
              </>
            )}
            {currentUserId === user.id && (
              <div className="px-4 py-2 text-[11px] text-slate-600 italic">Cannot delete your own account.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   EDIT USER MODAL
──────────────────────────────────────────────────────────────────────── */
function EditUserModal({ user, onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    // Remove blank password so it won't be updated
    if (!data.password) delete data.password;

    setBusy(true);
    try {
      await userApi.updateById(user.id, data);
      onSuccess();
      onClose();
      Swal.fire({ title: 'User updated!', icon: 'success', background: '#1e293b', color: '#f8fafc' });
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]"
        style={{ animation: 'fadeInDown .15s ease-out' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.2)' }}>
              <Pencil size={16} style={{ color: 'rgb(var(--primary-400))' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-100">Edit User</h2>
              <p className="text-[11px] text-slate-500">Update details for <span className="text-slate-300 font-semibold">{user.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        <form id="edit-user-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Full Name</label>
            <input name="name" type="text" defaultValue={user.name} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Email Address</label>
            <input name="email" type="email" defaultValue={user.email} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">New Password <span className="text-slate-600 font-normal">(leave blank to keep current)</span></label>
            <input name="password" type="password" placeholder="Min. 8 characters" className="input-field w-full" minLength={8} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Role</label>
            <select name="role" className="input-field w-full appearance-none" defaultValue={user.role}>
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[13px]">Cancel</button>
          <button
            type="submit" form="edit-user-form" disabled={busy}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
          >
            {busy ? <><RefreshCw size={13} className="animate-spin" /> Saving…</> : <><Check size={13} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   ADD USER MODAL
──────────────────────────────────────────────────────────────────────── */
function AddUserModal({ onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);

    if (!data.name || !data.email || !data.password) {
      return Swal.fire({ title: 'Required', text: 'Name, email, and password are required.', icon: 'warning', background: '#1e293b', color: '#f8fafc' });
    }

    setBusy(true);
    try {
      await userApi.create(data);
      onSuccess();
      onClose();
      Swal.fire({ title: 'User created!', icon: 'success', background: '#1e293b', color: '#f8fafc' });
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92vh]"
        style={{ animation: 'fadeInDown .15s ease-out' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--primary-500)/0.1)', border: '1px solid rgb(var(--primary-500)/0.2)' }}>
              <UserPlus size={16} style={{ color: 'rgb(var(--primary-400))' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-extrabold text-slate-100">Invite New User</h2>
              <p className="text-[11px] text-slate-500">Grant platform access to a new member</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form id="add-user-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Full Name <span className="text-rose-500">required</span></label>
            <input name="name" type="text" placeholder="John Doe" className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Email Address <span className="text-rose-500">required</span></label>
            <input name="email" type="email" placeholder="john@example.com" className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Password <span className="text-rose-500">required</span></label>
            <input name="password" type="password" placeholder="Min. 8 characters" className="input-field w-full" required minLength={8} />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-slate-400 mb-1.5">Role</label>
            <select name="role" className="input-field w-full appearance-none" defaultValue="user">
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[13px]">Cancel</button>
          <button
            type="submit" form="add-user-form" disabled={busy}
            className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-bold text-white rounded-xl disabled:opacity-60 transition-all"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
          >
            {busy ? <><RefreshCw size={13} className="animate-spin" /> Creating…</> : <><Check size={13} /> Create Account</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════════ */
export default function Users() {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [editingUser, setEditingUser]   = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('iot_user') || '{}');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const res = await userApi.list();
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load users. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete this user?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Delete',
      background: '#1e293b',
      color: '#f8fafc',
    }).then(async r => {
      if (!r.isConfirmed) return;
      try {
        await userApi.delete(id);
        setUsers(users.filter(u => u.id !== id));
        Swal.fire({ title: 'Deleted!', icon: 'success', background: '#1e293b', color: '#f8fafc' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: err.response?.data?.message || err.message, icon: 'error', background: '#1e293b', color: '#f8fafc' });
      }
    });
  };

  const filtered = users.filter(u =>
    (u.name  || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role  || '').toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px]">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-1.5 h-7 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(to bottom, rgb(var(--primary-400)), rgb(var(--primary-700)))' }} />
            <h1 className="text-[22px] font-black text-slate-100 tracking-tight">Team Management</h1>
            {!loading && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500">{users.length}</span>
            )}
          </div>
          <p className="text-[13px] text-slate-500 ml-4">Manage platform access, roles, and member accounts</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl text-white self-start transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary-500)), rgb(var(--primary-600)))', boxShadow: '0 4px 16px rgb(var(--primary-500)/0.35)' }}
        >
          <Plus size={16} /> Invite User
        </button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Users',    count: users.length,  dot: 'rgb(var(--primary-400))', bg: 'rgb(var(--primary-500)/0.08)', border: 'rgb(var(--primary-500)/0.18)' },
          { label: 'Administrators', count: adminCount,    dot: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
          { label: 'Standard Users', count: users.length - adminCount, dot: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)' },
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

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">{error}</div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="w-full bg-slate-800/60 border border-slate-700/60 text-[13px] text-slate-300 placeholder-slate-600 rounded-xl pl-9 pr-9 py-2.5 outline-none focus:bg-slate-800 transition-all focus:outline-none"
            onFocus={e => e.target.style.borderColor = 'rgb(var(--primary-500)/0.5)'}
            onBlur={e => e.target.style.borderColor = ''}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"><X size={13} /></button>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          <button onClick={loadData} disabled={refreshing} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800" style={{ contain: 'layout' }}>
        {/* Table Column Headers */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_auto_auto] gap-4 px-5 py-3 border-b border-slate-800/80 bg-slate-900/80">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">User</p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hidden md:block">Email</p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">Role</p>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 text-right">Actions</p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-slate-800 rounded" />
                  <div className="h-2.5 w-48 bg-slate-800/70 rounded" />
                </div>
                <div className="h-6 w-24 bg-slate-800 rounded-lg hidden sm:block" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center text-slate-500">
            <UsersIcon size={36} className="mb-3 opacity-20" />
            <p className="font-medium text-slate-400">No users found.</p>
            {search && <p className="text-sm mt-1">Try a different search term.</p>}
          </div>
        ) : (
          filtered.map(user => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={currentUser.id}
              onDelete={handleDelete}
              onEdit={setEditingUser}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
            />
          ))
        )}
      </div>

      {/* ── ADD USER MODAL ── */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSuccess={loadData} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSuccess={loadData} />}
    </div>
  );
}
