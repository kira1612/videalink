import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Zap,
  Database,
  Globe,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Wifi,
  Activity,
  Shield,
  Layers,
  Bell,
  Settings2,
  Menu,
  X,
  Box,
  Radio,
  Thermometer,
  ToggleRight,
  Compass,
  Webhook,
  ArrowRight,
} from 'lucide-react';
import IoTAnimation from '../components/IoTAnimation';
import SilkWaveBackground, { getSilkPaletteTokens } from '../components/SilkWaveBackground';
import FloatingIconWave from '../components/FloatingIconWave';
import FeatureShowcase, { THEMES } from '../components/FeatureShowcase';
import IndustryShowcase from '../components/IndustryShowcase';
import PricingSection from '../components/PricingSection';
import FAQSection from '../components/FAQSection';
import CTABanner from '../components/CTABanner';
import FooterSection from '../components/FooterSection';

// Theme presets imported from FeatureShowcase

// --- TRANSLATIONS DICTIONARY ---
const dict = {
  id: {
    overview: 'Ringkasan',
    features: 'Fitur',
    industry: 'Industri',
    performance: 'Performa',
    connectivity: 'Konektivitas',
    pricing: 'Harga',
    faq: 'FAQ',
    signIn: 'Masuk',
    buy: 'Daftar',
    heroTitle: 'Videa Link.',
    heroSub: 'Kendali real-time untuk setiap perangkat dan ruang fisik.',
    heroDesc: 'Platform terpadu untuk memantau telemetri, mengotomasi operasional, dan memvisualisasikan aset IoT Anda secara langsung dalam ruang 3D.',
    getStarted: 'Mulai Gratis',
    learnMore: 'Pelajari fitur',
    univConn: 'Konektivitas IoT & Ruangan 3D',
    oneGate: 'Satu platform.',
    thousands: 'Kendali penuh real-time.',
    gateDesc: 'Videa Link menyatukan telemetri sensor, kontrol sakelar dua arah (Smart Switch & Thermostat), Data Bucket Auto-Discovery, serta Editor Denah Ruangan 3D dalam satu ekosistem terpadu.',
    rtGate: 'Kontrol Dua Arah & Ruangan 3D',
    rtGateDesc: 'Nyalakan perangkat langsung dari widget dashboard atau klik objek di dalam denah 3D interaktif.',
    uniProto: 'MQTT Broker & HTTP REST API',
    uniProtoDesc: 'Mendukung ESP32, ESP8266, Arduino, dan Raspberry Pi dengan Bearer Token & auto-discovery JSON.',
    scaryFast: 'Sangat cepat.',
    scaryCap: 'Sangat mumpuni.',
    globalLat: 'Latensi Global',
    globalLatDesc: 'Pemrosesan telemetri dan perintah perangkat yang cepat serta responsif.',
    uptimeGuar: 'Deteksi Heartbeat 60s',
    uptimeGuarDesc: 'Status perangkat ONLINE/OFFLINE terpantau otomatis setiap 60 detik.',
    connEverything: 'Hubungkan segalanya.',
    compNothing: 'Tanpa kompromi.',
    connDesc: 'Integrasi langsung untuk mikrokontroler, protokol, dan kanal notifikasi favorit Anda.',
    protoHwLabel: 'FITUR, PROTOKOL & PERANGKAT KERAS YANG DIDUKUNG',
    featMagic: 'Fitur lengkap siap produksi.',
    featDesc: 'Semua yang Anda butuhkan untuk mengelola perangkat IoT, Data Bucket, Automasi, hingga Ruangan 3D dalam satu antarmuka modern.',
    // MacBook feature section
    chooseTheme: 'Tema',
    featRoom3D: 'Ruangan 3D & Denah (Floor Plan)',
    featRoom3DDesc: 'Bangun denah ruangan 3D berbasis Three.js lengkap dengan tembok, pintu tunggal/ganda, serta template kamar (10x10, L-Shape, Apartemen 2 Ruang). Pasang & kontrol perangkat IoT langsung di 3D, gunakan Mode Jelajah Avatar (WASD), Export/Import JSON, dan sematkan (Pin) ke Dashboard.',
    featColor: 'Tema Warna & Mode UI',
    featColorDesc: '6 warna aksen bawaan (Blue, Cyan, Emerald, Violet, Rose, Amber) ditambah Custom Hex Color dalam mode Gelap dan Terang. Seluruh grafik, sidebar, dan widget langsung berubah serta tersinkronisasi ke profil akun Anda.',
    featRealtime: 'Dashboard Drag-and-Drop & Widget',
    featRealtimeDesc: 'Susun ulang layout dashboard secara bebas (drag-and-drop). Tersedia grafik Area, Line, Bar, Gauge, Sparkline, Thermostat Widget, dan Smart Switch ON/OFF dua arah via MQTT.',
    featBuckets: 'Auto-Discovery Data Bucket',
    featBucketsDesc: 'Kirim data sensor JSON mentah tanpa membuat skema database manual — backend Videa Link otomatis mendeteksi setiap field metrik (suhu, kelembapan, rssi, dll.) dengan retensi hingga 365 hari.',
    featDevices: 'Manajemen Perangkat & Heartbeat 60s',
    featDevicesDesc: 'Daftarkan perangkat ESP32, ESP8266, Arduino, atau Raspberry Pi dengan auto-provisioning bucket untuk MQTT, sinkronisasi ruangan otomatis, dan deteksi status ONLINE/OFFLINE setiap 60 detik.',
    featAlerts: 'Automations & Endpoints Webhook',
    featAlertsDesc: 'Buat aturan IF-THEN otomatis berdasarkan Jadwal Waktu atau ambang batas sensor (>, <, ==) untuk mengendalikan perangkat, serta hubungkan Endpoint ke HTTP Webhook, Telegram, Email, Slack, dan MQTT.',
    featSecurity: 'Keamanan Token, Rate Limit & Kuota',
    featSecurityDesc: 'Dilengkapi Bearer Token unik per perangkat, autentikasi Laravel Sanctum, rate limiting 60 req/menit, manajemen peran Admin/User (RBAC), serta notifikasi batas kuota paket secara proaktif.',
    dataBuckets: 'Wadah Data & Telemetri.',
    dataBucketsDesc: 'Simpan data sensor IoT Anda dalam Data Bucket time-series yang terorganisir dengan Auto-Discovery field otomatis.',
    devMan: 'Manajemen Perangkat.',
    devManDesc: 'Visibilitas penuh atas perangkat ESP32, ESP8266, Arduino, dan Raspberry Pi Anda dengan pemantauan heartbeat otomatis.',
    intCust: 'Kustomisasi Antarmuka.',
    intCustDesc: 'Personalisasi ruang kerja dengan mode Gelap/Terang, 5 tema warna + Custom Hex, dan tata letak widget yang tersimpan per akun.',
    whichPlat: 'Paket mana yang tepat untuk Anda?',
    dev: 'Starter',
    devDesc: 'Esensi untuk uji coba awal dan satu perangkat smart home.',
    free: 'Gratis',
    upTo5: '1 Perangkat IoT',
    msg10k: '1 Data Bucket & 1 Endpoint',
    ret24h: 'Retensi Data 7 Hari',
    ent: 'Enterprise',
    entDesc: 'Performa penuh untuk skala gedung dan armada besar.',
    mo: '/bln',
    unlimitedDev: 'Perangkat & Ruangan 3D Tanpa Batas',
    msg1m: 'Bucket & Endpoint Tanpa Batas',
    ret1y: 'Retensi Data 365 Hari',
    custAnalyt: 'Dukungan Prioritas & RBAC',
    copy: 'Hak Cipta © {year} Videa Link. Seluruh hak cipta dilindungi.',
    privPolicy: 'Kebijakan Privasi',
    termsUse: 'Syarat Penggunaan',
  },
  en: {
    overview: 'Overview',
    features: 'Features',
    industry: 'Industry',
    performance: 'Performance',
    connectivity: 'Connectivity',
    pricing: 'Pricing',
    faq: 'FAQ',
    signIn: 'Sign In',
    buy: 'Sign Up',
    heroTitle: 'Videa Link.',
    heroSub: 'Real-time command for every connected device and space.',
    heroDesc: 'One unified platform to stream telemetry, automate operations, and monitor your physical IoT infrastructure in live 3D.',
    getStarted: 'Start for Free',
    learnMore: 'Explore features',
    univConn: 'IoT Connectivity & 3D Rooms',
    oneGate: 'One platform.',
    thousands: 'Complete real-time control.',
    gateDesc: 'Videa Link unifies sensor telemetry, bi-directional device control (Smart Switch & Thermostat), Auto-Discovery Data Buckets, and an interactive 3D Room Floor Plan Editor.',
    rtGate: 'Bi-Directional Control & 3D Rooms',
    rtGateDesc: 'Toggle devices directly from dashboard widgets or click objects inside your interactive 3D room.',
    uniProto: 'MQTT Broker & HTTP REST API',
    uniProtoDesc: 'Supports ESP32, ESP8266, Arduino, and Raspberry Pi with Bearer Token auth & JSON auto-discovery.',
    scaryFast: 'Scary fast.',
    scaryCap: 'Scary capable.',
    globalLat: 'Fast Ingestion',
    globalLatDesc: 'Responsive telemetry ingestion and bi-directional device commands.',
    uptimeGuar: '60s Heartbeat Detection',
    uptimeGuarDesc: 'Automatic ONLINE/OFFLINE status tracking every 60 seconds.',
    connEverything: 'Connect everything.',
    compNothing: 'Compromise nothing.',
    connDesc: 'Native integrations for microcontrollers, protocols, and notification channels.',
    protoHwLabel: 'SUPPORTED FEATURES, PROTOCOLS & HARDWARE',
    featMagic: 'Production-ready features.',
    featDesc: 'Everything you need to manage IoT devices, Data Buckets, Automations, and 3D Rooms in one seamless workspace.',
    // MacBook feature section
    chooseTheme: 'Theme',
    featRoom3D: '3D Room & Floor Plan Editor',
    featRoom3DDesc: 'Design 3D rooms powered by Three.js with walls, single/double doors, and ready-made room templates (10x10, L-Shape, 2-Room Apartment). Place & toggle IoT devices right in 3D, walk around in WASD Avatar Mode, Export/Import JSON, and Pin rooms to your Dashboard.',
    featColor: 'Color Themes & UI Modes',
    featColorDesc: '6 signature accent themes (Blue, Cyan, Emerald, Violet, Rose, Amber) plus Custom Hex Color across Dark and Light modes. Charts, sidebars, and widgets adapt immediately and sync to your user profile.',
    featRealtime: 'Drag-and-Drop Dashboard & Widgets',
    featRealtimeDesc: 'Freely rearrange your dashboard layout with drag-and-drop. Includes Area, Line, Bar, Gauge, Sparkline charts, Thermostat Widget, and bi-directional MQTT Smart Switch controls.',
    featBuckets: 'Auto-Discovery Data Buckets',
    featBucketsDesc: 'Send raw JSON sensor payloads without manual schema setup — Videa Link automatically discovers metric fields (temperature, humidity, rssi, etc.) with up to 365 days retention.',
    featDevices: 'Device Management & 60s Heartbeat',
    featDevicesDesc: 'Register ESP32, ESP8266, Arduino, or Raspberry Pi devices with automatic MQTT bucket provisioning, room sync, and automatic ONLINE/OFFLINE heartbeat detection (60s timeout).',
    featAlerts: 'Automations & Webhook Endpoints',
    featAlertsDesc: 'Create IF-THEN rules triggered by Time Schedule or Sensor Thresholds (>, <, ==) to control devices, and connect Endpoints to HTTP Webhooks, Telegram, Email, Slack, and MQTT.',
    featSecurity: 'Token Security, Rate Limit & Quotas',
    featSecurityDesc: 'Protected by unique per-device Bearer Tokens, Laravel Sanctum auth, 60 req/min rate limiting, Admin/User RBAC roles, and proactive plan quota enforcement.',
    dataBuckets: 'Data Buckets & Telemetry.',
    dataBucketsDesc: 'Store IoT sensor data in structured time-series buckets with automatic JSON field discovery.',
    devMan: 'Device Management.',
    devManDesc: 'Full visibility over your ESP32, ESP8266, Arduino, and Raspberry Pi fleet with automatic heartbeat tracking.',
    intCust: 'Interface Customization.',
    intCustDesc: 'Personalize your workspace with Light/Dark modes, 5 accent themes + Custom Hex, and per-user saved widget layouts.',
    whichPlat: 'Which plan is right for you?',
    dev: 'Starter',
    devDesc: 'The essentials for initial testing and a single smart home device.',
    free: 'Free',
    upTo5: '1 IoT Device',
    msg10k: '1 Data Bucket & 1 Endpoint',
    ret24h: '7-Day Data Retention',
    ent: 'Enterprise',
    entDesc: 'Full scale performance for multi-building and large fleets.',
    mo: '/mo',
    unlimitedDev: 'Unlimited Devices & 3D Rooms',
    msg1m: 'Unlimited Buckets & Endpoints',
    ret1y: '365-Day Data Retention',
    custAnalyt: 'Priority Support & RBAC',
    copy: 'Copyright © {year} Videa Link. All rights reserved.',
    privPolicy: 'Privacy Policy',
    termsUse: 'Terms of Use',
  }
};

