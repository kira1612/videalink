import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Wifi, Activity, Shield, Layers, Bell, Box, Moon, Sun, Check, Play, Power, X, Cpu, CheckCircle2, Zap, Search, RefreshCw, SlidersHorizontal, Pencil, Database, Share2, Home, Menu, ArrowRight, MoreVertical, AlertCircle } from 'lucide-react';
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

// ── CROSSFADE IMAGE VIEWER (DUAL-SLOT A/B, ZERO-FLICKER, GPU-DECODED) ──────────
// Menggunakan 2 slot <img> permanen (Slot 0 & Slot 1) tanpa unmount/remount saat
// pergantian selesai, menunggu decode() gambar baru sebelum animasi dimulai, dan
// mempertahankan struktur DOM tunggal antara mode frameless & framed agar transisi
// antar fitur 01..07 benar-benar mulus tanpa kedip atau lompatan layout.
function CrossfadeImage({ src, alt, glow, primary, fit = 'cover', aspectRatio = '16 / 9', direction = 1, frameless = false, vertical = false, pureFade = false }) {
  const [slots, setSlots] = useState([
    { src, fit, error: false },
    { src: null, fit, error: false },
  ]);
  const [activeSlot, setActiveSlot] = useState(0);
  const [preparingSlot, setPreparingSlot] = useState(null);
  const [animating, setAnimating] = useState(false);

  const activeSlotRef = useRef(0);
  const currentSrcRef = useRef(src);
  const reqIdRef = useRef(0);
  const raf1Ref = useRef(null);
  const raf2Ref = useRef(null);
  const doneTimerRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Jika src sama, cukup perbarui fit pada slot aktif tanpa memicu transisi ulang
    if (src === currentSrcRef.current) {
      setSlots((prev) =>
        prev.map((s, idx) => (idx === activeSlotRef.current ? { ...s, fit } : s))
      );
      return;
    }

    const reqId = ++reqIdRef.current;
    cancelAnimationFrame(raf1Ref.current);
    cancelAnimationFrame(raf2Ref.current);
    clearTimeout(doneTimerRef.current);

    let cancelled = false;

    const startTransition = (hasError = false) => {
      if (cancelled || reqId !== reqIdRef.current) return;

      const targetSlot = activeSlotRef.current === 0 ? 1 : 0;
      currentSrcRef.current = src;

      // 1. Siapkan gambar baru di slot tidak aktif pada posisi awal (opacity 0, tanpa transition)
      setPreparingSlot(targetSlot);
      setAnimating(false);
      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === targetSlot ? { src, fit, error: hasError } : s
        )
      );

      // 2. Setelah browser commit posisi awal, aktifkan transisi halus ke slot baru
      raf1Ref.current = requestAnimationFrame(() => {
        raf2Ref.current = requestAnimationFrame(() => {
          if (cancelled || reqId !== reqIdRef.current) return;
          activeSlotRef.current = targetSlot;
          setPreparingSlot(null);
          setActiveSlot(targetSlot);
          setAnimating(true);

          const durationMs = pureFade ? 380 : 580;
          doneTimerRef.current = setTimeout(() => {
            if (cancelled || reqId !== reqIdRef.current) return;
            setAnimating(false);
          }, durationMs);
        });
      });
    };

    // Preload + decode gambar baru dulu agar tidak ada flash kosong/hitam saat fade-in
    const preloader = new Image();
    preloader.src = src;

    if (preloader.complete && preloader.naturalWidth > 0) {
      if (typeof preloader.decode === 'function') {
        preloader.decode().then(() => startTransition(false)).catch(() => startTransition(false));
      } else {
        startTransition(false);
      }
    } else {
      const onReady = () => {
        if (typeof preloader.decode === 'function') {
          preloader.decode().then(() => startTransition(false)).catch(() => startTransition(false));
        } else {
          startTransition(false);
        }
      };
      preloader.onload = onReady;
      preloader.onerror = () => startTransition(true);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1Ref.current);
      cancelAnimationFrame(raf2Ref.current);
      clearTimeout(doneTimerRef.current);
    };
  }, [src, fit, pureFade]);

  const Placeholder = ({ opacity, zIndex, color }) => (
    <div style={{
      position: 'absolute',
      inset: 0,
      zIndex,
      opacity,
      transition: 'opacity 0.5s ease',
      background: `linear-gradient(135deg, #0d1117 0%, ${color}1a 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    }}>
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

  const exitOffset = pureFade
    ? 'translate3d(0, 0, 0) scale(1)'
    : vertical
      ? `translate3d(0, ${direction > 0 ? '-10px' : '10px'}, 0) scale(0.985)`
      : `translate3d(${direction > 0 ? '-14px' : '14px'}, 0, 0) scale(0.985)`;

  const enterOffset = pureFade
    ? 'translate3d(0, 0, 0) scale(1)'
    : vertical
      ? `translate3d(0, ${direction > 0 ? '14px' : '-14px'}, 0) scale(1.012)`
      : `translate3d(${direction > 0 ? '18px' : '-18px'}, 0, 0) scale(1.012)`;

  const transitionCss = pureFade
    ? 'opacity 0.36s cubic-bezier(0.22, 1, 0.36, 1)'
    : 'opacity 0.52s cubic-bezier(0.22, 1, 0.36, 1), transform 0.56s cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      padding: frameless ? 0 : 8,
      borderRadius: frameless ? 6 : 26,
      background: frameless ? 'transparent' : silk.cardSurface,
      backdropFilter: frameless ? 'none' : 'blur(24px)',
      WebkitBackdropFilter: frameless ? 'none' : 'blur(24px)',
      border: frameless ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.14)',
      boxShadow: frameless
        ? 'none'
        : `
          inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
          0 32px 90px -22px ${glow},
          0 24px 60px -14px rgba(2, 4, 10, 0.85)
        `,
      transition: 'padding 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.4s ease, box-shadow 0.55s ease, border-color 0.4s ease, background 0.4s ease',
    }}>
      {/* Concentric inner radius: 26px outer - 8px padding = 18px inner */}
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: frameless ? 6 : 18,
        overflow: 'hidden',
        aspectRatio,
        background: frameless ? '#02040a' : '#050811',
        outline: frameless ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.10)',
        outlineOffset: '-1px',
        transition: 'border-radius 0.4s ease, outline-color 0.4s ease',
      }}>
        {slots.map((slot, idx) => {
          if (!slot.src) return null;
          const isActive = idx === activeSlot;
          const isPreparing = idx === preparingSlot;

          // Slot aktif berada di atas (zIndex 2) & fade-in ke opacity 1.
          // Slot lama tetap berada di bawah (zIndex 1) dengan opacity 1 selama transisi
          // agar tidak ada "dark dip" di tengah crossfade, lalu sembunyi setelah selesai.
          const zIndex = isPreparing ? 3 : isActive ? 2 : 1;
          const opacity = isPreparing ? 0 : isActive ? 1 : (animating ? 1 : 0);
          const transform = isPreparing
            ? enterOffset
            : isActive
              ? 'translate3d(0, 0, 0) scale(1)'
              : exitOffset;

          if (slot.error) {
            return <Placeholder key={`slot-${idx}`} opacity={opacity} zIndex={zIndex} color={primary} />;
          }

          return (
            <img
              key={`slot-${idx}`}
              src={slot.src}
              alt={alt}
              decoding="async"
              onError={() => {
                setSlots((prev) =>
                  prev.map((s, i) => (i === idx ? { ...s, error: true } : s))
                );
              }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: slot.fit || fit,
                display: 'block',
                opacity,
                transform,
                zIndex,
                willChange: pureFade ? 'opacity' : 'opacity, transform',
                transition: isPreparing ? 'none' : transitionCss,
                pointerEvents: 'none',
              }}
            />
          );
        })}

        {/* Subtle angled glass display glare (hanya tampil halus saat mode MacBook) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            pointerEvents: 'none',
            opacity: frameless ? 1 : 0,
            transition: 'opacity 0.4s ease',
            background: 'linear-gradient(122deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.015) 34%, transparent 35%)',
          }}
        />
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
      image: '/assets/room3d-editor.jpg?v=4',
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
            src="/assets/room3d-avatar.jpg?v=2"
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
          background: `linear-gradient(145deg, ${silk.deepRgba(0.95)} 0%, ${silk.surfaceRgba(0.92)} 100%)`,
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: `1px solid ${primary}48`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 22px 44px -10px rgba(0,0,0,0.9), 0 0 26px -8px ${glow}`,
          pointerEvents: 'none',
          transition: 'border-color 0.45s ease, box-shadow 0.45s ease',
        }}
      >
        {/* Subtle decorative CPU chip watermark on right */}
        <Cpu
          size={62}
          strokeWidth={1.4}
          color={`${primary}30`}
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
          background: `linear-gradient(145deg, ${silk.deepRgba(0.96)} 0%, ${silk.surfaceRgba(0.93)} 100%)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${primary}48`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 26px 54px -12px rgba(0,0,0,0.92), 0 0 28px -8px ${glow}`,
          pointerEvents: active ? 'auto' : 'none',
          transition: 'border-color 0.45s ease, box-shadow 0.45s ease',
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
              <Wifi size={10} color={silk.left} />
              <span>MQTT Actuator Control</span>
            </div>
          </div>

          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${primary} 0%, ${silk.right} 100%)`,
              boxShadow: `0 4px 14px ${primary}77`,
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
                background: silk.deepRgba(0.75),
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
                background: silk.deepRgba(0.75),
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
                    <stop offset="0%" stopColor={silk.left} />
                    <stop offset="55%" stopColor={primary} />
                    <stop offset="100%" stopColor={silk.right} />
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
                    ? `radial-gradient(circle at 35% 30%, ${silk.left} 0%, ${primary} 70%, ${silk.right} 100%)`
                    : 'rgba(30, 41, 59, 0.9)',
                  boxShadow: lampOn
                    ? `0 0 22px ${primary}99, inset 0 1px 1px rgba(255,255,255,0.28)`
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

// ── THEME PHONE OVERLAY (Live Theme-Synced iPhone 15/16 Pro Mockup for 'color' feature) ─
function ThemePhoneOverlay({ active, activeTheme, lang }) {
  const isLight = activeTheme?.mode === 'light';
  const primary = activeTheme?.primary || '#0075ff';
  const accent = activeTheme?.accent || primary;
  const screenBg = isLight
    ? `radial-gradient(circle at 85% 6%, ${primary}14 0%, #f4f7fb 46%, #eef2f8 100%)`
    : `radial-gradient(circle at 88% 8%, ${primary}22 0%, #090a0e 42%, #06070a 100%)`;
  const cardBg = isLight
    ? '#ffffff'
    : `linear-gradient(155deg, ${primary}18 0%, rgba(16, 17, 22, 0.94) 56%, ${primary}12 100%)`;
  const cardBorder = isLight ? 'rgba(15, 23, 42, 0.08)' : `${primary}36`;
  const pillBg = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.08)';
  const textMain = isLight ? '#0f172a' : '#f8fafc';
  const textMuted = isLight ? '#64748b' : 'rgba(176, 184, 199, 0.78)';
  const accentText = isLight ? primary : accent;

  // Authentic iPhone 15/16 Pro logical viewport (393 × 852) scaled crisply into 157 × 340 OLED
  const LOGICAL_W = 393;
  const LOGICAL_H = 852;
  const SCREEN_W = 157;
  const SCALE = SCREEN_W / LOGICAL_W;
  const SCREEN_H = Math.round(LOGICAL_H * SCALE);

  const kpiCards = [
    {
      label: 'TOTAL DEVICES',
      badge: lang === 'id' ? '2 Terdaftar' : '2 Registered',
      value: '2 Unit',
      Icon: Cpu,
      isGreenBadge: false,
    },
    {
      label: 'ONLINE NOW',
      badge: 'Standby',
      value: lang === 'id' ? '0 Aktif' : '0 Active',
      Icon: Wifi,
      isGreenBadge: false,
    },
    {
      label: 'DATA POINTS',
      badge: lang === 'id' ? '+1.2k / jam' : '+1.2k / hr',
      value: '9,013',
      Icon: Database,
      isGreenBadge: true,
    },
    {
      label: 'ACTIVE ENDPOINTS',
      badge: '0 Endpoint',
      value: '0 / 0',
      Icon: Share2,
      isGreenBadge: false,
    },
  ];

  const navItems = [
    { label: 'Home', Icon: Home, active: true },
    { label: 'Devices', Icon: Cpu, active: false },
    { label: 'Buckets', Icon: Database, active: false },
    { label: 'Rules', Icon: Zap, active: false },
    { label: 'Menu', Icon: Menu, active: false },
  ];

  return (
    <div
      className={`pop-ui-card pop-card-phone pop-from-br pop-delay-2 ${active ? 'pop-visible' : 'pop-hidden'}`}
      style={{
        position: 'absolute',
        right: -20,
        bottom: -14,
        zIndex: 15,
        width: 172,
        padding: 3,
        borderRadius: 36,
        /* Brushed Titanium iPhone 15/16 Pro Outer Chassis */
        background: 'linear-gradient(145deg, #b4bccb 0%, #5c6475 11%, #1b1f29 33%, #3c4252 54%, #8d95a6 77%, #242834 92%, #767e90 100%)',
        boxShadow: `
          inset 0 0 0 0.75px rgba(255, 255, 255, 0.34),
          0 34px 68px -12px rgba(0, 0, 0, 0.96),
          0 14px 26px -6px rgba(0, 0, 0, 0.88),
          0 0 40px -10px ${activeTheme?.glow || 'rgba(0,117,255,0.4)'}
        `,
        pointerEvents: 'none',
      }}
    >
      {/* Subtle Titanium Antenna Bands (iPhone 14/15/16 Pro signature detail) */}
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 38, width: 3, height: 2, background: 'rgba(10,12,18,0.68)' }} />
      <span aria-hidden="true" style={{ position: 'absolute', right: 0, top: 38, width: 3, height: 2, background: 'rgba(10,12,18,0.68)' }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 38, width: 3, height: 2, background: 'rgba(10,12,18,0.68)' }} />
      <span aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 38, width: 3, height: 2, background: 'rgba(10,12,18,0.68)' }} />

      {/* Left Titanium Buttons: Action Button + Volume Up + Volume Down */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 52, width: 2.5, height: 13,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #aeb6c5 0%, #535b6b 50%, #1d212b 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 75, width: 2.5, height: 24,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #aeb6c5 0%, #535b6b 50%, #1d212b 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', left: -2.5, top: 105, width: 2.5, height: 24,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, #aeb6c5 0%, #535b6b 50%, #1d212b 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />

      {/* Right Titanium Buttons: Side Power Button + Camera Control (iPhone 16 Pro) */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', right: -2.5, top: 82, width: 2.5, height: 38,
          borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, #aeb6c5 0%, #535b6b 50%, #1d212b 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute', right: -1.5, bottom: 88, width: 1.5, height: 22,
          borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, #646c7d 0%, #2a303d 100%)',
        }}
      />

      {/* Ultra-Thin Glossy Black OLED Bezel */}
      <div
        style={{
          padding: 4.5,
          borderRadius: 33,
          background: '#020305',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.09)',
        }}
      >
        {/* Clipped OLED Display Viewport */}
        <div
          style={{
            position: 'relative',
            width: SCREEN_W,
            height: SCREEN_H,
            borderRadius: 28.5,
            overflow: 'hidden',
            background: isLight ? '#f4f7fb' : '#07080c',
          }}
        >
          {/* Crisp Glass Reflection Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              pointerEvents: 'none',
              background: 'linear-gradient(128deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.015) 30%, transparent 31%)',
            }}
          />

          {/* Full 393×852 Logical Mobile Dashboard Canvas (Scaled cleanly to 157×340) */}
          <div
            style={{
              width: LOGICAL_W,
              height: LOGICAL_H,
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
              background: screenBg,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
              color: textMain,
              position: 'relative',
              transition: 'background 0.4s ease, color 0.35s ease',
            }}
          >
            {/* iOS Status Bar + Dynamic Island */}
            <div
              style={{
                height: 48,
                padding: '10px 22px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: textMain, width: 54 }}>
                9:41
              </span>

              {/* Dynamic Island Pill with TrueDepth Camera Lens */}
              <div
                style={{
                  width: 118,
                  height: 31,
                  borderRadius: 999,
                  background: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 10,
                  gap: 6,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #3b82f6 0%, #172554 45%, #020617 80%)',
                    boxShadow: 'inset 0 0 2px rgba(255,255,255,0.28)',
                  }}
                />
              </div>

              {/* iOS Signal, Wi-Fi, Battery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: 58, justifyContent: 'flex-end' }}>
                <svg width="16" height="11" viewBox="0 0 16 11" fill={textMain}>
                  <rect x="0" y="7.5" width="2.6" height="3.5" rx="0.8" />
                  <rect x="4.2" y="5" width="2.6" height="6" rx="0.8" />
                  <rect x="8.4" y="2.5" width="2.6" height="8.5" rx="0.8" />
                  <rect x="12.6" y="0" width="2.6" height="11" rx="0.8" />
                </svg>
                <svg width="14" height="11" viewBox="0 0 16 12" fill="none" stroke={textMain} strokeWidth="1.7" strokeLinecap="round">
                  <path d="M1.5 4.2C5.2 0.8 10.8 0.8 14.5 4.2" />
                  <path d="M4.2 7C6.4 5 9.6 5 11.8 7" />
                  <circle cx="8" cy="10" r="1.2" fill={textMain} stroke="none" />
                </svg>
                <div style={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <div
                    style={{
                      width: 22,
                      height: 11,
                      borderRadius: 3.2,
                      border: `1.3px solid ${isLight ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.48)'}`,
                      padding: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ width: '82%', height: '100%', borderRadius: 1.4, background: textMain }} />
                  </div>
                  <div style={{ width: 1.5, height: 4, borderRadius: '0 1px 1px 0', background: isLight ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.45)' }} />
                </div>
              </div>
            </div>

            {/* App Top Bar ("Dashboard" + Search / Refresh / Bell) */}
            <div
              style={{
                padding: '10px 18px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.025em', color: textMain }}>
                Dashboard
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: textMuted }}>
                <Search size={19} strokeWidth={1.85} />
                <RefreshCw size={18} strokeWidth={1.85} />
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Bell size={19} strokeWidth={1.85} />
                  <span
                    style={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: accent,
                      boxShadow: `0 0 8px ${primary}`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sub-header: Icon Badge + IoT Platform Overview + "Atur" pill */}
            <div
              style={{
                padding: '2px 18px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                    boxShadow: `0 6px 18px -4px ${primary}90`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.4s ease, box-shadow 0.4s ease',
                  }}
                >
                  <SlidersHorizontal size={18} color="#ffffff" strokeWidth={2.2} />
                </div>
                <span
                  style={{
                    fontSize: 17.5,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: textMain,
                    whiteSpace: 'nowrap',
                  }}
                >
                  IoT Platform Overview
                </span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 13px',
                  borderRadius: 999,
                  background: isLight ? 'rgba(15, 23, 42, 0.05)' : 'rgba(255, 255, 255, 0.07)',
                  border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontSize: 13,
                  fontWeight: 700,
                  color: textMain,
                  flexShrink: 0,
                }}
              >
                <Pencil size={12.5} color={accentText} strokeWidth={2.2} />
                <span>{lang === 'id' ? 'Atur' : 'Edit'}</span>
              </div>
            </div>

            {/* 2×2 KPI Cards Grid */}
            <div
              style={{
                padding: '0 18px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 11,
                flexShrink: 0,
              }}
            >
              {kpiCards.map((kpi, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 18,
                    padding: '13px 13px 14px',
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: isLight
                      ? '0 4px 12px rgba(15, 23, 42, 0.04)'
                      : `inset 0 1px 0 ${primary}55, 0 8px 20px rgba(0,0,0,0.38)`,
                    transition: 'background 0.4s ease, border-color 0.4s ease',
                  }}
                >
                  {/* Large Subtle Watermark Icon on Right */}
                  <kpi.Icon
                    size={54}
                    strokeWidth={1.35}
                    color={primary}
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: 14,
                      opacity: isLight ? 0.12 : 0.16,
                      pointerEvents: 'none',
                    }}
                  />

                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      color: textMuted,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {kpi.label}
                  </div>

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      marginTop: 7,
                      padding: '3.5px 9px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: kpi.isGreenBadge ? 'rgba(16, 185, 129, 0.16)' : pillBg,
                      color: kpi.isGreenBadge ? '#34d399' : (isLight ? '#334155' : 'rgba(241, 245, 249, 0.9)'),
                      border: kpi.isGreenBadge ? '1px solid rgba(16, 185, 129, 0.32)' : 'none',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {kpi.badge}
                  </div>

                  <div
                    style={{
                      marginTop: 11,
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      color: textMain,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Welcome Back Hero Card with Isometric 3D Glowing IoT Cube */}
            <div
              style={{
                margin: '0 18px 14px',
                borderRadius: 22,
                padding: '18px 18px 16px',
                position: 'relative',
                overflow: 'hidden',
                background: isLight
                  ? `radial-gradient(circle at 86% 62%, ${primary}28 0%, #ffffff 68%)`
                  : `radial-gradient(circle at 86% 62%, ${primary}60 0%, ${primary}1e 36%, rgba(15, 16, 22, 0.96) 72%)`,
                border: `1px solid ${cardBorder}`,
                boxShadow: isLight
                  ? '0 8px 22px rgba(15, 23, 42, 0.06)'
                  : `inset 0 1px 0 ${primary}48, 0 12px 28px rgba(0,0,0,0.45)`,
                flexShrink: 0,
                transition: 'background 0.4s ease, border-color 0.4s ease',
              }}
            >
              {/* Isometric 3D Glowing IoT Cube Artwork */}
              <svg
                width="126"
                height="126"
                viewBox="0 0 120 120"
                fill="none"
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 24,
                  pointerEvents: 'none',
                  opacity: isLight ? 0.85 : 0.95,
                }}
              >
                {/* Circuit base lines */}
                <path d="M22 86 L60 106 L98 86" stroke={accent} strokeOpacity="0.35" strokeWidth="1" />
                <path d="M32 76 L60 91 L88 76" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
                <circle cx="22" cy="86" r="2" fill={accent} fillOpacity="0.6" />
                <circle cx="98" cy="86" r="2" fill={accent} fillOpacity="0.6" />
                {/* Left floating mini cube */}
                <polygon points="22,48 31,43 40,48 31,53" fill={accent} fillOpacity="0.55" />
                <polygon points="22,48 31,53 31,63 22,58" fill={primary} fillOpacity="0.45" />
                <polygon points="40,48 31,53 31,63 40,58" fill={primary} fillOpacity="0.7" />
                {/* Right floating mini cube */}
                <polygon points="82,42 91,37 100,42 91,47" fill={accent} fillOpacity="0.6" />
                <polygon points="82,42 91,47 91,57 82,52" fill={primary} fillOpacity="0.45" />
                <polygon points="100,42 91,47 91,57 100,52" fill={primary} fillOpacity="0.75" />
                {/* Main Center Glowing Cube */}
                <polygon points="60,40 82,52 60,64 38,52" fill={accent} fillOpacity="0.92" />
                <polygon points="38,52 60,64 60,88 38,76" fill={primary} fillOpacity="0.72" />
                <polygon points="82,52 60,64 60,88 82,76" fill={primary} fillOpacity="0.95" />
                {/* Top glowing core diamond */}
                <polygon points="60,46 69,51 60,56 51,51" fill="#ffffff" fillOpacity="0.82" />
                {/* Bottom mini cube */}
                <polygon points="60,90 69,95 60,100 51,95" fill={accent} fillOpacity="0.65" />
                <polygon points="51,95 60,100 60,108 51,103" fill={primary} fillOpacity="0.55" />
                <polygon points="69,95 60,100 60,108 69,103" fill={primary} fillOpacity="0.8" />
              </svg>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: textMuted }}>
                  Welcome back,
                </div>
                <div
                  style={{
                    fontSize: 25,
                    fontWeight: 800,
                    letterSpacing: '-0.025em',
                    color: textMain,
                    marginTop: 3,
                  }}
                >
                  Viki Ramadhan
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: textMuted,
                    marginTop: 8,
                    maxWidth: 238,
                  }}
                >
                  Glad to see you again!
                  <br />
                  {lang === 'id'
                    ? 'Pantau telemetri & kendalikan perangkat IoT Anda secara real-time.'
                    : 'Monitor telemetry & control your IoT devices in real-time.'}
                </div>

                {/* Live-style Clock */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 15 }}>
                  <span
                    style={{
                      fontSize: 29,
                      fontWeight: 800,
                      letterSpacing: '0.01em',
                      fontVariantNumeric: 'tabular-nums',
                      color: textMain,
                    }}
                  >
                    13 : 40
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: accentText }}>
                    12
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: textMuted, marginTop: 2 }}>
                  Selasa, 24 Nov 2026
                </div>

                {/* Bottom CTA */}
                <div
                  style={{
                    marginTop: 22,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: textMain,
                  }}
                >
                  <span>{lang === 'id' ? 'Kelola Perangkat IoT' : 'Manage IoT Devices'}</span>
                  <ArrowRight size={15} strokeWidth={2.3} />
                </div>
              </div>
            </div>

            {/* Connected IoT Devices Card (Peeking above Bottom Nav) */}
            <div
              style={{
                margin: '0 18px',
                borderRadius: '20px 20px 0 0',
                padding: '15px 16px 12px',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderBottom: 'none',
                flex: 1,
                overflow: 'hidden',
                transition: 'background 0.4s ease, border-color 0.4s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.02em', color: textMain }}>
                  Connected IoT Devices
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accentText, fontSize: 12, fontWeight: 700 }}>
                  <span>{lang === 'id' ? 'Lihat Semua →' : 'View All →'}</span>
                  <MoreVertical size={14} color={textMuted} />
                </div>
              </div>
              <div
                style={{
                  marginTop: 7,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: textMuted,
                }}
              >
                <AlertCircle size={13.5} strokeWidth={2} />
                <span>
                  <strong style={{ color: textMain }}>0 {lang === 'id' ? 'perangkat online' : 'online'}</strong>{' '}
                  {lang === 'id' ? 'dari 2 terdaftar' : 'of 2 registered'}
                </span>
              </div>
            </div>

            {/* Bottom Navigation Bar + iOS Home Indicator */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                background: isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(11, 12, 16, 0.95)',
                borderTop: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
                padding: '8px 10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'background 0.4s ease',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
                {navItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      padding: '6px 4px',
                      borderRadius: 12,
                      background: item.active ? `${primary}24` : 'transparent',
                      color: item.active ? accentText : textMuted,
                    }}
                  >
                    <item.Icon size={18} strokeWidth={item.active ? 2.2 : 1.8} />
                    <span style={{ fontSize: 10.5, fontWeight: item.active ? 700 : 500 }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* iOS Home Indicator */}
              <div
                style={{
                  width: 134,
                  height: 5,
                  borderRadius: 999,
                  background: isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.32)',
                  margin: '0 auto',
                }}
              />
            </div>
          </div>
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

  // Preload & decode all theme + feature screenshots so scrolling across features 01..07 morphs instantly with zero flicker
  useEffect(() => {
    const urls = [
      ...THEMES.map((th) => th?.image),
      ...features.map((f) => f?.image),
    ].filter(Boolean);

    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }, []);

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
  const usesThemeImage = isColorItem || activeFeat?.id === 'realtime';
  const previewSrc = usesThemeImage ? activeTheme.image : activeFeat.image;
  const previewGlow = usesThemeImage ? activeTheme.glow : activeFeat.glow;
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
            margin: '0 auto clamp(14px, 3vh, 36px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(10px, 2vw, 20px)',
            alignItems: 'end',
          }}
        >
          <div>
            <span
              className="mac-feat-eyebrow"
              style={{
                display: 'block',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '12px',
                letterSpacing: '0.06em',
                color: 'rgba(255, 255, 255, 0.45)',
                marginBottom: 'clamp(6px, 1.2vh, 14px)',
              }}
            >
              03 / {lang === 'id' ? 'Fitur Inti · Scroll untuk Jelajah' : 'Core Features · Scroll to Explore'}
            </span>
            <h2
              className="mac-feat-title"
              style={{
                fontSize: 'clamp(1.6rem, min(3.6vw, 4.6vh), 2.9rem)',
                fontWeight: 400,
                letterSpacing: '-0.035em',
                color: '#ffffff',
                lineHeight: 1.08,
                textWrap: 'balance',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: 0,
              }}
            >
              {t.featMagic}
            </h2>
          </div>

          <p
            className="mac-feat-desc"
            style={{
              fontSize: 'clamp(13px, min(1.3vw, 2.1vh), 15.5px)',
              color: 'rgba(255, 255, 255, 0.62)',
              maxWidth: 460,
              marginLeft: 'auto',
              lineHeight: 1.55,
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
            gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)',
            gap: 'clamp(22px, 4vw, 60px)',
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

                      <span
                        className="mac-feat-item-label"
                        style={{
                          fontSize: 15,
                          fontWeight: isOpen ? 600 : 500,
                          color: isOpen ? '#ffffff' : 'rgba(255,255,255,0.52)',
                          letterSpacing: '-0.012em',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          transition: 'color 0.3s ease',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
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
                    <div
                      className="mac-feat-item-body"
                      style={{
                        paddingBottom: 18,
                        paddingLeft: (feat.icon || feat.isColor) ? 32 : 0,
                      }}
                    >
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

                      <p
                        className="mac-feat-item-desc"
                        style={{
                          fontSize: 13.5,
                          color: 'rgba(255, 255, 255, 0.72)',
                          lineHeight: 1.65,
                          fontFamily: 'Inter, system-ui, sans-serif',
                          margin: 0,
                        }}
                      >
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
                          opacity: isColorItem ? 1 : 0,
                          pointerEvents: 'none',
                          transition: 'opacity 0.35s ease',
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

                      <CrossfadeImage
                        src={previewSrc}
                        alt={t[activeFeat?.labelKey] || ''}
                        glow={previewGlow}
                        primary={activeTheme.primary}
                        fit={(hasPopUI || isColorItem) ? 'contain' : 'cover'}
                        aspectRatio="16 / 9"
                        direction={direction}
                        frameless={isColorItem}
                        pureFade={isColorItem}
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
                className={`mac-feat-indicator ${hasPopUI ? 'mac-feat-indicator-pop' : ''}`}
                style={{
                  marginTop: hasPopUI ? 34 : 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'margin-top 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
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
          padding: clamp(68px, 7.5vh, 96px) clamp(20px, 4vw, 48px) clamp(16px, 3vh, 44px);
          box-sizing: border-box;
        }
        .mac-feat-device-wrap {
          width: 100%;
          max-width: min(100%, calc((100dvh - 255px) * 1.62));
          margin: 0 auto;
        }
        .mac-feat-device-wrap.mac-feat-device-macbook {
          max-width: min(100%, calc((100dvh - 285px) * 1.62));
        }

        /* ── Medium-width desktops / laptops (861px–1280px) ── */
        @media (max-width: 1280px) and (min-width: 861px) {
          .mac-feat-grid {
            grid-template-columns: minmax(260px, 370px) minmax(0, 1fr) !important;
            gap: clamp(20px, 3vw, 40px) !important;
          }
          .pop-ui-card {
            zoom: 0.86;
          }
          .pop-card-tr,
          .pop-card-mr,
          .pop-card-br,
          .pop-card-phone {
            right: -6px !important;
          }
          .pop-card-tl,
          .pop-card-ml,
          .pop-card-bl {
            left: -6px !important;
          }
        }

        /* ── Narrow desktop / landscape tablet (861px–1100px) ── */
        @media (max-width: 1100px) and (min-width: 861px) {
          .mac-feat-grid {
            grid-template-columns: minmax(250px, 330px) minmax(0, 1fr) !important;
            gap: 24px !important;
          }
          .pop-ui-card {
            zoom: 0.78;
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

        /* ── Short-height laptops (e.g. 1366x768, 1280x720, 1440x900 @ 125% scaling) ── */
        @media (max-height: 820px) and (min-width: 861px) {
          .mac-feat-sticky-stage {
            padding: 68px clamp(20px, 3.5vw, 42px) 18px !important;
          }
          .mac-feat-heading {
            margin-bottom: 18px !important;
            gap: 14px !important;
          }
          .mac-feat-eyebrow {
            margin-bottom: 6px !important;
            font-size: 11px !important;
          }
          .mac-feat-accordion {
            padding: 4px 18px !important;
            border-radius: 20px !important;
          }
          .mac-feat-item-header {
            padding: 11px 0 !important;
          }
          .mac-feat-item-label {
            font-size: 14px !important;
          }
          .mac-feat-item-body {
            padding-bottom: 12px !important;
          }
          .mac-feat-item-desc {
            font-size: 12.5px !important;
            line-height: 1.54 !important;
          }
          .mac-feat-device-wrap {
            max-width: min(100%, calc((100dvh - 220px) * 1.56));
          }
          .mac-feat-device-wrap.mac-feat-device-macbook {
            max-width: min(100%, calc((100dvh - 245px) * 1.56));
          }
          .pop-ui-card {
            zoom: 0.80;
          }
          .pop-card-tr,
          .pop-card-tl {
            top: -12px !important;
          }
          .pop-card-bl,
          .pop-card-br {
            bottom: -14px !important;
          }
          .pop-card-tr,
          .pop-card-mr,
          .pop-card-br,
          .pop-card-phone {
            right: -4px !important;
          }
          .pop-card-tl,
          .pop-card-ml,
          .pop-card-bl {
            left: -4px !important;
          }
          .mac-feat-indicator {
            margin-top: 16px !important;
            gap: 8px !important;
          }
          .mac-feat-indicator.mac-feat-indicator-pop {
            margin-top: 22px !important;
          }
        }

        /* ── Very short laptop viewports (<= 690px height, e.g. 1366x768 w/ browser chrome + taskbar) ── */
        @media (max-height: 690px) and (min-width: 861px) {
          .mac-feat-sticky-stage {
            padding: 62px clamp(18px, 3vw, 36px) 12px !important;
          }
          .mac-feat-heading {
            margin-bottom: 12px !important;
            gap: 10px !important;
          }
          .mac-feat-eyebrow {
            margin-bottom: 4px !important;
            font-size: 10.5px !important;
          }
          .mac-feat-title {
            font-size: clamp(1.35rem, 3.6vh, 2.05rem) !important;
          }
          .mac-feat-desc {
            font-size: 12.5px !important;
            line-height: 1.45 !important;
          }
          .mac-feat-accordion {
            padding: 3px 16px !important;
            border-radius: 18px !important;
          }
          .mac-feat-item-header {
            padding: 8px 0 !important;
          }
          .mac-feat-item-label {
            font-size: 13px !important;
          }
          .mac-feat-item-body {
            padding-bottom: 9px !important;
          }
          .mac-feat-item-desc {
            font-size: 12px !important;
            line-height: 1.46 !important;
          }
          .mac-feat-device-wrap {
            max-width: min(100%, calc((100dvh - 195px) * 1.54));
          }
          .mac-feat-device-wrap.mac-feat-device-macbook {
            max-width: min(100%, calc((100dvh - 225px) * 1.52));
          }
          .pop-ui-card {
            zoom: 0.68;
          }
          .pop-card-tr,
          .pop-card-tl {
            top: -8px !important;
          }
          .pop-card-bl,
          .pop-card-br {
            bottom: -10px !important;
          }
          .pop-card-tr,
          .pop-card-mr,
          .pop-card-br,
          .pop-card-phone {
            right: 2px !important;
          }
          .pop-card-tl,
          .pop-card-ml,
          .pop-card-bl {
            left: 2px !important;
          }
          .mac-feat-indicator {
            margin-top: 12px !important;
            gap: 6px !important;
          }
          .mac-feat-indicator.mac-feat-indicator-pop {
            margin-top: 16px !important;
          }
          .mac-feat-progress-bar {
            display: none !important;
          }
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
            padding: 66px 16px 20px !important;
          }
          .mac-feat-heading {
            margin-bottom: 12px !important;
            gap: 6px !important;
          }
          .mac-feat-eyebrow {
            margin-bottom: 4px !important;
            font-size: 11px !important;
          }
          .mac-feat-heading p {
            display: none !important;
          }
          .mac-feat-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .mac-feat-accordion {
            padding: 4px 14px !important;
            border-radius: 18px !important;
          }
          .mac-feat-item-header {
            padding: 9px 0 !important;
          }
          .mac-feat-item-label {
            font-size: 14px !important;
          }
          .mac-feat-item-body {
            padding-bottom: 10px !important;
          }
          .mac-feat-item-desc {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          /* Keep sticky stage within 100dvh on mobile by showing only the active scrolled feature card above the preview */
          .mac-feat-item-closed {
            display: none !important;
          }
          .mac-feat-item-open {
            border-top: none !important;
          }
          .mac-feat-device-wrap {
            max-width: min(100%, calc((100dvh - 330px) * 1.65)) !important;
          }
          .mac-feat-device-macbook {
            padding: 0 6% !important;
          }
          .pop-ui-card {
            zoom: 0.72;
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
          .mac-feat-indicator {
            margin-top: 18px !important;
            gap: 8px !important;
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
            bottom: -14px !important;
          }
          .pop-card-br {
            right: 4px !important;
            bottom: -14px !important;
          }
          .pop-card-phone {
            zoom: 0.62;
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
            margin-top: 18px !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </section>
  );
}
