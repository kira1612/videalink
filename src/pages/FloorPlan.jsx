import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, useCursor, RoundedBox, Environment, ContactShadows, TransformControls } from '@react-three/drei';
import { Box as BoxIcon, Info, Edit3, Check, X, MousePointerClick, Cpu, Activity, Power, Move, Maximize, RotateCcw, PlusSquare, Trash2, Save, MousePointer2, Eraser, Copy, Camera, Trash, Maximize2, Minimize2, Layers, Eye, EyeOff, Square, CheckSquare, FolderPlus, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { devicesApi, mqttApi } from '../services/api';
import Swal from 'sweetalert2';

/* ─────────────────────────────────────────────────────────────────────────
   Smart Device Node 
───────────────────────────────────────────────────────────────────────── */
function SmartDeviceNode({ device, position, isEditMode, isSelected, onClick, onNodeClick }) {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  useCursor(hovered);

  const status = device.status === 'online';
  const ringRef = useRef();
  
  useFrame(({ clock }) => {
    if (status && ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 5) * 0.15);
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
      <mesh ref={ringRef} scale={1.2} position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color={status ? '#34d399' : '#64748b'} transparent opacity={status ? 0.3 : 0.05} />
      </mesh>
      
      <mesh 
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial 
          color={isSelected ? '#f59e0b' : (status ? '#10b981' : '#475569')} 
          emissive={isSelected ? '#f59e0b' : (status ? '#10b981' : '#000000')}
          emissiveIntensity={status || isSelected ? 2 : 0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {status && <pointLight position={[0, 2, 0]} intensity={1.5} color="#10b981" distance={6} castShadow />}

      {isSelected && (
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 32]} />
          <meshBasicMaterial color="#f59e0b" side={2} />
        </mesh>
      )}

      {!showPopup && hovered && !isEditMode && (
        <Html distanceFactor={10} position={[0, 0.6, 0]} center zIndexRange={[90, 0]}>
          <div className="px-2 py-1 rounded-lg backdrop-blur-md bg-slate-900/80 border border-slate-700 font-bold text-[10px] text-slate-300 whitespace-nowrap pointer-events-none shadow-lg">
            {device.name}
          </div>
        </Html>
      )}

      {showPopup && !isEditMode && (
        <Html distanceFactor={10} position={[0, 0.8, 0]} center zIndexRange={[100, 10]}>
          <div className="w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in text-left">
            <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800 bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{device.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} className="text-slate-500 hover:text-white"><X size={12} /></button>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold text-slate-300">{status ? 'Online' : 'Offline'}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleDevice(); }}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  status ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
              >
                <Power size={14} /> {status ? 'Matikan' : 'Nyalakan'}
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
const CustomGroupBlock = React.forwardRef(({ wall, isSelected, onClick, selectedObj, editMode, activeTab, setSelectedObj }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // True if a specific child is selected (not the group itself)
  const anyChildSelected = wall.children?.some(c => selectedObj?.id === c.id);
  // Group highlight only when group selected AND no specific child is picked
  const groupHighlight = (isSelected || hovered) && !anyChildSelected;

  const handleChildClick = (e, child) => {
    e.stopPropagation();
    if (editMode && activeTab === 'walls') {
      setSelectedObj({ type: 'wall', id: child.id });
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
        const isChildSelected = selectedObj?.id === child.id;
        // Skip hidden children and selected child (selected is rendered by ChildInGroupTransform)
        if (child.hidden || isChildSelected) return null;

        if (child.type?.startsWith('door_wall')) {
          return <DoorWallBlock key={child.id || idx} wall={child} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} />;
        }
        return <WallBlock key={child.id || idx} wall={child} isSelected={groupHighlight} onClick={(e) => handleChildClick(e, child)} />;
      })}
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Child In Group Transform
   Renders a group child at scene-root level so TransformControls
   gets the correct world-space position (no nested coordinate offset).
───────────────────────────────────────────────────────────────────────── */
function ChildInGroupTransform({ child, parentGroup, transformMode, setWalls, orbitRef }) {
  const wallRef = useRef();

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
    // Convert back to local position relative to parent group
    const localPos = [t.position.x - gx, t.position.y - gy, t.position.z - gz];
    setWalls(prev => prev.map(w => {
      if (w.id === parentGroup.id) {
        return {
          ...w,
          children: w.children.map(c => c.id === child.id ? {
            ...c,
            position: localPos,
            rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
            scale: [t.scale.x, t.scale.y, t.scale.z],
          } : c)
        };
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

  return (
    <>
      {child.type?.startsWith('door_wall') ? (
        <DoorWallBlock ref={wallRef} wall={wallData} isSelected={true} onClick={() => {}} />
      ) : (
        <WallBlock ref={wallRef} wall={wallData} isSelected={true} onClick={() => {}} />
      )}
      {transformMode !== 'select' && wallRef.current && (
        <TransformControls
          object={wallRef.current}
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

/* ─────────────────────────────────────────────────────────────────────────
   Door Wall Block (Wall with a door hole)
───────────────────────────────────────────────────────────────────────── */
const DoorWallBlock = React.forwardRef(({ wall, isSelected, onClick }, ref) => {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const matProps = {
    color: isSelected ? '#3b82f6' : (hovered ? '#475569' : '#1e293b'),
    roughness: 0.7,
    metalness: 0.1,
    transparent: true,
    opacity: isSelected ? 0.8 : 1
  };

  const doorW = 0.25; 
  const topH = 0.25; 
  
  let leftW = (1 - doorW) / 2;
  let rightW = (1 - doorW) / 2;
  
  if (wall.type === 'door_wall_left') {
    leftW = 0.1;
    rightW = 1 - doorW - leftW;
  } else if (wall.type === 'door_wall_right') {
    rightW = 0.1;
    leftW = 1 - doorW - rightW;
  }

  const leftCenterX = -0.5 + leftW / 2;
  const rightCenterX = 0.5 - rightW / 2;
  const doorCenterX = -0.5 + leftW + doorW / 2;

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
      {leftW > 0 && (
        <RoundedBox position={[leftCenterX, 0, 0]} args={[leftW, 1, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
      )}
      {rightW > 0 && (
        <RoundedBox position={[rightCenterX, 0, 0]} args={[rightW, 1, 1]} radius={0.01} receiveShadow castShadow>
          <meshStandardMaterial {...matProps} />
        </RoundedBox>
      )}
      <RoundedBox position={[doorCenterX, 0.5 - topH/2, 0]} args={[doorW, topH, 1]} radius={0.01} receiveShadow castShadow>
        <meshStandardMaterial {...matProps} />
      </RoundedBox>
    </group>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   Wall Block Wrapper With TransformControls
───────────────────────────────────────────────────────────────────────── */
function WallBlockWithTransform({ wall, isSelected, selectedObj, editMode, activeTab, setSelectedObj, transformMode, setWalls, orbitRef }) {
  const wallRef = useRef();
  
  // Update state ONLY on mouse up to prevent continuous re-rendering
  const handleMouseUp = (e) => {
    if (!wallRef.current) return;
    const t = wallRef.current;
    
    setWalls(prev => prev.map(w => {
      if (w.id === wall.id) {
        return {
          ...w,
          position: [t.position.x, t.position.y, t.position.z],
          rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
          scale: [t.scale.x, t.scale.y, t.scale.z],
        };
      }
      
      if (w.type === 'custom_group' && w.children) {
        if (w.children.some(c => c.id === wall.id)) {
          return {
            ...w,
            children: w.children.map(c => {
              if (c.id === wall.id) {
                return {
                  ...c,
                  position: [t.position.x, t.position.y, t.position.z],
                  rotation: [t.rotation.x, t.rotation.y, t.rotation.z],
                  scale: [t.scale.x, t.scale.y, t.scale.z],
                };
              }
              return c;
            })
          };
        }
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
        <CustomGroupBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          selectedObj={selectedObj}
          editMode={editMode}
          activeTab={activeTab}
          setSelectedObj={setSelectedObj}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      ) : wall.type?.startsWith('door_wall') ? (
        <DoorWallBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      ) : (
        <WallBlock 
          ref={wallRef}
          wall={wall}
          isSelected={isSelected}
          onClick={() => { if(editMode && activeTab === 'walls') setSelectedObj({ type: 'wall', id: wall.id }) }}
        />
      )}
      {isSelected && transformMode !== 'select' && wallRef.current && (
        <TransformControls
          object={wallRef.current}
          mode={transformMode}
          showY={transformMode === 'rotate' ? true : false}
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

/* ─────────────────────────────────────────────────────────────────────────
   Room Layout Environment
───────────────────────────────────────────────────────────────────────── */
function RoomLayout({ 
  devices, editMode, activeTab,
  walls, setWalls,
  selectedObj, setSelectedObj,
  transformMode,
  onPlaceDevice
}) {
  const orbitRef = useRef();

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
    let max = 15; // default half size (30x30 total)
    walls.forEach(w => {
      if (w.type === 'custom_group' && w.children) {
        w.children.forEach(child => {
          if (child.position && child.scale) {
            const scaleX = (w.scale?.[0] || 1) * child.scale[0];
            const scaleZ = (w.scale?.[2] || 1) * child.scale[2];
            const posX = (w.position?.[0] || 0) + (child.position[0] * (w.scale?.[0] || 1));
            const posZ = (w.position?.[2] || 0) + (child.position[2] * (w.scale?.[2] || 1));
            max = Math.max(max, Math.abs(posX) + (scaleX / 2));
            max = Math.max(max, Math.abs(posZ) + (scaleZ / 2));
          }
        });
      } else if (w.position && w.scale) {
        max = Math.max(max, Math.abs(w.position[0]) + (w.scale[0] / 2));
        max = Math.max(max, Math.abs(w.position[2]) + (w.scale[2] / 2));
      }
    });
    // Add 5 units padding, then multiply by 2 to get full width/depth
    // Round to nearest 10 for cleaner grid lines
    return Math.ceil((max + 5) / 5) * 10;
  }, [walls]);

  // Listener untuk Reset Camera dari Luar Canvas
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
    window.addEventListener('reset-camera', handleReset);
    return () => window.removeEventListener('reset-camera', handleReset);
  }, []);

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
      <OrbitControls ref={orbitRef} makeDefault minPolarAngle={Math.PI / 8} maxPolarAngle={Math.PI / 2.1} minDistance={2} maxDistance={200} />
      
      <group position={[0, -1, 0]}>
        {/* Lantai */}
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

        <gridHelper args={[floorSize, floorSize, '#334155', '#1e293b']} position={[0, 0.01, 0]} />

        {/* Tembok (Walls) */}
        {walls.map((wall) => {
          if (wall.hidden) return null;

          // If a child of this group is selected, pass selectedObj down so group knows to skip it
          const isSelected = editMode && activeTab === 'walls' && selectedObj?.id === wall.id;
          
          return (
            <WallBlockWithTransform 
              key={wall.id}
              wall={wall}
              isSelected={isSelected}
              selectedObj={selectedObj}
              editMode={editMode}
              activeTab={activeTab}
              setSelectedObj={setSelectedObj}
              transformMode={transformMode}
              setWalls={setWalls}
              orbitRef={orbitRef}
            />
          );
        })}

        {/* Selected group child: rendered at scene root level for correct gizmo position */}
        {selectedGroupChild && !selectedGroupChild.child.hidden && (
          <ChildInGroupTransform
            key={selectedGroupChild.child.id}
            child={selectedGroupChild.child}
            parentGroup={selectedGroupChild.parentGroup}
            transformMode={transformMode}
            setWalls={setWalls}
            orbitRef={orbitRef}
          />
        )}

        {/* Perangkat (Devices) */}
        {devices.map((dev) => {
          const pos = dev.broker_config?.position;
          if (!pos) return null;

          const isSelected = editMode && activeTab === 'devices' && selectedObj?.id === dev.id;

          return (
            <SmartDeviceNode 
              key={dev.id}
              device={dev}
              position={pos} 
              isEditMode={editMode}
              isSelected={isSelected}
              onClick={() => { if(editMode && activeTab === 'devices') setSelectedObj({ type: 'device', id: dev.id }) }} 
            />
          );
        })}
      </group>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────────────────── */
export default function FloorPlan({ hideHeader = false, roomId = 'default' }) {
  const [devices, setDevices] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('walls'); // 'walls' | 'devices'
  
  // Builder State
  const [walls, setWalls] = useState(() => {
    const saved = localStorage.getItem(`iot_layout_walls_${roomId}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedObj, setSelectedObj] = useState(null);
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  const [transformMode, setTransformMode] = useState('translate');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [layersPanelOpen, setLayersPanelOpen] = useState(true);
  const containerRef = useRef();
  const orbitRef = useRef();

  // Undo/Redo history stack
  const [wallsHistory, setWallsHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const skipHistoryPush = useRef(false);

  // Push current walls to history on meaningful changes
  const pushHistory = (newWalls) => {
    setWallsHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newWalls].slice(-50); // Keep max 50 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  // Wrap setWalls to auto-push history
  const setWallsWithHistory = (updaterOrValue) => {
    setWalls(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      if (!skipHistoryPush.current) {
        // Push old state to history before applying change
        setWallsHistory(h => {
          const trimmed = h.slice(0, historyIndex + 1);
          const newH = [...trimmed, prev].slice(-50);
          setHistoryIndex(newH.length - 1);
          return newH;
        });
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex < 0 || wallsHistory.length === 0) return;
    const prevState = wallsHistory[historyIndex];
    skipHistoryPush.current = true;
    setWalls(prevState);
    setHistoryIndex(h => h - 1);
    setSelectedObj(null);
    skipHistoryPush.current = false;
  };

  const handleRedo = () => {
    // Redo: re-apply from stack (simple: not implemented yet in this version)
    // For simplicity, redo will work by storing future states separately if needed
  };

  const canUndo = historyIndex >= 0 && wallsHistory.length > 0;

  useEffect(() => {
    const fetchDevices = () => {
      devicesApi.list().then(res => {
        // Filter perangkat yang hanya berada di ruangan ini (jika roomId disediakan dan bukan default)
        const allDevices = res.data;
        const roomDevices = roomId === 'default' 
          ? allDevices 
          : allDevices.filter(d => Number(d.room_id) === Number(roomId));
        setDevices(roomDevices);
      }).catch(console.error);
    };
    fetchDevices();
    const iv = setInterval(fetchDevices, 10000);
    return () => clearInterval(iv);
  }, [roomId]);

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

  const handleAddWall = () => {
    const newWall = {
      id: 'wall_' + Date.now(),
      position: [0, 2, 0],
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
    
    const selectedWalls = walls.filter(w => selectedForGroup.includes(w.id));
    
    // 1. Calculate center position of all selected walls
    let cx = 0, cy = 0, cz = 0;
    selectedWalls.forEach(w => {
      cx += w.position[0];
      cy += w.position[1];
      cz += w.position[2];
    });
    cx /= selectedWalls.length;
    cy /= selectedWalls.length;
    cz /= selectedWalls.length;

    // 2. Adjust children positions to be local to the new center
    const groupChildren = selectedWalls.map(w => ({
      ...w,
      position: [w.position[0] - cx, w.position[1] - cy, w.position[2] - cz]
    }));

    const newGroup = {
      id: 'group_' + Date.now(),
      type: 'custom_group',
      position: [cx, cy, cz],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      children: groupChildren
    };

    // 3. Replace selected walls with the new group
    setWallsWithHistory(prev => [...prev.filter(w => !selectedForGroup.includes(w.id)), newGroup]);
    setSelectedForGroup([]);
    setSelectedObj({ type: 'wall', id: newGroup.id });
  };

  const handleUngroup = () => {
    if (selectedObj?.type !== 'wall') return;
    const groupWall = walls.find(w => w.id === selectedObj.id);
    if (!groupWall || groupWall.type !== 'custom_group') return;
    
    const newWalls = groupWall.children.map((child, i) => {
      // Convert local coordinates back to world coordinates based on group's transform
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
        // Note: For full accuracy with rotation, matrix math would be needed, 
        // but this simple addition works perfectly for scaling and translating orthogonal walls.
      };
    });

    setWallsWithHistory(prev => [...prev.filter(w => w.id !== groupWall.id), ...newWalls]);
    setSelectedObj(null);
  };

  const handleDeleteWall = () => {
    if (selectedObj?.type === 'wall') {
      setWallsWithHistory(prev => prev.filter(w => w.id !== selectedObj.id));
      setSelectedObj(null);
    }
  };

  // Keyboard shortcut (Delete / Backspace, Ctrl+Z Undo, Ctrl+S Save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObj?.type === 'wall') {
        setWallsWithHistory(prev => prev.filter(w => w.id !== selectedObj.id));
        setSelectedObj(null);
      }
      // Ctrl+Z → Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+S → Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editMode) saveLayout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObj, editMode, handleUndo, wallsHistory, historyIndex]);

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

  const handlePlaceDevice = async (id, position) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, broker_config: { ...(d.broker_config || {}), position } } : d));
    const device = devices.find(d => d.id === id);
    if (device) await devicesApi.update(id, { ...device, broker_config: { ...(device.broker_config || {}), position } }).catch(console.error);
  };

  const handleRemoveDevice = async () => {
    if (selectedObj?.type !== 'device') return;
    const id = selectedObj.id;
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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
              <button onClick={() => setEditMode(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg bg-amber-500 text-slate-900 hover:bg-amber-400 shadow-amber-500/20">
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
              <button 
                onClick={toggleFullscreen} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/50 shadow-lg backdrop-blur-md transition-all"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              
              {!editMode && (
                <button 
                  onClick={() => setEditMode(true)} 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg bg-amber-500/90 text-slate-900 hover:bg-amber-400 shadow-amber-500/20 backdrop-blur-md"
                >
                  <Edit3 size={16} /> Desain Layout
                </button>
              )}
            </div>
          )}

          {/* Photoshop-style Vertical Toolbar (Dibuat lebih compact agar tidak terpotong di layar kecil) */}
          {editMode && activeTab === 'walls' && (
            <div className={`absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-300 ${leftPanelOpen ? 'left-4' : '-left-12'}`}>
              <button 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-16 bg-slate-800 border-y border-r border-slate-700 rounded-r-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer shadow-lg"
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

              {/* Undo */}
              <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${canUndo ? 'text-violet-400 hover:bg-violet-500/20' : 'text-slate-600 opacity-40 cursor-not-allowed'}`}
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw size={16} />
              </button>

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
          {editMode && activeTab === 'walls' && (
            <div className={`absolute top-20 z-20 transition-all duration-300 ${layersPanelOpen ? 'right-4' : '-right-[13.5rem]'}`}>
              <button 
                onClick={() => setLayersPanelOpen(!layersPanelOpen)}
                className="absolute -left-4 top-4 w-4 h-16 bg-slate-800 border-y border-l border-slate-700 rounded-l-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer shadow-lg"
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
                        selectedObj?.id === w.id ? 'bg-primary-500/20 border border-primary-500/50 shadow-inner' : 'hover:bg-slate-800 border border-transparent'
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
                        className={`hover:text-white transition-colors ${w.hidden ? 'text-slate-600' : 'text-slate-400'}`}
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
                              selectedObj?.id === c.id ? 'bg-primary-500/20 border border-primary-500/50 shadow-inner' : 'hover:bg-slate-800 border border-transparent'
                            } ${c.hidden ? 'opacity-40' : ''}`}
                          >
                            <div className="flex items-center gap-2 cursor-pointer">
                              <Square size={10} className="text-slate-500"/>
                              <span className={`text-[10px] ${selectedObj?.id === c.id ? 'text-white font-bold' : 'text-slate-400'} ${c.hidden ? 'line-through' : ''}`}>
                                {c.name || `Elemen ${cIdx+1}`}
                              </span>
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
                              className={`hover:text-white transition-colors flex-shrink-0 ${c.hidden ? 'text-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
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

          <Canvas shadows camera={{ position: [15, 20, 15], fov: 45 }}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.4} />
            <directionalLight castShadow position={[5, 15, 5]} intensity={0.8} shadow-mapSize={[2048, 2048]} />
            
            <Suspense fallback={null}>
              <RoomLayout 
                devices={devices} 
                editMode={editMode} 
                activeTab={activeTab}
                walls={walls} setWalls={setWalls}
                selectedObj={selectedObj} setSelectedObj={setSelectedObj}
                transformMode={transformMode}
                onPlaceDevice={handlePlaceDevice}
              />
              <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={30} blur={2.5} far={4} color="#000000" />
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
              className={`absolute top-1/2 -translate-y-1/2 z-20 w-4 h-16 bg-slate-800 border-y border-l border-slate-700 rounded-l-md flex items-center justify-center hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer shadow-lg transition-all duration-300 ${rightPanelOpen ? '-left-4' : '-left-8'}`}
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
                      <button onClick={() => setSelectedObj(null)} className="text-slate-500 hover:text-white"><X size={14}/></button>
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
                              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all font-bold text-xs"
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
                                placeholder={wall.type === 'room' || wall.type === 'custom_group' ? 'Nama Grup...' : 'Nama Tembok...'}
                                onChange={e => {
                                  setWalls(prev => prev.map(w => w.id === wall.id ? { ...w, name: e.target.value } : w));
                                }} 
                                className="w-full bg-transparent text-xs text-white outline-none py-1.5" 
                              />
                            </div>
                          </div>

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
                            const newWall = { id: 'wall_' + Date.now(), position: [0, 2, 0], scale: [4, 4, 0.5], rotation: [0, 0, 0] };
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
                            const newWall = { id: 'wall_' + Date.now(), position: [0, 2, 0], scale: [12, 4, 0.5], rotation: [0, 0, 0] };
                            setWalls(prev => [...prev, newWall]);
                            setSelectedObj({ type: 'wall', id: newWall.id });
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all group"
                        >
                          <div className="w-12 h-4 bg-slate-700 group-hover:bg-emerald-400 rounded-sm" />
                          <span className="text-[10px] font-bold text-slate-300">1 Sisi Tembok</span>
                        </button>
                      </div>

                      <p className="font-bold text-slate-200 mt-5 mb-2 text-sm">Tembok Khusus</p>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Tembok Berpintu */}
                        <button 
                          onClick={() => {
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall', position: [0, 2, 0], scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu' };
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
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall_left', position: [0, 2, 0], scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu Kiri' };
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
                            const newWall = { id: 'wall_' + Date.now(), type: 'door_wall_right', position: [0, 2, 0], scale: [8, 4, 0.5], rotation: [0, 0, 0], name: 'Tembok Pintu Kanan' };
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
                      </div>

                      <p className="font-bold text-slate-200 mt-5 mb-2 text-sm">Template Ruangan Penuh</p>
                      <div className="grid grid-cols-1 gap-2">
                        {/* Ruangan Kotak */}
                        <button 
                          onClick={() => {
                            const newRoom = { id: 'room_' + Date.now(), type: 'room', position: [0, 2, 0], scale: [10, 4, 10], rotation: [0, 0, 0] };
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
                              position: [0, 2, 0],
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
                            const newRoom = { id: 'room_' + Date.now(), type: 'room', position: [0, 2, 0], scale: [14, 4, 8], rotation: [0, 0, 0] };
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
            {activeTab === 'devices' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {devices.map(dev => {
                  const isPlaced = !!dev.broker_config?.position;
                  const isSelectedSpawn = selectedObj?.type === 'device_spawn' && selectedObj?.id === dev.id;
                  const isSelectedNode = selectedObj?.type === 'device' && selectedObj?.id === dev.id;
                  
                  return (
                    <div 
                      key={dev.id}
                      onClick={() => setSelectedObj({ type: isPlaced ? 'device' : 'device_spawn', id: dev.id })}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelectedSpawn || isSelectedNode
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-inner' 
                          : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPlaced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            <Cpu size={14} />
                          </div>
                          <div>
                            <p className={`text-xs font-bold truncate w-32 ${isSelectedSpawn || isSelectedNode ? 'text-amber-400' : 'text-slate-200'}`}>{dev.name}</p>
                            <p className="text-[10px] text-slate-500">{isPlaced ? 'Telah Diletakkan' : 'Klik lalu arahkan ke lantai'}</p>
                          </div>
                        </div>
                        
                        {isPlaced && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveDevice(); }}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                            title="Hapus dari peta"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
