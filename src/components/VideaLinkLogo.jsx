/**
 * VideaLinkLogo – SVG logo yang menyesuaikan dengan asset referensi
 */
export function VideaLinkLogo({ size = 40, showText = true, textSize = 18, subSize = 9 }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {/* ── SVG Icon ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background rounded square */}
        <rect width="100" height="100" rx="24" fill="#1b60b0" />
        
        {/* Main V lines */}
        <path 
          d="M28 42 L50 82 L72 42" 
          stroke="#e6f2ff" 
          strokeWidth="7" 
          strokeLinejoin="round" 
          strokeLinecap="round" 
        />
        
        {/* Vertical lines to top dots */}
        <line x1="28" y1="42" x2="28" y2="24" stroke="#488ce0" strokeWidth="4" />
        <line x1="72" y1="42" x2="72" y2="24" stroke="#488ce0" strokeWidth="4" />
        
        {/* Middle circles */}
        <circle cx="28" cy="42" r="8" fill="#88b8f2" />
        <circle cx="72" cy="42" r="8" fill="#88b8f2" />
        
        {/* Top dots */}
        <circle cx="28" cy="24" r="5" fill="#488ce0" />
        <circle cx="72" cy="24" r="5" fill="#488ce0" />
        
        {/* Bottom circle */}
        <circle cx="50" cy="82" r="7.5" fill="#e6f2ff" />
      </svg>

      {/* ── Text ── */}
      {showText && (
        <div style={{ fontFamily: "'Montserrat', 'Inter', 'Segoe UI', sans-serif", lineHeight: 1 }}>
          <div style={{ fontWeight: 800, fontSize: textSize, letterSpacing: -0.5, lineHeight: 1 }}>
            <span style={{ color: '#ffffff' }}>Videa</span>
            <span style={{ color: '#3388e2' }}>Link</span>
          </div>
          <div style={{
            fontSize: subSize,
            color: '#8e96a4',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginTop: 4,
          }}>
            SMART IOT CONNECTIVITY
          </div>
        </div>
      )}
    </div>
  );
}
