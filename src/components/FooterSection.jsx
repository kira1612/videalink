import React from 'react';
import { Link } from 'react-router-dom';
import { getSilkPaletteTokens } from './SilkWaveBackground';

export default function FooterSection({ lang = 'id', activeTheme }) {
  const isId = lang === 'id';
  const primaryColor = activeTheme?.primary || '#06b6d4';
  const silk = getSilkPaletteTokens(primaryColor);
  const year = new Date().getFullYear();

  const links = {
    platform: [
      { name: isId ? 'Ringkasan' : 'Overview', href: '#overview' },
      { name: isId ? 'Ruangan 3D & Fitur' : '3D Rooms & Features', href: '#features' },
      { name: isId ? 'Paket & Kuota' : 'Pricing & Quotas', href: '#pricing' },
      { name: isId ? 'Konektivitas MQTT/HTTP' : 'MQTT/HTTP Connectivity', href: '#connectivity' },
    ],
    solutions: [
      { name: 'Smart Home & 3D Room', href: '#industri' },
      { name: isId ? 'Gedung Komersial' : 'Commercial Building', href: '#industri' },
      { name: isId ? 'Industri & Manufaktur' : 'Manufacturing', href: '#industri' },
      { name: 'Smart City', href: '#industri' },
    ],
    company: [
      { name: 'FAQ', href: '#faq', isHash: true },
      { name: isId ? 'Masuk ke Dashboard' : 'Sign In to Dashboard', href: '/login', isHash: false },
      { name: isId ? 'Daftar Akun Gratis' : 'Register Free Account', href: '/login?mode=register', isHash: false },
      { name: isId ? 'Panduan & Kode ESP32' : 'ESP32 Firmware Guide', href: '/login', isHash: false },
    ],
  };

  return (
    <footer
      className="relative z-10 border-t border-white/[0.08] backdrop-blur-2xl pt-20 pb-10 px-6 overflow-hidden"
      style={{
        background: silk.footerSurface,
      }}
    >
      <div className="max-w-[1200px] mx-auto relative z-10">
        {/* Top Architectural Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16">
          {/* Brand Summary & Quiet Status */}
          <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-12">
            <a href="#overview" className="flex items-center gap-2.5 mb-4 select-none group">
              <img
                src="/new_videa_link_icon.png"
                alt="Videa Link"
                className="w-6 h-6 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="text-base font-medium tracking-[-0.02em] text-white">
                Videa Link
              </span>
            </a>

            <p
              className="text-white/55 text-sm leading-relaxed max-w-sm mb-6 font-normal"
              style={{ textWrap: 'pretty' }}
            >
              {isId
                ? 'Platform manajemen perangkat IoT, Data Bucket Auto-Discovery, Rule Automations, Endpoints Webhook, serta Editor Denah Ruangan 3D interaktif.'
                : 'IoT device management platform featuring Auto-Discovery Data Buckets, Rule Engine Automations, Webhook Endpoints, and an interactive 3D Room Editor.'}
            </p>

            <div className="inline-flex items-center gap-2 text-xs text-white/65">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>{isId ? 'Semua layanan MQTT & REST beroperasi normal' : 'All MQTT & REST services operational'}</span>
            </div>
          </div>

          {/* Nav Columns */}
          <div className="lg:col-span-2">
            <h5 className="text-xs font-medium text-white/45 mb-4">Platform</h5>
            <ul className="space-y-3">
              {links.platform.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="text-sm text-white/75 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h5 className="text-xs font-medium text-white/45 mb-4">
              {isId ? 'Solusi' : 'Solutions'}
            </h5>
            <ul className="space-y-3">
              {links.solutions.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="text-sm text-white/75 hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h5 className="text-xs font-medium text-white/45 mb-4">
              {isId ? 'Akses & Panduan' : 'Access & Guides'}
            </h5>
            <ul className="space-y-3">
              {links.company.map((item, idx) => (
                <li key={idx}>
                  {item.isHash ? (
                    <a
                      href={item.href}
                      className="text-sm text-white/75 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="text-sm text-white/75 hover:text-white transition-colors duration-200"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── ANTIGRAVITY SIGNATURE OVERSIZED EDITORIAL WORDMARK ── */}
        <div className="py-6 sm:py-10 border-t border-white/[0.08] overflow-hidden select-none text-center">
          <div
            className="font-medium tracking-[-0.055em] leading-[0.88] text-transparent bg-clip-text whitespace-nowrap"
            style={{
              fontSize: 'clamp(3.6rem, 15.2vw, 13.5rem)',
              backgroundImage:
                'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 58%, rgba(255,255,255,0.12) 100%)',
            }}
            aria-hidden="true"
          >
            Videa Link
          </div>
        </div>

        {/* Minimalist Bottom Legal Bar */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <div>© {year} Videa Link. {isId ? 'Seluruh hak cipta dilindungi.' : 'All rights reserved.'}</div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white/85 transition-colors duration-200">
              {isId ? 'Kebijakan Privasi' : 'Privacy Policy'}
            </Link>
            <Link to="/login" className="hover:text-white/85 transition-colors duration-200">
              {isId ? 'Syarat Penggunaan' : 'Terms of Service'}
            </Link>
            <span className="font-mono text-[11px] text-white/55">
              MQTT · REST · 3D Room
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
