import './IoTAnimation.css';
import { getSilkPaletteTokens } from './SilkWaveBackground';

const dict = {
  id: {
    lamp: 'Smart Switch',
    lampSub: 'STATUS: ON',
    cctv: 'Ruangan 3D',
    cctvSub: '3D Editor',
    sensor: 'Sensor Suhu',
    sensorSub: '24.5 °C',
    speaker: 'Data Bucket',
    speakerSub: 'Auto-Discovery',
    thermo: 'Thermostat',
    thermoSub: 'Target: 22 °C',
    app: 'Automations',
    appSub: 'Active Rules',
    footerStart: 'Setiap perangkat terhubung secara ',
    footerEnd: ' ke Videa Link',
  },
  en: {
    lamp: 'Smart Switch',
    lampSub: 'STATUS: ON',
    cctv: '3D Room',
    cctvSub: '3D Editor',
    sensor: 'Temp Sensor',
    sensorSub: '24.5 °C',
    speaker: 'Data Bucket',
    speakerSub: 'Auto-Discovery',
    thermo: 'Thermostat',
    thermoSub: 'Target: 22 °C',
    app: 'Automations',
    appSub: 'Active Rules',
    footerStart: 'Every device connects in ',
    footerEnd: ' to Videa Link',
  },
};

export default function IoTAnimation({ lang = 'id', activeTheme }) {
  const t = dict[lang] || dict.id;
  const primaryColor = activeTheme?.primary || '#0075ff';
  const silk = getSilkPaletteTokens(primaryColor);

  const leftColor = silk.left;
  const midColor = silk.mid;
  const rightColor = silk.right;

  const paths = {
    p1: 'M 226 102 C 306 102, 328 212, 410 242',
    p2: 'M 594 102 C 514 102, 492 212, 410 242',
    p3: 'M 192 248 C 275 248, 330 248, 410 248',
    p4: 'M 628 248 C 545 248, 490 248, 410 248',
    p5: 'M 226 394 C 306 394, 328 284, 410 254',
    p6: 'M 594 394 C 514 394, 492 284, 410 254',
  };

  return (
    <div className="stage w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 820 540"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible select-none"
      >
        <defs>
          {/* Fine Architectural Dot Matrix */}
          <pattern id="iot-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="rgba(148, 163, 184, 0.11)" />
          </pattern>

          {/* Deep Central Hub Bloom (Theme-Reactive) */}
          <radialGradient id="iot-hub-aura" cx="50%" cy="46%" r="38%">
            <stop offset="0%" stopColor={leftColor} stopOpacity="0.34" />
            <stop offset="35%" stopColor={midColor} stopOpacity="0.18" />
            <stop offset="72%" stopColor={rightColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor="#050914" stopOpacity="0" />
          </radialGradient>

          {/* Hub Ring Gradient (Theme-Reactive) */}
          <linearGradient id="iot-hub-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={leftColor} />
            <stop offset="50%" stopColor={midColor} />
            <stop offset="100%" stopColor={rightColor} />
          </linearGradient>

          {/* Left Connections (userSpaceOnUse so horizontal paths render cleanly) */}
          <linearGradient id="iot-line-left" gradientUnits="userSpaceOnUse" x1="185" y1="0" x2="410" y2="0">
            <stop offset="0%" stopColor={leftColor} stopOpacity="0.95" />
            <stop offset="65%" stopColor={midColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={rightColor} stopOpacity="0.72" />
          </linearGradient>

          {/* Right Connections */}
          <linearGradient id="iot-line-right" gradientUnits="userSpaceOnUse" x1="635" y1="0" x2="410" y2="0">
            <stop offset="0%" stopColor={leftColor} stopOpacity="0.95" />
            <stop offset="55%" stopColor={midColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={rightColor} stopOpacity="0.75" />
          </linearGradient>

          {/* Soft Neon Glow Filter (userSpaceOnUse so zero-height horizontal lines are never clipped) */}
          <filter id="iot-glow-line" filterUnits="userSpaceOnUse" x="0" y="0" width="820" height="540">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hub Outer Ring Glow */}
          <filter id="iot-hub-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node Card Shadow */}
          <filter id="iot-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#020617" floodOpacity="0.65" />
          </filter>
        </defs>

        {/* Background Dot Grid & Luminous Central Aura */}
        <rect x="0" y="0" width="820" height="540" fill="url(#iot-dot-grid)" />
        <ellipse cx="410" cy="248" rx="300" ry="205" fill="url(#iot-hub-aura)" />

        {/* Subtle PCB Circuit Traces Radiating Behind Main Lines */}
        <g stroke="rgba(148, 163, 184, 0.14)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Left PCB traces */}
          <polyline points="348,218 318,218 296,196 250,196" />
          <circle cx="247" cy="196" r="2.2" fill="rgba(148, 163, 184, 0.25)" stroke="none" />
          <polyline points="342,232 292,232 276,216 238,216" />
          <circle cx="235" cy="216" r="2" fill="rgba(148, 163, 184, 0.22)" stroke="none" />
          <polyline points="342,264 292,264 276,280 238,280" />
          <circle cx="235" cy="280" r="2" fill="rgba(148, 163, 184, 0.22)" stroke="none" />
          <polyline points="348,278 318,278 296,300 250,300" />
          <circle cx="247" cy="300" r="2.2" fill="rgba(148, 163, 184, 0.25)" stroke="none" />

          {/* Right PCB traces */}
          <polyline points="472,218 502,218 524,196 570,196" />
          <circle cx="573" cy="196" r="2.2" fill="rgba(148, 163, 184, 0.25)" stroke="none" />
          <polyline points="478,232 528,232 544,216 582,216" />
          <circle cx="585" cy="216" r="2" fill="rgba(148, 163, 184, 0.22)" stroke="none" />
          <polyline points="478,264 528,264 544,280 582,280" />
          <circle cx="585" cy="280" r="2" fill="rgba(148, 163, 184, 0.22)" stroke="none" />
          <polyline points="472,278 502,278 524,300 570,300" />
          <circle cx="573" cy="300" r="2.2" fill="rgba(148, 163, 184, 0.25)" stroke="none" />
        </g>

        {/* Glowing Connection Curves */}
        <g className="link" fill="none" strokeWidth="1.9" filter="url(#iot-glow-line)">
          <path id="p1" d={paths.p1} stroke="url(#iot-line-left)" />
          <path id="p2" d={paths.p2} stroke="url(#iot-line-right)" />
          <path id="p3" d={paths.p3} stroke="url(#iot-line-left)" />
          <path id="p4" d={paths.p4} stroke="url(#iot-line-right)" />
          <path id="p5" d={paths.p5} stroke="url(#iot-line-left)" />
          <path id="p6" d={paths.p6} stroke="url(#iot-line-right)" />
        </g>

        {/* Animated Luminous Data Pulses */}
        {[
          { d: paths.p1, dur: '2.5s', delay: '0s', color: leftColor },
          { d: paths.p2, dur: '2.8s', delay: '0.45s', color: rightColor },
          { d: paths.p3, dur: '2.2s', delay: '0.85s', color: leftColor },
          { d: paths.p4, dur: '2.4s', delay: '1.15s', color: midColor },
          { d: paths.p5, dur: '2.9s', delay: '0.3s', color: leftColor },
          { d: paths.p6, dur: '2.6s', delay: '1.45s', color: rightColor },
        ].map((p, idx) => (
          <circle
            key={idx}
            className="pulse"
            r="3.6"
            filter="url(#iot-glow-line)"
            style={{
              fill: p.color,
              offsetPath: `path('${p.d}')`,
              animationDuration: p.dur,
              animationDelay: p.delay,
            }}
          />
        ))}

        {/* Central Videa Link Hub */}
        <g className="hub-group">
          {/* Outer concentric technical rings */}
          <circle cx="410" cy="248" r="78" fill="none" stroke={silk.leftRgba(0.12)} strokeWidth="1" />
          <circle cx="410" cy="248" r="64" fill={silk.surfaceRgba(0.42)} stroke={silk.leftRgba(0.2)} strokeWidth="1" />

          {/* Expanding Radar Pulse Ring */}
          <circle
            className="hub-ring"
            cx="410"
            cy="248"
            r="46"
            style={{
              stroke: leftColor,
              animation: 'ring-pulse 2.8s ease-out infinite',
            }}
          />

          {/* Glowing Neon Core Ring */}
          <circle
            cx="410"
            cy="248"
            r="46"
            fill={silk.hubFill}
            stroke="url(#iot-hub-ring-grad)"
            strokeWidth="2.6"
            filter="url(#iot-hub-glow)"
          />

          {/* Crisp Inner Rim */}
          <circle
            cx="410"
            cy="248"
            r="41"
            fill="none"
            stroke={silk.leftRgba(0.28)}
            strokeWidth="0.8"
          />

          {/* Center Videa Link Icon */}
          <g transform="translate(410, 248)">
            <image
              href="/new_videa_link_icon.png"
              x="-21"
              y="-21"
              width="42"
              height="42"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </g>

        {/* Central Hub Title */}
        <text
          x="410"
          y="330"
          textAnchor="middle"
          className="font-sans"
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fill: 'rgba(255, 255, 255, 0.92)',
          }}
        >
          VIDEA LINK <tspan style={{ fill: leftColor }}>HUB</tspan>
        </text>

        {/* 6 Node Cards */}
        {[
          {
            x: 112, y: 56, cx: 169, ax: 226, ay: 102,
            dotColor: leftColor,
            title: t.lamp, sub: t.lampSub,
            icon: (
              <g transform="translate(169, 80)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M -5 4 C -7 2 -8.5 -0.5 -8.5 -3.5 A 8.5 8.5 0 0 1 8.5 -3.5 C 8.5 -0.5 7 2 5 4 L 4 7 L -4 7 Z" />
                <line x1="-3" y1="10" x2="3" y2="10" />
              </g>
            ),
          },
          {
            x: 594, y: 56, cx: 651, ax: 594, ay: 102,
            dotColor: midColor,
            title: t.cctv, sub: t.cctvSub,
            icon: (
              <g transform="translate(651, 80)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="0,-10 9.5,-5 9.5,5 0,10 -9.5,5 -9.5,-5" />
                <polyline points="-9.5,-5 0,0 9.5,-5" />
                <line x1="0" y1="0" x2="0" y2="10" />
              </g>
            ),
          },
          {
            x: 78, y: 202, cx: 135, ax: 192, ay: 248,
            dotColor: leftColor,
            title: t.sensor, sub: t.sensorSub,
            icon: (
              <g transform="translate(135, 226)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M -2.8 -7.5 a 2.8 2.8 0 0 1 5.6 0 v 9 a 4.8 4.8 0 1 1 -5.6 0 Z" />
                <circle cx="0" cy="5" r="1.8" fill={leftColor} stroke="none" />
                <line x1="0" y1="-2.5" x2="0" y2="3.5" />
              </g>
            ),
          },
          {
            x: 628, y: 202, cx: 685, ax: 628, ay: 248,
            dotColor: midColor,
            title: t.speaker, sub: t.speakerSub,
            icon: (
              <g transform="translate(685, 226)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="0" cy="-6.5" rx="8.5" ry="3.2" />
                <path d="M -8.5 -6.5 v 13 c 0 1.8 3.8 3.2 8.5 3.2 s 8.5 -1.4 8.5 -3.2 v -13" />
                <path d="M -8.5 0 c 0 1.8 3.8 3.2 8.5 3.2 s 8.5 -1.4 8.5 -3.2" />
              </g>
            ),
          },
          {
            x: 112, y: 348, cx: 169, ax: 226, ay: 394,
            dotColor: leftColor,
            title: t.thermo, sub: t.thermoSub,
            icon: (
              <g transform="translate(169, 372)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="0" cy="0" r="9.5" />
                <line x1="0" y1="1" x2="4.5" y2="-4.5" />
                <circle cx="0" cy="1" r="1.5" fill={leftColor} stroke="none" />
              </g>
            ),
          },
          {
            x: 594, y: 348, cx: 651, ax: 594, ay: 394,
            dotColor: midColor,
            title: t.app, sub: t.appSub,
            icon: (
              <g transform="translate(651, 372)" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1,-9.5 -7,1 0.5,1 -1,9.5 7,-1 -0.5,-1" />
              </g>
            ),
          },
        ].map((node, i) => (
          <g key={i} filter="url(#iot-node-shadow)">
            <rect
              x={node.x}
              y={node.y}
              width="114"
              height="90"
              rx="14"
              fill={silk.nodeFill}
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth="1"
            />
            {node.icon}
            <text x={node.cx} y={node.y + 58} textAnchor="middle" className="node-title font-sans">
              {node.title}
            </text>
            <text x={node.cx} y={node.y + 74} textAnchor="middle" className="node-sub font-sans">
              {node.sub}
            </text>
            {/* Glowing Connection Anchor Dot */}
            <circle cx={node.ax} cy={node.ay} r="6.5" fill={node.dotColor} opacity="0.24" />
            <circle cx={node.ax} cy={node.ay} r="3.4" fill={node.dotColor} filter="url(#iot-glow-line)" />
          </g>
        ))}

        {/* Bottom Status Pill */}
        <g transform="translate(410, 496)">
          <rect
            x="-192"
            y="-16"
            width="384"
            height="32"
            rx="16"
            fill={silk.surfaceRgba(0.92)}
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth="1"
          />
          <circle cx="-170" cy="0" r="3.5" fill="#10b981" filter="url(#iot-glow-line)" />
          <text
            x="6"
            y="4"
            textAnchor="middle"
            className="font-sans"
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              fill: 'rgba(203, 213, 225, 0.85)',
            }}
          >
            {t.footerStart}
            <tspan style={{ fill: leftColor, fontWeight: 600 }}>real-time</tspan>
            {t.footerEnd}
          </text>
        </g>
      </svg>
    </div>
  );
}
