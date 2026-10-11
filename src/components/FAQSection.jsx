import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: {
      id: 'Apakah Videalink kompatibel dengan perangkat IoT saya yang sudah ada?',
      en: 'Is Videalink compatible with my existing IoT devices?',
    },
    a: {
      id: 'Ya. Videalink mendukung 180+ protokol hardware secara native — termasuk MQTT, Zigbee 3.0, LoRaWAN, Modbus TCP, dan OPC-UA. Mayoritas sensor dan controller yang sudah terpasang dapat terhubung tanpa penggantian perangkat.',
      en: 'Yes. Videalink natively supports 180+ hardware protocols — including MQTT, Zigbee 3.0, LoRaWAN, Modbus TCP, and OPC-UA. Most installed sensors and controllers connect seamlessly without hardware replacement.',
    },
  },
  {
    q: {
      id: 'Bagaimana cara kamera CCTV lama saya terhubung ke Vision AI?',
      en: 'How do my existing CCTV cameras connect to Vision AI?',
    },
    a: {
      id: 'Selama kamera Anda mendukung stream RTSP atau standar ONVIF, Videalink dapat menarik feed-nya langsung dan menjalankan analisis Vision AI di edge gateway kami — tanpa perlu mengganti kamera lama Anda.',
      en: 'As long as your cameras support RTSP stream or the ONVIF standard, Videalink ingests the live feed directly and runs Vision AI analytics on our edge gateway — no camera replacement needed.',
    },
  },
  {
    q: {
      id: 'Apakah data video dan telemetri saya aman?',
      en: 'Is my video and telemetry data secure?',
    },
    a: {
      id: 'Seluruh komunikasi dienkripsi end-to-end dengan TLS 1.3 dan penyimpanan AES-256. Untuk paket Enterprise, tersedia opsi deployment on-premise sehingga data tidak pernah meninggalkan infrastruktur Anda.',
      en: 'All communication is end-to-end encrypted with TLS 1.3 and stored with AES-256. For Enterprise plans, on-premise deployment is available so data never leaves your private infrastructure.',
    },
  },
  {
    q: {
      id: 'Berapa lama masa uji coba gratis dan apa saja yang didapat?',
      en: 'How long is the free trial and what is included?',
    },
    a: {
      id: 'Trial gratis berlaku 14 hari dengan akses penuh fitur paket Pro: 200 perangkat, 16 feed CCTV AI, dan analitik lengkap. Tidak memerlukan kartu kredit untuk memulai.',
      en: 'The free trial lasts 14 days with full access to Pro features: 200 devices, 16 AI CCTV feeds, and complete analytics. No credit card required to start.',
    },
  },
  {
    q: {
      id: 'Apakah Videalink bisa berjalan saat internet terputus?',
      en: 'Can Videalink operate when internet connection is lost?',
    },
    a: {
      id: 'Ya. Arsitektur edge computing kami memastikan otomasi lokal, perekaman CCTV, dan logika alarm tetap berjalan penuh saat koneksi cloud terputus, lalu tersinkron otomatis saat kembali online.',
      en: 'Yes. Our edge computing architecture ensures local automation, CCTV recording, and alarm logic stay fully operational during outages, synchronizing automatically once reconnected.',
    },
  },
];

export default function FAQSection({ lang = 'id', activeTheme }) {
  const [openIndex, setOpenIndex] = useState(0);
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

  const primaryColor = activeTheme?.primary || '#06b6d4';
  const glowColor = activeTheme?.glow || 'rgba(6, 182, 212, 0.4)';

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative py-24 md:py-32 px-6 bg-black z-10"
      style={{ scrollMarginTop: '100px' }}
    >
      <div className="max-w-[860px] mx-auto relative z-20">
        {/* Section Header */}
        <div
          className="text-center mb-12 md:mb-16 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(25px)',
          }}
        >
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-4 border"
            style={{
              backgroundColor: activeTheme?.primary ? `${activeTheme.primary}1A` : 'rgba(255, 255, 255, 0.05)',
              borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.1)',
              color: activeTheme?.primary || '#38bdf8',
            }}
          >
            FAQ
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {lang === 'id' ? 'Pertanyaan Yang Sering Diajukan' : 'Frequently Asked Questions'}
          </h2>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border overflow-hidden backdrop-blur-xl"
                style={{
                  backgroundColor: isOpen ? 'rgba(15, 23, 42, 0.75)' : 'rgba(11, 17, 32, 0.5)',
                  borderColor: isOpen ? `${primaryColor}66` : 'rgba(56, 189, 248, 0.12)',
                  boxShadow: isOpen ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${glowColor.replace('0.45', '0.1')}` : 'none',
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0) scale(1)' : 'translateY(35px) scale(0.97)',
                  transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease`,
                }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors"
                >
                  <span className="text-base sm:text-lg font-bold text-white leading-snug">
                    {faq.q[lang] || faq.q.id}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
                    style={{
                      backgroundColor: isOpen ? `${primaryColor}22` : 'rgba(255, 255, 255, 0.05)',
                      color: isOpen ? primaryColor : '#94a3b8',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    <Plus size={18} />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-1 border-t border-white/5 animate-fade-in">
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                      {faq.a[lang] || faq.a.id}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
