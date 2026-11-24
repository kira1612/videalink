import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Database, Box, Share2, Calendar, ArrowRight } from 'lucide-react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

const formatRupiah = (amount) => {
  if (!amount || amount <= 0) return 'Gratis';
  return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const primaryColor = activeTheme?.primary || '#06b6d4';
  const silk = getSilkPaletteTokens(primaryColor);
  const isId = lang !== 'en';

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      tier: isId ? 'Gratis' : 'Free',
      description: isId
        ? 'Untuk uji coba awal dan satu perangkat smart home.'
        : 'For initial testing and a single smart home device.',
      monthly: 0,
      yearly: 0,
      popular: false,
      cta: isId ? 'Mulai Gratis' : 'Start Free',
      specs: [
        { icon: Radio, label: isId ? 'Perangkat IoT' : 'IoT Devices', value: '1' },
        { icon: Database, label: isId ? 'Data Bucket' : 'Data Buckets', value: '1' },
        { icon: Box, label: isId ? 'Ruangan 3D' : '3D Rooms', value: isId ? 'Tidak Ada' : 'None', muted: true },
        { icon: Share2, label: 'Endpoint', value: '1' },
        { icon: Calendar, label: isId ? 'Retensi Data' : 'Retention', value: isId ? '7 Hari' : '7 Days' },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      tier: isId ? 'Pemula' : 'Maker',
      description: isId
        ? 'Untuk proyek maker, prototipe aktif, dan 1 ruangan 3D interaktif.'
        : 'For maker projects, active prototypes, and 1 interactive 3D room.',
      monthly: 30000,
      yearly: 288000,
      popular: false,
      cta: isId ? 'Pilih Basic' : 'Choose Basic',
      specs: [
        { icon: Radio, label: isId ? 'Perangkat IoT' : 'IoT Devices', value: '3' },
        { icon: Database, label: isId ? 'Data Bucket' : 'Data Buckets', value: '4' },
        { icon: Box, label: isId ? 'Ruangan 3D' : '3D Rooms', value: '1' },
        { icon: Share2, label: 'Endpoint', value: '2' },
        { icon: Calendar, label: isId ? 'Retensi Data' : 'Retention', value: isId ? '14 Hari' : '14 Days' },
      ],
    },
    {
      id: 'plus',
      name: 'Plus',
      tier: isId ? 'Hemat' : 'Best Value',
      description: isId
        ? 'Untuk smart home multi-ruangan dan proyek otomasi menengah.'
        : 'For multi-room smart homes and medium automation setups.',
      monthly: 70000,
      yearly: 672000,
      popular: false,
      cta: isId ? 'Pilih Plus' : 'Choose Plus',
      specs: [
        { icon: Radio, label: isId ? 'Perangkat IoT' : 'IoT Devices', value: '5' },
        { icon: Database, label: isId ? 'Data Bucket' : 'Data Buckets', value: '8' },
        { icon: Box, label: isId ? 'Ruangan 3D' : '3D Rooms', value: '3' },
        { icon: Share2, label: 'Endpoint', value: '5' },
        { icon: Calendar, label: isId ? 'Retensi Data' : 'Retention', value: isId ? '30 Hari' : '30 Days' },
      ],
    },
    {
      id: 'pro',
      name: 'Pro IoT',
      tier: isId ? 'Tim & Kantor' : 'Teams & Office',
      description: isId
        ? 'Untuk tim engineer, smart office, dan proyek produksi aktif.'
        : 'For engineering teams, smart offices, and active production fleets.',
      monthly: 149000,
      yearly: 1430000,
      popular: true,
      popLabel: isId ? 'Paling Populer' : 'Most Popular',
      cta: isId ? 'Pilih Pro IoT' : 'Choose Pro IoT',
      specs: [
        { icon: Radio, label: isId ? 'Perangkat IoT' : 'IoT Devices', value: '25' },
        { icon: Database, label: isId ? 'Data Bucket' : 'Data Buckets', value: '50' },
        { icon: Box, label: isId ? 'Ruangan 3D' : '3D Rooms', value: '15' },
        { icon: Share2, label: 'Endpoint', value: '25' },
        { icon: Calendar, label: isId ? 'Retensi Data' : 'Retention', value: isId ? '90 Hari' : '90 Days' },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tier: isId ? 'Skala Penuh' : 'Full Scale',
      description: isId
        ? 'Untuk deployment industrial, multi-gedung, dan armada besar.'
        : 'For industrial deployments, multi-building setups, and large fleets.',
      monthly: 499000,
      yearly: 4790000,
      popular: false,
      cta: isId ? 'Pilih Enterprise' : 'Choose Enterprise',
      specs: [
        { icon: Radio, label: isId ? 'Perangkat IoT' : 'IoT Devices', value: isId ? 'Tanpa Batas' : 'Unlimited' },
        { icon: Database, label: isId ? 'Data Bucket' : 'Data Buckets', value: isId ? 'Tanpa Batas' : 'Unlimited' },
        { icon: Box, label: isId ? 'Ruangan 3D' : '3D Rooms', value: isId ? 'Tanpa Batas' : 'Unlimited' },
        { icon: Share2, label: 'Endpoint', value: isId ? 'Tanpa Batas' : 'Unlimited' },
        { icon: Calendar, label: isId ? 'Retensi Data' : 'Retention', value: isId ? '365 Hari' : '365 Days' },
      ],
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative min-h-[100dvh] flex flex-col justify-center py-[clamp(64px,7.5vh,104px)] px-5 sm:px-6 bg-transparent border-t border-white/[0.08] z-10"
      style={{ scrollMarginTop: '72px' }}
    >
      <div className="w-full max-w-[1320px] mx-auto relative z-20">
        {/* Editorial Left-Right Header Row + Minimal Monochrome Billing Switch */}
        <div
          className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-[clamp(18px,3vh,40px)] transition-[opacity,transform] duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(25px)',
          }}
        >
          <div className="relative">
            <span className="block font-mono text-xs tracking-[0.06em] text-white/60 mb-2">
              05 / {isId ? 'Paket & Kuota' : 'Pricing & Quotas'}
            </span>
            <h2
              className="text-[clamp(1.65rem,min(3.4vw,4.5vh),2.85rem)] font-normal tracking-[-0.035em] text-white leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              {isId ? 'Pilih paket sesuai skala Anda.' : 'Transparent plans, built to scale.'}
            </h2>
            <p
              className="text-white/75 text-[clamp(13px,min(1.3vw,1.95vh),15.5px)] mt-2 max-w-xl leading-relaxed"
              style={{ textWrap: 'pretty' }}
            >
              {isId
                ? 'Mulai gratis dengan paket Starter, atau buka Editor Ruangan 3D mulai dari paket Basic Rp 30.000/bulan.'
                : 'Start free with Starter, or unlock the 3D Room Editor starting from Basic at Rp 30,000/month.'}
            </p>
          </div>

          {/* Minimal Monochrome Segmented Billing Switch */}
          <div
            className="inline-flex items-center p-1 rounded-full border border-white/[0.12] backdrop-blur-2xl select-none self-start lg:self-auto"
            style={{ background: silk.cardSurface }}
          >
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.96] cursor-pointer ${
                !isYearly ? 'bg-white text-[#07090f]' : 'text-white/70 hover:text-white'
              }`}
            >
              {isId ? 'Bulanan' : 'Monthly'}
            </button>
            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.96] cursor-pointer inline-flex items-center gap-2 ${
                isYearly ? 'bg-white text-[#07090f]' : 'text-white/70 hover:text-white'
              }`}
            >
              <span>{isId ? 'Tahunan' : 'Yearly'}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  isYearly ? 'bg-black/10 text-[#07090f]' : 'bg-white/10 text-white/85'
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* 5 Real VideaLink Architectural Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-stretch">
          {plans.map((plan, idx) => {
            const isFree = plan.monthly === 0;
            const amount = isYearly ? plan.yearly : plan.monthly;
            const priceLabel = isFree ? (isId ? 'Gratis' : 'Free') : formatRupiah(amount);
            const periodLabel = isFree
              ? isId ? 'selamanya · tanpa kartu kredit' : 'forever · no credit card'
              : isYearly
                ? isId ? 'per tahun · hemat 20%' : 'per year · save 20%'
                : isId ? 'per bulan' : 'per month';

            return (
              <div
                key={plan.id}
                className={`relative rounded-[22px] p-4 xl:p-5 flex flex-col justify-between backdrop-blur-2xl border transition-[border-color,transform] duration-300 ${
                  plan.popular
                    ? 'border-white/[0.28]'
                    : 'border-white/[0.11] hover:border-white/[0.22]'
                }`}
                style={{
                  background: plan.popular
                    ? `linear-gradient(165deg, ${silk.midRgba(0.16)} 0%, ${silk.surfaceRgba(0.76)} 46%, ${silk.deepRgba(0.88)} 100%)`
                    : silk.cardSurface,
                  boxShadow: plan.popular
                    ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.24), 0 28px 70px -20px rgba(0, 0, 0, 0.85)`
                    : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.11), 0 18px 46px -18px rgba(0, 0, 0, 0.72)',
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 70}ms, border-color 0.25s ease`,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-base xl:text-[17px] font-medium text-white tracking-[-0.02em]">{plan.name}</h3>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap ${
                        plan.popular
                          ? 'bg-white text-[#07090f] font-semibold'
                          : 'text-white/55'
                      }`}
                    >
                      {plan.popular ? (isId ? 'Populer' : 'Popular') : plan.tier}
                    </span>
                  </div>

                  <p
                    className="text-xs text-white/70 leading-relaxed min-h-[48px]"
                    style={{ textWrap: 'pretty' }}
                  >
                    {plan.description}
                  </p>

                  <div className="my-3.5 xl:my-4">
                    <div className="text-xl xl:text-[23px] font-medium text-white tracking-[-0.03em] tabular-nums">
                      {priceLabel}
                    </div>
                    <div className="font-mono text-[10px] text-white/60 mt-0.5">
                      {periodLabel}
                    </div>
                  </div>

                  {/* Clean Hairline Specs */}
                  <ul className="space-y-1.5 pt-3.5 pb-4 border-t border-white/[0.09]">
                    {plan.specs.map((spec) => {
                      const SpecIcon = spec.icon;
                      return (
                        <li
                          key={spec.label}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <span className="flex items-center gap-1.5 text-white/70">
                            <SpecIcon
                              size={13}
                              strokeWidth={1.6}
                              className="flex-shrink-0"
                              style={{ color: spec.muted ? 'rgba(255,255,255,0.32)' : silk.left }}
                            />
                            <span>{spec.label}</span>
                          </span>
                          <span
                            className={`font-medium tabular-nums ${
                              spec.muted ? 'text-white/40 font-normal' : 'text-white/95'
                            }`}
                          >
                            {spec.value}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Action CTA (Stark White on Popular, Minimal Hairline on Others) */}
                <Link
                  to="/login?mode=register"
                  className={`min-h-[38px] w-full py-2 rounded-full text-center text-xs font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color] duration-200 flex items-center justify-center gap-1.5 active:scale-[0.96] ${
                    plan.popular
                      ? 'bg-white text-[#07090f] hover:bg-white/90'
                      : 'text-white/90 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] hover:border-white/[0.28]'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
