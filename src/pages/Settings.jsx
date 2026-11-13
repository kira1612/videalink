import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Key,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  Globe,
  Camera,
  Palette,
  Sun,
  Moon,
  Trash2,
  CreditCard,
  ArrowUpRight,
  AlertCircle,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { userApi } from '../services/api';
import { applyCustomPrimaryHex } from '../App';
import {
  PREF_KEYS,
  getUserStringPref,
  setUserStringPref,
  getUserJsonPref,
  setUserJsonPref,
} from '../utils/dashboardPrefs';
import { useBillingQuota } from '../hooks/useBillingQuota';
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

const TIMEZONES = [
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'UTC', label: '(UTC+00:00) UTC / London' },
  { value: 'Europe/Paris', label: '(UTC+01:00) Central European Time' },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Eastern European Time' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Abu Dhabi, Muscat' },
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi' },
  { value: 'Asia/Jakarta', label: '(UTC+07:00) Jakarta, WIB' },
  { value: 'Asia/Hong_Kong', label: '(UTC+08:00) Beijing, Hong Kong, Singapore' },
  { value: 'Asia/Makassar', label: '(UTC+08:00) Makassar, WITA' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo, Seoul' },
  { value: 'Asia/Jayapura', label: '(UTC+09:00) Jayapura, WIT' },
  { value: 'Australia/Sydney', label: '(UTC+10:00) Sydney, Melbourne' },
];

const DEFAULT_NOTIFICATIONS = {
  deviceOffline: true,
  deviceOnline: false,
  highTemperature: true,
  endpointTrigger: true,
  weeklyReport: false,
};

