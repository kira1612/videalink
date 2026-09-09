import { useState, useEffect } from 'react';
import { User, Key, Bell, Shield, Save, Eye, EyeOff, Copy, RefreshCw, Check, Globe } from 'lucide-react';
import { userApi } from '../services/api';
import Swal from 'sweetalert2';

// ─── Common timezone list ────────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'Pacific/Midway',      label: '(UTC-11:00) Midway Island' },
  { value: 'Pacific/Honolulu',    label: '(UTC-10:00) Hawaii' },
  { value: 'America/Anchorage',   label: '(UTC-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Denver',      label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Chicago',     label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/New_York',    label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'America/Caracas',     label: '(UTC-04:30) Venezuela' },
  { value: 'America/Halifax',     label: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'America/Sao_Paulo',   label: '(UTC-03:00) Brasilia' },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores',     label: '(UTC-01:00) Azores' },
  { value: 'UTC',                 label: '(UTC+00:00) UTC / London' },
  { value: 'Europe/Paris',        label: '(UTC+01:00) Central European Time' },
  { value: 'Europe/Helsinki',     label: '(UTC+02:00) Eastern European Time' },
  { value: 'Europe/Moscow',       label: '(UTC+03:00) Moscow' },
  { value: 'Asia/Tehran',         label: '(UTC+03:30) Tehran' },
  { value: 'Asia/Dubai',          label: '(UTC+04:00) Abu Dhabi, Muscat' },
  { value: 'Asia/Kabul',          label: '(UTC+04:30) Kabul' },
  { value: 'Asia/Karachi',        label: '(UTC+05:00) Islamabad, Karachi' },
  { value: 'Asia/Kolkata',        label: '(UTC+05:30) Mumbai, New Delhi' },
  { value: 'Asia/Kathmandu',      label: '(UTC+05:45) Kathmandu' },
  { value: 'Asia/Dhaka',          label: '(UTC+06:00) Dhaka, Astana' },
  { value: 'Asia/Rangoon',        label: '(UTC+06:30) Yangon (Rangoon)' },
  { value: 'Asia/Bangkok',        label: '(UTC+07:00) Bangkok, Hanoi' },
  { value: 'Asia/Jakarta',        label: '(UTC+07:00) Jakarta, WIB' },
  { value: 'Asia/Hong_Kong',      label: '(UTC+08:00) Beijing, Hong Kong, Singapore' },
  { value: 'Asia/Makassar',       label: '(UTC+08:00) Makassar, WITA' },
  { value: 'Asia/Tokyo',          label: '(UTC+09:00) Tokyo, Seoul' },
  { value: 'Asia/Jayapura',       label: '(UTC+09:00) Jayapura, WIT' },
  { value: 'Australia/Sydney',    label: '(UTC+10:00) Sydney, Melbourne' },
  { value: 'Pacific/Auckland',    label: '(UTC+12:00) Auckland, Wellington' },
];

