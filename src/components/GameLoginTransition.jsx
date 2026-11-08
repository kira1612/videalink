import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, FastForward } from 'lucide-react';

export default function GameLoginTransition({ user = {}, onComplete, color = '#0071e3' }) {
  const [progress, setProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isWarpExplosion, setIsWarpExplosion] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const audioCtxRef = useRef(null);
  const audioInitializedRef = useRef(false);

  // Audio setup
  const initAudio = () => {
    if (audioInitializedRef.current) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        audioInitializedRef.current = true;
        setHasStartedAudio(true);
      }
    } catch (e) {
      console.warn('Web Audio error:', e);
    }
  };

  const playWarpDrone = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 2.0);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.2);
    } catch (e) {}
  };

  const playHyperspaceBoom = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
  };

  const playWelcomeChime = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      // High-tech chord chime (F# - A# - C# - D#)
      const notes = [370, 466, 554, 740];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.65);
      });
    } catch (e) {}
  };

  // Start sound & sequence on mount
  useEffect(() => {
    // Check WCAG prefers-reduced-motion for photosensitive users
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Langsung lewati efek warp dan tampilkan sambutan statis lembut
      setShowGreeting(true);
      const timer = setTimeout(() => {
        onComplete && onComplete();
      }, 1400);
      return () => clearTimeout(timer);
    }

    initAudio();
    playWarpDrone();

    const startTime = performance.now();
    const warpDuration = 1800; // 1.8 detik animasi warp tunnel halus

    let animationFrameId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(100, Math.round((elapsed / warpDuration) * 100));
      setProgress(rawProgress);

      if (rawProgress >= 100) {
        // Warp Selesai -> Smooth Soft Glow Transition (AMAN: tanpa white flash)
        setIsWarpExplosion(true);
        playHyperspaceBoom();

        // Tampilkan teks sambutan hangat secara lembut
        setTimeout(() => {
          setShowGreeting(true);
          playWelcomeChime();
        }, 200);

        // Berikan waktu membaca sambutan sebelum masuk dashboard (diperpanjang jadi ~3.2 detik)
        setTimeout(() => {
          onComplete && onComplete();
        }, 3200);
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    // Keyboard shortcut: Space / Escape to skip
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        skipTransition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const skipTransition = () => {
    setIsWarpExplosion(true);
    setTimeout(() => {
      onComplete && onComplete();
    }, 100);
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Operator';

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden transition-all duration-700 ${
        showGreeting ? 'bg-black/80 backdrop-blur-[4px]' : 'bg-transparent'
      }`}
      onClick={() => {
        if (!hasStartedAudio) initAudio();
      }}
    >
      {/* ── PHOTOSENSITIVE-SAFE SMOOTH AMBIENT GLOW (Bukan White Flash, adaptif ke warna landing) ── */}
      <div 
        className={`absolute inset-0 z-40 pointer-events-none transition-opacity duration-700 ${
          isWarpExplosion && !showGreeting ? 'opacity-80' : 'opacity-0'
        }`}
        style={{
          background: `radial-gradient(circle at center, ${color}66 0%, ${color}26 40%, rgba(0,0,0,0.85) 100%)`,
        }}
      />

      {/* Cybernetic Scanlines & Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#000000_90%)] opacity-85 z-0" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* ── TOP CONTROLS (Audio & Skip) ── */}
      <div className="relative z-50 flex items-center justify-end text-xs font-mono uppercase tracking-widest text-[#86868b]">
        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              initAudio();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#86868b] hover:text-[#f5f5f7] transition-all backdrop-blur-md"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <Volume2 size={16} style={{ color }} />
            ) : (
              <VolumeX size={16} />
            )}
          </button>

          {/* Quick Skip Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipTransition();
            }}
            className="p-2.5 rounded-full hover:brightness-125 border text-[#f5f5f7] transition-all backdrop-blur-md group"
            style={{
              backgroundColor: `${color}26`,
              borderColor: `${color}66`,
            }}
            title="Lewati"
          >
            <FastForward size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── CENTER AREA: ELEGANT WELCOME REVEAL (MUNCUL SETELAH ANIMASI WARP) ── */}
      <div className="relative z-50 flex-1 flex flex-col items-center justify-center pointer-events-none">
        {showGreeting && (
          <div className="flex flex-col items-center text-center px-4 animate-fade-in transition-all duration-700">
            {/* Subtle glow orb behind text with active landing color */}
            <div 
              className="absolute w-72 h-72 rounded-full blur-[90px] pointer-events-none -z-10"
              style={{
                background: `radial-gradient(circle, ${color}66 0%, ${color}26 60%, transparent 100%)`,
              }}
            />

            {/* Status Pill */}
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md mb-4"
              style={{
                boxShadow: `0 0 20px ${color}40`,
              }}
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-mono tracking-widest uppercase font-semibold" style={{ color }}>
                Sistem Terhubung
              </span>
            </div>

            {/* Main Greeting Headline with landing color gradient */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.35)] leading-tight">
              Selamat Datang,{' '}
              <span 
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(to right, ${color}, #ffffff)`,
                }}
              >
                {displayName}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-sm sm:text-base text-[#86868b] font-medium tracking-wide max-w-md">
              Menyiapkan ruang kerja komando IoT Anda...
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="relative z-10 h-4 pointer-events-none" />
    </div>
  );
}
