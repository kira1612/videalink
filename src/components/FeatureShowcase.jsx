import React, { useState, useRef, useEffect } from 'react';
import { Plus, Minus, Wifi, Activity, Shield, Layers, Bell } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// THEMES — persis sesuai sistem: 5 warna aksen × 2 mode (dark / light)
// Warna primary diambil dari CSS variable --primary-400 / --primary-500 di index.css
//
// PATH GAMBAR — letakkan screenshot Anda di:
//   public/assets/themes/<id>.png
//   Contoh: public/assets/themes/dark-cyan.png
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = [
  // ── DARK MODE ──────────────────────────────────────────────────────────────
  {
    id:      'dark-cyan',
    mode:    'dark',
    label:   { id: 'Gelap · Cyan', en: 'Dark · Cyan' },
    // Cyan-500: rgb(6 182 212) — warna aksen default sistem
    swatch:  'linear-gradient(135deg, #0f172a 0%, #06b6d4 100%)',
    primary: '#06b6d4',       // --primary-500 cyan
    accent:  '#22d3ee',       // --primary-400 cyan
    glow:    'rgba(6,182,212,0.45)',
    image:   '/assets/themes/dark-cyan.png',
  },
  {
    id:      'dark-emerald',
    mode:    'dark',
    label:   { id: 'Gelap · Emerald', en: 'Dark · Emerald' },
    // Emerald-500: rgb(16 185 129)
    swatch:  'linear-gradient(135deg, #0f172a 0%, #10b981 100%)',
    primary: '#10b981',
    accent:  '#34d399',
    glow:    'rgba(16,185,129,0.45)',
    image:   '/assets/themes/dark-emerald.png',
  },
  {
    id:      'dark-violet',
    mode:    'dark',
    label:   { id: 'Gelap · Violet', en: 'Dark · Violet' },
    // Violet-500: rgb(139 92 246)
    swatch:  'linear-gradient(135deg, #0f172a 0%, #8b5cf6 100%)',
    primary: '#8b5cf6',
    accent:  '#a78bfa',
    glow:    'rgba(139,92,246,0.45)',
    image:   '/assets/themes/dark-violet.png',
  },
  {
    id:      'dark-rose',
    mode:    'dark',
    label:   { id: 'Gelap · Rose', en: 'Dark · Rose' },
    // Rose-500: rgb(244 63 94)
    swatch:  'linear-gradient(135deg, #0f172a 0%, #f43f5e 100%)',
    primary: '#f43f5e',
    accent:  '#fb7185',
    glow:    'rgba(244,63,94,0.45)',
    image:   '/assets/themes/dark-rose.png',
  },
  {
    id:      'dark-amber',
    mode:    'dark',
    label:   { id: 'Gelap · Amber', en: 'Dark · Amber' },
    // Amber-500: rgb(245 158 11)
    swatch:  'linear-gradient(135deg, #0f172a 0%, #f59e0b 100%)',
    primary: '#f59e0b',
    accent:  '#fbbf24',
    glow:    'rgba(245,158,11,0.45)',
    image:   '/assets/themes/dark-amber.png',
  },
  // ── LIGHT MODE ─────────────────────────────────────────────────────────────
  {
    id:      'light-cyan',
    mode:    'light',
    label:   { id: 'Terang · Cyan', en: 'Light · Cyan' },
    swatch:  'linear-gradient(135deg, #f8fafc 0%, #06b6d4 100%)',
    primary: '#0891b2',       // sedikit lebih gelap agar kontras di bg terang
    accent:  '#06b6d4',
    glow:    'rgba(6,182,212,0.35)',
    image:   '/assets/themes/light-cyan.png',
  },
  {
    id:      'light-emerald',
    mode:    'light',
    label:   { id: 'Terang · Emerald', en: 'Light · Emerald' },
    swatch:  'linear-gradient(135deg, #f8fafc 0%, #10b981 100%)',
    primary: '#059669',
    accent:  '#10b981',
    glow:    'rgba(16,185,129,0.35)',
    image:   '/assets/themes/light-emerald.png',
  },
  {
    id:      'light-violet',
    mode:    'light',
    label:   { id: 'Terang · Violet', en: 'Light · Violet' },
    swatch:  'linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)',
    primary: '#7c3aed',
    accent:  '#8b5cf6',
    glow:    'rgba(124,58,237,0.35)',
    image:   '/assets/themes/light-violet.png',
  },
  {
    id:      'light-rose',
    mode:    'light',
    label:   { id: 'Terang · Rose', en: 'Light · Rose' },
    swatch:  'linear-gradient(135deg, #f8fafc 0%, #f43f5e 100%)',
    primary: '#e11d48',
    accent:  '#f43f5e',
    glow:    'rgba(225,29,72,0.35)',
    image:   '/assets/themes/light-rose.png',
  },
  {
    id:      'light-amber',
    mode:    'light',
    label:   { id: 'Terang · Amber', en: 'Light · Amber' },
    swatch:  'linear-gradient(135deg, #f8fafc 0%, #f59e0b 100%)',
    primary: '#d97706',
    accent:  '#f59e0b',
    glow:    'rgba(217,119,6,0.35)',
    image:   '/assets/themes/light-amber.png',
  },
];

