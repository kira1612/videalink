import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity } from 'lucide-react';

export default function FooterSection({ lang = 'id', activeTheme }) {
  const isId = lang === 'id';
  const primaryColor = activeTheme?.primary || '#06b6d4';
  const year = new Date().getFullYear();

  const links = {
    platform: [
      { name: isId ? 'Ringkasan' : 'Overview', href: '#overview' },
      { name: isId ? 'Fitur Unggulan' : 'Features', href: '#features' },
      { name: isId ? 'Paket Harga' : 'Pricing', href: '#pricing' },
      { name: isId ? 'Live Telemetri' : 'Telemetry', href: '#features' },
    ],
    solutions: [
      { name: 'Smart City', href: '#industri' },
      { name: isId ? 'Gedung Komersial' : 'Commercial Building', href: '#industri' },
      { name: isId ? 'Industri & Manufaktur' : 'Manufacturing', href: '#industri' },
      { name: 'Smart Home', href: '#industri' },
    ],
    company: [
      { name: 'FAQ', href: '#faq' },
      { name: isId ? 'Dokumentasi API' : 'API Docs', href: '/login' },
      { name: isId ? 'Keamanan & Enkripsi' : 'Security & Trust', href: '#faq' },
      { name: isId ? 'Hubungi Tim' : 'Contact Us', href: '/login' },
    ],
  };

  return (
    <footer className="relative border-t border-white/10 bg-[#030712] pt-16 pb-12 px-6 overflow-hidden">
      {/* Background ambient light */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[260px] rounded-full blur-[120px] pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle, ${primaryColor}, transparent 70%)`,
        }}
      />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 pb-14 border-b border-white/10">
          {/* Brand Column (spans 2 on desktop) */}
          <div className="lg:col-span-2 flex flex-col items-start pr-0 lg:pr-8">
            <a href="#overview" className="flex items-center gap-3 group mb-4 select-none">
              <img
                src="/new_videa_link_logo.png"
                alt="Videa Link Logo"
                className="h-9 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] hover:scale-105 transition-transform"
              />
            </a>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
              {isId
                ? 'Pusat kendali IoT, smart building automation, dan sistem pengawasan video berbasis Vision AI untuk era kota pintar & industri 4.0.'
                : 'Centralized IoT control hub, smart building automation, and Vision AI-powered video surveillance for smart cities and Industry 4.0.'}
            </p>

            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span>{isId ? 'Semua Sistem Operasional (99.99%)' : 'All Systems Operational (99.99%)'}</span>
            </div>
          </div>

          {/* Nav Column 1: Platform */}
          <div>
            <h5 className="font-mono text-xs font-bold tracking-widest uppercase text-slate-300 mb-4">
              {isId ? 'Platform' : 'Platform'}
            </h5>
            <ul className="space-y-2.5">
              {links.platform.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                    onMouseEnter={(e) => { if (primaryColor) e.currentTarget.style.color = primaryColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav Column 2: Solusi */}
          <div>
            <h5 className="font-mono text-xs font-bold tracking-widest uppercase text-slate-300 mb-4">
              {isId ? 'Solusi' : 'Solutions'}
            </h5>
            <ul className="space-y-2.5">
              {links.solutions.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                    onMouseEnter={(e) => { if (primaryColor) e.currentTarget.style.color = primaryColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav Column 3: Perusahaan / Bantuan */}
          <div>
            <h5 className="font-mono text-xs font-bold tracking-widest uppercase text-slate-300 mb-4">
              {isId ? 'Perusahaan' : 'Company'}
            </h5>
            <ul className="space-y-2.5">
              {links.company.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                    onMouseEnter={(e) => { if (primaryColor) e.currentTarget.style.color = primaryColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © {year} VIDEALINK IOT SURVEILLANCE PLATFORM — ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              {isId ? 'Kebijakan Privasi' : 'Privacy Policy'}
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <Link to="/login" className="hover:text-slate-300 transition-colors">
              {isId ? 'Syarat Penggunaan' : 'Terms of Service'}
            </Link>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck size={14} style={{ color: primaryColor }} />
              <span>TLS 1.3 · AES-256</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