function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
          <Icon size={15} className="text-cyan-400" />
        </div>
        <h3 className="font-semibold text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('iot_user');
    return saved ? JSON.parse(saved) : { name: 'Admin', email: '', role: 'Administrator', timezone: 'Asia/Jakarta' };
  });

  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
  });
  const [timezone, setTimezone] = useState(currentUser.timezone || 'Asia/Jakarta');
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '' });
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);
  const [passSaved, setPassSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tzLoading, setTzLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    deviceOffline: true,
    deviceOnline: false,
    highTemperature: true,
    endpointTrigger: true,
    weeklyReport: false,
  });

  const token = localStorage.getItem('iot_token') || 'No token found';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await userApi.update(profile);
      const updatedUser = { ...currentUser, name: res.data.name, email: res.data.email };
      setCurrentUser(updatedUser);
      localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Profile saved!', showConfirmButton: false,
        timer: 2000, timerProgressBar: true,
        background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Failed to update profile', background: '#1e293b', color: '#e2e8f0' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTimezone = async () => {
    setTzLoading(true);
    try {
      const res = await userApi.update({ timezone });
      const updatedUser = { ...currentUser, timezone: res.data.timezone ?? timezone };
      setCurrentUser(updatedUser);
      localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 2500);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Timezone updated!', showConfirmButton: false,
        timer: 2000, timerProgressBar: true,
        background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Failed to update timezone', background: '#1e293b', color: '#e2e8f0' });
    } finally {
      setTzLoading(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      await userApi.updatePassword(passwordForm);
      setPasswordForm({ current_password: '', password: '' });
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 2500);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Password updated!', showConfirmButton: false,
        timer: 2000, timerProgressBar: true,
        background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Failed to update password', background: '#1e293b', color: '#e2e8f0' });
    }
  };

  // Live preview of current time in selected timezone
  const [previewTime, setPreviewTime] = useState('');
  useEffect(() => {
    const update = () => {
      try {
        setPreviewTime(new Intl.DateTimeFormat('id-ID', {
          timeZone: timezone,
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
          year: 'numeric', month: 'short', day: 'numeric',
        }).format(new Date()));
      } catch { setPreviewTime('Invalid timezone'); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Settings</h2>
        <p className="text-slate-500 text-sm">Manage your account and platform preferences</p>
      </div>

      {/* Profile */}
      <SettingsSection title="Profile" icon={User}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="font-medium text-slate-100">{profile.name}</p>
            <p className="text-sm text-slate-500">{currentUser.role || 'Administrator'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="settings-name">Full Name</label>
            <input
              id="settings-name"
              className="input-field"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="settings-email">Email Address</label>
            <input
              id="settings-email"
              type="email"
              className="input-field"
              value={profile.email}
              onChange={e => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            id="btn-save-profile"
            onClick={handleSaveProfile}
            disabled={loading}
            className={`flex items-center gap-2 transition-all px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-70
              ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-primary'}`}
          >
            {loading
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
              : saved ? <><Check size={14} /> Saved!</>
              : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </SettingsSection>

      {/* Preferences — Timezone */}
      <SettingsSection title="Preferences" icon={Globe}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Timezone</label>
            <p className="text-xs text-slate-500 mb-3">
              Semua timestamp data IoT (Raw Records, grafik) akan ditampilkan dalam zona waktu yang Anda pilih.
            </p>
            <select
              className="input-field w-full appearance-none"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Live preview */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Globe size={15} className="text-cyan-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Waktu saat ini di zona yang dipilih</p>
              <p className="text-sm font-mono text-cyan-300">{previewTime}</p>
            </div>
          </div>

          <button
            onClick={handleSaveTimezone}
            disabled={tzLoading}
            className={`flex items-center gap-2 transition-all px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-70
              ${tzSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-primary'}`}
          >
            {tzLoading
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
              : tzSaved ? <><Check size={14} /> Saved!</>
              : <><Save size={14} /> Save Timezone</>}
          </button>
        </div>
      </SettingsSection>

      {/* API Token */}
      <SettingsSection title="API Token" icon={Key}>
        <p className="text-sm text-slate-400 mb-4">
          Use this token to authenticate your IoT devices with the platform API.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              id="api-token-field"
              type={showToken ? 'text' : 'password'}
              readOnly
              value={token}
              className="input-field pr-10 font-mono text-sm bg-slate-900"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button
            id="btn-copy-token"
            onClick={handleCopyToken}
            className={`btn-secondary flex items-center gap-2 px-4 transition-all ${copied ? 'text-emerald-400' : ''}`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="btn-secondary flex items-center gap-2 px-4" title="Regenerate token">
            <RefreshCw size={15} />
          </button>
        </div>
        <p className="text-xs text-slate-600 mt-2">Keep this token secret. Regenerate if compromised.</p>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection title="Notifications" icon={Bell}>
        <div className="space-y-4">
          {[
            { key: 'deviceOffline',   label: 'Device goes offline',     desc: 'Get notified when a device loses connection' },
            { key: 'deviceOnline',    label: 'Device comes online',      desc: 'Get notified when a device connects' },
            { key: 'highTemperature', label: 'High temperature alert',   desc: 'Alert when temperature exceeds threshold' },
            { key: 'endpointTrigger', label: 'Endpoint triggered',       desc: 'Notify when an endpoint is activated' },
            { key: 'weeklyReport',    label: 'Weekly report',            desc: 'Receive a weekly summary of your platform' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`transition-colors ${notifications[key] ? 'text-cyan-400' : 'text-slate-600'}`}
              >
                {notifications[key]
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="16" cy="12" r="2" fill="currentColor"/></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="8" cy="12" r="2" fill="currentColor"/></svg>
                }
              </button>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Security */}
      <SettingsSection title="Security" icon={Shield}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={passwordForm.password}
                onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
              />
            </div>
          </div>
          <button
            onClick={handleSavePassword}
            className={`flex items-center gap-2 transition-all px-4 py-2 rounded-lg text-sm
              ${passSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-secondary'}`}
          >
            {passSaved ? <><Check size={14} /> Password Updated</> : <><Shield size={14} /> Update Password</>}
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
