import './IoTAnimation.css';

// --- TRANSLATIONS DICTIONARY ---
const dict = {
  id: {
    lamp: 'Lampu Pintar',
    cctv: 'Kamera CCTV',
    sensor: 'Sensor Suhu',
    speaker: 'Speaker Pintar',
    thermo: 'Termostat',
    app: 'Aplikasi Kontrol',
    footerStart: 'Setiap perangkat mengirim data secara ',
    footerEnd: ' ke internet'
  },
  en: {
    lamp: 'Smart Lamp',
    cctv: 'CCTV Camera',
    sensor: 'Temp Sensor',
    speaker: 'Smart Speaker',
    thermo: 'Thermostat',
    app: 'Control App',
    footerStart: 'Each device streams data in ',
    footerEnd: ' to the internet'
  }
};

export default function IoTAnimation({ lang = 'id' }) {
  const t = dict[lang];
  return (
    <div className="stage w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 820 560" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">

        {/* background grid */}
        <g className="grid-line">
          <line x1="0" y1="140" x2="820" y2="140"></line>
          <line x1="0" y1="280" x2="820" y2="280"></line>
          <line x1="0" y1="420" x2="820" y2="420"></line>
          <line x1="137" y1="0" x2="137" y2="560"></line>
          <line x1="410" y1="0" x2="410" y2="560"></line>
          <line x1="683" y1="0" x2="683" y2="560"></line>
        </g>

        {/* connection paths (device -> hub center at 410,270) */}
        <g className="link">
          <path id="p1" d="M 130 90  C 260 90, 300 150, 410 270"></path>
          <path id="p2" d="M 690 90  C 560 90, 520 150, 410 270"></path>
          <path id="p3" d="M 90  270 C 220 270, 300 270, 410 270"></path>
          <path id="p4" d="M 730 270 C 600 270, 520 270, 410 270"></path>
          <path id="p5" d="M 130 450 C 260 450, 300 390, 410 270"></path>
          <path id="p6" d="M 690 450 C 560 450, 520 390, 410 270"></path>
        </g>

        {/* traveling pulses */}
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 130 90  C 260 90, 300 150, 410 270')", animationDuration: "2.4s", animationDelay: "0s" }}></circle>
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 690 90  C 560 90, 520 150, 410 270')", animationDuration: "2.9s", animationDelay: "0.4s" }}></circle>
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 90  270 C 220 270, 300 270, 410 270')", animationDuration: "2.1s", animationDelay: "0.8s" }}></circle>
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 730 270 C 600 270, 520 270, 410 270')", animationDuration: "2.6s", animationDelay: "1.1s" }}></circle>
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 130 450 C 260 450, 300 390, 410 270')", animationDuration: "3s", animationDelay: "0.2s" }}></circle>
        <circle className="pulse" r="4" style={{ offsetPath: "path('M 690 450 C 560 450, 520 390, 410 270')", animationDuration: "2.3s", animationDelay: "1.4s" }}></circle>

        {/* central hub */}
        <g className="hub-group">
          <circle className="hub-ring" cx="410" cy="270" r="46" style={{ animation: "ring-pulse 2.2s ease-out infinite", animationDelay: "0s" }}></circle>
          <circle className="hub-ring" cx="410" cy="270" r="46" style={{ animation: "ring-pulse 2.2s ease-out infinite", animationDelay: "1.1s" }}></circle>
          <circle className="hub-core" cx="410" cy="270" r="44"></circle>
          {/* Videa Link Logo */}
          <g transform="translate(410,270)">
            <image href="/videa_link_icon.png" x="-24" y="-24" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
          </g>
        </g>
        <text x="410" y="336" textAnchor="middle" className="caption font-sans">Internet <tspan className="caption-value">Gateway</tspan></text>

        {/* Device 1: Smart bulb (top-left) */}
        <g>
          <rect className="device-box connected" x="60" y="40" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(110,68)">
            <circle cx="0" cy="-2" r="9"></circle>
            <path d="M -4 6 h 8 M -3 10 h 6"></path>
          </g>
          <circle className="status-dot on" cx="146" cy="52" r="3.5"></circle>
          <text x="110" y="100" textAnchor="middle" className="device-label font-sans">{t.lamp}</text>
        </g>

        {/* Device 2: Camera (top-right) */}
        <g>
          <rect className="device-box connected" x="660" y="40" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(710,68)">
            <rect x="-11" y="-6" width="22" height="14" rx="3"></rect>
            <circle cx="0" cy="1" r="4.5"></circle>
            <path d="M -4 -6 l 2 -3 h 4 l 2 3"></path>
          </g>
          <circle className="status-dot on" cx="746" cy="52" r="3.5"></circle>
          <text x="710" y="100" textAnchor="middle" className="device-label font-sans">{t.cctv}</text>
        </g>

        {/* Device 3: Sensor (mid-left) */}
        <g>
          <rect className="device-box connected" x="20" y="234" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(70,262)">
            <path d="M -9 6 v -4 a 9 9 0 0 1 18 0 v 4"></path>
            <line x1="0" y1="2" x2="0" y2="8"></line>
            <circle cx="0" cy="8" r="1.6" fill="var(--text)" stroke="none"></circle>
          </g>
          <circle className="status-dot on" cx="106" cy="246" r="3.5"></circle>
          <text x="70" y="294" textAnchor="middle" className="device-label font-sans">{t.sensor}</text>
        </g>

        {/* Device 4: Speaker (mid-right) */}
        <g>
          <rect className="device-box connected" x="700" y="234" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(750,262)">
            <path d="M -6 -5 h -4 v 10 h 4 l 7 5 v -20 z"></path>
            <path d="M 6 -4 a 7 7 0 0 1 0 8"></path>
          </g>
          <circle className="status-dot on" cx="786" cy="246" r="3.5"></circle>
          <text x="750" y="294" textAnchor="middle" className="device-label font-sans">{t.speaker}</text>
        </g>

        {/* Device 5: Thermostat (bottom-left) */}
        <g>
          <rect className="device-box connected" x="60" y="400" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(110,428)">
            <circle cx="0" cy="0" r="10"></circle>
            <path d="M 0 -5 v 5 l 4 3"></path>
          </g>
          <circle className="status-dot on" cx="146" cy="412" r="3.5"></circle>
          <text x="110" y="460" textAnchor="middle" className="device-label font-sans">{t.thermo}</text>
        </g>

        {/* Device 6: Phone / App (bottom-right) */}
        <g>
          <rect className="device-box connected" x="660" y="400" width="100" height="72" rx="10"></rect>
          <g className="device-icon" transform="translate(710,428)">
            <rect x="-8" y="-12" width="16" height="24" rx="3"></rect>
            <line x1="-4" y1="8" x2="4" y2="8"></line>
          </g>
          <circle className="status-dot on" cx="746" cy="412" r="3.5"></circle>
          <text x="710" y="460" textAnchor="middle" className="device-label font-sans">{t.app}</text>
        </g>

        <text x="410" y="528" textAnchor="middle" className="caption font-sans" style={{ animation: "label-fade 2.4s ease-in-out infinite" }}>
          {t.footerStart}<tspan className="caption-value">real-time</tspan>{t.footerEnd}
        </text>
      </svg>
    </div>
  );
}
