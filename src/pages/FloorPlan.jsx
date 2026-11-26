import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useCursor, RoundedBox, Environment, ContactShadows, TransformControls, Text, Line } from '@react-three/drei';
import {
  Box as BoxIcon, Info, Edit3, Check, X, MousePointerClick, Cpu, Activity, Power,
  Move, Maximize, RotateCcw, PlusSquare, Trash2, Save, MousePointer2, Eraser, Copy,
  Camera, Trash, Maximize2, Minimize2, Layers, Eye, EyeOff, Square, CheckSquare,
  FolderPlus, FolderOpen, ChevronLeft, ChevronRight, ChevronDown, Hand, ZoomIn, ZoomOut,
  Undo2, Redo2, User, Download, Upload, Image as ImageIcon, Compass, Sparkles, Grid,
  Ruler, Lightbulb, Pin, Settings, Search, Lock, Unlock, Palette, Sun, MapPin, Type, DoorOpen,
  Home, Menu, HelpCircle, SlidersHorizontal, Armchair, Heart, LayoutGrid
} from 'lucide-react';
import { devicesApi, mqttApi } from '../services/api';
import { getUserScopedKey } from '../utils/dashboardPrefs';
import Swal from 'sweetalert2';

/* ─────────────────────────────────────────────────────────────────────────
   Architectural Wall Material Presets (PBR Studio Look)
───────────────────────────────────────────────────────────────────────── */
export const WALL_MATERIALS = {
  matte_slate: {
    id: 'matte_slate',
    label: 'Warm White Wall',
    color: '#e6e4e0',
    hoverColor: '#f1f0ec',
    swatch: '#e6e4e0',
    roughness: 0.65,
    metalness: 0.04,
    opacity: 1,
  },
  accent_espresso: {
    id: 'accent_espresso',
    label: 'Espresso Accent',
    color: '#3d2622',
    hoverColor: '#4f322d',
    swatch: '#3d2622',
    roughness: 0.58,
    metalness: 0.05,
    opacity: 1,
  },
  concrete_white: {
    id: 'concrete_white',
    label: 'Soft Pearl Grey',
    color: '#d6d9df',
    hoverColor: '#e2e5eb',
    swatch: '#d6d9df',
    roughness: 0.55,
    metalness: 0.05,
    opacity: 1,
  },
  glass_frosted: {
    id: 'glass_frosted',
    label: 'Glass Partition',
    color: '#cbd5e1',
    hoverColor: '#e2e8f0',
    swatch: '#94a3b8',
    roughness: 0.12,
    metalness: 0.15,
    opacity: 0.24,
  },
  dark_obsidian: {
    id: 'dark_obsidian',
    label: 'Charcoal Slate',
    color: '#475569',
    hoverColor: '#64748b',
    swatch: '#475569',
    roughness: 0.5,
    metalness: 0.12,
    opacity: 1,
  },
  warm_wood: {
    id: 'warm_wood',
    label: 'Warm Oak Panel',
    color: '#b89068',
    hoverColor: '#c9a178',
    swatch: '#b89068',
    roughness: 0.52,
    metalness: 0.06,
    opacity: 1,
  },
};

export const FLOOR_MATERIALS = {
  warm_oak: { id: 'warm_oak', label: 'Parket Kayu Oak', color: '#bfa074', lineColor: '#a8895e' },
  light_birch: { id: 'light_birch', label: 'Kayu Birch Terang', color: '#d8c3a5', lineColor: '#c2ab8b' },
  marble_cream: { id: 'marble_cream', label: 'Marmer Krem', color: '#e8e6e1', lineColor: '#d5d2cb' },
  slate_tile: { id: 'slate_tile', label: 'Granit Abu Muda', color: '#cbd0d8', lineColor: '#b5bcc7' },
};

