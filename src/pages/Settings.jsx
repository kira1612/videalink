import React, { useState, useEffect, useRef } from 'react';
import { User, Key, Bell, Shield, Save, Eye, EyeOff, Copy, RefreshCw, Check, Globe, Camera, Palette, Sun, Moon } from 'lucide-react';
import { userApi } from '../services/api';
import { applyCustomPrimaryHex } from '../App';
import Swal from 'sweetalert2';

const INTERFACE_THEMES = [
  {
    id: 'amber',
    name: 'Orange Mechanic',
    accent: '#F6B954',
    hex: 'F59E0B',
    topBar: '#12120E',
    sidebarBg: '#171611',
    canvasBg: 'linear-gradient(135deg, #211E13 0%, #2C2716 100%)',
    mutedBar: '#3B3626',
  },
  {
    id: 'violet',
    name: 'Purple Disco',
    accent: '#8B5CF6',
    hex: '8B5CF6',
    topBar: '#100D1B',
    sidebarBg: '#151125',
    canvasBg: 'linear-gradient(135deg, #1A1333 0%, #251B47 100%)',
    mutedBar: '#2E254D',
  },
  {
    id: 'cyan',
    name: 'Blue Powder',
    accent: '#58B9E3',
    hex: '06B6D4',
    topBar: '#0D1419',
    sidebarBg: '#121B22',
    canvasBg: 'linear-gradient(135deg, #14222C 0%, #1C313F 100%)',
    mutedBar: '#263A47',
  },
  {
    id: 'blue',
    name: 'Vision Royal',
    accent: '#0075FF',
    hex: '0075FF',
    topBar: '#05091E',
    sidebarBg: '#091032',
    canvasBg: 'linear-gradient(135deg, #0B143D 0%, #132260 100%)',
    mutedBar: '#1E2D6B',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    accent: '#34D399',
    hex: '10B981',
    topBar: '#0A1512',
    sidebarBg: '#0E1E1A',
    canvasBg: 'linear-gradient(135deg, #112822 0%, #183A31 100%)',
    mutedBar: '#22473E',
  },
  {
    id: 'rose',
    name: 'Crimson Pulse',
    accent: '#FB7185',
    hex: 'F43F5E',
    topBar: '#170B11',
    sidebarBg: '#1F0F17',
    canvasBg: 'linear-gradient(135deg, #29131E 0%, #3A1B2B 100%)',
    mutedBar: '#4A2537',
  },
];

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
    <div className="vision-card p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800/70">
        <div className="vision-icon-box w-9 h-9 rounded-xl">
          <Icon size={16} />
        </div>
        <h3 className="font-bold text-[16px] text-slate-100">{title}</h3>
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
    return user.theme || localStorage.getItem('iot_theme') || 'blue';
  });
  const [mode, setMode] = useState(() => {
    const userStr = localStorage.getItem('iot_user');
    const user = userStr ? JSON.parse(userStr) : {};
    return user.mode || localStorage.getItem('iot_mode') || 'dark';
  });
  const [customHex, setCustomHex] = useState(() => {
    const savedCustom = localStorage.getItem('iot_custom_primary');
    if (savedCustom) return savedCustom.replace('#', '').toUpperCase();
    const userStr = localStorage.getItem('iot_user');
    const user = userStr ? JSON.parse(userStr) : {};
    const activeId = user.theme || localStorage.getItem('iot_theme') || 'blue';
    const found = INTERFACE_THEMES.find(t => t.id === activeId);
    return found ? found.hex : '0075FF';
  });
  const [transparentSidebar, setTransparentSidebar] = useState(() => {
    return localStorage.getItem('iot_transparent_sidebar') !== 'false';
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
    localStorage.removeItem('iot_custom_primary');
    applyCustomPrimaryHex(null);
    const found = INTERFACE_THEMES.find(t => t.id === newTheme);
    if (found) {
      setCustomHex(found.hex);
      localStorage.setItem('iot_theme_color', `#${found.hex}`);
    }

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
    localStorage.setItem('iot_theme', newTheme);
    
    if (newTheme === 'blue') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    window.dispatchEvent(new Event('theme-updated'));
  };

  const handleCustomHexChange = (rawVal) => {
    const cleaned = rawVal.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
    setCustomHex(cleaned);
    if (cleaned.length === 6) {
      const hexWithHash = `#${cleaned}`;
      localStorage.setItem('iot_custom_primary', hexWithHash);
      localStorage.setItem('iot_theme_color', hexWithHash);
      applyCustomPrimaryHex(hexWithHash);
      window.dispatchEvent(new Event('theme-updated'));
    }
  };

  const handleToggleTransparentSidebar = () => {
    const next = !transparentSidebar;
    setTransparentSidebar(next);
    localStorage.setItem('iot_transparent_sidebar', String(next));
    window.dispatchEvent(new Event('theme-updated'));
  };

  const handleSaveAppearancePreferences = () => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Appearance preferences saved!',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: '#0f1535',
      color: '#f8fafc',
      iconColor: `#${customHex.length === 6 ? customHex : '0075FF'}`,
    });
  };

  const handleResetAppearance = () => {
    handleThemeChange('blue');
    handleModeChange('dark');
    setTransparentSidebar(true);
    localStorage.setItem('iot_transparent_sidebar', 'true');
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
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl transition-all duration-300 text-left ${
                  isActive 
                    ? 'vision-card border-primary-500/40' 
                    : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className={isActive ? 'vision-icon-box w-9 h-9 rounded-xl flex-shrink-0' : 'vision-inner-box w-9 h-9 rounded-xl flex items-center justify-center text-primary-400 flex-shrink-0'}>
                  <Icon size={17} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isActive ? 'text-slate-100' : 'text-slate-300'}`}>{tab.label}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tab.desc}</p>
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
              <div className="vision-card p-6 sm:p-8 max-w-4xl">
                {/* ── Modal-style Header ── */}
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-[19px] font-bold text-slate-100 tracking-tight">Appearance</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Personalize your Videa Link IoT workspace atmosphere</p>
                  </div>
                  <div className="vision-icon-box w-9 h-9 rounded-xl">
                    <Palette size={17} />
                  </div>
                </div>

                {/* ── 1. Interface Theme (Visual Mini-UI Cards like Reference Image) ── */}
                <div className="mb-7">
                  <h4 className="text-[14px] font-bold text-slate-100">Interface theme</h4>
                  <p className="text-[12px] text-slate-400 mt-0.5 mb-4">Customize your workspace theme</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {INTERFACE_THEMES.map((t) => {
                      const isSelected = theme === t.id && !localStorage.getItem('iot_custom_primary');
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeChange(t.id)}
                          className="rounded-2xl p-3 text-left transition-all duration-300 relative group focus:outline-none"
                          style={{
                            background: 'rgb(var(--surface-900) / 0.78)',
                            border: isSelected
                              ? `1.5px solid ${t.accent}`
                              : '1.5px solid rgba(148, 163, 184, 0.14)',
                            boxShadow: isSelected
                              ? `0 0 24px -4px ${t.accent}45, inset 0 1px 0 0 rgba(255,255,255,0.08)`
                              : '0 8px 20px -6px rgba(0, 0, 0, 0.35)',
                          }}
                        >
                          {/* Mini Application Window Mockup */}
                          <div className="rounded-xl overflow-hidden border border-white/[0.07] mb-3 shadow-inner">
                            {/* Window Titlebar */}
                            <div
                              className="h-5 px-2.5 flex items-center justify-between border-b border-white/[0.05]"
                              style={{ backgroundColor: t.topBar }}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: t.accent }}
                                />
                                <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                                <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                              </div>
                              {/* Mini Top Search Pill */}
                              <div className="w-14 h-2 rounded-full border border-white/20 bg-white/[0.06]" />
                              <div className="w-4" />
                            </div>

                            {/* Window Split Body */}
                            <div className="flex h-[96px]">
                              {/* Left Mini Sidebar */}
                              <div
                                className="w-[30%] p-2 flex flex-col gap-1.5 border-r border-white/[0.05]"
                                style={{ backgroundColor: t.sidebarBg }}
                              >
                                {/* Active Sidebar Item */}
                                <div
                                  className="h-2.5 w-full rounded-[3px] mb-0.5 shadow-sm"
                                  style={{ backgroundColor: t.accent }}
                                />
                                {/* Inactive Sidebar Items */}
                                <div className="flex items-center gap-1 opacity-50">
                                  <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                                  <span className="h-1 w-full rounded-full bg-white/30" />
                                </div>
                                <div className="h-px bg-white/[0.06] my-0.5" />
                                <div className="flex items-center gap-1 opacity-40">
                                  <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                                  <span className="h-1 w-4/5 rounded-full bg-white/30" />
                                </div>
                                <div className="h-px bg-white/[0.06] my-0.5" />
                                <div className="flex items-center gap-1 opacity-40">
                                  <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
                                  <span className="h-1 w-3/5 rounded-full bg-white/30" />
                                </div>
                              </div>

                              {/* Right Mini Main Workspace */}
                              <div
                                className="flex-1 px-3 pt-4 pb-0 flex flex-col justify-end gap-2.5 relative overflow-hidden"
                                style={{ background: t.canvasBg }}
                              >
                                {/* Row 1: Primary Accent Pill */}
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: t.accent }}
                                  />
                                  <div
                                    className="h-3.5 w-[66%] rounded-[5px] shadow-sm"
                                    style={{ backgroundColor: t.accent }}
                                  />
                                </div>

                                {/* Row 2: Muted Surface Pill */}
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0 ml-0.5"
                                    style={{ backgroundColor: t.mutedBar }}
                                  />
                                  <div
                                    className="h-3.5 w-[82%] rounded-[5px]"
                                    style={{ backgroundColor: t.mutedBar }}
                                  />
                                </div>

                                {/* Row 3: Bottom Accent Pill Peek */}
                                <div className="flex items-center gap-1.5 translate-y-[2px]">
                                  <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: t.accent, opacity: 0.9 }}
                                  />
                                  <div
                                    className="h-2.5 w-[46%] rounded-t-[5px]"
                                    style={{ backgroundColor: t.accent, opacity: 0.9 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Theme Name & Checkmark Radio */}
                          <div className="flex items-center justify-between px-1 pt-0.5">
                            <span className="text-[13px] font-bold text-slate-100 group-hover:text-primary-400 transition-colors">
                              {t.name}
                            </span>
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                              style={
                                isSelected
                                  ? {
                                      border: `1.5px solid ${t.accent}`,
                                      backgroundColor: `${t.accent}20`,
                                    }
                                  : {
                                      border: '1.5px solid rgba(148, 163, 184, 0.25)',
                                    }
                              }
                            >
                              {isSelected && (
                                <Check size={11} strokeWidth={3} style={{ color: t.accent }} />
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── 2. Color Mode (Dark vs Light Mini-Preview Cards) ── */}
                <div className="pt-6 pb-6 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-100">Surface mode</h4>
                      <p className="text-[12px] text-slate-400 mt-0.5">Switch between deep dark midnight and crisp daylight surface</p>
                    </div>
                    <div className="vision-inner-box p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleModeChange('dark')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          mode === 'dark'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Moon size={14} /> Dark Mode
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange('light')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                          mode === 'light'
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sun size={14} /> Light Mode
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── 3. Customize Primary Color (Hex Input + Native Swatch like Reference Image) ── */}
                <div className="pt-6 pb-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-100">Customize primary color</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      Customize the look of your workspace. Feeling adventurous?
                    </p>
                  </div>

                  <div className="vision-inner-box px-3.5 py-2 rounded-xl flex items-center gap-2.5 self-start sm:self-auto border border-slate-700/70 focus-within:border-primary-500 transition-colors">
                    <label className="relative w-4 h-4 rounded-md overflow-hidden cursor-pointer flex-shrink-0 shadow-sm ring-1 ring-white/20">
                      <input
                        type="color"
                        value={`#${customHex.length === 6 ? customHex : '0075FF'}`}
                        onChange={(e) => handleCustomHexChange(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <span
                        className="block w-full h-full"
                        style={{ backgroundColor: `#${customHex.length === 6 ? customHex : '0075FF'}` }}
                      />
                    </label>
                    <span className="text-slate-400 font-mono text-[13px] font-bold select-none">#</span>
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => handleCustomHexChange(e.target.value)}
                      maxLength={6}
                      placeholder="0075FF"
                      className="w-[64px] bg-transparent text-slate-100 font-mono text-[13px] font-bold uppercase tracking-wider focus:outline-none"
                    />
                  </div>
                </div>

                {/* ── 4. Transparent Sidebar Toggle (Like Reference Image) ── */}
                <div className="pt-6 pb-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-100">Transparent Sidebar</h4>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      Add a transparency layer to your sidebar
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleTransparentSidebar}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      transparentSidebar ? 'bg-primary-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        transparentSidebar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* ── 5. Footer Action Bar (Cancel & Save preferences) ── */}
                <div className="pt-6 border-t border-slate-800/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleResetAppearance}
                    className="px-4 py-2.5 rounded-xl vision-inner-box text-slate-300 hover:text-slate-100 text-[13px] font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAppearancePreferences}
                    className="px-5 py-2.5 rounded-xl text-[13px] font-extrabold text-slate-950 transition-all hover:brightness-110 active:scale-[0.99] shadow-lg"
                    style={{
                      backgroundColor: `#${customHex.length === 6 ? customHex : '0075FF'}`,
                      color: ['amber', 'emerald', 'cyan'].includes(theme) && !localStorage.getItem('iot_custom_primary') ? '#090D16' : '#FFFFFF',
                      boxShadow: `0 6px 20px -4px #${customHex.length === 6 ? customHex : '0075FF'}65`,
                    }}
                  >
                    Save preferences
                  </button>
                </div>
              </div>
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
                        <h4 className="text-sm font-semibold text-slate-100 mb-1">Keep your token secure</h4>
                        <p className="text-xs text-slate-400">
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