// ── CROSSFADE IMAGE VIEWER ─────────────────────────────────────────────────────
// Dua layer img ditumpuk. Layer "current" selalu opacity:1.
// Saat src berubah → layer "next" preload di opacity:0, lalu swap ke opacity:1
// sambil layer lama fade ke opacity:0. Setelah 650ms swap selesai.
function CrossfadeImage({ src, alt, glow, primary }) {
  const [current,    setCurrent]    = useState(src);   // src yang sedang tampil
  const [next,       setNext]       = useState(null);  // src baru sedang fade-in
  const [fading,     setFading]     = useState(false); // apakah sedang transisi
  const [errorCurr,  setErrorCurr]  = useState(false); // error load current
  const [errorNext,  setErrorNext]  = useState(false); // error load next
  const timerRef = useRef(null);

  useEffect(() => {
    if (src === current && !fading) return;
    // Batalkan transisi sebelumnya jika ada
    clearTimeout(timerRef.current);

    // Reset error state untuk gambar baru
    setErrorNext(false);
    // Mulai load gambar baru di layer next (opacity 0)
    setNext(src);
    setFading(true);

    // Beri satu frame agar browser register opacity:0 terlebih dahulu
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Setelah transisi CSS selesai (600ms), swap layer
        timerRef.current = setTimeout(() => {
          setCurrent(src);
          setNext(null);
          setFading(false);
          setErrorCurr(false); // reset error untuk src baru
        }, 650);
      });
    });

    return () => clearTimeout(timerRef.current);
  }, [src]);

  const baseImg = {
    position:   'absolute',
    inset:      0,
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
    display:    'block',
    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const Placeholder = ({ opacity, zIndex, color }) => (
    <div style={{
      position:        'absolute',
      inset:           0,
      zIndex,
      opacity,
      transition:      'opacity 0.6s ease',
      background:      `linear-gradient(135deg, #0d1117 0%, ${color}1a 100%)`,
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             10,
    }}>
      {/* Animated shimmer bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '60%' }}>
        {[80, 60, 70].map((w, i) => (
          <div key={i} style={{
            height:       8,
            width:        `${w}%`,
            borderRadius: 4,
            background:   `${color}30`,
          }} />
        ))}
      </div>
      <span style={{
        fontSize:   11,
        color:      color,
        opacity:    0.4,
        fontFamily: 'Inter, system-ui, sans-serif',
        marginTop:  8,
      }}>
        {alt}
      </span>
    </div>
  );

  return (
    <div style={{
      position:     'relative',
      width:        '100%',
      borderRadius: 20,
      overflow:     'hidden',
      aspectRatio:  '16 / 10',
      background:   '#0d1117',
      boxShadow:    `
        0 0 0 1px rgba(255,255,255,0.07),
        0 40px 100px -20px ${glow},
        0 20px 60px -10px rgba(0,0,0,0.8)
      `,
      transition:   'box-shadow 0.6s ease',
    }}>
      {/* ── Layer CURRENT (selalu terlihat kecuali saat fading keluar) ── */}
      {errorCurr
        ? <Placeholder opacity={1} zIndex={1} color={primary} />
        : <img
            key={`curr-${current}`}
            src={current}
            alt={alt}
            onError={() => setErrorCurr(true)}
            style={{ ...baseImg, opacity: fading ? 0 : 1, zIndex: 1 }}
          />
      }

      {/* ── Layer NEXT (fade-in di atas current) ── */}
      {next && (
        errorNext
          ? <Placeholder opacity={fading ? 1 : 0} zIndex={2} color={primary} />
          : <img
              key={`next-${next}`}
              src={next}
              alt={alt}
              onError={() => setErrorNext(true)}
              style={{ ...baseImg, opacity: fading ? 1 : 0, zIndex: 2 }}
            />
      )}
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
    { id: 'color',    icon: null,     labelKey: 'featColor',    descKey: 'featColorDesc',    isColor: true,
      image: null, /* gambar ditentukan oleh activeTheme.image */
      glow: null,
    },
    { id: 'realtime', icon: Activity, labelKey: 'featRealtime', descKey: 'featRealtimeDesc',
      image: '/assets/telemetry.png',
      glow: 'rgba(6,182,212,0.35)',
    },
    { id: 'devices',  icon: Wifi,     labelKey: 'featDevices',  descKey: 'featDevicesDesc',
      image: '/assets/map.png',
      glow: 'rgba(139,92,246,0.35)',
    },
    { id: 'security', icon: Shield,   labelKey: 'featSecurity', descKey: 'featSecurityDesc',
      image: '/assets/security.png',
      glow: 'rgba(244,63,94,0.35)',
    },
    { id: 'buckets',  icon: Layers,   labelKey: 'featBuckets',  descKey: 'featBucketsDesc',
      image: '/assets/workflow.png',
      glow: 'rgba(16,185,129,0.35)',
    },
    { id: 'alerts',   icon: Bell,     labelKey: 'featAlerts',   descKey: 'featAlertsDesc',
      image: '/assets/alerts.png',
      glow: 'rgba(245,158,11,0.35)',
    },
  ];
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function FeatureShowcase({ t, lang }) {
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [openItem,    setOpenItem]    = useState('color');
  const [sectionRef, sectionVisible] = useFadeIn(0.08);

  const features = getFeatures(t);

  const selectTheme = (th) => {
    setActiveTheme(th);
  };

  // Tentukan gambar & glow yang tampil di panel kanan
  const activeFeat = features.find(f => f.id === openItem) || features[0];
  const isColorItem = activeFeat?.isColor;
  // Saat item "Warna" aktif → pakai gambar & glow dari tema terpilih
  // Saat item lain aktif    → pakai gambar & glow dari feature itu sendiri
  const previewSrc  = isColorItem ? activeTheme.image  : activeFeat.image;
  const previewGlow = isColorItem ? activeTheme.glow   : activeFeat.glow;
  const previewPrimary = isColorItem ? activeTheme.primary : activeFeat.glow?.replace('rgba(', '#').split(',')[0] ?? activeTheme.primary;

  return (
    <section
      ref={sectionRef}
      id="mac-features"
      style={{
        padding:    'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)',
        background: '#000',
        opacity:    sectionVisible ? 1 : 0,
        transform:  sectionVisible ? 'translateY(0)' : 'translateY(56px)',
        transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* ── Heading ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto 64px', textAlign: 'center' }}>
        <h2 style={{
          fontSize:      'clamp(1.8rem, 5vw, 4rem)',
          fontWeight:    800,
          letterSpacing: '-0.04em',
          color:         '#f5f5f7',
          lineHeight:    1.1,
          marginBottom:  16,
          fontFamily:    'Inter, system-ui, sans-serif',
        }}>
          {t.featMagic}
        </h2>
        <p style={{
          fontSize:   'clamp(0.95rem, 1.8vw, 1.2rem)',
          color:      '#86868b',
          maxWidth:   540,
          margin:     '0 auto',
          lineHeight: 1.65,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          {t.featDesc}
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div
        className="mac-feat-grid"
        style={{
          maxWidth:            1200,
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: 'minmax(240px, 420px) 1fr',
          gap:                 'clamp(32px, 5vw, 72px)',
          alignItems:          'start',
        }}
      >
        {/* ── LEFT: Accordion ── */}
        <div>
          {features.map((feat, idx) => {
            const isOpen = openItem === feat.id;
            const Icon   = feat.icon;

            return (
              <div
                key={feat.id}
                style={{
                  borderTop:    '1px solid #222',
                  borderBottom: idx === features.length - 1 ? '1px solid #222' : 'none',
                }}
              >
                {/* Header button */}
                <button
                  onClick={() => setOpenItem(prev => prev === feat.id ? null : feat.id)}
                  aria-expanded={isOpen}
                  style={{
                    width:          '100%',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    padding:        '20px 0',
                    background:     'none',
                    border:         'none',
                    cursor:         'pointer',
                    textAlign:      'left',
                    gap:            12,
                  }}
                >
                  {/* Left side: icon + label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    {feat.isColor ? (
                      // Animating swatch dot
                      <div style={{
                        width:      20,
                        height:     20,
                        borderRadius: '50%',
                        background: activeTheme.swatch,
                        border:     '2px solid rgba(255,255,255,0.1)',
                        flexShrink: 0,
                        boxShadow:  `0 0 12px ${activeTheme.glow}`,
                        transition: 'background 0.5s ease, box-shadow 0.5s ease',
                      }} />
                    ) : Icon ? (
                      <Icon
                        size={16}
                        strokeWidth={2}
                        color={isOpen ? activeTheme.primary : '#555'}
                        style={{ flexShrink: 0, transition: 'color 0.3s' }}
                      />
                    ) : null}

                    <span style={{
                      fontSize:      16,
                      fontWeight:    isOpen ? 600 : 400,
                      color:         isOpen ? '#f5f5f7' : '#999',
                      letterSpacing: '-0.01em',
                      fontFamily:    'Inter, system-ui, sans-serif',
                      transition:    'color 0.25s, font-weight 0.25s',
                      whiteSpace:    'nowrap',
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                    }}>
                      {t[feat.labelKey]}
                    </span>
                  </div>

                  {/* Plus/minus toggle */}
                  <div style={{
                    width:        22,
                    height:       22,
                    borderRadius: '50%',
                    border:       `1.5px solid ${isOpen ? activeTheme.primary : '#333'}`,
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    flexShrink:   0,
                    background:   isOpen ? `${activeTheme.primary}1a` : 'transparent',
                    transition:   'border-color 0.3s, background 0.3s',
                  }}>
                    {isOpen
                      ? <Minus size={11} color={activeTheme.primary} />
                      : <Plus  size={11} color="#555" />}
                  </div>
                </button>

                {/* Collapsible body */}
                <div style={{
                  overflow:   'hidden',
                  maxHeight:  isOpen ? 420 : 0,
                  transition: 'max-height 0.45s cubic-bezier(0.16,1,0.3,1)',
                }}>
                  <div style={{
                    paddingBottom: 22,
                    paddingLeft:   (feat.icon || feat.isColor) ? 32 : 0,
                  }}>

                    {/* Color picker (only for 'color' feature) */}
                    {feat.isColor && (
                      <div style={{ marginBottom: 16 }}>

                        {/* ── Dark Mode Row ── */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            marginBottom: 10,
                          }}>
                            <div style={{
                              width: 12, height: 12, borderRadius: '50%',
                              background: '#1e293b', border: '1.5px solid #334155',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: 10, color: '#666', fontWeight: 700,
                              letterSpacing: '0.07em', textTransform: 'uppercase',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            }}>
                              {lang === 'id' ? 'Mode Gelap' : 'Dark Mode'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {THEMES.filter(th => th.mode === 'dark').map(th => (
                              <button
                                key={th.id}
                                onClick={() => selectTheme(th)}
                                title={th.label[lang] || th.label.en}
                                aria-label={th.label[lang] || th.label.en}
                                aria-pressed={activeTheme.id === th.id}
                                style={{
                                  width:        28,
                                  height:       28,
                                  borderRadius: '50%',
                                  background:   th.swatch,
                                  border:       activeTheme.id === th.id ? '3px solid #fff' : '2.5px solid #333',
                                  outline:      activeTheme.id === th.id ? `2px solid ${th.primary}` : '2px solid transparent',
                                  cursor:       'pointer',
                                  padding:      0,
                                  transition:   'transform 0.2s ease, border-color 0.2s, outline-color 0.2s, box-shadow 0.2s',
                                  transform:    activeTheme.id === th.id ? 'scale(1.22)' : 'scale(1)',
                                  boxShadow:    activeTheme.id === th.id ? `0 0 16px ${th.glow}` : 'none',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* ── Light Mode Row ── */}
                        <div>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            marginBottom: 10,
                          }}>
                            <div style={{
                              width: 12, height: 12, borderRadius: '50%',
                              background: '#f1f5f9', border: '1.5px solid #cbd5e1',
                              flexShrink: 0,
                            }} />
                            <span style={{
                              fontSize: 10, color: '#666', fontWeight: 700,
                              letterSpacing: '0.07em', textTransform: 'uppercase',
                              fontFamily: 'Inter, system-ui, sans-serif',
                            }}>
                              {lang === 'id' ? 'Mode Terang' : 'Light Mode'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {THEMES.filter(th => th.mode === 'light').map(th => (
                              <button
                                key={th.id}
                                onClick={() => selectTheme(th)}
                                title={th.label[lang] || th.label.en}
                                aria-label={th.label[lang] || th.label.en}
                                aria-pressed={activeTheme.id === th.id}
                                style={{
                                  width:        28,
                                  height:       28,
                                  borderRadius: '50%',
                                  background:   th.swatch,
                                  border:       activeTheme.id === th.id ? `3px solid ${th.primary}` : '2.5px solid #444',
                                  outline:      activeTheme.id === th.id ? `2px solid ${th.accent}` : '2px solid transparent',
                                  cursor:       'pointer',
                                  padding:      0,
                                  transition:   'transform 0.2s ease, border-color 0.2s, outline-color 0.2s, box-shadow 0.2s',
                                  transform:    activeTheme.id === th.id ? 'scale(1.22)' : 'scale(1)',
                                  boxShadow:    activeTheme.id === th.id ? `0 0 16px ${th.glow}` : 'none',
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Active theme name + mode badge */}
                        <div style={{
                          marginTop:   14,
                          display:     'flex',
                          alignItems:  'center',
                          gap:         8,
                        }}>
                          <span style={{
                            fontSize:   13,
                            fontWeight: 700,
                            color:      activeTheme.primary,
                            transition: 'color 0.4s ease',
                            fontFamily: 'Inter, system-ui, sans-serif',
                          }}>
                            {activeTheme.label[lang] || activeTheme.label.en}
                          </span>
                          <span style={{
                            fontSize:     10,
                            fontWeight:   600,
                            padding:      '2px 8px',
                            borderRadius: 20,
                            background:   activeTheme.mode === 'dark' ? '#1e293b' : '#f1f5f9',
                            color:        activeTheme.mode === 'dark' ? '#94a3b8' : '#64748b',
                            border:       `1px solid ${activeTheme.mode === 'dark' ? '#334155' : '#cbd5e1'}`,
                            fontFamily:   'Inter, system-ui, sans-serif',
                            transition:   'all 0.3s ease',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}>
                            {activeTheme.mode === 'dark'
                              ? (lang === 'id' ? '🌙 Gelap' : '🌙 Dark')
                              : (lang === 'id' ? '☀️ Terang' : '☀️ Light')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Feature description */}
                    <p style={{
                      fontSize:   14,
                      color:      '#86868b',
                      lineHeight: 1.7,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}>
                      {t[feat.descKey]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Crossfade image preview ── */}
        <div
          className="mac-feat-preview"
          style={{ position: 'sticky', top: 100 }}
        >
          {/* Ambient glow behind image — warnanya ikut previewGlow */}
          <div style={{
            position:   'absolute',
            inset:      '-24px',
            borderRadius: 40,
            background: `radial-gradient(ellipse at 50% 50%, ${previewGlow} 0%, transparent 70%)`,
            filter:     'blur(30px)',
            pointerEvents: 'none',
            transition: 'background 0.6s ease',
            zIndex:     0,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Crossfade image — berubah saat accordion atau tema berubah */}
            <CrossfadeImage
              src={previewSrc}
              alt={t[activeFeat?.labelKey] || ''}
              glow={previewGlow}
              primary={activeTheme.primary}
            />



            {/* Label fitur — tampil saat item non-Warna aktif */}
            {!isColorItem && (
              <div style={{
                marginTop:  16,
                textAlign:  'center',
                display:    'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap:        8,
              }}>
                {activeFeat.icon && (
                  <activeFeat.icon size={14} color={activeTheme.primary} style={{ flexShrink: 0 }} />
                )}
                <span style={{
                  fontSize:   13,
                  fontWeight: 600,
                  color:      '#86868b',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {t[activeFeat?.labelKey]}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Responsive overrides ── */}
      <style>{`
        @media (max-width: 860px) {
          .mac-feat-grid {
            grid-template-columns: 1fr !important;
          }
          .mac-feat-preview {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>
    </section>
  );
}
