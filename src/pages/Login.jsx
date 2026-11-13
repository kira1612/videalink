import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronLeft, Cpu, Sparkles } from 'lucide-react';
import { authApi } from '../services/api';
import { hydratePrefsFromUser, clearPendingPrefsSync, clearLegacyGlobalPrefs } from '../utils/dashboardPrefs';
import ParticleTunnel from '../components/ParticleTunnel';
import GameLoginTransition from '../components/GameLoginTransition';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@iot-platform.io');
  const [password, setPassword] = useState('password123');
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
      const themeColors = {
        blue: '#0075ff',
        cyan: '#06b6d4',
        emerald: '#10b981',
        violet: '#8b5cf6',
        rose: '#f43f5e',
        amber: '#f59e0b',
      };
      if (savedTheme && themeColors[savedTheme]) return themeColors[savedTheme];
    } catch (e) {}
    return '#0075ff';
  });

  useEffect(() => {
    const updateColor = () => {
      const savedColor = localStorage.getItem('iot_theme_color');
      if (savedColor) setThemeColor(savedColor);
    };
    window.addEventListener('theme-updated', updateColor);
    return () => window.removeEventListener('theme-updated', updateColor);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleTransitionComplete = () => {
    window.dispatchEvent(new Event('user-updated'));
    navigate('/app/dashboard');
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

      // Trigger AAA Game-style Hyperdrive Launch Transition
      setTransitionUser(res.data.user);
      setIsWarping(true);
      setShowGameTransition(true);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-primary-500/30 selection:text-white">
      
      {/* ── STUNNING DYNAMIC BACKGROUND DENGAN WARNA LANDING ── */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-700 ${isWarping ? 'opacity-100' : 'opacity-40'}`}>
        <ParticleTunnel color={themeColor} isWarping={isWarping} warpIntensity={1.8} />
      </div>
      
      {/* Vignette & Gradients to ensure the form remains readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_100%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-0" />
      
      {/* Dynamic theme accent glows in the background */}
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow transition-colors duration-700 opacity-25"
        style={{ backgroundColor: themeColor }}
      />
      <div 
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none z-0 transition-colors duration-700 opacity-15"
        style={{ backgroundColor: themeColor }}
      />

      {/* Back Navigation (Hidden during hyperdrive warp transition) */}
      {!showGameTransition && (
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50 animate-fade-in">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 text-[#86868b] hover:text-[#f5f5f7] hover:bg-black/80 backdrop-blur-md transition-all text-sm font-medium group border border-white/5 hover:border-white/20 shadow-lg"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>
        </div>
      )}

      {/* ── GAME-STYLE POST-LOGIN HYPERDRIVE TRANSITION OVERLAY ── */}
      {showGameTransition && (
        <GameLoginTransition 
          user={transitionUser} 
          color={themeColor}
          onComplete={handleTransitionComplete} 
        />
      )}

      {/* ── PREMIUM GLASSMORPHIC FORM CONTAINER ── */}
      <div className={`relative z-10 w-full max-w-[420px] px-6 transition-all duration-700 ${showGameTransition ? 'opacity-0 scale-90 blur-md pointer-events-none' : 'opacity-100 scale-100'}`}>
        <div 
          className={`w-full transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
          }`}
        >
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-10">
            <img 
              src="/new_videa_link_logo.png" 
              alt="Videa Link Logo" 
              className="h-10 md:h-12 object-contain mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 transition-transform duration-500" 
            />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f5f5f7] text-center mb-3 drop-shadow-md">
              {isLogin ? 'Masuk ke Videa Link.' : 'Buat akun Videa Link.'}
            </h1>
            <p className="text-[15px] text-[#86868b] text-center max-w-[300px]">
              {isLogin ? 'Kelola infrastruktur edge Anda.' : 'Bergabunglah untuk membangun masa depan.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 backdrop-blur-md animate-fade-in shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <Shield size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Glass Card */}
          <div className="relative p-8 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
            {/* Glossy overlay layer */}
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[40px] pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-[32px] pointer-events-none" />
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              {!isLogin && (
                <div className="space-y-1.5">
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[#f5f5f7] text-[15px] focus:outline-none focus:border-[#0071e3] focus:bg-black/60 focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#86868b] shadow-inner" 
                    placeholder="Nama Lengkap"
                    required 
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[#f5f5f7] text-[15px] focus:outline-none focus:border-[#0071e3] focus:bg-black/60 focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#86868b] shadow-inner" 
                  placeholder="Alamat Email"
                  required 
                />
              </div>

              <div className="space-y-1.5">
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-[#f5f5f7] text-[15px] focus:outline-none focus:border-[#0071e3] focus:bg-black/60 focus:ring-1 focus:ring-[#0071e3]/50 transition-all placeholder:text-[#86868b] shadow-inner" 
                  placeholder="Kata Sandi"
                  required 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="relative w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-white transition-all duration-300 disabled:opacity-70 overflow-hidden shadow-[0_0_20px_rgba(0,113,227,0.3)] hover:shadow-[0_0_30px_rgba(0,113,227,0.5)] hover:-translate-y-0.5 active:translate-y-0 group"
                >
                  {/* Gradient background for button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0071e3] to-[#2997ff] transition-transform duration-500 group-hover:scale-105" />
                  
                  <div className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <><svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></>
                    ) : isLogin ? 'Lanjutkan' : 'Daftar Sekarang'}
                  </div>
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-8 text-center text-[15px]">
            <span className="text-[#86868b]">
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            </span>
            <button 
              type="button" 
              onClick={() => { setIsLogin(!isLogin); setError(''); }} 
              className="text-[#0071e3] hover:text-[#2997ff] font-medium transition-colors"
            >
              {isLogin ? 'Daftar sekarang.' : 'Masuk di sini.'}
            </button>
          </div>

          {/* Demo Account Note & Interactive Preview Button */}
          {isLogin && (
            <div className="mt-10 text-center">
              <p className="text-[10px] text-[#86868b] uppercase tracking-widest mb-2.5 font-semibold">Kredensial Demo</p>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-inner mb-3">
                <span className="text-[12px] font-mono text-[#f5f5f7]">admin@iot-platform.io</span>
                <span className="text-[#86868b] text-xs">|</span>
                <span className="text-[12px] font-mono text-[#f5f5f7]">password123</span>
              </div>
              
              {/* Game Animation Preview Trigger */}
              <div className="flex justify-center mt-1">
                <button
                  type="button"
                  onClick={handlePreviewGameTransition}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] hover:bg-[#0071e3]/20 border border-white/10 hover:border-[#0071e3]/40 text-[#86868b] hover:text-[#2997ff] text-xs font-medium transition-all group backdrop-blur-sm shadow-sm"
                >
                  <Sparkles size={13} className="text-[#0071e3] group-hover:rotate-12 transition-transform" />
                  <span>Pratinjau Animasi Game</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
