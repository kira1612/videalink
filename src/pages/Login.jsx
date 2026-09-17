import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';
import { authApi } from '../services/api';

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
    <div className="h-screen w-screen flex bg-black relative overflow-hidden font-sans selection:bg-white/30 selection:text-white">
      
      {/* ── SPLIT BACKGROUND ── */}
      {/* Left side: Beautiful abstract generated image */}
      <div 
        className="fixed inset-y-0 left-0 w-full lg:w-[60%] bg-cover bg-center bg-no-repeat transition-transform duration-[10s] ease-out hover:scale-105"
        style={{ backgroundImage: 'url(/assets/login-split.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
      </div>

      {/* Right side: Solid dark area for the form to rest on (Mobile full, Desktop 50%) */}
      <div className="fixed inset-y-0 right-0 w-full lg:w-[50%] bg-black/60 lg:bg-black/40 backdrop-blur-[100px] border-l border-white/5" />

      {/* Back Navigation */}
      <div className="fixed top-8 left-8 md:top-12 md:left-12 z-50">
        <Link 
          to="/" 
          className="bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[#f5f5f7] hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 text-[13px] font-medium group shadow-xl"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </Link>
      </div>

      {/* ── FORM CONTAINER (RIGHT SIDE) ── */}
      <div className="flex-1 flex w-full h-full relative z-10">
        {/* Invisible spacer for left side on desktop */}
        <div className="hidden lg:block lg:w-[50%]" />
        
        {/* Form panel */}
        <div className="w-full lg:w-[50%] h-full flex flex-col justify-center px-6 md:px-12 lg:px-20">
          <div 
            className={`w-full max-w-[400px] mx-auto transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/videa_link_logo.png" 
                alt="Videa Link Logo" 
                className="h-8 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
              />
            </div>

            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                {isLogin ? 'Welcome back.' : 'Create an account.'}
              </h1>
              <p className="text-[14px] text-[#86868b] leading-relaxed">
                {isLogin ? 'Log in to orchestrate your connected devices.' : 'Join Videa Link and take control of your edge network.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-center gap-3">
                <Shield size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Glassmorphic Form Box */}
            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[28px] shadow-2xl backdrop-blur-2xl">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-[14px] focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder:text-[#86868b]" 
                      placeholder="Full Name"
                      required 
                    />
                  </div>
                )}
                
                <div>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-[14px] focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder:text-[#86868b]" 
                    placeholder="Email address"
                    required 
                  />
                </div>

                <div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-[14px] focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all placeholder:text-[#86868b]" 
                    placeholder="Password"
                    required 
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-white to-[#e0e0e0] hover:from-white hover:to-white text-black font-semibold text-[14px] rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {loading ? (
                      <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Authenticating...</>
                    ) : isLogin ? 'Sign In to Workspace' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-6 text-center text-[13px]">
              <span className="text-[#86868b]">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-white hover:text-neutral-300 font-medium transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>

            {/* Demo Account Note */}
            {isLogin && (
              <div className="mt-8 text-center opacity-50 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1 font-semibold">Demo Credentials</p>
                <p className="text-[11px] text-white font-mono bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
                  admin@iot-platform.io <span className="mx-2 text-[#86868b]">|</span> password123
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
