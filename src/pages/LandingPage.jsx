import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Database, Globe, ChevronRight } from 'lucide-react';
import IoTAnimation from '../components/IoTAnimation';
import ParticleTunnel from '../components/ParticleTunnel';

// --- TRANSLATIONS DICTIONARY ---
const dict = {
  id: {
    overview: 'Ringkasan',
    performance: 'Performa',
    connectivity: 'Konektivitas',
    pricing: 'Harga',
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
    featMagic: 'Fitur yang terasa seperti sihir.',
    featDesc: 'Semua yang Anda butuhkan untuk mengatur ekosistem IoT masif, dibangun dalam satu pengalaman yang mulus.',
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
    performance: 'Performance',
    connectivity: 'Connectivity',
    pricing: 'Pricing',
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
    featMagic: 'Features that feel like magic.',
    featDesc: 'Everything you need to orchestrate a massive IoT ecosystem, built into one seamless experience.',
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

// --- FADE IN COMPONENT (Improved Scroll Animation) ---
const FadeIn = ({ children, delay = 0, direction = 'up', className = '', threshold = 0.25 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Toggle visibility to create both enter and exit animations on scroll
        setIsVisible(entry.isIntersecting);
      });
    }, { threshold, rootMargin: '0px 0px -50px 0px' });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, [threshold]);

  let transform = 'translateY(40px)';
  if (direction === 'down') transform = 'translateY(-40px)';
  if (direction === 'left') transform = 'translateX(40px)';
  if (direction === 'right') transform = 'translateX(-40px)';
  if (direction === 'scale') transform = 'scale(0.95) translateY(20px)';
  if (direction === 'none') transform = 'translateY(0px)';

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0px, 0px) scale(1)' : transform,
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [lang, setLang] = useState('id'); // Language State
  const t = dict[lang];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLang(lang === 'id' ? 'en' : 'id');
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* ── NAVBAR (MINIMAL) ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrollY > 20 ? 'bg-black/70 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/videa_link_logo.png" alt="Videa Link Logo" className="h-8 md:h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform" />
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#overview" className="text-[13px] font-medium text-[#f5f5f7] hover:opacity-70 transition-opacity">{t.overview}</a>
            <a href="#performance" className="text-[13px] font-medium text-[#f5f5f7] hover:opacity-70 transition-opacity">{t.performance}</a>
            <a href="#connectivity" className="text-[13px] font-medium text-[#f5f5f7] hover:opacity-70 transition-opacity">{t.connectivity}</a>
            <a href="#pricing" className="text-[13px] font-medium text-[#f5f5f7] hover:opacity-70 transition-opacity">{t.pricing}</a>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={toggleLanguage} 
              className="text-[11px] font-bold text-[#86868b] hover:text-white transition-colors border border-[#333336] rounded-md px-2 py-1"
            >
              {lang === 'id' ? 'ID' : 'EN'}
            </button>
            <Link to="/login" className="hidden md:block text-[13px] font-medium text-[#86868b] hover:text-white transition-colors">
              {t.signIn}
            </Link>
            <Link to="/login" className="text-[13px] font-medium bg-white text-black px-5 py-2 rounded-full hover:scale-105 transition-transform font-bold">
              {t.buy}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section id="overview" className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col justify-center overflow-hidden">
        
        {/* Background Animation (Sticky to viewport while inside overview) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="sticky top-0 w-full h-screen">
            <ParticleTunnel />
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
          
          <FadeIn delay={200} className="mt-4 md:mt-6 drop-shadow-[0_4px_30px_rgba(0,0,0,1)]">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
              {t.heroSub}
            </h2>
            <p className="mt-6 text-xl md:text-2xl font-medium text-[#e0e0e0] max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,1)] font-bold">
              {t.heroDesc}
            </p>
            <div className="mt-10 flex items-center justify-center gap-6">
              <Link to="/login" className="text-lg font-medium bg-white text-black px-8 py-3 rounded-full hover:scale-105 transition-transform">
                {t.getStarted}
              </Link>
              <a href="#performance" className="text-lg font-medium text-[#0071e3] hover:text-[#2997ff] flex items-center gap-1 group">
                {t.learnMore} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── UNIVERSAL CONNECTIVITY (Features) ── */}
      <section id="features" className="relative py-32 px-6 bg-black z-10">
        {/* Soft blur/gradient transition that overlays and fades out the hero section above */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-transparent to-black -translate-y-full pointer-events-none" />

        <div className="w-full max-w-[1300px] mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center text-left">
          {/* Left Column: Animation */}
          <FadeIn delay={400} direction="right" className="relative w-full aspect-[16/11] flex items-center justify-center">
            <IoTAnimation lang={lang} />
          </FadeIn>

          {/* Right Column: Explanatory Text */}
          <FadeIn delay={600} direction="left" className="text-left flex flex-col justify-center">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#86868b] uppercase tracking-widest mb-6 w-fit">
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
                <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#333336] flex items-center justify-center shadow-lg">
                  <Zap className="text-[#0071e3]" size={24} />
                </div>
                <div>
                  <h4 className="text-[#f5f5f7] font-semibold text-lg">{t.rtGate}</h4>
                  <p className="text-[#86868b] text-sm mt-1">{t.rtGateDesc}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#333336] flex items-center justify-center shadow-lg">
                  <Database className="text-[#0071e3]" size={24} />
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

      {/* ── METRICS (THE "CHIP" SECTION) ── */}
      {/* Removed hard borders so it melts seamlessly into the overview section */}
      <section id="performance" className="relative py-32 px-6 bg-black">
        <div className="max-w-[1200px] mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-[#f5f5f7] mb-24">
              {t.scaryFast} <br />
              <span className="text-[#86868b]">{t.scaryCap}</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-10">
            <FadeIn delay={100} direction="up" className="flex flex-col items-center">
              <div className="text-[6rem] md:text-[8rem] font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#2997ff]">
                12<span className="text-4xl md:text-6xl text-[#0071e3]">ms</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mt-4 text-[#f5f5f7]">{t.globalLat}</h3>
              <p className="mt-4 text-lg text-[#86868b] max-w-sm">{t.globalLatDesc}</p>
            </FadeIn>

            <FadeIn delay={200} direction="up" className="flex flex-col items-center">
              <div className="text-[6rem] md:text-[8rem] font-bold tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-[#2997ff]">
                99.9<span className="text-4xl md:text-6xl text-[#0071e3]">%</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mt-4 text-[#f5f5f7]">{t.uptimeGuar}</h3>
              <p className="mt-4 text-lg text-[#86868b] max-w-sm">{t.uptimeGuarDesc}</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── CONNECTIVITY (PORTS / HARDWARE) ── */}
      <section id="connectivity" className="relative py-40 px-6 bg-[#1d1d1f]">
        {/* Soft blur/gradient transition from the black performance section above */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        {/* Soft blur/gradient transition to the black features section below */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#f5f5f7] mb-8">
              {t.connEverything} <br />
              <span className="text-[#86868b]">{t.compNothing}</span>
            </h2>
            <p className="text-xl md:text-2xl font-medium text-[#86868b] max-w-3xl mx-auto mb-20">
              {t.connDesc}
            </p>
          </FadeIn>

          <FadeIn delay={200} className="flex flex-wrap items-center justify-center gap-16 md:gap-24">
            <div className="flex flex-col items-center gap-4 group cursor-default">
              <div className="w-20 h-20 bg-[#111111] rounded-3xl flex items-center justify-center border border-[#333336] transition-transform duration-500 group-hover:scale-110 group-hover:border-[#00979D] shadow-lg">
                <img src="https://cdn.simpleicons.org/arduino/white" alt="Arduino" className="w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg font-semibold text-[#86868b] group-hover:text-[#f5f5f7] transition-colors">Arduino</span>
            </div>
            
            <div className="flex flex-col items-center gap-4 group cursor-default">
              <div className="w-20 h-20 bg-[#111111] rounded-3xl flex items-center justify-center border border-[#333336] transition-transform duration-500 group-hover:scale-110 group-hover:border-[#E7352C] shadow-lg">
                <img src="https://cdn.simpleicons.org/espressif/white" alt="Espressif" className="w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg font-semibold text-[#86868b] group-hover:text-[#f5f5f7] transition-colors">Espressif</span>
            </div>

            <div className="flex flex-col items-center gap-4 group cursor-default">
              <div className="w-20 h-20 bg-[#111111] rounded-3xl flex items-center justify-center border border-[#333336] transition-transform duration-500 group-hover:scale-110 group-hover:border-[#C51A4A] shadow-lg">
                <img src="https://cdn.simpleicons.org/raspberrypi/white" alt="Raspberry Pi" className="w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg font-semibold text-[#86868b] group-hover:text-[#f5f5f7] transition-colors">Raspberry Pi</span>
            </div>

            <div className="flex flex-col items-center gap-4 group cursor-default">
              <div className="w-20 h-20 bg-[#111111] rounded-3xl flex items-center justify-center border border-[#333336] transition-transform duration-500 group-hover:scale-110 group-hover:border-[#660066] shadow-lg">
                <img src="https://cdn.simpleicons.org/mqtt/white" alt="MQTT 5.0" className="w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-lg font-semibold text-[#86868b] group-hover:text-[#f5f5f7] transition-colors">MQTT 5.0</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FEATURES (ALTERNATING GRID / ZIGZAG) ── */}
      <section className="py-40 px-6 bg-black">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <FadeIn className="text-center mb-32">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#f5f5f7]">
              {t.featMagic}
            </h2>
            <p className="mt-6 text-xl text-[#86868b] max-w-2xl mx-auto">
              {t.featDesc}
            </p>
          </FadeIn>

          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 mb-40">
            <div className="flex-1 lg:order-1 order-2">
              <FadeIn direction="left">
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f5f5f7] mb-6">{t.dataBuckets}</h3>
                <p className="text-lg md:text-xl text-[#86868b] leading-relaxed">
                  {t.dataBucketsDesc}
                </p>
              </FadeIn>
            </div>
            <div className="flex-1 lg:order-2 order-1 w-full relative group">
              <FadeIn direction="scale">
                <div className="absolute inset-0 bg-[#0071e3]/20 blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <img src="/assets/telemetry.png" alt="Data Buckets & Telemetry" className="relative z-10 w-full aspect-video object-cover rounded-3xl border border-[#333336] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" />
              </FadeIn>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 mb-40">
            <div className="flex-1 order-2 w-full relative group">
              <FadeIn direction="scale">
                <div className="absolute inset-0 bg-[#a78bfa]/20 blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <img src="/assets/map.png" alt="Device Management" className="relative z-10 w-full aspect-video object-cover rounded-3xl border border-[#333336] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" />
              </FadeIn>
            </div>
            <div className="flex-1 order-1">
              <FadeIn direction="right">
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f5f5f7] mb-6">{t.devMan}</h3>
                <p className="text-lg md:text-xl text-[#86868b] leading-relaxed">
                  {t.devManDesc}
                </p>
              </FadeIn>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 lg:order-1 order-2">
              <FadeIn direction="left">
                <h3 className="text-3xl md:text-5xl font-bold tracking-tight text-[#f5f5f7] mb-6">{t.intCust}</h3>
                <p className="text-lg md:text-xl text-[#86868b] leading-relaxed">
                  {t.intCustDesc}
                </p>
              </FadeIn>
            </div>
            <div className="flex-1 lg:order-2 order-1 w-full relative group">
              <FadeIn direction="scale">
                <div className="absolute inset-0 bg-[#10b981]/20 blur-[80px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                <img src="/assets/customization.png" alt="Interface Customization" className="relative z-10 w-full aspect-video object-cover rounded-3xl border border-[#333336] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" />
              </FadeIn>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-40 px-6 bg-black">
        {/* Soft blur/gradient transition from the gray connectivity section above */}
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-[#1d1d1f] to-transparent pointer-events-none" />
        
        <div className="max-w-[1000px] mx-auto relative z-10">
          <FadeIn>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#f5f5f7] mb-6">{t.whichPlat}</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Developer */}
            <FadeIn delay={100}>
              <div className="flex flex-col items-center text-center p-10 bg-transparent border-t border-[#333336] hover:bg-[#111111] transition-colors rounded-3xl">
                <h3 className="text-2xl font-bold text-[#f5f5f7] mb-2">{t.dev}</h3>
                <p className="text-[#86868b] mb-10 min-h-[48px]">{t.devDesc}</p>
                <div className="text-4xl font-bold text-[#f5f5f7] mb-8">{t.free}</div>
                
                <Link to="/login" className="w-full sm:w-auto bg-[#0071e3] text-white px-8 py-3 rounded-full font-medium hover:bg-[#0077ed] transition-colors mb-12">
                  {t.getStarted}
                </Link>

                <ul className="space-y-4 text-left w-full max-w-xs mx-auto border-t border-[#333336] pt-10">
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.upTo5}</li>
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.msg10k}</li>
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.ret24h}</li>
                </ul>
              </div>
            </FadeIn>

            {/* Enterprise */}
            <FadeIn delay={200}>
              <div className="flex flex-col items-center text-center p-10 bg-transparent border-t border-[#333336] hover:bg-[#111111] transition-colors rounded-3xl">
                <h3 className="text-2xl font-bold text-[#f5f5f7] mb-2">{t.ent}</h3>
                <p className="text-[#86868b] mb-10 min-h-[48px]">{t.entDesc}</p>
                <div className="text-4xl font-bold text-[#f5f5f7] mb-8">$49<span className="text-xl text-[#86868b] font-normal">{t.mo}</span></div>
                
                <Link to="/login" className="w-full sm:w-auto bg-[#f5f5f7] text-black px-8 py-3 rounded-full font-medium hover:bg-white transition-colors mb-12">
                  {t.buy}
                </Link>

                <ul className="space-y-4 text-left w-full max-w-xs mx-auto border-t border-[#333336] pt-10">
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.unlimitedDev}</li>
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.msg1m}</li>
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.ret1y}</li>
                  <li className="flex items-center gap-3 text-sm text-[#f5f5f7]"><div className="w-1.5 h-1.5 rounded-full bg-[#86868b]" /> {t.custAnalyt}</li>
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#333336] bg-black pt-10 pb-10">
        <div className="max-w-[1200px] mx-auto px-6 text-center md:text-left text-xs text-[#86868b] font-medium flex flex-col md:flex-row justify-between items-center gap-4">
          <p>{t.copy.replace('{year}', new Date().getFullYear())}</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#f5f5f7] transition-colors">{t.privPolicy}</a>
            <span className="border-l border-[#333336]"></span>
            <a href="#" className="hover:text-[#f5f5f7] transition-colors">{t.termsUse}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
