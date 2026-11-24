import React, { useEffect, useRef, useState } from 'react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

// Crisp monochrome brand & hardware SVG marks for the IoT ecosystem
const ArduinoLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.6 10.6c-3.1 0-5.6 2.4-5.6 5.4s2.5 5.4 5.6 5.4c2.8 0 4.6-2 6.4-5.4 1.8-3.4 3.6-5.4 6.4-5.4 3.1 0 5.6 2.4 5.6 5.4s-2.5 5.4-5.6 5.4c-2.8 0-4.6-2-6.4-5.4-1.8-3.4-3.6-5.4-6.4-5.4Z" />
    <path d="M7.6 16h3.6" />
    <path d="M20.8 16h3.6" />
    <path d="M22.6 14.2v3.6" />
  </svg>
);

const Esp32Logo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="7" width="18" height="18" rx="3" />
    <path d="M11 4v3M16 4v3M21 4v3M11 25v3M16 25v3M21 25v3M4 11h3M4 16h3M4 21h3M25 11h3M25 16h3M25 21h3" />
    <text
      x="16"
      y="15.2"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize="5.4"
      fontWeight="700"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      letterSpacing="0.3"
    >
      ESP
    </text>
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize="5.4"
      fontWeight="700"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      letterSpacing="0.4"
    >
      32
    </text>
  </svg>
);

const EspressifLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="11.5" />
    <circle cx="11.5" cy="20.5" r="1.7" fill="currentColor" stroke="none" />
    <path d="M11.5 15.2a5.3 5.3 0 0 1 5.3 5.3" />
    <path d="M11.5 11a9.5 9.5 0 0 1 9.5 9.5" />
    <path d="M11.5 7.2a13.2 13.2 0 0 1 13.2 13.2" opacity="0.65" />
  </svg>
);

const Esp8266Logo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* ESP-12F PCB silhouette with iconic meander Wi-Fi antenna */}
    <rect x="7" y="4.5" width="18" height="23" rx="2.2" />
    <path d="M10.5 11V7.8h2.6V11h2.8V7.8h2.8V11h2.8V7.8" strokeWidth="1.4" />
    <rect x="10.2" y="14" width="11.6" height="10" rx="1.4" />
    <text
      x="16"
      y="20.6"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize="4.7"
      fontWeight="700"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
    >
      8266
    </text>
  </svg>
);

const RaspberryPiLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    {/* Twin leaves */}
    <path d="M16 9.5c-1.8-3.3-5.6-4-7.2-2.4-1.2 1.2-.2 3.6 3.1 3.7 1.6.1 3-.4 4.1-1.3Z" />
    <path d="M16 9.5c1.8-3.3 5.6-4 7.2-2.4 1.2 1.2.2 3.6-3.1 3.7-1.6.1-3-.4-4.1-1.3Z" />
    {/* Faceted raspberry body */}
    <path d="M16 10.2c4.7 0 8.2 3.3 8.2 7.8 0 4.9-3.6 9.2-8.2 9.2s-8.2-4.3-8.2-9.2c0-4.5 3.5-7.8 8.2-7.8Z" />
    <circle cx="16" cy="17.8" r="2.7" />
    <path d="M12.6 13.8a2.3 2.3 0 0 0 1.4 2.2M19.4 13.8a2.3 2.3 0 0 1-1.4 2.2M11 19.6a2.3 2.3 0 0 0 2.5.4M21 19.6a2.3 2.3 0 0 1-2.5.4M14 23.4a2.4 2.4 0 0 1 4 0" />
  </svg>
);

const MqttLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="22" height="22" rx="4.5" strokeWidth="1.4" opacity="0.55" />
    <circle cx="10.2" cy="21.8" r="1.8" fill="currentColor" stroke="none" />
    <path d="M10.2 16.4a5.4 5.4 0 0 1 5.4 5.4" />
    <path d="M10.2 12a9.8 9.8 0 0 1 9.8 9.8" />
    <path d="M10.2 8.2a13.6 13.6 0 0 1 13.6 13.6" />
  </svg>
);

const RestApiLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 8.5c-2 0-2.8 1-2.8 2.8v2.2c0 1.4-.9 2.5-2.2 2.5 1.3 0 2.2 1.1 2.2 2.5v2.2c0 1.8.8 2.8 2.8 2.8" />
    <path d="M21 8.5c2 0 2.8 1 2.8 2.8v2.2c0 1.4.9 2.5 2.2 2.5-1.3 0-2.2 1.1-2.2 2.5v2.2c0 1.8-.8 2.8-2.8 2.8" />
    <circle cx="13.2" cy="16" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="18.8" cy="16" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const ThreeJsLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="7,6 26,11.5 12,26" />
    <polygon points="16.5,8.75 19,18.75 9.5,16" />
    <line x1="11.75" y1="7.4" x2="14.2" y2="17.3" />
    <line x1="14.2" y1="17.3" x2="22.5" y2="15.1" />
  </svg>
);

const PythonLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.8 6c-4.2 0-4 1.8-4 1.8v2.4h4.2v.8H10s-3.8-.4-3.8 4.8c0 5.2 3.3 5 3.3 5h2v-2.6s-.1-3.3 3.2-3.3h4.5s2.8 0 2.8-2.7V8.8S22.4 6 15.8 6Z" />
    <path d="M16.2 26c4.2 0 4-1.8 4-1.8v-2.4H16v-.8h6s3.8.4 3.8-4.8c0-5.2-3.3-5-3.3-5h-2v2.6s.1 3.3-3.2 3.3h-4.5s-2.8 0-2.8 2.7v3.4S9.6 26 16.2 26Z" />
    <circle cx="13.8" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="23.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const CppLogo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="16,4.5 26,10.2 26,21.8 16,27.5 6,21.8 6,10.2" />
    <path d="M15.6 13.4a3.6 3.6 0 1 0 0 5.2" strokeWidth="1.8" />
    <path d="M18.2 16h2.6M19.5 14.7v2.6M22.2 16h2.6M23.5 14.7v2.6" strokeWidth="1.4" />
  </svg>
);

const TelegramLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <path d="M26.8 6.4 4.9 14.9c-.9.3-.8 1.6.1 1.9l5.3 1.7 2 6c.3.8 1.3 1 1.9.4l3-3 5.5 4c.8.6 1.9.1 2.1-.9l3.3-17.2c.2-1-.8-1.8-1.3-1.4Z" />
    <path d="M10.3 18.5 24 9.5" />
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="13" y="6" width="3" height="8.5" rx="1.5" />
    <path d="M9.5 14.5a1.5 1.5 0 1 1 1.5-1.5v1.5H9.5Z" />
    <rect x="17.5" y="13" width="8.5" height="3" rx="1.5" />
    <path d="M17.5 9.5a1.5 1.5 0 1 1 1.5 1.5h-1.5V9.5Z" />
    <rect x="16" y="17.5" width="3" height="8.5" rx="1.5" />
    <path d="M22.5 17.5a1.5 1.5 0 1 1-1.5 1.5v-1.5h1.5Z" />
    <rect x="6" y="16" width="8.5" height="3" rx="1.5" />
    <path d="M14.5 22.5a1.5 1.5 0 1 1-1.5-1.5h1.5v1.5Z" />
  </svg>
);

const WebhookLogo = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.4 20.8A4.8 4.8 0 1 1 17.5 14l-3.6 6.2" />
    <path d="M12.2 21.5a4.8 4.8 0 1 1 4.2-8.4h7.1" />
    <path d="M15.8 11.2a4.8 4.8 0 1 1 6.7 6.3l-3.5-6.1" />
    <circle cx="16" cy="11.2" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="11.6" cy="20.6" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="21.4" cy="20.6" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const Stm32Logo = () => (
  <svg viewBox="0 0 32 32" className="w-8 h-8 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6.5" y="8" width="19" height="16" rx="2.6" />
    <path d="M10.5 5v3M16 5v3M21.5 5v3M10.5 24v3M16 24v3M21.5 24v3" />
    <text
      x="16"
      y="18"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize="5.4"
      fontWeight="700"
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      letterSpacing="0.2"
    >
      IoT
    </text>
  </svg>
);

const BASE_ITEMS = [
  { id: 'arduino', label: 'Arduino', Logo: ArduinoLogo },
  { id: 'esp32', label: 'ESP32', Logo: Esp32Logo },
  { id: 'espressif', label: 'Espressif', Logo: EspressifLogo },
  { id: 'esp8266', label: 'ESP8266 · NodeMCU', Logo: Esp8266Logo },
  { id: 'rpi', label: 'Raspberry Pi', Logo: RaspberryPiLogo },
  { id: 'mqtt', label: 'MQTT Broker', Logo: MqttLogo },
  { id: 'rest', label: 'HTTP REST JSON', Logo: RestApiLogo },
  { id: 'threejs', label: 'Three.js 3D Room', Logo: ThreeJsLogo },
  { id: 'python', label: 'MicroPython · Python', Logo: PythonLogo },
  { id: 'cpp', label: 'C++ Firmware', Logo: CppLogo },
  { id: 'webhook', label: 'HTTP Webhook', Logo: WebhookLogo },
  { id: 'telegram', label: 'Telegram Alerts', Logo: TelegramLogo },
  { id: 'slack', label: 'Slack Alerts', Logo: SlackLogo },
  { id: 'iot', label: 'Edge IoT Node', Logo: Stm32Logo },
];