// --- FADE IN COMPONENT (Cinematic 3D Bi-directional Scroll Enter & Exit Animation) ---
const FadeIn = ({ children, delay = 0, direction = 'up', className = '', threshold = 0.08, activeTheme, withGlow = false }) => {
  const [viewState, setViewState] = useState('below'); // 'below' | 'visible' | 'above'
  const domRef = useRef();

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setViewState('visible');
          } else {
            const rect = entry.boundingClientRect;
            if (rect.top < 0) {
              setViewState('above');
            } else {
              setViewState('below');
            }
          }
        });
      },
      {
        threshold: [0, threshold, 0.25],
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const isVisible = viewState === 'visible';

  // Bi-directional 3D transforms:
  // When scrolling DOWN: enters from below (upward glide + tilt), exits to above (upward float + tilt away)
  // When scrolling UP: enters from above (downward glide + tilt), exits to below (downward float + tilt away)
  let currentTransform = 'translate3d(0, 0, 0) scale(1) rotateX(0deg) rotateY(0deg)';
  if (viewState === 'below') {
    if (direction === 'scale') {
      currentTransform = 'translate3d(0, 60px, 0) scale(0.86) rotateX(6deg)';
    } else if (direction === 'left') {
      currentTransform = 'translate3d(80px, 0, 0) scale(0.92) rotateY(-8deg)';
    } else if (direction === 'right') {
      currentTransform = 'translate3d(-80px, 0, 0) scale(0.92) rotateY(8deg)';
    } else {
      currentTransform = 'translate3d(0, 85px, 0) scale(0.92) rotateX(8deg)';
    }
  } else if (viewState === 'above') {
    if (direction === 'scale') {
      currentTransform = 'translate3d(0, -60px, 0) scale(0.86) rotateX(-6deg)';
    } else if (direction === 'left') {
      currentTransform = 'translate3d(-80px, 0, 0) scale(0.92) rotateY(8deg)';
    } else if (direction === 'right') {
      currentTransform = 'translate3d(80px, 0, 0) scale(0.92) rotateY(-8deg)';
    } else {
      currentTransform = 'translate3d(0, -85px, 0) scale(0.92) rotateX(-8deg)';
    }
  }

  return (
    <div
      ref={domRef}
      className={`relative z-10 ${className}`}
      style={{
        perspective: '1400px',
        transformStyle: 'preserve-3d',
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(14px)',
        transform: currentTransform,
        transition: `opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 1.05s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 0.85s ease ${delay}ms`,
        willChange: 'opacity, transform, filter',
      }}
    >
      {withGlow && (
        <div
          className="absolute inset-0 -z-10 pointer-events-none transition-all duration-1000 ease-out"
          style={{
            opacity: isVisible ? 0.35 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.75)',
            background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${activeTheme?.primary || '#06b6d4'}26 0%, transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState('id'); // Language State
  const t = dict[lang];
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const cycleTheme = () => {
    setActiveTheme(prev => {
      const currentMode = prev?.mode || 'dark';
      const availableThemes = THEMES.filter(th => th.mode === currentMode);
      const currentIndex = availableThemes.findIndex(th => th.id === prev?.id);
      const nextIndex = (currentIndex + 1) % (availableThemes.length || 1);
      const nextTheme = availableThemes[nextIndex] || THEMES[0];

      try {
        const colorName = nextTheme?.id ? nextTheme.id.replace('dark-', '').replace('light-', '') : 'blue';
        localStorage.setItem('iot_theme', colorName);
        localStorage.setItem('iot_theme_color', nextTheme.primary || '#0075ff');
        localStorage.setItem('iot_mode', nextTheme.mode || 'dark');

        if (colorName === 'blue') {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', colorName);
        }
        window.dispatchEvent(new CustomEvent('theme-updated'));
      } catch (e) {}

      return nextTheme;
    });
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleGlobalClick = (e) => {
      if (e?.target?.closest('button, a, input, select, textarea, [role="button"]')) {
        return;
      }
      cycleTheme();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const toggleLanguage = () => {
    setLang(lang === 'id' ? 'en' : 'id');
  };

  const primaryColor = activeTheme?.primary || '#0075ff';
  const silk = getSilkPaletteTokens(primaryColor);
  const darkThemes = THEMES.filter((th) => th.mode === 'dark');

  const selectThemeSwatch = (th) => {
    setActiveTheme(th);
    try {
      const colorName = th.id.replace('dark-', '').replace('light-', '');
      localStorage.setItem('iot_theme', colorName);
      localStorage.setItem('iot_theme_color', th.primary);
      localStorage.setItem('iot_mode', th.mode || 'dark');
      if (colorName === 'blue') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', colorName);
      }
      window.dispatchEvent(new CustomEvent('theme-updated'));
    } catch (e) {}
  };

  return (
    <div
      className="relative min-h-screen bg-[#04050b] text-white font-sans antialiased selection:bg-white/20 [overflow-x:clip]"
      style={{
        // Lock dark surface tokens so global [data-mode="light"] never breaks LandingPage text contrast
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
        '--silk-left': silk.left,
        '--silk-mid': silk.mid,
        '--silk-right': silk.right,
      }}
    >
      {/* ── FULL-PAGE ZIG-ZAG SCROLL-CHOREOGRAPHED LIQUID-SILK BACKGROUND ── */}
      <div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        <SilkWaveBackground color={primaryColor} fullPage />
      </div>

      {/* ── ANTIGRAVITY-STYLE WEIGHTLESS FULL-WIDTH TOP NAVBAR ── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: scrollY > 24 ? silk.deepRgba(0.76) : 'transparent',
          backdropFilter: scrollY > 24 ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrollY > 24 ? 'blur(20px)' : 'none',
          borderBottom: scrollY > 24 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
        }}
      >
        <nav className="w-full max-w-[1320px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Lockup + Quiet Navigation Links */}
          <div className="flex items-center gap-8">
            <a href="#overview" className="flex items-center gap-2.5 group select-none">
              <img
                src="/new_videa_link_icon.png"
                alt="Videa Link"
                className="w-6 h-6 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-[15px] font-medium tracking-[-0.02em] text-white">
                Videa Link
              </span>
            </a>

            <div className="hidden lg:flex items-center gap-1">
              {[
                { href: '#overview', label: t.overview },
                { href: '#features', label: t.features },
                { href: '#industri', label: t.industry },
                { href: '#pricing', label: t.pricing },
                { href: '#faq', label: t.faq },
              ].map((navItem) => (
                <a
                  key={navItem.href}
                  href={navItem.href}
                  className="px-3.5 py-2 rounded-full text-[13.5px] font-normal text-white/65 hover:text-white hover:bg-white/[0.06] transition-[color,background-color] duration-200"
                >
                  {navItem.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right: Language Toggle & Stark White Pill CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={toggleLanguage}
              className="min-h-[36px] min-w-[38px] text-[12px] font-medium text-white/70 hover:text-white transition-[color,background-color,transform] duration-200 active:scale-[0.96] hover:bg-white/[0.06] rounded-full px-3 py-1.5 select-none cursor-pointer"
              title="Ganti Bahasa / Change Language"
            >
              {lang === 'id' ? 'ID' : 'EN'}
            </button>

            <Link
              to="/login"
              className="min-h-[38px] inline-flex items-center gap-1.5 px-5 py-2 rounded-full font-medium text-[13px] tracking-[-0.01em] bg-white text-[#07090f] hover:bg-white/90 transition-[transform,background-color] duration-200 active:scale-[0.96] whitespace-nowrap"
            >
              <span>{t.signIn}</span>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-white/80 hover:text-white rounded-full bg-white/[0.06] border border-white/[0.12] transition-[color,background-color,transform] duration-200 active:scale-[0.96]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden px-5 py-3 flex flex-col gap-1 backdrop-blur-2xl border-b border-white/[0.10]"
            style={{ backgroundColor: silk.deepRgba(0.94) }}
          >
            {[
              { href: '#overview', label: t.overview },
              { href: '#features', label: t.features },
              { href: '#industri', label: t.industry },
              { href: '#pricing', label: t.pricing },
              { href: '#faq', label: t.faq },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] flex items-center px-3 rounded-xl text-[15px] font-normal text-white/85 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* ── WEIGHTLESS EDITORIAL HERO (ANTIGRAVITY.GOOGLE ARCHITECTURE OVER LIVE WEBGL) ── */}
      <section
        id="overview"
        className="relative z-10 pt-28 sm:pt-36 pb-20 sm:pb-28 px-6 overflow-hidden"
        style={{ position: 'relative' }}
      >
        {/* Seamless radial legibility scrim so bright silk wave crests never wash out hero copy */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 62% 54% at 50% 56%, rgba(3, 6, 16, 0.76) 0%, rgba(3, 6, 16, 0.44) 50%, transparent 82%)',
          }}
        />

        <div className="w-full max-w-[1160px] mx-auto flex flex-col items-center text-center relative z-10">
          {/* Calm Brand Lockup above Headline */}
          <FadeIn delay={60} className="w-full flex justify-center">
            <div className="inline-flex items-center gap-2.5 mb-6 select-none">
              <img
                src="/new_videa_link_icon.png"
                alt="Videa Link Icon"
                className="w-5 h-5 object-contain"
              />
              <span className="text-[15px] font-medium tracking-[-0.015em] text-white/90">
                Videa Link
              </span>
            </div>
          </FadeIn>

          {/* Editorial Regular/Medium Display Headline (Antigravity signature weight & spacing) */}
          <FadeIn delay={120} className="w-full">
            <h1
              className="text-[clamp(2.1rem,7.8vw,5rem)] leading-[1.06] font-normal tracking-[-0.04em] text-white max-w-[920px] mx-auto"
              style={{
                textWrap: 'balance',
                textShadow: '0 8px 32px rgba(2, 5, 14, 0.75), 0 2px 8px rgba(2, 5, 14, 0.65)',
              }}
            >
              {t.heroSub}
            </h1>
          </FadeIn>

          <FadeIn delay={180} className="mt-6 flex flex-col items-center w-full">
            <p
              className="text-[15px] sm:text-lg text-white/92 max-w-[600px] mx-auto font-normal leading-relaxed"
              style={{
                textWrap: 'pretty',
                textShadow: '0 2px 18px rgba(2, 5, 14, 0.92), 0 1px 4px rgba(2, 5, 14, 0.95)',
              }}
            >
              {t.heroDesc}
            </p>

            {/* Stark Monochrome Primary Pill + Crisp Frosted Secondary Pill */}
            <div className="mt-8 sm:mt-9 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-xs sm:max-w-none">
              <Link
                to="/login?mode=register"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full font-medium text-sm tracking-[-0.01em] bg-white text-[#07090f] hover:bg-white/90 shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition-[transform,background-color] duration-200 active:scale-[0.96] select-none"
              >
                <span>{t.getStarted}</span>
                <ArrowRight size={15} />
              </Link>

              <a
                href="#features"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 px-7 py-3 rounded-full font-medium text-sm tracking-[-0.01em] text-white hover:text-white backdrop-blur-xl bg-[#040714]/55 hover:bg-[#040714]/75 border border-white/25 transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.96] select-none"
              >
                <span>{t.learnMore}</span>
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── ANTIGRAVITY SIGNATURE SINUSOIDAL FLOATING ICON WAVE + EDITORIAL MANIFESTO ── */}
      <section
        id="connectivity"
        className="relative py-20 sm:py-28 bg-transparent border-t border-white/[0.08] overflow-hidden z-20"
      >
        <div className="w-full relative z-10">
          {/* Sinusoidal Floating Circular Icon Wave */}
          <FloatingIconWave primaryColor={primaryColor} />

          {/* Left-Aligned Antigravity Editorial Manifesto Statement */}
          <div className="max-w-[1200px] mx-auto mt-16 sm:mt-24 px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            <div className="lg:col-span-3">
              <span className="font-mono text-xs tracking-[0.06em] text-white/45">
                01 / {lang === 'id' ? 'Ekosistem' : 'Ecosystem'}
              </span>
            </div>
            <div className="lg:col-span-9">
              <p
                className="text-2xl sm:text-3xl md:text-[2.35rem] font-normal leading-[1.24] tracking-[-0.03em] text-white"
                style={{ textWrap: 'pretty' }}
              >
                {lang === 'id' ? (
                  <>
                    Videa Link menyatukan telemetri sensor, Data Bucket Auto-Discovery, dan Editor Ruangan 3D.{' '}
                    <span className="text-white/50">
                      Dirancang agar perangkat ESP32, ESP8266, Arduino, hingga Raspberry Pi terhubung dan dapat dikendalikan dalam hitungan detik.
                    </span>
                  </>
                ) : (
                  <>
                    Videa Link unifies sensor telemetry, Auto-Discovery Data Buckets, and a 3D Room Editor.{' '}
                    <span className="text-white/50">
                      Built so ESP32, ESP8266, Arduino, and Raspberry Pi hardware connect and respond in seconds.
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDITORIAL ARCHITECTURE BEAT (GATEWAY) ── */}
      <section
        id="gateway"
        className="relative py-24 sm:py-32 px-6 bg-transparent border-t border-white/[0.08] z-10 scroll-mt-20"
      >
        <div className="w-full max-w-[1200px] mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center text-left">
          {/* Left Column: Calm Editorial Copy + Hairline Spec Rows */}
          <FadeIn delay={140} direction="right" className="lg:col-span-5 text-left flex flex-col justify-center">
            <span className="font-mono text-xs tracking-[0.06em] text-white/45 mb-5">
              02 / {t.univConn}
            </span>

            <h3
              className="text-3xl sm:text-4xl md:text-[2.85rem] font-normal tracking-[-0.035em] leading-[1.1] text-white mb-6"
              style={{ textWrap: 'balance' }}
            >
              {t.oneGate} {t.thousands}
            </h3>

            <p
              className="text-base text-white/65 leading-relaxed mb-10"
              style={{ textWrap: 'pretty' }}
            >
              {t.gateDesc}
            </p>

            {/* Clean Architectural Hairline Spec Rows (No stacked heavy card clutter) */}
            <div className="border-t border-white/[0.10] divide-y divide-white/[0.10]">
              <div className="py-5 flex items-start gap-4">
                <Zap size={18} strokeWidth={1.7} className="mt-1 flex-shrink-0" style={{ color: silk.left }} />
                <div>
                  <h4 className="text-white font-medium text-[15px] tracking-[-0.01em]">{t.rtGate}</h4>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed" style={{ textWrap: 'pretty' }}>
                    {t.rtGateDesc}
                  </p>
                </div>
              </div>

              <div className="py-5 flex items-start gap-4">
                <Database size={18} strokeWidth={1.7} className="mt-1 flex-shrink-0" style={{ color: silk.left }} />
                <div>
                  <h4 className="text-white font-medium text-[15px] tracking-[-0.01em]">{t.uniProto}</h4>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed" style={{ textWrap: 'pretty' }}>
                    {t.uniProtoDesc}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Right Column: Serene Frosted Cinema Stage framing IoTAnimation */}
          <FadeIn delay={220} direction="left" className="lg:col-span-7 relative w-full flex items-center justify-center">
            <div
              className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-[24px] sm:rounded-[28px] p-2.5 sm:p-5 backdrop-blur-2xl border border-white/[0.12] flex items-center justify-center overflow-hidden"
              style={{
                background: silk.cardSurface,
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 30px 80px -24px rgba(0, 0, 0, 0.8)',
              }}
            >
              <IoTAnimation lang={lang} activeTheme={activeTheme} />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SCROLL-DRIVEN STICKY FEATURE SHOWCASE ── */}
      <FeatureShowcase
        t={t}
        lang={lang}
        activeTheme={activeTheme}
        onThemeChange={setActiveTheme}
      />

      {/* ── INDUSTRY SHOWCASE (SETELAH FITUR) ── */}
      <FadeIn delay={60} direction="up" activeTheme={activeTheme} withGlow={true}>
        <IndustryShowcase
          lang={lang}
          activeTheme={activeTheme}
        />
      </FadeIn>

      {/* ── PRICING SECTION (DENGAN TOGGLE BULANAN/TAHUNAN & TEMA GLOW) ── */}
      <FadeIn delay={60} direction="up" activeTheme={activeTheme} withGlow={true}>
        <PricingSection
          lang={lang}
          activeTheme={activeTheme}
        />
      </FadeIn>

      {/* ── FAQ SECTION (ACCORDION & TECHNICAL ARCHITECTURE REFERENCE) ── */}
      <FadeIn delay={60} direction="up" activeTheme={activeTheme} withGlow={true}>
        <FAQSection
          lang={lang}
          activeTheme={activeTheme}
        />
      </FadeIn>

      {/* ── CTA BANNER (AKTIVASI NODE & UJI COBA 14 HARI) ── */}
      <FadeIn delay={60} direction="scale" activeTheme={activeTheme} withGlow={true}>
        <CTABanner
          lang={lang}
          activeTheme={activeTheme}
        />
      </FadeIn>

      {/* ── FOOTER MULTI-KOLOM LENGKAP DENGAN BRAND LOGO & SYSTEM STATUS ── */}
      <FooterSection
        lang={lang}
        activeTheme={activeTheme}
      />

    </div>
  );
}
