import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, FastForward, Box } from 'lucide-react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

export default function GameLoginTransition({ user = {}, onComplete, color = '#06b6d4' }) {
  const [phase, setPhase] = useState('diving'); // 'diving' | 'cubes' | 'greeting'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const audioCtxRef = useRef(null);
  const audioInitializedRef = useRef(false);
  const soundEnabledRef = useRef(true);
  const completedRef = useRef(false);

  const silk = getSilkPaletteTokens(color);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

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

  // Smooth aquatic/energy-stream plunge sound (low-pass filter sweep)
  const playDiveSubmerge = () => {
    if (!soundEnabledRef.current || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(72, now + 1.1);

      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(105, now);
      subOsc.frequency.exponentialRampToValueAtTime(48, now + 1.15);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(3.2, now);
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 1.05);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 1.25);
      subOsc.stop(now + 1.25);
    } catch (e) {}
  };

  // Crystalline harmonic shimmer as the 3D data cubes surround the viewer
  const playDataCubesShimmer = () => {
    if (!soundEnabledRef.current || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.065;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.045, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.7);
      });
    } catch (e) {}
  };

  // Warm major-9th welcome chord
  const playWelcomeChime = () => {
    if (!soundEnabledRef.current || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const notes = [329.63, 415.3, 493.88, 622.25, 739.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + i * 0.055;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.055, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.0);
      });
    } catch (e) {}
  };

  const finishTransition = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete && onComplete();
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setPhase('greeting');
      const timer = setTimeout(finishTransition, 1500);
      return () => clearTimeout(timer);
    }

    initAudio();
    playDiveSubmerge();

    const timers = [];

    // Act 2: Emerge underneath the glowing silk waves into the 3D data cube stream
    timers.push(
      setTimeout(() => {
        setPhase('cubes');
        playDataCubesShimmer();
      }, 1480)
    );

    // Act 3: Decelerate into calm hover & reveal welcome greeting
    timers.push(
      setTimeout(() => {
        setPhase('greeting');
        playWelcomeChime();
      }, 3150)
    );

    // Complete transition into dashboard
    timers.push(setTimeout(finishTransition, 5900));

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        finishTransition();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener('keydown', handleKeyDown);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Operator';
  const showGreeting = phase === 'greeting';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-10 select-none overflow-hidden"
      onClick={() => {
        if (!hasStartedAudio) initAudio();
      }}
    >
      {/* Gentle atmospheric readability vignette (keeps 3D data cubes crisp & visible behind text) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          showGreeting ? 'opacity-100' : 'opacity-45'
        }`}
        style={{
          background:
            'radial-gradient(ellipse 62% 58% at 50% 50%, rgba(2, 4, 12, 0.56) 0%, rgba(2, 4, 12, 0.18) 58%, rgba(2, 3, 8, 0.72) 100%)',
        }}
      />

      {/* ── TOP CONTROLS (Audio & Skip) ── */}
      <div className="relative z-50 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              initAudio();
              setSoundEnabled((prev) => !prev);
            }}
            className="min-w-[42px] min-h-[42px] flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white/70 hover:text-white transition-all backdrop-blur-xl cursor-pointer active:scale-95"
            title={soundEnabled ? 'Bisukan Audio' : 'Aktifkan Audio'}
            aria-label={soundEnabled ? 'Bisukan Audio' : 'Aktifkan Audio'}
          >
            {soundEnabled ? <Volume2 size={16} style={{ color: silk.left }} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finishTransition();
            }}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 rounded-full hover:brightness-125 border text-white/90 text-xs font-medium transition-all backdrop-blur-xl group cursor-pointer active:scale-95"
            style={{
              backgroundColor: silk.surfaceRgba(0.65),
              borderColor: silk.midRgba(0.55),
            }}
            title="Lewati animasi (Spasi / Esc)"
          >
            <span>Lewati</span>
            <FastForward size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── CENTER AREA: SERENE WELCOME REVEAL SURROUNDED BY 3D DATA CUBES ── */}
      <div className="relative z-50 flex-1 flex flex-col items-center justify-center pointer-events-none">
        {showGreeting && (
          <div className="relative flex flex-col items-center text-center px-4 animate-fade-in transition-all duration-700">
            {/* Soft tonal glow behind typography */}
            <div
              className="absolute w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10"
              style={{
                background: `radial-gradient(circle, ${silk.midRgba(0.45)} 0%, ${silk.rightRgba(0.18)} 55%, transparent 100%)`,
              }}
            />

            {/* Status Pill */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-2xl mb-5"
              style={{
                background: silk.pillSurface,
                boxShadow: `0 0 24px ${silk.midRgba(0.35)}, inset 0 1px 0 rgba(255,255,255,0.18)`,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: silk.left }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: silk.left }}
                />
              </span>
              <span
                className="text-[11px] font-mono tracking-[0.16em] uppercase font-semibold"
                style={{ color: silk.left }}
              >
                Aliran Data Tersinkronisasi
              </span>
            </div>

            {/* Main Greeting Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_6px_32px_rgba(0,0,0,0.65)] leading-tight">
              Selamat Datang,{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: `linear-gradient(120deg, ${silk.left} 0%, #ffffff 55%, ${silk.mid} 100%)`,
                }}
              >
                {displayName}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 text-sm sm:text-base text-white/75 font-medium tracking-wide max-w-md drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]">
              Memasuki ruang kerja komando IoT Anda...
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM SUBTLE STREAM TELEMETRY STATUS (DURING DIVE & CUBE SURGE) ── */}
      <div className="relative z-50 h-8 flex items-center justify-center pointer-events-none">
        {!showGreeting && (
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-xl text-[11px] font-mono uppercase tracking-[0.16em] text-white/75 animate-fade-in"
            style={{ background: silk.surfaceRgba(0.45) }}
          >
            <Box size={13} style={{ color: silk.left }} className="animate-spin" />
            <span>
              {phase === 'diving' ? 'Menyelam ke Aliran Data...' : 'Memuat Kubus Telemetri 3D...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
