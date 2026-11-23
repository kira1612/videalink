import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Wifi, Activity, Shield, Layers, Bell, Box, Moon, Sun, Check, Play, Power, X, Cpu, CheckCircle2, Zap } from 'lucide-react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

// ─────────────────────────────────────────────────────────────────────────────
// THEMES — persis sesuai sistem: 5 warna aksen × 2 mode (dark / light)
// Warna primary diambil dari CSS variable --primary-400 / --primary-500 di index.css
//
// PATH GAMBAR — letakkan screenshot Anda di:
//   public/assets/themes/<id>.png
//   Contoh: public/assets/themes/dark-cyan.png
// ─────────────────────────────────────────────────────────────────────────────
export const THEMES = [
  // ── DARK MODE ──────────────────────────────────────────────────────────────
  {
    id: 'dark-blue',
    mode: 'dark',
    label: { id: 'Gelap · Blue', en: 'Dark · Blue' },
    swatch: 'linear-gradient(135deg, #060b28 0%, #0075ff 100%)',
    primary: '#0075ff',
    accent: '#3894ff',
    glow: 'rgba(0,117,255,0.45)',
    image: '/assets/themes/dark-blue.png?v=2',
  },
  {
    id: 'dark-cyan',
    mode: 'dark',
    label: { id: 'Gelap · Cyan', en: 'Dark · Cyan' },
    // Cyan-500: rgb(6 182 212) — warna aksen default sistem
    swatch: 'linear-gradient(135deg, #0f172a 0%, #06b6d4 100%)',
    primary: '#06b6d4',       // --primary-500 cyan
    accent: '#22d3ee',       // --primary-400 cyan
    glow: 'rgba(6,182,212,0.45)',
    image: '/assets/themes/dark-cyan.png?v=2',
  },
  {
    id: 'dark-emerald',
    mode: 'dark',
    label: { id: 'Gelap · Emerald', en: 'Dark · Emerald' },
    // Emerald-500: rgb(16 185 129)
    swatch: 'linear-gradient(135deg, #0f172a 0%, #10b981 100%)',
    primary: '#10b981',
    accent: '#34d399',
    glow: 'rgba(16,185,129,0.45)',
    image: '/assets/themes/dark-emerald.png?v=2',
  },
  {
    id: 'dark-violet',
    mode: 'dark',
    label: { id: 'Gelap · Violet', en: 'Dark · Violet' },
    // Violet-500: rgb(139 92 246)
    swatch: 'linear-gradient(135deg, #0f172a 0%, #8b5cf6 100%)',
    primary: '#8b5cf6',
    accent: '#a78bfa',
    glow: 'rgba(139,92,246,0.45)',
    image: '/assets/themes/dark-violet.png?v=2',
  },
  {
    id: 'dark-rose',
    mode: 'dark',
    label: { id: 'Gelap · Rose', en: 'Dark · Rose' },
    // Rose-500: rgb(244 63 94)
    swatch: 'linear-gradient(135deg, #0f172a 0%, #f43f5e 100%)',
    primary: '#f43f5e',
    accent: '#fb7185',
    glow: 'rgba(244,63,94,0.45)',
    image: '/assets/themes/dark-rose.png?v=2',
  },
  {
    id: 'dark-amber',
    mode: 'dark',
    label: { id: 'Gelap · Amber', en: 'Dark · Amber' },
    // Amber-500: rgb(245 158 11)
    swatch: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 100%)',
    primary: '#f59e0b',
    accent: '#fbbf24',
    glow: 'rgba(245,158,11,0.45)',
    image: '/assets/themes/dark-amber.png?v=2',
  },
  // ── LIGHT MODE ─────────────────────────────────────────────────────────────
  {
    id: 'light-blue',
    mode: 'light',
    label: { id: 'Terang · Blue', en: 'Light · Blue' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #0075ff 100%)',
    primary: '#005ed4',
    accent: '#0075ff',
    glow: 'rgba(0,117,255,0.35)',
    image: '/assets/themes/light-blue.png?v=2',
  },
  {
    id: 'light-cyan',
    mode: 'light',
    label: { id: 'Terang · Cyan', en: 'Light · Cyan' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #06b6d4 100%)',
    primary: '#0891b2',       // sedikit lebih gelap agar kontras di bg terang
    accent: '#06b6d4',
    glow: 'rgba(6,182,212,0.35)',
    image: '/assets/themes/light-cyan.png?v=2',
  },
  {
    id: 'light-emerald',
    mode: 'light',
    label: { id: 'Terang · Emerald', en: 'Light · Emerald' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #10b981 100%)',
    primary: '#059669',
    accent: '#10b981',
    glow: 'rgba(16,185,129,0.35)',
    image: '/assets/themes/light-emerald.png?v=2',
  },
  {
    id: 'light-violet',
    mode: 'light',
    label: { id: 'Terang · Violet', en: 'Light · Violet' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)',
    primary: '#7c3aed',
    accent: '#8b5cf6',
    glow: 'rgba(124,58,237,0.35)',
    image: '/assets/themes/light-violet.png?v=2',
  },
  {
    id: 'light-rose',
    mode: 'light',
    label: { id: 'Terang · Rose', en: 'Light · Rose' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #f43f5e 100%)',
    primary: '#e11d48',
    accent: '#f43f5e',
    glow: 'rgba(225,29,72,0.35)',
    image: '/assets/themes/light-rose.png?v=2',
  },
  {
    id: 'light-amber',
    mode: 'light',
    label: { id: 'Terang · Amber', en: 'Light · Amber' },
    swatch: 'linear-gradient(135deg, #f8fafc 0%, #f59e0b 100%)',
    primary: '#d97706',
    accent: '#f59e0b',
    glow: 'rgba(217,119,6,0.35)',
    image: '/assets/themes/light-amber.png?v=2',
  },
];

// ── CROSSFADE IMAGE VIEWER ─────────────────────────────────────────────────────
// Dua layer img ditumpuk. Layer "current" selalu opacity:1.
// Saat src berubah → layer "next" preload di opacity:0, lalu swap ke opacity:1
// sambil layer lama fade ke opacity:0. Setelah 650ms swap selesai.
function CrossfadeImage({ src, alt, glow, primary, fit = 'cover', aspectRatio = '16 / 10', direction = 1, frameless = false, vertical = false }) {
  const [current, setCurrent] = useState(src);   // src yang sedang tampil
  const [next, setNext] = useState(null);  // src baru sedang fade-in
  const [fading, setFading] = useState(false); // apakah sedang transisi
  const [entered, setEntered] = useState(false); // trigger animasi masuk layer next
  const [errorCurr, setErrorCurr] = useState(false); // error load current
  const [errorNext, setErrorNext] = useState(false); // error load next
  const timerRef = useRef(null);

  useEffect(() => {
    if (src === current && !fading) return;
    clearTimeout(timerRef.current);

    setErrorNext(false);
    setNext(src);
    setFading(true);
    setEntered(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
        timerRef.current = setTimeout(() => {
          setCurrent(src);
          setNext(null);
          setFading(false);
          setEntered(false);
          setErrorCurr(false);
        }, 680);
      });
    });

    return () => clearTimeout(timerRef.current);
  }, [src]);

  const baseImg = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: fit,
    display: 'block',
    willChange: 'opacity, transform',
    transition: 'opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1), transform 0.68s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const Placeholder = ({ opacity, zIndex, color }) => (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex,
      opacity,
      transition: 'opacity 0.6s ease',
      background: `linear-gradient(135deg, #0d1117 0%, ${color}1a 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    }}>
      {/* Animated shimmer bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '60%' }}>
        {[80, 60, 70].map((w, i) => (
          <div key={i} style={{
            height: 8,
            width: `${w}%`,
            borderRadius: 4,
            background: `${color}30`,
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11,
        color: color,
        opacity: 0.4,
        fontFamily: 'Inter, system-ui, sans-serif',
        marginTop: 8,
      }}>
        {alt}
      </span>
    </div>
  );

  const silk = getSilkPaletteTokens(primary);

  const exitOffset = vertical
    ? `translate3d(0, ${direction > 0 ? '-20px' : '20px'}, 0) scale(0.98)`
    : `translate3d(${direction > 0 ? '-24px' : '24px'}, 0, 0) scale(0.98)`;
  const enterOffset = vertical
    ? `translate3d(0, ${direction > 0 ? '24px' : '-24px'}, 0) scale(1.015)`
    : `translate3d(${direction > 0 ? '28px' : '-28px'}, 0, 0) scale(1.015)`;

  if (frameless) {
    return (
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: 6,
        overflow: 'hidden',
        aspectRatio,
        background: '#02040a',
      }}>
        {errorCurr
          ? <Placeholder opacity={1} zIndex={1} color={primary} />
          : <img
            key={`curr-${current}`}
            src={current}
            alt={alt}
            onError={() => setErrorCurr(true)}
            style={{
              ...baseImg,
              opacity: entered ? 0 : 1,
              transform: entered ? exitOffset : 'translate3d(0, 0, 0) scale(1)',
              zIndex: 1,
            }}
          />
        }
        {next && (
          errorNext
            ? <Placeholder opacity={entered ? 1 : 0} zIndex={2} color={primary} />
            : <img
              key={`next-${next}`}
              src={next}
              alt={alt}
              onError={() => setErrorNext(true)}
              style={{
                ...baseImg,
                opacity: entered ? 1 : 0,
                transform: entered ? 'translate3d(0, 0, 0) scale(1)' : enterOffset,
                zIndex: 2,
              }}
            />
        )}
        {/* Subtle angled glass display glare */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            pointerEvents: 'none',
            background: 'linear-gradient(122deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.015) 34%, transparent 35%)',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      padding: 8,
      borderRadius: 26,
      background: silk.cardSurface,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: `
        inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
        0 32px 90px -22px ${glow},
        0 24px 60px -14px rgba(2, 4, 10, 0.85)
      `,
      transition: 'box-shadow 0.6s ease',
    }}>
      {/* Concentric inner radius: 26px outer - 8px padding = 18px inner */}
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        aspectRatio,
        background: '#050811',
        outline: '1px solid rgba(255, 255, 255, 0.10)',
        outlineOffset: '-1px',
      }}>
        {/* ── Layer CURRENT (glides out gently when transitioning) ── */}
        {errorCurr
          ? <Placeholder opacity={1} zIndex={1} color={primary} />
          : <img
            key={`curr-${current}`}
            src={current}
            alt={alt}
            onError={() => setErrorCurr(true)}
            style={{
              ...baseImg,
              opacity: entered ? 0 : 1,
              transform: entered ? exitOffset : 'translate3d(0, 0, 0) scale(1)',
              zIndex: 1,
            }}
          />
        }

        {/* ── Layer NEXT (glides in smoothly) ── */}
        {next && (
          errorNext
            ? <Placeholder opacity={entered ? 1 : 0} zIndex={2} color={primary} />
            : <img
              key={`next-${next}`}
              src={next}
              alt={alt}
              onError={() => setErrorNext(true)}
              style={{
                ...baseImg,
                opacity: entered ? 1 : 0,
                transform: entered ? 'translate3d(0, 0, 0) scale(1)' : enterOffset,
                zIndex: 2,
              }}
            />
        )}
      </div>
    </div>
  );
}

// ── FADE IN ON SCROLL ──────────────────────────────────────────────────────────
function useFadeIn(threshold = 0.1) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    if (ref.current) obs.observe(ref.current);
    return () => { if (ref.current) obs.unobserve(ref.current); };
  }, []);
  return [ref, visible];
}

// ── FEATURE LIST CONFIG ────────────────────────────────────────────────────────
function getFeatures(t) {
  // image: gambar yang ditampilkan di panel kanan saat item ini aktif
  // isColor: true = special color-picker item, gambarnya berdasarkan tema aktif
  return [
    {
      id: 'room3d', icon: Box, labelKey: 'featRoom3D', descKey: 'featRoom3DDesc',
      image: '/assets/room3d-editor.jpg?v=3',
      glow: 'rgba(6,182,212,0.4)',
    },
    {
      id: 'color', icon: null, labelKey: 'featColor', descKey: 'featColorDesc', isColor: true,
      image: null, /* gambar ditentukan oleh activeTheme.image */
      glow: null,
    },
    {
      id: 'realtime', icon: Activity, labelKey: 'featRealtime', descKey: 'featRealtimeDesc',
      image: '/assets/dashboard-live.jpg?v=2',
      glow: 'rgba(6,182,212,0.4)',
    },
    {
      id: 'buckets', icon: Layers, labelKey: 'featBuckets', descKey: 'featBucketsDesc',
      image: '/assets/workflow.png',
      glow: 'rgba(16,185,129,0.35)',
    },
    {
      id: 'devices', icon: Wifi, labelKey: 'featDevices', descKey: 'featDevicesDesc',
      image: '/assets/map.png',
      glow: 'rgba(139,92,246,0.35)',
    },
    {
      id: 'alerts', icon: Bell, labelKey: 'featAlerts', descKey: 'featAlertsDesc',
      image: '/assets/alerts.png',
      glow: 'rgba(245,158,11,0.35)',
    },
    {
      id: 'security', icon: Shield, labelKey: 'featSecurity', descKey: 'featSecurityDesc',
      image: '/assets/security.png',
      glow: 'rgba(244,63,94,0.35)',
    },
  ];
}

// ── ROOM 3D POP UI OVERLAY (Layered 3D Glassmorphic Floating Cards) ───────────
function Room3DPopUIOverlay({ active, primary, glow, lang }) {
  const [deviceOn, setDeviceOn] = useState(true);
  const silk = getSilkPaletteTokens(primary);

  const checklistItems = lang === 'id'
    ? ['Template & Tembok 3D', 'Kontrol IoT Langsung', 'Export & Pin Dashboard']
    : ['3D Wall & Room Presets', 'Live IoT Device Control', 'Export & Pin Dashboard'];

  return (
    <>
      {/* ── Backdrop depth silhouettes (behind main viewport) ── */}
      <div
        aria-hidden="true"
        className={`pop-ui-layer pop-backdrop-tl pop-from-tl ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: -16,
          left: -14,
          width: '62%',
          height: '58%',
          borderRadius: 24,
          border: `1.5px solid ${primary}38`,
          background: `linear-gradient(135deg, ${primary}12 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        className={`pop-ui-layer pop-backdrop-br pop-from-br ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -14,
          right: -12,
          width: '54%',
          height: '46%',
          borderRadius: 22,
          border: '1.5px solid rgba(255, 255, 255, 0.10)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── 1. Top-Right Pop Card: Layers & Checklist ── */}
      <div
        className={`pop-ui-card pop-card-tr pop-from-tr pop-delay-1 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: -22,
          right: -18,
          zIndex: 12,
          width: 'auto',
          minWidth: 196,
          maxWidth: 230,
          padding: '12px 14px',
          borderRadius: 18,
          background: 'rgba(13, 18, 34, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.20)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 20px 44px -12px rgba(0,0,0,0.85), 0 0 24px -6px ${glow}`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checklistItems.map((label, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${primary}, ${silk.right})`,
                  boxShadow: `0 4px 10px ${primary}55`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check size={11} strokeWidth={3} color="#06101c" />
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.90)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Mid-Left Pop Pill: 3D Floor Plan Live Badge ── */}
      <div
        className={`pop-ui-card pop-card-ml pop-from-ml pop-delay-2 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: '34%',
          left: -22,
          zIndex: 13,
          padding: '10px 16px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${primary} 0%, ${silk.right} 100%)`,
          border: '1px solid rgba(255, 255, 255, 0.38)',
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.45), 0 18px 38px -8px ${primary}88, 0 10px 24px -8px rgba(0,0,0,0.75)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <Box size={15} strokeWidth={2.5} color="#050b14" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: '#050b14',
              fontFamily: 'Inter, system-ui, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            {lang === 'id' ? 'DENAH 3D' : '3D FLOOR'}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(5, 11, 20, 0.78)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Three.js Live
          </span>
        </div>
      </div>

      {/* ── 3. Bottom-Left Pop Preview Tile: Avatar Walkthrough (WASD) ── */}
      <div
        className={`pop-ui-card pop-card-bl pop-from-bl pop-delay-3 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -24,
          left: -14,
          zIndex: 13,
          width: 184,
          padding: 5,
          borderRadius: 16,
          background: 'rgba(14, 19, 34, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.26), 0 22px 44px -10px rgba(0,0,0,0.88), 0 0 24px -8px ${glow}`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 10',
            borderRadius: 11,
            overflow: 'hidden',
            background: '#080c18',
            border: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <img
            src="/assets/room3d-avatar.jpg"
            alt={lang === 'id' ? 'Mode Jelajah Avatar 3D' : '3D Avatar Walkthrough Mode'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 62%',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(6,10,22,0.72) 0%, transparent 55%)',
              pointerEvents: 'none',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 7,
              bottom: 6,
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(8, 12, 24, 0.78)',
              border: `1px solid ${primary}66`,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#f8fafc',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {lang === 'id' ? 'WASD · JELAJAH' : 'WASD · WALK'}
          </span>
        </div>
      </div>

      {/* ── 4. Bottom-Right Pop Device Card: Real TEMP & HUM Telemetry Popup ── */}
      <div
        className={`pop-ui-card pop-card-br pop-from-br pop-delay-4 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -26,
          right: -14,
          zIndex: 14,
          width: 248,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(14, 19, 34, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 26px 54px -12px rgba(0,0,0,0.92), 0 0 28px -8px ${glow}`,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {/* Header Bar: TEMP & HUM + Close Icon */}
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.025)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'rgba(203, 213, 225, 0.88)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            TEMP &amp; HUM
          </span>
          <X size={13} color="rgba(148, 163, 184, 0.65)" strokeWidth={2} />
        </div>

        {/* Body */}
        <div style={{ padding: '11px 14px 14px' }}>
          {/* Online / Offline Status Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: deviceOn ? '#10b981' : '#64748b',
                boxShadow: deviceOn ? '0 0 8px rgba(16, 185, 129, 0.7)' : 'none',
                flexShrink: 0,
                transition: 'background 0.25s ease, box-shadow 0.25s ease',
              }}
            />
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: deviceOn ? 'rgba(241, 245, 249, 0.94)' : 'rgba(148, 163, 184, 0.75)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {deviceOn ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* 2-Column Telemetry Tiles: KELEMBAPAN & SUHU */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(8, 11, 22, 0.82)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'rgba(148, 163, 184, 0.78)',
                  marginBottom: 5,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {lang === 'id' ? 'KELEMBAPAN' : 'HUMIDITY'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: deviceOn ? '#f8fafc' : 'rgba(148, 163, 184, 0.45)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {deviceOn ? '80.4 %' : '-- %'}
              </div>
            </div>

            <div
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                background: 'rgba(8, 11, 22, 0.82)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'rgba(148, 163, 184, 0.78)',
                  marginBottom: 5,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {lang === 'id' ? 'SUHU' : 'TEMP'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: deviceOn ? '#f8fafc' : 'rgba(148, 163, 184, 0.45)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {deviceOn ? '54.4 C' : '-- C'}
              </div>
            </div>
          </div>

          {/* Action Button: Matikan / Nyalakan Perangkat */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeviceOn((v) => !v);
            }}
            style={{
              width: '100%',
              minHeight: 36,
              padding: '8px 12px',
              borderRadius: 10,
              border: deviceOn
                ? '1px solid rgba(244, 63, 94, 0.24)'
                : '1px solid rgba(16, 185, 129, 0.30)',
              background: deviceOn
                ? 'rgba(244, 63, 94, 0.14)'
                : 'rgba(16, 185, 129, 0.16)',
              color: deviceOn ? '#fb4c63' : '#34d399',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              cursor: 'pointer',
              transition: 'transform 0.18s ease, background 0.22s ease, border-color 0.22s ease, color 0.22s ease',
            }}
          >
            <Power size={13} strokeWidth={2.2} />
            <span>
              {lang === 'id'
                ? (deviceOn ? 'Matikan Perangkat' : 'Nyalakan Perangkat')
                : (deviceOn ? 'Turn Off Device' : 'Turn On Device')}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ── DASHBOARD POP UI OVERLAY (Layered 3D Glassmorphic Floating Cards) ─────────
function DashboardPopUIOverlay({ active, primary, glow, lang }) {
  const [lampOn, setLampOn] = useState(true);
  const silk = getSilkPaletteTokens(primary);

  const checklistItems = lang === 'id'
    ? ['Drag-and-Drop Layout', 'Grafik Area & Gauge', 'Sinkronisasi Real-Time']
    : ['Drag-and-Drop Layout', 'Area & Gauge Charts', 'Real-Time Sync'];

  return (
    <>
      {/* ── Backdrop depth silhouettes (inverted diagonal vs Room3D) ── */}
      <div
        aria-hidden="true"
        className={`pop-ui-layer pop-from-tr ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: -16,
          right: -14,
          width: '60%',
          height: '56%',
          borderRadius: 24,
          border: `1.5px solid ${primary}38`,
          background: `linear-gradient(225deg, ${primary}14 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        className={`pop-ui-layer pop-from-bl ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -14,
          left: -12,
          width: '52%',
          height: '46%',
          borderRadius: 22,
          border: '1.5px solid rgba(255, 255, 255, 0.10)',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── 1. Top-Left Pop Card: Dashboard Capabilities Checklist ── */}
      <div
        className={`pop-ui-card pop-card-tl pop-from-tl pop-delay-1 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: -22,
          left: -16,
          zIndex: 12,
          width: 'auto',
          minWidth: 204,
          maxWidth: 236,
          padding: '12px 14px',
          borderRadius: 18,
          background: 'rgba(13, 18, 34, 0.86)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.20)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 20px 44px -12px rgba(0,0,0,0.85), 0 0 24px -6px ${glow}`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checklistItems.map((label, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${primary}, ${silk.right})`,
                  boxShadow: `0 4px 10px ${primary}55`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check size={11} strokeWidth={3} color="#06101c" />
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.90)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Mid-Right Pop Pill: Live Widgets Badge ── */}
      <div
        className={`pop-ui-card pop-card-mr pop-from-mr pop-delay-2 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          top: '30%',
          right: -22,
          zIndex: 13,
          padding: '10px 16px',
          borderRadius: 16,
          background: `linear-gradient(135deg, ${primary} 0%, ${silk.right} 100%)`,
          border: '1px solid rgba(255, 255, 255, 0.38)',
          boxShadow: `inset 0 1px 1px rgba(255,255,255,0.45), 0 18px 38px -8px ${primary}88, 0 10px 24px -8px rgba(0,0,0,0.75)`,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <Activity size={15} strokeWidth={2.5} color="#050b14" />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: '#050b14',
              fontFamily: 'Inter, system-ui, sans-serif',
              textTransform: 'uppercase',
            }}
          >
            LIVE WIDGET
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(5, 11, 20, 0.78)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Drag &amp; Drop
          </span>
        </div>
      </div>

      {/* ── 3. Bottom-Right Pop Card: TOTAL DEVICES KPI Card ── */}
      <div
        className={`pop-ui-card pop-card-br pop-from-br pop-delay-3 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -24,
          right: -14,
          zIndex: 13,
          width: 238,
          padding: '13px 15px 14px',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(6, 13, 38, 0.95) 0%, rgba(10, 20, 52, 0.94) 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(59, 130, 246, 0.28)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 22px 44px -10px rgba(0,0,0,0.9), 0 0 26px -8px ${glow}`,
          pointerEvents: 'none',
        }}
      >
        {/* Subtle decorative CPU chip watermark on right */}
        <Cpu
          size={62}
          strokeWidth={1.4}
          color="rgba(59, 130, 246, 0.16)"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            pointerEvents: 'none',
          }}
        />

        {/* Top row: TOTAL DEVICES + 0/2 Aktif badge */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'rgba(148, 163, 184, 0.88)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            TOTAL DEVICES
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(226, 232, 240, 0.92)',
            background: 'rgba(15, 23, 42, 0.72)',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            padding: '2.5px 8px',
            borderRadius: 999,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            <CheckCircle2 size={10.5} color="rgba(203, 213, 225, 0.85)" />
            <span>{lang === 'id' ? '0/2 Aktif' : '0/2 Active'}</span>
          </span>
        </div>

        {/* Main figure: 2 Unit */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          fontSize: 22,
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          marginBottom: 12,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          2 Unit
        </div>

        {/* Divider */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          height: 1,
          background: 'rgba(255, 255, 255, 0.08)',
          marginBottom: 9,
        }} />

        {/* Footer: Ketersediaan Node + 0 / 2 Unit (0%) */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 7,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <span style={{ fontSize: 10.5, fontWeight: 500, color: 'rgba(148, 163, 184, 0.88)' }}>
            {lang === 'id' ? 'Ketersediaan Node' : 'Node Availability'}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(203, 213, 225, 0.90)' }}>
            0 / 2 Unit (0%)
          </span>
        </div>

        {/* Progress Bar Track */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: 4,
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.09)',
          overflow: 'hidden',
        }} />
      </div>

      {/* ── 4. Bottom-Left Pop Interactive Widget: Lampu Ruang Tamu (MQTT Actuator Control) ── */}
      <div
        className={`pop-ui-card pop-card-bl pop-from-bl pop-delay-4 ${active ? 'pop-visible' : 'pop-hidden'}`}
        style={{
          position: 'absolute',
          bottom: -28,
          left: -16,
          zIndex: 14,
          width: 276,
          padding: '13px 14px 14px',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, rgba(6, 13, 38, 0.96) 0%, rgba(10, 20, 52, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(59, 130, 246, 0.28)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 26px 54px -12px rgba(0,0,0,0.92), 0 0 28px -8px ${glow}`,
          pointerEvents: active ? 'auto' : 'none',
        }}
      >
        {/* Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 11,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {lang === 'id' ? 'Lampu Ruang Tamu' : 'Living Room Light'}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 3,
                fontSize: 9.5,
                fontWeight: 500,
                color: 'rgba(148, 163, 184, 0.85)',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <Wifi size={10} color="#2dd4bf" />
              <span>MQTT Actuator Control</span>
            </div>
          </div>

          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.55)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={13} color="#ffffff" strokeWidth={2.2} />
          </div>
        </div>

        {/* Body Grid: Status & Power Info on Left, Circular Power Dial on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.22fr 0.78fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* Left: 2 Stacked Info Boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div
              style={{
                padding: '7px 10px',
                borderRadius: 10,
                background: 'rgba(13, 21, 46, 0.78)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: 'rgba(148, 163, 184, 0.82)',
                  marginBottom: 3,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {lang === 'id' ? 'Status Perangkat' : 'Device Status'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 6.5,
                    height: 6.5,
                    borderRadius: '50%',
                    background: lampOn ? '#22c55e' : '#64748b',
                    boxShadow: lampOn ? '0 0 8px rgba(34, 197, 94, 0.75)' : 'none',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: lampOn ? '#ffffff' : 'rgba(148, 163, 184, 0.75)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {lang === 'id' ? (lampOn ? 'Menyala' : 'Mati') : (lampOn ? 'Active' : 'Off')}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '7px 10px',
                borderRadius: 10,
                background: 'rgba(13, 21, 46, 0.78)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: 'rgba(148, 163, 184, 0.82)',
                  marginBottom: 2,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {lang === 'id' ? 'Daya & Topik' : 'Power & Topic'}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {lampOn ? '18 Watt' : '0 Watt'}
              </div>
              <div
                style={{
                  fontSize: 8.5,
                  color: 'rgba(148, 163, 184, 0.72)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  marginTop: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                home/living-room/light
              </div>
            </div>
          </div>

          {/* Right: Circular Interactive ON/OFF Power Dial with Arc Ring */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                width="84"
                height="84"
                viewBox="0 0 84 84"
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              >
                <defs>
                  <linearGradient id="lampArcGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="55%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 18 66 A 34 34 0 1 1 66 66"
                  fill="none"
                  stroke={lampOn ? 'url(#lampArcGrad)' : 'rgba(148, 163, 184, 0.22)'}
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.25s ease' }}
                />
              </svg>

              <button
                type="button"
                aria-label={lampOn ? 'Turn off light' : 'Turn on light'}
                onClick={(e) => {
                  e.stopPropagation();
                  setLampOn((v) => !v);
                }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  border: 'none',
                  background: lampOn
                    ? 'radial-gradient(circle at 35% 30%, #2563eb 0%, #155eef 70%, #1d4ed8 100%)'
                    : 'rgba(30, 41, 59, 0.9)',
                  boxShadow: lampOn
                    ? '0 0 22px rgba(37, 99, 235, 0.65), inset 0 1px 1px rgba(255,255,255,0.28)'
                    : 'inset 0 1px 1px rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  transition: 'transform 0.18s ease, background 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                <Power size={16} strokeWidth={2.3} />
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {lampOn ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── PHOTOREALISTIC MACBOOK PRO 3D PERSPECTIVE BASE (SVG) ──────────────────────
function MacBookProBase({ visible }) {
  return (
    <div
      aria-hidden="true"
      className="mac-pro-base"
      style={{
        width: '116%',
        marginLeft: '-8%',
        marginTop: visible ? -1 : 0,
        maxHeight: visible ? 92 : 0,
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        transition: 'max-height 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
      }}
    >
      <svg
        viewBox="0 0 1000 108"
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Anodized Space Gray top deck surface */}
          <linearGradient id="mbpDeckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#262932" />
            <stop offset="8%" stopColor="#484e5c" />
            <stop offset="22%" stopColor="#343944" />
            <stop offset="50%" stopColor="#434957" />
            <stop offset="78%" stopColor="#343944" />
            <stop offset="92%" stopColor="#484e5c" />
            <stop offset="100%" stopColor="#262932" />
          </linearGradient>

          {/* Subtle front-to-back lighting falloff on deck */}
          <linearGradient id="mbpDeckShade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#090b10" stopOpacity="0.62" />
            <stop offset="28%" stopColor="#1b1f29" stopOpacity="0.18" />
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.16" />
          </linearGradient>

          {/* Machined front chassis lip gradient */}
          <linearGradient id="mbpFrontLip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1a1d24" />
            <stop offset="3%" stopColor="#5a6171" />
            <stop offset="10%" stopColor="#3e4452" />
            <stop offset="35%" stopColor="#323743" />
            <stop offset="50%" stopColor="#3b404e" />
            <stop offset="65%" stopColor="#323743" />
            <stop offset="90%" stopColor="#3e4452" />
            <stop offset="97%" stopColor="#5a6171" />
            <stop offset="100%" stopColor="#1a1d24" />
          </linearGradient>

          {/* Vertical curvature shading on front lip */}
          <linearGradient id="mbpFrontCurve" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="18%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.82" />
          </linearGradient>

          {/* Concave thumb scoop */}
          <linearGradient id="mbpNotchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#171a22" />
            <stop offset="20%" stopColor="#2c313d" />
            <stop offset="50%" stopColor="#3c4250" />
            <stop offset="80%" stopColor="#2c313d" />
            <stop offset="100%" stopColor="#171a22" />
          </linearGradient>

          {/* Speaker grille micro-dot pattern */}
          <pattern id="mbpSpeakerDots" width="6" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="#0b0d12" opacity="0.65" />
          </pattern>

          {/* Studio contact shadow */}
          <radialGradient id="mbpContactShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.85" />
            <stop offset="72%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Studio Contact Shadow */}
        <ellipse cx="500" cy="98" rx="488" ry="9" fill="url(#mbpContactShadow)" />

        {/* Slanted 3D Perspective Aluminum Deck */}
        <polygon points="69,0 931,0 996,68 4,68" fill="url(#mbpDeckGrad)" />
        <polygon points="69,0 931,0 996,68 4,68" fill="url(#mbpDeckShade)" />

        {/* Dark Recessed Hinge Channel */}
        <polygon points="104,0 896,0 902,6 98,6" fill="#06080c" />
        <line x1="104" y1="0.8" x2="896" y2="0.8" stroke="#2f3542" strokeWidth="1" opacity="0.7" />

        {/* Left & Right Speaker Grilles */}
        <polygon points="88,12 132,12 114,44 64,44" fill="url(#mbpSpeakerDots)" />
        <polygon points="868,12 912,12 936,44 886,44" fill="url(#mbpSpeakerDots)" />

        {/* Black Recessed Keyboard Well */}
        <polygon points="148,10 852,10 878,44 122,44" fill="#090b10" stroke="#1e222c" strokeWidth="0.9" />

        {/* 4 Perspective Rows of Sculpted Keycaps */}
        {/* Row 1 (Function keys) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 156 + i * 49.4;
          return (
            <rect key={`r1-${i}`} x={x} y="12.5" width="44.5" height="4.2" rx="1" fill="#1d212b" stroke="#2d3342" strokeWidth="0.45" />
          );
        })}
        {/* Row 2 (Number row) */}
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 149 + i * 50.4;
          return (
            <rect key={`r2-${i}`} x={x} y="19" width="45.2" height="5" rx="1" fill="#1b1f29" stroke="#2c3240" strokeWidth="0.45" />
          );
        })}
        {/* Row 3 (QWERTY / Home row) */}
        {Array.from({ length: 13 }).map((_, i) => {
          const x = 141 + i * 55.4;
          return (
            <rect key={`r3-${i}`} x={x} y="26.2" width="50" height="5.4" rx="1" fill="#191d27" stroke="#2b3140" strokeWidth="0.45" />
          );
        })}
        {/* Row 4 (Bottom row with wide Spacebar) */}
        <rect x="131" y="34" width="66" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />
        <rect x="203" y="34" width="56" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />
        <rect x="265" y="34" width="66" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />
        <rect x="337" y="34" width="326" height="6.2" rx="1.2" fill="#1a1e28" stroke="#2e3444" strokeWidth="0.5" />
        <rect x="669" y="34" width="66" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />
        <rect x="741" y="34" width="56" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />
        <rect x="803" y="34" width="66" height="6.2" rx="1.2" fill="#181c26" stroke="#2a303e" strokeWidth="0.5" />

        {/* Large Centered Force Touch Glass Trackpad */}
        <polygon
          points="318,47 682,47 700,67 300,67"
          fill="#282d38"
          stroke="#191c24"
          strokeWidth="1.2"
          opacity="0.92"
        />
        <line x1="320" y1="47.8" x2="680" y2="47.8" stroke="#4f5666" strokeWidth="0.7" opacity="0.5" />

        {/* Thick Machined Aluminum Front Chassis Lip */}
        <path
          d="M 4 68 L 996 68 L 996 79 Q 996 92 976 92 L 24 92 Q 4 92 4 79 Z"
          fill="url(#mbpFrontLip)"
        />
        <path
          d="M 4 68 L 996 68 L 996 79 Q 996 92 976 92 L 24 92 Q 4 92 4 79 Z"
          fill="url(#mbpFrontCurve)"
        />
        {/* Crisp Specular Top Edge Bevel */}
        <line x1="6" y1="68.5" x2="994" y2="68.5" stroke="rgba(255,255,255,0.38)" strokeWidth="1" />

        {/* Authentic Centered Concave Thumb Scoop */}
        <path
          d="M 418 68 L 582 68 L 576 76 Q 573 79 566 79 L 434 79 Q 427 79 424 76 Z"
          fill="url(#mbpNotchGrad)"
          stroke="rgba(0,0,0,0.65)"
          strokeWidth="0.9"
        />
        <line x1="432" y1="78.8" x2="568" y2="78.8" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

// ── THEME PHONE OVERLAY (Live Theme-Synced iPhone Mockup for 'color' feature) ─
function ThemePhoneOverlay({ active, activeTheme, lang }) {
  const isLight = activeTheme?.mode === 'light';
  const primary = activeTheme?.primary || '#0075ff';
  const screenBg = isLight ? '#f4f7fb' : '#070c1b';
  const cardBg = isLight ? '#ffffff' : 'rgba(18, 26, 48, 0.88)';
  const cardBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.09)';
  const textMain = isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isLight ? '#64748b' : 'rgba(148, 163, 184, 0.85)';

  return (
    <div
      className={`pop-ui-card pop-card-phone pop-from-br pop-delay-2 ${active ? 'pop-visible' : 'pop-hidden'}`}
      style={{
        position: 'absolute',
        right: -20,
        bottom: -14,
        zIndex: 15,
        width: 158,
        padding: 2.5,
        borderRadius: 34,
        /* Machined Titanium Outer Band */
        background: 'linear-gradient(145deg, #8b93a6 0%, #3a404f 18%, #161922 48%, #5e6678 82%, #232733 100%)',
        boxShadow: `
          0 34px 64px -12px rgba(0, 0, 0, 0.96),
          0 12px 24px -6px rgba(0, 0, 0, 0.85),
          0 0 36px -10px ${activeTheme?.glow || 'rgba(0,117,255,0.4)'}
        `,
        pointerEvents: 'none',
      }}
    >
      {/* Machined Titanium Side Buttons */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 46, width: 2.5, height: 14,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #9ca3af 0%, #4b5563 50%, #1f2937 100%)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 68, width: 2.5, height: 24,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #9ca3af 0%, #4b5563 50%, #1f2937 100%)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 98, width: 2.5, height: 24,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #9ca3af 0%, #4b5563 50%, #1f2937 100%)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', right: -2.5, top: 72, width: 2.5, height: 34,
          borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, #9ca3af 0%, #4b5563 50%, #1f2937 100%)',
        }}
      />

      {/* Pure Glossy Black Front Glass Bezel */}
      <div
        style={{
          padding: 5,
          borderRadius: 31.5,
          background: '#030407',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Inner Phone OLED Display */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '9 / 19.2',
            borderRadius: 26,
            overflow: 'hidden',
            background: screenBg,
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 9px 7px',
            transition: 'background 0.4s ease',
          }}
        >
          {/* Subtle glass reflection over OLED */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              pointerEvents: 'none',
              background: 'linear-gradient(130deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.015) 32%, transparent 33%)',
            }}
          />

          {/* Dynamic Island with subtle camera lens */}
          <div
            style={{
              position: 'relative',
              width: 48,
              height: 12,
              borderRadius: 999,
              background: '#020305',
              margin: '0 auto 8px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 4,
              boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08)',
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3b82f6 0%, #0f172a 70%)',
              }}
            />
          </div>

          {/* Mini App Top Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: primary,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.35s ease',
                }}
              >
                <Cpu size={8.5} color="#ffffff" strokeWidth={2.5} />
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: textMain,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Videa Link
              </span>
            </div>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16,185,129,0.7)',
              }}
            />
          </div>

          {/* Mini Theme Banner */}
          <div
            style={{
              padding: '7px 8px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${primary} 0%, ${activeTheme?.accent || primary} 100%)`,
              marginBottom: 7,
              transition: 'background 0.4s ease',
            }}
          >
            <div style={{ fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.82)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {lang === 'id' ? 'Tema Aktif' : 'Active Theme'}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#ffffff', marginTop: 1, fontFamily: 'Inter, system-ui, sans-serif' }}>
              {activeTheme?.label?.[lang] || activeTheme?.label?.id}
            </div>
          </div>

          {/* Mini 2-Col KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 7 }}>
            {[
              { label: 'NODES', val: '2 Unit' },
              { label: 'POINTS', val: '9.0k' },
            ].map((kpi, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 6px',
                  borderRadius: 9,
                  background: cardBg,
                  border: `1px solid ${cardBorder}`,
                  transition: 'background 0.4s ease, border-color 0.4s ease',
                }}
              >
                <div style={{ fontSize: 6.5, fontWeight: 700, color: textMuted, letterSpacing: '0.04em' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: textMain, marginTop: 2, fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {kpi.val}
                </div>
              </div>
            ))}
          </div>

          {/* Mini Sparkline Telemetry Card */}
          <div
            style={{
              padding: '7px 8px',
              borderRadius: 10,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              marginBottom: 7,
              transition: 'background 0.4s ease, border-color 0.4s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 7, fontWeight: 700, color: textMuted }}>TELEMETRY</span>
              <span style={{ fontSize: 7, fontWeight: 700, color: primary }}>LIVE</span>
            </div>
            <svg width="100%" height="26" viewBox="0 0 110 26" fill="none">
              <path
                d="M2 22 C16 20, 22 12, 36 15 C50 18, 62 7, 76 10 C90 13, 98 4, 108 3"
                stroke={primary}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="108" cy="3" r="2.6" fill={primary} />
            </svg>
          </div>

          {/* Mini Switch Card */}
          <div
            style={{
              padding: '6px 8px',
              borderRadius: 10,
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'auto',
              transition: 'background 0.4s ease, border-color 0.4s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: textMain }}>Smart Switch</div>
              <div style={{ fontSize: 6.5, color: textMuted }}>MQTT · Online</div>
            </div>
            <span
              style={{
                width: 22,
                height: 12,
                borderRadius: 999,
                background: primary,
                padding: 1.5,
                display: 'inline-flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                transition: 'background 0.35s ease',
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffffff' }} />
            </span>
          </div>

          {/* iOS Home Indicator */}
          <div
            style={{
              width: 42,
              height: 3,
              borderRadius: 999,
              background: isLight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(255, 255, 255, 0.28)',
              margin: '6px auto 0',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT (PINNED STICKY SCROLL TRACK · SIDE-BY-SIDE 2-COLUMN) ───────
export default function FeatureShowcase({ t, lang, activeTheme: propTheme, onThemeChange }) {
  const [internalTheme, setInternalTheme] = useState(THEMES[0]);
  const activeTheme = propTheme || internalTheme;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );
  const trackRef = useRef(null);
  const prevIdxRef = useRef(0);

  const features = getFeatures(t);

  // Map vertical scroll progress inside the tall sticky track → active feature index (0..6) on ALL viewports
  useEffect(() => {
    let rafId = null;

    const updateFromScroll = () => {
      rafId = null;
      setIsMobileView(window.innerWidth <= 860);
      const trackEl = trackRef.current;
      if (!trackEl) return;

      const rect = trackEl.getBoundingClientRect();
      const scrollable = Math.max(1, trackEl.offsetHeight - window.innerHeight);
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const progress = scrolled / scrollable;

      setScrollProgress(progress);

      const nextIdx = Math.min(features.length - 1, Math.floor(progress * features.length));
      if (nextIdx !== prevIdxRef.current) {
        setDirection(nextIdx > prevIdxRef.current ? 1 : -1);
        prevIdxRef.current = nextIdx;
        setActiveIndex(nextIdx);
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateFromScroll);
      }
    };

    updateFromScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [features.length]);

  const jumpToFeature = (idx) => {
    setDirection(idx >= prevIdxRef.current ? 1 : -1);
    prevIdxRef.current = idx;
    setActiveIndex(idx);

    const trackEl = trackRef.current;
    if (!trackEl) return;

    const trackTop = trackEl.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, trackEl.offsetHeight - window.innerHeight);
    const targetProgress = (idx + 0.35) / features.length;
    window.scrollTo({
      top: trackTop + targetProgress * scrollable,
      behavior: 'smooth',
    });
  };

  const selectTheme = (th) => {
    if (onThemeChange) {
      onThemeChange(th);
    } else {
      setInternalTheme(th);
    }

    try {
      const colorName = th.id.replace('dark-', '').replace('light-', '');
      if (colorName === 'blue') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', colorName);
      }

      if (th.mode === 'light') {
        document.documentElement.setAttribute('data-mode', 'light');
      } else {
        document.documentElement.removeAttribute('data-mode');
      }

      window.dispatchEvent(new CustomEvent('theme-updated'));
    } catch (e) { }
  };

  const activeFeat = features[activeIndex] || features[0];
  const isColorItem = activeFeat?.isColor;
  const previewSrc = isColorItem ? activeTheme.image : activeFeat.image;
  const previewGlow = isColorItem ? activeTheme.glow : activeFeat.glow;
  const hasPopUI = activeFeat?.id === 'room3d' || activeFeat?.id === 'realtime';
  const silk = getSilkPaletteTokens(activeTheme?.primary || '#06b6d4');

  return (
    <section
      id="features"
      ref={trackRef}
      className="mac-feat-track"
      style={{
        position: 'relative',
        zIndex: 10,
        scrollMarginTop: '80px',
        background: 'transparent',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* ── Pinned Sticky Viewport Stage (Side-by-Side 2-Column stays locked while scrolling) ── */}
      <div className="mac-feat-sticky-stage">
        {/* ── Editorial Split Heading ── */}
        <div
          className="mac-feat-heading"
          style={{
            width: '100%',
            maxWidth: 1240,
            margin: '0 auto 36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            alignItems: 'end',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '12px',
                letterSpacing: '0.06em',
                color: 'rgba(255, 255, 255, 0.45)',
                marginBottom: '14px',
              }}
            >
              03 / {lang === 'id' ? 'Fitur Inti · Scroll untuk Jelajah' : 'Core Features · Scroll to Explore'}
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 3.8vw, 2.95rem)',
                fontWeight: 400,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                lineHeight: 1.08,
                textWrap: 'balance',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {t.featMagic}
            </h2>
          </div>

          <p
            style={{
              fontSize: '15.5px',
              color: 'rgba(255, 255, 255, 0.62)',
              maxWidth: 460,
              marginLeft: 'auto',
              lineHeight: 1.65,
              textWrap: 'pretty',
              fontFamily: 'Inter, system-ui, sans-serif',
              margin: 0,
            }}
          >
            {t.featDesc}
          </p>
        </div>

        {/* ── Two-Column Side-by-Side Layout (Left Accordion + Single Right Preview) ── */}
        <div
          className="mac-feat-grid"
          style={{
            width: '100%',
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 430px) 1fr',
            gap: 'clamp(32px, 5vw, 64px)',
            alignItems: 'center',
          }}
        >
          {/* ── LEFT: Architectural Accordion (auto-opens smoothly on scroll) ── */}
          <div
            className="mac-feat-accordion"
            style={{
              minWidth: 0,
              width: '100%',
              background: silk.cardSurface,
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 24,
              border: '1px solid rgba(255, 255, 255, 0.11)',
              padding: '6px 24px',
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 24px 60px -20px rgba(0, 0, 0, 0.78)',
            }}
          >
            {features.map((feat, idx) => {
              const isOpen = activeIndex === idx;
              const Icon = feat.icon;

              return (
                <div
                  key={feat.id}
                  className={`mac-feat-item ${isOpen ? 'mac-feat-item-open' : 'mac-feat-item-closed'}`}
                  style={{
                    borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  {/* Feature header — murni mengikuti scroll (tanpa klik & tanpa ikon +/-) */}
                  <div
                    className="mac-feat-item-header"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 0',
                      textAlign: 'left',
                      gap: 12,
                      cursor: 'default',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {feat.isColor ? (
                        <div style={{
                          width: 17,
                          height: 17,
                          borderRadius: '50%',
                          background: activeTheme.primary,
                          border: '2px solid rgba(255,255,255,0.22)',
                          flexShrink: 0,
                          transition: 'background 0.35s ease',
                        }} />
                      ) : Icon ? (
                        <Icon
                          size={17}
                          strokeWidth={2}
                          color={isOpen ? activeTheme.primary : 'rgba(255,255,255,0.52)'}
                          style={{ flexShrink: 0, transition: 'color 0.35s ease' }}
                        />
                      ) : null}

                      <span style={{
                        fontSize: 15,
                        fontWeight: isOpen ? 600 : 500,
                        color: isOpen ? '#ffffff' : 'rgba(255,255,255,0.52)',
                        letterSpacing: '-0.012em',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        transition: 'color 0.3s ease',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {t[feat.labelKey]}
                      </span>
                    </div>
                  </div>

                  {/* Smooth collapsible body */}
                  <div style={{
                    overflow: 'hidden',
                    maxHeight: isOpen ? 420 : 0,
                    opacity: isOpen ? 1 : 0,
                    transition: 'max-height 0.52s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease',
                  }}>
                    <div style={{
                      paddingBottom: 18,
                      paddingLeft: (feat.icon || feat.isColor) ? 32 : 0,
                    }}>
                      {feat.isColor && (() => {
                        const currentMode = activeTheme.mode || 'dark';
                        const currentAccentKey = activeTheme.id.replace('dark-', '').replace('light-', '');
                        const modeThemes = THEMES.filter((th) => th.mode === currentMode);
                        const accentNames = {
                          cyan: 'Cyan',
                          emerald: 'Emerald',
                          violet: 'Violet',
                          rose: 'Rose',
                          amber: 'Amber',
                        };

                        const switchMode = (nextMode) => {
                          const match = THEMES.find((th) => th.id === `${nextMode}-${currentAccentKey}`)
                            || THEMES.find((th) => th.mode === nextMode);
                          if (match) selectTheme(match);
                        };

                        return (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ marginBottom: 16 }}
                          >
                            {/* Single Clean Control Bar: Apple-style Swatches (Left) + Quiet Mode Pill (Right) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                paddingBottom: 12,
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              {/* 5 Tactile Minimal Swatch Dots (Apple hardware style) */}
                              <div
                                role="radiogroup"
                                aria-label={lang === 'id' ? 'Warna aksen' : 'Accent color'}
                                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                              >
                                {modeThemes.map((th) => {
                                  const selected = activeTheme.id === th.id;
                                  return (
                                    <button
                                      key={th.id}
                                      type="button"
                                      role="radio"
                                      aria-checked={selected}
                                      onClick={() => selectTheme(th)}
                                      title={th.label[lang] || th.label.en}
                                      aria-label={th.label[lang] || th.label.en}
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: '50%',
                                        padding: 3,
                                        background: 'transparent',
                                        border: selected
                                          ? '1.5px solid rgba(255, 255, 255, 0.92)'
                                          : '1.5px solid transparent',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'border-color 0.22s ease, transform 0.2s ease',
                                        transform: selected ? 'scale(1.08)' : 'scale(1)',
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          borderRadius: '50%',
                                          background: th.primary,
                                          display: 'block',
                                          opacity: selected ? 1 : 0.72,
                                          transition: 'opacity 0.2s ease',
                                        }}
                                      />
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Minimal Dark / Light Pill Toggle */}
                              <div
                                role="group"
                                aria-label={lang === 'id' ? 'Mode tampilan' : 'Surface mode'}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: 3,
                                  borderRadius: 999,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.09)',
                                  gap: 2,
                                }}
                              >
                                {[
                                  { key: 'dark', label: lang === 'id' ? 'Gelap' : 'Dark', IconComp: Moon },
                                  { key: 'light', label: lang === 'id' ? 'Terang' : 'Light', IconComp: Sun },
                                ].map(({ key, label, IconComp }) => {
                                  const active = currentMode === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => switchMode(key)}
                                      title={label}
                                      aria-label={label}
                                      aria-pressed={active}
                                      style={{
                                        width: 28,
                                        height: 24,
                                        borderRadius: 999,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: active ? '#07090f' : 'rgba(255, 255, 255, 0.55)',
                                        background: active ? '#ffffff' : 'transparent',
                                        transition: 'background 0.22s ease, color 0.22s ease',
                                      }}
                                    >
                                      <IconComp size={12.5} strokeWidth={2.2} />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Quiet Metadata Line */}
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 11.5,
                                fontFamily: 'Inter, system-ui, sans-serif',
                              }}
                            >
                              <span style={{ color: 'rgba(255, 255, 255, 0.80)', fontWeight: 500 }}>
                                {activeTheme.label[lang] || activeTheme.label.en}
                              </span>
                              <span
                                style={{
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                  fontSize: 11,
                                  color: 'rgba(255, 255, 255, 0.42)',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {activeTheme.primary.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <p style={{
                        fontSize: 13.5,
                        color: 'rgba(255, 255, 255, 0.72)',
                        lineHeight: 1.68,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        margin: 0,
                      }}>
                        {t[feat.descKey]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Single Side-by-Side Stage (Smooth Glide + Pop UI) ── */}
          <div className="mac-feat-preview" style={{ position: 'relative', minWidth: 0, width: '100%' }}>
            {/* Ambient glow behind preview */}
            <div style={{
              position: 'absolute',
              inset: '-24px',
              borderRadius: 40,
              background: `radial-gradient(ellipse at 50% 50%, ${previewGlow} 0%, transparent 70%)`,
              filter: 'blur(34px)',
              opacity: 0.75,
              pointerEvents: 'none',
              transition: 'background 0.65s ease',
              zIndex: 0,
            }} />

            <div className="mac-feat-stage-inner" style={{ position: 'relative', zIndex: 1 }}>
              <div className={`mac-feat-device-wrap ${isColorItem ? 'mac-feat-device-macbook' : ''}`} style={{ position: 'relative' }}>
                <Room3DPopUIOverlay
                  active={activeFeat?.id === 'room3d'}
                  primary={activeTheme.primary}
                  glow={previewGlow}
                  lang={lang}
                />
                <DashboardPopUIOverlay
                  active={activeFeat?.id === 'realtime'}
                  primary={activeTheme.primary}
                  glow={previewGlow}
                  lang={lang}
                />
                <ThemePhoneOverlay
                  active={isColorItem}
                  activeTheme={activeTheme}
                  lang={lang}
                />

                {/* Main Viewport — Photorealistic MacBook Pro Space-Black Hardware Frame when 'Tema Warna & Mode UI' is active */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  {/* Outer Machined Aluminum Lid Rim */}
                  <div
                    style={{
                      position: 'relative',
                      padding: isColorItem ? 2 : 0,
                      borderRadius: isColorItem ? '18px 18px 4px 4px' : 26,
                      background: isColorItem
                        ? 'linear-gradient(135deg, #687082 0%, #2a2f3c 16%, #141720 50%, #444b5c 84%, #1d212b 100%)'
                        : 'transparent',
                      boxShadow: isColorItem
                        ? '0 26px 58px -14px rgba(0,0,0,0.92)'
                        : 'none',
                      transition: 'padding 0.4s ease, border-radius 0.4s ease',
                    }}
                  >
                    {/* Pure Glossy Black MacBook Screen Bezel */}
                    <div
                      style={{
                        position: 'relative',
                        padding: isColorItem ? '10px 10px 12px' : 0,
                        borderRadius: isColorItem ? '16px 16px 3px 3px' : 26,
                        background: isColorItem ? '#030407' : 'transparent',
                        boxShadow: isColorItem ? 'inset 0 0 0 1px rgba(255,255,255,0.06)' : 'none',
                        transition: 'padding 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.4s ease',
                      }}
                    >
                      {/* Authentic MacBook Pro Camera Notch */}
                      {isColorItem && (
                        <div
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 72,
                            height: 12,
                            borderRadius: '0 0 8px 8px',
                            background: '#030407',
                            zIndex: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              width: 4.5,
                              height: 4.5,
                              borderRadius: '50%',
                              background: 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #0f172a 75%)',
                              boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
                            }}
                          />
                        </div>
                      )}

                      <CrossfadeImage
                        src={previewSrc}
                        alt={t[activeFeat?.labelKey] || ''}
                        glow={previewGlow}
                        primary={activeTheme.primary}
                        fit={(hasPopUI || isColorItem) ? 'contain' : 'cover'}
                        aspectRatio={(hasPopUI || isColorItem) ? '16 / 9' : '16 / 10'}
                        direction={direction}
                        frameless={isColorItem}
                        vertical={isMobileView}
                      />
                    </div>
                  </div>

                  {/* Photorealistic 3D Perspective MacBook Pro Base Deck (Keyboard + Trackpad + Thumb Scoop) */}
                  <MacBookProBase visible={isColorItem} />
                </div>
              </div>

              {/* Smooth Scroll Progress Indicator + Feature Pill */}
              <div
                className="mac-feat-indicator"
                style={{
                  marginTop: hasPopUI ? 38 : 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'margin-top 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'rgba(8, 10, 20, 0.62)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.14)',
                }}>
                  {activeFeat.icon ? (
                    <activeFeat.icon size={13} color={activeTheme.primary} style={{ flexShrink: 0 }} />
                  ) : (
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: activeTheme.swatch, display: 'inline-block',
                    }} />
                  )}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.86)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}>
                    {t[activeFeat?.labelKey]}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.42)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}>
                    {String(activeIndex + 1).padStart(2, '0')}/{String(features.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Scroll Step Dots Indicator (non-clickable — pure scroll-driven) */}
                <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {features.map((f, idx) => {
                    const isCurr = idx === activeIndex;
                    return (
                      <span
                        key={f.id}
                        style={{
                          display: 'block',
                          width: isCurr ? 28 : 7,
                          height: 7,
                          borderRadius: 999,
                          background: isCurr ? activeTheme.primary : 'rgba(255,255,255,0.22)',
                          boxShadow: isCurr ? `0 0 12px ${activeTheme.primary}` : 'none',
                          transition: 'width 0.42s cubic-bezier(0.22, 1, 0.36, 1), background 0.35s ease',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Subtle continuous scroll progress hairline (desktop) */}
                <div
                  className="mac-feat-progress-bar"
                  style={{
                    width: 160,
                    height: 2,
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.09)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(4, scrollProgress * 100)}%`,
                      height: '100%',
                      background: activeTheme.primary,
                      boxShadow: `0 0 8px ${activeTheme.primary}`,
                      transition: 'width 0.12s linear',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pop UI animations & Responsive overrides ── */}
      <style>{`
        /* Ambient float animates independent CSS 'translate' so it NEVER hijacks 'transform' enter/exit transitions */
        @keyframes popFloatA {
          0%, 100% { translate: 0px 0px; }
          50%      { translate: 0px -7px; }
        }
        @keyframes popFloatB {
          0%, 100% { translate: 0px 0px; }
          50%      { translate: 0px 6px; }
        }
        @keyframes popFloatC {
          0%, 100% { translate: 0px 0px; }
          50%      { translate: 0px -5px; }
        }

        .pop-ui-card,
        .pop-ui-layer {
          will-change: transform, opacity, filter;
        }

        /* Crisp directional exit animation */
        .pop-hidden {
          opacity: 0 !important;
          filter: blur(8px);
          pointer-events: none !important;
          transition: opacity 0.28s cubic-bezier(0.4, 0, 1, 1) 0ms,
                      transform 0.34s cubic-bezier(0.4, 0, 1, 1) 0ms,
                      filter 0.28s ease-in 0ms;
        }
        .pop-hidden.pop-from-tr { transform: translate3d(38px, -28px, 0) scale(0.76) rotate(4deg) !important; }
        .pop-hidden.pop-from-tl { transform: translate3d(-38px, -28px, 0) scale(0.76) rotate(-4deg) !important; }
        .pop-hidden.pop-from-ml { transform: translate3d(-44px, 0px, 0) scale(0.74) rotate(-5deg) !important; }
        .pop-hidden.pop-from-mr { transform: translate3d(44px, 0px, 0) scale(0.74) rotate(5deg) !important; }
        .pop-hidden.pop-from-bl { transform: translate3d(-38px, 32px, 0) scale(0.78) rotate(-3deg) !important; }
        .pop-hidden.pop-from-br { transform: translate3d(38px, 32px, 0) scale(0.78) rotate(3deg) !important; }

        /* Springy staggered pop-in entrance animation */
        .pop-visible {
          opacity: 1;
          filter: blur(0px);
          transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          transition: opacity 0.48s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.62s cubic-bezier(0.34, 1.42, 0.64, 1),
                      filter 0.42s ease-out;
        }
        .pop-visible.pop-delay-1 { transition-delay: 50ms; }
        .pop-visible.pop-delay-2 { transition-delay: 130ms; }
        .pop-visible.pop-delay-3 { transition-delay: 210ms; }
        .pop-visible.pop-delay-4 { transition-delay: 290ms; }

        /* Gentle ambient float starts after pop-in finishes */
        .pop-card-tr.pop-visible,
        .pop-card-tl.pop-visible { animation: popFloatA 5.2s ease-in-out 0.75s infinite; }
        .pop-card-ml.pop-visible,
        .pop-card-mr.pop-visible { animation: popFloatB 4.6s ease-in-out 0.90s infinite; }
        .pop-card-bl.pop-visible { animation: popFloatC 5.6s ease-in-out 1.05s infinite; }
        .pop-card-br.pop-visible,
        .pop-card-phone.pop-visible { animation: popFloatA 6.0s ease-in-out 1.20s infinite; }

        .pop-card-br button:hover,
        .pop-card-bl button:hover {
          transform: translateY(-1px) scale(1.03);
        }
        .pop-card-br button:active,
        .pop-card-bl button:active {
          transform: scale(0.96);
        }

        @media (prefers-reduced-motion: reduce) {
          .pop-card-tr.pop-visible,
          .pop-card-tl.pop-visible,
          .pop-card-ml.pop-visible,
          .pop-card-mr.pop-visible,
          .pop-card-bl.pop-visible,
          .pop-card-br.pop-visible {
            animation: none !important;
          }
          .pop-ui-card,
          .pop-ui-layer {
            transition-duration: 0.15s !important;
          }
        }

        /* ── Pinned Sticky Scroll Track (Desktop, Tablet & Mobile) ── */
        .mac-feat-track {
          height: 380vh;
        }
        .mac-feat-sticky-stage {
          position: sticky;
          top: 0;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: clip;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(84px, 9vh, 108px) clamp(24px, 4vw, 48px) clamp(36px, 5vh, 56px);
        }

        @media (max-width: 1100px) and (min-width: 641px) {
          .pop-ui-card {
            zoom: 0.82;
          }
          .pop-card-tr,
          .pop-card-mr,
          .pop-card-br,
          .pop-card-phone {
            right: 4px !important;
          }
          .pop-card-tl,
          .pop-card-ml,
          .pop-card-bl {
            left: 4px !important;
          }
          .pop-backdrop-tl { left: -4px !important; }
          .pop-backdrop-br { right: -4px !important; }
        }

        @media (max-width: 860px) {
          .mac-feat-track {
            height: 340vh !important;
          }
          .mac-feat-sticky-stage {
            position: sticky !important;
            top: 0 !important;
            min-height: 100dvh !important;
            justify-content: center !important;
            padding: 68px 16px 24px !important;
          }
          .mac-feat-heading {
            margin-bottom: 14px !important;
            gap: 8px !important;
          }
          .mac-feat-heading p {
            display: none !important;
          }
          .mac-feat-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .mac-feat-accordion {
            padding: 4px 14px !important;
            border-radius: 18px !important;
          }
          .mac-feat-item-header {
            padding: 10px 0 !important;
          }
          /* Keep sticky stage within 100dvh on mobile by showing only the active scrolled feature card above the preview */
          .mac-feat-item-closed {
            display: none !important;
          }
          .mac-feat-item-open {
            border-top: none !important;
          }
          .mac-feat-device-macbook {
            padding: 0 7% !important;
          }
        }

        @media (max-width: 640px) {
          /* Scale floating pop-UI cards & iPhone proportionally so ALL stay visible with zero clipping and zero text truncation */
          .pop-ui-card {
            zoom: 0.56;
          }
          .pop-card-tr {
            top: -12px !important;
            right: 4px !important;
          }
          .pop-card-tl {
            top: -12px !important;
            left: 4px !important;
          }
          .pop-card-ml {
            left: 4px !important;
            top: 32% !important;
          }
          .pop-card-mr {
            right: 4px !important;
            top: 28% !important;
          }
          .pop-card-bl {
            left: 4px !important;
            bottom: -18px !important;
          }
          .pop-card-br {
            right: 4px !important;
            bottom: -18px !important;
          }
          .pop-card-phone {
            zoom: 0.64;
            right: 2px !important;
            bottom: -8px !important;
          }
          .pop-backdrop-tl {
            top: -8px !important;
            left: -2px !important;
          }
          .pop-backdrop-br {
            bottom: -8px !important;
            right: -2px !important;
          }
          .mac-feat-indicator {
            margin-top: 22px !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </section>
  );
}
