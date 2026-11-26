import './IoTAnimation.css';
import { getSilkPaletteTokens } from './SilkWaveBackground';

const dict = {
  id: {
    lamp: 'Smart Switch',
    lampSub: 'MQTT · QoS 1',
    cctv: 'Ruangan 3D',
    cctvSub: 'Floor Plan',
    sensor: 'Sensor Suhu',
    sensorSub: '24.5 °C',
    speaker: 'Data Bucket',
    speakerSub: 'Time-Series',
    thermo: 'Thermostat',
    thermoSub: 'Target 22 °C',
    app: 'Automations',
    appSub: 'IF / THEN',
    footerStart: 'Sinkronisasi telemetri & perintah ',
    footerEnd: ' dua arah',
  },
  en: {
    lamp: 'Smart Switch',
    lampSub: 'MQTT · QoS 1',
    cctv: '3D Room',
    cctvSub: 'Floor Plan',
    sensor: 'Temp Sensor',
    sensorSub: '24.5 °C',
    speaker: 'Data Bucket',
    speakerSub: 'Time-Series',
    thermo: 'Thermostat',
    thermoSub: 'Target 22 °C',
    app: 'Automations',
    appSub: 'IF / THEN',
    footerStart: 'Bi-directional ',
    footerEnd: ' telemetry & control',
  },
};

