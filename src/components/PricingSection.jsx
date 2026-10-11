import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function PricingSection({ lang = 'id', activeTheme }) {
  const [isYearly, setIsYearly] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const primaryColor = activeTheme?.primary || '#06b6d4';
  const glowColor = activeTheme?.glow || 'rgba(6, 182, 212, 0.4)';

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      tier: 'Smart Home',
      price: isYearly ? 'Rp 239K' : 'Rp 299K',
      period: lang === 'id' ? 'per bulan' : 'per month',
      popular: false,
      cta: lang === 'id' ? 'Pilih Starter' : 'Choose Starter',
      features: lang === 'id' ? [
        'Hingga 25 perangkat IoT',
        '4 feed kamera CCTV (720p)',
        'Retensi data telemetri 7 hari',
        'Notifikasi Telegram & mobile app',
      ] : [
        'Up to 25 IoT devices',
        '4 CCTV camera feeds (720p)',
        '7-day telemetry data retention',
        'Telegram & mobile app alerts',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      tier: 'Business Building',
      price: isYearly ? 'Rp 959K' : 'Rp 1.199K',
      period: lang === 'id' ? 'per bulan' : 'per month',
      popular: true,
      popLabel: lang === 'id' ? 'Paling Populer' : 'Most Popular',
      cta: lang === 'id' ? 'Pilih Pro' : 'Choose Pro',
      features: lang === 'id' ? [
        'Hingga 200 perangkat IoT',
        '16 feed kamera CCTV (1080p AI)',
        'Retensi data 30 hari',
        'Analisis Vision AI advanced',
        'Dukungan API & webhook',
      ] : [
        'Up to 200 IoT devices',
        '16 CCTV feeds (1080p AI)',
        '30-day telemetry retention',
        'Advanced Vision AI analytics',
        'API & webhook access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tier: 'Smart City',
      price: 'Custom',
      period: lang === 'id' ? 'hubungi tim sales' : 'contact sales team',
      popular: false,
      cta: lang === 'id' ? 'Hubungi Sales' : 'Contact Sales',
      features: lang === 'id' ? [
        'Perangkat & node tanpa batas',
        'Kamera CCTV unlimited (4K AI)',
        'On-premise / private cloud deploy',
        'Dedicated SLA 99.99%',
        'Custom AI model training',
      ] : [
        'Unlimited devices & nodes',
        'Unlimited CCTV feeds (4K AI)',
        'On-premise / private cloud deploy',
        'Dedicated 99.99% SLA',
        'Custom AI model training',
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative py-28 md:py-36 px-6 bg-black z-10"
      style={{ scrollMarginTop: '100px' }}
    >
      <div className="max-w-[1240px] mx-auto relative z-20">
        {/* Section Header */}
        <div
          className="text-center mb-12 md:mb-16 transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(30px)',
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
            {lang === 'id' ? 'PAKET HARGA' : 'PRICING PLANS'}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {lang === 'id' ? 'Harga Transparan, Skala Sesuai Kebutuhan' : 'Transparent Pricing, Scale As Needed'}
          </h2>

          {/* Billing Switch Toggle */}
          <div className="inline-flex items-center gap-3.5 mt-8 px-5 py-2.5 rounded-full bg-[#0B1120]/80 border border-white/10 backdrop-blur-md select-none">
            <span
              className={`text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                !isYearly ? 'text-white font-bold' : 'text-slate-400'
              }`}
              onClick={() => setIsYearly(false)}
            >
              {lang === 'id' ? 'Bulanan' : 'Monthly'}
            </span>

            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 p-0.5"
              style={{
                backgroundColor: isYearly ? primaryColor : '#1e293b',
              }}
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isYearly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>

            <span
              className={`text-xs font-mono tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 ${
                isYearly ? 'text-white font-bold' : 'text-slate-400'
              }`}
              onClick={() => setIsYearly(true)}
            >
              <span>{lang === 'id' ? 'Tahunan' : 'Yearly'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold tracking-widest">
                {lang === 'id' ? 'HEMAT 20%' : 'SAVE 20%'}
              </span>
            </span>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            return (
              <div
                key={plan.id}
                className={`relative rounded-[24px] p-8 sm:p-10 flex flex-col justify-between backdrop-blur-xl ${
                  plan.popular
                    ? 'border-2 scale-[1.02] lg:-translate-y-2'
                    : 'border hover:-translate-y-1'
                }`}
                style={{
                  backgroundColor: plan.popular
                    ? 'rgba(15, 23, 42, 0.85)'
                    : 'rgba(15, 23, 42, 0.55)',
                  borderColor: plan.popular
                    ? primaryColor
                    : 'rgba(56, 189, 248, 0.15)',
                  boxShadow: plan.popular
                    ? `0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px ${glowColor}`
                    : '0 15px 40px rgba(0, 0, 0, 0.5)',
                  opacity: inView ? 1 : 0,
                  transform: inView
                    ? (plan.popular ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)')
                    : 'translateY(50px) scale(0.92)',
                  transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 140}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 140}ms, box-shadow 0.4s ease, border-color 0.4s ease`,
                }}
              >
                {/* Popular Pill Badge */}
                {plan.popular && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase text-black shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {plan.popLabel}
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-2xl font-extrabold text-white">{plan.name}</h3>
                    <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                      {plan.tier}
                    </span>
                  </div>

                  <div className="my-6">
                    <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                      {plan.price}
                    </div>
                    <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
                      {plan.period}
                    </div>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3.5 pt-6 pb-8 border-t border-white/10">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                        <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action CTA */}
                <Link
                  to="/login"
                  className={`w-full py-3.5 rounded-full text-center text-sm font-bold tracking-tight transition-all duration-300 ${
                    plan.popular
                      ? 'text-black shadow-lg hover:brightness-110 active:scale-[0.98]'
                      : 'text-white border border-white/20 hover:border-white/50 hover:bg-white/5'
                  }`}
                  style={plan.popular ? {
                    backgroundColor: primaryColor,
                    boxShadow: `0 0 20px ${glowColor}`,
                  } : {}}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