// 22 bubbles (~2640px span) so even 2560px ultra-wide viewports stay seamlessly filled edge-to-edge
const WAVE_ITEMS = [
  ...BASE_ITEMS,
  ...BASE_ITEMS.slice(0, 8).map((item) => ({ ...item, id: `${item.id}-2` })),
];

export default function FloatingIconWave({ primaryColor = '#06b6d4' }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const hoveredRef = useRef(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const silk = getSilkPaletteTokens(primaryColor);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = null;
    let lastTime = performance.now();
    let offset = 0;
    let waveTime = 0;
    let speed = 28; // px/sec calm weightless drift

    const updateLayout = (now) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 220;
      const isSmall = width < 640 || height < 200;
      const bubbleSize = isSmall ? 76 : 96;
      const gap = isSmall ? 18 : 24;
      const step = bubbleSize + gap;
      const totalWidth = WAVE_ITEMS.length * step;
      const maxSafeAmp = Math.max(12, (height - bubbleSize - 44) * 0.45);
      const amplitude = Math.min(isSmall ? 24 : 36, maxSafeAmp);

      if (!prefersReduced) {
        const targetSpeed = hoveredRef.current ? 0 : 28;
        speed += (targetSpeed - speed) * 0.08;
        offset = (offset + speed * dt) % totalWidth;
        waveTime += dt * 0.55;
      }

      for (let i = 0; i < WAVE_ITEMS.length; i++) {
        const el = itemRefs.current[i];
        if (!el) continue;

        let x = (i * step - offset) % totalWidth;
        if (x < 0) x += totalWidth;
        x -= step;

        // Sinusoidal vertical arc anchored to screen horizontal position
        const centerX = x + bubbleSize * 0.5;
        const normX = centerX / Math.max(width, 1);
        const y = -Math.sin(normX * Math.PI * 1.95 - 0.15 + waveTime * 0.35) * amplitude;

        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }

      if (!prefersReduced) {
        animId = requestAnimationFrame(updateLayout);
      }
    };

    animId = requestAnimationFrame(updateLayout);

    const onResize = () => {
      if (prefersReduced) {
        updateLayout(performance.now());
      }
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[clamp(176px,29vh,252px)] overflow-hidden select-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
      }}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
        setHoveredIdx(null);
      }}
      aria-label="Videa Link IoT Hardware & Protocol Logos"
    >
      {WAVE_ITEMS.map((item, idx) => {
        const Logo = item.Logo;
        const isHovered = hoveredIdx === idx;
        return (
          <div
            key={item.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="absolute top-1/2 left-0 -mt-[38px] sm:-mt-[48px] [@media(max-height:700px)]:-mt-[38px] will-change-transform"
          >
            <div
              className="relative w-[76px] h-[76px] sm:w-[96px] sm:h-[96px] [@media(max-height:700px)]:w-[76px] [@media(max-height:700px)]:h-[76px] rounded-full flex items-center justify-center backdrop-blur-2xl border transition-[transform,border-color,box-shadow,background-color,color] duration-200 cursor-default"
              style={{
                background: isHovered ? silk.cardOpenSurface : silk.cardSurface,
                borderColor: isHovered ? `${silk.left}88` : 'rgba(255, 255, 255, 0.14)',
                color: isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.88)',
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                boxShadow: isHovered
                  ? `inset 0 1px 0 0 rgba(255, 255, 255, 0.24), 0 16px 36px -10px rgba(0, 0, 0, 0.8), 0 0 28px -8px ${silk.midRgba(0.55)}`
                  : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 14px 32px -14px rgba(0, 0, 0, 0.72)',
              }}
              title={item.label}
            >
              <Logo />

              {/* Clean floating label pill on hover */}
              <div
                className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full whitespace-nowrap font-mono text-[10px] tracking-wide text-white/90 border border-white/[0.14] backdrop-blur-xl transition-[opacity,transform] duration-200"
                style={{
                  background: silk.pillSurface,
                  opacity: isHovered ? 1 : 0,
                  transform: isHovered
                    ? 'translate(-50%, 0)'
                    : 'translate(-50%, -4px)',
                }}
              >
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
