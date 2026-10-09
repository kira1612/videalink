import React, { useState, useEffect, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useCursor, RoundedBox, Environment, ContactShadows, TransformControls, Text } from '@react-three/drei';
import { Box as BoxIcon, Info, Edit3, Check, X, MousePointerClick, Cpu, Activity, Power, Move, Maximize, RotateCcw, PlusSquare, Trash2, Save, MousePointer2, Eraser, Copy, Camera, Trash, Maximize2, Minimize2, Layers, Eye, EyeOff, Square, CheckSquare, FolderPlus, FolderOpen, ChevronLeft, ChevronRight, Hand, ZoomIn, ZoomOut, Undo2, Redo2, User, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { devicesApi, mqttApi } from '../services/api';
import Swal from 'sweetalert2';

/* ─────────────────────────────────────────────────────────────────────────
   Third Person Avatar (Jelajah Mode)
───────────────────────────────────────────────────────────────────────── */
function ThirdPersonAvatar({ orbitRef, walls }) {
  const avatarRef = useRef();
  const pos = useRef([0, 0, 0]);
  const rot = useRef(0);
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
    
    if (orbitRef.current) {
      orbitRef.current.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
      orbitRef.current.minDistance = 2; 
      orbitRef.current.maxDistance = 6;
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
  }, [orbitRef]);

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
    
    if (orbitRef.current) {
      const target = orbitRef.current.target;
      target.x += (pos.current[0] - target.x) * 0.2;
      target.z += (pos.current[2] - target.z) * 0.2;
      target.y = 1.0;
      orbitRef.current.update();
    }
  });

  return (
    <group ref={avatarRef} position={[0, 0, 0]}>
      {/* Pivot Kaki Kiri */}
      <group ref={legL} position={[-0.15, 0.7, 0]}>
        <RoundedBox args={[0.2, 0.7, 0.2]} position={[0, -0.35, 0]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </RoundedBox>
      </group>
      {/* Pivot Kaki Kanan */}
      <group ref={legR} position={[0.15, 0.7, 0]}>
        <RoundedBox args={[0.2, 0.7, 0.2]} position={[0, -0.35, 0]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </RoundedBox>
      </group>
      
      {/* Badan */}
      <RoundedBox args={[0.5, 0.7, 0.25]} position={[0, 1.05, 0]} radius={0.1} smoothness={4} castShadow>
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </RoundedBox>

      {/* Pivot Tangan Kiri */}
      <group ref={armL} position={[-0.38, 1.35, 0]} rotation={[0, 0, 0]}>
        <RoundedBox args={[0.2, 0.65, 0.2]} position={[0, -0.25, 0]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </RoundedBox>
      </group>
      {/* Pivot Tangan Kanan */}
      <group ref={armR} position={[0.38, 1.35, 0]} rotation={[0, 0, 0]}>
        <RoundedBox args={[0.2, 0.65, 0.2]} position={[0, -0.25, 0]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </RoundedBox>
      </group>

      {/* Kepala */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
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

  return (
    <group position={position}>
      {/* 3D Radio Wave Ripples Effect */}
      {status && (
        <group position={[0, 0, 0]}>
          <mesh ref={ripple1}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
          <mesh ref={ripple2}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
          <mesh ref={ripple3}>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0} depthWrite={false} side={2} />
          </mesh>
        </group>
      )}
      
      <mesh 
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow={!isCapturing}
        scale={isCapturing ? [2.5, 0.1, 2.5] : [1, 1, 1]}
      >
        {isCapturing ? <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} /> : <sphereGeometry args={[0.2, 32, 32]} />}
        {isCapturing ? (
          <meshBasicMaterial color={status ? '#10b981' : '#475569'} />
        ) : (
          <meshStandardMaterial 
            color={isSelected ? '#f59e0b' : (status ? '#10b981' : '#475569')} 
            emissive={isSelected ? '#f59e0b' : (status ? '#10b981' : '#000000')}
            emissiveIntensity={status || isSelected ? 2 : 0}
            roughness={0.2}
            metalness={0.8}
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

      {status && !isCapturing && <pointLight position={[0, 2, 0]} intensity={1.5} color="#10b981" distance={6} castShadow />}

      {isSelected && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#f59e0b" side={2} />
        </mesh>
      )}

      {!showPopup && (
        <Html position={[0, 0.25, 0]} zIndexRange={[20, 0]} pointerEvents="none" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center pointer-events-none select-none" style={{ transform: 'translate(-50%, -100%)', width: 'max-content' }}>
            <div className={`px-2.5 py-1 rounded-md backdrop-blur-md border font-bold text-[11px] whitespace-nowrap shadow-lg transition-colors ${hovered ? 'bg-slate-900/90 border-emerald-400 text-white' : 'bg-slate-900/75 border-emerald-500/50 text-slate-200'}`}>
              {device.name}
            </div>
            <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(52,211,153,0.9), rgba(52,211,153,0.15))' }} />
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
   Wall Block Component
───────────────────────────────────────────────────────────────────────── */
const WallBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

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
      <RoundedBox 
        ref={meshRef}
        args={[1, 1, 1]} 
        radius={0.05} 
        receiveShadow 
        castShadow
      >
        <meshStandardMaterial 
          color={isSelected ? '#3b82f6' : (hovered ? '#475569' : '#1e293b')} 
          roughness={0.7} 
          metalness={0.1}
          transparent
          opacity={isSelected ? 0.8 : 1}
        />
      </RoundedBox>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Text Label Block Component
───────────────────────────────────────────────────────────────────────── */
const TextLabelBlock = React.forwardRef(({ wall, isSelected, onClick, isCapturing }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

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
        fontSize={wall.fontSize || 5}
        color={isCapturing ? '#000000' : (isSelected ? '#3b82f6' : (hovered ? '#cbd5e1' : (wall.color || '#94a3b8')))}
        anchorX="center"
        anchorY="middle"
        fontStyle={wall.italic ? 'italic' : 'normal'}
        fontWeight={wall.bold || isCapturing ? 'bold' : 'normal'}
        fillOpacity={isSelected || hovered ? 0.8 : (wall.opacity !== undefined ? wall.opacity : 0.15)}
      >
        {(wall.text || 'NAMA RUANGAN').toUpperCase()}
      </Text>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Room Group Block (4 Walls as 1 Object)
───────────────────────────────────────────────────────────────────────── */
const RoomGroupBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const matProps = {
    color: isSelected ? '#3b82f6' : (hovered ? '#475569' : '#1e293b'),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: isSelected ? 0.8 : 1
  };

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

        if (child.type?.startsWith('door_wall')) {
          return <DoorWallBlock key={child.id || idx} wall={child} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} isCapturing={isCapturing} />;
        }
        return <WallBlock key={child.id || idx} wall={child} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} />;
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
      {child.type?.startsWith('door_wall') ? (
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
   Door Wall Block (Wall with a door hole)
   - Door size is FIXED in world units (not proportional to wall scale)
   - door_wall        = 1 door in center
   - door_wall_left   = 1 door on the left side
   - door_wall_right  = 1 door on the right side
   - door_wall_double = 2 doors symmetrically placed
───────────────────────────────────────────────────────────────────────── */
const DoorWallBlock = React.forwardRef(({ wall, isSelected, onClick, isCapturing }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const matProps = {
    color: isSelected ? '#3b82f6' : (hovered ? '#475569' : '#1e293b'),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: isSelected ? 0.8 : 1
  };

  // --- Fixed door dimensions in world space ---
  const DOOR_WORLD_W = 2;   // fixed door width (world units)
  const DOOR_WORLD_H = 0.7; // lintel height ratio (0 = full height door, 1 = no door)
  // wall.scale[0] = wall width in world units
  const wallW = wall.scale?.[0] || 1;
  const wallH = wall.scale?.[1] || 1;

  // Convert fixed world-space door width to local 0-1 ratio
  const doorLocalW = Math.min(DOOR_WORLD_W / wallW, 0.6); // cap at 60% of wall
  const topLocalH = DOOR_WORLD_H / wallH;                  // lintel height in local ratio

  const segments = [];

  if (wall.type === 'door_wall_double') {
    // Double door = 1 wide opening in center (2x single door width)
    const doubleDoorLocalW = Math.min((DOOR_WORLD_W * 2) / wallW, 0.75); // 2x width, cap 75%
    const leftW  = (1 - doubleDoorLocalW) / 2;
    const rightW = (1 - doubleDoorLocalW) / 2;

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
      ref={ref}
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
      ) : wall.type?.startsWith('door_wall') ? (
        <DoorWallBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
          isCapturing={isCapturing}
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
      {showGizmo && transformMode === 'scale' && wallRef.current && !['room', 'custom_group', 'text_label'].includes(wall.type) && (
        <WallResizeHandles object={wallRef.current} orbitRef={orbitRef} onCommit={handleMouseUp} />
      )}
      {showGizmo && transformMode !== 'select' && transformMode !== 'camera' && wallRef.current && !(transformMode === 'scale' && !['room', 'custom_group', 'text_label'].includes(wall.type)) && (
        <DragTransformControls
          object={wallRef.current}
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
  isCapturing = false
}) {

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
        // Animasi manual atau snap langsung ke top-down
        cam.position.set(0, 30, 0.1); 
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
        // Move camera backwards from target
        const distance = cam.position.distanceTo(target);
        if(distance < orbitRef.current.maxDistance) {
          cam.position.lerp(target, -0.2);
          orbitRef.current.update();
        }
      }
    };

    window.addEventListener('reset-camera', handleReset);
    window.addEventListener('zoom-in', handleZoomIn);
    window.addEventListener('zoom-out', handleZoomOut);
    
    // Enable keyboard events for OrbitControls
    if (orbitRef.current) {
      orbitRef.current.listenToKeyEvents(window);
    }
    
    return () => {
      window.removeEventListener('reset-camera', handleReset);
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
        const step = e.shiftKey ? 1 : 0.2; // faster if shift is held

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
                const newPos = [w.position[0] + dx, w.position[1], w.position[2] + dz];
                updatedWorldPos = newPos;
                return { ...w, position: newPos };
              }
              if (w.type === 'custom_group' && w.children) {
                let changed = false;
                const newChildren = w.children.map(c => {
                  if (c.id === selectedObj.id) {
                    changed = true;
                    const newPos = [c.position[0] + dx, c.position[1], c.position[2] + dz];
                    // Calculate world position for camera
                    updatedWorldPos = [w.position[0] + newPos[0], w.position[1] + newPos[1], w.position[2] + newPos[2]];
                    return { ...c, position: newPos };
                  }
                  return c;
                });
                if (changed) return { ...w, children: newChildren };
              }
              return w;
            });

            // Make camera follow the object
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
  }, [editMode, selectedObj, transformMode]);

  const handleFloorClick = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    
    if (activeTab === 'devices' && selectedObj?.type === 'device_spawn') {
      onPlaceDevice(selectedObj.id, [e.point.x, 0.5, e.point.z]);
    } else if (activeTab === 'walls') {
      setSelectedObj(null); // Deselect if clicking floor
    }
  };

  return (
    <>
      <OrbitControls 
        ref={orbitRef} 
        makeDefault 
        minPolarAngle={Math.PI / 8} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={2} 
        maxDistance={200} 
        enablePan={!editMode || transformMode === 'camera'}
        enableZoom={!editMode || transformMode === 'camera'}
        keyPanSpeed={20}
        screenSpacePanning={false}
      />
      
      <group position={[0, -1, 0]}>
        {/* Avatar untuk Jelajah Mode */}
        {isExploreMode && <ThirdPersonAvatar orbitRef={orbitRef} walls={walls} />}
        
        {/* Lantai */}
        {!isCapturing && (
          <RoundedBox 
            args={[floorSize, 0.2, floorSize]} 
            radius={0.05} 
            smoothness={4} 
            position={[0, -0.1, 0]} 
            receiveShadow
            onClick={handleFloorClick}
            onPointerOver={() => {
              if (editMode && activeTab === 'devices' && selectedObj?.type === 'device_spawn') {
                document.body.style.cursor = 'crosshair';
              }
            }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
          </RoundedBox>
        )}

        {!isCapturing && <gridHelper args={[floorSize, floorSize, '#334155', '#1e293b']} position={[0, 0.01, 0]} />}

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
   Main Page
───────────────────────────────────────────────────────────────────────── */
export default function FloorPlan({ hideHeader = false, roomId = 'default', roomName = '' }) {
  const [devices, setDevices] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('walls'); // 'walls' | 'devices'
  
  // Builder State
  const [walls, setWalls] = useState(() => {
    const saved = localStorage.getItem(`iot_layout_walls_${roomId}`);
    let parsed = saved ? JSON.parse(saved) : [];
    // Otomatis inject teks label jika belum ada di layout ruangan ini
    if (!parsed.some(w => w.type === 'text_label')) {
      parsed.push({
        id: 'room-label',
        type: 'text_label',
        text: roomName || 'NAMA RUANGAN',
        position: [0, 0.02, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [1, 1, 1],
        name: 'Label Teks'
      });
    }
    return parsed;
  });
  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  const [isExploreMode, setIsExploreMode] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hiddenDevices, setHiddenDevices] = useState([]);
  const [transformMode, setTransformMode] = useState('translate');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const containerRef = useRef();
  const orbitRef = useRef();

  // Undo/Redo history stack
  const [wallsHistory, setWallsHistory] = useState(() => {
    const saved = localStorage.getItem(`iot_layout_walls_${roomId}`);
    return [saved ? JSON.parse(saved) : []];
  });
  const [historyIndex, setHistoryIndex] = useState(0);

  // Wrap setWalls to auto-push history
  const setWallsWithHistory = (updaterOrValue) => {
    setWalls(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      setWallsHistory(h => {
        const trimmed = h.slice(0, historyIndex + 1); // Remove future states if we undid previously
        const newH = [...trimmed, next].slice(-50); // Add new state, limit to 50
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
    const fetchDevices = () => {
      devicesApi.list().then(res => {
        setDevices(res.data);
      }).catch(console.error);
    };
    fetchDevices();
    const iv = setInterval(fetchDevices, 10000);
    return () => clearInterval(iv);
  }, []);

  const saveLayout = () => {
    localStorage.setItem(`iot_layout_walls_${roomId}`, JSON.stringify(walls));
    setEditMode(false);
    setSelectedObj(null);
    Swal.fire({
      target: containerRef.current || document.body,
      title: 'Tersimpan', 
      text: 'Layout ruangan berhasil disimpan!', 
      icon: 'success'
    });
  };

  // Helper untuk mendapatkan posisi di tengah layar (kamera) saat ini
  const getSpawnPosition = () => {
    if (orbitRef.current) {
      const t = orbitRef.current.target;
      return [t.x, 2, t.z];
    }
    return [0, 2, 0];
  };

  const handleAddWall = () => {
    const newWall = {
      id: 'wall_' + Date.now(),
      position: getSpawnPosition(),
      scale: [4, 4, 0.5],
      rotation: [0, 0, 0]
    };
    setWallsWithHistory(prev => [...prev, newWall]);
    setSelectedObj({ type: 'wall', id: newWall.id });
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
    
    // Find all selected items (top-level and children)
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
    
    // 1. Calculate center position of all selected items
    let cx = 0, cy = 0, cz = 0;
    itemsToGroup.forEach(item => {
      cx += item.worldPos[0];
      cy += item.worldPos[1];
      cz += item.worldPos[2];
    });
    cx /= itemsToGroup.length;
    cy /= itemsToGroup.length;
    cz /= itemsToGroup.length;

    // 2. Adjust children positions to be local to the new center
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
      children: groupChildren
    };

    // 3. Replace selected walls with the new group
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
        newWalls = newWalls.filter(w => !selectedForGroup.includes(w.id));
        newWalls = newWalls.map(w => {
          if (w.type === 'custom_group' && w.children) {
            return { ...w, children: w.children.filter(c => !selectedForGroup.includes(c.id)) };
          }
          return w;
        });
        setSelectedForGroup([]);
      } else if (selectedObj?.type === 'wall') {
        newWalls = newWalls.filter(w => w.id !== selectedObj.id);
        newWalls = newWalls.map(w => {
          if (w.type === 'custom_group' && w.children) {
            return { ...w, children: w.children.filter(c => c.id !== selectedObj.id) };
          }
          return w;
        });
        setSelectedObj(null);
      }
      return newWalls;
    });
  };

  // Keyboard shortcut (Delete / Backspace, Ctrl+Z Undo, Ctrl+S Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedObj?.type === 'wall' || selectedForGroup.length > 0)) {
        setWallsWithHistory(prev => {
          let newWalls = [...prev];
          if (selectedForGroup.length > 0) {
            newWalls = newWalls.filter(w => !selectedForGroup.includes(w.id));
            newWalls = newWalls.map(w => {
              if (w.type === 'custom_group' && w.children) {
                return { ...w, children: w.children.filter(c => !selectedForGroup.includes(c.id)) };
              }
              return w;
            });
            setSelectedForGroup([]);
          } else if (selectedObj?.type === 'wall') {
            newWalls = newWalls.filter(w => w.id !== selectedObj.id);
            newWalls = newWalls.map(w => {
              if (w.type === 'custom_group' && w.children) {
                return { ...w, children: w.children.filter(c => c.id !== selectedObj.id) };
              }
              return w;
            });
            setSelectedObj(null);
          }
          return newWalls;
        });
      }
      // Ctrl+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z or Ctrl+Y → Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+S → Save
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

  const handleResetCamera = () => {
    window.dispatchEvent(new Event('reset-camera'));
  };

  const handleDownloadImage = () => {
    if (!orbitRef.current) return;
    setIsCapturing(true);
    const cam = orbitRef.current.object;
    const oc = orbitRef.current;
    
    // Simpan state kamera
    const currentPos = cam.position.clone();
    const currentTarget = oc.target.clone();
    const currentFov = cam.fov;
    const oldMaxDist = oc.maxDistance;
    const oldMinPolar = oc.minPolarAngle;
    const oldMaxPolar = oc.maxPolarAngle;
    const oldFar = cam.far;

    // Hitung area terjauh (Bounding Box) untuk memastikan semua kena
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
    e.target.value = null; // Reset input
  };

  const handlePlaceDevice = async (id, position, rotation, scale) => {
    const updatedRoomId = roomId === 'default' ? null : Number(roomId);
    
    // Update local state instantly
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
    
    // Fire and forget API call
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
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleEnterEditMode = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().then(() => {
        setEditMode(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        Swal.fire({
          target: containerRef.current || document.body,
          title: 'Gagal Layar Penuh',
          text: 'Mode edit mewajibkan layar penuh, tapi browser menolak.',
          icon: 'error'
        });
      });
    } else {
      setEditMode(true);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setEditMode(false); // Keluar mode edit jika exit fullscreen
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col bg-slate-950 max-w-[1600px] mx-auto ${hideHeader ? (isFullscreen ? 'p-0 w-screen h-screen' : 'p-0 h-full') : 'p-6 h-[calc(100vh-2rem)]'}`}>
      
      {!hideHeader && !isFullscreen ? (
        <div className="mb-6 flex justify-between items-end flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <BoxIcon className="text-primary-400" /> Interactive 3D Floor Plan
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {editMode ? 'Mode Editor CAD: Rancang tembok & tata letak perangkat.' : 'Mode Visualisasi: Klik perangkat untuk mengontrol.'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={toggleFullscreen} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg bg-slate-800 text-slate-200 hover:bg-slate-700">
              <Maximize2 size={16} /> Fullscreen
            </button>
            {editMode ? (
              <button onClick={saveLayout} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-emerald-500/20">
                <Save size={16} /> Simpan Layout
              </button>
            ) : (
              <button onClick={handleEnterEditMode} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/20">
                <Edit3 size={16} /> 3D Editor Mode
              </button>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex-1 flex gap-4 h-full min-h-0 relative">
        <div className={`flex-1 bg-slate-950 border ${editMode ? 'border-amber-500/30' : 'border-slate-800 shadow-2xl'} rounded-3xl overflow-hidden relative`}>
          {!editMode && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-2 rounded-lg shadow-lg">
              <Info size={16} className="text-primary-400" />
              <span className="text-[11px] font-bold text-slate-300">Tarik: Putar kamera. Scroll: Zoom.</span>
            </div>
          )}

          {/* Floating Actions (Top Right) untuk Embedded Mode / Fullscreen */}
          {(hideHeader || isFullscreen) && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {editMode && (
                <>
                  <input type="file" accept=".json" id="import-json" className="hidden" onChange={handleImportJSON} />
                  <button 
                    onClick={() => document.getElementById('import-json').click()} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all shadow-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/50 backdrop-blur-md"
                    title="Import Layout JSON"
                  >
                    <Upload size={16} /> Import
                  </button>
                  <button 
                    onClick={handleExportJSON} 
                    className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all shadow-lg bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/50 backdrop-blur-md"
                    title="Export Layout JSON"
                  >
                    <Download size={16} /> Export
                  </button>
                </>
              )}
              <button 
                onClick={toggleFullscreen} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/50 shadow-lg backdrop-blur-md transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              
              {!editMode && (
                <>
                  <button 
                    onClick={handleDownloadImage} 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 shadow-lg bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-slate-100 border border-slate-700/50 backdrop-blur-xl group"
                    title="Download Gambar Denah (PNG)"
                  >
                    <ImageIcon size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Foto Denah
                  </button>
                  <button 
                    onClick={() => setIsExploreMode(!isExploreMode)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 shadow-lg backdrop-blur-xl border group ${isExploreMode ? 'bg-primary-500/20 text-primary-400 border-primary-500/50' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-slate-100 border-slate-700/50'}`}
                  >
                    <User size={16} className={`${isExploreMode ? '' : 'text-indigo-400 group-hover:scale-110 transition-transform'}`} /> {isExploreMode ? 'Keluar Jelajah' : 'Jelajah Ruangan'}
                  </button>
                  {!isExploreMode && (
                    <button 
                      onClick={handleEnterEditMode} 
                      className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all duration-300 shadow-lg bg-primary-600/90 text-white hover:bg-primary-500 border border-primary-500/50 backdrop-blur-xl group"
                    >
                      <Edit3 size={16} className="group-hover:scale-110 transition-transform" /> Desain Layout
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Photoshop-style Vertical Toolbar (Dibuat lebih compact agar tidak terpotong di layar kecil) */}
          {editMode && (
            <div className={`absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-300 ${leftPanelOpen ? 'left-4' : '-left-12'}`}>
              <button 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 border-y border-r border-slate-700 rounded-r-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer shadow-lg"
              >
                 {leftPanelOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
              </button>
              <div className={`flex flex-col items-center bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-1 rounded-xl shadow-2xl w-10 transition-opacity duration-300 ${leftPanelOpen ? 'opacity-100' : 'opacity-0'}`}>
              
              <div className="w-full flex flex-col gap-0.5">
                {/* Select Tool */}
                <button 
                  onClick={() => setTransformMode('select')} 
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${transformMode === 'select' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Select (V)"
                >
                  <MousePointer2 size={16} />
                </button>
                
                {/* Move Tool */}
                <button 
                  onClick={() => setTransformMode('translate')} 
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${transformMode === 'translate' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Move Tool"
                >
                  <Move size={16} />
                </button>
                
                {/* Scale Tool */}
                <button 
                  onClick={() => setTransformMode('scale')} 
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${transformMode === 'scale' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Scale Tool"
                >
                  <Maximize size={16} />
                </button>
                
                {/* Rotate Tool */}
                <button 
                  onClick={() => setTransformMode('rotate')} 
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${transformMode === 'rotate' ? 'bg-primary-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Rotate Tool"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              <div className="w-6 h-px bg-slate-700/80 my-1.5" />

              {/* Navigation / Zoom Group */}
              <div className="w-full flex flex-col gap-0.5">
                {/* Camera / Pan Tool */}
                <button 
                  onClick={() => setTransformMode('camera')} 
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${transformMode === 'camera' ? 'bg-emerald-500 text-slate-900 shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Camera Pan/Zoom Mode (Harus dipilih untuk geser/zoom)"
                >
                  <Hand size={16} />
                </button>
                
                {/* Zoom In Button */}
                <button 
                  onClick={() => window.dispatchEvent(new Event('zoom-in'))} 
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all" 
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>

                {/* Zoom Out Button */}
                <button 
                  onClick={() => window.dispatchEvent(new Event('zoom-out'))} 
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all" 
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
              </div>

              <div className="w-6 h-px bg-slate-700/80 my-1.5" />

              {/* History Controls */}
              <div className="w-full flex flex-col gap-0.5">
                <button 
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${canUndo ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 opacity-40 cursor-not-allowed'}`}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button 
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${canRedo ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 opacity-40 cursor-not-allowed'}`}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 size={16} />
                </button>
              </div>

              <div className="w-6 h-px bg-slate-700/80 my-1.5" />

              <div className="w-full flex flex-col gap-0.5">
                {/* Add Wall Tool */}
                <button 
                  onClick={handleAddWall} 
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all" 
                  title="Create New Wall"
                >
                  <PlusSquare size={16} />
                </button>
                
                {/* Duplicate Tool */}
                <button 
                  onClick={handleDuplicateWall} 
                  disabled={selectedObj?.type !== 'wall'}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${selectedObj?.type === 'wall' ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-600 opacity-50 cursor-not-allowed'}`} 
                  title="Duplicate Selected Wall"
                >
                  <Copy size={16} />
                </button>

                {/* Delete Tool (Only 1 wall) */}
                <button 
                  onClick={handleDeleteWall} 
                  disabled={selectedObj?.type !== 'wall'}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${selectedObj?.type === 'wall' ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-600 opacity-50 cursor-not-allowed'}`} 
                  title="Hapus Tembok yang Dipilih (Del)"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="w-6 h-px bg-slate-700/80 my-1.5" />

              <div className="w-full flex flex-col gap-0.5">
                {/* Reset Camera */}
                <button 
                  onClick={handleResetCamera} 
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all" 
                  title="Reset Camera (Top View)"
                >
                  <Camera size={16} />
                </button>

                {/* Save Layout Button - in toolbar */}
                <button 
                  onClick={saveLayout}
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-all" 
                  title="Simpan Layout (Ctrl+S)"
                >
                  <Save size={16} />
                </button>

                {/* Clear All (Reset Canvas) */}
                <button 
                  onClick={handleClearAll} 
                  className="w-full aspect-square flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/20 transition-all" 
                  title="Hapus SEMUA Tembok (Reset)"
                >
                  <Eraser size={16} />
                </button>
              </div>
              </div>
            </div>
          )}

          {/* FLOATING LAYERS PANEL (Photoshop Style) */}
          {editMode && (
            <div className={`absolute top-20 z-20 transition-all duration-300 ${layersPanelOpen ? 'right-4' : '-right-[13.5rem]'}`}>
              <button 
                onClick={() => setLayersPanelOpen(!layersPanelOpen)}
                className="absolute -left-4 top-4 w-4 h-16 bg-slate-800 border-y border-l border-slate-700 rounded-l-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer shadow-lg"
              >
                 {layersPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
              </button>
              <div className={`w-56 max-h-[60vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl shadow-2xl flex flex-col pointer-events-auto transition-opacity duration-300 ${layersPanelOpen ? 'opacity-100' : 'opacity-0'}`}>
                <h3 className="font-bold text-[11px] text-slate-200 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Layers size={14} className="text-primary-400" /> Layers
                </h3>
              <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {walls.map((w, index) => (
                  <React.Fragment key={w.id}>
                    <div 
                      onClick={() => setSelectedObj({ type: 'wall', id: w.id })}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        (selectedObj?.id === w.id || selectedForGroup.includes(w.id)) ? 'bg-primary-500/20 border border-primary-500/50 shadow-inner' : 'hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForGroup(prev => prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id]);
                          }}
                          className={`transition-colors ${selectedForGroup.includes(w.id) ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                          title="Tandai untuk di-Grup"
                        >
                          {selectedForGroup.includes(w.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>

                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedObj({ type: 'wall', id: w.id })}>
                          {w.type === 'room' || w.type === 'custom_group' ? <BoxIcon size={12} className="text-amber-400"/> : <Square size={12} className="text-slate-400"/>}
                          <span className={`text-[11px] font-medium ${selectedObj?.id === w.id ? 'text-white' : 'text-slate-300'}`}>
                            {w.name || (w.type === 'room' || w.type === 'custom_group' ? `Grup ${index+1}` : `Tembok ${index+1}`)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setWalls(prev => prev.map(wall => wall.id === w.id ? { ...wall, hidden: !wall.hidden } : wall));
                        }}
                        className={`hover:text-slate-100 transition-colors ${w.hidden ? 'text-slate-600' : 'text-slate-400'}`}
                        title={w.hidden ? "Tampilkan" : "Sembunyikan"}
                      >
                        {w.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    
                    {/* Render Children if it's a group */}
                    {w.type === 'custom_group' && w.children && (
                      <div className="pl-6 space-y-1 mt-1 border-l border-slate-700/50 ml-3">
                        {w.children.map((c, cIdx) => (
                          <div 
                            key={c.id} 
                            onClick={() => setSelectedObj({ type: 'wall', id: c.id })}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all ${
                              (selectedObj?.id === c.id || selectedForGroup.includes(c.id)) ? 'bg-primary-500/20 border border-primary-500/50 shadow-inner' : 'hover:bg-slate-800 border border-transparent'
                            } ${c.hidden ? 'opacity-40' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedForGroup(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                                }}
                                className={`transition-colors ${selectedForGroup.includes(c.id) ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                                title="Tandai (Multi-select)"
                              >
                                {selectedForGroup.includes(c.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                              </button>
                              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedObj({ type: 'wall', id: c.id })}>
                                <BoxIcon size={10} className="text-slate-500"/>
                                <span className={`text-[10px] ${selectedObj?.id === c.id ? 'text-white font-bold' : 'text-slate-400'} ${c.hidden ? 'line-through' : ''}`}>
                                  {c.name || `Elemen ${cIdx+1}`}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWalls(prev => prev.map(wall => {
                                  if (wall.id !== w.id) return wall;
                                  return {
                                    ...wall,
                                    children: wall.children.map(child =>
                                      child.id === c.id ? { ...child, hidden: !child.hidden } : child
                                    )
                                  };
                                }));
                                // Deselect if hiding the currently selected child
                                if (selectedObj?.id === c.id) setSelectedObj(null);
                              }}
                              className={`hover:text-slate-100 transition-colors flex-shrink-0 ${c.hidden ? 'text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
                              title={c.hidden ? 'Tampilkan' : 'Sembunyikan'}
                            >
                              {c.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {walls.length === 0 && (
                  <p className="text-[10px] text-slate-500 text-center py-4 border border-dashed border-slate-700/50 rounded-lg">
                    Belum ada struktur.
                  </p>
                )}

                {/* DEVICES IN LAYERS */}
                {(roomId === 'default' ? devices : devices.filter(d => Number(d.room_id) === Number(roomId))).length > 0 && (
                  <>
                    <div className="w-full h-px bg-slate-700/50 my-2" />
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1 mb-1">Perangkat IoT</h4>
                    {(roomId === 'default' ? devices : devices.filter(d => Number(d.room_id) === Number(roomId))).map((dev) => {
                      const isHidden = hiddenDevices.includes(dev.id);
                      return (
                      <div 
                        key={dev.id}
                        onClick={() => {
                          setActiveTab('devices');
                          setSelectedObj({ type: 'device', id: dev.id });
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          selectedObj?.id === dev.id ? 'bg-emerald-500/20 border border-emerald-500/50 shadow-inner' : 'hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-[14px] flex justify-center"></div> {/* Spacer to align with checkboxes */}
                          <div className="flex items-center gap-2">
                            <Activity size={12} className={selectedObj?.id === dev.id ? 'text-emerald-400' : 'text-slate-400'} />
                            <span className={`text-[11px] font-medium ${selectedObj?.id === dev.id ? 'text-white' : 'text-slate-300'} ${isHidden ? 'opacity-50 line-through' : ''}`}>
                              {dev.name}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setHiddenDevices(prev => prev.includes(dev.id) ? prev.filter(id => id !== dev.id) : [...prev, dev.id]);
                            // Deselect if hiding
                            if (selectedObj?.id === dev.id) setSelectedObj(null);
                          }}
                          className={`hover:text-slate-100 transition-colors flex-shrink-0 ${isHidden ? 'text-slate-600' : 'text-slate-400'}`}
                          title={isHidden ? "Tampilkan" : "Sembunyikan"}
                        >
                          {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )})}
                  </>
                )}
              </div>
              
              {selectedForGroup.length > 1 && (
                <button 
                  onClick={handleGroupSelected}
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-wider"
                >
                  <FolderPlus size={14} /> Gabung ({selectedForGroup.length})
                </button>
              )}
            </div>
          </div>
          )}

          <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true, pixelRatio: isCapturing ? 3 : window.devicePixelRatio }} camera={{ position: [15, 20, 15], fov: 45 }}>
            <color attach="background" args={[isCapturing ? '#ffffff' : '#020617']} />
            <ambientLight intensity={isCapturing ? 1.5 : 0.4} />
            <directionalLight castShadow={!isCapturing} position={[5, 15, 5]} intensity={isCapturing ? 0 : 0.8} shadow-mapSize={[2048, 2048]} />
            
            <Suspense fallback={null}>
              <RoomLayout 
                devices={roomId === 'default' ? devices : devices.filter(d => Number(d.room_id) === Number(roomId))} 
                editMode={editMode} 
                activeTab={activeTab}
                walls={walls} setWalls={setWallsWithHistory}
                selectedObj={selectedObj} setSelectedObj={setSelectedObj}
                selectedForGroup={selectedForGroup}
                transformMode={transformMode}
                onPlaceDevice={handlePlaceDevice}
                orbitRef={orbitRef}
                hiddenDevices={hiddenDevices}
                roomName={roomName}
                isExploreMode={isExploreMode}
                isCapturing={isCapturing}
              />
              {!isCapturing && <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={30} blur={2.5} far={4} color="#000000" />}
              <Environment preset="city" />
            </Suspense>
          </Canvas>

          {/* Save button removed from floating - now in toolbar */}
        </div>

        {/* SIDEBAR EDITOR */}
        {editMode && (
          <div className={`relative transition-all duration-300 flex-shrink-0 ${rightPanelOpen ? 'w-80' : 'w-0'}`}>
            <button 
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-4 h-16 bg-slate-800 border-y border-l border-slate-700 rounded-l-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer shadow-lg transition-all duration-300 ${rightPanelOpen ? '-left-4' : '-left-8'}`}
            >
               {rightPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
            <div className={`w-80 h-full bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col shadow-xl transition-opacity duration-300 ${rightPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* TABS */}
            <div className="flex gap-2 mb-5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button 
                onClick={() => { setActiveTab('walls'); setSelectedObj(null); }}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors uppercase tracking-wider ${activeTab === 'walls' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Bangunan
              </button>
              <button 
                onClick={() => { setActiveTab('devices'); setSelectedObj(null); }}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-colors uppercase tracking-wider ${activeTab === 'devices' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}
              >
                Perangkat IoT
              </button>
            </div>

            {/* TAB CONTENT: WALLS */}
            {activeTab === 'walls' && (
              <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-1">
                {selectedObj?.type === 'wall' ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-sm text-amber-400">Properti Tembok</h3>
                      <button onClick={() => setSelectedObj(null)} className="text-slate-500 hover:text-slate-100"><X size={14}/></button>
                    </div>
                    
                    {(() => {
                      let wall = walls.find(w => w.id === selectedObj.id);
                      let parentGroup = null;
                      
                      if (!wall) {
                        for (const w of walls) {
                          if (w.type === 'custom_group' && w.children) {
                            const child = w.children.find(c => c.id === selectedObj.id);
                            if (child) {
                              wall = child;
                              parentGroup = w;
                              break;
                            }
                          }
                        }
                      }

                      if (!wall) return null;
                      
                      const updateWall = (field, axis, value) => {
                        const num = parseFloat(value) || 0;
                        setWalls(prev => prev.map(w => {
                          if (w.id === wall.id) {
                            const newArr = [...w[field]];
                            newArr[axis] = num;
                            return { ...w, [field]: newArr };
                          }
                          
                          if (w.type === 'custom_group' && w.children && w.id === parentGroup?.id) {
                            return {
                              ...w,
                              children: w.children.map(c => {
                                if (c.id === wall.id) {
                                  const newArr = [...c[field]];
                                  newArr[axis] = num;
                                  return { ...c, [field]: newArr };
                                }
                                return c;
                              })
                            };
                          }
                          
                          return w;
                        }));
                      };

                      return (
                        <div className="space-y-4">
                          {wall.type === 'custom_group' && (
                            <button 
                              onClick={handleUngroup}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-slate-100 transition-all font-bold text-xs"
                            >
                              <FolderOpen size={14} /> Pecah Grup (Ungroup)
                            </button>
                          )}

                          {/* NAMA OBJEK (RENAME) */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Objek</label>
                            <div className="mt-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                              <Edit3 size={12} className="text-slate-400 mr-2" />
                              <input 
                                type="text" 
                                value={wall.name || ''} 
                                placeholder={wall.type === 'room' || wall.type === 'custom_group' ? 'Nama Grup...' : 'Nama Objek...'}
                                onChange={e => {
                                  setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, name: e.target.value } : w));
                                }} 
                                className="w-full bg-transparent text-xs text-white outline-none py-1.5" 
                              />
                            </div>
                          </div>

                          {/* TEKS KONTEN (Khusus Teks Label) */}
                          {wall.type === 'text_label' && (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Isi Teks / Nama Ruangan</label>
                                <div className="mt-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                  <input 
                                    type="text" 
                                    value={wall.text || ''} 
                                    placeholder="Masukkan teks..."
                                    onChange={e => {
                                      setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, text: e.target.value } : w));
                                    }} 
                                    className="w-full bg-transparent text-xs text-white outline-none py-1.5" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Ukuran Font</label>
                                  <input 
                                    type="number" 
                                    step="0.5"
                                    value={wall.fontSize || 5} 
                                    onChange={e => setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, fontSize: parseFloat(e.target.value) || 5 } : w))}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white px-2 py-1.5 outline-none" 
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Warna Teks</label>
                                  <input 
                                    type="color" 
                                    value={wall.color || '#94a3b8'} 
                                    onChange={e => setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, color: e.target.value } : w))}
                                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg h-[28px] p-0 cursor-pointer border-none" 
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button 
                                  onClick={() => setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, bold: !w.bold } : w))}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${wall.bold ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                >
                                  Bold
                                </button>
                                <button 
                                  onClick={() => setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, italic: !w.italic } : w))}
                                  className={`flex-1 py-1.5 rounded-lg text-xs italic border transition-colors ${wall.italic ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                >
                                  Italic
                                </button>
                              </div>
                              <div className="mt-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Opacity (Transparansi)</label>
                                <input 
                                  type="range" 
                                  min="0.1" max="1" step="0.1" 
                                  value={wall.opacity !== undefined ? wall.opacity : 0.15} 
                                  onChange={e => setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, opacity: parseFloat(e.target.value) } : w))}
                                  className="w-full mt-1 accent-indigo-500" 
                                />
                              </div>
                            </>
                          )}

                          {/* GANTI TEMBOK KHUSUS (ukuran, posisi, rotasi tetap) */}
                          {['door_wall', 'door_wall_left', 'door_wall_right', 'door_wall_double'].includes(wall.type) && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Ganti Tembok Khusus</label>
                              <select
                                value={wall.type}
                                aria-label="Ganti jenis tembok khusus"
                                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white px-2 py-2 outline-none focus:border-primary-500 transition-colors cursor-pointer"
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const names = { door_wall: 'Tembok Pintu', door_wall_left: 'Tembok Pintu Kiri', door_wall_right: 'Tembok Pintu Kanan', door_wall_double: 'Tembok Pintu Ganda' };
                                  const swap = (o) => ({ ...o, type: newType, name: names[newType] });
                                  setWalls(prev => prev.map(w => {
                                    if (w.id === wall.id) return swap(w);
                                    if (w.type === 'custom_group' && w.children && w.id === parentGroup?.id) {
                                      return { ...w, children: w.children.map(c => c.id === wall.id ? swap(c) : c) };
                                    }
                                    return w;
                                  }));
                                }}
                              >
                                <option value="door_wall">Tembok + Pintu (Tengah)</option>
                                <option value="door_wall_left">Tembok + Pintu (Kiri)</option>
                                <option value="door_wall_right">Tembok + Pintu (Kanan)</option>
                                <option value="door_wall_double">Tembok + Pintu Ganda</option>
                              </select>
                            </div>
                          )}

                          {/* UKURAN, POSISI, ROTASI (SELAIN TEKS LABEL) */}
                          {wall.type !== 'text_label' && (
                            <>
                              {/* UKURAN (SCALE) */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Ukuran (Panjang & Lebar)</label>
                                <div className="flex gap-2 mt-1">
                                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                    <span className="text-xs text-rose-500 font-bold mr-2">X</span>
                                    <input type="number" step="0.5" value={wall.scale[0]} onChange={e => updateWall('scale', 0, e.target.value)} className="w-full bg-transparent text-xs text-white outline-none py-1.5" />
                                  </div>
                                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                    <span className="text-xs text-blue-500 font-bold mr-2">Z</span>
                                    <input type="number" step="0.5" value={wall.scale[2]} onChange={e => updateWall('scale', 2, e.target.value)} className="w-full bg-transparent text-xs text-white outline-none py-1.5" />
                                  </div>
                                </div>
                              </div>
                              
                              {/* POSISI (TRANSLATE) */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Posisi (Lantai)</label>
                                <div className="flex gap-2 mt-1">
                                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                    <span className="text-xs text-rose-500 font-bold mr-2">X</span>
                                    <input type="number" step="0.5" value={wall.position[0]} onChange={e => updateWall('position', 0, e.target.value)} className="w-full bg-transparent text-xs text-white outline-none py-1.5" />
                                  </div>
                                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                    <span className="text-xs text-blue-500 font-bold mr-2">Z</span>
                                    <input type="number" step="0.5" value={wall.position[2]} onChange={e => updateWall('position', 2, e.target.value)} className="w-full bg-transparent text-xs text-white outline-none py-1.5" />
                                  </div>
                                </div>
                              </div>

                              {/* ROTASI */}
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Rotasi (Derajat)</label>
                                <div className="mt-1 bg-slate-900 border border-slate-700 rounded-lg flex items-center px-2">
                                  <span className="text-xs text-emerald-500 font-bold mr-2">Y°</span>
                                  <input 
                                    type="number" 
                                    step="45" 
                                    value={(wall.rotation[1] * (180 / Math.PI)).toFixed(0)} 
                                    onChange={e => {
                                      const rad = (parseFloat(e.target.value) || 0) * (Math.PI / 180);
                                      updateWall('rotation', 1, rad);
                                    }} 
                                    className="w-full bg-transparent text-xs text-white outline-none py-1.5" 
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <p className="font-bold text-slate-200 mb-2 text-sm">Katalog Struktur (Preset)</p>
                      <p className="text-xs text-slate-400 mb-4">Klik template di bawah ini untuk menambahkannya ke tengah ruangan. Anda bisa menggesernya setelah itu.</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {/* Tembok Standar */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), position: getSpawnPosition(), scale: [4, 4, 0.5], rotation: [0, 0, 0] };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-4 bg-slate-700 group-hover:bg-emerald-400 rounded-sm" />
                          <span className="text-[10px] font-bold text-slate-300">Tembok Standar</span>
                        </button>
                        
                        {/* Tembok Panjang */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), position: getSpawnPosition(), scale: [12, 4, 0.5], rotation: [0, 0, 0] };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-12 h-4 bg-slate-700 group-hover:bg-emerald-400 rounded-sm" />
                          <span className="text-[10px] font-bold text-slate-300">1 Sisi Tembok</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 mt-2">
                        {/* Teks Label */}
                        <button 
                          onClick={() => {
                            const spawn = getSpawnPosition();
                            const newText = { 
                              id: 'text_' + Date.now(), 
                              type: 'text_label', 
                              text: 'Teks Baru', 
                              position: [spawn[0], 0.02, spawn[2]], 
                              scale: [1, 1, 1], 
                              rotation: [-Math.PI / 2, 0, 0], 
                              name: 'Label Teks' 
                            };
                            setWalls(prev => [...prev, newText]);
                            setSelectedObj({ type: 'wall', id: newText.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-slate-800 group-hover:bg-emerald-500/20 border border-slate-600 group-hover:border-emerald-400 rounded-md">
                            <span className="text-slate-400 group-hover:text-emerald-400 font-bold text-lg">T</span>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Teks Label</span>
                            <span className="block text-[9px] text-slate-400">Tambahkan tulisan di lantai</span>
                          </div>
                        </button>
                      </div>

                      <p className="font-bold text-slate-200 mt-5 mb-2 text-sm">Tembok Khusus</p>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Tembok Berpintu */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall', position: getSpawnPosition(), scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu' };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-4 border-t-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-emerald-400 rounded-t-sm relative">
                            {/* Fake door hole */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-3.5 border border-dashed border-slate-500 group-hover:border-emerald-300"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Tembok + Pintu (Tengah)</span>
                            <span className="block text-[9px] text-slate-400">Tembok dengan lubang di tengah</span>
                          </div>
                        </button>

                        {/* Tembok Berpintu (Kiri) */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall_left', position: getSpawnPosition(), scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu Kiri' };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-4 border-t-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-emerald-400 rounded-t-sm relative">
                            <div className="absolute bottom-0 left-[2px] w-2.5 h-3.5 border border-dashed border-slate-500 group-hover:border-emerald-300"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Tembok + Pintu (Kiri)</span>
                            <span className="block text-[9px] text-slate-400">Lubang pintu di sisi kiri</span>
                          </div>
                        </button>

                        {/* Tembok Berpintu (Kanan) */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall_right', position: getSpawnPosition(), scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu Kanan' };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-4 border-t-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-emerald-400 rounded-t-sm relative">
                            <div className="absolute bottom-0 right-[2px] w-2.5 h-3.5 border border-dashed border-slate-500 group-hover:border-emerald-300"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Tembok + Pintu (Kanan)</span>
                            <span className="block text-[9px] text-slate-400">Lubang pintu di sisi kanan</span>
                          </div>
                        </button>

                        {/* Tembok Pintu Ganda */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall_double', position: getSpawnPosition(), scale: [12, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu Ganda' };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-4 border-t-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-emerald-400 rounded-t-sm relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-3.5 border border-dashed border-slate-500 group-hover:border-emerald-300"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Tembok + Pintu Ganda</span>
                            <span className="block text-[9px] text-slate-400">1 lubang lebar 2× pintu standar</span>
                          </div>
                        </button>
                      </div>

                      <p className="font-bold text-slate-200 mt-5 mb-2 text-sm">Template Ruangan Penuh</p>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Ruangan Kotak */}
                        <button 
                          onClick={() => {
                            const newRoom = { id: 'room_' + Date.now(), type: 'room', position: getSpawnPosition(), scale: [10, 4, 10], rotation: [0, 0, 0] };
                            setWalls(prev => [...prev, newRoom]);
                            setSelectedObj({ type: 'wall', id: newRoom.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-8 border-[3px] border-slate-700 group-hover:border-amber-400 rounded-sm" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Kamar Persegi (10x10)</span>
                            <span className="block text-[9px] text-slate-400">1 Grup Utuh (Bisa ditarik bersamaan)</span>
                          </div>
                        </button>

                        {/* Kamar + Pintu */}
                        <button 
                          onClick={() => {
                            const id = Date.now();
                            const newGroup = {
                              id: 'group_' + id,
                              type: 'custom_group',
                              name: 'Kamar + Pintu',
                              position: getSpawnPosition(),
                              rotation: [0, 0, 0],
                              scale: [1, 1, 1],
                              children: [
                                { id: `w_n_${id}`, type: 'wall', position: [0, 0, -5], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_s_${id}`, type: 'door_wall', position: [0, 0, 5], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_e_${id}`, type: 'wall', position: [5, 0, 0], scale: [0.5, 4, 10], rotation: [0, 0, 0] },
                                { id: `w_w_${id}`, type: 'wall', position: [-5, 0, 0], scale: [0.5, 4, 10], rotation: [0, 0, 0] }
                              ]
                            };
                            setWalls(prev => [...prev, newGroup]);
                            setSelectedObj({ type: 'wall', id: newGroup.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-8 border-[3px] border-slate-700 group-hover:border-amber-400 rounded-sm relative">
                            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-1 bg-slate-900 group-hover:bg-[#1a2536]"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Kamar + Pintu</span>
                            <span className="block text-[9px] text-slate-400">Grup 4 sisi (1 sisi ada pintu)</span>
                          </div>
                        </button>

                        {/* Ruangan Persegi Panjang */}
                        <button 
                          onClick={() => {
                            const newRoom = { id: 'room_' + Date.now(), type: 'room', position: getSpawnPosition(), scale: [14, 4, 8], rotation: [0, 0, 0] };
                            setWalls(prev => [...prev, newRoom]);
                            setSelectedObj({ type: 'wall', id: newRoom.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-10 h-7 border-[3px] border-slate-700 group-hover:border-amber-400 rounded-sm" />
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Ruangan Luas (14x8)</span>
                            <span className="block text-[9px] text-slate-400">1 Grup Utuh (Bisa ditarik bersamaan)</span>
                          </div>
                        </button>
                        
                        {/* Ruangan L-Shape */}
                        <button 
                          onClick={() => {
                            const id = Date.now();
                            const newGroup = {
                              id: 'group_' + id,
                              type: 'custom_group',
                              name: 'Ruangan Bentuk L',
                              position: [0, 2, 0],
                              rotation: [0, 0, 0],
                              scale: [1, 1, 1],
                              children: [
                                { id: `w_1_${id}`, type: 'wall', position: [-2, 0, -5], scale: [14.5, 4, 0.5], rotation: [0, 0, 0] }, // North Long
                                { id: `w_2_${id}`, type: 'wall', position: [5, 0, -1], scale: [0.5, 4, 8.5], rotation: [0, 0, 0] }, // East short
                                { id: `w_3_${id}`, type: 'wall', position: [1, 0, 3], scale: [8.5, 4, 0.5], rotation: [0, 0, 0] }, // Middle South
                                { id: `w_4_${id}`, type: 'wall', position: [-3, 0, 6.5], scale: [0.5, 4, 7.5], rotation: [0, 0, 0] }, // Middle East
                                { id: `w_5_${id}`, type: 'wall', position: [-6, 0, 10], scale: [6.5, 4, 0.5], rotation: [0, 0, 0] }, // Far South
                                { id: `w_6_${id}`, type: 'wall', position: [-9, 0, 2.5], scale: [0.5, 4, 15.5], rotation: [0, 0, 0] } // West Long
                              ]
                            };
                            setWalls(prev => [...prev, newGroup]);
                            setSelectedObj({ type: 'wall', id: newGroup.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-8 relative">
                             <div className="absolute top-0 left-0 w-8 h-4 border-t-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-amber-400" />
                             <div className="absolute top-4 left-0 w-4 h-4 border-b-[3px] border-l-[3px] border-r-[3px] border-slate-700 group-hover:border-amber-400" />
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Ruangan L-Shape</span>
                            <span className="block text-[9px] text-slate-400">Grup 6 sisi membentuk huruf L</span>
                          </div>
                        </button>

                        {/* Apartemen 2 Ruang */}
                        <button 
                          onClick={() => {
                            const id = Date.now();
                            const newGroup = {
                              id: 'group_' + id,
                              type: 'custom_group',
                              name: 'Apartemen 2 Ruang',
                              position: [0, 2, 0],
                              rotation: [0, 0, 0],
                              scale: [1, 1, 1],
                              children: [
                                { id: `w_n_${id}`, type: 'wall', position: [0, 0, -4], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_s_${id}`, type: 'door_wall', position: [0, 0, 4], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] }, // Main Door
                                { id: `w_w_${id}`, type: 'wall', position: [-5, 0, 0], scale: [0.5, 4, 7.5], rotation: [0, 0, 0] },
                                { id: `w_e_${id}`, type: 'wall', position: [5, 0, 0], scale: [0.5, 4, 7.5], rotation: [0, 0, 0] },
                                { id: `w_d_${id}`, type: 'door_wall', position: [0, 0, 0], scale: [9.5, 4, 0.5], rotation: [0, 0, 0] } // Inner Door
                              ]
                            };
                            setWalls(prev => [...prev, newGroup]);
                            setSelectedObj({ type: 'wall', id: newGroup.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-10 border-[3px] border-slate-700 group-hover:border-amber-400 rounded-sm relative">
                            {/* Inner Divider */}
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-700 group-hover:bg-amber-400 -translate-y-1/2"></div>
                            {/* Inner Door Hole */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-[2px] bg-slate-900 group-hover:bg-[#1a2536]"></div>
                            {/* Outer Door Hole */}
                            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-1 bg-slate-900 group-hover:bg-[#1a2536]"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Apartemen 2 Ruang</span>
                            <span className="block text-[9px] text-slate-400">Pintu luar & sekat pintu dalam</span>
                          </div>
                        </button>

                        {/* Gudang & Ruang Admin */}
                        <button 
                          onClick={() => {
                            const id = Date.now();
                            const newGroup = {
                              id: 'group_' + id,
                              type: 'custom_group',
                              name: 'Gudang & Admin',
                              position: [0, 2, 0],
                              rotation: [0, 0, 0],
                              scale: [1, 1, 1],
                              children: [
                                { id: `w_n_${id}`, type: 'wall', position: [0, 0, -6], scale: [16.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_s_${id}`, type: 'door_wall', position: [0, 0, 6], scale: [16.5, 4, 0.5], rotation: [0, 0, 0] }, // Main Door
                                { id: `w_w_${id}`, type: 'wall', position: [-8, 0, 0], scale: [0.5, 4, 11.5], rotation: [0, 0, 0] },
                                { id: `w_e_${id}`, type: 'wall', position: [8, 0, 0], scale: [0.5, 4, 11.5], rotation: [0, 0, 0] },
                                // Admin Office (top right corner: 4x4)
                                { id: `w_adm_s_${id}`, type: 'wall', position: [6, 0, -2], scale: [3.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_adm_w_${id}`, type: 'door_wall', position: [4, 0, -4], scale: [0.5, 4, 3.5], rotation: [0, 0, 0] }
                              ]
                            };
                            setWalls(prev => [...prev, newGroup]);
                            setSelectedObj({ type: 'wall', id: newGroup.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-10 h-8 border-[3px] border-slate-700 group-hover:border-emerald-400 rounded-sm relative">
                            {/* Main Door Hole */}
                            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-3 h-1 bg-slate-900 group-hover:bg-[#1a2536]"></div>
                            {/* Admin Office */}
                            <div className="absolute top-0 right-0 w-3 h-3 border-b-[2px] border-l-[2px] border-slate-700 group-hover:border-emerald-400"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Gudang & Admin</span>
                            <span className="block text-[9px] text-slate-400">Area luas 16x12 + 1 sekat kantor</span>
                          </div>
                        </button>

                        {/* Kantor 4 Ruangan */}
                        <button 
                          onClick={() => {
                            const id = Date.now();
                            const newGroup = {
                              id: 'group_' + id,
                              type: 'custom_group',
                              name: 'Kantor 4 Ruang',
                              position: [0, 2, 0],
                              rotation: [0, 0, 0],
                              scale: [1, 1, 1],
                              children: [
                                { id: `w_n_${id}`, type: 'wall', position: [0, 0, -5], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_s_${id}`, type: 'door_wall', position: [0, 0, 5], scale: [10.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_w_${id}`, type: 'wall', position: [-5, 0, 0], scale: [0.5, 4, 9.5], rotation: [0, 0, 0] },
                                { id: `w_e_${id}`, type: 'wall', position: [5, 0, 0], scale: [0.5, 4, 9.5], rotation: [0, 0, 0] },
                                // Dividers
                                { id: `w_d1_${id}`, type: 'door_wall', position: [0, 0, -2.5], scale: [0.5, 4, 4.5], rotation: [0, 0, 0] },
                                { id: `w_d2_${id}`, type: 'door_wall', position: [0, 0, 2.5], scale: [0.5, 4, 4.5], rotation: [0, 0, 0] },
                                { id: `w_d3_${id}`, type: 'door_wall', position: [-2.5, 0, 0], scale: [4.5, 4, 0.5], rotation: [0, 0, 0] },
                                { id: `w_d4_${id}`, type: 'door_wall', position: [2.5, 0, 0], scale: [4.5, 4, 0.5], rotation: [0, 0, 0] }
                              ]
                            };
                            setWalls(prev => [...prev, newGroup]);
                            setSelectedObj({ type: 'wall', id: newGroup.id });
                          }}
                          className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-8 h-8 border-[3px] border-slate-700 group-hover:border-indigo-400 rounded-sm relative">
                            {/* Main Door Hole */}
                            <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-2 h-1 bg-slate-900 group-hover:bg-[#1a2536]"></div>
                            {/* Cross Divider */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-slate-700 group-hover:bg-indigo-400"></div>
                            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-slate-700 group-hover:bg-indigo-400"></div>
                          </div>
                          <div className="text-left">
                            <span className="block text-[11px] font-bold text-slate-200">Kantor 4 Ruang</span>
                            <span className="block text-[9px] text-slate-400">Layout 10x10 dibagi 4 kuadran</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: DEVICES */}
            {activeTab === 'devices' && (() => {
              const currentRoomDevices = roomId === 'default' ? devices : devices.filter(d => Number(d.room_id) === Number(roomId));
              const unassignedDevices = roomId !== 'default' ? devices.filter(d => !d.room_id) : [];

              return (
                <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar">
                  
                  {/* Current Room Devices */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900 py-1 z-10">
                      {roomId === 'default' ? 'Semua Perangkat' : 'Di Ruangan Ini'} ({currentRoomDevices.length})
                    </h3>
                    
                    {currentRoomDevices.length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">Belum ada perangkat di ruangan ini.</p>
                    )}
                    
                    {currentRoomDevices.map(dev => {
                      const isPlaced = !!dev.broker_config?.position;
                      const isSelectedSpawn = selectedObj?.type === 'device_spawn' && selectedObj?.id === dev.id;
                      const isSelectedNode = selectedObj?.type === 'device' && selectedObj?.id === dev.id;
                      const isSelected = isSelectedSpawn || isSelectedNode;
                      
                      return (
                        <div 
                          key={dev.id}
                          onClick={() => setSelectedObj({ type: isPlaced ? 'device' : 'device_spawn', id: dev.id })}
                          className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer group ${
                            isSelected
                              ? 'bg-primary-500/10 border-primary-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                              : 'bg-slate-900/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                                isPlaced 
                                  ? (isSelected ? 'bg-primary-500/20 text-primary-400' : 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30') 
                                  : 'bg-slate-800/80 text-slate-500'
                              }`}>
                                <Cpu size={16} />
                              </div>
                              <div className="flex flex-col">
                                <p className={`text-[13px] font-bold truncate w-32 transition-colors ${isSelected ? 'text-primary-400' : 'text-slate-200 group-hover:text-slate-100'}`}>{dev.name}</p>
                                <p className="text-[10px] text-slate-500">{isPlaced ? 'Telah Diletakkan' : 'Klik & arahkan ke lantai'}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {isPlaced && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveDevicePosition(dev.id); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-slate-100' : 'bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-900'}`}
                                  title="Angkat dari peta (tanpa menghapus dari ruangan)"
                                >
                                  <Move size={14} />
                                </button>
                              )}
                              {roomId !== 'default' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveDeviceFromRoom(dev.id); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-primary-500/20 text-primary-400 hover:bg-rose-500 hover:text-slate-100' : 'bg-slate-800 text-rose-400 hover:bg-rose-500 hover:text-slate-900'}`}
                                  title="Keluarkan dari ruangan ini"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Unassigned Devices */}
                  {roomId !== 'default' && unassignedDevices.length > 0 && (
                    <div className="space-y-2 pb-10">
                      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900 py-1 z-10">
                        Belum Dialokasikan ({unassignedDevices.length})
                      </h3>
                      {unassignedDevices.map(dev => (
                        <div 
                          key={dev.id}
                          onClick={() => handlePlaceDevice(dev.id, getSpawnPosition())}
                          className="p-3 rounded-xl border bg-slate-900/40 backdrop-blur-sm border-slate-700/50 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all duration-300 cursor-pointer group shadow-sm"
                          title="Klik untuk masukkan ke ruangan ini"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-800/80 text-slate-500 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors">
                                <PlusSquare size={16} />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[13px] font-bold text-slate-300 truncate w-40 group-hover:text-primary-400 transition-colors">{dev.name}</p>
                                <p className="text-[10px] text-slate-500 group-hover:text-primary-400/70 transition-colors">Klik untuk masukkan ke ruangan</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })()}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
