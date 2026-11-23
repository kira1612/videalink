import React, { useEffect, useRef } from 'react';

// Single-hue tonal neon palettes matched cleanly to VideaLink's 6 theme accents.
// Each theme stays cohesive in one color family (luminous light tint -> vivid primary -> deep tonal shade).
const PALETTES = {
  '#0075ff': {
    left: [0.38, 0.68, 1.0],       // Luminous Sky Cobalt
    mid: [0.04, 0.46, 1.0],        // Vivid Electric Royal Blue
    right: [0.05, 0.26, 0.86],     // Deep Sapphire Blue
    duneLeft: [0.08, 0.30, 0.72],
    duneMid: [0.05, 0.22, 0.62],
    duneRight: [0.04, 0.14, 0.48],
    surfaceRgb: [8, 14, 34],
    deepRgb: [4, 7, 18],
  },
  '#005ed4': {
    left: [0.38, 0.68, 1.0],
    mid: [0.04, 0.46, 1.0],
    right: [0.05, 0.26, 0.86],
    duneLeft: [0.08, 0.30, 0.72],
    duneMid: [0.05, 0.22, 0.62],
    duneRight: [0.04, 0.14, 0.48],
    surfaceRgb: [8, 14, 34],
    deepRgb: [4, 7, 18],
  },
  '#06b6d4': {
    left: [0.42, 0.92, 1.0],       // Luminous Ice Cyan
    mid: [0.04, 0.76, 0.88],       // Vivid VideaLink Cyan
    right: [0.06, 0.56, 0.84],     // Deep Electric Cyan
    duneLeft: [0.06, 0.50, 0.64],
    duneMid: [0.04, 0.40, 0.56],
    duneRight: [0.04, 0.30, 0.48],
    surfaceRgb: [6, 18, 28],
    deepRgb: [4, 9, 16],
  },
  '#0891b2': {
    left: [0.42, 0.92, 1.0],
    mid: [0.04, 0.76, 0.88],
    right: [0.06, 0.56, 0.84],
    duneLeft: [0.06, 0.50, 0.64],
    duneMid: [0.04, 0.40, 0.56],
    duneRight: [0.04, 0.30, 0.48],
    surfaceRgb: [6, 18, 28],
    deepRgb: [4, 9, 16],
  },
  '#10b981': {
    left: [0.44, 0.96, 0.74],      // Luminous Mint Emerald
    mid: [0.06, 0.78, 0.54],       // Vivid Emerald
    right: [0.04, 0.56, 0.42],     // Deep Forest Emerald
    duneLeft: [0.05, 0.48, 0.36],
    duneMid: [0.03, 0.38, 0.28],
    duneRight: [0.02, 0.28, 0.22],
    surfaceRgb: [6, 22, 18],
    deepRgb: [4, 11, 10],
  },
  '#059669': {
    left: [0.44, 0.96, 0.74],
    mid: [0.06, 0.78, 0.54],
    right: [0.04, 0.56, 0.42],
    duneLeft: [0.05, 0.48, 0.36],
    duneMid: [0.03, 0.38, 0.28],
    duneRight: [0.02, 0.28, 0.22],
    surfaceRgb: [6, 22, 18],
    deepRgb: [4, 11, 10],
  },
  '#8b5cf6': {
    left: [0.78, 0.62, 1.0],       // Luminous Soft Lavender
    mid: [0.56, 0.36, 0.98],       // Vivid Violet
    right: [0.42, 0.22, 0.86],     // Deep Royal Violet
    duneLeft: [0.38, 0.20, 0.68],
    duneMid: [0.30, 0.14, 0.58],
    duneRight: [0.22, 0.10, 0.46],
    surfaceRgb: [16, 10, 32],
    deepRgb: [7, 5, 16],
  },
  '#7c3aed': {
    left: [0.78, 0.62, 1.0],
    mid: [0.56, 0.36, 0.98],
    right: [0.42, 0.22, 0.86],
    duneLeft: [0.38, 0.20, 0.68],
    duneMid: [0.30, 0.14, 0.58],
    duneRight: [0.22, 0.10, 0.46],
    surfaceRgb: [16, 10, 32],
    deepRgb: [7, 5, 16],
  },
  '#f43f5e': {
    left: [1.0, 0.58, 0.68],       // Luminous Blush Rose
    mid: [0.96, 0.25, 0.38],       // Vivid Rose
    right: [0.76, 0.12, 0.28],     // Deep Crimson Rose
    duneLeft: [0.58, 0.14, 0.26],
    duneMid: [0.46, 0.09, 0.20],
    duneRight: [0.34, 0.06, 0.16],
    surfaceRgb: [26, 9, 16],
    deepRgb: [11, 5, 9],
  },
  '#e11d48': {
    left: [1.0, 0.58, 0.68],
    mid: [0.96, 0.25, 0.38],
    right: [0.76, 0.12, 0.28],
    duneLeft: [0.58, 0.14, 0.26],
    duneMid: [0.46, 0.09, 0.20],
    duneRight: [0.34, 0.06, 0.16],
    surfaceRgb: [26, 9, 16],
    deepRgb: [11, 5, 9],
  },
  '#f59e0b': {
    left: [1.0, 0.84, 0.44],       // Luminous Warm Gold
    mid: [0.96, 0.62, 0.06],       // Vivid Amber
    right: [0.76, 0.42, 0.04],     // Deep Burnished Amber
    duneLeft: [0.56, 0.32, 0.06],
    duneMid: [0.44, 0.23, 0.04],
    duneRight: [0.32, 0.16, 0.03],
    surfaceRgb: [24, 15, 6],
    deepRgb: [11, 8, 4],
  },
  '#d97706': {
    left: [1.0, 0.84, 0.44],
    mid: [0.96, 0.62, 0.06],
    right: [0.76, 0.42, 0.04],
    duneLeft: [0.56, 0.32, 0.06],
    duneMid: [0.44, 0.23, 0.04],
    duneRight: [0.32, 0.16, 0.03],
    surfaceRgb: [24, 15, 6],
    deepRgb: [11, 8, 4],
  },
};

