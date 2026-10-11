import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTABanner({ lang = 'id', activeTheme }) {
  const isId = lang === 'id';
  const primaryColor = activeTheme?.primary || '#06b6d4';
  const glowColor = activeTheme?.glow || `${primaryColor}40`;

  const content = {
    id: {
      tag: '// AKTIVASI NODE',
      title: 'Siap Mentransformasi Infrastruktur IoT & Pengawasan Anda?',
      desc: 'Bergabung dengan 2.400+ perusahaan yang telah mempercayakan command center mereka kepada Videalink. Setup pertama hanya butuh 9 menit.',
      button: 'Mulai Uji Coba Gratis 14 Hari',
    },
    en: {
      tag: '// NODE ACTIVATION',
      title: 'Ready to Transform Your IoT & Surveillance Infrastructure?',
      desc: 'Join 2,400+ enterprises that trust Videalink for mission-critical command centers. Initial deployment takes just 9 minutes.',
      button: 'Start 14-Day Free Trial',
    },
  };

  const t = content[lang] || content.id;

  return (
    <section className="relative py-24 px-6 bg-black overflow-hidden">
      <div className="max-w-[1100px] mx-auto relative z-10">
        <div
          className="relative rounded-[32px] sm:rounded-[36px] p-8 sm:p-14 md:p-20 text-center overflow-hidden transition-all duration-500"
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: activeTheme?.primary ? `${activeTheme.primary}4d` : 'rgba(6, 182, 212, 0.3)',
            background: `radial-gradient(ellipse 80% 90% at 50% 120%, ${activeTheme?.primary ? `${activeTheme.primary}26` : 'rgba(6, 182, 212, 0.22)'}, rgba(11, 17, 32, 0.75) 70%)`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 50px ${glowColor}`,
          }}
        >
          {/* Cyber Blueprint Grid Background Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(${primaryColor}18 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}18 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse at 50% 100%, #000 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 100%, #000 30%, transparent 80%)',
            }}
          />

          {/* Ambient Glow Orbs */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${primaryColor}30, transparent 70%)`,
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            {/* Tag / Category Badge */}
            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 border"
              style={{
                backgroundColor: activeTheme?.primary ? `${activeTheme.primary}1A` : 'rgba(255, 255, 255, 0.05)',
                borderColor: activeTheme?.primary ? `${activeTheme.primary}4D` : 'rgba(255, 255, 255, 0.1)',
                color: activeTheme?.primary || '#38bdf8',
              }}
            >
              {t.tag.replace('// ', '')}
            </div>

            {/* Title with distinct futuristic font weight and style */}
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-[1.15]"
              style={{
                textShadow: `0 0 40px ${primaryColor}40`,
              }}
            >
              {t.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300/80 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-10 font-normal">
              {t.desc}
            </p>

            {/* CTA Button */}
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 rounded-full font-bold text-sm sm:text-base tracking-tight transition-all duration-300 hover:scale-105 active:scale-95 select-none"
              style={{
                backgroundColor: primaryColor,
                color: activeTheme?.mode === 'light' ? '#ffffff' : '#04121a',
                boxShadow: `0 0 35px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
              }}
            >
              <span>{t.button}</span>
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
