import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

const FAQS = [
  {
    q: {
      id: 'Perangkat keras & protokol apa saja yang didukung Videa Link?',
      en: 'Which hardware boards & protocols does Videa Link support?',
    },
    a: {
      id: 'Videa Link mendukung mikrokontroler populer seperti ESP32, ESP8266, Arduino (dengan modul WiFi/Ethernet), dan Raspberry Pi melalui protokol MQTT Broker bawaan maupun HTTP REST API berautentikasi Bearer Token.',
      en: 'Videa Link supports popular microcontrollers including ESP32, ESP8266, Arduino (with WiFi/Ethernet), and Raspberry Pi via our built-in MQTT Broker as well as Bearer-Token authenticated HTTP REST API.',
    },
  },
  {
    q: {
      id: 'Bagaimana cara kerja Editor Ruangan 3D & Mode Jelajah WASD?',
      en: 'How do the 3D Room Editor & WASD Walkthrough Mode work?',
    },
    a: {
      id: 'Anda dapat membangun denah ruangan 3D langsung di browser (mulai dari template kamar 10×10, L-Shape, atau Apartemen 2 Ruang), memasang tembok serta pintu tunggal/ganda, meletakkan perangkat IoT ke dalam ruangan 3D, mengontrol sakelar secara real-time, hingga berjalan menjelajahi ruangan dengan kontrol keyboard WASD.',
      en: 'You can design 3D room floor plans directly in your browser (using 10×10, L-Shape, or 2-Room Apartment templates), place walls and single/double doors, bind live IoT devices into 3D space, toggle switches in real time, and walk through your rooms using WASD keyboard controls.',
    },
  },
  {
    q: {
      id: 'Apa itu fitur Auto-Discovery pada Data Bucket?',
      en: 'What is Auto-Discovery in Data Buckets?',
    },
    a: {
      id: 'Saat perangkat ESP32/ESP8266 mengirim payload JSON telemetri (misalnya suhu, kelembapan, daya, rssi), backend Videa Link otomatis mengenali dan membuat kolom metrik tanpa perlu mendefinisikan skema database secara manual.',
      en: 'Whenever your ESP32/ESP8266 sends a telemetry JSON payload (e.g., temperature, humidity, power, rssi), Videa Link automatically discovers and indexes every metric field without manual database schema setup.',
    },
  },
  {
    q: {
      id: 'Bagaimana cara membuat otomasi dan notifikasi peringatan?',
      en: 'How do I create automations and alert notifications?',
    },
    a: {
      id: 'Melalui menu Automations & Endpoints, Anda dapat membuat aturan IF-THEN berdasarkan jadwal waktu atau ambang batas sensor (>, <, ==) untuk menyalakan perangkat otomatis, sekaligus meneruskan peringatan ke HTTP Webhook, Telegram, Email, Slack, atau topik MQTT.',
      en: 'Through Automations & Endpoints, you can configure IF-THEN rules triggered by schedules or sensor thresholds (>, <, ==) to control devices automatically and dispatch alerts to HTTP Webhooks, Telegram, Email, Slack, or MQTT topics.',
    },
  },
  {
    q: {
      id: 'Apakah tersedia paket gratis tanpa kartu kredit?',
      en: 'Is there a free plan available without a credit card?',
    },
    a: {
      id: 'Ya! Paket Starter gratis selamanya (1 Perangkat IoT, 1 Data Bucket, 1 Endpoint, retensi 7 hari) tanpa kartu kredit. Untuk membuka fitur Editor Ruangan 3D dan kuota lebih besar, Anda dapat beralih ke paket Basic (Rp 30.000/bln), Plus, Pro IoT, atau Enterprise kapan saja.',
      en: 'Yes! The Starter plan is free forever (1 IoT Device, 1 Data Bucket, 1 Endpoint, 7-day retention) with no credit card required. To unlock the 3D Room Editor and higher quotas, upgrade anytime to Basic (Rp 30,000/mo), Plus, Pro IoT, or Enterprise.',
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
  const silk = getSilkPaletteTokens(primaryColor);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative py-24 sm:py-32 px-6 bg-transparent border-t border-white/[0.08] z-10"
      style={{ scrollMarginTop: '88px' }}
    >
      <div className="max-w-[1200px] mx-auto relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left Sticky Editorial Heading */}
        <div
          className="lg:col-span-4 lg:sticky lg:top-28 transition-[opacity,transform] duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <span className="block font-mono text-xs tracking-[0.06em] text-white/45 mb-4">
            06 / FAQ
          </span>
          <h2
            className="text-3xl sm:text-4xl font-normal tracking-[-0.035em] text-white leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            {lang === 'id' ? 'Pertanyaan yang sering diajukan.' : 'Frequently asked questions.'}
          </h2>
          <p
            className="mt-4 text-sm text-white/60 leading-relaxed"
            style={{ textWrap: 'pretty' }}
          >
            {lang === 'id'
              ? 'Detail teknis singkat tentang perangkat keras, Editor Ruangan 3D, Data Bucket, dan paket kuota.'
              : 'Quick technical details covering hardware support, 3D Room Editor, Data Buckets, and plans.'}
          </p>
        </div>

        {/* Right Architectural Hairline Accordion Panel */}
        <div
          className="lg:col-span-8 rounded-[24px] border border-white/[0.11] backdrop-blur-2xl px-6 sm:px-8 divide-y divide-white/[0.09]"
          style={{
            background: silk.cardSurface,
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12), 0 24px 60px -20px rgba(0, 0, 0, 0.78)',
          }}
        >
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx}>
                <button
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full text-left py-6 flex items-center justify-between gap-4 cursor-pointer select-none group"
                >
                  <span
                    className={`text-base sm:text-[17px] font-medium tracking-[-0.015em] leading-snug transition-colors duration-200 ${
                      isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'
                    }`}
                    style={{ textWrap: 'balance' }}
                  >
                    {faq.q[lang] || faq.q.id}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/[0.12] text-white/70 group-hover:text-white transition-[transform,color,border-color] duration-200"
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      borderColor: isOpen ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Plus size={15} />
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-6 pr-8 animate-fade-in">
                    <p
                      className="text-sm sm:text-[15px] text-white/65 leading-relaxed font-normal"
                      style={{ textWrap: 'pretty' }}
                    >
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
