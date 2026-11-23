import React, { useState, useRef, useEffect } from 'react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

const INDUSTRIES = [
  {
    id: 'home',
    tab: { id: 'Smart Home & 3D Room', en: 'Smart Home & 3D Room' },
    title: {
      id: 'Residensi, Smart Home & Denah Ruangan 3D',
      en: 'Residences, Smart Home & 3D Room Floor Plans',
    },
    desc: {
      id: 'Rancang sendiri denah rumah 3D Anda (template kamar 10×10, L-Shape, Apartemen 2 Ruang), pasang perangkat lampu & AC pintar, lalu kendalikan langsung dari objek 3D atau Mode Jelajah Avatar (WASD).',
      en: 'Design your own 3D home floor plan (10×10, L-Shape, or 2-Room Apartment templates), place smart lights & AC units, and toggle them directly in 3D or walk around in WASD Avatar Mode.',
    },
    bullets: {
      id: [
        'Kontrol Smart Switch & Thermostat dua arah secara instan via MQTT',
        'Sematkan (Pin) Ruangan 3D & widget sensor favorit ke Dashboard utama',
        'Aturan Automations berbasis jadwal waktu (misal jam 18:00) atau ambang batas suhu',
      ],
      en: [
        'Instant bi-directional Smart Switch & Thermostat control over MQTT',
        'Pin your 3D Rooms & favorite sensor widgets directly onto the main Dashboard',
        'Time-scheduled or sensor-threshold Automations (e.g., auto-toggle lights at 18:00)',
      ],
    },
    image: 'https://images.unsplash.com/photo-1713857297379-6fc26e70f581?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'building',
    tab: { id: 'Gedung Komersial', en: 'Commercial Buildings' },
    title: {
      id: 'Gedung Komersial & Smart Office',
      en: 'Commercial Buildings & Smart Office',
    },
    desc: {
      id: 'Kelola hingga 15 Ruangan 3D (paket Pro IoT) atau tanpa batas (Enterprise), pantau suhu dan daya tiap ruangan melalui Data Bucket Auto-Discovery, serta atur peran akses Admin & User.',
      en: 'Manage up to 15 3D Rooms (Pro IoT) or unlimited rooms (Enterprise), monitor temperature and power via Auto-Discovery Data Buckets, and govern access with Admin & User roles.',
    },
    bullets: {
      id: [
        'Visualisasi posisi sensor & aktuator langsung pada denah 3D multi-ruangan',
        'Export/Import tata letak denah 3D dalam format JSON untuk replikasi cepat',
        'Pemicu Endpoint ke HTTP Webhook, Telegram, Email, Slack, dan MQTT',
      ],
      en: [
        'Visualize sensor & actuator placement across multi-room 3D floor plans',
        'Export/Import 3D room layouts as JSON for rapid deployment',
        'Endpoint triggers for HTTP Webhook, Telegram, Email, Slack, and MQTT',
      ],
    },
    image: 'https://images.unsplash.com/photo-1580106815433-a5b1d1d53d85?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'industry',
    tab: { id: 'Industri & Lab', en: 'Industry & Labs' },
    title: {
      id: 'Monitoring Ruang Server, Lab & Produksi',
      en: 'Server Room, Lab & Production Monitoring',
    },
    desc: {
      id: 'Pantau suhu, kelembapan, tegangan, dan status online perangkat ESP32/ESP8266/Raspberry Pi dengan deteksi Heartbeat 60 detik serta pencatatan histori telemetri hingga 365 hari.',
      en: 'Monitor temperature, humidity, voltage, and online health of ESP32/ESP8266/Raspberry Pi nodes with 60-second Heartbeat detection and up to 365 days of telemetry retention.',
    },
    bullets: {
      id: [
        'Auto-Discovery field JSON untuk grafik Area, Line, Bar, Gauge & Sparkline',
        'Proteksi Bearer Token unik per perangkat + Rate Limiting 60 req/menit',
        'Automations ambang batas sensor (>, <, ==) untuk pemicu pendingin/alarm otomatis',
      ],
      en: [
        'JSON Auto-Discovery for Area, Line, Bar, Gauge & Sparkline telemetry charts',
        'Per-device Bearer Token security + 60 req/min API rate limiting',
        'Sensor threshold Automations (>, <, ==) to trigger chillers or alarms automatically',
      ],
    },
    image: 'https://images.unsplash.com/photo-1683322499436-f4383dd59f5a?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'city',
    tab: { id: 'Maker & Edukasi', en: 'Makers & Education' },
    title: {
      id: 'Prototipe Maker, Kampus & Proyek IoT',
      en: 'Maker Prototypes, Campus & IoT Projects',
    },
    desc: {
      id: 'Mulai gratis dengan paket Starter atau tingkatkan mulai Rp 30.000/bulan. Dilengkapi menu Panduan (/app/guide) berisi kode Arduino IDE siap salin untuk ESP32 & ESP8266 (MQTT dan HTTP REST).',
      en: 'Start free on Starter or upgrade starting at Rp 30,000/month. Includes built-in Guides (/app/guide) with copy-paste Arduino IDE firmware for ESP32 & ESP8266 (MQTT and HTTP REST).',
    },
    bullets: {
      id: [
        'Template kode siap pakai ESP32/ESP8266 dengan Client ID unik berbasis MAC Address',
        'Auto-provisioning Data Bucket otomatis saat mendaftarkan perangkat MQTT',
        'Notifikasi kuota proaktif dan upgrade paket instan kapan saja di menu Langganan',
      ],
      en: [
        'Ready-to-flash ESP32/ESP8266 firmware with unique MAC-based Client IDs',
        'Automatic Data Bucket provisioning when registering MQTT devices',
        'Proactive quota notifications and instant plan upgrades in Billing',
      ],
    },
    image: 'https://images.unsplash.com/photo-1561498083-a89a9977ed1e?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
];

export default function IndustryShowcase({ lang = 'id', activeTheme }) {
  const [activeTab, setActiveTab] = useState('home');
  const [inView, setInView] = useState(false);
  const sectionRef = useRef();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const current = INDUSTRIES.find(item => item.id === activeTab) || INDUSTRIES[0];

  const primaryColor = activeTheme?.primary || '#06b6d4';
  const silk = getSilkPaletteTokens(primaryColor);

  return (
    <section
      ref={sectionRef}
      id="industri"
      className="relative py-24 sm:py-32 px-6 bg-transparent border-t border-white/[0.08] z-10"
      style={{ scrollMarginTop: '88px' }}
    >
      <div className="max-w-[1200px] mx-auto relative z-20">
        {/* Editorial Section Header + Quiet Tab Filter Bar */}
        <div
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10 md:mb-12 transition-[opacity,transform] duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(25px)',
          }}
        >
          <div>
            <span className="block font-mono text-xs tracking-[0.06em] text-white/45 mb-4">
              04 / {lang === 'id' ? 'Skenario Penggunaan' : 'Use Cases'}
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-[3rem] font-normal tracking-[-0.035em] text-white leading-[1.08] max-w-xl"
              style={{ textWrap: 'balance' }}
            >
              {lang === 'id' ? 'Satu platform, berbagai skala penerapan.' : 'One platform, every deployment scale.'}
            </h2>
          </div>

          {/* Minimal Monochrome Pill Tabs (Stark White Active) */}
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((item) => {
              const isActive = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-[13px] font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color] duration-200 backdrop-blur-xl cursor-pointer select-none active:scale-[0.96] ${
                    isActive
                      ? 'bg-white text-[#07090f] border border-white'
                      : 'text-white/65 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.11]'
                  }`}
                >
                  {item.tab[lang] || item.tab.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clean Architectural 2-Column Showcase Panel */}
        <div
          className="rounded-[28px] border border-white/[0.11] backdrop-blur-2xl p-6 sm:p-10 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center"
          style={{
            background: silk.cardSurface,
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 32px 80px -24px rgba(0, 0, 0, 0.82)',
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) 140ms, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) 140ms',
          }}
        >
          {/* Left Column: Editorial Details */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h3
              className="text-2xl sm:text-[1.9rem] font-normal tracking-[-0.03em] text-white mb-4 leading-snug"
              style={{ textWrap: 'balance' }}
            >
              {current.title[lang] || current.title.id}
            </h3>
            <p
              className="text-white/65 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-xl"
              style={{ textWrap: 'pretty' }}
            >
              {current.desc[lang] || current.desc.id}
            </p>

            {/* Hairline Bullet List */}
            <ul className="border-t border-white/[0.09] divide-y divide-white/[0.09]">
              {(current.bullets[lang] || current.bullets.id).map((bullet, idx) => (
                <li
                  key={idx}
                  className="py-3.5 flex items-start gap-3 text-sm text-white/80 leading-relaxed"
                  style={{ textWrap: 'pretty' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: silk.left }}
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Concentric Radius Framed Image */}
          <div className="lg:col-span-6 relative group">
            <div
              className="relative w-full aspect-[16/10] sm:aspect-[16/11] rounded-[22px] p-2 bg-white/[0.03] border border-white/[0.11]"
              style={{
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 20px 44px -14px rgba(0, 0, 0, 0.82)',
              }}
            >
              <div
                className="relative w-full h-full rounded-[14px] overflow-hidden"
                style={{
                  outline: '1px solid rgba(255, 255, 255, 0.10)',
                  outlineOffset: '-1px',
                }}
              >
                <img
                  src={current.image}
                  alt={current.title[lang] || current.title.id}
                  className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04060d]/75 via-transparent to-black/10 pointer-events-none" />
                <div
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-full backdrop-blur-xl border border-white/[0.14] text-[10px] font-mono tracking-widest text-white/80 uppercase"
                  style={{ background: silk.pillSurface }}
                >
                  {current.id}·NODE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
