import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { VideaLinkLogo } from '../components/VideaLinkLogo';

// Komponen pembungkus untuk efek animasi saat scroll (masuk & keluar)
const ScrollReveal = ({ children, delay = 0, direction = 'up' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Ketika elemen masuk layar, isVisible = true. Ketika keluar, isVisible = false.
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.15 } // 15% elemen terlihat sebelum trigger animasi
    );
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  // Menentukan arah animasi awal berdasarkan properti `direction`
  let translateClass = 'translate-y-12';
  if (direction === 'left') translateClass = '-translate-x-12';
  if (direction === 'right') translateClass = 'translate-x-12';
  if (direction === 'none') translateClass = 'scale-95';

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${translateClass}`
      }`}
      style={{ transitionDelay: `${delay}ms`, willChange: 'opacity, transform' }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-black min-h-screen text-neutral-400 font-sans selection:bg-neutral-800 selection:text-white">
      
      {/* ── NAVBAR (Ultra Minimalist) ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ${
        scrolled ? 'bg-black/70 backdrop-blur-2xl border-b border-white/[0.04] py-4' : 'bg-transparent py-8'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-70 transition-opacity duration-300">
            <VideaLinkLogo size={28} textSize={14} subSize={7} />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {['Beranda', 'Products', 'Services', 'Resources', 'Use Cases', 'Company', 'Pricing'].map((item) => (
              <a key={item} href={item === 'Beranda' ? '#' : `#${item.toLowerCase().replace(' ', '-')}`} className="text-[13px] font-medium text-neutral-400 hover:text-white transition-colors duration-300 tracking-wide">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden md:block text-[13px] font-medium text-neutral-400 hover:text-white transition-colors duration-300">
              Sign in
            </Link>
            <Link to="/login" className="text-[13px] font-semibold text-black bg-white hover:bg-neutral-200 px-5 py-2.5 rounded-full transition-colors duration-300">
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6 min-h-[90vh]">
        {/* Parallax Background Video */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" 
          style={{ transform: `translateY(${scrollY * 0.4}px)` }}
        >
          <video 
            src="/Membuat_bumi_berputar_202608281618.mp4"
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-[120%] object-cover object-center -mt-[10%]"
          />
        </div>
        {/* Dark gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black pointer-events-none" />
        
        <div 
          className="max-w-4xl relative z-10"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-300 uppercase">Videa Link OS 2.0</span>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-[88px] font-medium text-white leading-[1.05] tracking-tight mb-8">
              The standard for <br />
              <span className="text-neutral-500">connected devices.</span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-2xl text-neutral-400 leading-relaxed max-w-2xl mx-auto mb-12 font-light">
              A beautiful, powerful, and secure platform to build, deploy, and manage your entire IoT ecosystem at global scale.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium text-black bg-white hover:bg-neutral-200 px-8 py-4 rounded-full transition-all duration-300">
                Explore the Platform
              </Link>
              <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full transition-all duration-300">
                Read Documentation
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── VIDEO / ARCHITECTURE PREVIEW ── */}
      <section className="relative pb-32 px-6 overflow-hidden">
        <ScrollReveal direction="none">
          <div className="max-w-[1200px] mx-auto">
            <div 
              className="relative rounded-[24px] md:rounded-[40px] overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-2xl transition-transform duration-75 ease-out"
              style={{ transform: `translateY(${Math.max(-50, (scrollY - 300) * -0.1)}px)` }}
            >
              {/* Very subtle glow */}
              <div className="absolute inset-0 bg-cyan-500/5 mix-blend-screen pointer-events-none" />
              <video 
                src="/video.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-auto object-cover opacity-90"
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── PRODUCTS SECTION ── */}
      <section id="products" className="py-32 border-t border-white/5 bg-black overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <ScrollReveal>
            <div className="mb-20 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-6">
                Hardware and software. <br />
                <span className="text-neutral-600">Engineered together.</span>
              </h2>
              <p className="text-lg text-neutral-400 font-light">
                Discover our suite of enterprise-grade products designed to capture, process, and analyze your IoT data with unprecedented efficiency.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Videa Edge Controller',
                tag: 'HARDWARE',
                desc: 'Industrial grade edge computing device for real-time data aggregation and local processing before sending to the cloud.',
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              },
              {
                title: 'Videa Cloud Core',
                tag: 'PLATFORM',
                desc: 'Centralized device management, data routing, and state synchronization platform built on serverless architecture.',
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
              },
              {
                title: 'Videa Vision AI',
                tag: 'SOFTWARE',
                desc: 'Real-time video analytics and machine learning models for smart cameras and automated visual inspection.',
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12A10 10 0 0 0 15 21.54A10 10 0 0 1 15 2.46A10 10 0 0 0 2 12Z"></path></svg>
              }
            ].map((prod, i) => (
              <ScrollReveal key={i} delay={(i % 3) * 150}>
                <div className="group relative p-8 rounded-[24px] border border-white/5 bg-[#050505] hover:bg-[#0a0a0a] transition-all duration-500 overflow-hidden cursor-pointer">
                  {/* Subtle gradient hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all duration-500 mb-8">
                      {prod.icon}
                    </div>
                    <div className="text-[10px] font-bold tracking-widest text-neutral-500 mb-3">{prod.tag}</div>
                    <h3 className="text-xl font-medium text-white mb-4 group-hover:text-cyan-50 transition-colors">{prod.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed font-light">{prod.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID (Minimalist) ── */}
      <section id="services" className="py-32 border-t border-white/5 bg-[#050505] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <ScrollReveal>
            <div className="mb-20 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-6">
                Everything you need. <br />
                <span className="text-neutral-600">Nothing you don't.</span>
              </h2>
              <p className="text-lg text-neutral-400 font-light">
                We've engineered every component from the ground up to provide the fastest, most reliable IoT infrastructure available.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-x-12 gap-y-16">
            {[
              { title: 'Global Scale', desc: 'Deploy across multiple regions instantly. Our edge network ensures low latency worldwide.' },
              { title: 'End-to-End Security', desc: 'Military-grade encryption for data in transit and at rest. Zero-trust architecture by default.' },
              { title: 'Real-time Analytics', desc: 'Stream millions of events per second. Query and visualize data instantly.' },
              { title: 'Developer First', desc: 'Comprehensive REST APIs, WebSockets, and SDKs for every major language.' },
              { title: 'Device Management', desc: 'OTA updates, remote configuration, and automated fleet provisioning.' },
              { title: 'Reliability', desc: '99.99% uptime SLA. Built for mission-critical enterprise applications.' },
            ].map((feature, i) => (
              <ScrollReveal key={i} delay={(i % 3) * 150}>
                <div className="group">
                  <div className="w-px h-8 bg-neutral-800 mb-6 group-hover:bg-cyan-500 transition-colors duration-500" />
                  <h3 className="text-lg font-medium text-white mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed font-light">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD SHOWCASE ── */}
      <section className="py-32 bg-black overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/3 z-10">
            <ScrollReveal direction="left">
              <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-6">
                Total visibility.
              </h2>
              <p className="text-lg text-neutral-400 font-light mb-10 leading-relaxed">
                Command your entire fleet from a single, beautifully designed interface. Monitor health, analyze trends, and take action instantly.
              </p>
              <ul className="space-y-4">
                {['Live telemetry streaming', 'Customizable alerts & rules', 'Historical data export'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-neutral-300 font-light">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500"><path d="M20 6L9 17l-5-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
          
          <div className="lg:w-2/3 relative">
            <ScrollReveal direction="right" delay={200}>
              {/* The laptop & phone asset with parallax effect */}
              <div 
                style={{ transform: `translateY(${(scrollY - 1800) * -0.15}px)` }}
                className="transition-transform duration-100 ease-out"
              >
                <img 
                  src="/fd773b45-a646-400d-b3b4-f366f9a4d372.png" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </ScrollReveal>
            {/* Subtle light behind the laptop */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION ── */}
      <section id="pricing" className="py-32 border-t border-white/5 bg-[#050505] overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6">
          <ScrollReveal>
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-6">
                Simple pricing. <br />
                <span className="text-neutral-600">Scale as you grow.</span>
              </h2>
              <p className="text-lg text-neutral-400 font-light">
                Start for free and upgrade when you need more power and advanced features for your IoT fleet.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {/* Free Tier */}
            <ScrollReveal delay={0}>
              <div className="p-8 rounded-[32px] border border-white/5 bg-black hover:border-white/10 transition-colors flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">Free</h3>
                  <p className="text-neutral-500 text-sm h-10">For learning and personal projects.</p>
                </div>
                <div className="mb-8">
                  <span className="text-3xl font-medium text-white">Rp 0</span>
                  <span className="text-neutral-500 text-sm ml-1">/bln</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['2 perangkat', '1 Data Bucket'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full py-3.5 rounded-full text-center text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">Start Free</Link>
              </div>
            </ScrollReveal>

            {/* Student Tier */}
            <ScrollReveal delay={100}>
              <div className="p-8 rounded-[32px] border border-white/5 bg-black hover:border-white/10 transition-colors flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">Student</h3>
                  <p className="text-neutral-500 text-sm h-10">Khusus untuk pelajar dan akademik.</p>
                </div>
                <div className="mb-8">
                  <span className="text-3xl font-medium text-white">Rp 49k</span>
                  <span className="text-neutral-500 text-sm ml-1">/bln</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['2 perangkat', '100 pesan/bln', '3 Data Bucket'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full py-3.5 rounded-full text-center text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">Pilih Student</Link>
              </div>
            </ScrollReveal>

            {/* Developer Tier */}
            <ScrollReveal delay={200}>
              <div className="p-8 rounded-[32px] border border-white/5 bg-black hover:border-white/10 transition-colors flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">Developer</h3>
                  <p className="text-neutral-500 text-sm h-10">For small teams and growing apps.</p>
                </div>
                <div className="mb-8">
                  <span className="text-3xl font-medium text-white">Rp 299k</span>
                  <span className="text-neutral-500 text-sm ml-1">/bln</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['25 perangkat', '1.000 pesan/bln', '10 Data Bucket', 'Penyimpanan 30 hari'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full py-3.5 rounded-full text-center text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">Pilih Developer</Link>
              </div>
            </ScrollReveal>

            {/* Pro Tier (Most Popular) */}
            <ScrollReveal delay={300}>
              <div className="relative p-8 rounded-[32px] border border-cyan-500/30 bg-[#0a0a0a] flex flex-col h-full overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.05)]">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-medium text-white">Pro</h3>
                    <span className="px-2 py-1 text-[9px] uppercase tracking-wider font-bold text-cyan-400 bg-cyan-400/10 rounded-full">Popular</span>
                  </div>
                  <p className="text-neutral-500 text-sm h-10">For startups and professional use.</p>
                </div>
                <div className="mb-8">
                  <span className="text-3xl font-medium text-white">Rp 749k</span>
                  <span className="text-neutral-500 text-sm ml-1">/bln</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['1.000 perangkat', '5 Juta pesan/bln', 'Bucket Tanpa Batas', 'Penyimpanan 1 tahun', 'Dashboard kustom'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full py-3.5 rounded-full text-center text-sm font-medium text-black bg-white hover:bg-neutral-200 transition-colors">Get Pro</Link>
              </div>
            </ScrollReveal>

            {/* Enterprise Tier */}
            <ScrollReveal delay={400}>
              <div className="p-8 rounded-[32px] border border-white/5 bg-black hover:border-white/10 transition-colors flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-2">Enterprise</h3>
                  <p className="text-neutral-500 text-sm h-10">Custom scale for mission-critical.</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-medium text-white">Custom</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {['Perangkat tak terbatas', 'Pesan tak terbatas', 'VPC Peering', 'Penyimpanan selamanya', 'Garansi SLA 99.99%'].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600 mt-0.5 shrink-0"><path d="M20 6L9 17l-5-5"/></svg>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block w-full py-3.5 rounded-full text-center text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-colors">Contact Sales</Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Minimalist) ── */}
      <footer className="py-16 border-t border-white/5 bg-[#050505]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity">
            <VideaLinkLogo size={24} textSize={13} subSize={0} showText={false} />
            <span className="text-sm font-medium text-white tracking-wide">VIDEA LINK</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[13px] text-neutral-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          
          <div className="text-[12px] text-neutral-600">
            © 2026 Videa Link Inc.
          </div>
        </div>
      </footer>
      
    </div>
  );
}
