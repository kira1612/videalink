import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Database, Globe, ChevronRight, ChevronDown, Plus, Minus, Wifi, Activity, Shield, Layers, Bell, Settings2, Menu, X } from 'lucide-react';
import IoTAnimation from '../components/IoTAnimation';
import ParticleTunnel from '../components/ParticleTunnel';
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
    buy: 'Beli',
    heroTitle: 'Videa Link.',
    heroSub: 'Kendalikan masa depan, sekarang.',
    heroDesc: 'Bangun ekosistem IoT masif Anda dalam hitungan detik. Pantau jutaan perangkat secara real-time tanpa jeda, tanpa batas, tanpa kompromi.',
    getStarted: 'Mulai Gratis',
    learnMore: 'Pelajari lebih lanjut',
    univConn: 'Konektivitas Universal',
    oneGate: 'Satu gerbang.',
    thousands: 'Ribuan perangkat.',
    gateDesc: 'Videa Link OS mendengarkan dan menghubungkan seluruh ekosistem Anda. Mulai dari Lampu Pintar, Kamera CCTV, Sensor Suhu, hingga Speaker Pintar—semua terpusat dalam satu gateway dengan latensi nyaris nol.',
    rtGate: 'Gateway Waktu Nyata',
    rtGateDesc: 'Komunikasi dua arah instan tanpa jeda.',
    uniProto: 'Protokol Universal',
    uniProtoDesc: 'Mendukung MQTT, WebSocket, dan REST API.',
    scaryFast: 'Sangat cepat.',
    scaryCap: 'Sangat mumpuni.',
    globalLat: 'Latensi Global',
    globalLatDesc: 'Pemrosesan data yang sangat cepat, terasa seperti terjadi sebelum Anda mengklik.',
    uptimeGuar: 'Jaminan Uptime',
    uptimeGuarDesc: 'Dirancang untuk keandalan ekstrem. Sistem Anda tidak pernah tidur, begitu juga kami.',
    connEverything: 'Hubungkan segalanya.',
    compNothing: 'Tanpa kompromi.',
    connDesc: 'Integrasi asli untuk perangkat keras dan protokol paling mumpuni di dunia.',
    protoHwLabel: 'PROTOKOL & PERANGKAT KERAS YANG DIDUKUNG',
    featMagic: 'Fitur yang terasa seperti sihir.',
    featDesc: 'Semua yang Anda butuhkan untuk mengatur ekosistem IoT masif, dibangun dalam satu pengalaman yang mulus.',
    // MacBook feature section
    chooseTheme: 'Tema',
    featColor: 'Warna',
    featColorDesc: 'Enam pilihan tema warna elegan — dari Tengah Malam yang dalam hingga Aurora yang hidup. Setiap tema menyesuaikan seluruh UI secara instan, termasuk chart, badge, dan sidebar. Jadikan platform ini benar-benar milik Anda.',
    featRealtime: 'Telemetri Waktu Nyata',
    featRealtimeDesc: 'Data sensor mengalir langsung ke dashboard dalam hitungan milidetik via WebSocket. Tidak ada polling, tidak ada refresh — hanya aliran data yang selalu hidup dan responsif.',
    featDevices: 'Manajemen Perangkat',
    featDevicesDesc: 'Pantau ribuan perangkat sekaligus. Lacak status online/offline, atur endpoint API, dan autentikasi ESP32, Arduino, atau Raspberry Pi Anda dari satu panel terpusat.',
    featSecurity: 'Keamanan Berlapis',
    featSecurityDesc: 'Setiap koneksi perangkat dilindungi token unik. Payload divalidasi sebelum disimpan. Rate limiting otomatis mencegah flooding data dari perangkat nakal.',
    featBuckets: 'Wadah Data Terorganisir',
    featBucketsDesc: 'Kelompokkan data sensor ke dalam bucket deret waktu yang terstruktur. Buat widget visualisasi dari bucket mana pun — line chart, gauge, atau tabel histori — secara drag-and-drop.',
    featAlerts: 'Notifikasi & Alarm',
    featAlertsDesc: 'Atur threshold untuk setiap metrik sensor. Ketika nilai melampaui batas, sistem langsung mengirim notifikasi real-time — tidak ada data kritis yang terlewat.',
    dataBuckets: 'Wadah Data & Telemetri.',
    dataBucketsDesc: 'Simpan data sensor IoT Anda dalam wadah deret waktu yang terorganisir. Visualisasikan tren secara instan dengan widget waktu nyata interaktif kami dan jangan pernah melewatkan satu titik data pun.',
    devMan: 'Manajemen Perangkat.',
    devManDesc: 'Visibilitas penuh atas jaringan edge Anda. Lacak status online, kelola titik akhir API, dan autentikasi perangkat Arduino, ESP32, dan Raspberry Pi Anda secara aman dari mana saja.',
    intCust: 'Kustomisasi Antarmuka.',
    intCustDesc: 'Jadikan milik Anda. Personalisasi ruang kerja dengan avatar kustom, beralih antara mode Terang dan Gelap, dan terapkan tema warna dinamis yang indah dan tersinkronisasi seketika melalui backend kami.',
    whichPlat: 'Platform mana yang tepat untuk Anda?',
    dev: 'Pengembang',
    devDesc: 'Esensi bagi penghobi dan penerapan skala kecil.',
    free: 'Gratis',
    upTo5: 'Hingga 5 Perangkat',
    msg10k: '10.000 Pesan / bln',
    ret24h: 'Retensi Data 24-jam',
    ent: 'Perusahaan',
    entDesc: 'Performa tanpa kompromi untuk skala produksi masif.',
    mo: '/bln',
    unlimitedDev: 'Perangkat Tak Terbatas',
    msg1m: '1Jt+ Pesan / bln',
    ret1y: 'Retensi Data 1 Tahun',
    custAnalyt: 'Mesin Analitik Kustom',
    copy: 'Hak Cipta © {year} Videa Link Inc. Seluruh hak cipta dilindungi.',
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
    buy: 'Buy',
    heroTitle: 'Videa Link.',
    heroSub: 'Command the future, today.',
    heroDesc: 'Build your massive IoT ecosystem in seconds. Monitor millions of devices in real-time with zero latency, zero limits, and zero compromise.',
    getStarted: 'Start for Free',
    learnMore: 'Learn more',
    univConn: 'Universal Connectivity',
    oneGate: 'One gateway.',
    thousands: 'Thousands of devices.',
    gateDesc: 'Videa Link OS listens and connects your entire ecosystem. From Smart Lamps, CCTV Cameras, Temperature Sensors, to Smart Speakers—all centralized in one gateway with near-zero latency.',
    rtGate: 'Real-time Gateway',
    rtGateDesc: 'Instant bi-directional communication with zero delay.',
    uniProto: 'Universal Protocol',
    uniProtoDesc: 'Supports MQTT, WebSocket, and REST API.',
    scaryFast: 'Scary fast.',
    scaryCap: 'Scary capable.',
    globalLat: 'Global Latency',
    globalLatDesc: 'Data processing so fast, it feels like it happened before you clicked.',
    uptimeGuar: 'Uptime Guarantee',
    uptimeGuarDesc: 'Engineered for extreme reliability. Your systems never sleep, neither do we.',
    connEverything: 'Connect everything.',
    compNothing: 'Compromise nothing.',
    connDesc: 'Native integrations for the world\'s most capable hardware and protocols.',
    protoHwLabel: 'SUPPORTED PROTOCOLS & HARDWARE',
    featMagic: 'Features that feel like magic.',
    featDesc: 'Everything you need to orchestrate a massive IoT ecosystem, built into one seamless experience.',
    // MacBook feature section
    chooseTheme: 'Theme',
    featColor: 'Color',
    featColorDesc: 'Six elegant color themes — from deep Midnight to vibrant Aurora. Every theme instantly adapts the entire UI including charts, badges, and sidebar. Make this platform truly yours.',
    featRealtime: 'Real-time Telemetry',
    featRealtimeDesc: 'Sensor data flows directly to the dashboard in milliseconds via WebSocket. No polling, no refresh — just a live, always-responsive data stream.',
    featDevices: 'Device Management',
    featDevicesDesc: 'Monitor thousands of devices at once. Track online/offline status, manage API endpoints, and authenticate your ESP32, Arduino, or Raspberry Pi from one central panel.',
    featSecurity: 'Layered Security',
    featSecurityDesc: 'Every device connection is protected by a unique token. Payloads are validated before storage. Automatic rate limiting prevents data flooding from rogue devices.',
    featBuckets: 'Organized Data Buckets',
    featBucketsDesc: 'Group sensor data into structured time-series buckets. Build visualization widgets from any bucket — line charts, gauges, or history tables — via drag-and-drop.',
    featAlerts: 'Notifications & Alerts',
    featAlertsDesc: 'Set thresholds for any sensor metric. When a value exceeds the limit, the system instantly sends a real-time notification — no critical data goes unnoticed.',
    dataBuckets: 'Data Buckets & Telemetry.',
    dataBucketsDesc: 'Store your IoT sensor data in organized time-series buckets. Visualize trends instantly with our interactive real-time widgets and never miss a single data point.',
    devMan: 'Device Management.',
    devManDesc: 'Full visibility over your edge network. Track online status, manage API endpoints, and securely authenticate your Arduino, ESP32, and Raspberry Pi devices from anywhere.',
    intCust: 'Interface Customization.',
    intCustDesc: 'Make it yours. Personalize your workspace with custom avatars, toggle between Light and Dark modes, and apply beautiful dynamic color themes that sync instantly via our backend.',
    whichPlat: 'Which platform is right for you?',
    dev: 'Developer',
    devDesc: 'The essentials for hobbyists and small-scale deployments.',
    free: 'Free',
    upTo5: 'Up to 5 Devices',
    msg10k: '10,000 Messages / mo',
    ret24h: '24-hour Data Retention',
    ent: 'Enterprise',
    entDesc: 'Uncompromised performance for massive production scale.',
    mo: '/mo',
    unlimitedDev: 'Unlimited Devices',
    msg1m: '1M+ Messages / mo',
    ret1y: '1 Year Data Retention',
    custAnalyt: 'Custom Analytics Engine',
    copy: 'Copyright © {year} Videa Link Inc. All rights reserved.',
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
      className={`relative ${className}`}
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
  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('iot_theme');
      const savedMode = localStorage.getItem('iot_mode') || 'dark';
      if (savedTheme) {
        const found = THEMES.find(t => t.id === `${savedMode}-${savedTheme}`);
        if (found) return found;
      }
    } catch (e) {}
    return THEMES[0];
  });
  const cycleTheme = () => {
    setActiveTheme(prev => {
      const currentMode = prev?.mode || 'dark';
      const availableThemes = THEMES.filter(th => th.mode === currentMode);
      const currentIndex = availableThemes.findIndex(th => th.id === prev?.id);
      const nextIndex = (currentIndex + 1) % (availableThemes.length || 1);
      const nextTheme = availableThemes[nextIndex] || THEMES[0];

      try {
        const colorName = nextTheme?.id ? nextTheme.id.replace('dark-', '').replace('light-', '') : 'cyan';
        if (colorName === 'cyan') {
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

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* ── CAPSULE FLOATING NAVBAR (WITH DYNAMIC THEME ACCENTS) ── */}
      <header className="fixed top-4 md:top-6 left-0 right-0 z-50 px-3 md:px-8 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          className="w-full max-w-[1240px] pointer-events-auto rounded-full transition-all duration-500 backdrop-blur-xl"
          style={{
            backgroundColor: scrollY > 20 ? 'rgba(3, 19, 30, 0.92)' : 'rgba(3, 19, 30, 0.78)',
            borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(6, 182, 212, 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: activeTheme
              ? `0 10px 35px rgba(0,0,0,0.7), 0 0 25px ${activeTheme.glow || `${activeTheme.primary}33`}`
              : '0 10px 35px rgba(0,0,0,0.7), 0 0 25px rgba(6, 182, 212, 0.18)',
          }}
        >
          <div className="px-5 sm:px-7 md:px-8 py-2 md:py-2.5 flex items-center justify-between">
            {/* Left: Previous Brand Logo */}
            <a href="#overview" className="flex items-center gap-2 group select-none">
              <img
                src="/new_videa_link_logo.png"
                alt="Videa Link Logo"
                className="h-7 sm:h-8 md:h-9 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
              />
            </a>

            {/* Center: Navigation Links (Matching Actual Page Content) */}
            <div className="hidden lg:flex items-center gap-7 xl:gap-9">
              <a
                href="#overview"
                className="text-[13.5px] font-medium text-slate-300 hover:text-white transition-all"
                onMouseEnter={(e) => { if (activeTheme?.primary) e.currentTarget.style.color = activeTheme.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                {t.overview}
              </a>
              <a
                href="#features"
                className="text-[13.5px] font-medium text-slate-300 hover:text-white transition-all"
                onMouseEnter={(e) => { if (activeTheme?.primary) e.currentTarget.style.color = activeTheme.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                {t.features}
              </a>
              <a
                href="#industri"
                className="text-[13.5px] font-medium text-slate-300 hover:text-white transition-all"
                onMouseEnter={(e) => { if (activeTheme?.primary) e.currentTarget.style.color = activeTheme.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                {t.industry}
              </a>
              <a
                href="#pricing"
                className="text-[13.5px] font-medium text-slate-300 hover:text-white transition-all"
                onMouseEnter={(e) => { if (activeTheme?.primary) e.currentTarget.style.color = activeTheme.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                {t.pricing}
              </a>
              <a
                href="#faq"
                className="text-[13.5px] font-medium text-slate-300 hover:text-white transition-all"
                onMouseEnter={(e) => { if (activeTheme?.primary) e.currentTarget.style.color = activeTheme.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
              >
                {t.faq}
              </a>
            </div>

            {/* Right: Language Switcher & Dynamic Themed Login Button */}
            <div className="flex items-center gap-2 sm:gap-3.5">
              <button
                onClick={toggleLanguage}
                className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors border border-white/10 hover:border-white/25 rounded-full px-2.5 py-1 select-none"
                title="Ganti Bahasa / Change Language"
              >
                {lang === 'id' ? 'ID' : 'EN'}
              </button>

              <Link
                to="/login"
                className="px-6 sm:px-7 py-2 md:py-2.5 rounded-full font-bold text-xs sm:text-[13px] tracking-tight transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] whitespace-nowrap"
                style={{
                  backgroundColor: activeTheme?.primary || '#06b6d4',
                  color: activeTheme?.mode === 'light' ? '#ffffff' : '#000000',
                  boxShadow: activeTheme
                    ? `0 0 20px ${activeTheme.glow || `${activeTheme.primary}80`}`
                    : '0 0 20px rgba(6, 182, 212, 0.5)',
                }}
              >
                Login
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-300 hover:text-white rounded-full bg-white/5 border border-white/10"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden px-6 py-4 flex flex-col gap-3 rounded-b-[28px] backdrop-blur-2xl bg-[#03131e]/95"
              style={{
                borderTopWidth: '1px',
                borderTopStyle: 'solid',
                borderTopColor: activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(6, 182, 212, 0.2)',
              }}
            >
              <a
                href="#overview"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1 transition-colors"
              >
                {t.overview}
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1 transition-colors"
              >
                {t.features}
              </a>
              <a
                href="#industri"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1 transition-colors"
              >
                {t.industry}
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1 transition-colors"
              >
                {t.pricing}
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white py-1 transition-colors"
              >
                {t.faq}
              </a>
            </div>
          )}
        </nav>
      </header>

      {/* ── HERO SECTION ── */}
      <section id="overview" className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center overflow-hidden">
        
        {/* Background Animation (Sticky to viewport while inside overview) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="sticky top-0 w-full h-screen">
            <ParticleTunnel
              color={activeTheme?.primary}
              onCycleTheme={cycleTheme}
            />
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-0" />
        
        {/* Content container perfectly centered in available space */}
        <div className="w-full flex flex-col items-center justify-center text-center relative z-10">
          <FadeIn delay={100} className="w-full drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <h1 className="text-[14vw] md:text-[9rem] leading-[1.05] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] to-[#a1a1a6] pb-2">
              {t.heroTitle}
            </h1>
          </FadeIn>
          
          <FadeIn delay={200} className="mt-4 md:mt-6 drop-shadow-[0_4px_30px_rgba(0,0,0,1)] flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              {t.heroSub}
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg text-slate-300/85 max-w-xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              {t.heroDesc}
            </p>
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              {/* Primary CTA Button (Dynamic Theme Cyber Pill with Glow) */}
              <Link
                to="/login"
                className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg select-none"
                style={{
                  backgroundColor: activeTheme?.primary || '#06b6d4',
                  color: activeTheme?.mode === 'light' ? '#ffffff' : '#04121a',
                  boxShadow: activeTheme
                    ? `0 0 25px ${activeTheme.glow || `${activeTheme.primary}80`}, 0 4px 15px rgba(0,0,0,0.5)`
                    : '0 0 25px rgba(6, 182, 212, 0.5), 0 4px 15px rgba(0,0,0,0.5)',
                }}
              >
                {t.getStarted}
              </Link>

              {/* Secondary Ghost Button (Translucent Capsule with Theme Border & Hover) */}
              <a
                href="#features"
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-medium text-xs sm:text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 select-none group"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.15)',
                  color: activeTheme?.primary || '#38bdf8',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  if (activeTheme?.primary) {
                    e.currentTarget.style.borderColor = activeTheme.primary;
                    e.currentTarget.style.backgroundColor = `${activeTheme.primary}1A`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <span>{t.learnMore}</span>
                <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* ── 4 STAT CARDS (SESUAI GAMBAR 2) ── */}
            <div className="mt-14 sm:mt-16 w-full max-w-4xl px-2 sm:px-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Card 1: <12ms */}
                <div
                  className="rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 group"
                  style={{
                    backgroundColor: 'rgba(8, 15, 28, 0.65)',
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary || '#06b6d4';
                    e.currentTarget.style.boxShadow = `0 10px 35px rgba(0, 0, 0, 0.7), 0 0 25px ${activeTheme?.glow || 'rgba(6, 182, 212, 0.3)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-300"
                    style={{ color: activeTheme?.primary || '#22d3ee' }}
                  >
                    &lt;12ms
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-2">
                    {lang === 'id' ? 'LATENSI RATA-RATA' : 'AVG LATENCY'}
                  </div>
                </div>

                {/* Card 2: 99.99% */}
                <div
                  className="rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 group"
                  style={{
                    backgroundColor: 'rgba(8, 15, 28, 0.65)',
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary || '#06b6d4';
                    e.currentTarget.style.boxShadow = `0 10px 35px rgba(0, 0, 0, 0.7), 0 0 25px ${activeTheme?.glow || 'rgba(6, 182, 212, 0.3)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-300"
                    style={{ color: activeTheme?.primary || '#22d3ee' }}
                  >
                    99.99%
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-2">
                    {lang === 'id' ? 'UPTIME SLA' : 'UPTIME SLA'}
                  </div>
                </div>

                {/* Card 3: 50K+ */}
                <div
                  className="rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 group"
                  style={{
                    backgroundColor: 'rgba(8, 15, 28, 0.65)',
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary || '#06b6d4';
                    e.currentTarget.style.boxShadow = `0 10px 35px rgba(0, 0, 0, 0.7), 0 0 25px ${activeTheme?.glow || 'rgba(6, 182, 212, 0.3)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-300"
                    style={{ color: activeTheme?.primary || '#22d3ee' }}
                  >
                    50K+
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-2">
                    {lang === 'id' ? 'NODE AKTIF' : 'ACTIVE NODES'}
                  </div>
                </div>

                {/* Card 4: 180+ */}
                <div
                  className="rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center backdrop-blur-xl border transition-all duration-300 hover:-translate-y-1 group"
                  style={{
                    backgroundColor: 'rgba(8, 15, 28, 0.65)',
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary || '#06b6d4';
                    e.currentTarget.style.boxShadow = `0 10px 35px rgba(0, 0, 0, 0.7), 0 0 25px ${activeTheme?.glow || 'rgba(6, 182, 212, 0.3)'}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = activeTheme?.primary ? `${activeTheme.primary}33` : 'rgba(56, 189, 248, 0.2)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                  }}
                >
                  <div
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors duration-300"
                    style={{ color: activeTheme?.primary || '#22d3ee' }}
                  >
                    180+
                  </div>
                  <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-slate-400 mt-2">
                    {lang === 'id' ? 'PROTOKOL DIDUKUNG' : 'PROTOCOLS SUPPORTED'}
                  </div>
                </div>
              </div>

              {/* Animated Cyber Scroll Indicator */}
              <div className="mt-10 sm:mt-12 flex justify-center">
                <a
                  href="#connectivity"
                  className="flex flex-col items-center gap-2 group cursor-pointer select-none transition-all duration-300 hover:scale-105 active:scale-95"
                  aria-label="Scroll to next section"
                >
                  <span
                    className="font-mono text-[9px] sm:text-[10px] tracking-[0.32em] uppercase text-slate-400 group-hover:text-white transition-colors"
                  >
                    SCROLL
                  </span>

                  {/* Cyber Mouse Capsule with dynamic glowing wheel */}
                  <div
                    className="w-[20px] h-[34px] rounded-full border-[1.5px] flex items-start justify-center p-1 transition-all duration-300"
                    style={{
                      borderColor: activeTheme?.primary ? `${activeTheme.primary}80` : 'rgba(56, 189, 248, 0.5)',
                      boxShadow: `0 0 16px ${activeTheme?.glow ? activeTheme.glow.replace('0.45', '0.25') : 'rgba(6, 182, 212, 0.25)'}`,
                      backgroundColor: 'rgba(3, 10, 20, 0.6)',
                    }}
                  >
                    <div
                      className="w-1.5 h-2 rounded-full animate-scroll-wheel"
                      style={{
                        backgroundColor: activeTheme?.primary || '#06b6d4',
                        boxShadow: `0 0 8px ${activeTheme?.primary || '#06b6d4'}`,
                      }}
                    />
                  </div>

                  {/* Pulsing subtle chevron */}
                  <div className="animate-scroll-bounce -mt-0.5">
                    <ChevronDown size={14} style={{ color: activeTheme?.primary || '#38bdf8' }} />
                  </div>
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── PROTOCOL & HARDWARE TICKER (LANGSUNG DI BAWAH HERO OVERVIEW) ── */}
      <section id="connectivity" className="relative py-20 bg-black border-y border-white/5 overflow-hidden z-20">
        {/* Subtle radial glow from active theme */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${activeTheme?.primary || '#06b6d4'}26, transparent 75%)`,
          }}
        />

        <div className="w-full relative z-10 flex flex-col items-center">
          {/* Cyber Pill Tag Header */}
          <div className="text-center mb-8 px-4">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border"
              style={{
                backgroundColor: activeTheme?.primary ? `${activeTheme.primary}1A` : 'rgba(255, 255, 255, 0.05)',
                borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.1)',
                color: activeTheme?.primary || '#38bdf8',
              }}
            >
              {t.protoHwLabel}
            </div>
          </div>

          {/* Infinite Seamless Marquee Ticker */}
          <div className="w-full overflow-hidden select-none py-2 relative">
            {/* Edge fade gradients for seamless look */}
            <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-36 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee items-center gap-10 sm:gap-14">
              {[
                'HTTP/2',
                'LoRaWAN',
                'Zigbee',
                'REST API',
                'MQTT v5.0',
                'WebSocket',
                'Arduino',
                'ESP32',
                'Raspberry Pi',
                'Modbus TCP',
                'OPC-UA',
                'RTSP / ONVIF',
                'WebRTC',
                'CoAP',
                // Repeated sequence for 100% infinite continuous loop
                'HTTP/2',
                'LoRaWAN',
                'Zigbee',
                'REST API',
                'MQTT v5.0',
                'WebSocket',
                'Arduino',
                'ESP32',
                'Raspberry Pi',
                'Modbus TCP',
                'OPC-UA',
                'RTSP / ONVIF',
                'WebRTC',
                'CoAP',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-10 sm:gap-14 flex-shrink-0">
                  <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#8e9bb0]/70 hover:text-white transition-colors duration-300">
                    {item}
                  </span>
                  <span
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                    style={{
                      backgroundColor: activeTheme?.primary || '#06b6d4',
                      boxShadow: `0 0 12px ${activeTheme?.primary || '#06b6d4'}`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── UNIVERSAL CONNECTIVITY (Gateway) ── */}
      <section id="gateway" className="relative py-32 px-6 bg-black z-10 scroll-mt-24">
        {/* Soft blur/gradient transition that overlays and fades out the hero section above */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-transparent to-black -translate-y-full pointer-events-none" />

        <div className="w-full max-w-[1300px] mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center text-left">
          {/* Left Column: Animation with Dynamic Theme and New Logo */}
          <FadeIn delay={400} direction="right" className="relative w-full aspect-[16/11] flex items-center justify-center">
            <IoTAnimation lang={lang} activeTheme={activeTheme} />
          </FadeIn>

          {/* Right Column: Explanatory Text */}
          <FadeIn delay={600} direction="left" className="text-left flex flex-col justify-center">
            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 w-fit border"
              style={{
                backgroundColor: activeTheme?.primary ? `${activeTheme.primary}1A` : 'rgba(255, 255, 255, 0.05)',
                borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.1)',
                color: activeTheme?.primary || '#38bdf8',
              }}
            >
              {t.univConn}
            </div>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f5f5f7] mb-6">
              {t.oneGate}<br/>
              {t.thousands}
            </h3>
            <p className="text-lg md:text-xl text-[#86868b] leading-relaxed mb-10 max-w-lg">
              {t.gateDesc}
            </p>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <div
                  className="w-14 h-14 rounded-2xl bg-[#111111] border flex items-center justify-center shadow-lg transition-colors"
                  style={{
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : '#333336',
                  }}
                >
                  <Zap size={24} style={{ color: activeTheme?.primary || '#0071e3' }} />
                </div>
                <div>
                  <h4 className="text-[#f5f5f7] font-semibold text-lg">{t.rtGate}</h4>
                  <p className="text-[#86868b] text-sm mt-1">{t.rtGateDesc}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div
                  className="w-14 h-14 rounded-2xl bg-[#111111] border flex items-center justify-center shadow-lg transition-colors"
                  style={{
                    borderColor: activeTheme?.primary ? `${activeTheme.primary}33` : '#333336',
                  }}
                >
                  <Database size={24} style={{ color: activeTheme?.primary || '#0071e3' }} />
                </div>
                <div>
                  <h4 className="text-[#f5f5f7] font-semibold text-lg">{t.uniProto}</h4>
                  <p className="text-[#86868b] text-sm mt-1">{t.uniProtoDesc}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── MACBOOK-STYLE FEATURE SHOWCASE ── */}
      <FadeIn delay={60} direction="up" activeTheme={activeTheme} withGlow={true}>
        <FeatureShowcase
          t={t}
          lang={lang}
          activeTheme={activeTheme}
          onThemeChange={setActiveTheme}
        />
      </FadeIn>

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
