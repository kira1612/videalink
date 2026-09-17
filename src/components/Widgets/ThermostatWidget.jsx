import React, { useState } from 'react';
import { Zap, Plus, Minus, Power } from 'lucide-react';

export default function ThermostatWidget({
  title = "Living Room Temperature",
  min = 5,
  max = 40,
  initialValue = 25,
  unit = "°C",
  subLabel = "Celcius"
}) {
  const [value, setValue] = useState(initialValue);
  const [isOn, setIsOn] = useState(true);

  // Math for SVG Dial
  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  // Calculate percentage (0 to 1)
  const percentage = (value - min) / (max - min);
  const strokeDashoffset = circumference - percentage * circumference;

  // Generate tick marks
  const numTicks = 40;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    const angle = (i / numTicks) * Math.PI * 2 - Math.PI / 2; // start from top
    // Only show ticks for the top 3/4 of the circle, or full circle?
    // Let's do a full circle of ticks, but make them subtle
    const x1 = 100 + Math.cos(angle) * (radius + 15);
    const y1 = 100 + Math.sin(angle) * (radius + 15);
    const x2 = 100 + Math.cos(angle) * (radius + 20);
    const y2 = 100 + Math.sin(angle) * (radius + 20);
    
    // Highlight ticks up to the current value
    const isPast = (i / numTicks) <= percentage;
    
    ticks.push(
      <line
        key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isPast ? 'rgb(var(--primary-400))' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        className={isPast ? '' : 'text-slate-300 dark:text-slate-700'}
        opacity={isPast ? 1 : 0.5}
      />
    );
  }

  const handleDecrease = () => {
    if (isOn && value > min) setValue(v => v - 1);
  };

  const handleIncrease = () => {
    if (isOn && value < max) setValue(v => v + 1);
  };

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto relative overflow-hidden transition-all duration-300">
      
      {/* Background glow when ON */}
      {isOn && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500" 
          style={{ background: 'radial-gradient(circle at center, rgb(var(--primary-500)) 0%, transparent 70%)' }} 
        />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: isOn ? 'rgb(var(--primary-500)/0.15)' : 'rgba(100,116,139,0.1)' }}>
            <Zap size={14} style={{ color: isOn ? 'rgb(var(--primary-500))' : '#64748b' }} />
          </div>
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">{isOn ? 'ON' : 'OFF'}</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={isOn} onChange={() => setIsOn(!isOn)} />
            <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
                 style={isOn ? { backgroundColor: 'rgb(var(--primary-500))' } : {}}></div>
          </label>
        </div>
      </div>

      {/* DIAL AREA */}
      <div className="flex justify-between items-center relative z-10">
        
        {/* Minus Button */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleDecrease}
            disabled={!isOn || value <= min}
            className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
          >
            <Minus size={20} />
          </button>
          <span className="text-xs font-bold text-slate-500">{min}{unit}</span>
        </div>

        {/* Center Dial */}
        <div className="relative w-[200px] h-[200px] flex items-center justify-center">
          <svg height="200" width="200" className="absolute inset-0 transform -rotate-90">
            {/* Ticks */}
            {ticks}
            
            {/* Track arc */}
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="text-slate-200 dark:text-slate-800"
              r={normalizedRadius}
              cx="100"
              cy="100"
            />
            
            {/* Progress arc */}
            <circle
              stroke="rgb(var(--primary-500))"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference + ' ' + circumference}
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out', opacity: isOn ? 1 : 0.2 }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="100"
              cy="100"
            />
            
            {/* Knob / Indicator dot */}
            {isOn && (
              <circle
                cx={100 + Math.cos((percentage * Math.PI * 2) - Math.PI / 2) * normalizedRadius}
                cy={100 + Math.sin((percentage * Math.PI * 2) - Math.PI / 2) * normalizedRadius}
                r="6"
                fill="white"
                stroke="rgb(var(--primary-500))"
                strokeWidth="2"
                style={{ transition: 'all 0.5s ease-in-out' }}
              />
            )}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full m-8 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 z-10"
               style={isOn ? { boxShadow: '0 4px 20px rgb(var(--primary-500)/0.15)' } : {}}>
            <p className={`text-4xl font-black tracking-tighter ${isOn ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'} transition-colors`}>
              {value}<span className="text-xl font-bold">{unit}</span>
            </p>
            <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${isOn ? 'text-slate-400' : 'text-slate-500/50'}`}>
              {subLabel}
            </p>
          </div>
        </div>

        {/* Plus Button */}
        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={handleIncrease}
            disabled={!isOn || value >= max}
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
            style={isOn ? { background: 'linear-gradient(135deg, rgb(var(--primary-400)), rgb(var(--primary-600)))', boxShadow: '0 4px 14px rgb(var(--primary-500)/0.4)' } : { background: 'var(--surface-300)' }}
          >
            <Plus size={20} />
          </button>
          <span className="text-xs font-bold text-slate-500">{max}{unit}</span>
        </div>
      </div>
      
    </div>
  );
}