const DEFAULT_SECTIONS = [
  '#overview',
  '#gateway',
  '#features',
  '#industri',
  '#pricing',
  '#faq',
  '#cta-banner',
  'footer',
];

function resolvePalette(hex = '#0075ff') {
  const key = String(hex).toLowerCase();
  return PALETTES[key] || PALETTES['#0075ff'];
}

function rgbFloatToHex(rgb) {
  const toHex = (c) =>
    Math.max(0, Math.min(255, Math.round(c * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

function rgbFloatToRgba(rgb, alpha) {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0] * 255)));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1] * 255)));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2] * 255)));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgb255ToRgba(rgb, alpha) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// Exported single-hue tonal token bridge so every LandingPage section strictly matches the active theme color
export function getSilkPaletteTokens(hex = '#06b6d4') {
  const pal = resolvePalette(hex);
  const left = rgbFloatToHex(pal.left);
  const mid = rgbFloatToHex(pal.mid);
  const right = rgbFloatToHex(pal.right);
  const duneMid = rgbFloatToHex(pal.duneMid);
  const surf = pal.surfaceRgb;
  const deep = pal.deepRgb;

  return {
    left,
    mid,
    right,
    duneMid,
    leftRgba: (a) => rgbFloatToRgba(pal.left, a),
    midRgba: (a) => rgbFloatToRgba(pal.mid, a),
    rightRgba: (a) => rgbFloatToRgba(pal.right, a),
    duneRgba: (a) => rgbFloatToRgba(pal.duneMid, a),
    surfaceRgba: (a) => rgb255ToRgba(surf, a),
    deepRgba: (a) => rgb255ToRgba(deep, a),
    gradient: `linear-gradient(135deg, ${mid} 0%, ${right} 100%)`,
    softGradient: `linear-gradient(135deg, ${rgbFloatToRgba(pal.mid, 0.24)} 0%, ${rgbFloatToRgba(pal.right, 0.16)} 100%)`,
    horizonLine: `linear-gradient(90deg, transparent 0%, ${rgbFloatToRgba(pal.mid, 0.65)} 30%, ${left} 50%, ${rgbFloatToRgba(pal.mid, 0.65)} 70%, transparent 100%)`,
    headingGradient: 'linear-gradient(180deg, #ffffff 0%, #ffffff 58%, rgba(255, 255, 255, 0.72) 100%)',
    pillSurface: rgb255ToRgba(surf, 0.62),
    navSurface: `linear-gradient(165deg, ${rgb255ToRgba(surf, 0.56)} 0%, ${rgb255ToRgba(deep, 0.66)} 100%)`,
    navScrolledSurface: `linear-gradient(165deg, ${rgb255ToRgba(surf, 0.84)} 0%, ${rgb255ToRgba(deep, 0.90)} 100%)`,
    cardSurface: `linear-gradient(165deg, ${rgb255ToRgba(surf, 0.62)} 0%, ${rgb255ToRgba(deep, 0.78)} 100%)`,
    cardOpenSurface: `linear-gradient(165deg, ${rgb255ToRgba(surf, 0.80)} 0%, ${rgb255ToRgba(deep, 0.88)} 100%)`,
    bandSurface: `linear-gradient(180deg, ${rgb255ToRgba(surf, 0.52)} 0%, ${rgb255ToRgba(deep, 0.64)} 100%)`,
    footerSurface: `linear-gradient(180deg, ${rgb255ToRgba(surf, 0.72)} 0%, ${rgb255ToRgba(deep, 0.90)} 100%)`,
    nodeFill: rgb255ToRgba(surf, 0.84),
    hubFill: rgb255ToRgba(deep, 0.94),
    cardBoxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.16), 0 24px 60px -18px rgba(2, 4, 10, 0.85)`,
    ctaBoxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.38), 0 12px 32px -6px ${rgbFloatToRgba(pal.mid, 0.62)}, 0 4px 16px rgba(0, 0, 0, 0.48)`,
  };
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// High-precision WebGL fragment shader recreating the exact reference artwork:
// 1. Deep midnight sky with subtle bi-color horizon aura
// 2. 3D undulating backlit velvet dunes with occlusion, subsurface rim glow, foreground DoF bokeh, and micro-sparkle grain
// 3. Braided HDR neon laser filaments (warm coral-peach left -> blazing neon pink-magenta center -> electric cyan-blue right)
const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerVy;
uniform float uPointerActive;
uniform float uScrollPhase;
uniform float uScrollVel;
uniform float uZig;
uniform float uZag;
uniform float uIntensity;
uniform float uDive;

