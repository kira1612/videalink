import React, { useEffect, useRef } from 'react';
import { getSilkPaletteTokens } from './SilkWaveBackground';

// Unit cube geometry (8 vertices, 6 faces with outward winding)
const CUBE_VERTS = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

const CUBE_FACES = [
  [0, 3, 2, 1], // back (-z)
  [4, 5, 6, 7], // front (+z)
  [0, 1, 5, 4], // top (-y)
  [2, 3, 7, 6], // bottom (+y)
  [0, 4, 7, 3], // left (-x)
  [1, 2, 6, 5], // right (+x)
];

const CUBE_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function hexToRgb(hex) {
  const clean = String(hex || '#06b6d4').replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) || 6,
    parseInt(clean.slice(2, 4), 16) || 182,
    parseInt(clean.slice(4, 6), 16) || 212,
  ];
}

function mixRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgbStr(rgb, alpha = 1) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export default function DataCubeDiveCanvas({ color = '#06b6d4', active = true }) {
  const canvasRef = useRef(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 1;
    let h = 1;
    let cx = 0.5;
    let cy = 0.5;
    let dpr = 1;
    let animId = null;

    const MAX_Z = 1650;
    const MIN_Z = 55;
    const FOV = 520;

    // Light direction (normalized, upper-left front)
    const lightDir = [-0.42, -0.58, -0.69];

    let cubes = [];
    let voxels = [];

    function spawnCube(c, initial = false) {
      // Spread in a rich 3D stream volume; keep center slightly open at medium-close range
      // so the welcome typography remains effortlessly legible while surrounded by cubes.
      const angle = Math.random() * Math.PI * 2;
      const bandRoll = Math.random();
      let radius;
      if (bandRoll < 0.28) {
        // Inner stream core (passes closer to center, dramatic dive feel)
        radius = 65 + Math.random() * 210;
      } else if (bandRoll < 0.78) {
        // Mid dense data-cube river
        radius = 220 + Math.random() * 520;
      } else {
        // Wide peripheral field
        radius = 580 + Math.random() * 680;
      }

      // Elongate horizontally to match the flowing silk horizon stream
      c.ox = Math.cos(angle) * radius * 1.28;
      c.oy = Math.sin(angle) * radius * 0.88;
      c.z = initial ? MIN_Z + Math.random() * (MAX_Z - MIN_Z) : MAX_Z - Math.random() * 140;

      // Archetypes: glass (50%), wire (30%), solid (20%)
      const typeRoll = Math.random();
      c.type = typeRoll < 0.50 ? 'glass' : typeRoll < 0.80 ? 'wire' : 'solid';

      // Varied sizes for strong depth hierarchy
      c.size =
        c.type === 'solid'
          ? 12 + Math.random() * 24
          : c.type === 'wire'
          ? 16 + Math.random() * 34
          : 14 + Math.random() * 32;

      c.rx = Math.random() * Math.PI * 2;
      c.ry = Math.random() * Math.PI * 2;
      c.rz = Math.random() * Math.PI * 2;

      const rotScale = prefersReduced ? 0.12 : 1;
      c.vrx = (Math.random() - 0.5) * 1.35 * rotScale;
      c.vry = (Math.random() - 0.5) * 1.55 * rotScale;
      c.vrz = (Math.random() - 0.5) * 0.85 * rotScale;

      c.phase = Math.random() * Math.PI * 2;
      c.driftAmp = 14 + Math.random() * 38;
      c.speedMul = 0.72 + Math.random() * 0.62;
      c.pulsePhase = Math.random() * Math.PI * 2;
      c.tint = Math.random(); // 0..1 blend between left/mid/right theme tones
      return c;
    }

    function spawnVoxel(v, initial = false) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.pow(Math.random(), 0.75) * 1050;
      v.ox = Math.cos(angle) * radius * 1.3;
      v.oy = Math.sin(angle) * radius * 0.85;
      v.z = initial ? MIN_Z + Math.random() * (MAX_Z - MIN_Z) : MAX_Z - Math.random() * 120;
      v.size = 2.2 + Math.random() * 5.2;
      v.speedMul = 0.9 + Math.random() * 0.95;
      v.phase = Math.random() * Math.PI * 2;
      v.alpha = 0.35 + Math.random() * 0.6;
      return v;
    }

    function initEntities() {
      const areaFactor = Math.min(1, (w * h) / (1440 * 900));
      const cubeCount = Math.max(110, Math.round(185 * (0.65 + 0.35 * areaFactor)));
      const voxelCount = Math.max(120, Math.round(210 * (0.65 + 0.35 * areaFactor)));

      cubes = Array.from({ length: cubeCount }, () => spawnCube({}, true));
      voxels = Array.from({ length: voxelCount }, () => spawnVoxel({}, true));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * 0.5;
      cy = h * 0.5;
      initEntities();
    }

    function rotateVertex(v, sx, cxR, sy, cyR, sz, czR) {
      // Rotate X
      const y1 = v[1] * cxR - v[2] * sx;
      const z1 = v[1] * sx + v[2] * cxR;
      const x1 = v[0];
      // Rotate Y
      const x2 = x1 * cyR + z1 * sy;
      const z2 = -x1 * sy + z1 * cyR;
      const y2 = y1;
      // Rotate Z
      const x3 = x2 * czR - y2 * sz;
      const y3 = x2 * sz + y2 * czR;
      return [x3, y3, z2];
    }

    // Draw flowing luminous neon current ribbons in the background so user feels immersed in the stream
    function drawStreamCurrents(elapsed, leftRgb, midRgb, rightRgb, surgeFactor) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const ribbonCount = 5;
      for (let i = 0; i < ribbonCount; i++) {
        const fi = i / (ribbonCount - 1);
        const baseY = h * (0.28 + fi * 0.44);
        const amp = (28 + i * 14) * (1 + surgeFactor * 0.45);
        const freq = 0.0024 + i * 0.00045;
        const speed = (1.1 + i * 0.25) * (i % 2 === 0 ? 1 : -0.82);

        const grad = ctx.createLinearGradient(0, baseY - amp, w, baseY + amp);
        grad.addColorStop(0, rgbStr(rightRgb, 0));
        grad.addColorStop(0.25, rgbStr(midRgb, 0.08 + surgeFactor * 0.07));
        grad.addColorStop(0.5, rgbStr(leftRgb, 0.14 + surgeFactor * 0.1));
        grad.addColorStop(0.75, rgbStr(midRgb, 0.08 + surgeFactor * 0.07));
        grad.addColorStop(1, rgbStr(rightRgb, 0));

        ctx.strokeStyle = grad;
        ctx.lineWidth = 18 + (i % 3) * 14;
        ctx.lineCap = 'round';
        ctx.beginPath();

        const step = Math.max(48, Math.floor(w / 18));
        for (let x = -step; x <= w + step; x += step) {
          const y =
            baseY +
            Math.sin(x * freq + elapsed * speed + i * 1.4) * amp +
            Math.cos(x * freq * 1.7 - elapsed * speed * 0.65) * (amp * 0.4);
          if (x === -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Crisp inner filament line
        ctx.strokeStyle = rgbStr(leftRgb, 0.16 + surgeFactor * 0.14);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawSingleCube(c, projX, projY, scale, depthAlpha, elapsed, palette) {
      const { leftRgb, midRgb, rightRgb, deepRgb } = palette;
      const sx = Math.sin(c.rx);
      const cxR = Math.cos(c.rx);
      const sy = Math.sin(c.ry);
      const cyR = Math.cos(c.ry);
      const sz = Math.sin(c.rz);
      const czR = Math.cos(c.rz);

      const s = c.size * scale;
      if (s < 1.2) return;

      // Transform 8 vertices
      const rotVerts = new Array(8);
      const screenVerts = new Array(8);
      for (let i = 0; i < 8; i++) {
        const rv = rotateVertex(CUBE_VERTS[i], sx, cxR, sy, cyR, sz, czR);
        rotVerts[i] = rv;
        // Subtle per-vertex perspective for authentic 3D feel
        const vz = c.z + rv[2] * c.size;
        const vScale = FOV / Math.max(25, vz);
        screenVerts[i] = [
          projX + rv[0] * c.size * vScale,
          projY + rv[1] * c.size * vScale,
        ];
      }

      const baseRgb = mixRgb(midRgb, leftRgb, c.tint * 0.55);
      const whiteRgb = [245, 252, 255];

      if (c.type === 'wire') {
        // Holographic wireframe data cube + pulsing core packet
        const pulse = 0.65 + 0.35 * Math.sin(elapsed * 3.8 + c.pulsePhase);

        // Soft volumetric glow inside the cube
        const coreGrad = ctx.createRadialGradient(projX, projY, 0, projX, projY, s * 1.15);
        coreGrad.addColorStop(0, rgbStr(leftRgb, depthAlpha * 0.38 * pulse));
        coreGrad.addColorStop(0.5, rgbStr(midRgb, depthAlpha * 0.12));
        coreGrad.addColorStop(1, rgbStr(midRgb, 0));
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(projX, projY, s * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // Faint translucent tint on front-facing faces
        for (let f = 0; f < 6; f++) {
          const face = CUBE_FACES[f];
          const v0 = rotVerts[face[0]];
          const v1 = rotVerts[face[1]];
          const v2 = rotVerts[face[2]];
          const ax = v1[0] - v0[0];
          const ay = v1[1] - v0[1];
          const bx = v2[0] - v0[0];
          const by = v2[1] - v0[1];
          const nz = ax * by - ay * bx;
          if (nz >= 0) continue;

          ctx.beginPath();
          ctx.moveTo(screenVerts[face[0]][0], screenVerts[face[0]][1]);
          ctx.lineTo(screenVerts[face[1]][0], screenVerts[face[1]][1]);
          ctx.lineTo(screenVerts[face[2]][0], screenVerts[face[2]][1]);
          ctx.lineTo(screenVerts[face[3]][0], screenVerts[face[3]][1]);
          ctx.closePath();
          ctx.fillStyle = rgbStr(baseRgb, depthAlpha * 0.11);
          ctx.fill();
        }

        // Glowing crisp wireframe edges
        ctx.strokeStyle = rgbStr(mixRgb(baseRgb, whiteRgb, 0.32), depthAlpha * 0.82);
        ctx.lineWidth = Math.max(0.8, Math.min(2.0, s * 0.065));
        ctx.beginPath();
        for (let e = 0; e < 12; e++) {
          const [i0, i1] = CUBE_EDGES[e];
          ctx.moveTo(screenVerts[i0][0], screenVerts[i0][1]);
          ctx.lineTo(screenVerts[i1][0], screenVerts[i1][1]);
        }
        ctx.stroke();

        // Inner bright data-packet core
        const coreR = Math.max(1.5, s * 0.22 * pulse);
        ctx.fillStyle = rgbStr(whiteRgb, depthAlpha * 0.92);
        ctx.beginPath();
        ctx.arc(projX, projY, coreR, 0, Math.PI * 2);
        ctx.fill();
        return;
      }

      // Solid or Glass 3D shaded cube (back-face culled with directional lighting)
      const isGlass = c.type === 'glass';
      const faceAlpha = isGlass ? depthAlpha * 0.42 : depthAlpha * 0.84;

      for (let f = 0; f < 6; f++) {
        const face = CUBE_FACES[f];
        const v0 = rotVerts[face[0]];
        const v1 = rotVerts[face[1]];
        const v2 = rotVerts[face[2]];

        // Edge vectors for face normal
        const ux = v1[0] - v0[0];
        const uy = v1[1] - v0[1];
        const uz = v1[2] - v0[2];
        const vx = v2[0] - v0[0];
        const vy = v2[1] - v0[1];
        const vz = v2[2] - v0[2];

        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;

        // Back-face cull (camera looks toward +Z, visible faces have nz < 0)
        if (nz >= 0) continue;

        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;

        // Directional diffuse + subtle ambient
        const ndl = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2]);
        let faceColor;
        if (ndl > 0.62) {
          faceColor = mixRgb(leftRgb, whiteRgb, (ndl - 0.62) * 0.72);
        } else if (ndl > 0.28) {
          faceColor = mixRgb(midRgb, leftRgb, (ndl - 0.28) / 0.34);
        } else {
          faceColor = mixRgb(deepRgb, rightRgb, ndl / 0.28);
        }

        ctx.beginPath();
        ctx.moveTo(screenVerts[face[0]][0], screenVerts[face[0]][1]);
        ctx.lineTo(screenVerts[face[1]][0], screenVerts[face[1]][1]);
        ctx.lineTo(screenVerts[face[2]][0], screenVerts[face[2]][1]);
        ctx.lineTo(screenVerts[face[3]][0], screenVerts[face[3]][1]);
        ctx.closePath();

        ctx.fillStyle = rgbStr(faceColor, faceAlpha);
        ctx.fill();

        // Crisp luminous rim edge on each visible face
        ctx.strokeStyle = rgbStr(
          mixRgb(leftRgb, whiteRgb, isGlass ? 0.45 : 0.25),
          depthAlpha * (isGlass ? 0.68 : 0.42)
        );
        ctx.lineWidth = Math.max(0.7, Math.min(1.8, s * 0.05));
        ctx.stroke();
      }
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const startTime = performance.now();
    let lastTs = startTime;

    function frame(now) {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      const elapsed = (now - startTime) / 1000;

      const silk = getSilkPaletteTokens(colorRef.current);
      const leftRgb = hexToRgb(silk.left);
      const midRgb = hexToRgb(silk.mid);
      const rightRgb = hexToRgb(silk.right);
      const deepRgb = hexToRgb(silk.duneMid);
      const palette = { leftRgb, midRgb, rightRgb, deepRgb };

      // Dive-to-cruise velocity curve (synced after SilkWave surface breach at ~1.35s):
      // 0.0s - 1.3s: Building momentum right behind the surface breach
      // 1.3s - 2.75s: Full high-speed rush through dense 3D data cubes
      // 2.75s - 3.7s+: Smooth deceleration into serene weightless hover behind the welcome message
      let speed;
      let surgeFactor;
      if (prefersReduced) {
        speed = 35;
        surgeFactor = 0.08;
      } else if (elapsed < 1.25) {
        const k = Math.min(1, elapsed / 1.25);
        speed = 340 + 680 * (k * k);
        surgeFactor = 0.35 + 0.65 * k;
      } else if (elapsed < 2.65) {
        speed = 1040;
        surgeFactor = 1.0;
      } else {
        const decelT = Math.min(1, (elapsed - 2.65) / 1.15);
        const easeOut = 1 - Math.pow(1 - decelT, 3);
        speed = 1040 - (1040 - 115) * easeOut;
        surgeFactor = 1.0 - easeOut * 0.85;
      }

      // 1. Deep luminous abyss background matched to active theme
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85);
      bgGrad.addColorStop(0, rgbStr(mixRgb([4, 7, 16], deepRgb, 0.45), 1));
      bgGrad.addColorStop(0.52, rgbStr(mixRgb([3, 5, 12], deepRgb, 0.22), 1));
      bgGrad.addColorStop(1, '#020308');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Central atmospheric stream bloom
      const bloomRadius = Math.max(w, h) * (0.48 + surgeFactor * 0.18);
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, bloomRadius);
      centerGlow.addColorStop(0, rgbStr(leftRgb, 0.14 + surgeFactor * 0.14));
      centerGlow.addColorStop(0.4, rgbStr(midRgb, 0.07 + surgeFactor * 0.07));
      centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, w, h);

      // 2. Flowing translucent neon stream ribbons (continuing the SilkWave stream feel)
      drawStreamCurrents(elapsed, leftRgb, midRgb, rightRgb, surgeFactor);

      // 3. Micro data voxels & subtle dive streaks
      for (let i = 0; i < voxels.length; i++) {
        const v = voxels[i];
        v.z -= speed * v.speedMul * dt;
        if (v.z <= MIN_Z) {
          spawnVoxel(v, false);
          continue;
        }

        const scale = FOV / v.z;
        const swayY = Math.sin(elapsed * 1.4 + v.phase + v.z * 0.003) * 18;
        const px = cx + v.ox * scale;
        const py = cy + (v.oy + swayY) * scale;

        if (px < -40 || px > w + 40 || py < -40 || py > h + 40) continue;

        let zAlpha = 1;
        if (v.z > MAX_Z - 320) zAlpha = (MAX_Z - v.z) / 320;
        else if (v.z < 180) zAlpha = (v.z - MIN_Z) / (180 - MIN_Z);
        const alpha = Math.max(0, Math.min(1, v.alpha * zAlpha));
        const sz = Math.max(1.1, v.size * scale);

        // Motion trail during high-speed dive surge
        if (surgeFactor > 0.25 && !prefersReduced) {
          const prevZ = Math.min(MAX_Z, v.z + speed * v.speedMul * dt * (1.8 + surgeFactor * 2.4));
          const pScale = FOV / prevZ;
          const ppx = cx + v.ox * pScale;
          const ppy = cy + (v.oy + swayY) * pScale;
          ctx.strokeStyle = rgbStr(leftRgb, alpha * 0.32 * surgeFactor);
          ctx.lineWidth = Math.max(0.8, sz * 0.55);
          ctx.beginPath();
          ctx.moveTo(ppx, ppy);
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        // Crisp glowing micro cube/diamond
        ctx.fillStyle = rgbStr(mixRgb(midRgb, leftRgb, 0.55), alpha * 0.85);
        ctx.fillRect(px - sz * 0.5, py - sz * 0.5, sz, sz);
      }

      // 4. Update & depth-sort 3D Data Cubes (back-to-front painter's algorithm)
      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];
        c.z -= speed * c.speedMul * dt;
        if (c.z <= MIN_Z) {
          spawnCube(c, false);
          continue;
        }
        c.rx += c.vrx * dt;
        c.ry += c.vry * dt;
        c.rz += c.vrz * dt;
      }

      cubes.sort((a, b) => b.z - a.z);

      // Track mid-depth projected centers for subtle IoT mesh links
      const linkNodes = [];

      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];
        const scale = FOV / c.z;
        const driftX = Math.cos(elapsed * 0.9 + c.phase + c.z * 0.0025) * (c.driftAmp * 0.55);
        const driftY = Math.sin(elapsed * 1.15 + c.phase + c.z * 0.003) * c.driftAmp;

        const px = cx + (c.ox + driftX) * scale;
        const py = cy + (c.oy + driftY) * scale;

        // Cull far off-screen cubes
        const margin = c.size * scale * 2.5 + 30;
        if (px < -margin || px > w + margin || py < -margin || py > h + margin) continue;

        let zAlpha = 1;
        if (c.z > MAX_Z - 360) zAlpha = (MAX_Z - c.z) / 360;
        else if (c.z < 190) zAlpha = (c.z - MIN_Z) / (190 - MIN_Z);
        zAlpha = Math.max(0, Math.min(1, zAlpha));

        if (c.z > 320 && c.z < 1150 && linkNodes.length < 34) {
          linkNodes.push({ x: px, y: py, alpha: zAlpha });
        }

        drawSingleCube(c, px, py, scale, zAlpha, elapsed, palette);
      }

      // 5. Delicate IoT telemetry links between nearby mid-depth data cubes
      if (linkNodes.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 0.85;
        const maxDist = Math.min(w, h) * 0.2;
        for (let i = 0; i < linkNodes.length; i++) {
          const a = linkNodes[i];
          for (let j = i + 1; j < linkNodes.length; j++) {
            const b = linkNodes[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < maxDist) {
              const linkAlpha = (1 - dist / maxDist) * Math.min(a.alpha, b.alpha) * 0.22;
              ctx.strokeStyle = rgbStr(leftRgb, linkAlpha);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ display: 'block', background: '#020308' }}
      aria-hidden="true"
    />
  );
}

