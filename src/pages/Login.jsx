import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { authApi } from '../services/api';
import { VideaLinkLogo } from '../components/VideaLinkLogo';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@iot-platform.io');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      navigate('/app/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden font-sans selection:bg-neutral-800 selection:text-white">
      {/* Background Video / Parallax subtle effect */}
      <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen">
        <video 
          src="/Membuat_bumi_berputar_202608281618.mp4"
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover object-center"
        />
      </div>
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        
        {/* Header / Logo */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12">
          <Link to="/" className="hover:opacity-70 transition-opacity">
            <VideaLinkLogo size={24} textSize={14} subSize={7} />
          </Link>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-[420px]">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-3">
              {isLogin ? 'Welcome back.' : 'Create an account.'}
            </h1>
            <p className="text-neutral-500 font-light text-sm md:text-base">
              {isLogin ? 'Enter your details to access your workspace.' : 'Join Videa Link to start managing your devices.'}
            </p>
          </div>

          <div className="bg-[#050505]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[24px] shadow-2xl">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-center gap-3">
                <Shield size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-[13px] font-medium text-neutral-400 mb-2" htmlFor="name">Full Name</label>
                  <input 
                    id="name" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all" 
                    placeholder="John Doe"
                    required 
                  />
                </div>
              )}
              
              <div>
                <label className="block text-[13px] font-medium text-neutral-400 mb-2" htmlFor="email">Email address</label>
                <input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all" 
                  placeholder="admin@iot-platform.io"
                  required 
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-neutral-400 mb-2" htmlFor="password">Password</label>
                <div className="relative">
                  <input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-4 pr-11 py-3 text-white text-sm focus:outline-none focus:border-white/30 focus:bg-white/5 transition-all" 
                    placeholder="••••••••"
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-white hover:bg-neutral-200 text-black font-medium text-sm rounded-xl px-4 py-3.5 mt-4 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processing...</>
                ) : isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>
            
            <div className="mt-8 text-center text-[13px]">
              <span className="text-neutral-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                className="text-white hover:text-neutral-300 font-medium transition-colors underline decoration-white/20 underline-offset-4"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>

          {/* Demo Account Note */}
          {isLogin && (
            <div className="mt-8 text-center">
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold mb-2">Demo Credentials</p>
              <div className="inline-block bg-[#050505] border border-white/5 rounded-lg px-4 py-2">
                <p className="text-[12px] text-neutral-400 font-mono tracking-tight">admin@iot-platform.io <span className="mx-2 text-neutral-700">|</span> password123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