uniform vec3 uLeft;
uniform vec3 uMid;
uniform vec3 uRight;
uniform vec3 uDuneLeft;
uniform vec3 uDuneMid;
uniform vec3 uDuneRight;

// Fast deterministic 2D hash for velvet micro-sparkles
float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Smooth value noise for organic 3D velvet terrain & sparkle clusters
float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 3-stop horizontal spectrum blend (shifts gently with zig-zag scroll)
vec3 sampleSpectrum(float x, vec3 cL, vec3 cM, vec3 cR, float zig) {
  // Flip or shift spectrum focus gently as sections zig-zag
  float xOriented = mix(1.0 - x, x, 0.5 + 0.5 * zig);
  float wLeft = smoothstep(0.58, 0.05, xOriented);
  float wRight = smoothstep(0.42, 0.95, xOriented);
  float wMid = max(0.0, 1.0 - wLeft * 0.85 - wRight * 0.85);
  vec3 col = cL * wLeft + cM * wMid + cR * wRight;
  return col / max(wLeft + wMid + wRight, 0.001);
}

// Macro carrier wave matching the reference photo's graceful horizon S-curve
float getCarrierY(float x, float t, float scrollMix, float zig, float zag) {
  // Base horizon around sy = 0.49 (just above vertical center)
  float base = 0.49;

  // Signature 1.5-cycle graceful wave from the reference image:
  // crest at x~0.31, trough at x~0.66, crest at x~0.97
  float refWave =
    -0.044 * sin(x * 9.1 - 1.25 + t * 0.42) +
     0.014 * cos(x * 4.5 + 0.4 - t * 0.28);

  // Scroll-choreographed diagonal zig-zag tilt across content sections below Hero
  float zigTilt = scrollMix * ((0.5 - x) * 0.14 * zig + sin(x * 6.28318) * 0.036 * zag);

  return base + refWave + zigTilt;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  // Screen coordinates: sx in [0..1] left->right, sy in [0..1] top->bottom
  float sx = uv.x;
  float sy = 1.0 - uv.y;

  float dive = clamp(uDive, 0.0, 1.0);
  float diveEase = dive * dive * (3.0 - 2.0 * dive);
  float divePush = pow(dive, 1.55);

  // Camera dives nose-down into the glowing silk waves & braided neon horizon stream
  if (dive > 0.0001) {
    vec2 p = vec2(sx - 0.5, sy - 0.56);
    float zoom = 1.0 + divePush * 2.15;
    float breach = sin(dive * 3.14159);
    float ripple = sin(length(p) * 24.0 - dive * 15.0) * 0.014 * breach * diveEase;
    p *= (1.0 - diveEase * 0.30 * dot(p, p));
    sx = 0.5 + p.x / zoom + ripple;
    sy = 0.56 + p.y / zoom + ripple * 0.65;
  }

  float scrollMix = smoothstep(0.04, 0.55, uScrollPhase);
  float t = uTime + divePush * 5.2;

  // Cursor attraction field
  float dxCursor = sx - uPointer.x;
  float cursorInfluence = exp(-(dxCursor * dxCursor) / 0.055) * uPointerActive * (1.0 - diveEase);

  // Horizon rises over the camera's head as we plunge downward into the waves
  float diveHorizonLift = -divePush * 0.62;
  float carrierY = getCarrierY(sx, t, scrollMix, uZig, uZag) + diveHorizonLift;

  // Pull horizon & filaments smoothly toward cursor
  float cursorPull = (uPointer.y - carrierY) * 0.26 * cursorInfluence;
  float cursorRipple = sin(sx * 18.0 - t * 4.5) * uPointerVy * 0.35 * cursorInfluence;
  float horizonY = carrierY + cursorPull * 0.55;

  // ── 1. DEEP MIDNIGHT SKY & ATMOSPHERIC HORIZON GLOW (SINGLE-HUE TONAL) ──
  vec3 skyTop = vec3(0.008, 0.011, 0.022);
  vec3 skyMid = mix(vec3(0.014, 0.018, 0.032), uDuneMid * 0.14, 0.65);
  vec3 col = mix(skyTop, skyMid, smoothstep(0.0, 0.55, sy));

  // Soft wide atmospheric neon bloom above & around the horizon
  vec3 horizonSpec = sampleSpectrum(sx, uLeft, uMid, uRight, uZig);
  float distToHorizon = abs(sy - (horizonY - 0.01));
  float skyMist = exp(-distToHorizon * 4.8) * 0.34 + exp(-distToHorizon * 14.0) * 0.28;
  // Cooler navy-cyan upper-right ambient mist like the reference photo
  float rightSkyAmbient = smoothstep(0.35, 1.0, sx) * exp(-abs(sy - 0.38) * 3.8) * 0.14;
  col += horizonSpec * skyMist * uIntensity;
  col += uRight * rightSkyAmbient * uIntensity;

  // ── 2. 3D UNDULATING BACKLIT VELVET DUNES (LOWER HALF) ──
  // 11 perspective-projected 3D wave rows from horizon (i=0) to foreground bottom (i=10)
  vec3 duneSpec = sampleSpectrum(sx, uDuneLeft, uDuneMid, uDuneRight, uZig);
  vec3 filamentSpec = horizonSpec;

  for (int i = 0; i < 11; i++) {
    float fi = float(i);
    float depth = fi / 10.0;                 // 0.0 = near horizon, 1.0 = near bottom camera
    float persp = pow(depth, 1.42);

    // Row base Y position receding in 3D perspective (expands toward camera during dive)
    float rowY = horizonY + 0.010 + persp * (0.49 + divePush * 0.46);

    // 3D wave phase (rolls rapidly forward as camera plunges into the waves)
    float rowSpeed = (0.32 + persp * 0.28) * (mod(fi, 2.0) < 0.5 ? 1.0 : -0.85);
    float phase = t * rowSpeed + fi * 2.37 + uScrollPhase * (0.85 + persp * 1.65) + divePush * (3.2 + persp * 6.8);

    // Transverse 3D mound envelope: breaks continuous horizontal lines into interlocking 3D velvet hills!
    float moundFreq = 3.4 - depth * 1.15;
    float moundEnv1 = 0.5 + 0.5 * sin(sx * moundFreq * 3.14159 + fi * 1.85 + t * 0.22 + uScrollPhase * 0.9);
    float moundEnv2 = 0.5 + 0.5 * cos(sx * (moundFreq * 1.65) * 3.14159 - fi * 2.45 - t * 0.18);
    float moundProminence = smoothstep(0.12, 0.92, moundEnv1 * 0.68 + moundEnv2 * 0.32);

    // Rolling 3D hill elevation profile (swells dramatically as we dive through it)
    float freq1 = (2.8 - depth * 1.1) * 3.14159;
    float freq2 = (5.4 - depth * 2.1) * 3.14159;
    float amp = (0.016 + persp * 0.036) * (0.45 + 0.55 * moundProminence) * (1.0 + diveEase * 0.85);

    float waveH =
      sin(sx * freq1 + phase) * amp +
      cos(sx * freq2 - phase * 0.75 + fi) * (amp * 0.45);

    // Subtle 3D surface swell under cursor
    float dyCursorRow = rowY - uPointer.y;
    float cursorDuneLift =
      exp(-(dxCursor * dxCursor * 14.0 + dyCursorRow * dyCursorRow * 18.0)) *
      uPointerActive *
      (-0.018 - persp * 0.015);

    float crestY = rowY + waveH + cursorDuneLift;
    float dy = sy - crestY; // dy < 0 above crest, dy > 0 inside dune body below crest

    // Depth-of-field edge blur: crisp velvet near horizon, wide soft bokeh in foreground bottom
    float dof = mix(0.0035, 0.038, pow(depth, 1.85));

    // A. 3D Front-to-Back Occlusion: each dune body occludes the valleys behind it into deep theme-matched shadow
    float bodyMask = smoothstep(-dof, dof * 0.85, dy);
    vec3 deepValley = mix(uDuneMid * 0.08 + vec3(0.008, 0.010, 0.018), vec3(0.005, 0.006, 0.012), depth);
    col = mix(col, deepValley, bodyMask * 0.91);

    // B. Soft Volumetric Velvet Slope Lighting (backlit from the neon filaments above)
    float slopeSpan = mix(0.022, 0.082, persp);
    float upperSlope =
      exp(-max(dy, 0.0) / slopeSpan) *
      smoothstep(-dof * 1.35, dof * 0.55, dy);

    // Velvet Fresnel rim highlight along the 3D mound crest
    float rimWidth = mix(0.0042, 0.026, pow(depth, 1.55));
    float crestRim = exp(-(dy * dy) / (rimWidth * rimWidth));

    // Hills closer to the neon horizon & prominent 3D mound peaks catch stronger rim light
    float distanceAtten = (1.0 - depth * 0.48);
    float lightWeight = (0.28 + 0.72 * moundProminence) * distanceAtten * uIntensity;

    // Color of the lit velvet slope stays strictly in the active theme's tonal family
    vec3 slopeCol = mix(duneSpec * 0.92, filamentSpec, 0.35 * (1.0 - depth));
    vec3 rimCol = mix(duneSpec, mix(filamentSpec, vec3(0.98, 0.99, 1.0), 0.32), 0.68 * (1.0 - depth * 0.6));

    col += slopeCol * upperSlope * lightWeight * 0.82;
    col += rimCol * crestRim * lightWeight * 0.95;

    // C. Velvet Micro-Sparkle / Powder Texture on Illuminated Ridge Crests
    if (i < 8) {
      vec2 grainUV = vec2(sx * 340.0 + fi * 43.7 + phase * 3.0, (dy / max(rimWidth, 0.002)) * 18.0 + fi * 19.3);
      float grain = valueNoise(grainUV);
      float fineSparkle = pow(clamp(grain, 0.0, 1.0), 15.0);
      float sparkleMask = crestRim * moundProminence * (1.0 - depth * 0.85) * smoothstep(-rimWidth, rimWidth, dy);
      col += mix(rimCol, vec3(0.98, 0.99, 1.0), 0.72) * fineSparkle * sparkleMask * 1.65 * uIntensity;
    }
  }

  // Soft foreground bottom vignette (matches the dark out-of-focus bottom edge of the reference photo)
  float bottomVignette = smoothstep(1.02, 0.76, sy);
  col *= mix(0.32, 1.0, bottomVignette);

  // ── 3. CURSOR SPECULAR LIGHT REFLECTION ON DUNES & HORIZON ──
  if (uPointerActive > 0.01) {
    vec2 pDelta = vec2((sx - uPointer.x) * (uResolution.x / max(uResolution.y, 1.0)), sy - uPointer.y);
    float pDist = length(pDelta);
    float cursorHalo = exp(-pDist * 5.2) * 0.32 * uPointerActive * uIntensity;
    col += mix(horizonSpec, vec3(1.0, 0.94, 0.98), 0.45) * cursorHalo;
  }

  // ── 4. BRAIDED HDR NEON LASER FILAMENTS (THE HORIZON ENERGY STREAM) ──
  // 7 intertwined filaments sharing the macro carrier wave so they braid and cross like the photo
  vec3 filamentHDR = vec3(0.0);

  for (int f = 0; f < 7; f++) {
    float ff = float(f);

    // Individual filament braid harmonics around the carrier wave
    float freqA = 7.8 + ff * 1.45;
    float freqB = 14.2 - ff * 1.1;
    float speedA = (0.55 + mod(ff, 3.0) * 0.18) * (mod(ff, 2.0) < 0.5 ? 1.0 : -0.88);
    float phaseA = ff * 1.12 + t * speedA + uScrollPhase * 1.85;

    // Envelope that pinches the filaments together at nodes and spreads them at wave bellies
    float braidSpread = 0.55 + 0.45 * sin(sx * 5.2 + ff * 0.85 + t * 0.3) + diveEase * 1.75;
    float ampA = (0.014 + mod(ff, 4.0) * 0.0075) * braidSpread;
    float ampB = (0.006 + mod(ff, 3.0) * 0.004) * braidSpread;

    float braidOffset =
      sin(sx * freqA + phaseA) * ampA +
      cos(sx * freqB - phaseA * 0.72 + ff * 1.7) * ampB +
      (ff - 3.0) * 0.0032;

    // Scroll velocity momentum ripple
    float scrollPulse = sin(sx * 8.0 + ff) * uScrollVel * 0.12;

    // Filament Y position with cursor magnetic pull & ripple
    float filWeight = 0.85 + 0.12 * mod(ff, 3.0);
    float filY =
      carrierY +
      braidOffset +
      scrollPulse +
      cursorPull * filWeight +
      cursorRipple * filWeight;

    // Approximate derivative dY/dX for uniform perpendicular tube thickness on steep slopes
    float slope = cos(sx * freqA + phaseA) * freqA * ampA * 0.42;
    float perpDist = abs(sy - filY) / sqrt(1.0 + slope * slope);

    // Clean single-hue tonal depth across the braided filaments (light tint -> vivid primary -> rich deep shade)
    vec3 fCol = horizonSpec;
    float tonalShift = smoothstep(0.30, 0.82, mix(1.0 - sx, sx, 0.5 + 0.5 * uZig));
    if (f == 2 || f == 5) {
      fCol = mix(uLeft, uRight, tonalShift * 0.85);
    } else if (f == 0 || f == 1) {
      fCol = mix(uLeft, uMid, 0.55);
    } else {
      fCol = mix(uMid, uRight, 0.45);
    }

    // Filament thickness & brightness hierarchy (Filament 0 & 1 are the primary blazing streams)
    float isHero = (f == 0) ? 1.45 : (f == 1) ? 1.18 : (f == 2) ? 1.02 : 0.76;
    float coreRadius = (f == 0) ? 0.0022 : (f == 1) ? 0.0017 : 0.0012;
    float tubeRadius = (f == 0) ? 0.0078 : (f == 1) ? 0.0062 : 0.0046;

    // 3-layer physical HDR neon light profile:
    // 1. Razor-sharp white-hot core
    float core = exp(-(perpDist * perpDist) / (coreRadius * coreRadius));
    // 2. Saturated neon plasma sheath
    float tube = exp(-perpDist / tubeRadius);
    // 3. Wide inverse-distance optical bloom
    float bloom = (0.0018 * isHero) / (perpDist + 0.0042);

    vec3 coreWhite = mix(fCol, vec3(1.0, 0.98, 1.0), 0.88);
    filamentHDR += (fCol * (tube * 0.92 + bloom * 0.85) + coreWhite * (core * 1.42)) * isHero;
  }

  float diveEnergyBoost = 1.0 + sin(dive * 3.14159) * 0.48;
  col += filamentHDR * uIntensity * diveEnergyBoost;

  // Smooth submersion into deep luminous abyss right before handing off to 3D Data Cubes
  if (dive > 0.0001) {
    float submergeMask = smoothstep(0.55, 1.0, dive);
    vec3 abyssCol = uDuneMid * 0.22 + vec3(0.008, 0.012, 0.024);
    col = mix(col, abyssCol, submergeMask * 0.82);
  }

  // ── 5. CINEMATIC HDR TONE MAPPING (PRESERVES BLAZING WHITE CORES & VELVET SHADOWS) ──
  // Soft ACES-inspired highlight compression so crossing filaments flare white-hot without harsh clipping
  vec3 mapped = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = mix(col, mapped, 0.68);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function SilkWaveBackground({
  color = '#06b6d4',
  fullPage = false,
  sectionSelectors = DEFAULT_SECTIONS,
  isDiving = false,
}) {
  const canvasRef = useRef(null);
  const colorRef = useRef(color);
  const selectorsRef = useRef(sectionSelectors);
  const isDivingRef = useRef(isDiving);
  const redrawRef = useRef(null);

  useEffect(() => {
    isDivingRef.current = isDiving;
    if (redrawRef.current) redrawRef.current();
  }, [isDiving]);

  useEffect(() => {
    colorRef.current = color;
    if (redrawRef.current) redrawRef.current();
  }, [color]);

  useEffect(() => {
    selectorsRef.current = sectionSelectors;
  }, [sectionSelectors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = null;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let width = 1;
    let height = 1;
    let dpr = 1;

    // Smoothly interpolated palette RGB vectors for seamless theme transitions
    const initialPal = resolvePalette(colorRef.current);
    const livePal = {
      left: [...initialPal.left],
      mid: [...initialPal.mid],
      right: [...initialPal.right],
      duneLeft: [...initialPal.duneLeft],
      duneMid: [...initialPal.duneMid],
      duneRight: [...initialPal.duneRight],
    };

    const pointer = {
      targetX: 0.52,
      targetY: 0.49,
      x: 0.52,
      y: 0.49,
      vy: 0,
      active: 0,
      targetActive: 0,
    };

    const scrollState = {
      targetPhase: 0,
      phase: 0,
      vel: 0,
    };

    const diveState = {
      progress: 0,
      lastTs: 0,
    };

    const computeScrollPhase = () => {
      if (!fullPage) {
        scrollState.targetPhase = 0;
        return;
      }

      const sy = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const selectors = selectorsRef.current || DEFAULT_SECTIONS;

      const anchors = [];
      for (let i = 0; i < selectors.length; i++) {
        const el = document.querySelector(selectors[i]);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + sy;
        const anchorY = i === 0 ? 0 : Math.max(0, top - vh * 0.26);
        if (anchors.length > 0) {
          anchors.push(Math.max(anchors[anchors.length - 1] + 180, anchorY));
        } else {
          anchors.push(anchorY);
        }
      }

      if (anchors.length >= 2) {
        if (sy <= anchors[0]) {
          scrollState.targetPhase = 0;
          return;
        }
        const lastIdx = anchors.length - 1;
        if (sy >= anchors[lastIdx]) {
          scrollState.targetPhase = lastIdx;
          return;
        }
        for (let i = 0; i < lastIdx; i++) {
          if (sy >= anchors[i] && sy <= anchors[i + 1]) {
            const span = Math.max(1, anchors[i + 1] - anchors[i]);
            const raw = clamp((sy - anchors[i]) / span, 0, 1);
            const eased = raw * raw * (3 - 2 * raw);
            scrollState.targetPhase = i + eased;
            return;
          }
        }
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      scrollState.targetPhase = clamp(sy / maxScroll, 0, 1) * 6;
    };

    // Initialize WebGL context
    const gl =
      canvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' }) ||
      canvas.getContext('experimental-webgl');

    let program = null;
    let posBuffer = null;
    let uniforms = null;

    if (gl) {
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (vs && fs) {
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          program = prog;
          gl.useProgram(program);

          posBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
          );

          const aPos = gl.getAttribLocation(program, 'aPosition');
          gl.enableVertexAttribArray(aPos);
          gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

          uniforms = {
            uResolution: gl.getUniformLocation(program, 'uResolution'),
            uTime: gl.getUniformLocation(program, 'uTime'),
            uPointer: gl.getUniformLocation(program, 'uPointer'),
            uPointerVy: gl.getUniformLocation(program, 'uPointerVy'),
            uPointerActive: gl.getUniformLocation(program, 'uPointerActive'),
            uScrollPhase: gl.getUniformLocation(program, 'uScrollPhase'),
            uScrollVel: gl.getUniformLocation(program, 'uScrollVel'),
            uZig: gl.getUniformLocation(program, 'uZig'),
            uZag: gl.getUniformLocation(program, 'uZag'),
            uIntensity: gl.getUniformLocation(program, 'uIntensity'),
            uDive: gl.getUniformLocation(program, 'uDive'),
            uLeft: gl.getUniformLocation(program, 'uLeft'),
            uMid: gl.getUniformLocation(program, 'uMid'),
            uRight: gl.getUniformLocation(program, 'uRight'),
            uDuneLeft: gl.getUniformLocation(program, 'uDuneLeft'),
            uDuneMid: gl.getUniformLocation(program, 'uDuneMid'),
            uDuneRight: gl.getUniformLocation(program, 'uDuneRight'),
          };
        }
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width || window.innerWidth));
      height = Math.max(1, Math.floor(rect.height || window.innerHeight));
      // Cap DPR at 1.5 for buttery-smooth 60fps fragment shader execution on 4K/Retina screens
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      computeScrollPhase();
    };

    resize();
    scrollState.phase = scrollState.targetPhase;

    const onPointerMove = (e) => {
      if (fullPage) {
        pointer.targetX = clamp(e.clientX / Math.max(1, window.innerWidth), 0, 1);
        pointer.targetY = clamp(e.clientY / Math.max(1, window.innerHeight), 0, 1);
        pointer.targetActive = 1;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      if (ny >= -0.15 && ny <= 1.15 && nx >= -0.1 && nx <= 1.1) {
        pointer.targetX = clamp(nx, 0, 1);
        pointer.targetY = clamp(ny, 0, 1);
        pointer.targetActive = 1;
      } else {
        pointer.targetActive = 0;
      }
    };

    const onPointerLeave = () => {
      pointer.targetActive = 0;
    };

    const onScroll = () => {
      computeScrollPhase();
      if (prefersReduced) {
        scrollState.phase = scrollState.targetPhase;
        renderFrame(0);
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave, { passive: true });
    if (fullPage) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas);
    }

    const lerpVec3 = (curr, target, factor) => {
      curr[0] += (target[0] - curr[0]) * factor;
      curr[1] += (target[1] - curr[1]) * factor;
      curr[2] += (target[2] - curr[2]) * factor;
    };

    const renderFrame = (now) => {
      if (!gl || !program || !uniforms) return;

      const time = prefersReduced ? 0.8 : now * 0.001;
      const targetPal = resolvePalette(colorRef.current);

      const palLerp = prefersReduced ? 1.0 : 0.08;
      lerpVec3(livePal.left, targetPal.left, palLerp);
      lerpVec3(livePal.mid, targetPal.mid, palLerp);
      lerpVec3(livePal.right, targetPal.right, palLerp);
      lerpVec3(livePal.duneLeft, targetPal.duneLeft, palLerp);
      lerpVec3(livePal.duneMid, targetPal.duneMid, palLerp);
      lerpVec3(livePal.duneRight, targetPal.duneRight, palLerp);

      const prevY = pointer.y;
      pointer.x += (pointer.targetX - pointer.x) * 0.075;
      pointer.y += (pointer.targetY - pointer.y) * 0.075;
      pointer.vy = clamp(pointer.y - prevY, -0.08, 0.08);
      pointer.active += (pointer.targetActive - pointer.active) * 0.06;

      const prevPhase = scrollState.phase;
      scrollState.phase += (scrollState.targetPhase - scrollState.phase) * 0.075;
      scrollState.vel = clamp(scrollState.phase - prevPhase, -0.14, 0.14);

      const theta = scrollState.phase * Math.PI;
      const zig = fullPage ? Math.cos(theta) : 1.0;
      const zag = fullPage ? Math.sin(theta) : 0.0;
      const intensity = fullPage ? 1.0 - clamp(scrollState.phase / 0.9, 0, 1) * 0.15 : 1.0;

      // Smoothly ramp uDive 0 -> 1 over ~1.75s so the user clearly sees the dive into the waves first
      const dtSec = diveState.lastTs ? Math.min(0.05, Math.max(0.001, (now - diveState.lastTs) * 0.001)) : 0.016;
      diveState.lastTs = now;
      if (isDivingRef.current) {
        diveState.progress = prefersReduced ? 0.35 : Math.min(1, diveState.progress + dtSec / 1.75);
      } else if (diveState.progress > 0) {
        diveState.progress = Math.max(0, diveState.progress - dtSec * 2.2);
      }

      gl.useProgram(program);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, time);
      gl.uniform2f(uniforms.uPointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.uPointerVy, pointer.vy);
      gl.uniform1f(uniforms.uPointerActive, pointer.active);
      gl.uniform1f(uniforms.uScrollPhase, scrollState.phase);
      gl.uniform1f(uniforms.uScrollVel, scrollState.vel);
      gl.uniform1f(uniforms.uZig, zig);
      gl.uniform1f(uniforms.uZag, zag);
      gl.uniform1f(uniforms.uIntensity, intensity);
      gl.uniform1f(uniforms.uDive, diveState.progress);

      gl.uniform3fv(uniforms.uLeft, livePal.left);
      gl.uniform3fv(uniforms.uMid, livePal.mid);
      gl.uniform3fv(uniforms.uRight, livePal.right);
      gl.uniform3fv(uniforms.uDuneLeft, livePal.duneLeft);
      gl.uniform3fv(uniforms.uDuneMid, livePal.duneMid);
      gl.uniform3fv(uniforms.uDuneRight, livePal.duneRight);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now) => {
      if (!isVisible || !isTabActive) {
        animId = null;
        return;
      }

      renderFrame(now);

      if (!prefersReduced) {
        animId = requestAnimationFrame(render);
      }
    };

    const startLoop = () => {
      if (!animId && isVisible && isTabActive) {
        animId = requestAnimationFrame(render);
      }
    };

    let observer = null;
    if (!fullPage && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          if (isVisible) startLoop();
        },
        { threshold: 0.02 }
      );
      observer.observe(canvas);
    }

    const onVisChange = () => {
      isTabActive = !document.hidden;
      if (isTabActive) startLoop();
    };
    document.addEventListener('visibilitychange', onVisChange);

    redrawRef.current = () => {
      if (prefersReduced) {
        renderFrame(0);
      }
    };

    startLoop();

    return () => {
      redrawRef.current = null;
      if (animId) cancelAnimationFrame(animId);
      if (resizeObserver) resizeObserver.disconnect();
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      if (fullPage) {
        window.removeEventListener('scroll', onScroll);
      }
      document.removeEventListener('visibilitychange', onVisChange);
      if (gl && program) {
        if (posBuffer) gl.deleteBuffer(posBuffer);
        gl.deleteProgram(program);
      }
    };
  }, [fullPage]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: fullPage ? 'fixed' : 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: fullPage ? '100vw' : '100%',
        height: fullPage ? '100vh' : '100%',
        display: 'block',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
