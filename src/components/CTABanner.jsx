import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

export default function CTABanner({ lang = 'id', activeTheme }) {
  const primaryColor = activeTheme?.primary || '#06b6d4';
  const silk = getSilkPaletteTokens(primaryColor);

  const content = {
    id: {
      index: '07 / Mulai Sekarang',
      title: 'Rasakan kendali IoT dan ruangan 3D generasi baru.',
      desc: 'Mulai gratis dengan paket Starter tanpa kartu kredit. Hubungkan ESP32 atau ESP8266 via MQTT/HTTP, kelola Data Bucket otomatis, dan rancang denah Ruangan 3D interaktif.',
      primary: 'Mulai Gratis',
      secondary: 'Masuk ke Dashboard',
    },
    en: {
      index: '07 / Get Started',
      title: 'Experience next-generation IoT and 3D room control.',
      desc: 'Start free with the Starter plan — no credit card required. Connect ESP32 or ESP8266 via MQTT/HTTP, manage Auto-Discovery Data Buckets, and design interactive 3D Rooms.',
      primary: 'Start Free',
      secondary: 'Sign In to Dashboard',
    },
  };

  const t = content[lang] || content.id;

  return (
    <section
      id="cta-banner"
      className="relative z-10 py-24 sm:py-32 px-6 bg-transparent border-t border-white/[0.08] overflow-hidden"
    >
      <div className="max-w-[1200px] mx-auto relative z-10">
        <div
          className="relative rounded-[32px] p-10 sm:p-16 md:p-24 text-center overflow-hidden backdrop-blur-2xl border border-white/[0.12]"
          style={{
            background: silk.cardSurface,
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 36px 90px -24px rgba(0, 0, 0, 0.85)',
          }}
        >
          {/* Quiet themed top hairline */}
          <div
            className="absolute top-0 left-12 right-12 h-px pointer-events-none opacity-65"
            style={{ background: silk.horizonLine }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <span className="font-mono text-xs tracking-[0.06em] text-white/45 mb-6">
              {t.index}
            </span>

            <h2
              className="text-3xl sm:text-5xl md:text-[3.5rem] font-normal tracking-[-0.04em] text-white mb-6 max-w-3xl leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              {t.title}
            </h2>

            <p
              className="text-white/65 text-base sm:text-lg max-w-2xl leading-relaxed mb-10 font-normal"
              style={{ textWrap: 'pretty' }}
            >
              {t.desc}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login?mode=register"
                className="group min-h-[48px] inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm tracking-[-0.01em] bg-white text-[#07090f] hover:bg-white/90 transition-[transform,background-color] duration-200 active:scale-[0.96] select-none"
              >
                <span>{t.primary}</span>
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </Link>

              <Link
                to="/login"
                className="min-h-[48px] inline-flex items-center px-8 py-3.5 rounded-full font-medium text-sm tracking-[-0.01em] text-white/90 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] transition-[transform,background-color,border-color,color] duration-200 active:scale-[0.96] select-none"
              >
                {t.secondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
