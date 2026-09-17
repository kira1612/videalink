import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Bell, Shield, Save, Eye, EyeOff, Copy, RefreshCw, Check, Globe, Camera, Palette, Sun, Moon } from 'lucide-react';
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
        <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
          <Icon size={15} className="text-primary-400" />
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
  const [avatar, setAvatar] = useState(currentUser.avatar || null);
  const fileInputRef = useRef(null);
  const [timezone, setTimezone] = useState(currentUser.timezone || 'Asia/Jakarta');
  const [theme, setTheme] = useState(() => {
    const userStr = localStorage.getItem('iot_user');
    const user = userStr ? JSON.parse(userStr) : {};
    return user.theme || localStorage.getItem('iot_theme') || 'cyan';
  });
  const [mode, setMode] = useState(() => {
    const userStr = localStorage.getItem('iot_user');
    const user = userStr ? JSON.parse(userStr) : {};
    return user.mode || localStorage.getItem('iot_mode') || 'dark';
  });
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'File Too Large', text: 'Please select an image under 2MB', background: '#1e293b', color: '#e2e8f0' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // In a real app we'd send multipart form data or URL to the backend
      const payload = { ...profile, avatar };
      const res = await userApi.update(payload);
      const updatedUser = { ...currentUser, name: res.data.name, email: res.data.email, avatar: res.data.avatar || avatar };
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
      // Fallback for demo if API fails
      const updatedUser = { ...currentUser, name: profile.name, email: profile.email, avatar };
      setCurrentUser(updatedUser);
      localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success',
        title: 'Profile saved locally!', showConfirmButton: false,
        timer: 2000, timerProgressBar: true,
        background: '#1e293b', color: '#e2e8f0', iconColor: '#34d399',
      });
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

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    const userStr = localStorage.getItem('iot_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.theme = newTheme;
        localStorage.setItem('iot_user', JSON.stringify(user));
        // Update DB without blocking
        userApi.update({ theme: newTheme }).catch(() => {});
      } catch (e) {}
    } else {
      localStorage.setItem('iot_theme', newTheme);
    }
    
    if (newTheme === 'cyan') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    window.dispatchEvent(new Event('theme-updated'));
  };

  const handleModeChange = async (newMode) => {
    setMode(newMode);
    const userStr = localStorage.getItem('iot_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        user.mode = newMode;
        localStorage.setItem('iot_user', JSON.stringify(user));
        // Update DB without blocking
        userApi.update({ mode: newMode }).catch(() => {});
      } catch (e) {}
    } else {
      localStorage.setItem('iot_mode', newMode);
    }

    if (newMode === 'dark') {
      document.documentElement.removeAttribute('data-mode');
    } else {
      document.documentElement.setAttribute('data-mode', newMode);
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

  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'General Profile', icon: User, desc: 'Your personal info' },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme & colors' },
    { id: 'preferences', label: 'Preferences', icon: Globe, desc: 'Localization & timezone' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Password & authentication' },
    { id: 'api', label: 'API Keys', icon: Key, desc: 'Tokens for integration' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & emails' },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Settings Sidebar Tabs */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 text-left border ${
                  isActive 
                    ? 'bg-primary-500/10 border-primary-500/30 text-primary-400 shadow-[0_0_20px_rgb(var(--primary-500)/0.1)]' 
                    : 'bg-slate-800/20 border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <div className={`mt-0.5 p-2 rounded-lg ${isActive ? 'bg-primary-500/20' : 'bg-slate-800'}`}>
                  <Icon size={18} className={isActive ? 'text-primary-400' : 'text-slate-500'} />
                </div>
                <div>
                  <h4 className={`font-semibold text-sm ${isActive ? 'text-primary-100' : 'text-slate-300'}`}>{tab.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{tab.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0 pb-10">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Personal Information" icon={User}>
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary-500/20 ring-4 ring-slate-900 overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'
                      )}
                    </div>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-primary-500/50 backdrop-blur-sm"
                      title="Change Photo"
                    >
                      <Camera size={20} className="text-white mb-1" />
                      <span className="text-[10px] font-medium text-white uppercase tracking-wider">Upload</span>
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">{profile.name}</h3>
                    <p className="text-sm text-primary-400 font-medium mb-1">{currentUser.role || 'Administrator'}</p>
                    <p className="text-sm text-slate-500">Update your photo and personal details here.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="settings-name">Full Name</label>
                    <input
                      id="settings-name"
                      className="input-field bg-slate-900/50"
                      value={profile.name}
                      onChange={e => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="settings-email">Email Address</label>
                    <input
                      id="settings-email"
                      type="email"
                      className="input-field bg-slate-900/50"
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                  <button
                    id="btn-save-profile"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className={`flex items-center gap-2 transition-all px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg disabled:opacity-70
                      ${saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10' : 'btn-primary shadow-primary-500/20'}`}
                  >
                    {loading
                      ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                      : saved ? <><Check size={16} /> Saved Successfully</>
                      : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Appearance & Theme" icon={Palette}>
                <div className="max-w-3xl">
                  <p className="text-sm text-slate-400 mb-6">
                    Customize the look and feel of your dashboard. Choose your color mode and preferred accent color below. The interface will update immediately.
                  </p>

                  <h4 className="text-sm font-semibold text-slate-300 mb-4">Color Mode</h4>
                  <div className="flex gap-4 mb-8">
                    <button
                      onClick={() => handleModeChange('dark')}
                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                        mode === 'dark'
                          ? 'bg-slate-800/80 border-primary-500/50 shadow-[0_0_15px_rgb(var(--primary-500)/0.15)] text-primary-400'
                          : 'bg-slate-900/50 border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Moon size={20} />
                      <span className="font-medium">Dark Mode</span>
                    </button>
                    <button
                      onClick={() => handleModeChange('light')}
                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                        mode === 'light'
                          ? 'bg-slate-800/80 border-primary-500/50 shadow-[0_0_15px_rgb(var(--primary-500)/0.15)] text-primary-400'
                          : 'bg-slate-900/50 border-transparent hover:bg-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <Sun size={20} />
                      <span className="font-medium">Light Mode</span>
                    </button>
                  </div>
                  
                  <h4 className="text-sm font-semibold text-slate-300 mb-4">Accent Color</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                    {[
                      { id: 'cyan', name: 'Cyan', color: 'bg-cyan-500' },
                      { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500' },
                      { id: 'violet', name: 'Violet', color: 'bg-violet-500' },
                      { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
                      { id: 'amber', name: 'Amber', color: 'bg-amber-500' },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                          theme === t.id
                            ? 'bg-slate-800/80 border-primary-500/50 shadow-[0_0_15px_rgb(var(--primary-500)/0.15)]'
                            : 'bg-slate-900/50 border-transparent hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full mb-3 shadow-lg ${t.color} ${theme === t.id ? 'ring-4 ring-slate-900 ring-offset-2 ring-offset-primary-500/50' : ''}`} />
                        <span className={`text-sm font-medium ${theme === t.id ? 'text-primary-400' : 'text-slate-400'}`}>
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="p-5 rounded-xl border border-primary-500/20 bg-primary-500/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-primary-300 mb-1">Theme Preview</h4>
                      <p className="text-xs text-primary-200/70">The currently selected accent color is applied.</p>
                    </div>
                    <button className="btn-primary text-xs py-1.5 px-4 pointer-events-none">Active Theme</button>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Localization & Timezone" icon={Globe}>
                <div className="max-w-2xl">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Platform Timezone</label>
                  <p className="text-sm text-slate-400 mb-6">
                    All IoT data timestamps (Raw Records, charts) will be displayed in the timezone you select here. This does not affect data storage, which is always in UTC.
                  </p>
                  
                  <div className="relative mb-6">
                    <select
                      className="input-field w-full appearance-none bg-slate-900/50 text-sm py-3"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 mb-8">
                    <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Current local time</p>
                      <p className="text-lg font-mono text-slate-100">{previewTime}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-700/50 flex justify-end">
                    <button
                      onClick={handleSaveTimezone}
                      disabled={tzLoading}
                      className={`flex items-center gap-2 transition-all px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg disabled:opacity-70
                        ${tzSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'btn-primary shadow-primary-500/20'}`}
                    >
                      {tzLoading
                        ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
                        : tzSaved ? <><Check size={16} /> Saved Successfully</>
                        : <><Save size={16} /> Save Preferences</>}
                    </button>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Password & Authentication" icon={Shield}>
                <div className="max-w-2xl">
                  <p className="text-sm text-slate-400 mb-8">
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        className="input-field bg-slate-900/50"
                        placeholder="••••••••"
                        value={passwordForm.current_password}
                        onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700/30">
                      <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                      <input
                        type="password"
                        className="input-field bg-slate-900/50"
                        placeholder="••••••••"
                        value={passwordForm.password}
                        onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-end">
                    <button
                      onClick={handleSavePassword}
                      disabled={!passwordForm.current_password || !passwordForm.password}
                      className={`flex items-center gap-2 transition-all px-6 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed
                        ${passSaved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                    >
                      {passSaved ? <><Check size={16} /> Password Updated</> : <><Shield size={16} /> Update Password</>}
                    </button>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Platform API Token" icon={Key}>
                <div className="max-w-3xl">
                  <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <div className="flex gap-3">
                      <div className="text-orange-400 flex-shrink-0 mt-0.5"><Shield size={18} /></div>
                      <div>
                        <h4 className="text-sm font-semibold text-orange-200 mb-1">Keep your token secure</h4>
                        <p className="text-xs text-orange-200/70">
                          This token grants full access to your devices via API. Do not share it or expose it in client-side code.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="relative flex-1">
                      <label className="block text-sm font-medium text-slate-300 mb-2">Bearer Token</label>
                      <input
                        id="api-token-field"
                        type={showToken ? 'text' : 'password'}
                        readOnly
                        value={token}
                        className="input-field pr-12 font-mono text-sm bg-slate-900/80 border-slate-700 focus:ring-0"
                      />
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-4 top-[34px] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      id="btn-copy-token"
                      onClick={handleCopyToken}
                      className={`btn-primary flex items-center gap-2 px-5 py-2.5 h-[42px] transition-all ${copied ? '!bg-emerald-500 !border-emerald-500' : ''}`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button className="btn-secondary flex items-center justify-center w-[42px] h-[42px] px-0" title="Regenerate token">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              </SettingsSection>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <SettingsSection title="Notification Preferences" icon={Bell}>
                <div className="max-w-3xl space-y-2">
                  {[
                    { key: 'deviceOffline',   label: 'Device goes offline',     desc: 'Get notified when a device loses connection to the broker' },
                    { key: 'deviceOnline',    label: 'Device comes online',      desc: 'Get notified when a device successfully connects' },
                    { key: 'highTemperature', label: 'Threshold alerts',   desc: 'Receive alerts when metric thresholds are exceeded' },
                    { key: 'endpointTrigger', label: 'Endpoint activations',       desc: 'Notify when a scheduled endpoint is triggered' },
                    { key: 'weeklyReport',    label: 'Weekly summary report',            desc: 'Receive a weekly email summary of your platform usage' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-700/50">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          notifications[key] ? 'bg-primary-500' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </SettingsSection>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
