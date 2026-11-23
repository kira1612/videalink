import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { authApi } from '../services/api';
import {
  hydratePrefsFromUser,
  clearPendingPrefsSync,
  clearLegacyGlobalPrefs,
} from '../utils/dashboardPrefs';
import SilkWaveBackground, { getSilkPaletteTokens } from '../components/SilkWaveBackground';
import DataCubeDiveCanvas from '../components/DataCubeDiveCanvas';
import GameLoginTransition from '../components/GameLoginTransition';

const THEME_SWATCHES = [
  { id: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
];

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') !== 'register';
    } catch {
      return true;
    }
  });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@iot-platform.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [demoFilled, setDemoFilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [showGameTransition, setShowGameTransition] = useState(false);
  const [transitionUser, setTransitionUser] = useState(null);

  const [themeColor, setThemeColor] = useState(() => {
    try {
      const savedColor = localStorage.getItem('iot_theme_color');
      if (savedColor) return savedColor;
      const savedTheme = localStorage.getItem('iot_theme');
      const found = THEME_SWATCHES.find((t) => t.id === savedTheme);
      if (found) return found.hex;
    } catch {}
    return '#06b6d4';
  });

  const silk = getSilkPaletteTokens(themeColor);

  useEffect(() => {
    const updateColor = () => {
      try {
        const savedColor = localStorage.getItem('iot_theme_color');
        if (savedColor) setThemeColor(savedColor);
      } catch {}
    };
    window.addEventListener('theme-updated', updateColor);
    return () => window.removeEventListener('theme-updated', updateColor);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const selectThemeSwatch = (swatch) => {
    setThemeColor(swatch.hex);
    try {
      localStorage.setItem('iot_theme', swatch.id);
      localStorage.setItem('iot_theme_color', swatch.hex);
      if (swatch.id === 'cyan') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', swatch.id);
      }
      window.dispatchEvent(new CustomEvent('theme-updated'));
    } catch {}
  };

  const handleFillDemo = () => {
    setIsLogin(true);
    setEmail('admin@iot-platform.io');
    setPassword('password123');
    setError('');
    setDemoFilled(true);
    setTimeout(() => setDemoFilled(false), 1800);
  };

  const handleTransitionComplete = () => {
    const hasToken = Boolean(localStorage.getItem('iot_token'));
    window.dispatchEvent(new Event('user-updated'));
    if (hasToken) {
      navigate('/app/dashboard');
    } else {
      // Preview mode without active session: cleanly return to the login card
      setShowGameTransition(false);
      setIsWarping(false);
    }
  };

  const handlePreviewGameTransition = () => {
    const demoUser = {
      name: name || 'Videa Edge Operator',
      email: email || 'admin@iot-platform.io',
      role: 'admin',
    };
    setTransitionUser(demoUser);
    setIsWarping(true);
    setShowGameTransition(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let res;
      if (isLogin) {
        res = await authApi.login(email, password);
      } else {
        res = await authApi.register(name, email, password);
      }
      clearPendingPrefsSync();
      clearLegacyGlobalPrefs();
      localStorage.setItem('iot_token', res.data.token);
      localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      hydratePrefsFromUser(res.data.user, { force: true });

      setTransitionUser(res.data.user);
      setIsWarping(true);
      setShowGameTransition(true);
    } catch (err) {
      console.error('Auth error:', err);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Autentikasi gagal. Periksa kembali email dan kata sandi Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return {
      background: isFocused ? silk.deepRgba(0.86) : silk.deepRgba(0.62),
      borderColor: isFocused ? `${silk.mid}cc` : 'rgba(255, 255, 255, 0.13)',
      boxShadow: isFocused
        ? `0 0 0 3px ${silk.midRgba(0.18)}, inset 0 1px 2px rgba(0, 0, 0, 0.45)`
        : 'inset 0 1px 2px rgba(0, 0, 0, 0.45)',
    };
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#04050b] text-white relative overflow-hidden font-sans antialiased selection:bg-white/20 py-20 px-4 sm:px-6"
      style={{
        '--surface-50': '255 255 255',
        '--surface-100': '247 250 252',
        '--surface-200': '226 232 240',
        '--surface-300': '203 213 225',
        '--surface-400': '160 174 192',
        '--surface-500': '113 128 150',
        '--surface-600': '45 55 88',
        '--surface-700': '26 31 55',
        '--surface-800': '15 21 53',
        '--surface-900': '6 11 40',
        '--surface-950': '3 8 27',
      }}
    >
      {/* ── 3D DATA CUBE STREAM REALM (EMERGES AS CAMERA DIVES INTO THE SILK WAVE) ── */}
      {isWarping && (
        <div
          className="fixed inset-0 z-0 pointer-events-none animate-fade-in"
          style={{ animationDuration: '900ms' }}
        >
          <DataCubeDiveCanvas color={themeColor} active={isWarping} />
        </div>
      )}

      {/* ── LIVE WEBGL NEON HORIZON + 3D VELVET DUNES (DIVES FULL-SCREEN INTO THE WAVES FIRST) ── */}
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-700 ${
          isWarping ? 'opacity-0 delay-[1400ms]' : 'opacity-100'
        }`}
      >
        <SilkWaveBackground color={themeColor} fullPage={false} isDiving={isWarping} />
      </div>

      {/* Subtle readability vignette around form center without muting the horizon */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 56% 62% at 50% 48%, rgba(4, 5, 11, 0.36) 0%, rgba(4, 5, 11, 0.14) 68%, rgba(4, 5, 11, 0.55) 100%)',
        }}
      />

      {/* ── TOP MINIMAL FLOATING BAR (BACK LINK + 5 THEME SWATCHES) ── */}
      {!showGameTransition && (
        <header className="fixed top-4 md:top-6 inset-x-0 z-40 px-4 md:px-8 flex items-center justify-between pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-[13px] font-medium text-white/80 hover:text-white backdrop-blur-2xl border border-white/[0.14] hover:border-white/[0.26] transition-[transform,color,border-color,background-color] duration-200 active:scale-[0.96] group"
            style={{
              background: silk.pillSurface,
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.16), 0 10px 28px -8px rgba(0, 0, 0, 0.65)',
            }}
          >
            <ChevronLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform duration-200"
            />
            <span>Kembali ke Beranda</span>
          </Link>

          {/* 5 Single-Hue Theme Swatches */}
          <div
            className="pointer-events-auto flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-2xl border border-white/[0.14]"
            style={{
              background: silk.pillSurface,
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 10px 28px -8px rgba(0, 0, 0, 0.65)',
            }}
          >
            {THEME_SWATCHES.map((swatch) => {
              const isSelected = themeColor.toLowerCase() === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => selectThemeSwatch(swatch)}
                  title={swatch.label}
                  aria-label={`Pilih tema ${swatch.label}`}
                  className="p-1.5 rounded-full cursor-pointer flex items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full transition-[transform,opacity,box-shadow] duration-200 ${
                      isSelected
                        ? 'scale-125 ring-2 ring-white/95'
                        : 'opacity-55 group-hover:opacity-100 group-hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: swatch.hex,
                      boxShadow: isSelected ? `0 0 10px ${swatch.hex}` : 'none',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </header>
      )}

      {/* ── GAME-STYLE POST-LOGIN HYPERDRIVE TRANSITION OVERLAY ── */}
      {showGameTransition && (
        <GameLoginTransition
          user={transitionUser}
          color={themeColor}
          onComplete={handleTransitionComplete}
        />
      )}

      {/* ── CENTERED VELVET-CRYSTAL AUTH CONTAINER ── */}
      <main
        className={`relative z-10 w-full max-w-[440px] transition-[opacity,transform,filter] ${
          showGameTransition
            ? 'duration-300 opacity-0 scale-95 -translate-y-4 blur-sm pointer-events-none'
            : 'duration-700 opacity-100 scale-100 translate-y-0'
        }`}
      >
        <div
          className={`w-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {/* Brand Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-7">
            <Link to="/" className="mb-5 select-none group">
              <img
                src="/new_videa_link_logo.png"
                alt="Videa Link Logo"
                className="h-9 sm:h-10 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.22)] group-hover:scale-105 transition-transform duration-200"
              />
            </Link>

            <h1
              className="text-3xl sm:text-[2.15rem] font-extrabold tracking-[-0.035em] leading-[1.12] text-transparent bg-clip-text pb-1"
              style={{
                backgroundImage: silk.headingGradient,
                textWrap: 'balance',
              }}
            >
              {isLogin ? 'Masuk ke Videa Link.' : 'Buat Akun Videa Link.'}
            </h1>
            <p
              className="mt-2 text-sm sm:text-[15px] text-white/72 max-w-[340px] leading-relaxed"
              style={{ textWrap: 'pretty' }}
            >
              {isLogin
                ? 'Pantau perangkat IoT, Data Bucket, dan denah Ruangan 3D Anda secara real-time.'
                : 'Mulai gratis dengan paket Starter — tanpa kartu kredit.'}
            </p>
          </div>

          {/* Main Velvet-Crystal Card */}
          <div
            className="relative rounded-[30px] p-6 sm:p-8 overflow-hidden backdrop-blur-2xl border border-white/[0.14]"
            style={{
              background: silk.cardSurface,
              boxShadow: `${silk.cardBoxShadow}, 0 0 54px -20px ${silk.midRgba(0.42)}`,
            }}
          >
            {/* Top Neon Horizon Specular Line */}
            <div
              className="absolute top-0 left-8 right-8 h-[1.5px] pointer-events-none opacity-85"
              style={{ background: silk.horizonLine }}
            />

            {/* Segmented Mode Switcher (Concentric rounded-full inside rounded-[30px]) */}
            <div
              className="relative grid grid-cols-2 p-1 rounded-full mb-6 border border-white/[0.11]"
              style={{ background: silk.deepRgba(0.72) }}
              role="tablist"
              aria-label="Mode autentikasi"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                }}
                className={`min-h-[38px] rounded-full text-xs sm:text-[13px] font-semibold transition-[color,background,box-shadow,transform] duration-200 cursor-pointer active:scale-[0.97] ${
                  isLogin ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
                style={
                  isLogin
                    ? {
                        background: silk.gradient,
                        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.34), 0 6px 18px -4px ${silk.midRgba(0.6)}`,
                      }
                    : undefined
                }
              >
                Masuk
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                }}
                className={`min-h-[38px] rounded-full text-xs sm:text-[13px] font-semibold transition-[color,background,box-shadow,transform] duration-200 cursor-pointer active:scale-[0.97] ${
                  !isLogin ? 'text-white' : 'text-white/60 hover:text-white/90'
                }`}
                style={
                  !isLogin
                    ? {
                        background: silk.gradient,
                        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.34), 0 6px 18px -4px ${silk.midRgba(0.6)}`,
                      }
                    : undefined
                }
              >
                Daftar Akun
              </button>
            </div>

            {/* Inline Error Alert */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-2xl bg-rose-500/12 border border-rose-400/35 text-rose-200 text-xs sm:text-[13px] flex items-start gap-2.5 leading-relaxed animate-fade-in"
              >
                <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 mb-1.5 pl-1"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative flex items-center">
                    <User
                      size={16}
                      className="absolute left-4 pointer-events-none transition-colors duration-200"
                      style={{ color: focusedField === 'name' ? silk.left : 'rgba(255,255,255,0.42)' }}
                    />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full min-h-[48px] border rounded-[16px] pl-11 pr-4 py-3 text-white text-sm placeholder:text-white/35 focus:outline-none transition-[border-color,background-color,box-shadow] duration-200"
                      style={getInputStyle('name')}
                      placeholder="Contoh: Budi Santoso"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 mb-1.5 pl-1"
                >
                  Alamat Email
                </label>
                <div className="relative flex items-center">
                  <Mail
                    size={16}
                    className="absolute left-4 pointer-events-none transition-colors duration-200"
                    style={{ color: focusedField === 'email' ? silk.left : 'rgba(255,255,255,0.42)' }}
                  />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full min-h-[48px] border rounded-[16px] pl-11 pr-4 py-3 text-white text-sm placeholder:text-white/35 focus:outline-none transition-[border-color,background-color,box-shadow] duration-200"
                    style={getInputStyle('email')}
                    placeholder="nama@domain.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70 mb-1.5 pl-1"
                >
                  Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={16}
                    className="absolute left-4 pointer-events-none transition-colors duration-200"
                    style={{ color: focusedField === 'password' ? silk.left : 'rgba(255,255,255,0.42)' }}
                  />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full min-h-[48px] border rounded-[16px] pl-11 pr-12 py-3 text-white text-sm placeholder:text-white/35 focus:outline-none transition-[border-color,background-color,box-shadow] duration-200"
                    style={getInputStyle('password')}
                    placeholder="Masukkan kata sandi"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1.5 w-10 h-10 rounded-xl flex items-center justify-center text-white/45 hover:text-white/90 transition-colors duration-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full min-h-[48px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-semibold text-sm tracking-tight text-white transition-[transform,filter,box-shadow,opacity] duration-200 hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.96] disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer select-none"
                  style={{
                    background: silk.gradient,
                    boxShadow: silk.ctaBoxShadow,
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <path
                          className="opacity-90"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>{isLogin ? 'Memverifikasi...' : 'Membuat Akun...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Masuk ke Dashboard' : 'Buat Akun Gratis'}</span>
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-0.5 transition-transform duration-200"
                      />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Security Micro-Footer inside Card */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-white/50">
              <ShieldCheck size={14} style={{ color: silk.left }} />
              <span>Dilindungi Bearer Token & Laravel Sanctum</span>
            </div>
          </div>

          {/* Demo Credentials + Game Launch Preview (Login mode only) */}
          {isLogin && (
            <div className="mt-6 flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={handleFillDemo}
                className="min-h-[40px] inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.24] transition-[transform,border-color,background-color] duration-200 active:scale-[0.97] cursor-pointer"
                style={{
                  background: silk.pillSurface,
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
                }}
                title="Klik untuk mengisi otomatis kredensial demo"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  Demo
                </span>
                <span className="w-1 h-1 rounded-full bg-white/25" />
                <span className="text-xs font-mono text-white/90">admin@iot-platform.io</span>
                <span className="text-white/30 text-xs">/</span>
                <span className="text-xs font-mono text-white/80">password123</span>
                {demoFilled && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-semibold ml-1"
                    style={{ color: silk.left }}
                  >
                    <Check size={12} />
                    Terisi
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handlePreviewGameTransition}
                className="min-h-[38px] inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-white/70 hover:text-white backdrop-blur-xl border border-white/[0.11] hover:border-white/[0.24] transition-[transform,color,border-color,background-color] duration-200 active:scale-[0.96] group cursor-pointer"
                style={{
                  background: silk.pillSurface,
                }}
              >
                <Sparkles
                  size={13}
                  style={{ color: silk.left }}
                  className="group-hover:rotate-12 transition-transform duration-200"
                />
                <span>Pratinjau Animasi Masuk</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
