import React, { useState, useRef, useEffect } from 'react';

const INDUSTRIES = [
  {
    id: 'city',
    tab: { id: 'Smart City', en: 'Smart City' },
    title: {
      id: 'Smart City & Keamanan Publik',
      en: 'Smart City & Public Safety',
    },
    desc: {
      id: 'Monitoring lalu lintas kota, deteksi banjir via sensor ketinggian air, dan jaringan CCTV pengawasan publik terpadu dalam satu peta komando kota.',
      en: 'City traffic monitoring, flood detection via water level sensors, and integrated public surveillance CCTV network in a unified city command map.',
    },
    bullets: {
      id: [
        'Analitik kepadatan kendaraan real-time di 500+ simpang jalan',
        'Sensor banjir LoRaWAN dengan jangkauan 15km tanpa listrik grid',
        'Integrasi command center kepolisian & BPBD',
      ],
      en: [
        'Real-time vehicle density analytics at 500+ intersections',
        'LoRaWAN flood sensors with 15km range without grid power',
        'Command center integration with police & emergency services',
      ],
    },
    image: 'https://images.unsplash.com/photo-1561498083-a89a9977ed1e?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'building',
    tab: { id: 'Gedung Komersial', en: 'Commercial Buildings' },
    title: {
      id: 'Gedung Komersial & Mal',
      en: 'Commercial Buildings & Malls',
    },
    desc: {
      id: 'Manajemen energi terpusat, kontrol parkir pintar, serta monitoring fasilitas pendingin HVAC untuk efisiensi operasional maksimal.',
      en: 'Centralized energy management, smart parking control, and HVAC chiller monitoring for maximum operational efficiency.',
    },
    bullets: {
      id: [
        'Penghematan tagihan listrik hingga 35% via otomasi beban puncak',
        'Guidance parkir pintar dengan sensor slot ultrasonik',
        'People counting untuk analitik tenant & keamanan',
      ],
      en: [
        'Up to 35% electricity bill savings via peak load automation',
        'Smart parking guidance with ultrasonic slot sensors',
        'People counting for tenant analytics and security',
      ],
    },
    image: 'https://images.unsplash.com/photo-1580106815433-a5b1d1d53d85?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'industry',
    tab: { id: 'Industri', en: 'Industry' },
    title: {
      id: 'Industri & Manufaktur',
      en: 'Industry & Manufacturing',
    },
    desc: {
      id: 'Monitoring mesin pabrik, sensor vibrasi pencegah kerusakan, dan thermal camera untuk menjaga lini produksi tetap berjalan tanpa henti.',
      en: 'Factory machine monitoring, preventive vibration sensors, and thermal cameras to keep production lines running without downtime.',
    },
    bullets: {
      id: [
        'Prediksi kerusakan mesin 14 hari lebih awal via analitik vibrasi',
        'Thermal imaging otomatis untuk panel listrik & motor',
        'Protokol Modbus TCP & OPC-UA native tanpa gateway tambahan',
      ],
      en: [
        'Machine failure prediction 14 days in advance via vibration analytics',
        'Automated thermal imaging for electrical panels & motors',
        'Native Modbus TCP & OPC-UA protocols without extra gateways',
      ],
    },
    image: 'https://images.unsplash.com/photo-1683322499436-f4383dd59f5a?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
  {
    id: 'home',
    tab: { id: 'Smart Home', en: 'Smart Home' },
    title: {
      id: 'Residensi & Smart Home',
      en: 'Residences & Smart Home',
    },
    desc: {
      id: 'Keamanan rumah terpadu, kendali gerbang otomatis, dan integrasi kamera pemantau keluarga yang bisa diakses dari mana saja.',
      en: 'Integrated home security, automated gate control, and family monitoring camera integration accessible from anywhere.',
    },
    bullets: {
      id: [
        'Notifikasi instan saat wajah tak dikenal terdeteksi di teras',
        'Skenario "Away Mode" — kunci pintu, matikan daya, aktifkan alarm',
        'Kompatibel dengan Matter, Zigbee, dan asisten suara',
      ],
      en: [
        'Instant alerts when unknown faces are detected on the porch',
        '"Away Mode" scenario — lock doors, turn off power, arm alarm',
        'Compatible with Matter, Zigbee, and voice assistants',
      ],
    },
    image: 'https://images.unsplash.com/photo-1713857297379-6fc26e70f581?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85',
  },
];

export default function IndustryShowcase({ lang = 'id', activeTheme }) {
  const [activeTab, setActiveTab] = useState('city');
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
  const glowColor = activeTheme?.glow || 'rgba(6, 182, 212, 0.4)';

  return (
    <section
      ref={sectionRef}
      id="industri"
      className="relative py-28 md:py-36 px-6 bg-black z-10"
      style={{ scrollMarginTop: '100px' }}
    >
      {/* Background Soft Ambient Light */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none blur-[140px] opacity-15 transition-all duration-700"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="max-w-[1240px] mx-auto relative z-20">
        {/* Section Header */}
        <div
          className="mb-10 md:mb-12 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(25px)',
          }}
        >
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-3 border"
            style={{
              backgroundColor: activeTheme?.primary ? `${activeTheme.primary}1A` : 'rgba(255, 255, 255, 0.05)',
              borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.1)',
              color: activeTheme?.primary || '#38bdf8',
            }}
          >
            {lang === 'id' ? 'SKENARIO INDUSTRI' : 'INDUSTRY SCENARIOS'}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mt-1 leading-tight max-w-2xl">
            {lang === 'id' ? 'Satu Platform, Tak Terbatas Penerapan' : 'One Platform, Limitless Applications'}
          </h2>
        </div>

        {/* Tab Filters */}
        <div
          className="flex flex-wrap gap-2.5 sm:gap-3 mb-8 md:mb-10 transition-all duration-700 delay-100 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(25px)',
          }}
        >
          {INDUSTRIES.map(item => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="px-5 py-2.5 rounded-full text-xs font-mono tracking-wider font-semibold uppercase transition-all duration-300"
                style={{
                  backgroundColor: isActive ? primaryColor : 'rgba(15, 23, 42, 0.6)',
                  color: isActive ? (activeTheme?.mode === 'light' ? '#ffffff' : '#04121a') : '#94a3b8',
                  borderColor: isActive ? primaryColor : 'rgba(56, 189, 248, 0.15)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  boxShadow: isActive ? `0 0 20px ${glowColor}` : 'none',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {item.tab[lang] || item.tab.id}
              </button>
            );
          })}
        </div>

        {/* Active Industry Panel Card */}
        <div
          className="rounded-[24px] border backdrop-blur-xl p-6 sm:p-10 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            borderColor: `${primaryColor}33`,
            boxShadow: `0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px ${glowColor.replace('0.45', '0.12').replace('0.35', '0.1')}`,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
            transition: 'opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1) 180ms, transform 0.95s cubic-bezier(0.16, 1, 0.3, 1) 180ms, border-color 0.4s ease, box-shadow 0.4s ease',
          }}
        >
          {/* Left Column: Details */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4 leading-snug">
              {current.title[lang] || current.title.id}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-xl">
              {current.desc[lang] || current.desc.id}
            </p>

            {/* Bullets */}
            <ul className="space-y-3.5">
              {(current.bullets[lang] || current.bullets.id).map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 leading-normal">
                  <span
                    className="font-bold text-base flex-shrink-0 transition-colors duration-500"
                    style={{ color: primaryColor }}
                  >
                    ▸
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Visual Image */}
          <div className="lg:col-span-5 relative group">
            <div
              className="relative w-full aspect-[16/10] sm:aspect-[16/11] rounded-2xl overflow-hidden border transition-all duration-500"
              style={{
                borderColor: `${primaryColor}44`,
                boxShadow: `0 15px 35px rgba(0, 0, 0, 0.8), 0 0 20px ${glowColor.replace('0.45', '0.2')}`,
              }}
            >
              <img
                src={current.image}
                alt={current.title[lang] || current.title.id}
                className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              {/* Subtle tech scanline overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
              {/* Corner badge */}
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono tracking-widest text-slate-300 uppercase">
                {current.id}·NODE
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
