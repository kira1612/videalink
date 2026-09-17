import React, { useEffect, useRef } from 'react';

export default function ParticleTunnel() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w, h, dpr, cx, cy;
    let particles = [];
    let animationFrameId;

    // One exact solid color per theme (Blue, Gold, Red, Green, Purple)
    const PALETTES = [
      ['#0071e3'], // Blue
      ['#f5a623'], // Gold
      ['#ff3b30'], // Red
      ['#34c759'], // Green
      ['#af52de']  // Purple
    ];
    let paletteIndex = 0;
    let PALETTE = PALETTES[0];
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // Helper to draw a true 3D isometric cube on the 2D canvas
    function drawCube(ctx, x, y, size, colorHex, alpha) {
      const s = size * 1.5; // Scale up slightly to match flat square sizing visually
      const dx = s * 0.866; // cos(30)
      const dy = s * 0.5;   // sin(30)

      // TOP FACE (Brightest)
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + dx, y - dy);
      ctx.lineTo(x, y);
      ctx.lineTo(x - dx, y - dy);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.2;
      ctx.fill(); // Add highlight

      // LEFT FACE (Medium shadow)
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - dx, y + dy);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = alpha * 0.3;
      ctx.fill(); // Add shadow

      // RIGHT FACE (Darkest shadow)
      ctx.fillStyle = colorHex;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y - dy);
      ctx.lineTo(x + dx, y + dy);
      ctx.lineTo(x, y + s);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = alpha * 0.6;
      ctx.fill(); // Add deeper shadow
    }

    const MAX_Z = 500;
    const SLOW_SPEED = 10;
    const FAST_SPEED = 30;
    let targetSpeed = SLOW_SPEED;
    let currentSpeed = SLOW_SPEED;
    let idleTimer = null;

    function onInteract() {
      targetSpeed = FAST_SPEED;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { targetSpeed = SLOW_SPEED; }, 1000);
    }

    function resize() {
      // DPR 1 for performance on high-res displays, especially with thousands of particles
      dpr = 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      initParticles();
    }

    const INNER_RADIUS = 350; // The dark hole in the middle, enlarged

    function spawn(p, initial = false) {
      const angle = Math.random() * Math.PI * 2;

      // 75% chance to spawn exactly on the inner ring boundary to form a sharp circle
      const isRing = Math.random() < 0.75;

      let radius;
      if (isRing) {
        radius = INNER_RADIUS + Math.random() * 15; // Thick, intensely dense band
      } else {
        // Power of 4 distribution for the remaining particles spreading outwards
        radius = INNER_RADIUS + 5 + Math.pow(Math.random(), 4) * Math.max(w, h) * 0.8;
      }

      p.ox = Math.cos(angle) * radius;
      p.oy = Math.sin(angle) * radius;
      p.z = initial ? Math.random() * MAX_Z : MAX_Z;

      // Particles closer to center are slightly smaller, outer particles are larger
      const dist = radius - INNER_RADIUS;
      const sizeScale = Math.min(1, dist / 500);

      // Center particles remain small (base 1.5 to 3.5)
      // Outer particles get MASSIVELY larger base sizes (up to 40+)
      p.r = 1.5 + (sizeScale * 4.0) + (Math.random() * (2.0 + sizeScale * 35.0));

      p.color = pick(PALETTE);
      p.alpha = Math.random() * 0.7 + 0.3; // Base alpha for twinkling
    }

    function initParticles() {
      // Reduced particle count to guarantee a buttery-smooth 60fps on all devices
      const count = Math.min(6000, Math.round((w * h) / 120));
      particles = new Array(count).fill(0).map(() => {
        const p = {};
        spawn(p, true);
        return p;
      });
    }

    function project(ox, oy, z) {
      // Lower perspective value makes the size shrink much faster in the distance
      const perspective = 150;
      const scale = perspective / (z + perspective);
      return {
        x: cx + ox * scale,
        y: cy + oy * scale,
        scale
      };
    }

    let lastTs = 0;
    function frame(ts) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;

      currentSpeed += (targetSpeed - currentSpeed) * Math.min(1, dt * 1.5);
      const speed = reduceMotion ? SLOW_SPEED * 0.2 : currentSpeed;

      // Solid black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // Fast Ambient Glow Effect (Efek Cahaya)
      const currentColor = PALETTE[0];
      const r = parseInt(currentColor.slice(1, 3), 16);
      const g = parseInt(currentColor.slice(3, 5), 16);
      const b = parseInt(currentColor.slice(5, 7), 16);
      const glow = ctx.createRadialGradient(cx, cy, INNER_RADIUS * 0.5, cx, cy, INNER_RADIUS * 2.5);
      glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Add a slow, elegant rotation to the entire nebula
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ts * 0.00005);
      ctx.translate(-cx, -cy);

      for (const p of particles) {
        p.z -= speed * dt;
        if (p.z <= 10) {
          spawn(p);
          continue;
        }

        const cur = project(p.ox, p.oy, p.z);
        const size = Math.max(0.1, cur.scale * p.r);

        // Smooth fade in and fade out based on depth (Z)
        let zAlpha = 1;
        if (p.z > MAX_Z - 100) {
          zAlpha = (MAX_Z - p.z) / 100; // fade in at the back
        } else if (p.z < 100) {
          zAlpha = p.z / 100; // fade out near camera
        }

        ctx.fillStyle = p.color;
        // Combine base particle alpha with Z depth alpha
        const finalAlpha = Math.max(0, Math.min(1, p.alpha * zAlpha));

        // If the particle is large enough, render it as a true 3D isometric cube.
        // Raised the threshold to 4.5 to minimize expensive 3D draws and ensure smooth FPS.
        if (size > 4.5) {
          drawCube(ctx, cur.x, cur.y, size, p.color, finalAlpha);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = finalAlpha;
          ctx.fillRect(cur.x - size, cur.y - size, size * 2, size * 2);
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(frame);
    }

    const onClick = () => {
      paletteIndex = (paletteIndex + 1) % PALETTES.length;
      PALETTE = PALETTES[paletteIndex];
      for (const p of particles) p.color = pick(PALETTE);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('click', onClick);
    window.addEventListener('mousemove', onInteract);
    window.addEventListener('touchstart', onInteract, { passive: true });
    window.addEventListener('touchmove', onInteract, { passive: true });

    resize();
    animationFrameId = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('touchmove', onInteract);
      cancelAnimationFrame(animationFrameId);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ display: 'block', background: '#000000' }}
    />
  );
}