export default function IoTAnimation({ lang = 'id', activeTheme }) {
  const t = dict[lang] || dict.id;
  const primaryColor = activeTheme?.primary || '#0075ff';
  const silk = getSilkPaletteTokens(primaryColor);
  const leftColor = silk.left;
  const midColor = silk.mid;

  const paths = {
    p1: 'M 230 102 C 314 102, 336 230, 410 250',
    p2: 'M 590 102 C 506 102, 484 230, 410 250',
    p3: 'M 192 250 C 275 250, 330 250, 410 250',
    p4: 'M 628 250 C 545 250, 490 250, 410 250',
    p5: 'M 230 398 C 314 398, 336 270, 410 250',
    p6: 'M 590 398 C 506 398, 484 270, 410 250',
  };

  return (
    <div className="stage w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 820 540"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible select-none"
      >
        <defs>
          <pattern id="iot-dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill="rgba(255, 255, 255, 0.07)" />
          </pattern>

          <radialGradient id="iot-hub-aura" cx="50%" cy="46%" r="36%">
            <stop offset="0%" stopColor={midColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor="#050814" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="iot-line-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor={midColor} stopOpacity="0.55" />
          </linearGradient>

          <linearGradient id="iot-line-right" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor={midColor} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Subtle Architectural Dot Grid & Restrained Center Aura */}
        <rect x="0" y="0" width="820" height="540" fill="url(#iot-dot-grid)" />
        <ellipse cx="410" cy="250" rx="260" ry="180" fill="url(#iot-hub-aura)" />

        {/* Connection Curves (Crisp 1.4px architectural hairlines) */}
        <g className="link" fill="none" strokeWidth="1.4">
          <path id="p1" d={paths.p1} stroke="url(#iot-line-left)" />
          <path id="p2" d={paths.p2} stroke="url(#iot-line-right)" />
          <path id="p3" d={paths.p3} stroke="url(#iot-line-left)" />
          <path id="p4" d={paths.p4} stroke="url(#iot-line-right)" />
          <path id="p5" d={paths.p5} stroke="url(#iot-line-left)" />
          <path id="p6" d={paths.p6} stroke="url(#iot-line-right)" />
        </g>

        {/* Traveling Data Packets */}
        {[
          { d: paths.p1, dur: '2.6s', delay: '0s' },
          { d: paths.p2, dur: '2.9s', delay: '0.5s' },
          { d: paths.p3, dur: '2.2s', delay: '0.9s' },
          { d: paths.p4, dur: '2.5s', delay: '1.2s' },
          { d: paths.p5, dur: '3.0s', delay: '0.3s' },
          { d: paths.p6, dur: '2.4s', delay: '1.5s' },
        ].map((p, idx) => (
          <circle
            key={idx}
            className="pulse"
            r="3"
            style={{
              fill: leftColor,
              offsetPath: `path('${p.d}')`,
              animationDuration: p.dur,
              animationDelay: p.delay,
            }}
          />
        ))}

        {/* Central Hub */}
        <g className="hub-group">
          <circle cx="410" cy="250" r="64" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
          <circle
            cx="410"
            cy="250"
            r="52"
            fill="rgba(10, 15, 28, 0.6)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />

          <circle
            className="hub-ring"
            cx="410"
            cy="250"
            r="44"
            style={{
              stroke: midColor,
              animation: 'ring-pulse 2.8s ease-out infinite',
            }}
          />

          <circle
            className="hub-core"
            cx="410"
            cy="250"
            r="41"
            style={{
              fill: '#080c17',
              stroke: midColor,
              strokeWidth: 1.6,
            }}
          />

          <g transform="translate(410, 250)">
            <image
              href="/new_videa_link_icon.png"
              x="-20"
              y="-20"
              width="40"
              height="40"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </g>

        <text
          x="410"
          y="340"
          textAnchor="middle"
          className="font-mono"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            fill: 'rgba(255, 255, 255, 0.78)',
          }}
        >
          VIDEA LINK <tspan style={{ fill: leftColor }}>HUB</tspan>
        </text>

        {/* 6 Node Cards (Matte operational cards, crisp 1px border, tabular metrics) */}
        {[
          {
            x: 110, y: 58, cx: 170, ax: 230, ay: 102,
            title: t.lamp, sub: t.lampSub,
            icon: (
              <g transform="translate(170, 82)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M -5 4 C -7 2 -8.5 -0.5 -8.5 -3.5 A 8.5 8.5 0 0 1 8.5 -3.5 C 8.5 -0.5 7 2 5 4 L 4 7 L -4 7 Z" />
                <line x1="-3" y1="10" x2="3" y2="10" />
              </g>
            ),
          },
          {
            x: 590, y: 58, cx: 650, ax: 590, ay: 102,
            title: t.cctv, sub: t.cctvSub,
            icon: (
              <g transform="translate(650, 83)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="0,-10 9.5,-5 9.5,5 0,10 -9.5,5 -9.5,-5" />
                <polyline points="-9.5,-5 0,0 9.5,-5" />
                <line x1="0" y1="0" x2="0" y2="10" />
              </g>
            ),
          },
          {
            x: 72, y: 206, cx: 132, ax: 192, ay: 250,
            title: t.sensor, sub: t.sensorSub,
            icon: (
              <g transform="translate(132, 231)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M -2.8 -7.5 a 2.8 2.8 0 0 1 5.6 0 v 9 a 4.8 4.8 0 1 1 -5.6 0 Z" />
                <circle cx="0" cy="5" r="1.8" fill={leftColor} stroke="none" />
                <line x1="0" y1="-2.5" x2="0" y2="3.5" />
              </g>
            ),
          },
          {
            x: 628, y: 206, cx: 688, ax: 628, ay: 250,
            title: t.speaker, sub: t.speakerSub,
            icon: (
              <g transform="translate(688, 231)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="0" cy="-6.5" rx="8.5" ry="3.2" />
                <path d="M -8.5 -6.5 v 13 c 0 1.8 3.8 3.2 8.5 3.2 s 8.5 -1.4 8.5 -3.2 v -13" />
                <path d="M -8.5 0 c 0 1.8 3.8 3.2 8.5 3.2 s 8.5 -1.4 8.5 -3.2" />
              </g>
            ),
          },
          {
            x: 110, y: 354, cx: 170, ax: 230, ay: 398,
            title: t.thermo, sub: t.thermoSub,
            icon: (
              <g transform="translate(170, 379)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="0" cy="0" r="9.5" />
                <line x1="0" y1="1" x2="4" y2="-4" />
                <circle cx="0" cy="1" r="1.5" fill={leftColor} stroke="none" />
              </g>
            ),
          },
          {
            x: 590, y: 354, cx: 650, ax: 590, ay: 398,
            title: t.app, sub: t.appSub,
            icon: (
              <g transform="translate(650, 379)" fill="none" stroke={leftColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1,-9.5 -7,1 0.5,1 -1,9.5 7,-1 -0.5,-1" />
              </g>
            ),
          },
        ].map((node, i) => (
          <g key={i}>
            <rect
              x={node.x}
              y={node.y}
              width="120"
              height="88"
              rx="14"
              fill="#0c1222"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
            {node.icon}
            <text x={node.cx} y={node.y + 56} textAnchor="middle" className="node-title font-sans">
              {node.title}
            </text>
            <text x={node.cx} y={node.y + 72} textAnchor="middle" className="node-sub font-mono">
              {node.sub}
            </text>
            <circle cx={node.ax} cy={node.ay} r="3" fill={leftColor} />
          </g>
        ))}

        {/* Bottom Status Pill */}
        <g transform="translate(410, 498)">
          <rect
            x="-170"
            y="-15"
            width="340"
            height="30"
            rx="15"
            fill="rgba(12, 18, 34, 0.9)"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
          <circle cx="-148" cy="0" r="3.2" fill="#10b981" />
          <text
            x="6"
            y="4"
            textAnchor="middle"
            className="font-sans"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              fill: 'rgba(255, 255, 255, 0.68)',
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