const NOTIFICATION_ITEMS = [
  {
    key: 'deviceOffline',
    label: 'Perangkat Terputus (Offline)',
    desc: 'Beri peringatan saat perangkat kehilangan koneksi ke broker MQTT atau timeout.',
  },
  {
    key: 'deviceOnline',
    label: 'Perangkat Kembali Online',
    desc: 'Tampilkan notifikasi saat perangkat berhasil terhubung ulang.',
  },
  {
    key: 'highTemperature',
    label: 'Peringatan Ambang Batas (Threshold)',
    desc: 'Kirim alert ketika pembacaan sensor melewati batas aturan yang ditentukan.',
  },
  {
    key: 'endpointTrigger',
    label: 'Eksekusi Webhook & Endpoint',
    desc: 'Catat pemberitahuan ketika automasi memicu endpoint eksternal.',
  },
  {
    key: 'weeklyReport',
    label: 'Ringkasan Aktivitas Mingguan',
    desc: 'Terima laporan ringkas performa perangkat dan pemakaian kuota tiap minggu.',
  },
];

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profil Akun', icon: User },
  { id: 'appearance', label: 'Tampilan', icon: Palette },
  { id: 'preferences', label: 'Zona Waktu', icon: Globe },
  { id: 'security', label: 'Keamanan', icon: Shield },
  { id: 'api', label: 'Token API', icon: Key },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
];

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="ops-surface p-6 sm:p-7 space-y-6">
      <header
        className="pb-4 border-b space-y-1"
        style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
      >
        <h2
          className="text-base font-bold tracking-tight"
          style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs"
            style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
          >
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export default function Settings() {
  const { billingSummary } = useBillingQuota();
  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('iot_user');
      return saved
        ? JSON.parse(saved)
        : { name: 'Admin', email: '', role: 'admin', timezone: 'Asia/Jakarta' };
    } catch {
      return { name: 'Admin', email: '', role: 'admin', timezone: 'Asia/Jakarta' };
    }
  });

  const [activeTab, setActiveTab] = useState('profile');

  // Profile state
  const [profile, setProfile] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
  });
  const [avatar, setAvatar] = useState(currentUser.avatar || null);
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState(() => currentUser.theme || 'blue');
  const [mode, setMode] = useState(() => currentUser.mode || 'dark');
  const [customHex, setCustomHex] = useState(() => {
    const savedCustom =
      getUserStringPref(PREF_KEYS.CUSTOM_PRIMARY, null, currentUser?.id) ||
      currentUser?.dashboard_preferences?.custom_primary;
    if (savedCustom) return String(savedCustom).replace('#', '').toUpperCase();
    const found = INTERFACE_THEMES.find((t) => t.id === (currentUser.theme || 'blue'));
    return found ? found.hex : '0075FF';
  });
  const [transparentSidebar, setTransparentSidebar] = useState(
    () => getUserStringPref(PREF_KEYS.TRANSPARENT_SIDEBAR, null) !== 'false'
  );

  // Timezone state
  const [timezone, setTimezone] = useState(currentUser.timezone || 'Asia/Jakarta');
  const [tzBusy, setTzBusy] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);
  const [previewTime, setPreviewTime] = useState('');

  // Security state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passError, setPassError] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passSaved, setPassSaved] = useState(false);

  // API Token state
  const [showToken, setShowToken] = useState(false);
  const [copiedType, setCopiedType] = useState('');
  const token = localStorage.getItem('iot_token') || '';

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = getUserJsonPref(PREF_KEYS.NOTIFICATIONS, null);
    return saved && typeof saved === 'object'
      ? { ...DEFAULT_NOTIFICATIONS, ...saved }
      : DEFAULT_NOTIFICATIONS;
  });

  useEffect(() => {
    const updateClock = () => {
      try {
        setPreviewTime(
          new Intl.DateTimeFormat('id-ID', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }).format(new Date())
        );
      } catch {
        setPreviewTime('Zona waktu tidak valid');
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const userInitials = useMemo(() => {
    const name = (profile.name || currentUser.name || 'U').trim();
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile.name, currentUser.name]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Ukuran File Terlalu Besar',
        text: 'Pilih gambar dengan ukuran maksimal 2 MB.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    const trimmedName = profile.name.trim();
    const trimmedEmail = profile.email.trim();
    if (!trimmedName) {
      setProfileError('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileError('Masukkan alamat email yang valid.');
      return;
    }

    setProfileBusy(true);
    try {
      const res = await userApi.update({
        name: trimmedName,
        email: trimmedEmail,
        avatar,
      });
      const updatedUser = {
        ...currentUser,
        name: res.data?.name ?? trimmedName,
        email: res.data?.email ?? trimmedEmail,
        avatar: res.data?.avatar !== undefined ? res.data.avatar : avatar,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Profil diperbarui.',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      setProfileError(
        err?.response?.data?.message ||
          'Gagal menyimpan perubahan profil. Periksa koneksi ke server.'
      );
    } finally {
      setProfileBusy(false);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setUserStringPref(PREF_KEYS.CUSTOM_PRIMARY, null);
    applyCustomPrimaryHex(null);
    const found = INTERFACE_THEMES.find((t) => t.id === newTheme);
    if (found) setCustomHex(found.hex);

    try {
      const savedStr = localStorage.getItem('iot_user');
      if (savedStr) {
        const user = JSON.parse(savedStr);
        user.theme = newTheme;
        localStorage.setItem('iot_user', JSON.stringify(user));
        setCurrentUser(user);
        userApi.update({ theme: newTheme }).catch(() => {});
      } else {
        localStorage.setItem('iot_theme', newTheme);
      }
    } catch {}

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
      setUserStringPref(PREF_KEYS.CUSTOM_PRIMARY, hexWithHash);
      applyCustomPrimaryHex(hexWithHash);
      window.dispatchEvent(new Event('theme-updated'));
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    try {
      const savedStr = localStorage.getItem('iot_user');
      if (savedStr) {
        const user = JSON.parse(savedStr);
        user.mode = newMode;
        localStorage.setItem('iot_user', JSON.stringify(user));
        setCurrentUser(user);
        userApi.update({ mode: newMode }).catch(() => {});
      } else {
        localStorage.setItem('iot_mode', newMode);
      }
    } catch {}

    if (newMode === 'dark') {
      document.documentElement.removeAttribute('data-mode');
    } else {
      document.documentElement.setAttribute('data-mode', newMode);
    }
  };

  const handleToggleTransparentSidebar = () => {
    const next = !transparentSidebar;
    setTransparentSidebar(next);
    setUserStringPref(PREF_KEYS.TRANSPARENT_SIDEBAR, String(next));
    window.dispatchEvent(new Event('theme-updated'));
  };

  const handleResetAppearance = () => {
    handleThemeChange('blue');
    handleModeChange('dark');
    setTransparentSidebar(true);
    setUserStringPref(PREF_KEYS.TRANSPARENT_SIDEBAR, 'true');
    window.dispatchEvent(new Event('theme-updated'));
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'info',
      title: 'Tampilan dikembalikan ke default.',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const handleSaveAppearancePreferences = () => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Preferensi tampilan tersimpan.',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  const handleSaveTimezone = async () => {
    setTzBusy(true);
    try {
      const res = await userApi.update({ timezone });
      const updatedUser = { ...currentUser, timezone: res.data?.timezone ?? timezone };
      setCurrentUser(updatedUser);
      localStorage.setItem('iot_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      setTzSaved(true);
      setTimeout(() => setTzSaved(false), 2500);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Zona waktu diperbarui.',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memperbarui',
        text: err?.response?.data?.message || 'Tidak dapat menyimpan zona waktu.',
      });
    } finally {
      setTzBusy(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPassError('');

    if (!passwordForm.current_password) {
      setPassError('Masukkan kata sandi Anda saat ini.');
      return;
    }
    if (passwordForm.password.length < 8) {
      setPassError('Kata sandi baru minimal harus 8 karakter.');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPassError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setPassBusy(true);
    try {
      await userApi.updatePassword({
        current_password: passwordForm.current_password,
        password: passwordForm.password,
      });
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setPassSaved(true);
      setTimeout(() => setPassSaved(false), 2500);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Kata sandi diperbarui.',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      setPassError(
        err?.response?.data?.message || 'Kata sandi saat ini salah atau gagal diperbarui.'
      );
    } finally {
      setPassBusy(false);
    }
  };

  const handleCopyText = (type, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(''), 2000);
  };

  const handleToggleNotification = (key) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      setUserJsonPref(PREF_KEYS.NOTIFICATIONS, next);
      return next;
    });
  };

  const isCustomHexActive = Boolean(getUserStringPref(PREF_KEYS.CUSTOM_PRIMARY, null));

  const fieldStyle = {
    backgroundColor: 'rgb(var(--surface-800) / 0.4)',
    borderColor: 'rgb(var(--surface-700) / 0.75)',
    color: 'rgb(var(--surface-50))',
  };

  return (
    <div className="space-y-5 pb-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'rgb(var(--surface-50))', textWrap: 'balance' }}
          >
            Pengaturan
          </h1>
          <p
            className="text-xs"
            style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
          >
            Kelola profil akun, tampilan workspace, zona waktu, keamanan, dan token API.
          </p>
        </div>

        {billingSummary?.plan && (
          <Link
            to="/app/billing"
            className="self-start sm:self-auto min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-[background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
            style={{
              backgroundColor: 'rgb(var(--surface-900))',
              borderColor: 'rgb(var(--surface-700) / 0.7)',
              color: 'rgb(var(--surface-100))',
            }}
          >
            <CreditCard size={14} style={{ color: 'rgb(var(--primary-400))' }} />
            <span>Paket {billingSummary.plan.name}</span>
            <ArrowUpRight size={13} style={{ color: 'rgb(var(--surface-400))' }} />
          </Link>
        )}
      </div>

      {/* Mobile Horizontal Tabs */}
      <div
        role="tablist"
        aria-label="Kategori Pengaturan"
        className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1"
      >
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className="min-h-[38px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-[background-color,border-color,color] duration-150"
              style={{
                backgroundColor: active ? 'rgb(var(--primary-500))' : 'rgb(var(--surface-900))',
                borderColor: active
                  ? 'rgb(var(--primary-500))'
                  : 'rgb(var(--surface-700) / 0.65)',
                color: active ? '#ffffff' : 'rgb(var(--surface-300))',
              }}
            >
              <Icon size={14} strokeWidth={1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Quiet Borderless Settings Rail */}
        <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col gap-5 md:sticky md:top-6">
          <nav
            role="tablist"
            aria-orientation="vertical"
            aria-label="Menu Pengaturan"
            className="flex flex-col gap-0.5"
          >
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full min-h-[40px] px-3 rounded-lg flex items-center gap-2.5 text-left text-[13px] font-medium transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                  style={{
                    backgroundColor: isActive
                      ? 'rgb(var(--surface-800) / 0.75)'
                      : 'transparent',
                    color: isActive ? 'rgb(var(--surface-50))' : 'rgb(var(--surface-400))',
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.75}
                    style={{
                      color: isActive
                        ? 'rgb(var(--primary-400))'
                        : 'rgb(var(--surface-400))',
                    }}
                  />
                  <span className={isActive ? 'font-semibold' : ''}>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Subtle Account Footer */}
          <div
            className="pt-4 border-t px-2 flex items-center gap-2.5"
            style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 overflow-hidden"
              style={{
                backgroundColor: 'rgb(var(--surface-800))',
                color: 'rgb(var(--surface-200))',
                outline: '1px solid rgba(255,255,255,0.08)',
                outlineOffset: '-1px',
              }}
            >
              {avatar ? (
                <img src={avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-semibold truncate"
                style={{ color: 'rgb(var(--surface-100))' }}
              >
                {profile.name || currentUser.name}
              </div>
              <div
                className="text-[11px] truncate"
                style={{ color: 'rgb(var(--surface-400))' }}
              >
                {currentUser.role === 'admin' ? 'Administrator' : 'Member IoT'}
              </div>
            </div>
          </div>
        </aside>

        {/* Active Panel */}
        <div className="flex-1 min-w-0 w-full">
          {/* 1. PROFILE */}
          {activeTab === 'profile' && (
            <SectionCard
              title="Informasi Pribadi"
              subtitle="Perbarui foto profil, nama tampilan, dan alamat email akun Anda."
            >
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="relative group shrink-0 self-start">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold overflow-hidden"
                      style={{
                        backgroundColor: 'rgb(var(--surface-800))',
                        color: 'rgb(var(--surface-100))',
                        outline: '1px solid rgba(255,255,255,0.1)',
                        outlineOffset: '-1px',
                      }}
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={profile.name || 'Foto Profil'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userInitials
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Unggah foto profil baru"
                      className="absolute inset-0 bg-slate-950/65 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 cursor-pointer"
                    >
                      <Camera size={16} className="text-white" />
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[36px] px-3 rounded-lg border text-xs font-semibold transition-[background-color] duration-150"
                        style={{
                          borderColor: 'rgb(var(--surface-700) / 0.7)',
                          color: 'rgb(var(--surface-100))',
                        }}
                      >
                        Unggah Foto
                      </button>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar(null)}
                          className="min-h-[36px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-[background-color] duration-150"
                          style={{
                            borderColor: 'rgb(244 63 94 / 0.3)',
                            color: 'rgb(251 113 133)',
                          }}
                        >
                          <Trash2 size={13} />
                          Hapus
                        </button>
                      )}
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgb(var(--surface-400))' }}>
                      Format JPG atau PNG, maksimal 2 MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-name"
                      className="block text-xs font-semibold"
                      style={{ color: 'rgb(var(--surface-200))' }}
                    >
                      Nama Lengkap
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                      style={fieldStyle}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="settings-email"
                      className="block text-xs font-semibold"
                      style={{ color: 'rgb(var(--surface-200))' }}
                    >
                      Alamat Email
                    </label>
                    <input
                      id="settings-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full min-h-[40px] px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                {profileError && (
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
                    <span>{profileError}</span>
                  </div>
                )}

                <div
                  className="pt-4 border-t flex justify-end"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <button
                    id="btn-save-profile"
                    type="submit"
                    disabled={profileBusy}
                    className="min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      backgroundColor: profileSaved
                        ? 'rgb(16 185 129)'
                        : 'rgb(var(--primary-500))',
                    }}
                  >
                    {profileBusy ? (
                      'Menyimpan...'
                    ) : profileSaved ? (
                      <>
                        <Check size={14} /> Tersimpan
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* 2. APPEARANCE */}
          {activeTab === 'appearance' && (
            <SectionCard
              title="Tampilan & Tema"
              subtitle="Sesuaikan palet warna, mode permukaan terang/gelap, dan transparansi sidebar."
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'rgb(var(--surface-300))' }}
                    >
                      Tema Antarmuka
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {INTERFACE_THEMES.map((t) => {
                      const isSelected = theme === t.id && !isCustomHexActive;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleThemeChange(t.id)}
                          aria-pressed={isSelected}
                          className="rounded-xl p-2.5 text-left transition-[border-color,transform] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                          style={{
                            backgroundColor: 'rgb(var(--surface-800) / 0.35)',
                            border: isSelected
                              ? `1.5px solid ${t.accent}`
                              : '1px solid rgb(var(--surface-700) / 0.55)',
                          }}
                        >
                          <div className="rounded-lg overflow-hidden border border-white/10 mb-2">
                            <div
                              className="h-4 px-2 flex items-center justify-between border-b border-white/5"
                              style={{ backgroundColor: t.topBar }}
                            >
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: t.accent }}
                                />
                                <span className="w-1.5 h-1.5 rounded-full bg-white/25" />
                              </div>
                              <div className="w-10 h-1 rounded-full bg-white/15" />
                            </div>

                            <div className="flex h-[76px]">
                              <div
                                className="w-[30%] p-1.5 flex flex-col gap-1 border-r border-white/5"
                                style={{ backgroundColor: t.sidebarBg }}
                              >
                                <div
                                  className="h-2 w-full rounded-[2px]"
                                  style={{ backgroundColor: t.accent }}
                                />
                                <div className="h-1 w-4/5 rounded-full bg-white/25" />
                                <div className="h-1 w-3/5 rounded-full bg-white/20" />
                              </div>

                              <div
                                className="flex-1 px-2.5 pt-2.5 pb-0 flex flex-col justify-end gap-1.5"
                                style={{ background: t.canvasBg }}
                              >
                                <div className="flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: t.accent }}
                                  />
                                  <div
                                    className="h-2.5 w-[68%] rounded-[3px]"
                                    style={{ backgroundColor: t.accent }}
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-[2px] shrink-0 ml-0.5"
                                    style={{ backgroundColor: t.mutedBar }}
                                  />
                                  <div
                                    className="h-2.5 w-[84%] rounded-[3px]"
                                    style={{ backgroundColor: t.mutedBar }}
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: t.accent, opacity: 0.85 }}
                                  />
                                  <div
                                    className="h-1.5 w-[45%] rounded-t-[3px]"
                                    style={{ backgroundColor: t.accent, opacity: 0.85 }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between px-0.5">
                            <span
                              className="text-xs font-semibold"
                              style={{ color: 'rgb(var(--surface-100))' }}
                            >
                              {t.name}
                            </span>
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={
                                isSelected
                                  ? {
                                      border: `1.5px solid ${t.accent}`,
                                      backgroundColor: `${t.accent}20`,
                                    }
                                  : { border: '1px solid rgb(var(--surface-600) / 0.5)' }
                              }
                            >
                              {isSelected && (
                                <Check size={10} strokeWidth={3} style={{ color: t.accent }} />
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Surface Mode */}
                <div
                  className="pt-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--surface-100))' }}
                    >
                      Mode Permukaan
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                      Pilih tampilan gelap atau terang untuk seluruh dashboard.
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Mode Permukaan"
                    className="inline-flex p-0.5 rounded-lg border self-start sm:self-auto"
                    style={{
                      backgroundColor: 'rgb(var(--surface-800) / 0.5)',
                      borderColor: 'rgb(var(--surface-700) / 0.6)',
                    }}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'dark'}
                      onClick={() => handleModeChange('dark')}
                      className="min-h-[34px] px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-[background-color,color] duration-150"
                      style={{
                        backgroundColor:
                          mode === 'dark' ? 'rgb(var(--primary-500))' : 'transparent',
                        color: mode === 'dark' ? '#ffffff' : 'rgb(var(--surface-300))',
                      }}
                    >
                      <Moon size={13} /> Dark
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === 'light'}
                      onClick={() => handleModeChange('light')}
                      className="min-h-[34px] px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-[background-color,color] duration-150"
                      style={{
                        backgroundColor:
                          mode === 'light' ? 'rgb(var(--primary-500))' : 'transparent',
                        color: mode === 'light' ? '#ffffff' : 'rgb(var(--surface-300))',
                      }}
                    >
                      <Sun size={13} /> Light
                    </button>
                  </div>
                </div>

                {/* Custom Primary Color */}
                <div
                  className="pt-5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--surface-100))' }}
                    >
                      Warna Aksen Kustom
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                      Masukkan kode Hex untuk warna primer khusus workspace.
                    </p>
                  </div>

                  <div
                    className="px-3 min-h-[38px] rounded-lg border flex items-center gap-2 self-start sm:self-auto focus-within:ring-2 focus-within:ring-[rgb(var(--primary-500)/0.3)]"
                    style={fieldStyle}
                  >
                    <label className="relative w-4 h-4 rounded overflow-hidden cursor-pointer shrink-0 ring-1 ring-white/20">
                      <input
                        type="color"
                        aria-label="Pilih warna primer"
                        value={`#${customHex.length === 6 ? customHex : '0075FF'}`}
                        onChange={(e) => handleCustomHexChange(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <span
                        className="block w-full h-full"
                        style={{
                          backgroundColor: `#${customHex.length === 6 ? customHex : '0075FF'}`,
                        }}
                      />
                    </label>
                    <span
                      className="font-mono text-xs font-bold select-none"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      #
                    </span>
                    <input
                      type="text"
                      aria-label="Kode Hex Warna Primer"
                      value={customHex}
                      onChange={(e) => handleCustomHexChange(e.target.value)}
                      maxLength={6}
                      placeholder="0075FF"
                      className="w-[64px] bg-transparent font-mono text-xs font-bold uppercase tracking-wider tabular-nums focus:outline-none"
                      style={{ color: 'rgb(var(--surface-50))' }}
                    />
                  </div>
                </div>

                {/* Transparent Sidebar */}
                <div
                  className="pt-5 border-t flex items-center justify-between gap-4"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'rgb(var(--surface-100))' }}
                    >
                      Sidebar Transparan
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--surface-400))' }}>
                      Tambahkan efek transparansi pada panel navigasi kiri.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={transparentSidebar}
                    aria-label="Aktifkan sidebar transparan"
                    onClick={handleToggleTransparentSidebar}
                    className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                    style={{
                      backgroundColor: transparentSidebar
                        ? 'rgb(var(--primary-500))'
                        : 'rgb(var(--surface-700))',
                    }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                        transparentSidebar ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Footer */}
                <div
                  className="pt-5 border-t flex flex-wrap items-center justify-end gap-2"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <button
                    type="button"
                    onClick={handleResetAppearance}
                    className="min-h-[38px] px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-[background-color] duration-150"
                    style={{
                      borderColor: 'rgb(var(--surface-700) / 0.7)',
                      color: 'rgb(var(--surface-200))',
                    }}
                  >
                    <RotateCcw size={13} />
                    Reset Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAppearancePreferences}
                    className="min-h-[38px] px-4 rounded-lg text-xs font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                    style={{ backgroundColor: 'rgb(var(--primary-500))' }}
                  >
                    Simpan Preferensi
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* 3. TIMEZONE */}
          {activeTab === 'preferences' && (
            <SectionCard
              title="Lokalisasi & Zona Waktu"
              subtitle="Atur zona waktu tampilan timestamp pada grafik dan catatan telemetri."
            >
              <div className="max-w-xl space-y-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="settings-timezone"
                    className="block text-xs font-semibold"
                    style={{ color: 'rgb(var(--surface-200))' }}
                  >
                    Zona Waktu Platform
                  </label>
                  <div className="relative">
                    <select
                      id="settings-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full min-h-[40px] pl-3 pr-9 rounded-lg border text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                      style={fieldStyle}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    />
                  </div>
                </div>

                <div
                  className="px-4 py-3 rounded-lg border flex items-center justify-between gap-4"
                  style={{
                    backgroundColor: 'rgb(var(--surface-800) / 0.3)',
                    borderColor: 'rgb(var(--surface-700) / 0.5)',
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: 'rgb(var(--surface-400))' }}>
                    Waktu Lokal Saat Ini
                  </span>
                  <span
                    className="text-sm font-mono font-bold tabular-nums"
                    style={{ color: 'rgb(var(--surface-50))' }}
                  >
                    {previewTime}
                  </span>
                </div>

                <div
                  className="pt-4 border-t flex justify-end"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <button
                    type="button"
                    onClick={handleSaveTimezone}
                    disabled={tzBusy}
                    className="min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      backgroundColor: tzSaved ? 'rgb(16 185 129)' : 'rgb(var(--primary-500))',
                    }}
                  >
                    {tzBusy ? (
                      'Menyimpan...'
                    ) : tzSaved ? (
                      <>
                        <Check size={14} /> Tersimpan
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Simpan Zona Waktu
                      </>
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* 4. SECURITY */}
          {activeTab === 'security' && (
            <SectionCard
              title="Kata Sandi & Keamanan"
              subtitle="Gunakan kata sandi minimal 8 karakter untuk menjaga keamanan akun Anda."
            >
              <form onSubmit={handleSavePassword} className="max-w-xl space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-semibold"
                    style={{ color: 'rgb(var(--surface-200))' }}
                  >
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={showCurrentPw ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi saat ini"
                      value={passwordForm.current_password}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, current_password: e.target.value })
                      }
                      className="w-full min-h-[40px] pl-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                      style={fieldStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      aria-label={showCurrentPw ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center"
                      style={{ color: 'rgb(var(--surface-400))' }}
                    >
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-password"
                      className="block text-xs font-semibold"
                      style={{ color: 'rgb(var(--surface-200))' }}
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPw ? 'text' : 'password'}
                        placeholder="Minimal 8 karakter"
                        value={passwordForm.password}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, password: e.target.value })
                        }
                        className="w-full min-h-[40px] pl-3 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                        style={fieldStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        aria-label={showNewPw ? 'Sembunyikan kata sandi baru' : 'Lihat kata sandi baru'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs font-semibold"
                      style={{ color: 'rgb(var(--surface-200))' }}
                    >
                      Konfirmasi Kata Sandi
                    </label>
                    <input
                      id="confirm-password"
                      type={showNewPw ? 'text' : 'password'}
                      placeholder="Ulangi kata sandi baru"
                      value={passwordForm.password_confirmation}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          password_confirmation: e.target.value,
                        })
                      }
                      className="w-full min-h-[40px] px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary-500)/0.3)]"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                {passError && (
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
                    <span>{passError}</span>
                  </div>
                )}

                <div
                  className="pt-4 border-t flex justify-end"
                  style={{ borderColor: 'rgb(var(--surface-700) / 0.45)' }}
                >
                  <button
                    type="submit"
                    disabled={passBusy}
                    className="min-h-[40px] px-4 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      backgroundColor: passSaved
                        ? 'rgb(16 185 129)'
                        : 'rgb(var(--primary-500))',
                    }}
                  >
                    {passBusy ? (
                      'Memperbarui...'
                    ) : passSaved ? (
                      <>
                        <Check size={14} /> Kata Sandi Diperbarui
                      </>
                    ) : (
                      'Perbarui Kata Sandi'
                    )}
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          {/* 5. API KEYS */}
          {activeTab === 'api' && (
            <SectionCard
              title="Token API Platform"
              subtitle="Gunakan Bearer token sesi aktif ini untuk menguji integrasi REST API."
            >
              <div className="max-w-2xl space-y-4">
                <div
                  className="px-3.5 py-3 rounded-lg border flex items-start gap-2.5 text-xs"
                  style={{
                    backgroundColor: 'rgb(245 158 11 / 0.07)',
                    borderColor: 'rgb(245 158 11 / 0.25)',
                    color: 'rgb(var(--surface-300))',
                  }}
                >
                  <Shield size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <span style={{ textWrap: 'pretty' }}>
                    Token ini memberikan akses penuh ke perangkat dan data bucket akun Anda. Jangan simpan di repositori publik atau kode sisi klien.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="api-token-field"
                    className="block text-xs font-semibold"
                    style={{ color: 'rgb(var(--surface-200))' }}
                  >
                    Bearer Token
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        id="api-token-field"
                        type={showToken ? 'text' : 'password'}
                        readOnly
                        value={token || 'Token tidak tersedia'}
                        className="w-full min-h-[40px] pl-3 pr-10 rounded-lg border font-mono text-xs focus:outline-none"
                        style={fieldStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        aria-label={showToken ? 'Sembunyikan token' : 'Tampilkan token'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded flex items-center justify-center"
                        style={{ color: 'rgb(var(--surface-400))' }}
                      >
                        {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <button
                      id="btn-copy-token"
                      type="button"
                      disabled={!token}
                      onClick={() => handleCopyText('token', token)}
                      className="min-h-[40px] px-3.5 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 shrink-0 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      style={{
                        backgroundColor:
                          copiedType === 'token' ? 'rgb(16 185 129)' : 'rgb(var(--primary-500))',
                      }}
                    >
                      {copiedType === 'token' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedType === 'token' ? 'Tersalin' : 'Salin Token'}
                    </button>

                    <button
                      type="button"
                      disabled={!token}
                      onClick={() => handleCopyText('header', `Authorization: Bearer ${token}`)}
                      className="min-h-[40px] px-3.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-[background-color] duration-150 disabled:opacity-50"
                      style={{
                        borderColor: 'rgb(var(--surface-700) / 0.7)',
                        color:
                          copiedType === 'header'
                            ? 'rgb(52 211 153)'
                            : 'rgb(var(--surface-200))',
                      }}
                    >
                      {copiedType === 'header' ? <Check size={13} /> : <Copy size={13} />}
                      {copiedType === 'header' ? 'Header Tersalin' : 'Salin Header'}
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* 6. NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <SectionCard
              title="Preferensi Notifikasi"
              subtitle="Perubahan tersimpan otomatis per akun ke server."
            >
              <div
                className="divide-y"
                style={{ borderColor: 'rgb(var(--surface-700) / 0.4)' }}
              >
                {NOTIFICATION_ITEMS.map(({ key, label, desc }) => {
                  const enabled = Boolean(notifications[key]);
                  return (
                    <div
                      key={key}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: 'rgb(var(--surface-100))' }}
                        >
                          {label}
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: 'rgb(var(--surface-400))', textWrap: 'pretty' }}
                        >
                          {desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={label}
                        onClick={() => handleToggleNotification(key)}
                        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-[background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary-500))]"
                        style={{
                          backgroundColor: enabled
                            ? 'rgb(var(--primary-500))'
                            : 'rgb(var(--surface-700))',
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
                            enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