function getWallMatProps(wall, isSelected, hovered) {
  const isGlass = wall?.type === 'glass_wall' || wall?.materialPreset === 'glass_frosted';
  const presetKey = isGlass ? 'glass_frosted' : (wall?.materialPreset || 'matte_slate');
  const preset = WALL_MATERIALS[presetKey] || WALL_MATERIALS.matte_slate;
  const baseColor = wall?.customColor || preset.color;
  const hColor = wall?.customColor || preset.hoverColor;
  const baseOpacity = wall?.opacity !== undefined ? wall.opacity : preset.opacity;

  return {
    color: isSelected ? '#3b82f6' : (hovered ? hColor : baseColor),
    roughness: preset.roughness,
    metalness: preset.metalness,
    transparent: true,
    opacity: isSelected ? Math.min(0.88, Math.max(0.45, baseOpacity)) : baseOpacity,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Theme Detection Hook (Light / Dark Mode reactive)
───────────────────────────────────────────────────────────────────────── */
function useIsLightMode() {
  const [isLight, setIsLight] = useState(() => {
    try {
      if (typeof document !== 'undefined') {
        return document.documentElement.getAttribute('data-mode') === 'light';
      }
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const update = () => {
      try {
        const light = document.documentElement.getAttribute('data-mode') === 'light';
        setIsLight(light);
      } catch {}
    };
    update();
    window.addEventListener('theme-updated', update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => {
      window.removeEventListener('theme-updated', update);
      observer.disconnect();
    };
  }, []);

  return isLight;
}

/* ─────────────────────────────────────────────────────────────────────────
   Third Person Avatar (Jelajah Mode)
───────────────────────────────────────────────────────────────────────── */
function ThirdPersonAvatar({ orbitRef, walls, isExploreMode = false }) {
  const avatarRef = useRef();
  const pos = useRef([0.4, 0, 1.35]);
  const rot = useRef(Math.PI);
  const walkTime = useRef(0);
  
  const legL = useRef();
  const legR = useRef();
  const armL = useRef();
  const armR = useRef();
  
  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = true;
      if (e.key === 'shift') keys.current.shift = true;
    };
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) keys.current[key] = false;
      if (e.key === 'shift') keys.current.shift = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (orbitRef.current && isExploreMode) {
      orbitRef.current.maxPolarAngle = Math.PI / 2 - 0.05;
      orbitRef.current.minDistance = 2; 
      orbitRef.current.maxDistance = 8;
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (orbitRef.current) {
        orbitRef.current.minDistance = 2;
        orbitRef.current.maxDistance = 200;
        orbitRef.current.maxPolarAngle = Math.PI / 2.1;
      }
    };
  }, [orbitRef, isExploreMode]);

  useFrame((state, delta) => {
    if (!avatarRef.current) return;
    
    const speed = keys.current.shift ? 7 : 3.5;
    
    let moveX = 0;
    let moveZ = 0;
    
    if (keys.current.w) moveZ = -1;
    if (keys.current.s) moveZ = 1;
    if (keys.current.a) moveX = -1;
    if (keys.current.d) moveX = 1;
    
    if (moveX !== 0 || moveZ !== 0) {
      // Normalisasi arah agar tidak lebih cepat saat diagonal
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;
      
      // Ambil arah kamera saat ini
      const cam = state.camera;
      const camAngle = Math.atan2(cam.position.x - pos.current[0], cam.position.z - pos.current[2]);
      
      // Arah gerak relatif terhadap kamera
      const moveAngle = camAngle + Math.atan2(moveX, moveZ);
      
      // Rotasi karakter secara halus ke arah gerak
      let rotDiff = moveAngle - rot.current;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      
      rot.current += rotDiff * 12 * delta;
      avatarRef.current.rotation.y = rot.current;
      
      const dx = Math.sin(moveAngle) * speed * delta;
      const dz = Math.cos(moveAngle) * speed * delta;
      
      // Collision Detection Sederhana
      let nextX = pos.current[0] + dx;
      let nextZ = pos.current[2] + dz;
      const avatarRadius = 0.35;
      
      if (walls) {
        const checkCollision = (px, pz) => {
          for (const w of walls) {
            if (w.hidden || w.type === 'text_label') continue;
            
            const checkRect = (cx, cz, sx, sz, rotY) => {
              const distX = px - cx;
              const distZ = pz - cz;
              const localX = distX * Math.cos(-rotY) - distZ * Math.sin(-rotY);
              const localZ = distX * Math.sin(-rotY) + distZ * Math.cos(-rotY);
              return Math.abs(localX) < (sx / 2 + avatarRadius) && Math.abs(localZ) < (sz / 2 + avatarRadius);
            };

            if (w.type === 'custom_group' && w.children) {
              const groupRot = w.rotation?.[1] || 0;
              for (const c of w.children) {
                 if (c.hidden || c.type?.startsWith('door_wall')) continue;
                 const cx = (w.position?.[0]||0) + c.position[0];
                 const cz = (w.position?.[2]||0) + c.position[2];
                 const rotY = groupRot + (c.rotation?.[1] || 0);
                 const sx = (w.scale?.[0]||1) * c.scale[0];
                 const sz = (w.scale?.[2]||1) * c.scale[2];
                 if (checkRect(cx, cz, sx, sz, rotY)) return true;
              }
            } else if (w.type === 'wall') {
              if (checkRect(w.position[0], w.position[2], w.scale[0], w.scale[2], w.rotation?.[1] || 0)) return true;
            }
          }
          return false;
        };

        if (checkCollision(nextX, nextZ)) {
           // Sliding
           if (!checkCollision(nextX, pos.current[2])) nextZ = pos.current[2];
           else if (!checkCollision(pos.current[0], nextZ)) nextX = pos.current[0];
           else { nextX = pos.current[0]; nextZ = pos.current[2]; }
        }
      }
      
      pos.current[0] = nextX;
      pos.current[2] = nextZ;
      
      // Animasi Berjalan
      walkTime.current += delta * speed * 2.5;
      const walkAnim = Math.sin(walkTime.current);
      if (legL.current) legL.current.rotation.x = walkAnim * 0.6;
      if (legR.current) legR.current.rotation.x = -walkAnim * 0.6;
      if (armL.current) armL.current.rotation.x = -walkAnim * 0.6;
      if (armR.current) armR.current.rotation.x = walkAnim * 0.6;
    } else {
      // Kembali ke pose berdiri santai
      walkTime.current = 0;
      if (legL.current) legL.current.rotation.x *= 0.8;
      if (legR.current) legR.current.rotation.x *= 0.8;
      if (armL.current) armL.current.rotation.x *= 0.8;
      if (armR.current) armR.current.rotation.x *= 0.8;
    }
    
    avatarRef.current.position.x = pos.current[0];
    avatarRef.current.position.z = pos.current[2];
    
    if (orbitRef.current && isExploreMode) {
      const target = orbitRef.current.target;
      target.x += (pos.current[0] - target.x) * 0.2;
      target.z += (pos.current[2] - target.z) * 0.2;
      target.y = 1.0;
      orbitRef.current.update();
    }
  });

  // HomeByMe Architectural Mannequin Avatar + White Floor Compass Pad with 4 Directional Arrows
  return (
    <group ref={avatarRef} position={[0.4, 0, 1.35]}>
      {/* ── HomeByMe Floor Navigation Pad (White Disc + Crosshairs + 4 Outer Arrow Triangles) ── */}
      <group position={[0, 0.03, 0]}>
        {/* Outer subtle shadow ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <circleGeometry args={[0.52, 40]} />
          <meshBasicMaterial color="#1e293b" transparent opacity={0.18} />
        </mesh>
        {/* Main white disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 40]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Blue ring border */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[0.43, 0.47, 40]} />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>
        {/* Blue crosshairs inside disc */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[0.72, 0.045]} />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
          <planeGeometry args={[0.045, 0.72]} />
          <meshBasicMaterial color="#60a5fa" />
        </mesh>

        {/* 4 Outer Directional Arrow Triangles (North, South, East, West) */}
        {[
          { pos: [0, 0.004, -0.78], rotZ: 0 },
          { pos: [0, 0.004, 0.78], rotZ: Math.PI },
          { pos: [0.78, 0.004, 0], rotZ: -Math.PI / 2 },
          { pos: [-0.78, 0.004, 0], rotZ: Math.PI / 2 },
        ].map((arr, idx) => (
          <group key={idx} position={arr.pos} rotation={[-Math.PI / 2, 0, arr.rotZ]}>
            {/* Dark outline triangle */}
            <mesh position={[0, 0, -0.001]}>
              <circleGeometry args={[0.25, 3]} />
              <meshBasicMaterial color="#334155" />
            </mesh>
            {/* Crisp white inner triangle */}
            <mesh>
              <circleGeometry args={[0.19, 3]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Sculpted Human Figure (Periwinkle Sweater, Charcoal Trousers, White Head) ── */}
      {/* Left Leg */}
      <group ref={legL} position={[-0.12, 0.88, 0]}>
        <RoundedBox args={[0.18, 0.84, 0.19]} position={[0, -0.42, 0]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color="#525866" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.19, 0.1, 0.26]} position={[0, -0.82, 0.03]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </RoundedBox>
      </group>
      {/* Right Leg */}
      <group ref={legR} position={[0.12, 0.88, 0]}>
        <RoundedBox args={[0.18, 0.84, 0.19]} position={[0, -0.42, 0]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color="#525866" roughness={0.6} />
        </RoundedBox>
        <RoundedBox args={[0.19, 0.1, 0.26]} position={[0, -0.82, 0.03]} radius={0.04} smoothness={4}>
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </RoundedBox>
      </group>

      {/* Torso (Periwinkle Blue Top) */}
      <RoundedBox args={[0.46, 0.72, 0.24]} position={[0, 1.24, 0]} radius={0.11} smoothness={4} castShadow>
        <meshStandardMaterial color="#8397c7" roughness={0.5} />
      </RoundedBox>

      {/* Left Arm */}
      <group ref={armL} position={[-0.31, 1.52, 0]}>
        <RoundedBox args={[0.15, 0.64, 0.16]} position={[0, -0.28, 0]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#8397c7" roughness={0.5} />
        </RoundedBox>
      </group>
      {/* Right Arm */}
      <group ref={armR} position={[0.31, 1.52, 0]}>
        <RoundedBox args={[0.15, 0.64, 0.16]} position={[0, -0.28, 0]} radius={0.07} smoothness={4} castShadow>
          <meshStandardMaterial color="#8397c7" roughness={0.5} />
        </RoundedBox>
      </group>

      {/* Neck & Sculpted White Mannequin Head */}
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.14, 20]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.84, 0]} scale={[0.88, 1.08, 0.94]} castShadow>
        <sphereGeometry args={[0.19, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
}


/* ─────────────────────────────────────────────────────────────────────────
   Smart Device Node 
───────────────────────────────────────────────────────────────────────── */
function SmartDeviceNode({ device, position, isEditMode, isSelected, onClick, onNodeClick, isCapturing }) {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  useCursor(hovered);

  // Buat data dummy secara acak yang statis selama node ini hidup (hanya untuk demo)
  const dummyMetrics = React.useMemo(() => {
    // Sesuaikan dummy berdasarkan tipe atau berikan default
    const isSensor = device.type?.toLowerCase().includes('sensor') || device.name?.toLowerCase().includes('sensor');
    const isLight = device.type?.toLowerCase().includes('light') || device.name?.toLowerCase().includes('lampu');
    
    if (isSensor) {
      return [
        { label: 'Suhu', value: (22 + Math.random() * 8).toFixed(1) + ' °C' },
        { label: 'Lembab', value: Math.floor(45 + Math.random() * 20) + ' %' },
        { label: 'Baterai', value: Math.floor(60 + Math.random() * 40) + ' %' }
      ];
    } else if (isLight) {
      return [
        { label: 'Daya', value: Math.floor(8 + Math.random() * 12) + ' W' },
        { label: 'Arus', value: (0.1 + Math.random() * 0.2).toFixed(2) + ' A' },
        { label: 'Baterai', value: 'AC' }
      ];
    }
    // Default / Saklar / Lainnya
    return [
      { label: 'Tegangan', value: Math.floor(215 + Math.random() * 10) + ' V' },
      { label: 'Daya', value: Math.floor(10 + Math.random() * 100) + ' W' },
      { label: 'Ping', value: Math.floor(15 + Math.random() * 50) + ' ms' }
    ];
  }, [device]);

  const status = device.status === 'online';
  const ripple1 = useRef();
  const ripple2 = useRef();
  const ripple3 = useRef();
  
  useFrame(({ clock }) => {
    if (status) {
      const t = clock.elapsedTime;
      const speed = 1.0;
      const maxScale = 4; // Bikin gelombang lebih besar
      
      const p1 = (t * speed) % maxScale;
      if (ripple1.current) {
        ripple1.current.scale.setScalar(1 + p1);
        ripple1.current.material.opacity = Math.max(0, 0.3 * (1 - (p1 / maxScale)));
      }
      
      const p2 = ((t * speed) + (maxScale / 3)) % maxScale;
      if (ripple2.current) {
        ripple2.current.scale.setScalar(1 + p2);
        ripple2.current.material.opacity = Math.max(0, 0.3 * (1 - (p2 / maxScale)));
      }
      
      const p3 = ((t * speed) + (maxScale / 3 * 2)) % maxScale;
      if (ripple3.current) {
        ripple3.current.scale.setScalar(1 + p3);
        ripple3.current.material.opacity = Math.max(0, 0.3 * (1 - (p3 / maxScale)));
      }
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (isEditMode) {
      onClick(); 
    } else {
      setShowPopup(!showPopup);
      onNodeClick && onNodeClick();
    }
  };

  const toggleDevice = async () => {
    const newStatus = status ? 'offline' : 'online';
    const topic = device.broker_config?.topic || `device/${device.id}/command`;
    mqttApi.publish(topic, newStatus === 'online' ? 'ON' : 'OFF').catch(console.error);
  };

  const liveMetricLabel = React.useMemo(() => {
    try {
      const res = device?.resources || {};
      const keys = Object.keys(res);
      if (keys.length > 0) {
        const k = keys[0];
        const v = res[k];
        if (v !== undefined && v !== null && v !== '') {
          const unit = k.toLowerCase().includes('temp') || k.toLowerCase().includes('suhu') ? '°C'
            : k.toLowerCase().includes('hum') || k.toLowerCase().includes('lembab') ? '%' : '';
          return `${v}${unit}`;
        }
      }
    } catch {}
    return dummyMetrics?.[0]?.value?.replace(/\s+/g, '') || '24.5°C';
  }, [device, dummyMetrics]);

  return (
    <group position={position}>
      {/* 3D Concentric Cyan Sonar Rings on Floor + Subtle Pulse Sphere */}
      {status && (
        <group position={[0, -0.35, 0]}>
          {/* Static & pulsing floor rings like CAD reference */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.36, 0.42, 40]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} side={2} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <ringGeometry args={[0.68, 0.73, 40]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.32} side={2} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[1.05, 1.09, 40]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} side={2} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <circleGeometry args={[1.08, 40]} />
            <meshBasicMaterial color="#0ea5e9" transparent opacity={0.10} side={2} depthWrite={false} />
          </mesh>
          <mesh ref={ripple1} position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
          <mesh ref={ripple2} position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
          <mesh ref={ripple3} position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
        </group>
      )}
      
      <mesh 
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow={!isCapturing}
        scale={isCapturing ? [2.5, 0.1, 2.5] : [1, 0.45, 1]}
      >
        {isCapturing ? <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} /> : <cylinderGeometry args={[0.24, 0.28, 0.28, 32]} />}
        {isCapturing ? (
          <meshBasicMaterial color={status ? '#0ea5e9' : '#475569'} />
        ) : (
          <meshStandardMaterial 
            color={isSelected ? '#f59e0b' : (status ? '#38bdf8' : '#475569')} 
            emissive={isSelected ? '#f59e0b' : (status ? '#0ea5e9' : '#000000')}
            emissiveIntensity={status || isSelected ? 1.8 : 0}
            roughness={0.2}
            metalness={0.75}
          />
        )}
      </mesh>

      <Text 
        position={[0, 0.1, 1.2]} 
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.8} 
        color="#000000" 
        anchorX="center" 
        anchorY="middle" 
        fontWeight="bold"
        visible={isCapturing}
      >
        {device.name}
      </Text>

      {status && !isCapturing && <pointLight position={[0, 1.6, 0]} intensity={1.4} color="#38bdf8" distance={6} castShadow />}

      {isSelected && (
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.52, 32]} />
          <meshBasicMaterial color="#f59e0b" side={2} />
        </mesh>
      )}

      {!showPopup && (
        <Html position={[0, 0.35, 0]} zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center pointer-events-none select-none" style={{ transform: 'translate(-50%, -100%)', width: 'max-content' }}>
            <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border font-bold text-[11px] whitespace-nowrap shadow-xl flex items-center gap-1.5 transition-colors ${hovered ? 'bg-slate-950/95 border-cyan-400 text-white' : 'bg-slate-950/85 border-cyan-500/45 text-slate-100'}`}>
              <span className={`w-2 h-2 rounded-full ${status ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-500'}`} />
              <span>{device.name}</span>
              {status && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-300 font-mono text-[10.5px]">{liveMetricLabel}</span>
                </>
              )}
            </div>
            <div className="w-px h-5" style={{ background: 'linear-gradient(to bottom, rgba(56,189,248,0.85), rgba(56,189,248,0.1))' }} />
          </div>
        </Html>

      )}


      {showPopup && !isEditMode && (
        <Html position={[0, 0.8, 0]} center zIndexRange={[100, 10]}>
          <div className="w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-800/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">{device.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} className="text-slate-500 hover:text-slate-100"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-sm font-semibold text-slate-300">{status ? 'Online' : 'Offline'}</span>
              </div>
              
              {/* Data Bucket Widgets / Dummy Section */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/50">
                {(() => {
                  let popupWidgets = [];
                  try {
                    popupWidgets = (device.data_buckets || []).flatMap(b => {
                      let wArr = b.widgets || [];
                      if (typeof wArr === 'string') {
                        try { wArr = JSON.parse(wArr); } catch(e) { wArr = []; }
                      }
                      if (!Array.isArray(wArr)) wArr = [];
                      return wArr;
                    }).filter(w => w?.config?.showIn3D === true || w?.config?.showIn3D === 'true' || w?.config?.showIn3D === 1);
                  } catch (e) {
                    console.error("Error parsing popup widgets:", e);
                  }
                  
                  if (popupWidgets.length > 0) {
                    return popupWidgets.map((w, idx) => {
                      const rawVal = device.resources?.[w.field] ?? '-';
                      const displayValue = rawVal !== '-' ? `${rawVal} ${w.unit || ''}` : '-';
                      return (
                        <div key={idx} className="bg-slate-950/50 rounded-lg p-2.5 text-center border border-slate-800">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 truncate">{w.title || w.field}</div>
                          <div className="text-sm font-bold text-slate-200 truncate">{status ? displayValue : '-'}</div>
                        </div>
                      );
                    });
                  }

                  // Tampilkan fallback jika kosong
                  return (
                    <div className="col-span-2 bg-slate-950/50 rounded-lg p-3 text-center border border-rose-800/50">
                      <div className="text-xs text-rose-400 mb-1 font-bold uppercase tracking-wider">⚠️ Belum Ada Data</div>
                      <div className="text-[10px] text-slate-500 leading-relaxed">Centang "Tampilkan di 3D Room" pada widget di Data Buckets.</div>
                    </div>
                  );
                })()}
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); toggleDevice(); }}
                className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  status ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
              >
                <Power size={16} /> {status ? 'Matikan Perangkat' : 'Nyalakan Perangkat'}
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Wall Block Component (Supports Standard Wall, Glass Partition & HomeByMe Automatic Front-Wall Cutaway)
───────────────────────────────────────────────────────────────────────── */
const WallBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const groupRef = useRef();
  const matRef = useRef();
  const capMatRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const matProps = getWallMatProps(wall, isSelected, hovered);
  const isGlass = wall?.type === 'glass_wall' || wall?.materialPreset === 'glass_frosted';
  const worldPosVec = useRef(new THREE.Vector3());

  // HomeByMe Automatic Camera-Facing Wall Cutaway:
  // Perimeter walls on the camera-facing side of the room automatically become semi-transparent (0.24)
  useFrame(({ camera }) => {
    const g = (ref && ref.current) || groupRef.current;
    if (!g || !matRef.current || isGlass || wall?.opacity !== undefined) return;
    g.getWorldPosition(worldPosVec.current);
    const wx = worldPosVec.current.x;
    const wz = worldPosVec.current.z;
    const isOuterPerimeter = Math.abs(wx) > 3.2 || Math.abs(wz) > 3.2;
    if (!isOuterPerimeter) {
      matRef.current.opacity = isSelected ? 0.85 : 1;
      if (capMatRef.current) capMatRef.current.opacity = 1;
      return;
    }
    const camDot = wx * camera.position.x + wz * camera.position.z;
    const isCutaway = camDot > 22 && camera.position.y < 26;
    const targetOp = isSelected ? 0.78 : (isCutaway ? 0.22 : 1);
    matRef.current.opacity += (targetOp - matRef.current.opacity) * 0.18;
    matRef.current.depthWrite = matRef.current.opacity > 0.6;
    if (capMatRef.current) {
      capMatRef.current.opacity = isCutaway ? 0.35 : 1;
    }
  });

  const setCombinedRef = (node) => {
    groupRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <group 
      ref={setCombinedRef}
      position={wall.position} 
      rotation={wall.rotation} 
      scale={wall.scale}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <RoundedBox 
        args={[1, 1, 1]} 
        radius={0.02} 
        receiveShadow 
        castShadow={!isGlass}
      >
        <meshStandardMaterial ref={matRef} {...matProps} />
      </RoundedBox>
      {/* Crisp white architectural wall-top cap trim (HomeByMe signature detail) */}
      {!isGlass && (
        <mesh position={[0, 0.502, 0]}>
          <boxGeometry args={[1.004, 0.018, 1.02]} />
          <meshStandardMaterial ref={capMatRef} color="#ffffff" roughness={0.35} transparent opacity={1} />
        </mesh>
      )}
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   3D Interior Furniture & Architectural Props Block (HomeByMe Style)
   Supports modular single items & full suites so users can build from scratch:
   - Single items: queen_bed, foot_bench, nightstand, pendant_lamp, wall_art,
     wardrobe, vanity_table, wall_mirror, accent_chair, area_rug, curtain_drape,
     sofa_only, coffee_table, tv_console, indoor_plant
   - Suites: bed_suite, vanity_desk, sofa_suite
───────────────────────────────────────────────────────────────────────── */
const FurnitureBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const fType = wall.furnitureType || 'queen_bed';
  const selOutline = isSelected ? '#3b82f6' : null;
  const customTint = wall.customColor || null;

  return (
    <group
      ref={ref}
      position={wall.position}
      rotation={wall.rotation || [0, 0, 0]}
      scale={wall.scale || [1, 1, 1]}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* A. MODULAR QUEEN BED (Kasur Queen + Headboard + Bantal) */}
      {fType === 'queen_bed' && (
        <group>
          <RoundedBox args={[2.5, 1.55, 0.22]} position={[0, 0.78, -1.45]} radius={0.05} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#b5a392'} roughness={0.65} />
          </RoundedBox>
          <RoundedBox args={[2.36, 0.52, 2.75]} position={[0, 0.36, 0]} radius={0.08} castShadow receiveShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[2.46, 0.22, 2.85]} position={[0, 0.11, 0.02]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color={customTint || '#9e8e7e'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[1.0, 0.24, 0.45]} position={[-0.56, 0.72, -1.08]} rotation={[0.25, 0, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color={customTint || '#4e302c'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[1.0, 0.24, 0.45]} position={[0.56, 0.72, -1.08]} rotation={[0.25, 0, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color={customTint || '#4e302c'} roughness={0.6} />
          </RoundedBox>
        </group>
      )}

      {/* B. MODULAR FOOT BENCH (Bench Kaki Kasur) */}
      {fType === 'foot_bench' && (
        <RoundedBox args={[2.05, 0.48, 0.72]} position={[0, 0.26, 0]} radius={0.1} castShadow receiveShadow>
          <meshStandardMaterial color={selOutline || customTint || '#d9c6bc'} roughness={0.55} />
        </RoundedBox>
      )}

      {/* C. MODULAR NIGHTSTAND (Meja Nakas Samping) */}
      {fType === 'nightstand' && (
        <group>
          <RoundedBox args={[0.95, 0.56, 0.68]} position={[0, 0.28, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#5c636e'} roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[0.82, 0.18, 0.03]} position={[0, 0.36, 0.34]} radius={0.01}>
            <meshStandardMaterial color="#475569" roughness={0.4} />
          </RoundedBox>
        </group>
      )}

      {/* D. MODULAR HANGING PENDANT LAMP (Lampu Gantung Plafon) */}
      {fType === 'pendant_lamp' && (
        <group>
          <mesh position={[0, 2.75, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.9, 12]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[0, 1.75, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.32, 0.28, 24]} />
            <meshStandardMaterial color={selOutline || customTint || '#fffbeb'} emissive="#fef3c7" emissiveIntensity={0.45} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* E. MODULAR FRAMED WALL ART (Lukisan Dinding Frame) */}
      {fType === 'wall_art' && (
        <group position={[0, 2.1, 0]}>
          <RoundedBox args={[1.95, 0.95, 0.05]} radius={0.01} castShadow>
            <meshStandardMaterial color={selOutline || '#ffffff'} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0.04, 0.03]}>
            <planeGeometry args={[1.76, 0.76]} />
            <meshStandardMaterial color={customTint || '#cbd5e1'} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.14, 0.035]}>
            <planeGeometry args={[1.76, 0.34]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* F. MODULAR VANITY CONSOLE TABLE (Meja Konsol Rias / Kerja) */}
      {fType === 'vanity_table' && (
        <RoundedBox args={[0.85, 0.2, 1.75]} position={[0, 0.85, 0]} radius={0.03} castShadow receiveShadow>
          <meshStandardMaterial color={selOutline || customTint || '#8c837a'} roughness={0.5} />
        </RoundedBox>
      )}

      {/* G. MODULAR ILLUMINATED WALL MIRROR (Cermin Rias Dinding Berlampu) */}
      {fType === 'wall_mirror' && (
        <group position={[0, 1.95, 0]}>
          <RoundedBox args={[0.05, 1.65, 1.35]} radius={0.01} castShadow>
            <meshStandardMaterial color={selOutline || customTint || '#94a3b8'} metalness={0.3} roughness={0.2} />
          </RoundedBox>
          <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.22, 1.52]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.12} />
          </mesh>
          {[-0.5, 0.5].map((lz, idx) => (
            <mesh key={idx} position={[-0.04, 0, lz]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshStandardMaterial color="#fffbeb" emissive="#fef3c7" emissiveIntensity={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* H. MODULAR ACCENT CHAIR (Kursi Rias / Kursi Kerja) */}
      {fType === 'accent_chair' && (
        <group>
          <RoundedBox args={[0.58, 0.08, 0.58]} position={[0, 0.48, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color={selOutline || customTint || '#5c473e'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.08, 0.45, 0.58]} position={[-0.25, 0.72, 0]} radius={0.02} castShadow>
            <meshStandardMaterial color={selOutline || customTint || '#5c473e'} roughness={0.6} />
          </RoundedBox>
          {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.24, lz]} castShadow>
              <cylinderGeometry args={[0.03, 0.025, 0.48, 12]} />
              <meshStandardMaterial color="#44332b" />
            </mesh>
          ))}
        </group>
      )}

      {/* I. MODULAR 3-SEATER SOFA (Sofa 3-Dudukan) */}
      {fType === 'sofa_only' && (
        <group>
          <RoundedBox args={[2.6, 0.42, 1.05]} position={[0, 0.24, 0]} radius={0.08} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#cbd5e1'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[2.6, 0.48, 0.24]} position={[0, 0.65, -0.4]} radius={0.08} castShadow>
            <meshStandardMaterial color={customTint || '#94a3b8'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.22, 0.36, 1.02]} position={[-1.22, 0.46, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={customTint || '#94a3b8'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.22, 0.36, 1.02]} position={[1.22, 0.46, 0]} radius={0.05} castShadow>
            <meshStandardMaterial color={customTint || '#94a3b8'} roughness={0.6} />
          </RoundedBox>
        </group>
      )}

      {/* J. MODULAR COFFEE TABLE (Meja Kopi Kayu) */}
      {fType === 'coffee_table' && (
        <RoundedBox args={[1.35, 0.36, 0.78]} position={[0, 0.18, 0]} radius={0.04} castShadow receiveShadow>
          <meshStandardMaterial color={selOutline || customTint || '#b89068'} roughness={0.45} />
        </RoundedBox>
      )}

      {/* K. MODULAR TV & MEDIA CONSOLE (Meja TV & Smart TV) */}
      {fType === 'tv_console' && (
        <group>
          <RoundedBox args={[2.4, 0.48, 0.55]} position={[0, 0.24, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#6b5344'} roughness={0.5} />
          </RoundedBox>
          <RoundedBox args={[1.85, 1.05, 0.06]} position={[0, 1.18, -0.05]} radius={0.02} castShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.4} />
          </RoundedBox>
        </group>
      )}

      {/* L. MODULAR INDOOR PLANT (Tanaman Hias Pot Putih) */}
      {fType === 'indoor_plant' && (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.2, 0.56, 20]} />
            <meshStandardMaterial color={selOutline || '#f8fafc'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <sphereGeometry args={[0.46, 16, 16]} />
            <meshStandardMaterial color={customTint || '#4d7c5b'} roughness={0.65} />
          </mesh>
          <mesh position={[0.18, 1.18, 0.12]} castShadow>
            <sphereGeometry args={[0.32, 14, 14]} />
            <meshStandardMaterial color={customTint || '#5c8d6a'} roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* 1. MASTER BED SUITE (Bed + Tufted Headboard + Pillows + Foot Bench + Nightstands + Pendant Lamps + Framed Wall Art) */}
      {fType === 'bed_suite' && (
        <group>
          {/* Upholstered Bed Frame & Headboard */}
          <RoundedBox args={[2.5, 1.55, 0.22]} position={[0, 0.78, -1.55]} radius={0.05} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#b5a392'} roughness={0.65} />
          </RoundedBox>
          {/* Mattress & Crisp White Duvet */}
          <RoundedBox args={[2.36, 0.52, 2.75]} position={[0, 0.36, -0.1]} radius={0.08} castShadow receiveShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </RoundedBox>
          {/* Bed Base */}
          <RoundedBox args={[2.46, 0.22, 2.85]} position={[0, 0.11, -0.08]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#9e8e7e" roughness={0.6} />
          </RoundedBox>
          {/* Back White Sheet Fold & 2 Espresso Throw Pillows */}
          <RoundedBox args={[1.0, 0.24, 0.45]} position={[-0.56, 0.72, -1.18]} rotation={[0.25, 0, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color="#4e302c" roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[1.0, 0.24, 0.45]} position={[0.56, 0.72, -1.18]} rotation={[0.25, 0, 0]} radius={0.06} castShadow>
            <meshStandardMaterial color="#4e302c" roughness={0.6} />
          </RoundedBox>
          {/* Upholstered Blush-Beige Foot Bench */}
          <RoundedBox args={[2.05, 0.48, 0.72]} position={[0, 0.26, 1.68]} radius={0.1} castShadow receiveShadow>
            <meshStandardMaterial color="#d9c6bc" roughness={0.55} />
          </RoundedBox>
          {/* Left & Right Charcoal Nightstands */}
          <RoundedBox args={[1.05, 0.56, 0.72]} position={[-1.82, 0.28, -1.28]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#5c636e" roughness={0.45} />
          </RoundedBox>
          <RoundedBox args={[1.05, 0.56, 0.72]} position={[1.82, 0.28, -1.28]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color="#5c636e" roughness={0.45} />
          </RoundedBox>
          {/* Left & Right Hanging Pendant Lamps */}
          {[-1.75, 1.75].map((lx, i) => (
            <group key={i} position={[lx, 0, -1.18]}>
              <mesh position={[0, 2.75, 0]}>
                <cylinderGeometry args={[0.015, 0.015, 1.9, 12]} />
                <meshStandardMaterial color="#78716c" />
              </mesh>
              <mesh position={[0, 1.75, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.3, 0.28, 24]} />
                <meshStandardMaterial color="#fffbeb" emissive="#fef3c7" emissiveIntensity={0.45} roughness={0.3} />
              </mesh>
            </group>
          ))}
          {/* Framed Landscape Picture above Bed */}
          <group position={[0, 2.35, -1.62]}>
            <RoundedBox args={[1.95, 0.95, 0.05]} radius={0.01}>
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.04, 0.03]}>
              <planeGeometry args={[1.76, 0.76]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.14, 0.035]}>
              <planeGeometry args={[1.76, 0.34]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. FLOOR-TO-CEILING WARDROBE CABINET */}
      {fType === 'wardrobe' && (
        <group>
          <RoundedBox args={[1.25, 3.3, 3.2]} position={[0, 1.65, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#79716b'} roughness={0.55} />
          </RoundedBox>
          {/* Door seam line */}
          <mesh position={[-0.63, 1.65, 0]}>
            <boxGeometry args={[0.01, 3.2, 0.03]} />
            <meshStandardMaterial color="#44403c" />
          </mesh>
        </group>
      )}

      {/* 3. VANITY DESK + CHAIR + FRAMED MIRROR */}
      {fType === 'vanity_desk' && (
        <group>
          {/* Floating Console Shelf */}
          <RoundedBox args={[0.85, 0.2, 1.75]} position={[0, 0.85, 0]} radius={0.03} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#8c837a'} roughness={0.5} />
          </RoundedBox>
          {/* Chair under desk */}
          <group position={[-0.35, 0, -0.1]}>
            <RoundedBox args={[0.58, 0.08, 0.58]} position={[0, 0.48, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#5c473e" roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.08, 0.45, 0.58]} position={[-0.25, 0.72, 0]} radius={0.02} castShadow>
              <meshStandardMaterial color="#5c473e" roughness={0.6} />
            </RoundedBox>
            {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([lx, lz], i) => (
              <mesh key={i} position={[lx, 0.24, lz]} castShadow>
                <cylinderGeometry args={[0.03, 0.025, 0.48, 12]} />
                <meshStandardMaterial color="#44332b" />
              </mesh>
            ))}
          </group>
          {/* Wall Mirror */}
          <group position={[0.38, 1.95, 0]}>
            <RoundedBox args={[0.05, 1.65, 1.35]} radius={0.01}>
              <meshStandardMaterial color="#94a3b8" metalness={0.3} roughness={0.2} />
            </RoundedBox>
            <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[1.22, 1.52]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.65} roughness={0.12} />
            </mesh>
          </group>
        </group>
      )}

      {/* 4. TEXTURED CREAM AREA RUG */}
      {fType === 'area_rug' && (
        <RoundedBox args={[4.4, 0.03, 3.8]} position={[0, 0.02, 0]} radius={0.01} receiveShadow>
          <meshStandardMaterial color={selOutline || customTint || '#dcd9d2'} roughness={0.85} />
        </RoundedBox>
      )}

      {/* 5. PLEATED FULL-HEIGHT WINDOW CURTAINS */}
      {fType === 'curtain_drape' && (
        <group>
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={i} position={[0, 1.75, -2.2 + i * 0.4]} castShadow receiveShadow>
              <cylinderGeometry args={[0.14, 0.16, 3.5, 16]} />
              <meshStandardMaterial color={selOutline || customTint || '#eae6df'} roughness={0.75} />
            </mesh>
          ))}
        </group>
      )}

      {/* 6. LIVING ROOM SOFA + COFFEE TABLE */}
      {fType === 'sofa_suite' && (
        <group>
          <RoundedBox args={[2.6, 0.42, 1.05]} position={[0, 0.24, 0]} radius={0.08} castShadow receiveShadow>
            <meshStandardMaterial color={selOutline || customTint || '#cbd5e1'} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[2.6, 0.48, 0.24]} position={[0, 0.65, -0.4]} radius={0.08} castShadow>
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[1.3, 0.34, 0.75]} position={[0, 0.17, 1.25]} radius={0.04} castShadow receiveShadow>
            <meshStandardMaterial color="#b89068" roughness={0.45} />
          </RoundedBox>
        </group>
      )}
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Text Label Block Component
───────────────────────────────────────────────────────────────────────── */
const TextLabelBlock = React.forwardRef(({ wall, isSelected, onClick, isCapturing }, ref) => {
  const [hovered, setHovered] = useState(false);
  const isLightMode = useIsLightMode();
  useCursor(hovered);

  const labelText = ((wall.text && !wall.text.includes('undefined')) ? wall.text.replace(/^Ruangan:\s*/i, '') : 'RUANGAN').toUpperCase();
  const calculatedFontSize = wall.fontSize || Math.min(1.15, Math.max(0.68, 9.5 / (labelText.length || 7)));

  return (
    <group 
      ref={ref}
      position={wall.position} 
      rotation={wall.rotation} 
      scale={wall.scale}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <Text
        font={wall.fontFamily || undefined}
        fontSize={calculatedFontSize}
        maxWidth={4.4}
        lineHeight={1.15}
        textAlign="center"
        color={isCapturing ? '#000000' : (isSelected ? '#38bdf8' : (hovered ? '#bae6fd' : (wall.color || (isLightMode ? '#1e293b' : '#cbd5e1'))))}
        anchorX="center"
        anchorY="middle"
        fontStyle={wall.italic ? 'italic' : 'normal'}
        fontWeight={wall.bold || isCapturing ? 'bold' : '800'}
        fillOpacity={isSelected || hovered ? 0.95 : (wall.opacity !== undefined ? wall.opacity : (isLightMode ? 0.78 : 0.72))}
      >
        {labelText}
      </Text>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Room Group Block (4 Walls as 1 Object)
───────────────────────────────────────────────────────────────────────── */
const RoomGroupBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const [hovered, setHovered] = useState(false);
  const isLightMode = useIsLightMode();
  useCursor(hovered);

  const matProps = getWallMatProps(wall, isSelected, hovered, isLightMode);

  return (
    <group 
      ref={ref}
      position={wall.position} 
      rotation={wall.rotation} 
      scale={wall.scale}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* North Wall */}
      <RoundedBox position={[0, 0, -0.475]} args={[1, 1, 0.05]} radius={0.01} receiveShadow castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
      
      {/* South Wall */}
      <RoundedBox position={[0, 0, 0.475]} args={[1, 1, 0.05]} radius={0.01} receiveShadow castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>

      {/* East Wall */}
      <RoundedBox position={[0.475, 0, 0]} args={[0.05, 1, 0.9]} radius={0.01} receiveShadow castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>

      {/* West Wall */}
      <RoundedBox position={[-0.475, 0, 0]} args={[0.05, 1, 0.9]} radius={0.01} receiveShadow castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Custom Group Block (User manually grouped walls)
───────────────────────────────────────────────────────────────────────── */
const CustomGroupBlock = React.forwardRef(({ wall, isSelected, onClick, selectedObj, selectedForGroup = [], editMode, activeTab, setSelectedObj, isCapturing }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // True if a specific child is selected (not the group itself)
  const anyChildSelected = wall.children?.some(c => selectedObj?.id === c.id || selectedForGroup.includes(c.id));
  // Group highlight only when group selected AND no specific child is picked
  const groupHighlight = (isSelected || hovered) && !anyChildSelected;

  const handleChildClick = (e, child) => {
    e.stopPropagation();
    if (editMode && activeTab === 'walls') {
      if (isSelected) {
        // Jika grup sudah terpilih, klik lagi akan memilih anak spesifik di dalamnya
        setSelectedObj({ type: 'wall', id: child.id });
      } else {
        // Jika belum, klik salah satu anak akan memilih seluruh grup
        onClick && onClick();
      }
    }
  };

  return (
    <group 
      ref={ref}
      position={wall.position} 
      rotation={wall.rotation} 
      scale={wall.scale}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (editMode && activeTab === 'walls') onClick && onClick(); 
      }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {wall.children.map((child, idx) => {
        const isChildSelected = selectedObj?.id === child.id || selectedForGroup.includes(child.id);
        // Skip hidden children and selected child (selected is rendered by ChildInGroupTransform)
        if (child.hidden || isChildSelected) return null;

        const childWithInheritedMaterial = {
          ...child,
          materialPreset: child.materialPreset || wall.materialPreset,
          customColor: child.customColor || wall.customColor,
        };

        if (child.type === 'furniture') {
          return <FurnitureBlock key={child.id || idx} wall={childWithInheritedMaterial} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} />;
        }
        if (child.type?.startsWith('door_wall') || child.type === 'window_wall') {
          return <DoorWallBlock key={child.id || idx} wall={childWithInheritedMaterial} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} isCapturing={isCapturing} />;
        }
        return <WallBlock key={child.id || idx} wall={childWithInheritedMaterial} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} />;
      })}
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Wall Resize Handles (one-sided length resize, with meter label)
   Drag the left/right handle: the opposite end stays anchored.
───────────────────────────────────────────────────────────────────────── */
function WallResizeHandles({ object, orbitRef, onCommit }) {
  const leftRef = useRef();
  const rightRef = useRef();
  const labelRef = useRef();
  const drag = useRef(null);
  const [active, setActive] = useState(null);
  const [hover, setHover] = useState(null);
  useCursor(!!hover || !!active, 'ew-resize');

  const axis = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!object) return;
    axis.current.set(1, 0, 0).applyQuaternion(object.quaternion).normalize();
    const half = object.scale.x / 2;
    if (leftRef.current) leftRef.current.position.copy(object.position).addScaledVector(axis.current, -half);
    if (rightRef.current) rightRef.current.position.copy(object.position).addScaledVector(axis.current, half);
    if (labelRef.current) {
      labelRef.current.position.copy(object.position);
      labelRef.current.position.y += object.scale.y / 2 + 0.6;
      const el = labelRef.current.userData.el;
      if (el) el.textContent = `${object.scale.x.toFixed(2)} m`;
    }
  });

  const onDown = (side) => (e) => {
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    if (orbitRef?.current) orbitRef.current.enabled = false;
    const u = new THREE.Vector3(1, 0, 0).applyQuaternion(object.quaternion).normalize();
    const anchor = object.position.clone().addScaledVector(u, -side * object.scale.x / 2);
    drag.current = { side, anchor, u, y: object.position.y };
    setActive(side);
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    e.stopPropagation();
    const parent = object.parent;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const worldY = parent ? tmp.current.set(0, d.y, 0).applyMatrix4(parent.matrixWorld).y : d.y;
    plane.constant = -worldY;
    const hit = new THREE.Vector3();
    if (!e.ray.intersectPlane(plane, hit)) return;
    if (parent) parent.worldToLocal(hit);
    let len = hit.sub(d.anchor).dot(d.u) * d.side;
    len = Math.max(0.1, Math.round(len * 20) / 20); // snap 5 cm
    object.scale.x = len;
    object.position.copy(d.anchor).addScaledVector(d.u, d.side * len / 2);
    object.position.y = d.y;
    object.updateMatrixWorld(true);
  };

  const onUp = (e) => {
    if (!drag.current) return;
    e.stopPropagation();
    e.target.releasePointerCapture?.(e.pointerId);
    drag.current = null;
    setActive(null);
    if (orbitRef?.current) orbitRef.current.enabled = true;
    onCommit?.();
  };

  const handle = (side, ref) => (
    <mesh
      ref={ref}
      onPointerDown={onDown(side)}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={(e) => { e.stopPropagation(); setHover(side); }}
      onPointerOut={() => setHover(null)}
      renderOrder={999}
    >
      <sphereGeometry args={[active === side || hover === side ? 0.28 : 0.2, 24, 24]} />
      <meshBasicMaterial color={active === side ? '#f59e0b' : '#38bdf8'} depthTest={false} transparent opacity={0.95} />
    </mesh>
  );

  return (
    <>
      {handle(-1, leftRef)}
      {handle(1, rightRef)}
      <group ref={(g) => { labelRef.current = g; }}>
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            ref={(el) => { if (el && labelRef.current) labelRef.current.userData.el = el; }}
            style={{
              padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
              color: '#fff', background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(56,189,248,0.6)',
              backdropFilter: 'blur(6px)', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif',
            }}
          >
            {object ? `${object.scale.x.toFixed(2)} m` : ''}
          </div>
        </Html>
      </group>
    </>
  );
}

/* drei's TransformControls does not support `onDraggingChanged`; map it to mouseDown/mouseUp. */
function DragTransformControls({ onDraggingChanged, ...props }) {
  return (
    <TransformControls
      {...props}
      onMouseDown={() => onDraggingChanged?.({ value: true })}
      onMouseUp={() => onDraggingChanged?.({ value: false })}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Child In Group Transform
   Renders a group child at scene-root level so TransformControls
   gets the correct world-space position (no nested coordinate offset).
───────────────────────────────────────────────────────────────────────── */
function ChildInGroupTransform({ child, parentGroup, transformMode, setWalls, orbitRef, selectedForGroup = [], selectedObj }) {
  const wallRef = useRef();

  useEffect(() => {
    if (!window.iotWallRefs) window.iotWallRefs = {};
    window.iotWallRefs[child.id] = wallRef.current;
    return () => { if (window.iotWallRefs) delete window.iotWallRefs[child.id]; };
  }, [child.id]);

  const dragStartData = useRef(null);
  const isDragging = useRef(false);

  useFrame(() => {
    if (!isDragging.current || !dragStartData.current || !wallRef.current) return;
    
    const { GizmoInitialPos, GizmoInitialRot, GizmoInitialScale, initialPositions } = dragStartData.current;
    const t = wallRef.current;
    
    const dx = t.position.x - GizmoInitialPos.x;
    const dy = t.position.y - GizmoInitialPos.y;
    const dz = t.position.z - GizmoInitialPos.z;

    const drx = t.rotation.x - GizmoInitialRot.x;
    const dry = t.rotation.y - GizmoInitialRot.y;
    const drz = t.rotation.z - GizmoInitialRot.z;

    const dsx = t.scale.x - GizmoInitialScale.x;
    const dsy = t.scale.y - GizmoInitialScale.y;
    const dsz = t.scale.z - GizmoInitialScale.z;

    if (window.iotWallRefs) {
      selectedForGroup.forEach(id => {
        if (id === child.id) return;
        const mesh = window.iotWallRefs[id];
        const init = initialPositions[id];
        if (mesh && init) {
           mesh.position.set(init.position.x + dx, init.position.y + dy, init.position.z + dz);
           mesh.rotation.set(init.rotation.x + drx, init.rotation.y + dry, init.rotation.z + drz);
           mesh.scale.set(init.scale.x + dsx, init.scale.y + dsy, init.scale.z + dsz);
           mesh.updateMatrixWorld(true);
        }
      });
    }
  });

  // World position (within RoomLayout group) = parentGroup.pos + child.local pos
  const gx = parentGroup.position?.[0] || 0;
  const gy = parentGroup.position?.[1] || 0;
  const gz = parentGroup.position?.[2] || 0;
  const worldPos = [
    gx + (child.position?.[0] || 0),
    gy + (child.position?.[1] || 0),
    gz + (child.position?.[2] || 0),
  ];

  const handleMouseUp = () => {
    if (!wallRef.current) return;
    const t = wallRef.current;
    
    // New local pos
    const newLocalX = t.position.x - gx;
    const newLocalY = t.position.y - gy;
    const newLocalZ = t.position.z - gz;

    const dx = newLocalX - (child.position?.[0] || 0);
    const dy = newLocalY - (child.position?.[1] || 0);
    const dz = newLocalZ - (child.position?.[2] || 0);

    const drx = t.rotation.x - (child.rotation?.[0] || 0);
    const dry = t.rotation.y - (child.rotation?.[1] || 0);
    const drz = t.rotation.z - (child.rotation?.[2] || 0);

    const dsx = t.scale.x - (child.scale?.[0] || 1);
    const dsy = t.scale.y - (child.scale?.[1] || 1);
    const dsz = t.scale.z - (child.scale?.[2] || 1);
    
    const isGroupDrag = selectedForGroup.includes(child.id);

    setWalls(prev => prev.map(w => {
      // Top-level grouped match
      if (isGroupDrag && selectedForGroup.includes(w.id)) {
        return {
          ...w,
          position: [w.position[0] + dx, w.position[1] + dy, w.position[2] + dz],
          rotation: [w.rotation[0] + drx, w.rotation[1] + dry, w.rotation[2] + drz],
          scale: [w.scale[0] + dsx, w.scale[1] + dsy, w.scale[2] + dsz],
        };
      }

      if (w.type === 'custom_group' && w.children) {
        let changed = false;
        const newChildren = w.children.map(c => {
          if (c.id === child.id) {
             changed = true;
             return {
               ...c,
               position: [newLocalX, newLocalY, newLocalZ],
               rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
               scale: [t.scale.x, t.scale.y, t.scale.z],
             };
          }
          if (isGroupDrag && selectedForGroup.includes(c.id)) {
             changed = true;
             return {
               ...c,
               position: [(c.position?.[0] || 0) + dx, (c.position?.[1] || 0) + dy, (c.position?.[2] || 0) + dz],
               rotation: [(c.rotation?.[0] || 0) + drx, (c.rotation?.[1] || 0) + dry, (c.rotation?.[2] || 0) + drz],
               scale: [(c.scale?.[0] || 1) + dsx, (c.scale?.[1] || 1) + dsy, (c.scale?.[2] || 1) + dsz],
             };
          }
          return c;
        });
        if (changed) return { ...w, children: newChildren };
      }
      return w;
    }));
  };

  // Sync when parent group or child data changes
  useEffect(() => {
    if (wallRef.current) {
      wallRef.current.position.set(...worldPos);
      if (child.rotation) wallRef.current.rotation.set(...child.rotation);
      if (child.scale) wallRef.current.scale.set(...child.scale);
      wallRef.current.updateMatrixWorld(true);
    }
  }, [child.position, child.rotation, child.scale, parentGroup.position]);

  const wallData = { ...child, position: worldPos };

  const isSelectedGroup = selectedForGroup.includes(child.id);
  
  // Limit gizmo rendering to strictly 1 object, and ONLY if <= 1 item selected in group
  let primaryId = selectedObj?.id;
  if (!primaryId && selectedForGroup.length === 1) primaryId = selectedForGroup[0];
  const showGizmo = (isSelectedGroup || selectedObj?.id === child.id) && selectedForGroup.length <= 1 && primaryId === child.id;

  return (
    <>
      {child.type === 'furniture' ? (
        <FurnitureBlock ref={wallRef} wall={wallData} isSelected={true} onClick={() => {}} />
      ) : (child.type?.startsWith('door_wall') || child.type === 'window_wall') ? (
        <DoorWallBlock ref={wallRef} wall={wallData} isSelected={true} onClick={() => {}} />
      ) : (
        <WallBlock ref={wallRef} wall={wallData} isSelected={true} onClick={() => {}} />
      )}
      {showGizmo && transformMode !== 'select' && transformMode !== 'camera' && wallRef.current && (
        <DragTransformControls
          object={wallRef.current}
          mode={transformMode}
          showY={transformMode === 'rotate'}
          showX={transformMode !== 'rotate'}
          showZ={transformMode !== 'rotate'}
          onDraggingChanged={(e) => {
            if (orbitRef.current) orbitRef.current.enabled = !e.value;
            isDragging.current = e.value;
            if (e.value) {
              const initialPositions = {};
              if (window.iotWallRefs) {
                 selectedForGroup.forEach(id => {
                   const mesh = window.iotWallRefs[id];
                   if (mesh) {
                     initialPositions[id] = {
                       position: mesh.position.clone(),
                       rotation: mesh.rotation.clone(),
                       scale: mesh.scale.clone()
                     };
                   }
                 });
              }
              dragStartData.current = {
                GizmoInitialPos: wallRef.current.position.clone(),
                GizmoInitialRot: wallRef.current.rotation.clone(),
                GizmoInitialScale: wallRef.current.scale.clone(),
                initialPositions
              };
            } else {
              dragStartData.current = null;
              handleMouseUp();
            }
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Door & Panoramic Window Wall Block
   - door_wall        = 1 door in center
   - door_wall_left   = 1 door on the left side
   - door_wall_right  = 1 door on the right side
   - door_wall_double = 2 doors symmetrically placed
   - window_wall      = Panoramic window with lower sill, upper lintel, and glass pane
───────────────────────────────────────────────────────────────────────── */
const DoorWallBlock = React.forwardRef(({ wall, isSelected, onClick, isCapturing }, ref) => {
  const [hovered, setHovered] = useState(false);
  const [cutawayOpacity, setCutawayOpacity] = useState(1);
  const isLightMode = useIsLightMode();
  const localGroupRef = useRef();
  const worldPos = useRef(new THREE.Vector3());
  useCursor(hovered);

  useFrame(({ camera }) => {
    const node = (ref && typeof ref === 'object' && ref.current) ? ref.current : localGroupRef.current;
    if (!node || wall.type === 'glass_wall' || wall.materialPreset === 'glass_frosted') return;
    node.getWorldPosition(worldPos.current);
    const wx = worldPos.current.x;
    const wz = worldPos.current.z;
    const distFromCenter = Math.hypot(wx, wz);
    if (distFromCenter < 2.2) {
      if (cutawayOpacity !== 1) setCutawayOpacity(1);
      return;
    }
    const cx = camera.position.x;
    const cz = camera.position.z;
    const camLen = Math.hypot(cx, cz) || 1;
    const wallLen = distFromCenter || 1;
    const dot = (wx * cx + wz * cz) / (wallLen * camLen);
    const shouldCutaway = dot > 0.38 && camera.position.y < 26;
    const targetOp = shouldCutaway ? 0.24 : 1;
    if (Math.abs(cutawayOpacity - targetOp) > 0.05) {
      setCutawayOpacity(targetOp);
    }
  });

  const rawMatProps = getWallMatProps(wall, isSelected, hovered, isLightMode);
  const finalOpacity = Math.min(rawMatProps.opacity ?? 1, cutawayOpacity);
  const isTransparent = rawMatProps.transparent || finalOpacity < 0.99;
  const matProps = {
    ...rawMatProps,
    transparent: isTransparent,
    opacity: finalOpacity,
    depthWrite: !isTransparent,
  };

  const setRefs = (el) => {
    localGroupRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  // --- Fixed door dimensions in world space ---
  const DOOR_WORLD_W = 2;   // fixed door width (world units)
  const DOOR_WORLD_H = 0.7; // lintel height ratio
  const wallW = wall.scale?.[0] || 1;
  const wallH = wall.scale?.[1] || 1;

  if (wall.type === 'window_wall') {
    const winLocalW = Math.min(4.2 / wallW, 0.72);
    const sideW = (1 - winLocalW) / 2;
    const sillH = 0.28;
    const lintelH = 0.22;
    const glassH = 1 - sillH - lintelH;

    return (
      <group
        ref={setRefs}
        position={wall.position}
        rotation={wall.rotation}
        scale={wall.scale}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {sideW > 0.01 && (
          <RoundedBox position={[-0.5 + sideW / 2, 0, 0]} args={[sideW, 1, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {sideW > 0.01 && (
          <RoundedBox position={[0.5 - sideW / 2, 0, 0]} args={[sideW, 1, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {/* Bottom sill */}
        <RoundedBox position={[0, -0.5 + sillH / 2, 0]} args={[winLocalW, sillH, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
        {/* Top lintel */}
        {!isCapturing && (
          <RoundedBox position={[0, 0.5 - lintelH / 2, 0]} args={[winLocalW, lintelH, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {/* Crisp White Architectural Top Trim */}
        <mesh position={[0, 0.502, 0]} receiveShadow>
          <boxGeometry args={[1.002, 0.025, 1.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} transparent={isTransparent} opacity={Math.min(1, finalOpacity + 0.15)} />
        </mesh>
        {/* Translucent glass pane */}
        {!isCapturing && (
          <RoundedBox position={[0, (sillH - lintelH) / 2, 0]} args={[winLocalW, glassH, 0.22]} radius={0.005}>
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.28 * finalOpacity} roughness={0.12} metalness={0.15} />
          </RoundedBox>
        )}
      </group>
    );
  }

  // Convert fixed world-space door width to local 0-1 ratio
  const doorLocalW = Math.min(DOOR_WORLD_W / wallW, 0.6); // cap at 60% of wall
  const topLocalH = DOOR_WORLD_H / wallH;                  // lintel height in local ratio

  if (wall.type === 'door_wall_double') {
    // Double door = 1 wide opening in center (2x single door width)
    const doubleDoorLocalW = Math.min((DOOR_WORLD_W * 2) / wallW, 0.75); // 2x width, cap 75%
    const leftW  = (1 - doubleDoorLocalW) / 2;
    const rightW = (1 - doubleDoorLocalW) / 2;

    return (
      <group 
        ref={setRefs}
        position={wall.position} 
        rotation={wall.rotation} 
        scale={wall.scale}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        {/* Left side wall */}
        {leftW > 0.01 && (
          <RoundedBox position={[-0.5 + leftW / 2, 0, 0]} args={[leftW, 1, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {/* Right side wall */}
        {rightW > 0.01 && (
          <RoundedBox position={[0.5 - rightW / 2, 0, 0]} args={[rightW, 1, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {/* Lintel above double door */}
        {!isCapturing && (
          <RoundedBox position={[0, 0.5 - topLocalH / 2, 0]} args={[doubleDoorLocalW, topLocalH, 1]} radius={0.01} receiveShadow castShadow>
            <meshStandardMaterial {...matProps} />
          </RoundedBox>
        )}
        {/* Crisp White Architectural Top Trim */}
        <mesh position={[0, 0.502, 0]} receiveShadow>
          <boxGeometry args={[1.002, 0.025, 1.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} transparent={isTransparent} opacity={Math.min(1, finalOpacity + 0.15)} />
        </mesh>
      </group>
    );
  }

  // --- Single door variants ---
  let doorCenterX = 0; // center (door_wall)
  if (wall.type === 'door_wall_left')  doorCenterX = -0.5 + doorLocalW / 2 + 0.05;
  if (wall.type === 'door_wall_right') doorCenterX =  0.5 - doorLocalW / 2 - 0.05;

  const leftW  = doorCenterX - (-0.5) - doorLocalW / 2;
  const rightW = 0.5 - (doorCenterX + doorLocalW / 2);

  return (
    <group 
      ref={setRefs}
      position={wall.position} 
      rotation={wall.rotation} 
      scale={wall.scale}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {leftW > 0.01 && (
        <RoundedBox position={[-0.5 + leftW / 2, 0, 0]} args={[leftW, 1, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
      )}
      {rightW > 0.01 && (
        <RoundedBox position={[0.5 - rightW / 2, 0, 0]} args={[rightW, 1, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
      )}
      {/* Lintel above door */}
      {!isCapturing && (
        <RoundedBox position={[doorCenterX, 0.5 - topLocalH / 2, 0]} args={[doorLocalW, topLocalH, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
      )}
      {/* Crisp White Architectural Top Trim */}
      <mesh position={[0, 0.502, 0]} receiveShadow>
        <boxGeometry args={[1.002, 0.025, 1.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} transparent={isTransparent} opacity={Math.min(1, finalOpacity + 0.15)} />
      </mesh>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Wall Block Wrapper With TransformControls
───────────────────────────────────────────────────────────────────────── */
function WallBlockWithTransform({ wall, isSelected, selectedObj, selectedForGroup = [], editMode, activeTab, setSelectedObj, transformMode, setWalls, orbitRef, isCapturing }) {
  const wallRef = useRef();
  
  useEffect(() => {
    if (!window.iotWallRefs) window.iotWallRefs = {};
    window.iotWallRefs[wall.id] = wallRef.current;
    return () => { if (window.iotWallRefs) delete window.iotWallRefs[wall.id]; };
  }, [wall.id]);

  const dragStartData = useRef(null);
  const isDragging = useRef(false);

  useFrame(() => {
    if (!isDragging.current || !dragStartData.current || !wallRef.current) return;
    
    const { GizmoInitialPos, GizmoInitialRot, GizmoInitialScale, initialPositions } = dragStartData.current;
    const t = wallRef.current;
    
    const dx = t.position.x - GizmoInitialPos.x;
    const dy = t.position.y - GizmoInitialPos.y;
    const dz = t.position.z - GizmoInitialPos.z;

    const drx = t.rotation.x - GizmoInitialRot.x;
    const dry = t.rotation.y - GizmoInitialRot.y;
    const drz = t.rotation.z - GizmoInitialRot.z;

    const dsx = t.scale.x - GizmoInitialScale.x;
    const dsy = t.scale.y - GizmoInitialScale.y;
    const dsz = t.scale.z - GizmoInitialScale.z;

    if (window.iotWallRefs) {
      selectedForGroup.forEach(id => {
        if (id === wall.id) return;
        const mesh = window.iotWallRefs[id];
        const init = initialPositions[id];
        if (mesh && init) {
           mesh.position.set(init.position.x + dx, init.position.y + dy, init.position.z + dz);
           mesh.rotation.set(init.rotation.x + drx, init.rotation.y + dry, init.rotation.z + drz);
           mesh.scale.set(init.scale.x + dsx, init.scale.y + dsy, init.scale.z + dsz);
           mesh.updateMatrixWorld(true);
        }
      });
    }
  });

  const handleMouseUp = (e) => {
    if (!wallRef.current) return;
    const t = wallRef.current;
    
    // Calculate deltas
    const dx = t.position.x - wall.position[0];
    const dy = t.position.y - wall.position[1];
    const dz = t.position.z - wall.position[2];

    const drx = t.rotation.x - wall.rotation[0];
    const dry = t.rotation.y - wall.rotation[1];
    const drz = t.rotation.z - wall.rotation[2];

    const dsx = t.scale.x - wall.scale[0];
    const dsy = t.scale.y - wall.scale[1];
    const dsz = t.scale.z - wall.scale[2];

    const isGroupDrag = selectedForGroup.includes(wall.id);

    setWalls(prev => prev.map(w => {
      // Top-level exact match
      if (w.id === wall.id) {
        return {
          ...w,
          position: [t.position.x, t.position.y, t.position.z],
          rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
          scale: [t.scale.x, t.scale.y, t.scale.z],
        };
      }
      
      // Top-level grouped match
      if (isGroupDrag && selectedForGroup.includes(w.id)) {
        return {
          ...w,
          position: [w.position[0] + dx, w.position[1] + dy, w.position[2] + dz],
          rotation: [w.rotation[0] + drx, w.rotation[1] + dry, w.rotation[2] + drz],
          scale: [w.scale[0] + dsx, w.scale[1] + dsy, w.scale[2] + dsz],
        };
      }

      // Check children
      if (w.type === 'custom_group' && w.children) {
        let changed = false;
        const newChildren = w.children.map(c => {
          if (c.id === wall.id) {
             // This shouldn't happen for WallBlockWithTransform, but just in case
             changed = true;
             return {
               ...c,
               position: [t.position.x, t.position.y, t.position.z],
               rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
               scale: [t.scale.x, t.scale.y, t.scale.z],
             };
          }
          if (isGroupDrag && selectedForGroup.includes(c.id)) {
             changed = true;
             return {
               ...c,
               position: [c.position[0] + dx, c.position[1] + dy, c.position[2] + dz],
               rotation: [c.rotation[0] + drx, c.rotation[1] + dry, c.rotation[2] + drz],
               scale: [c.scale[0] + dsx, c.scale[1] + dsy, c.scale[2] + dsz],
             };
          }
          return c;
        });
        if (changed) return { ...w, children: newChildren };
      }
      
      return w;
    }));
  };

  // Sync external state (Properties Panel) to the 3D object directly
  useEffect(() => {
    if (wallRef.current) {
      wallRef.current.position.set(...wall.position);
      wallRef.current.rotation.set(...wall.rotation);
      wallRef.current.scale.set(...wall.scale);
    }
  }, [wall.position, wall.rotation, wall.scale]);

  // Limit gizmo rendering to strictly 1 object, and ONLY if <= 1 item selected in group
  let primaryId = selectedObj?.id;
  if (!primaryId && selectedForGroup.length === 1) primaryId = selectedForGroup[0];
  const showGizmo = isSelected && selectedForGroup.length <= 1 && primaryId === wall.id;

  return (
    <>
      {wall.type === 'room' ? (
        <RoomGroupBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      ) : wall.type === 'custom_group' ? (
        <>
          <CustomGroupBlock 
            ref={wallRef}
            wall={wall}
            isSelected={isSelected}
            selectedObj={selectedObj}
            selectedForGroup={selectedForGroup}
            editMode={editMode}
            activeTab={activeTab}
            setSelectedObj={setSelectedObj}
            onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
            isCapturing={isCapturing}
          />
          {wall.children && wall.children.map(child => {
            if (selectedObj?.id === child.id || selectedForGroup.includes(child.id)) {
              return (
                <ChildInGroupTransform 
                  key={`child-transform-${child.id}`}
                  child={child}
                  parentGroup={wall}
                  transformMode={transformMode}
                  setWalls={setWalls}
                  orbitRef={orbitRef}
                  selectedForGroup={selectedForGroup}
                  selectedObj={selectedObj}
                />
              );
            }
            return null;
          })}
        </>
      ) : (wall.type?.startsWith('door_wall') || wall.type === 'window_wall') ? (
        <DoorWallBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
          isCapturing={isCapturing}
        />
      ) : wall.type === 'furniture' ? (
        <FurnitureBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      ) : wall.type === 'text_label' ? (
        <TextLabelBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
          isCapturing={isCapturing}
        />
      ) : (
        <WallBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      )}
      {!wall.locked && showGizmo && transformMode === 'scale' && wallRef.current && !['room', 'custom_group', 'text_label', 'furniture'].includes(wall.type) && (
        <WallResizeHandles object={wallRef.current} orbitRef={orbitRef} onCommit={handleMouseUp} />
      )}
      {!wall.locked && showGizmo && transformMode !== 'select' && transformMode !== 'camera' && wallRef.current && !(transformMode === 'scale' && !['room', 'custom_group', 'text_label', 'furniture'].includes(wall.type)) && (
        <DragTransformControls
          object={wallRef.current}
          mode={transformMode}
          translationSnap={0.25}
          rotationSnap={Math.PI / 12}
          scaleSnap={0.25}
          showY={transformMode === 'rotate' ? true : false}
          showX={transformMode !== 'rotate'}
          showZ={transformMode !== 'rotate'}
          onDraggingChanged={(e) => {
            if (orbitRef.current) orbitRef.current.enabled = !e.value;
            isDragging.current = e.value;
            if (e.value) {
              const initialPositions = {};
              if (window.iotWallRefs) {
                 selectedForGroup.forEach(id => {
                   const mesh = window.iotWallRefs[id];
                   if (mesh) {
                     initialPositions[id] = {
                       position: mesh.position.clone(),
                       rotation: mesh.rotation.clone(),
                       scale: mesh.scale.clone()
                     };
                   }
                 });
              }
              dragStartData.current = {
                GizmoInitialPos: wallRef.current.position.clone(),
                GizmoInitialRot: wallRef.current.rotation.clone(),
                GizmoInitialScale: wallRef.current.scale.clone(),
                initialPositions
              };
            } else {
              dragStartData.current = null;
              handleMouseUp();
            }
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Device Node With Transform
───────────────────────────────────────────────────────────────────────── */
function DeviceNodeWithTransform({ dev, isSelected, editMode, activeTab, setSelectedObj, transformMode, orbitRef, onPlaceDevice, isCapturing }) {
  const devRef = useRef();

  const handleMouseUp = () => {
    if (!devRef.current) return;
    const t = devRef.current;
    onPlaceDevice(
      dev.id, 
      [t.position.x, t.position.y, t.position.z],
      [t.rotation.x, t.rotation.y, t.rotation.z],
      [t.scale.x, t.scale.y, t.scale.z]
    );
  };

  useEffect(() => {
    if (devRef.current && dev.broker_config) {
      if (dev.broker_config.position) devRef.current.position.set(...dev.broker_config.position);
      if (dev.broker_config.rotation) devRef.current.rotation.set(...dev.broker_config.rotation);
      if (dev.broker_config.scale) devRef.current.scale.set(...dev.broker_config.scale);
    }
  }, [dev.broker_config]);

  return (
    <>
      <group 
        ref={devRef} 
        position={dev.broker_config?.position}
        rotation={dev.broker_config?.rotation || [0, 0, 0]}
        scale={dev.broker_config?.scale || [1, 1, 1]}
      >
        <SmartDeviceNode 
          device={dev}
          position={[0, 0, 0]} 
          isEditMode={editMode}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'devices') setSelectedObj({ type: 'device', id: dev.id }) }} 
          isCapturing={isCapturing}
        />
      </group>
      {isSelected && transformMode !== 'select' && transformMode !== 'camera' && devRef.current && (
        <TransformControls
          object={devRef.current}
          mode={transformMode}
          showY={transformMode === 'rotate'}
          showX={transformMode !== 'rotate'}
          showZ={transformMode !== 'rotate'}
          onMouseUp={handleMouseUp}
          onDraggingChanged={(e) => {
            if (orbitRef.current) orbitRef.current.enabled = !e.value;
          }}
        />
      )}
    </>
  );
}

function MultiSelectGizmo({ selectedForGroup, walls, transformMode, setWalls, orbitRef }) {
  const dummyRef = useRef();
  const [centerPos, setCenterPos] = useState(null);

  useEffect(() => {
    if (selectedForGroup.length < 2) {
      setCenterPos(null);
      return;
    }
    
    let cx = 0, cy = 0, cz = 0;
    let count = 0;
    
    if (window.iotWallRefs) {
      selectedForGroup.forEach(id => {
        const mesh = window.iotWallRefs[id];
        if (mesh) {
           const pos = new THREE.Vector3();
           mesh.getWorldPosition(pos);
           cx += pos.x;
           cy += pos.y;
           cz += pos.z;
           count++;
        }
      });
    }
    
    if (count > 0) {
      setCenterPos([cx / count, cy / count, cz / count]);
    }
  }, [selectedForGroup, walls]);

  const dragStartData = useRef(null);
  const isDragging = useRef(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useFrame(() => {
    if (!isDragging.current || !dragStartData.current || !dummyRef.current) return;
    
    const { GizmoInitialPos, GizmoInitialRot, GizmoInitialScale, initialPositions } = dragStartData.current;
    const t = dummyRef.current;
    
    const dx = t.position.x - GizmoInitialPos.x;
    const dy = t.position.y - GizmoInitialPos.y;
    const dz = t.position.z - GizmoInitialPos.z;

    const drx = t.rotation.x - GizmoInitialRot.x;
    const dry = t.rotation.y - GizmoInitialRot.y;
    const drz = t.rotation.z - GizmoInitialRot.z;

    const dsx = t.scale.x - GizmoInitialScale.x;
    const dsy = t.scale.y - GizmoInitialScale.y;
    const dsz = t.scale.z - GizmoInitialScale.z;

    if (window.iotWallRefs) {
      selectedForGroup.forEach(id => {
        const mesh = window.iotWallRefs[id];
        const init = initialPositions[id];
        if (mesh && init) {
           mesh.position.set(init.position.x + dx, init.position.y + dy, init.position.z + dz);
           mesh.rotation.set(init.rotation.x + drx, init.rotation.y + dry, init.rotation.z + drz);
           mesh.scale.set(init.scale.x + dsx, init.scale.y + dsy, init.scale.z + dsz);
           mesh.updateMatrixWorld(true);
        }
      });
    }
  });

  if (!centerPos || selectedForGroup.length < 2) return null;

  return (
    <>
      <group ref={dummyRef} position={centerPos} />
      {mounted && dummyRef.current && transformMode !== 'select' && transformMode !== 'camera' && (
        <DragTransformControls
          object={dummyRef.current}
          mode={transformMode}
          showY={transformMode === 'rotate' ? true : false}
          showX={transformMode !== 'rotate'}
          showZ={transformMode !== 'rotate'}
          onDraggingChanged={(e) => {
            if (orbitRef.current) orbitRef.current.enabled = !e.value;
            isDragging.current = e.value;
            if (e.value) {
              const initialPositions = {};
              if (window.iotWallRefs) {
                 selectedForGroup.forEach(id => {
                   const mesh = window.iotWallRefs[id];
                   if (mesh) {
                     initialPositions[id] = {
                       position: mesh.position.clone(),
                       rotation: mesh.rotation.clone(),
                       scale: mesh.scale.clone()
                     };
                   }
                 });
              }
              dragStartData.current = {
                GizmoInitialPos: dummyRef.current.position.clone(),
                GizmoInitialRot: dummyRef.current.rotation.clone(),
                GizmoInitialScale: dummyRef.current.scale.clone(),
                initialPositions
              };
            } else {
              if (!dragStartData.current) return;
              const { GizmoInitialPos, GizmoInitialRot, GizmoInitialScale } = dragStartData.current;
              const t = dummyRef.current;
              
              const dx = t.position.x - GizmoInitialPos.x;
              const dy = t.position.y - GizmoInitialPos.y;
              const dz = t.position.z - GizmoInitialPos.z;

              const drx = t.rotation.x - GizmoInitialRot.x;
              const dry = t.rotation.y - GizmoInitialRot.y;
              const drz = t.rotation.z - GizmoInitialRot.z;

              const dsx = t.scale.x - GizmoInitialScale.x;
              const dsy = t.scale.y - GizmoInitialScale.y;
              const dsz = t.scale.z - GizmoInitialScale.z;

              setWalls(prev => prev.map(w => {
                 let changed = false;
                 let newW = { ...w };

                 if (selectedForGroup.includes(w.id)) {
                    newW.position = [w.position[0] + dx, w.position[1] + dy, w.position[2] + dz];
                    newW.rotation = [w.rotation[0] + drx, w.rotation[1] + dry, w.rotation[2] + drz];
                    newW.scale = [w.scale[0] + dsx, w.scale[1] + dsy, w.scale[2] + dsz];
                    changed = true;
                 }

                 if (w.type === 'custom_group' && w.children) {
                    let childChanged = false;
                    const newChildren = w.children.map(c => {
                       if (selectedForGroup.includes(c.id)) {
                          childChanged = true;
                          return {
                             ...c,
                             position: [(c.position?.[0]||0) + dx, (c.position?.[1]||0) + dy, (c.position?.[2]||0) + dz],
                             rotation: [(c.rotation?.[0]||0) + drx, (c.rotation?.[1]||0) + dry, (c.rotation?.[2]||0) + drz],
                             scale: [(c.scale?.[0]||1) + dsx, (c.scale?.[1]||1) + dsy, (c.scale?.[2]||1) + dsz],
                          };
                       }
                       return c;
                    });
                    if (childChanged) {
                       newW.children = newChildren;
                       changed = true;
                    }
                 }

                 return changed ? newW : w;
              }));

              dragStartData.current = null;
            }
          }}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Top-down Camera Controller for Sidebar Widget Preview
───────────────────────────────────────────────────────────────────────── */
function TopDownCameraController({ isSidebarPreview, walls, orbitRef }) {
  const { camera, invalidate } = useThree();

  useEffect(() => {
    if (!isSidebarPreview) return;

    let minX = -5, maxX = 5, minZ = -5, maxZ = 5;
    let found = false;

    if (Array.isArray(walls) && walls.length > 0) {
      walls.forEach((w) => {
        if (w.position) {
          const px = w.position[0] || 0;
          const pz = w.position[2] || 0;
          const sx = (w.scale?.[0] || 1) / 2;
          const sz = (w.scale?.[2] || 1) / 2;
          if (!found) {
            minX = px - sx; maxX = px + sx;
            minZ = pz - sz; maxZ = pz + sz;
            found = true;
          } else {
            minX = Math.min(minX, px - sx); maxX = Math.max(maxX, px + sx);
            minZ = Math.min(minZ, pz - sz); maxZ = Math.max(maxZ, pz + sz);
          }
        }
        if (w.type === 'custom_group' && Array.isArray(w.children)) {
          w.children.forEach((c) => {
            if (c.position) {
              const px = (w.position?.[0] || 0) + (c.position[0] || 0);
              const pz = (w.position?.[2] || 0) + (c.position[2] || 0);
              const sx = (c.scale?.[0] || 1) / 2;
              const sz = (c.scale?.[2] || 1) / 2;
              if (!found) {
                minX = px - sx; maxX = px + sx;
                minZ = pz - sz; maxZ = pz + sz;
                found = true;
              } else {
                minX = Math.min(minX, px - sx); maxX = Math.max(maxX, px + sx);
                minZ = Math.min(minZ, pz - sz); maxZ = Math.max(maxZ, pz + sz);
              }
            }
          });
        }
      });
    }

    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const spanX = Math.max(12, maxX - minX);
    const spanZ = Math.max(12, maxZ - minZ);
    const maxSpan = Math.max(spanX, spanZ);

    // Framing isometric top-down view so entire room is visible without awkward cuts
    const targetY = Math.max(20, maxSpan * 1.4);
    const targetX = centerX + targetY * 0.45;
    const targetZ = centerZ + targetY * 0.55;

    camera.position.set(targetX, targetY, targetZ);
    camera.lookAt(centerX, 0, centerZ);
    camera.updateProjectionMatrix();

    if (orbitRef?.current) {
      orbitRef.current.target.set(centerX, 0, centerZ);
      orbitRef.current.update();
    }
    invalidate();
  }, [isSidebarPreview, walls, camera, orbitRef, invalidate]);

  return null;
}

/* ─────────────────────────────────────────────────────────────────────────
   3D Architectural Dimension Ruler Lines (Penggaris CAD)
   Computes the outer bounding box of all visible walls and draws cyan
   dimension lines with perpendicular end-ticks & meter labels (e.g. 10.0 m, 8.5 m)
───────────────────────────────────────────────────────────────────────── */
function RoomDimensionRuler({ walls, visible }) {
  const bounds = React.useMemo(() => {
    if (!visible || !Array.isArray(walls) || walls.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let found = false;

    const addBox = (px, pz, sx, sz, rotY = 0) => {
      const cos = Math.abs(Math.cos(rotY));
      const sin = Math.abs(Math.sin(rotY));
      const halfW = (sx * cos + sz * sin) / 2;
      const halfD = (sx * sin + sz * cos) / 2;
      minX = Math.min(minX, px - halfW);
      maxX = Math.max(maxX, px + halfW);
      minZ = Math.min(minZ, pz - halfD);
      maxZ = Math.max(maxZ, pz + halfD);
      found = true;
    };

    walls.forEach((w) => {
      if (w.hidden || w.type === 'text_label') return;
      if (w.type === 'custom_group' && Array.isArray(w.children)) {
        const gx = w.position?.[0] || 0;
        const gz = w.position?.[2] || 0;
        const gsx = w.scale?.[0] || 1;
        const gsz = w.scale?.[2] || 1;
        const gRot = w.rotation?.[1] || 0;
        w.children.forEach((c) => {
          if (c.hidden || c.type === 'text_label') return;
          addBox(
            gx + (c.position?.[0] || 0) * gsx,
            gz + (c.position?.[2] || 0) * gsz,
            (c.scale?.[0] || 1) * gsx,
            (c.scale?.[2] || 1) * gsz,
            gRot + (c.rotation?.[1] || 0)
          );
        });
      } else if (w.position && w.scale) {
        addBox(w.position[0], w.position[2], w.scale[0] || 1, w.scale[2] || 1, w.rotation?.[1] || 0);
      }
    });

    if (!found) return null;
    const widthM = Math.max(1, maxX - minX);
    const depthM = Math.max(1, maxZ - minZ);
    return { minX, maxX, minZ, maxZ, widthM, depthM };
  }, [walls, visible]);

  if (!bounds) return null;

  const { minX, maxX, minZ, maxZ, widthM, depthM } = bounds;
  const offset = 1.35;
  const tick = 0.35;
  const y = 0.06;

  // Left vertical dimension line (along Z axis at X = minX - offset)
  const leftX = minX - offset;
  // Front horizontal dimension line (along X axis at Z = maxZ + offset)
  const frontZ = maxZ + offset;

  return (
    <group>
      {/* Left Z-Depth Dimension Line */}
      <Line
        points={[[leftX, y, minZ], [leftX, y, maxZ]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      {/* End Ticks for Left Line */}
      <Line
        points={[[leftX - tick, y, minZ], [leftX + tick * 1.4, y, minZ]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      <Line
        points={[[leftX - tick, y, maxZ], [leftX + tick * 1.4, y, maxZ]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      {/* Depth Label (e.g. 10.0 m) */}
      <Text
        position={[leftX - 0.85, y + 0.02, (minZ + maxZ) / 2]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 6]}
        fontSize={0.58}
        color="#7dd3fc"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {`${depthM.toFixed(1)} m`}
      </Text>

      {/* Front X-Width Dimension Line */}
      <Line
        points={[[minX, y, frontZ], [maxX, y, frontZ]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      {/* End Ticks for Front Line */}
      <Line
        points={[[minX, y, frontZ - tick * 1.4], [minX, y, frontZ + tick]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      <Line
        points={[[maxX, y, frontZ - tick * 1.4], [maxX, y, frontZ + tick]]}
        color="#38bdf8"
        lineWidth={1.6}
        transparent
        opacity={0.85}
      />
      {/* Width Label (e.g. 8.5 m / 10.0 m) */}
      <Text
        position={[(minX + maxX) / 2, y + 0.02, frontZ + 0.72]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.58}
        color="#7dd3fc"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {`${widthM.toFixed(1)} m`}
      </Text>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   3D Center CAD Axis & Rotation Ring Gizmo
───────────────────────────────────────────────────────────────────────── */
function RoomCenterAxisGizmo({ visible, position = [0, 2.2, 0] }) {
  if (!visible) return null;
  const len = 2.2;
  return (
    <group position={position}>
      {/* Horizontal Cyan Rotation Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.42, 1.5, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} side={2} depthTest={false} />
      </mesh>
      {/* X Axis (Red/Coral) */}
      <Line points={[[0, 0, 0], [len, 0, 0]]} color="#f43f5e" lineWidth={2.5} depthTest={false} />
      <mesh position={[len, 0, 0]} rotation={[0, 0, -Math.PI / 2]} renderOrder={999}>
        <coneGeometry args={[0.14, 0.36, 16]} />
        <meshBasicMaterial color="#f43f5e" depthTest={false} />
      </mesh>
      {/* Y Axis (Emerald Green) */}
      <Line points={[[0, 0, 0], [0, len, 0]]} color="#22c55e" lineWidth={2.5} depthTest={false} />
      <mesh position={[0, len, 0]} renderOrder={999}>
        <coneGeometry args={[0.14, 0.36, 16]} />
        <meshBasicMaterial color="#22c55e" depthTest={false} />
      </mesh>
      {/* Z Axis (Cobalt Blue) */}
      <Line points={[[0, 0, 0], [-len, 0, 0]]} color="#3b82f6" lineWidth={2.5} depthTest={false} />
      <mesh position={[-len, 0, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={999}>
        <coneGeometry args={[0.14, 0.36, 16]} />
        <meshBasicMaterial color="#3b82f6" depthTest={false} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Interior Hardwood / Tile Floor Slab (HomeByMe Dollhouse Interior Floor)
───────────────────────────────────────────────────────────────────────── */
function RoomInteriorFloor({ walls, floorPreset = 'warm_oak', onClick }) {
  const bounds = React.useMemo(() => {
    if (!Array.isArray(walls) || walls.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let found = false;

    const addBox = (px, pz, sx, sz, rotY = 0) => {
      const cos = Math.abs(Math.cos(rotY));
      const sin = Math.abs(Math.sin(rotY));
      const halfW = (sx * cos + sz * sin) / 2;
      const halfD = (sx * sin + sz * cos) / 2;
      minX = Math.min(minX, px - halfW);
      maxX = Math.max(maxX, px + halfW);
      minZ = Math.min(minZ, pz - halfD);
      maxZ = Math.max(maxZ, pz + halfD);
      found = true;
    };

    walls.forEach((w) => {
      if (w.hidden || w.type === 'text_label' || w.type === 'furniture') return;
      if (w.type === 'custom_group' && Array.isArray(w.children)) {
        const gx = w.position?.[0] || 0;
        const gz = w.position?.[2] || 0;
        const gsx = w.scale?.[0] || 1;
        const gsz = w.scale?.[2] || 1;
        const gRot = w.rotation?.[1] || 0;
        w.children.forEach((c) => {
          if (c.hidden || c.type === 'text_label' || c.type === 'furniture') return;
          addBox(
            gx + (c.position?.[0] || 0) * gsx,
            gz + (c.position?.[2] || 0) * gsz,
            (c.scale?.[0] || 1) * gsx,
            (c.scale?.[2] || 1) * gsz,
            gRot + (c.rotation?.[1] || 0)
          );
        });
      } else if (w.position && w.scale) {
        addBox(w.position[0], w.position[2], w.scale[0] || 1, w.scale[2] || 1, w.rotation?.[1] || 0);
      }
    });

    if (!found) return null;
    const width = Math.max(2, maxX - minX - 0.25);
    const depth = Math.max(2, maxZ - minZ - 0.25);
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    return { cx, cz, width, depth, minX, maxX, minZ, maxZ };
  }, [walls]);

  if (!bounds) return null;
  const mat = FLOOR_MATERIALS[floorPreset] || FLOOR_MATERIALS.warm_oak;
  const plankCount = Math.min(24, Math.max(4, Math.floor(bounds.width / 0.55)));
  const plankStep = bounds.width / plankCount;

  return (
    <group position={[bounds.cx, 0.014, bounds.cz]}>
      {/* Main Interior Floor Slab */}
      <mesh receiveShadow onClick={onClick}>
        <boxGeometry args={[bounds.width, 0.022, bounds.depth]} />
        <meshStandardMaterial color={mat.color} roughness={mat.roughness} metalness={0.04} />
      </mesh>
      {/* Subtle Plank Groove Lines */}
      {Array.from({ length: plankCount - 1 }).map((_, idx) => {
        const lx = -bounds.width / 2 + (idx + 1) * plankStep;
        return (
          <mesh key={idx} position={[lx, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.014, bounds.depth - 0.08]} />
            <meshBasicMaterial color={mat.plankLine || '#ab8a5e'} transparent opacity={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Room Layout Environment
───────────────────────────────────────────────────────────────────────── */
function RoomLayout({ 
  devices, editMode, activeTab,
  walls, setWalls,
  selectedObj, setSelectedObj,
  selectedForGroup = [],
  transformMode,
  onPlaceDevice,
  orbitRef,
  hiddenDevices = [],
  roomName = '',
  isExploreMode = false,
  showAvatar = true,
  floorPreset = 'warm_oak',
  drawWallMode = false,
  onDrawWallSegment = null,
  isCapturing = false,
  isSidebarPreview = false,
  showRuler = false,
  snapEnabled = true,
  cameraViewMode = 'orbit',
}) {
  const isLightMode = useIsLightMode();
  const [drawStartPoint, setDrawStartPoint] = useState(null);
  const [drawHoverPoint, setDrawHoverPoint] = useState(null);

  useEffect(() => {
    if (!drawWallMode) {
      setDrawStartPoint(null);
      setDrawHoverPoint(null);
    }
  }, [drawWallMode]);

  // Detect if selected object is a child inside a group
  const selectedGroupChild = React.useMemo(() => {
    if (!selectedObj) return null;
    for (const w of walls) {
      if (w.type === 'custom_group' && w.children) {
        const child = w.children.find(c => c.id === selectedObj.id);
        if (child) return { child, parentGroup: w };
      }
    }
    return null;
  }, [selectedObj, walls]);

  // Dynamic floor size calculation
  const floorSize = React.useMemo(() => {
    let max = 50; // Memperbesar default alas (setidaknya 100x100 grid)
    walls.forEach(w => {
      if (w.type === 'custom_group' && w.children) {
        w.children.forEach(child => {
          if (child.position && child.scale) {
            const scaleX = Math.max((w.scale?.[0] || 1) * child.scale[0], (w.scale?.[2] || 1) * child.scale[2]);
            const scaleZ = scaleX;
            const posX = (w.position?.[0] || 0) + (child.position[0] * (w.scale?.[0] || 1));
            const posZ = (w.position?.[2] || 0) + (child.position[2] * (w.scale?.[2] || 1));
            max = Math.max(max, Math.abs(posX) + (scaleX / 2));
            max = Math.max(max, Math.abs(posZ) + (scaleZ / 2));
          }
        });
      } else if (w.position && w.scale) {
        const longestSide = Math.max(w.scale[0], w.scale[2]);
        max = Math.max(max, Math.abs(w.position[0]) + (longestSide / 2));
        max = Math.max(max, Math.abs(w.position[2]) + (longestSide / 2));
      }
    });
    // Add 15 units padding, then round to nearest 20 for cleaner grid lines
    return Math.ceil((max + 15) / 10) * 20;
  }, [walls]);

  // Listener untuk Reset Camera dari Luar Canvas dan Keyboard Panning
  useEffect(() => {
    const handleReset = () => {
      if (orbitRef.current) {
        const cam = orbitRef.current.object;
        cam.position.set(0, 30, 0.1); 
        orbitRef.current.target.set(0, 0, 0);
        orbitRef.current.update();
      }
    };

    const handleOrbitView = () => {
      if (orbitRef.current) {
        const cam = orbitRef.current.object;
        cam.position.set(14, 19, 15);
        orbitRef.current.target.set(0, 0, 0);
        orbitRef.current.update();
      }
    };
    
    const handleZoomIn = () => {
      if (orbitRef.current) {
        const cam = orbitRef.current.object;
        const target = orbitRef.current.target;
        cam.position.lerp(target, 0.2);
        orbitRef.current.update();
      }
    };

    const handleZoomOut = () => {
      if (orbitRef.current) {
        const cam = orbitRef.current.object;
        const target = orbitRef.current.target;
        const distance = cam.position.distanceTo(target);
        if(distance < orbitRef.current.maxDistance) {
          cam.position.lerp(target, -0.2);
          orbitRef.current.update();
        }
      }
    };

    window.addEventListener('reset-camera', handleReset);
    window.addEventListener('orbit-camera', handleOrbitView);
    window.addEventListener('zoom-in', handleZoomIn);
    window.addEventListener('zoom-out', handleZoomOut);
    
    // Enable keyboard events for OrbitControls
    if (orbitRef.current) {
      orbitRef.current.listenToKeyEvents(window);
    }
    
    return () => {
      window.removeEventListener('reset-camera', handleReset);
      window.removeEventListener('orbit-camera', handleOrbitView);
      window.removeEventListener('zoom-in', handleZoomIn);
      window.removeEventListener('zoom-out', handleZoomOut);
    };
  }, []);

  // Keyboard Movement & Camera Follow
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Only if edit mode is on, a wall is selected, and we're not panning the camera
      if (editMode && selectedObj && selectedObj.type === 'wall' && transformMode !== 'camera') {
        let dx = 0;
        let dz = 0;
        const step = e.shiftKey ? 1 : (snapEnabled ? 0.25 : 0.1);

        if (e.key === 'ArrowUp') dz = -step;
        else if (e.key === 'ArrowDown') dz = step;
        else if (e.key === 'ArrowLeft') dx = -step;
        else if (e.key === 'ArrowRight') dx = step;

        if (dx !== 0 || dz !== 0) {
          e.preventDefault();
          
          setWalls(prev => {
            let updatedWorldPos = null;
            
            const newWalls = prev.map(w => {
              if (w.id === selectedObj.id) {
                if (w.locked) return w;
                const newPos = [w.position[0] + dx, w.position[1], w.position[2] + dz];
                updatedWorldPos = newPos;
                return { ...w, position: newPos };
              }
              if (w.type === 'custom_group' && w.children) {
                let changed = false;
                const newChildren = w.children.map(c => {
                  if (c.id === selectedObj.id) {
                    if (c.locked) return c;
                    changed = true;
                    const newPos = [c.position[0] + dx, c.position[1], c.position[2] + dz];
                    updatedWorldPos = [w.position[0] + newPos[0], w.position[1] + newPos[1], w.position[2] + newPos[2]];
                    return { ...c, position: newPos };
                  }
                  return c;
                });
                if (changed) return { ...w, children: newChildren };
              }
              return w;
            });

            if (updatedWorldPos && orbitRef.current) {
              const cam = orbitRef.current.object;
              const target = orbitRef.current.target;
              
              target.x += dx;
              target.z += dz;
              cam.position.x += dx;
              cam.position.z += dz;
              orbitRef.current.update();
            }

            return newWalls;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode, selectedObj, transformMode, snapEnabled]);

  const handleFloorClick = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    const sx = snapEnabled ? Math.round(e.point.x * 4) / 4 : e.point.x;
    const sz = snapEnabled ? Math.round(e.point.z * 4) / 4 : e.point.z;

    // Interactive Point-to-Point Wall Drawing Mode (Klik Titik A -> Klik Titik B)
    if (drawWallMode && onDrawWallSegment) {
      if (!drawStartPoint) {
        setDrawStartPoint([sx, sz]);
        setDrawHoverPoint([sx, sz]);
      } else {
        const [x1, z1] = drawStartPoint;
        const dist = Math.hypot(sx - x1, sz - z1);
        if (dist >= 0.4) {
          onDrawWallSegment([x1, z1], [sx, sz]);
          // Chain to next point so user can draw connected perimeter walls continuously
          setDrawStartPoint([sx, sz]);
          setDrawHoverPoint([sx, sz]);
        }
      }
      return;
    }
    
    if (activeTab === 'devices' && selectedObj?.type === 'device_spawn') {
      onPlaceDevice(selectedObj.id, [sx, 0.5, sz]);
    } else if (activeTab === 'walls') {
      setSelectedObj(null); // Deselect if clicking floor
    }
  };

  const handleFloorPointerMove = (e) => {
    if (!drawWallMode || !drawStartPoint) return;
    const sx = snapEnabled ? Math.round(e.point.x * 4) / 4 : e.point.x;
    const sz = snapEnabled ? Math.round(e.point.z * 4) / 4 : e.point.z;
    setDrawHoverPoint([sx, sz]);
  };

  const previewWallData = React.useMemo(() => {
    if (!drawWallMode || !drawStartPoint || !drawHoverPoint) return null;
    const [x1, z1] = drawStartPoint;
    const [x2, z2] = drawHoverPoint;
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 0.2) return null;
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const angle = -Math.atan2(z2 - z1, x2 - x1);
    return { midX, midZ, len, angle, x1, z1, x2, z2 };
  }, [drawWallMode, drawStartPoint, drawHoverPoint]);

  return (
    <>
      <TopDownCameraController 
        isSidebarPreview={isSidebarPreview} 
        walls={walls} 
        orbitRef={orbitRef} 
      />

      <OrbitControls 
        ref={orbitRef} 
        makeDefault 
        enabled={!isSidebarPreview}
        minPolarAngle={cameraViewMode === 'top2d' ? 0 : Math.PI / 8} 
        maxPolarAngle={cameraViewMode === 'top2d' ? 0.05 : Math.PI / 2.1} 
        minDistance={2} 
        maxDistance={200} 
        enablePan={!isSidebarPreview}
        enableZoom={!isSidebarPreview}
        enableRotate={!isSidebarPreview && cameraViewMode !== 'top2d'}
        keyPanSpeed={20}
        screenSpacePanning={false}
      />
      
      <group position={[0, -1, 0]}>
        {/* HomeByMe 3D Mannequin Avatar + Floor Navigation Disc */}
        {(isExploreMode || showAvatar) && !isCapturing && !isSidebarPreview && (
          <ThirdPersonAvatar orbitRef={orbitRef} walls={walls} isExploreMode={isExploreMode} />
        )}
        
        {/* Lantai Studio Arsitektur HomeByMe (Clean Light Architectural Grid) */}
        {!isCapturing && (
          <RoundedBox 
            args={[floorSize, 0.2, floorSize]} 
            radius={0.05} 
            smoothness={4} 
            position={[0, -0.1, 0]} 
            receiveShadow
            onClick={handleFloorClick}
            onPointerMove={handleFloorPointerMove}
            onContextMenu={(e) => {
              if (drawWallMode) {
                e.stopPropagation();
                setDrawStartPoint(null);
                setDrawHoverPoint(null);
              }
            }}
            onPointerOver={() => {
              if (editMode && (drawWallMode || (activeTab === 'devices' && selectedObj?.type === 'device_spawn'))) {
                document.body.style.cursor = 'crosshair';
              }
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <meshStandardMaterial 
              color="#f3f4f6" 
              roughness={0.75} 
              metalness={0.02} 
            />
          </RoundedBox>
        )}

        {/* HomeByMe Subtle Architectural Tile Grid */}
        {!isCapturing && (
          <>
            <gridHelper 
              args={[floorSize, floorSize, '#dcdfe6', '#e5e7eb']} 
              position={[0, 0.005, 0]} 
            />
            <gridHelper 
              args={[floorSize, Math.round(floorSize / 4), '#cbd0d9', '#dcdfe6']} 
              position={[0, 0.009, 0]} 
            />
          </>
        )}

        {/* Warm Oak Hardwood Interior Floor inside Room Footprint */}
        <RoomInteriorFloor walls={walls} floorPreset={floorPreset} onClick={handleFloorClick} />

        {/* Live Point-to-Point Wall Drawing Preview (Gambar Dinding Manual) */}
        {drawWallMode && drawStartPoint && (
          <group>
            <mesh position={[drawStartPoint[0], 0.1, drawStartPoint[1]]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshBasicMaterial color="#2563eb" />
            </mesh>
            {previewWallData && (
              <>
                <mesh
                  position={[previewWallData.midX, 2, previewWallData.midZ]}
                  rotation={[0, previewWallData.angle, 0]}
                >
                  <boxGeometry args={[previewWallData.len, 4, 0.32]} />
                  <meshStandardMaterial color="#3b82f6" transparent opacity={0.42} />
                </mesh>
                <Html position={[previewWallData.midX, 4.35, previewWallData.midZ]} center>
                  <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold font-mono tabular-nums shadow-lg whitespace-nowrap pointer-events-none">
                    {previewWallData.len.toFixed(2)} m
                  </div>
                </Html>
              </>
            )}
          </group>
        )}

        {/* 3D Architectural Dimension Ruler Lines (Optional toggle) */}
        {!isCapturing && !isSidebarPreview && (
          <RoomDimensionRuler walls={walls} visible={showRuler} />
        )}

        {/* Tembok (Walls) */}
        {walls.map((wall) => {
          if (wall.hidden) return null;

          // If a child of this group is selected, pass selectedObj down so group knows to skip it
          const isSelected = editMode && activeTab === 'walls' && (selectedObj?.id === wall.id || selectedForGroup.includes(wall.id));
          
          return (
            <WallBlockWithTransform 
              key={wall.id}
              wall={wall}
              isSelected={isSelected}
              selectedObj={selectedObj}
              selectedForGroup={selectedForGroup}
              editMode={editMode}
              activeTab={activeTab}
              setSelectedObj={setSelectedObj}
              transformMode={transformMode}
              setWalls={setWalls}
              orbitRef={orbitRef}
              isCapturing={isCapturing}
            />
          );
        })}

        {/* Perangkat (Devices) */}
        {devices.map((dev) => {
          if (hiddenDevices.includes(dev.id)) return null;
          const pos = dev.broker_config?.position;
          if (!pos) return null;

          const isSelected = editMode && activeTab === 'devices' && selectedObj?.id === dev.id;

          return (
            <DeviceNodeWithTransform 
              key={dev.id}
              dev={dev}
              isSelected={isSelected}
              editMode={editMode}
              activeTab={activeTab}
              setSelectedObj={setSelectedObj}
              transformMode={transformMode}
              orbitRef={orbitRef}
              onPlaceDevice={onPlaceDevice}
              isCapturing={isCapturing}
            />
          );
        })}
      </group>
      {editMode && activeTab === 'walls' && (
        <MultiSelectGizmo 
          selectedForGroup={selectedForGroup} 
          walls={walls} 
          transformMode={transformMode} 
          setWalls={setWalls} 
          orbitRef={orbitRef} 
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Default Blank / Plain Room (Polosan) for New Rooms & Full HomeByMe Suite Preset
───────────────────────────────────────────────────────────────────────── */
function createBlankRoomDefault() {
  // 4 dinding individual polosan (tidak digrup agar tiap sisi dinding bisa langsung diklik, dicat, digeser, atau diubah jadi pintu/jendela)
  return [
    { id: 'wall_north', name: 'Dinding Utara', type: 'wall', materialPreset: 'matte_slate', position: [0, 2, -4.5], scale: [9.35, 4, 0.35], rotation: [0, 0, 0] },
    { id: 'wall_south', name: 'Dinding Selatan (Pintu)', type: 'door_wall', materialPreset: 'matte_slate', position: [0, 2, 4.5], scale: [9.35, 4, 0.35], rotation: [0, 0, 0] },
    { id: 'wall_west', name: 'Dinding Barat', type: 'wall', materialPreset: 'matte_slate', position: [-4.5, 2, 0], scale: [0.35, 4, 8.65], rotation: [0, 0, 0] },
    { id: 'wall_east', name: 'Dinding Timur', type: 'wall', materialPreset: 'matte_slate', position: [4.5, 2, 0], scale: [0.35, 4, 8.65], rotation: [0, 0, 0] },
  ];
}

function createHomeByMeDefaultSuite(cleanRoomName = 'Bedroom bis') {
  return [
    {
      id: 'homebyme_room_group',
      type: 'custom_group',
      name: cleanRoomName,
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      materialPreset: 'matte_slate',
      children: [
        // Espresso Accent Wall behind Queen Bed (Left North)
        { id: 'hbm_w_accent', name: 'Dinding Aksen Espresso', type: 'wall', materialPreset: 'accent_espresso', position: [-1.6, 0, -4.2], scale: [6.8, 4, 0.35], rotation: [0, 0, 0] },
        // Top En-Suite Alcove Back & Side Walls (Upper Left Alcove)
        { id: 'hbm_w_alcove_n', name: 'Dinding Alcove Utara', type: 'wall', materialPreset: 'matte_slate', position: [-1.6, 0, -5.6], scale: [6.8, 4, 0.3], rotation: [0, 0, 0] },
        { id: 'hbm_w_alcove_w', name: 'Dinding Alcove Barat', type: 'wall', materialPreset: 'matte_slate', position: [-4.85, 0, -4.9], scale: [0.3, 4, 1.4], rotation: [0, 0, 0] },
        { id: 'hbm_w_alcove_e', name: 'Dinding Alcove Timur', type: 'wall', materialPreset: 'matte_slate', position: [1.65, 0, -4.9], scale: [0.3, 4, 1.4], rotation: [0, 0, 0] },
        // Right North Wall behind Walk-in Wardrobe
        { id: 'hbm_w_north_r', name: 'Dinding Utara Kanan', type: 'wall', materialPreset: 'matte_slate', position: [3.35, 0, -4.2], scale: [3.4, 4, 0.35], rotation: [0, 0, 0] },
        // Left Perimeter Wall (West)
        { id: 'hbm_w_west', name: 'Dinding Barat (Tirai)', type: 'wall', materialPreset: 'matte_slate', position: [-4.85, 0, 0.05], scale: [0.35, 4, 8.5], rotation: [0, 0, 0] },
        // Right Perimeter Wall (East)
        { id: 'hbm_w_east', name: 'Dinding Timur (Meja Rias)', type: 'wall', materialPreset: 'matte_slate', position: [4.88, 0, 0.05], scale: [0.35, 4, 8.5], rotation: [0, 0, 0] },
        // Front Cutaway Wall (South - auto semi-transparent when facing camera)
        { id: 'hbm_w_south', name: 'Dinding Depan (Cutaway)', type: 'door_wall', materialPreset: 'matte_slate', position: [0, 0, 4.25], scale: [10.05, 4, 0.32], rotation: [0, 0, 0] },
        // Interior Translucent Partition Wall separating Bed Zone & Dressing Zone
        { id: 'hbm_w_partition', name: 'Sekat Ruang Ganti', type: 'door_wall_left', materialPreset: 'glass_frosted', position: [1.65, 0, 0.15], scale: [0.24, 4, 8.2], rotation: [0, 0, 0] },
      ],
    },
    // 1. Cream Textured Area Rug under Bed & Avatar
    {
      id: 'hbm_rug',
      type: 'furniture',
      furnitureType: 'area_rug',
      name: 'Karpet Area Cream',
      position: [-1.55, 0.02, 0.25],
      rotation: [0, 0, 0],
      scale: [5.4, 1, 4.8],
    },
    // 2. Master Bed Suite (Bed + Headboard + Espresso Pillows + Foot Bench + Nightstands + Pendants + Wall Art)
    {
      id: 'hbm_bed_suite',
      type: 'furniture',
      furnitureType: 'bed_suite',
      name: 'Set Tempat Tidur Utama',
      position: [-1.6, 0, -2.0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    // 3. Floor-to-Ceiling Pleated Sheer Curtain along Left Wall
    {
      id: 'hbm_curtain',
      type: 'furniture',
      furnitureType: 'curtain_drape',
      name: 'Tirai Jendela Kiri',
      position: [-4.52, 2.0, 0.1],
      rotation: [0, Math.PI / 2, 0],
      scale: [6.4, 3.85, 0.22],
    },
    // 4. Walk-In Wardrobe Closet in Upper-Right Zone
    {
      id: 'hbm_wardrobe',
      type: 'furniture',
      furnitureType: 'wardrobe',
      name: 'Lemari Pakaian Built-in',
      position: [2.42, 0, -1.85],
      rotation: [0, Math.PI / 2, 0],
      scale: [3.8, 3.65, 1.05],
    },
    // 5. Dressing Vanity Console, Mirror & Chair against Right Wall
    {
      id: 'hbm_vanity',
      type: 'furniture',
      furnitureType: 'vanity_desk',
      name: 'Meja Rias & Cermin',
      position: [4.25, 0, 1.15],
      rotation: [0, -Math.PI / 2, 0],
      scale: [2.2, 1, 0.85],
    },
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────── */
export default function FloorPlan({ 
  hideHeader = false, 
  isWidget = false, 
  isSidebarPreview = false,
  roomId = 'default', 
  roomName = '',
  initialDevices = null,
  roomsList = [],
  onSelectRoom = null,
  isPinned = false,
  onTogglePin = null,
  onBackToList = null,
}) {
  const isStudioEditor = !isWidget && !isSidebarPreview;
  const [devices, setDevices] = useState(() => (Array.isArray(initialDevices) && initialDevices.length > 0 ? initialDevices : []));
  const [editMode, setEditMode] = useState(() => !isWidget && !isSidebarPreview);
  const [activeTab, setActiveTab] = useState('walls'); // 'walls' | 'furniture' | 'devices' | 'material'

  // HomeByMe Floating UI & Studio Controls
  const [cameraViewMode, setCameraViewMode] = useState('orbit'); // 'orbit' | 'top2d'
  const [pbrMode, setPbrMode] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [showAvatar, setShowAvatar] = useState(true);
  const [floorPreset, setFloorPreset] = useState('warm_oak');
  const [lightingMode, setLightingMode] = useState('studio'); // 'studio' | 'bright' | 'warm'
  const [showWasdPip, setShowWasdPip] = useState(true);
  const [layerFilter, setLayerFilter] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [activeMaterialPreset, setActiveMaterialPreset] = useState('matte_slate');
  const [pressedKeys, setPressedKeys] = useState({ w: false, a: false, s: false, d: false });
  const [activeDrawer, setActiveDrawer] = useState('build'); // Open Build drawer by default so user can immediately start building
  const [drawWallMode, setDrawWallMode] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showHelpPopover, setShowHelpPopover] = useState(false);

  // Builder State — Default Awal Buat = Polosan (4 dinding dasar individual yang siap dimodifikasi/diisi sendiri)
  const [walls, setWalls] = useState(() => {
    const saved = localStorage.getItem(getUserScopedKey(`iot_layout_walls_${roomId}`))
      || (roomId !== 'default' ? localStorage.getItem(`iot_layout_walls_${roomId}`) : null);
    let parsed = saved ? JSON.parse(saved) : [];
    const cleanRoomName = (roomName && !roomName.includes('undefined') && !roomName.includes('null'))
      ? roomName.replace(/^Ruangan:\s*/i, '').trim()
      : 'Ruangan Baru';

    if (!saved || !Array.isArray(parsed) || parsed.length === 0) {
      return createBlankRoomDefault();
    }

    parsed = parsed.map((w) => {
      if (w.type === 'text_label') {
        const currentText = w.text || '';
        if (!currentText || currentText.includes('undefined') || currentText.includes('null') || currentText === 'NAMA RUANGAN') {
          return { ...w, text: cleanRoomName };
        }
      }
      return w;
    });
    return parsed;
  });

  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hiddenDevices, setHiddenDevices] = useState([]);
  const [transformMode, setTransformMode] = useState('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const isLightMode = useIsLightMode();
  const containerRef = useRef();
  const orbitRef = useRef();

  // Track WASD key presses for the bottom-left WASD Picture-in-Picture overlay
  useEffect(() => {
    const down = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      const k = e.key?.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        setPressedKeys((p) => (p[k] ? p : { ...p, [k]: true }));
      }
    };
    const up = (e) => {
      const k = e.key?.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(k)) {
        setPressedKeys((p) => (!p[k] ? p : { ...p, [k]: false }));
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Undo/Redo history stack
  const [wallsHistory, setWallsHistory] = useState(() => {
    const saved = localStorage.getItem(getUserScopedKey(`iot_layout_walls_${roomId}`))
      || (roomId !== 'default' ? localStorage.getItem(`iot_layout_walls_${roomId}`) : null);
    return [saved ? JSON.parse(saved) : []];
  });
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync label teks saat roomName prop diperbarui
  useEffect(() => {
    if (roomName && !roomName.includes('undefined') && !roomName.includes('null')) {
      const clean = roomName.replace(/^Ruangan:\s*/i, '').trim();
      setWalls((prev) =>
        prev.map((w) => {
          if (w.type === 'text_label' && (w.text?.includes('undefined') || w.text === 'NAMA RUANGAN' || !w.text)) {
            return { ...w, text: clean };
          }
          return w;
        })
      );
    }
  }, [roomName]);

  // Wrap setWalls to auto-push history
  const setWallsWithHistory = (updaterOrValue) => {
    setWalls(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      setWallsHistory(h => {
        const trimmed = h.slice(0, historyIndex + 1);
        const newH = [...trimmed, next].slice(-50);
        setHistoryIndex(newH.length - 1);
        return newH;
      });
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setWalls(wallsHistory[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedObj(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < wallsHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setWalls(wallsHistory[newIndex]);
      setHistoryIndex(newIndex);
      setSelectedObj(null);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < wallsHistory.length - 1;

  useEffect(() => {
    if (isWidget || isSidebarPreview) {
      if (initialDevices !== undefined && initialDevices !== null) {
        setDevices(Array.isArray(initialDevices) ? initialDevices : []);
        return;
      }
      devicesApi.list().then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setDevices(list);
      }).catch(console.error);
      return;
    }

    const fetchDevices = () => {
      devicesApi.list().then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setDevices(list);
      }).catch(console.error);
    };
    fetchDevices();
    const iv = setInterval(fetchDevices, 12000);
    return () => clearInterval(iv);
  }, [isWidget, isSidebarPreview, initialDevices]);

  const saveLayout = () => {
    localStorage.setItem(getUserScopedKey(`iot_layout_walls_${roomId}`), JSON.stringify(walls));
    Swal.fire({
      toast: true,
      position: 'top-end',
      timer: 2200,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#f1f5f9',
      icon: 'success',
      title: 'Layout 3D berhasil disimpan!',
    });
  };

  const getSpawnPosition = () => {
    if (orbitRef.current) {
      const t = orbitRef.current.target;
      const sx = snapEnabled ? Math.round(t.x * 4) / 4 : t.x;
      const sz = snapEnabled ? Math.round(t.z * 4) / 4 : t.z;
      return [sx, 2, sz];
    }
    return [0, 2, 0];
  };

  const handleAddWall = (customProps = {}) => {
    const newWall = {
      id: 'wall_' + Date.now(),
      position: getSpawnPosition(),
      scale: [4, 4, 0.5],
      rotation: [0, 0, 0],
      materialPreset: activeMaterialPreset,
      ...customProps,
    };
    setWallsWithHistory(prev => [...prev, newWall]);
    setSelectedObj({ type: 'wall', id: newWall.id });
    if (transformMode === 'select') setTransformMode('translate');
  };

  const handleDuplicateWall = () => {
    if (selectedObj?.type !== 'wall') return;
    const existing = walls.find(w => w.id === selectedObj.id);
    if (!existing) return;
    const newWall = {
      ...existing,
      id: 'wall_' + Date.now(),
      position: [existing.position[0] + 0.5, existing.position[1], existing.position[2] + 0.5],
    };
    setWallsWithHistory(prev => [...prev, newWall]);
    setSelectedObj({ type: 'wall', id: newWall.id });
  };

  const handleGroupSelected = () => {
    if (selectedForGroup.length < 2) return;
    const itemsToGroup = [];
    walls.forEach(w => {
      if (selectedForGroup.includes(w.id)) {
        itemsToGroup.push({ ...w, worldPos: w.position });
      }
      if (w.type === 'custom_group' && w.children) {
        w.children.forEach(c => {
          if (selectedForGroup.includes(c.id)) {
            itemsToGroup.push({
              ...c,
              worldPos: [
                c.position[0] + w.position[0],
                c.position[1] + w.position[1],
                c.position[2] + w.position[2]
              ]
            });
          }
        });
      }
    });

    if (itemsToGroup.length < 2) return;
    
    let cx = 0, cy = 0, cz = 0;
    itemsToGroup.forEach(item => {
      cx += item.worldPos[0];
      cy += item.worldPos[1];
      cz += item.worldPos[2];
    });
    cx /= itemsToGroup.length;
    cy /= itemsToGroup.length;
    cz /= itemsToGroup.length;

    const groupChildren = itemsToGroup.map(item => {
      const child = { ...item };
      delete child.worldPos;
      return {
        ...child,
        position: [item.worldPos[0] - cx, item.worldPos[1] - cy, item.worldPos[2] - cz]
      };
    });

    const newGroup = {
      id: 'group_' + Date.now(),
      type: 'custom_group',
      name: 'Grup Baru',
      position: [cx, cy, cz],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      materialPreset: activeMaterialPreset,
      children: groupChildren
    };

    setWallsWithHistory(prev => {
      let newWalls = [...prev];
      newWalls = newWalls.filter(w => !selectedForGroup.includes(w.id));
      newWalls = newWalls.map(w => {
        if (w.type === 'custom_group' && w.children) {
          return { ...w, children: w.children.filter(c => !selectedForGroup.includes(c.id)) };
        }
        return w;
      });
      return [...newWalls, newGroup];
    });
    
    setSelectedForGroup([]);
    setSelectedObj({ type: 'wall', id: newGroup.id });
  };

  const handleUngroup = () => {
    if (selectedObj?.type !== 'wall') return;
    const groupWall = walls.find(w => w.id === selectedObj.id);
    if (!groupWall || groupWall.type !== 'custom_group') return;
    
    const newWalls = groupWall.children.map((child, i) => {
      return {
        ...child,
        id: 'wall_ungrouped_' + Date.now() + '_' + i,
        position: [
          (child.position[0] * groupWall.scale[0]) + groupWall.position[0],
          (child.position[1] * groupWall.scale[1]) + groupWall.position[1],
          (child.position[2] * groupWall.scale[2]) + groupWall.position[2],
        ],
        scale: [
          child.scale[0] * groupWall.scale[0],
          child.scale[1] * groupWall.scale[1],
          child.scale[2] * groupWall.scale[2],
        ]
      };
    });

    setWallsWithHistory(prev => [...prev.filter(w => w.id !== groupWall.id), ...newWalls]);
    setSelectedObj(null);
  };

  const handleDeleteWall = () => {
    setWallsWithHistory(prev => {
      let newWalls = [...prev];
      if (selectedForGroup.length > 0) {
        newWalls = newWalls.filter(w => w.locked || !selectedForGroup.includes(w.id));
        newWalls = newWalls.map(w => {
          if (w.type === 'custom_group' && w.children) {
            return { ...w, children: w.children.filter(c => c.locked || !selectedForGroup.includes(c.id)) };
          }
          return w;
        });
        setSelectedForGroup([]);
      } else if (selectedObj?.type === 'wall') {
        newWalls = newWalls.filter(w => w.locked || w.id !== selectedObj.id);
        newWalls = newWalls.map(w => {
          if (w.type === 'custom_group' && w.children) {
            return { ...w, children: w.children.filter(c => c.locked || c.id !== selectedObj.id) };
          }
          return w;
        });
        setSelectedObj(null);
      }
      return newWalls;
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedObj?.type === 'wall' || selectedForGroup.length > 0)) {
        handleDeleteWall();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editMode) saveLayout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObj, selectedForGroup, editMode, handleUndo, wallsHistory, historyIndex]);

  const handleClearAll = () => {
    Swal.fire({
      target: containerRef.current || document.body,
      title: 'Hapus Semua Tembok?',
      text: "Anda akan mereset kanvas. Aksi ini tidak bisa dibatalkan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Ya, Bersihkan!'
    }).then((result) => {
      if (result.isConfirmed) {
        setWallsWithHistory([]);
        setSelectedObj(null);
      }
    });
  };

  const handleSwitchCameraView = (mode) => {
    setCameraViewMode(mode);
    if (mode === 'top2d') {
      window.dispatchEvent(new Event('reset-camera'));
    } else {
      window.dispatchEvent(new Event('orbit-camera'));
    }
  };

  const handleDownloadImage = () => {
    if (!orbitRef.current) return;
    setIsCapturing(true);
    const cam = orbitRef.current.object;
    const oc = orbitRef.current;
    
    const currentPos = cam.position.clone();
    const currentTarget = oc.target.clone();
    const currentFov = cam.fov;
    const oldMaxDist = oc.maxDistance;
    const oldMinPolar = oc.minPolarAngle;
    const oldMaxPolar = oc.maxPolarAngle;
    const oldFar = cam.far;

    let minX = -10, maxX = 10, minZ = -10, maxZ = 10;
    const checkObj = (obj, parentX = 0, parentZ = 0) => {
      const x = parentX + (obj.position?.[0] || 0);
      const z = parentZ + (obj.position?.[2] || 0);
      const rotY = obj.rotation?.[1] || 0;
      let sx = (obj.scale?.[0] || 1) / 2;
      let sz = (obj.scale?.[2] || 1) / 2;
      if (Math.abs(rotY) > 0.1 && Math.abs(rotY) < 3) {
        const temp = sx; sx = sz; sz = temp;
      }
      if (x - sx < minX) minX = x - sx;
      if (x + sx > maxX) maxX = x + sx;
      if (z - sz < minZ) minZ = z - sz;
      if (z + sz > maxZ) maxZ = z + sz;
    };

    if (walls && walls.length > 0) {
      walls.forEach(w => {
        if (w.type === 'custom_group' && w.children) {
          w.children.forEach(c => checkObj(c, w.position[0], w.position[2]));
        } else {
          checkObj(w);
        }
      });
    }

    const canvas = containerRef.current.querySelector('canvas');
    const aspect = canvas ? canvas.clientWidth / canvas.clientHeight : 1;
    const width = maxX - minX + 15; 
    const depth = maxZ - minZ + 15; 
    const maxDim = Math.max(depth, width / aspect);
    const targetFov = 3;
    const dist = (maxDim / 2) / Math.tan((targetFov / 2) * (Math.PI / 180));
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    oc.maxDistance = Infinity;
    oc.minPolarAngle = 0;
    oc.maxPolarAngle = Math.PI;

    cam.fov = targetFov;
    cam.far = Math.max(cam.far, dist + 2000); 
    cam.position.set(centerX, dist, centerZ);
    cam.updateProjectionMatrix();
    oc.target.set(centerX, 0, centerZ);
    oc.update();

    Swal.fire({
      title: 'Menyimpan Denah...',
      text: 'Mohon tunggu sebentar',
      timer: 800,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      if (canvas) {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `denah_${roomId || 'ruangan'}.png`;
        link.href = image;
        link.click();
      }
      
      oc.maxDistance = oldMaxDist;
      oc.minPolarAngle = oldMinPolar;
      oc.maxPolarAngle = oldMaxPolar;
      cam.fov = currentFov;
      cam.far = oldFar;
      cam.position.copy(currentPos);
      cam.updateProjectionMatrix();
      oc.target.copy(currentTarget);
      oc.update();
      setIsCapturing(false);
    });
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(walls, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iot_layout_${roomId || 'default'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed)) {
          setWallsWithHistory(parsed);
          Swal.fire({
            target: containerRef.current || document.body,
            title: 'Berhasil',
            text: 'Layout berhasil diimpor!',
            icon: 'success'
          });
        } else {
          throw new Error('Format JSON tidak valid');
        }
      } catch (err) {
        Swal.fire({
          target: containerRef.current || document.body,
          title: 'Gagal',
          text: 'File JSON tidak valid atau rusak.',
          icon: 'error'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handlePlaceDevice = async (id, position, rotation, scale) => {
    const updatedRoomId = roomId === 'default' ? null : Number(roomId);
    
    setDevices(prev => prev.map(d => {
      if (d.id !== id) return d;
      const config = { ...(d.broker_config || {}) };
      if (position) config.position = position;
      if (rotation) config.rotation = rotation;
      if (scale) config.scale = scale;
      return { 
        ...d, 
        room_id: updatedRoomId !== null ? updatedRoomId : d.room_id,
        broker_config: config 
      };
    }));
    
    const device = devices.find(d => d.id === id);
    if (device) {
      const config = { ...(device.broker_config || {}) };
      if (position) config.position = position;
      if (rotation) config.rotation = rotation;
      if (scale) config.scale = scale;
      const payload = { 
        ...device, 
        broker_config: config 
      };
      if (updatedRoomId !== null) payload.room_id = updatedRoomId;
      devicesApi.update(id, payload).catch(console.error);
    }
  };

  const handleRemoveDevicePosition = async (id) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const config = { ...d.broker_config }; delete config.position;
        return { ...d, broker_config: config };
      }
      return d;
    }));
    const device = devices.find(d => d.id === id);
    if (device) {
      const config = { ...device.broker_config }; delete config.position;
      await devicesApi.update(id, { ...device, broker_config: config }).catch(console.error);
    }
    setSelectedObj(null);
  };

  const handleRemoveDeviceFromRoom = async (id) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) {
        const config = { ...d.broker_config }; delete config.position;
        return { ...d, room_id: null, broker_config: config };
      }
      return d;
    }));
    const device = devices.find(d => d.id === id);
    if (device) {
      const config = { ...device.broker_config }; delete config.position;
      await devicesApi.update(id, { ...device, room_id: null, broker_config: config }).catch(console.error);
    }
    setSelectedObj(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleEnterEditMode = () => {
    setEditMode(true);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Resolve currently inspected object (wall, group child, or device)
  const inspectedTarget = React.useMemo(() => {
    if (selectedObj?.type === 'wall') {
      const top = walls.find(w => w.id === selectedObj.id);
      if (top) return { kind: 'wall', obj: top, parentGroup: null };
      for (const w of walls) {
        if (w.type === 'custom_group' && w.children) {
          const child = w.children.find(c => c.id === selectedObj.id);
          if (child) return { kind: 'child', obj: child, parentGroup: w };
        }
      }
    }
    if (selectedObj?.type === 'device') {
      const dev = devices.find(d => d.id === selectedObj.id);
      if (dev) return { kind: 'device', obj: dev, parentGroup: null };
    }
    return null;
  }, [selectedObj, walls, devices]);

  const inspectedCoords = React.useMemo(() => {
    if (!inspectedTarget?.obj) return { x: 0, y: 0, z: 0 };
    if (inspectedTarget.kind === 'device') {
      const p = inspectedTarget.obj.broker_config?.position || [0, 0, 0];
      return { x: Number(p[0] || 0), y: Number(p[1] || 0), z: Number(p[2] || 0) };
    }
    const p = inspectedTarget.obj.position || [0, 0, 0];
    return { x: Number(p[0] || 0), y: Number(p[1] || 0), z: Number(p[2] || 0) };
  }, [inspectedTarget]);

  const updateInspectedCoord = (axisIdx, rawValue) => {
    const num = parseFloat(rawValue);
    if (Number.isNaN(num) || !inspectedTarget?.obj) return;
    if (inspectedTarget.kind === 'device') {
      const cur = [...(inspectedTarget.obj.broker_config?.position || [0, 0.5, 0])];
      cur[axisIdx] = num;
      handlePlaceDevice(inspectedTarget.obj.id, cur);
      return;
    }
    setWallsWithHistory(prev => prev.map(w => {
      if (w.id === inspectedTarget.obj.id) {
        const nextPos = [...(w.position || [0, 2, 0])];
        nextPos[axisIdx] = num;
        return { ...w, position: nextPos };
      }
      if (inspectedTarget.parentGroup && w.id === inspectedTarget.parentGroup.id && w.children) {
        return {
          ...w,
          children: w.children.map(c => {
            if (c.id !== inspectedTarget.obj.id) return c;
            const nextPos = [...(c.position || [0, 0, 0])];
            nextPos[axisIdx] = num;
            return { ...c, position: nextPos };
          }),
        };
      }
      return w;
    }));
  };

  const inspectedScale = React.useMemo(() => {
    if (!inspectedTarget?.obj) return { x: 1, y: 1, z: 1 };
    if (inspectedTarget.kind === 'device') {
      const s = inspectedTarget.obj.broker_config?.scale || [1, 1, 1];
      return { x: Number(s[0] || 1), y: Number(s[1] || 1), z: Number(s[2] || 1) };
    }
    const s = inspectedTarget.obj.scale || [1, 1, 1];
    return { x: Number(s[0] || 1), y: Number(s[1] || 1), z: Number(s[2] || 1) };
  }, [inspectedTarget]);

  const updateInspectedScale = (axisIdx, rawValue) => {
    const num = Math.max(0.1, parseFloat(rawValue));
    if (Number.isNaN(num) || !inspectedTarget?.obj) return;
    setWallsWithHistory((prev) =>
      prev.map((w) => {
        if (w.id === inspectedTarget.obj.id) {
          const nextScale = [...(w.scale || [1, 1, 1])];
          nextScale[axisIdx] = num;
          return { ...w, scale: nextScale };
        }
        if (inspectedTarget.parentGroup && w.id === inspectedTarget.parentGroup.id && w.children) {
          return {
            ...w,
            children: w.children.map((c) => {
              if (c.id !== inspectedTarget.obj.id) return c;
              const nextScale = [...(c.scale || [1, 1, 1])];
              nextScale[axisIdx] = num;
              return { ...c, scale: nextScale };
            }),
          };
        }
        return w;
      })
    );
  };

  const rotateInspectedByDeg = (degDelta) => {
    if (!inspectedTarget?.obj) return;
    const radDelta = (degDelta * Math.PI) / 180;
    if (inspectedTarget.kind === 'device') {
      const curPos = inspectedTarget.obj.broker_config?.position || [0, 0.5, 0];
      const curRot = [...(inspectedTarget.obj.broker_config?.rotation || [0, 0, 0])];
      curRot[1] = (curRot[1] || 0) + radDelta;
      handlePlaceDevice(inspectedTarget.obj.id, curPos, curRot);
      return;
    }
    setWallsWithHistory((prev) =>
      prev.map((w) => {
        if (w.id === inspectedTarget.obj.id) {
          const nextRot = [...(w.rotation || [0, 0, 0])];
          nextRot[1] = (nextRot[1] || 0) + radDelta;
          return { ...w, rotation: nextRot };
        }
        if (inspectedTarget.parentGroup && w.id === inspectedTarget.parentGroup.id && w.children) {
          return {
            ...w,
            children: w.children.map((c) => {
              if (c.id !== inspectedTarget.obj.id) return c;
              const nextRot = [...(c.rotation || [0, 0, 0])];
              nextRot[1] = (nextRot[1] || 0) + radDelta;
              return { ...c, rotation: nextRot };
            }),
          };
        }
        return w;
      })
    );
  };

  const updateInspectedWallType = (newType) => {
    if (!inspectedTarget?.obj) return;
    const nextPreset = newType === 'glass_wall' ? 'glass_frosted' : (inspectedTarget.obj.materialPreset === 'glass_frosted' ? 'matte_slate' : inspectedTarget.obj.materialPreset);
    setWallsWithHistory((prev) =>
      prev.map((w) => {
        if (w.id === inspectedTarget.obj.id) {
          return { ...w, type: newType, materialPreset: nextPreset };
        }
        if (inspectedTarget.parentGroup && w.id === inspectedTarget.parentGroup.id && w.children) {
          return {
            ...w,
            children: w.children.map((c) =>
              c.id === inspectedTarget.obj.id ? { ...c, type: newType, materialPreset: nextPreset } : c
            ),
          };
        }
        return w;
      })
    );
  };

  const updateInspectedCustomColor = (hexColor) => {
    if (!inspectedTarget?.obj) return;
    setWallsWithHistory((prev) =>
      prev.map((w) => {
        if (w.id === inspectedTarget.obj.id) {
          return { ...w, customColor: hexColor };
        }
        if (inspectedTarget.parentGroup && w.id === inspectedTarget.parentGroup.id && w.children) {
          return {
            ...w,
            children: w.children.map((c) =>
              c.id === inspectedTarget.obj.id ? { ...c, customColor: hexColor } : c
            ),
          };
        }
        return w;
      })
    );
  };

  const handleDrawWallSegment = (ptA, ptB) => {
    const [x1, z1] = ptA;
    const [x2, z2] = ptB;
    const len = Math.max(0.5, Math.round(Math.hypot(x2 - x1, z2 - z1) * 20) / 20);
    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const angle = -Math.atan2(z2 - z1, x2 - x1);
    const newWall = {
      id: 'wall_draw_' + Date.now(),
      name: `Dinding (${len.toFixed(1)}m)`,
      type: 'wall',
      materialPreset: activeMaterialPreset || 'matte_slate',
      position: [midX, 2, midZ],
      scale: [len, 4, 0.35],
      rotation: [0, angle, 0],
    };
    setWallsWithHistory((prev) => [...prev, newWall]);
    setSelectedObj({ type: 'wall', id: newWall.id });
  };

  const applyMaterialToSelectionOrAll = (presetId) => {
    setActiveMaterialPreset(presetId);
    setWallsWithHistory(prev => prev.map(w => {
      if (selectedObj?.type === 'wall') {
        if (w.id === selectedObj.id) {
          return {
            ...w,
            materialPreset: presetId,
            customColor: null,
            children: w.children ? w.children.map(c => ({ ...c, materialPreset: presetId, customColor: null })) : w.children,
          };
        }
        if (w.type === 'custom_group' && w.children) {
          return {
            ...w,
            children: w.children.map(c => c.id === selectedObj.id ? { ...c, materialPreset: presetId, customColor: null } : c),
          };
        }
        return w;
      }
      // If nothing selected, apply to main structure walls
      if (w.type === 'text_label' || w.type === 'furniture') return w;
      return {
        ...w,
        materialPreset: presetId,
        customColor: null,
        children: w.children ? w.children.map(c => ({ ...c, materialPreset: presetId, customColor: null })) : w.children,
      };
    }));
  };

  const cleanRoomTitle = (roomName && !roomName.includes('undefined') && !roomName.includes('null'))
    ? roomName.replace(/^Ruangan:\s*/i, '').trim()
    : 'Ruangan 3D';

  const currentRoomDevices = React.useMemo(() => {
    return roomId === 'default'
      ? (Array.isArray(devices) ? devices : [])
      : (Array.isArray(devices) ? devices : []).filter(d => Number(d?.room_id) === Number(roomId));
  }, [devices, roomId]);

  const matchesSearch = (text) => {
    if (!catalogSearch.trim()) return true;
    return String(text).toLowerCase().includes(catalogSearch.trim().toLowerCase());
  };

  const lightingIntensityScale = lightingMode === 'bright' ? 1.35 : lightingMode === 'warm' ? 0.85 : 1.0;

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-[#f3f4f6] text-slate-800 w-full select-none ${
        hideHeader
          ? (isFullscreen ? 'p-0 w-screen h-[100dvh]' : 'p-0 h-full')
          : 'p-0 h-[calc(100dvh-6.5rem)] rounded-2xl border border-slate-200/90 overflow-hidden shadow-xl'
      }`}
    >
      {/* Hidden JSON file input */}
      <input type="file" accept=".json" id="import-json" className="hidden" onChange={handleImportJSON} />

      {/* ── MAIN FULL-BLEED 3D ARCHITECTURAL VIEWPORT (HomeByMe Floating Island UI) ── */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <div className="flex-1 min-w-0 bg-[#f3f4f6] overflow-hidden relative">
          {/* Widget Mode Floating Fullscreen Button */}
          {isWidget && !isFullscreen && !isSidebarPreview && (
            <div className="absolute top-3 right-3 z-20 flex gap-1.5">
              <button
                onClick={toggleFullscreen}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/95 text-slate-700 hover:bg-white border border-slate-200/90 shadow-md transition-colors cursor-pointer"
                title="Layar Penuh 3D"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          )}

          {/* ── 1. TOP-LEFT FLOATING WHITE ISLANDS (HomeByMe Signature Top Bar) ── */}
          {(isStudioEditor || isFullscreen) && !isSidebarPreview && (
            <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between gap-2 pointer-events-none">
              {/* Left Cluster: Amber Home + Project Pill + First Floor Pill + Save + Undo/Redo + Help */}
              <div className="flex items-center gap-2 flex-wrap pointer-events-auto">
                {/* Island 1: Warm Amber Home Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onBackToList) onBackToList();
                    else handleSwitchCameraView('orbit');
                  }}
                  className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center transition-colors cursor-pointer"
                  title={onBackToList ? 'Kembali ke Daftar Ruangan' : 'Reset Kamera Ruangan'}
                >
                  <Home size={18} strokeWidth={2.2} />
                </button>

                {/* Island 2: Project / Room Selector Pill (☰ Bedroom bis) */}
                <div className="h-10 px-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center gap-2.5 text-slate-800">
                  <Menu size={16} className="text-slate-600 shrink-0" />
                  {Array.isArray(roomsList) && roomsList.length > 1 && onSelectRoom ? (
                    <select
                      value={roomId}
                      onChange={(e) => onSelectRoom(e.target.value)}
                      className="bg-transparent text-slate-800 font-semibold text-[13px] focus:outline-none cursor-pointer pr-1"
                    >
                      {roomsList.map((r) => (
                        <option key={r.id} value={r.id} className="bg-white text-slate-800">
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-[13px] text-slate-800 truncate max-w-[160px]">
                      {cleanRoomTitle}
                    </span>
                  )}
                </div>

                {/* Island 3: Floor / Layers Pill (First floor) */}
                <button
                  type="button"
                  onClick={() => setLayersPanelOpen(!layersPanelOpen)}
                  className={`h-10 px-3.5 rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center gap-2 text-[13px] font-semibold transition-colors cursor-pointer ${
                    layersPanelOpen
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200/90'
                  }`}
                  title="Buka Daftar Layer & Inspektor Objek"
                >
                  <Layers size={16} className={layersPanelOpen ? 'text-blue-600' : 'text-slate-600'} />
                  <span>First floor</span>
                </button>

                {/* Island 4: Save Square Button */}
                <button
                  type="button"
                  onClick={saveLayout}
                  className="w-10 h-10 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-center transition-colors cursor-pointer"
                  title="Simpan Layout 3D (Ctrl+S)"
                >
                  <Save size={17} />
                </button>

                {/* Island 5: Undo / Redo Combined Pill */}
                <div className="h-10 px-1 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      canUndo ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-200" />
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      canRedo ? 'text-slate-700 hover:bg-slate-100 cursor-pointer' : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>

                {/* Island 6: Help & File Actions Square Button (?) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHelpPopover(!showHelpPopover)}
                    className={`w-10 h-10 rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-center transition-colors cursor-pointer ${
                      showHelpPopover
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
                    }`}
                    title="Bantuan, Import/Export & Reset Template"
                  >
                    <HelpCircle size={17} />
                  </button>

                  {showHelpPopover && (
                    <div className="absolute top-12 left-0 w-64 p-3 rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-2xl text-slate-800 space-y-2 z-40">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">Proyek & Bantuan</span>
                        <button
                          type="button"
                          onClick={() => setShowHelpPopover(false)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setWallsWithHistory(createHomeByMeDefaultSuite(cleanRoomTitle));
                          setSelectedObj(null);
                          setShowHelpPopover(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Sparkles size={14} className="text-amber-600 shrink-0" />
                        <span>Muat Template Suite HomeByMe</span>
                      </button>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            document.getElementById('import-json')?.click();
                            setShowHelpPopover(false);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Download size={13} /> Import JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleExportJSON();
                            setShowHelpPopover(false);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Upload size={13} /> Export JSON
                        </button>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <div>• Klik panah biru di sekitar avatar untuk jalan</div>
                        <div>• Drag kanan / kiri mouse untuk putar 3D</div>
                        <div>• Tekan <strong className="text-slate-700">Delete</strong> untuk hapus objek terpilih</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top-Right Compact Actions: Pin to Dashboard + Fullscreen */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {onTogglePin && (
                  <button
                    type="button"
                    onClick={onTogglePin}
                    className={`h-10 px-3.5 rounded-xl text-xs font-semibold border shadow-[0_2px_10px_rgba(0,0,0,0.06)] inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isPinned
                        ? 'bg-amber-400 text-slate-900 border-amber-400'
                        : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
                    }`}
                  >
                    <Pin size={14} className={isPinned ? 'fill-slate-900' : ''} />
                    <span className="hidden sm:inline">{isPinned ? 'Pinned' : 'Pin Dashboard'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-10 h-10 rounded-xl bg-white/95 hover:bg-white text-slate-700 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.06)] flex items-center justify-center transition-colors cursor-pointer"
                  title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* ── 2. LEFT FLOATING 4-ISLAND COMPACT DOCK (Matches HomeByMe Left Toolbar) ── */}
          {editMode && !isSidebarPreview && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5">
              {/* Island 1: Build / Room Structure [⊞] */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('walls');
                  setActiveDrawer(activeDrawer === 'build' ? null : 'build');
                }}
                className={`w-11 h-11 rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.07)] flex items-center justify-center transition-colors cursor-pointer ${
                  activeDrawer === 'build'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
                }`}
                title="Bangunan, Dinding & Sekat Ruangan"
              >
                <LayoutGrid size={18} />
              </button>

              {/* Island 2: 3-Button Vertical Pill [🔍 / 🛋️ / ♡] */}
              <div className="w-11 py-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.07)] flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('furniture');
                    setActiveDrawer(activeDrawer === 'search' ? null : 'search');
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    activeDrawer === 'search'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Cari Furnitur, Struktur & Perangkat IoT"
                >
                  <Search size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('furniture');
                    setActiveDrawer(activeDrawer === 'furniture' ? null : 'furniture');
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    activeDrawer === 'furniture'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Katalog Furnitur 3D & Perangkat IoT"
                >
                  <Armchair size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('material');
                    setActiveDrawer(activeDrawer === 'material' ? null : 'material');
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    activeDrawer === 'material'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Material Dinding & Warna Lantai Kayu"
                >
                  <Heart size={17} />
                </button>
              </div>

              {/* Island 3: Edit / Transform Object [✎] */}
              <button
                type="button"
                onClick={() => setActiveDrawer(activeDrawer === 'edit' ? null : 'edit')}
                className={`w-11 h-11 rounded-xl border shadow-[0_2px_10px_rgba(0,0,0,0.07)] flex items-center justify-center transition-colors cursor-pointer ${
                  activeDrawer === 'edit' || transformMode !== 'select'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
                }`}
                title="Alat Transformasi Objek (Geser, Putar, Skala, Hapus)"
              >
                <Edit3 size={17} />
              </button>

              {/* Island 4: Camera Snapshot [📷] */}
              <button
                type="button"
                onClick={handleDownloadImage}
                className="w-11 h-11 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.07)] flex items-center justify-center transition-colors cursor-pointer"
                title="Simpan Tangkapan Layar 3D (PNG)"
              >
                <Camera size={17} />
              </button>
            </div>
          )}

          {/* ── ACTIVE WALL DRAWING MODE BANNER ── */}
          {drawWallMode && !isSidebarPreview && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-blue-600 text-white shadow-xl flex items-center gap-3 text-xs font-semibold">
              <span>✏️ Mode Gambar Dinding: Klik titik awal lalu titik akhir di lantai (klik kanan untuk putus garis)</span>
              <button
                type="button"
                onClick={() => setDrawWallMode(false)}
                className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          )}

          {/* ── COMPACT FLOATING TRANSFORM & PROPERTY POPOVER (When Island 3 [✎] is active or an object is selected) ── */}
          {editMode && !isSidebarPreview && (activeDrawer === 'edit' || selectedObj) && (
            <div className="absolute right-4 top-18 z-30 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5 w-60 text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {inspectedTarget?.obj?.name || 'Edit Objek 3D'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawer(null);
                    setSelectedObj(null);
                    setTransformMode('select');
                  }}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 1. Mode Transformasi (Pilih / Geser / Putar / Ukuran) */}
              <div className="grid grid-cols-2 gap-1">
                {[
                  { mode: 'select', label: 'Pilih', icon: MousePointer2 },
                  { mode: 'translate', label: 'Geser', icon: Move },
                  { mode: 'rotate', label: 'Putar', icon: RotateCcw },
                  { mode: 'scale', label: 'Ukuran', icon: Maximize },
                ].map((tool) => {
                  const IconComp = tool.icon;
                  const isAct = transformMode === tool.mode;
                  return (
                    <button
                      key={tool.mode}
                      type="button"
                      onClick={() => setTransformMode(tool.mode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        isAct
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp size={13} />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2. Putar Cepat 1-Klik (-90° / +45° / +90°) */}
              {inspectedTarget && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Putar Cepat</span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: '-90°', deg: -90 },
                      { label: '+45°', deg: 45 },
                      { label: '+90°', deg: 90 },
                    ].map((rot) => (
                      <button
                        key={rot.label}
                        type="button"
                        onClick={() => rotateInspectedByDeg(rot.deg)}
                        className="py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-[11px] font-bold font-mono tabular-nums transition-colors cursor-pointer"
                      >
                        {rot.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Ubah Tipe Dinding 1-Klik (Polos / Pintu / Jendela / Kaca) */}
              {inspectedTarget?.obj && !['furniture', 'text_label', 'custom_group', 'room'].includes(inspectedTarget.obj.type) && inspectedTarget.kind !== 'device' && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Dinding</span>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { id: 'wall', label: 'Dinding Polos' },
                      { id: 'door_wall', label: '+ Pintu' },
                      { id: 'window_wall', label: '+ Jendela' },
                      { id: 'glass_wall', label: 'Partisi Kaca' },
                    ].map((wt) => {
                      const isCur = (inspectedTarget.obj.type || 'wall') === wt.id;
                      return (
                        <button
                          key={wt.id}
                          type="button"
                          onClick={() => updateInspectedWallType(wt.id)}
                          className={`py-1 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            isCur
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                          }`}
                        >
                          {wt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Ukuran / Dimensi (Panjang X, Tinggi Y, Lebar Z) */}
              {inspectedTarget?.obj && inspectedTarget.kind !== 'device' && inspectedTarget.obj.type !== 'custom_group' && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {inspectedTarget.obj.type === 'furniture' ? 'Skala Ukuran (X / Y / Z)' : 'Dimensi Meter (P / T / L)'}
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: 'P', val: inspectedScale.x, idx: 0 },
                      { label: 'T', val: inspectedScale.y, idx: 1 },
                      { label: 'L', val: inspectedScale.z, idx: 2 },
                    ].map((dim) => (
                      <div
                        key={dim.label}
                        className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px]"
                      >
                        <span className="text-slate-400 font-bold">{dim.label}</span>
                        <input
                          type="number"
                          step="0.25"
                          min="0.1"
                          value={Number(dim.val).toFixed(2)}
                          onChange={(e) => updateInspectedScale(dim.idx, e.target.value)}
                          className="w-full bg-transparent text-slate-800 font-mono tabular-nums text-[11px] outline-none text-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Warna & Material Cepat untuk Dinding / Furnitur yang Dipilih */}
              {inspectedTarget?.obj && inspectedTarget.kind !== 'device' && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Warna / Material
                    </span>
                    <input
                      type="color"
                      value={inspectedTarget.obj.customColor || WALL_MATERIALS[inspectedTarget.obj.materialPreset]?.swatch || '#e6e4e0'}
                      onChange={(e) => updateInspectedCustomColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                      title="Pilih Warna Bebas"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {Object.values(WALL_MATERIALS).map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => {
                          if (inspectedTarget.obj.type === 'furniture') {
                            updateInspectedCustomColor(mat.swatch);
                          } else {
                            applyMaterialToSelectionOrAll(mat.id);
                          }
                        }}
                        className="w-6 h-6 rounded-lg border border-black/15 shadow-2xs transition-transform hover:scale-110 cursor-pointer"
                        style={{ backgroundColor: mat.swatch }}
                        title={mat.label}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedObj?.type === 'wall' && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  {inspectedTarget?.obj?.type === 'custom_group' && (
                    <button
                      type="button"
                      onClick={handleUngroup}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Pisahkan Grup agar Tiap Dinding Bisa Diedit"
                    >
                      <FolderOpen size={12} /> Pisah Grup
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDuplicateWall}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Copy size={12} /> Duplikat
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWall}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── FLOATING LAYERS & INSPEKTOR CARD (Opens from Top-Left "First floor" Pill) ── */}
          {editMode && !isSidebarPreview && layersPanelOpen && (
            <div className="absolute top-16 left-4 z-30 w-72 max-h-[calc(100vh-160px)] bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
              <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-100">
                <span className="font-bold text-xs text-slate-800">First floor • Layers</span>
                <button
                  type="button"
                  onClick={() => setLayersPanelOpen(false)}
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="px-3 pt-2.5 pb-1.5">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80">
                  <Search size={12} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={layerFilter}
                    onChange={(e) => setLayerFilter(e.target.value)}
                    placeholder="Cari elemen ruangan..."
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="px-3 py-1.5 flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {walls
                  .filter((w) => {
                    if (!layerFilter.trim()) return true;
                    const q = layerFilter.toLowerCase();
                    const matchSelf = (w.name || w.text || '').toLowerCase().includes(q);
                    const matchChild = w.children?.some((c) => (c.name || '').toLowerCase().includes(q));
                    return matchSelf || matchChild;
                  })
                  .map((w, index) => {
                    const isGroup = w.type === 'custom_group';
                    const isExpanded = expandedGroups[w.id] !== false;
                    const isSelected = selectedObj?.id === w.id || selectedForGroup.includes(w.id);

                    return (
                      <React.Fragment key={w.id}>
                        <div
                          onClick={() => setSelectedObj({ type: 'wall', id: w.id })}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200 text-blue-700'
                              : 'hover:bg-slate-100/80 border border-transparent text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isGroup ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedGroups((p) => ({ ...p, [w.id]: !isExpanded }));
                                }}
                                className="text-slate-400 hover:text-slate-700"
                              >
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              </button>
                            ) : (
                              <ChevronRight size={12} className="text-slate-300" />
                            )}
                            <span className="text-xs font-medium truncate">
                              {w.name || (isGroup ? `Grup ${index + 1}` : `Elemen ${index + 1}`)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setWalls((prev) =>
                                  prev.map((wall) => (wall.id === w.id ? { ...wall, hidden: !wall.hidden } : wall))
                                );
                              }}
                              className={w.hidden ? 'text-slate-300' : 'text-slate-500 hover:text-slate-800'}
                            >
                              {w.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setWalls((prev) =>
                                  prev.map((wall) => (wall.id === w.id ? { ...wall, locked: !wall.locked } : wall))
                                );
                              }}
                              className={w.locked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700'}
                            >
                              {w.locked ? <Lock size={11} /> : <Unlock size={11} />}
                            </button>
                          </div>
                        </div>

                        {isGroup && isExpanded && w.children && (
                          <div className="pl-4 ml-2.5 border-l border-slate-200 space-y-0.5 my-0.5">
                            {w.children.map((c, cIdx) => {
                              const isChildSel = selectedObj?.id === c.id || selectedForGroup.includes(c.id);
                              return (
                                <div
                                  key={c.id}
                                  onClick={() => setSelectedObj({ type: 'wall', id: c.id })}
                                  className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                                    isChildSel
                                      ? 'bg-blue-50 text-blue-700 font-semibold'
                                      : 'hover:bg-slate-100 text-slate-600'
                                  } ${c.hidden ? 'opacity-45' : ''}`}
                                >
                                  <span className="text-[11px] truncate">{c.name || `Elemen ${cIdx + 1}`}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWalls((prev) =>
                                        prev.map((wall) => {
                                          if (wall.id !== w.id) return wall;
                                          return {
                                            ...wall,
                                            children: wall.children.map((child) =>
                                              child.id === c.id ? { ...child, hidden: !child.hidden } : child
                                            ),
                                          };
                                        })
                                      );
                                    }}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    {c.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>

              {/* Inspector Coordinates Footer */}
              {inspectedTarget && (
                <div className="p-3 bg-slate-50 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                      {inspectedTarget.obj?.name || 'Objek Terpilih'}
                    </span>
                    {selectedObj?.type === 'wall' && (
                      <button
                        type="button"
                        onClick={handleDeleteWall}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} /> Hapus
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { label: 'X', val: inspectedCoords.x, idx: 0 },
                      { label: 'Y', val: inspectedCoords.y, idx: 1 },
                      { label: 'Z', val: inspectedCoords.z, idx: 2 },
                    ].map((coord) => (
                      <div
                        key={coord.label}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px]"
                      >
                        <span className="text-slate-400 font-bold">{coord.label}</span>
                        <input
                          type="number"
                          step="0.25"
                          value={Number(coord.val).toFixed(2)}
                          onChange={(e) => updateInspectedCoord(coord.idx, e.target.value)}
                          className="w-full bg-transparent text-slate-800 font-mono tabular-nums text-[11px] outline-none text-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. BOTTOM-CENTER FLOATING WHITE ISLANDS (HomeByMe [Sliders] [2D | 3D | 🚶] [🔍- | 🔍+]) ── */}
          {!isSidebarPreview && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
              {/* Island 1: Display Settings Button [SlidersHorizontal] */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className={`w-11 h-11 rounded-xl border shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center transition-colors cursor-pointer ${
                    showSettingsPopover
                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                      : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
                  }`}
                  title="Pengaturan Tampilan 3D"
                >
                  <SlidersHorizontal size={17} />
                </button>

                {showSettingsPopover && (
                  <div className="absolute bottom-14 left-0 w-60 p-3 rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-2xl text-slate-800 space-y-2 z-40">
                    <div className="text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                      Pengaturan Tampilan
                    </div>
                    <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                      <span>Tampilkan Avatar 3D</span>
                      <input
                        type="checkbox"
                        checked={showAvatar}
                        onChange={(e) => setShowAvatar(e.target.checked)}
                        className="accent-blue-600 rounded cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                      <span>Penggaris Dimensi (m)</span>
                      <input
                        type="checkbox"
                        checked={showRuler}
                        onChange={(e) => setShowRuler(e.target.checked)}
                        className="accent-blue-600 rounded cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1">
                      <span>Snap Grid 0.25m</span>
                      <input
                        type="checkbox"
                        checked={snapEnabled}
                        onChange={(e) => setSnapEnabled(e.target.checked)}
                        className="accent-blue-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Island 2: 2D | 3D | 🚶 Segmented View Switcher Pill */}
              <div className="h-11 px-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsExploreMode(false);
                    handleSwitchCameraView('top2d');
                  }}
                  className={`h-8 px-3 rounded-lg text-[13px] font-bold transition-colors cursor-pointer ${
                    cameraViewMode === 'top2d' && !isExploreMode
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Tampilan Denah Atas 2D"
                >
                  2D
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsExploreMode(false);
                    handleSwitchCameraView('orbit');
                  }}
                  className={`h-8 px-3 rounded-lg text-[13px] font-extrabold transition-colors cursor-pointer ${
                    cameraViewMode === 'orbit' && !isExploreMode
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Tampilan Dollhouse 3D"
                >
                  3D
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextWalk = !isExploreMode;
                    setIsExploreMode(nextWalk);
                    if (nextWalk) setCameraViewMode('orbit');
                  }}
                  className={`w-9 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isExploreMode
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Mode Jalan Avatar (WASD / Klik Panah Lantai)"
                >
                  <User size={16} strokeWidth={2.2} />
                </button>
              </div>

              {/* Island 3: Zoom Out | Zoom In Pill [🔍- | 🔍+] */}
              <div className="h-11 px-1.5 rounded-xl bg-white/95 border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('zoom-out'))}
                  className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('zoom-in'))}
                  className="w-8 h-8 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── THREE.JS 3D DOLLHOUSE STUDIO CANVAS ── */}
          <Canvas 
            shadows={!isSidebarPreview}
            frameloop={isSidebarPreview ? "demand" : "always"}
            gl={{ 
              preserveDrawingBuffer: isCapturing, 
              antialias: !isSidebarPreview,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08 * lightingIntensityScale,
            }} 
            camera={{ 
              position: isSidebarPreview ? [13, 18, 15] : [8.5, 13.5, 11.5], 
              fov: isSidebarPreview ? 38 : 40 
            }}
          >
            <color attach="background" args={[isCapturing ? '#ffffff' : '#f3f4f6']} />
            
            {/* Bright HomeByMe Architectural Daylight Studio Lighting */}
            <ambientLight 
              intensity={(isCapturing ? 1.8 : 1.55) * lightingIntensityScale} 
              color={lightingMode === 'warm' ? '#fef3c7' : '#ffffff'} 
            />

            {/* Key Sun Directional Light with Soft Architectural Shadows */}
            <directionalLight 
              castShadow={!isCapturing && !isSidebarPreview} 
              position={[12, 24, 14]} 
              intensity={(isCapturing ? 0.8 : 1.45) * lightingIntensityScale} 
              shadow-mapSize={isWidget ? [512, 512] : [2048, 2048]} 
              shadow-camera-left={-22}
              shadow-camera-right={22}
              shadow-camera-top={22}
              shadow-camera-bottom={-22}
              shadow-bias={-0.00015}
              color={lightingMode === 'warm' ? '#fde68a' : '#fffdf9'}
            />

            {/* Soft Fill Lights */}
            <directionalLight 
              position={[-14, 18, -10]} 
              intensity={0.75 * lightingIntensityScale} 
              color="#f1f5f9" 
            />
            <directionalLight 
              position={[-8, 12, 16]} 
              intensity={0.55 * lightingIntensityScale} 
              color="#ffffff" 
            />
            <hemisphereLight 
              skyColor="#ffffff" 
              groundColor="#e2e8f0" 
              intensity={0.85} 
            />
            
            <Suspense fallback={null}>
              <RoomLayout 
                devices={currentRoomDevices} 
                editMode={editMode} 
                activeTab={activeTab === 'devices' ? 'devices' : 'walls'}
                walls={walls} setWalls={setWallsWithHistory}
                selectedObj={selectedObj} setSelectedObj={setSelectedObj}
                selectedForGroup={selectedForGroup}
                transformMode={transformMode}
                onPlaceDevice={handlePlaceDevice}
                orbitRef={orbitRef}
                hiddenDevices={hiddenDevices}
                roomName={roomName}
                isExploreMode={isExploreMode}
                showAvatar={showAvatar}
                floorPreset={floorPreset}
                drawWallMode={drawWallMode}
                onDrawWallSegment={handleDrawWallSegment}
                isCapturing={isCapturing}
                isSidebarPreview={isSidebarPreview}
                showRuler={showRuler}
                snapEnabled={snapEnabled}
                cameraViewMode={cameraViewMode}
              />
              {!isCapturing && !isSidebarPreview && (
                <ContactShadows position={[0, -0.98, 0]} opacity={0.35} scale={30} blur={2.2} far={4.5} color="#334155" />
              )}
            </Suspense>
          </Canvas>
        </div>

        {/* ── 4. FLOATING WHITE CATALOG DRAWER (Opens from Left 4-Island Dock: Build / Search / Furniture & IoT / Material) ── */}
        {editMode && !isSidebarPreview && activeDrawer && activeDrawer !== 'edit' && (
          <div className="absolute left-18 top-18 bottom-18 z-30 w-80 max-w-[calc(100vw-5.5rem)] bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800">
            {/* Drawer Header + Close Button */}
            <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100">
              <span className="font-bold text-xs text-slate-800">
                {activeTab === 'walls'
                  ? 'Bangunan & Struktur'
                  : activeTab === 'furniture'
                    ? 'Furnitur 3D & Perangkat IoT'
                    : 'Material Dinding & Lantai'}
              </span>
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-6 h-6 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Katalog"
              >
                <X size={14} />
              </button>
            </div>

            {/* Pill Tabs: Struktur | Furnitur & IoT | Material */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-slate-50/80 border-b border-slate-100">
              {[
                { id: 'walls', label: 'Struktur' },
                { id: 'furniture', label: 'Furnitur & IoT' },
                { id: 'material', label: 'Material' },
              ].map((tab) => {
                const isAct = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      isAct
                        ? 'bg-blue-50 text-blue-600 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 focus-within:border-blue-400 focus-within:bg-white">
                <Search size={13} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Cari furnitur, dinding, sensor..."
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* TAB 1: BANGUNAN & STRUKTUR */}
            {activeTab === 'walls' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
                {/* 1. Mulai dari Polosan & Gambar Dinding Manual */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Buat Ruangan dari Polosan</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 text-[10px] font-bold">
                      Custom Builder
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawWallMode(!drawWallMode)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      drawWallMode
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-300'
                    }`}
                  >
                    <Edit3 size={14} />
                    <span>{drawWallMode ? 'Sedang Menggambar Dinding (Aktif)' : '✏️ Gambar Dinding di Lantai (Titik A → B)'}</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDrawWallMode(false);
                        setWallsWithHistory(createBlankRoomDefault());
                        setSelectedObj(null);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Ruangan Polosan (4 Sisi)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawWallMode(false);
                        setWallsWithHistory([]);
                        setSelectedObj(null);
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200/90 font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      Kanvas Kosong (0 Sisi)
                    </button>
                  </div>
                </div>

                {/* 2. Elemen Dinding & Sekat Satuan */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Tambah Dinding & Sekat Satuan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { title: 'Dinding Putih', props: { scale: [4, 4, 0.35], materialPreset: 'matte_slate', name: 'Dinding Putih' } },
                      { title: 'Dinding Espresso', props: { scale: [4, 4, 0.35], materialPreset: 'accent_espresso', name: 'Dinding Aksen Espresso' } },
                      { title: 'Partisi Kaca', props: { type: 'glass_wall', materialPreset: 'glass_frosted', scale: [4.5, 4, 0.22], name: 'Partisi Kaca' } },
                      { title: 'Jendela Panorama', props: { type: 'window_wall', scale: [6, 4, 0.35], name: 'Jendela Panorama' } },
                    ]
                      .filter((item) => matchesSearch(item.title))
                      .map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => handleAddWall(item.props)}
                          className="flex flex-col items-start gap-1 p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors cursor-pointer text-left"
                        >
                          <span className="text-xs font-bold text-slate-800">{item.title}</span>
                          <span className="text-[10px] text-slate-500">+ Tambah ke kanvas</span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* 3. Pintu & Bukaan */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Pintu & Bukaan</h4>
                  <div className="space-y-1.5">
                    {[
                      { type: 'door_wall', title: 'Dinding + Pintu Tengah', scale: [8, 4, 0.35] },
                      { type: 'door_wall_left', title: 'Dinding + Pintu Kiri', scale: [8, 4, 0.35] },
                      { type: 'door_wall_right', title: 'Dinding + Pintu Kanan', scale: [8, 4, 0.35] },
                      { type: 'door_wall_double', title: 'Dinding + Pintu Ganda', scale: [10, 4, 0.35] },
                    ]
                      .filter((item) => matchesSearch(item.title))
                      .map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddWall({ type: item.type, scale: item.scale, name: item.title })}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors cursor-pointer text-left"
                        >
                          <span className="text-xs font-semibold text-slate-700">{item.title}</span>
                          <PlusSquare size={14} className="text-slate-400" />
                        </button>
                      ))}
                  </div>
                </div>

                {/* 4. Contoh Template Suite HomeByMe (Opsional) */}
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">Contoh Suite Kamar HomeByMe</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-900 text-[10px] font-bold">
                      Template
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Ingin melihat contoh kamar yang sudah jadi? Klik di bawah untuk memuat suite lengkap (semua item tetap bisa diedit/dihapus).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawWallMode(false);
                      setWallsWithHistory(createHomeByMeDefaultSuite(cleanRoomTitle));
                      setSelectedObj(null);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Muat Contoh Suite HomeByMe
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: FURNITUR 3D & PERANGKAT IOT */}
            {activeTab === 'furniture' && (() => {
              const unassignedDevices = roomId !== 'default' ? devices.filter((d) => !d.room_id) : [];
              const singleFurnitureCatalog = [
                { furnitureType: 'queen_bed', title: 'Kasur Queen & Headboard', desc: 'Tempat tidur utama + bantal (satuan)', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'foot_bench', title: 'Bench Kaki Kasur', desc: 'Sofa bench panjang ujung tempat tidur', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'nightstand', title: 'Meja Nakas Samping', desc: 'Meja samping tempat tidur satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'pendant_lamp', title: 'Lampu Gantung Plafon', desc: 'Lampu gantung hangat satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'wall_art', title: 'Lukisan Dinding Frame', desc: 'Bingkai lukisan lanskap dinding', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'wardrobe', title: 'Lemari Pakaian Built-in', desc: 'Kabinet lemari tinggi kayu taupe', pos: [0, 0, 0], scale: [2.8, 3.6, 1.05] },
                { furnitureType: 'vanity_table', title: 'Meja Rias / Kerja Konsol', desc: 'Meja konsol kayu gantung satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'wall_mirror', title: 'Cermin Dinding Berlampu', desc: 'Cermin besar dengan lampu LED rias', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'accent_chair', title: 'Kursi Rias / Kursi Kerja', desc: 'Kursi kayu & bantalan satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'area_rug', title: 'Karpet Area Lantai', desc: 'Karpet lantai tekstil lembut', pos: [0, 0.02, 0], scale: [4.8, 1, 3.8] },
                { furnitureType: 'curtain_drape', title: 'Tirai Jendela Tinggi', desc: 'Tirai lipit lantai-ke-plafon', pos: [0, 2.0, 0], scale: [5.0, 3.8, 0.22] },
                { furnitureType: 'sofa_only', title: 'Sofa Lounge 3-Dudukan', desc: 'Sofa ruang tamu satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'coffee_table', title: 'Meja Kopi Kayu Oak', desc: 'Meja tamu kayu rendah satuan', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'tv_console', title: 'Meja Konsol & Smart TV', desc: 'Kabinet media kayu + layar TV', pos: [0, 0, 0], scale: [1, 1, 1] },
                { furnitureType: 'indoor_plant', title: 'Tanaman Hias Monstera', desc: 'Pot keramik putih + tanaman hijau', pos: [0, 0, 0], scale: [1, 1, 1] },
              ];

              const bundleFurnitureCatalog = [
                { furnitureType: 'bed_suite', title: 'Paket Tempat Tidur Lengkap', desc: 'Kasur + bench + 2 nakas + 2 lampu + lukisan', pos: [0, 0, -1.5], scale: [1, 1, 1] },
                { furnitureType: 'vanity_desk', title: 'Paket Meja Rias Lengkap', desc: 'Meja konsol + kursi + cermin lampu', pos: [3.5, 0, 1.0], scale: [2.2, 1, 0.85] },
                { furnitureType: 'sofa_suite', title: 'Paket Sofa & Meja Kopi', desc: 'Sofa 3-dudukan + coffee table kayu', pos: [0, 0, 0.5], scale: [1, 1, 1] },
              ];

              const spawnFurnitureItem = (item) => {
                const spawn = getSpawnPosition();
                const newFurn = {
                  id: 'furn_' + Date.now(),
                  type: 'furniture',
                  furnitureType: item.furnitureType,
                  name: item.title,
                  position: [spawn[0], item.pos[1], spawn[2]],
                  rotation: [0, 0, 0],
                  scale: item.scale,
                };
                setWallsWithHistory((prev) => [...prev, newFurn]);
                setSelectedObj({ type: 'wall', id: newFurn.id });
                if (transformMode === 'select') setTransformMode('translate');
              };

              return (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
                  {/* 1. Furnitur 3D Satuan (Rakit Sendiri dari Polosan) */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-1">Furnitur Satuan (Rakit Sendiri)</h4>
                    <p className="text-[10.5px] text-slate-500 mb-2">
                      Klik item untuk menaruh di ruangan, lalu geser, putar, atau ubah warnanya.
                    </p>
                    <div className="space-y-1.5">
                      {singleFurnitureCatalog
                        .filter((f) => matchesSearch(f.title) || matchesSearch(f.desc))
                        .map((item) => (
                          <button
                            key={item.furnitureType}
                            type="button"
                            onClick={() => spawnFurnitureItem(item)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors cursor-pointer text-left"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
                              <div className="text-[10.5px] text-slate-500 truncate">{item.desc}</div>
                            </div>
                            <PlusSquare size={15} className="text-blue-600 shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* 2. Paket Furnitur Cepat (Bundle) */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <h4 className="font-bold text-slate-800 text-xs mb-2">Paket Furnitur Cepat (Bundle)</h4>
                    <div className="space-y-1.5">
                      {bundleFurnitureCatalog
                        .filter((f) => matchesSearch(f.title) || matchesSearch(f.desc))
                        .map((item) => (
                          <button
                            key={item.furnitureType}
                            type="button"
                            onClick={() => spawnFurnitureItem(item)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 transition-colors cursor-pointer text-left"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold text-amber-950 truncate">{item.title}</div>
                              <div className="text-[10.5px] text-amber-800/80 truncate">{item.desc}</div>
                            </div>
                            <PlusSquare size={15} className="text-amber-700 shrink-0" />
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Perangkat Smart IoT di Ruangan Ini */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs">
                      Perangkat IoT ({currentRoomDevices.length})
                    </h4>
                    {currentRoomDevices.length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        Belum ada sensor/perangkat IoT yang ditautkan ke ruangan ini.
                      </p>
                    ) : (
                      currentRoomDevices
                        .filter((dev) => matchesSearch(dev.name))
                        .map((dev) => {
                          const isPlaced = !!dev.broker_config?.position;
                          const isSelected = selectedObj?.id === dev.id;
                          return (
                            <div
                              key={dev.id}
                              onClick={() => setSelectedObj({ type: isPlaced ? 'device' : 'device_spawn', id: dev.id })}
                              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                  isPlaced ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  <Cpu size={14} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-800 truncate">{dev.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {isPlaced ? 'Terpasang di 3D' : 'Klik untuk pasang di lantai'}
                                  </div>
                                </div>
                              </div>
                              {isPlaced && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDevicePosition(dev.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  title="Lepas dari posisi 3D"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          );
                        })
                    )}

                    {roomId !== 'default' && unassignedDevices.length > 0 && (
                      <div className="pt-2 space-y-1.5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tersedia untuk Ditambahkan ({unassignedDevices.length})
                        </div>
                        {unassignedDevices.map((dev) => (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => handlePlaceDevice(dev.id, getSpawnPosition())}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 text-left transition-colors cursor-pointer"
                          >
                            <span className="text-xs font-semibold text-slate-700 truncate">{dev.name}</span>
                            <PlusSquare size={14} className="text-blue-600 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB 3: MATERIAL DINDING & LANTAI KAYU */}
            {activeTab === 'material' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
                {/* Pilihan Lantai Interior (Parket Kayu / Keramik) */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2">Material Lantai Ruangan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(FLOOR_MATERIALS).map((fl) => {
                      const isSel = floorPreset === fl.id;
                      return (
                        <button
                          key={fl.id}
                          type="button"
                          onClick={() => setFloorPreset(fl.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer text-left ${
                            isSel
                              ? 'bg-blue-50 border-blue-300 text-blue-900'
                              : 'bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                            style={{ backgroundColor: fl.color }}
                          />
                          <span className="text-[11px] font-bold leading-tight">{fl.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pilihan Cat & Material Dinding */}
                <div className="pt-2 border-t border-slate-200/80">
                  <h4 className="font-bold text-slate-800 text-xs mb-1">Cat & Material Dinding</h4>
                  <p className="text-[11px] text-slate-500 mb-2.5">
                    Pilih dinding terlebih dahulu untuk mengecat 1 sisi, atau klik langsung untuk menerapkan.
                  </p>
                  <div className="space-y-1.5">
                    {Object.values(WALL_MATERIALS).map((mat) => {
                      const currentPreset = inspectedTarget?.obj?.materialPreset || activeMaterialPreset;
                      const isSelectedMat = currentPreset === mat.id;
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => applyMaterialToSelectionOrAll(mat.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            isSelectedMat
                              ? 'bg-blue-50 border-blue-300 text-blue-900'
                              : 'bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-6 h-6 rounded-lg border border-black/15 shadow-2xs"
                              style={{ backgroundColor: mat.swatch, opacity: mat.opacity }}
                            />
                            <span className="text-xs font-bold">{mat.label}</span>
                          </div>
                          {isSelectedMat && <Check size={14} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
