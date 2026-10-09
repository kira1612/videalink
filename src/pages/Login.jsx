import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronLeft, Cpu } from 'lucide-react';
import { authApi } from '../services/api';
import ParticleTunnel from '../components/ParticleTunnel';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@iot-platform.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

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
      localStorage.setItem('iot_token', res.data.token);
      localStorage.setItem('iot_user', JSON.stringify(res.data.user));
      window.dispatchEvent(new Event('user-updated'));
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans selection:bg-[#0071e3]/30 selection:text-white">
      
      {/* ── STUNNING DYNAMIC BACKGROUND ── */}
      {/* Reusing the ParticleTunnel from Landing Page for perfect consistency but massive wow factor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <ParticleTunnel />
      </div>
      
      {/* Vignette & Gradients to ensure the form remains readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#000000_100%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-0" />
      
      {/* Subtle blue accent glows in the background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0071e3]/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#0071e3]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Back Navigation */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8 z-50">
        <Link 
          to="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 text-[#86868b] hover:text-[#f5f5f7] hover:bg-black/80 backdrop-blur-md transition-all text-sm font-medium group border border-white/5 hover:border-white/20 shadow-lg"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* ── PREMIUM GLASSMORPHIC FORM CONTAINER ── */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
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

          {/* Demo Account Note */}
          {isLogin && (
            <div className="mt-12 text-center opacity-60 hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-[#86868b] uppercase tracking-widest mb-3 font-semibold">Kredensial Demo</p>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm shadow-inner">
                <span className="text-[12px] font-mono text-[#f5f5f7]">admin@iot-platform.io</span>
                <span className="text-[#86868b] text-xs">|</span>
                <span className="text-[12px] font-mono text-[#f5f5f7]">password123</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
