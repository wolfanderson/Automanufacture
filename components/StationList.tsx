import React, { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { ProcessNode, NodeStatus } from '../types';
import { Box, AlertCircle, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

interface StationListProps {
  workshop: ProcessNode | undefined;
  selectedStationId: string | null;
  onSelect: (id: string) => void;
}

export const StationList: React.FC<StationListProps> = ({ workshop, selectedStationId, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [paths, setPaths] = useState<{ d: string; type: 'straight' | 'complex' }[]>([]);
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!workshop?.children) return { total: 0, normal: 0, warning: 0, critical: 0, inactive: 0 };
    return workshop.children.reduce((acc, curr) => {
      acc.total++;
      if (curr.status === NodeStatus.NORMAL) acc.normal++;
      if (curr.status === NodeStatus.WARNING) acc.warning++;
      if (curr.status === NodeStatus.CRITICAL) acc.critical++;
      if (curr.status === NodeStatus.INACTIVE) acc.inactive++;
      return acc;
    }, { total: 0, normal: 0, warning: 0, critical: 0, inactive: 0 });
  }, [workshop]);

  // --- Advanced Circuit Connection Logic ---
  const calculatePaths = () => {
    if (!workshop?.children || !containerRef.current) return;
    
    const newPaths: { d: string; type: 'straight' | 'complex' }[] = [];
    const containerRect = containerRef.current.getBoundingClientRect();
    const children = workshop.children;

    for (let i = 0; i < children.length - 1; i++) {
      const currentId = children[i].id;
      const nextId = children[i+1].id;
      
      const currentEl = itemsRef.current.get(currentId);
      const nextEl = itemsRef.current.get(nextId);

      if (currentEl && nextEl) {
        const currRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        // Coordinates relative to container
        // Start from Right Edge Center (Account for the small output node protrusion)
        const startX = currRect.right - containerRect.left;
        const startY = currRect.top + currRect.height / 2 - containerRect.top;
        
        // End at Left Edge Center
        const endX = nextRect.left - containerRect.left;
        const endY = nextRect.top + nextRect.height / 2 - containerRect.top;

        const isSameRow = Math.abs(currRect.top - nextRect.top) < 30;

        if (isSameRow) {
          // STRAIGHT CONNECTION
          newPaths.push({
            d: `M ${startX} ${startY} L ${endX} ${endY}`,
            type: 'straight'
          });
        } else {
          // ORTHOGONAL WRAP (PCB Style)
          // Tighter padding for denser layout
          const padding = 12; 
          const midY = (startY + endY) / 2;
          
          let path = `M ${startX} ${startY}`;
          path += ` L ${startX + padding} ${startY}`; // Out Right
          path += ` L ${startX + padding} ${midY}`;   // Down Half
          path += ` L ${endX - padding} ${midY}`;     // Cross Left
          path += ` L ${endX - padding} ${endY}`;     // Down Rest
          path += ` L ${endX} ${endY}`;               // In Right
          
          newPaths.push({
            d: path,
            type: 'complex'
          });
        }
      }
    }
    setPaths(newPaths);
  };

  useLayoutEffect(() => {
    calculatePaths();
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(calculatePaths);
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [workshop, stats]);

  if (!workshop) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm bg-industrial-900/50">
        SELECT A WORKSHOP
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-900/30">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 bg-industrial-900/90 backdrop-blur z-30 flex items-center justify-between shadow-lg relative">
        <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
             <span className="text-neon-blue">L2</span>
             {workshop.label.toUpperCase()}
           </h2>
           <p className="text-[10px] text-gray-500 font-mono">PROCESS FLOW VISUALIZATION</p>
        </div>
        <div className="flex gap-2">
             <div className="flex flex-col items-center px-2 py-0.5 bg-neon-green/10 rounded border border-neon-green/30 min-w-[60px]">
                <span className="text-[9px] text-neon-green font-mono uppercase">Norm</span>
                <span className="text-sm font-bold text-neon-green leading-none">{stats.normal}</span>
            </div>
             <div className="flex flex-col items-center px-2 py-0.5 bg-neon-red/10 rounded border border-neon-red/30 min-w-[60px]">
                <span className="text-[9px] text-neon-red font-mono uppercase">Crit</span>
                <span className="text-sm font-bold text-neon-red leading-none">{stats.critical}</span>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
        
        {/* SVG Circuit Layer */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
                <filter id="glow-line" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            
            {paths.map((p, i) => (
                <g key={i}>
                    {/* 1. Base Dark Trace */}
                    <path 
                        d={p.d} 
                        fill="none" 
                        stroke="#1f2937" 
                        strokeWidth="3" 
                        strokeLinecap="square"
                        strokeLinejoin="round"
                    />
                    
                    {/* 2. Flow Animation (Marching Dashes) */}
                    <path 
                        d={p.d} 
                        fill="none" 
                        stroke="#00f0ff" 
                        strokeWidth="1.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="4 4" 
                        strokeOpacity="0.8"
                        className="animate-flow"
                        filter="url(#glow-line)"
                    />
                </g>
            ))}
        </svg>

        {/* Grid Content - COMPACT LAYOUT */}
        <div className="p-8 pb-32">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-10 gap-y-12">
            {workshop.children?.map((station, index) => {
                const isSelected = selectedStationId === station.id;
                const isInactive = station.status === NodeStatus.INACTIVE;
                
                // Determine styling
                let statusColor = 'bg-gray-700';
                let borderColor = 'border-gray-700';
                let shadowClass = '';
                let icon = <Ban size={12} />;
                
                if (station.status === NodeStatus.NORMAL) {
                    statusColor = 'bg-neon-green';
                    borderColor = isSelected ? 'border-neon-green' : 'border-gray-700';
                    shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(10,255,0,0.4)]' : '';
                    icon = <CheckCircle size={12} className="text-black" />;
                } else if (station.status === NodeStatus.WARNING) {
                    statusColor = 'bg-neon-yellow';
                    borderColor = isSelected ? 'border-neon-yellow' : 'border-gray-700';
                    shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(252,238,10,0.4)]' : '';
                    icon = <AlertCircle size={12} className="text-black" />;
                } else if (station.status === NodeStatus.CRITICAL) {
                    statusColor = 'bg-neon-red';
                    borderColor = isSelected ? 'border-neon-red' : 'border-gray-700';
                    shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(255,42,42,0.5)]' : '';
                    icon = <AlertTriangle size={12} className="text-black" />;
                }

                return (
                    <button
                        key={station.id}
                        ref={el => {
                            if (el) itemsRef.current.set(station.id, el);
                            else itemsRef.current.delete(station.id);
                        }}
                        onClick={() => !isInactive && onSelect(station.id)}
                        className={`
                            relative flex flex-col justify-between h-24 p-3 rounded-lg border text-left transition-all duration-300 group z-10
                            bg-industrial-800/95 backdrop-blur-md
                            ${isSelected ? `scale-110 -translate-y-1 ${shadowClass} z-20` : 'hover:border-gray-500 hover:shadow-lg hover:-translate-y-1'}
                            ${isInactive ? 'opacity-40 grayscale cursor-not-allowed' : ''}
                            ${borderColor}
                        `}
                    >
                        {/* INPUT PORT (Left) */}
                        <div className={`absolute top-1/2 -left-[6px] w-[10px] h-[10px] rounded-full bg-industrial-900 border ${isSelected ? 'border-neon-blue' : 'border-gray-600'} flex items-center justify-center z-30`}>
                            <div className="w-1 h-1 rounded-full bg-gray-500"></div>
                        </div>

                        {/* OUTPUT PORT (Right) */}
                        <div className={`absolute top-1/2 -right-[6px] w-[10px] h-[10px] rounded-full bg-industrial-900 border ${isSelected ? 'border-neon-blue' : 'border-gray-600'} flex items-center justify-center z-30`}>
                             <div className={`w-1 h-1 rounded-full ${index < (workshop.children?.length || 0) - 1 ? 'bg-neon-blue' : 'bg-gray-500'}`}></div>
                        </div>

                        {/* Top Row: ID & Icon */}
                        <div className="flex justify-between items-start w-full mb-1">
                            <span className="text-[9px] font-mono text-gray-500 tracking-widest uppercase">
                                {station.id.split('-').pop()}
                            </span>
                            <div className={`h-4 w-4 rounded flex items-center justify-center ${statusColor}`}>
                                {icon}
                            </div>
                        </div>

                        {/* Middle: Label */}
                        <div className="flex-1 flex items-center">
                             <h3 className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                {station.label}
                             </h3>
                        </div>

                        {/* Bottom: Progress Bar style status */}
                        <div className="w-full h-0.5 bg-gray-700/50 rounded-full overflow-hidden mt-2">
                            <div className={`h-full ${statusColor} w-full opacity-80`}></div>
                        </div>
                    </button>
                );
            })}
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes flow {
            to { stroke-dashoffset: -16; }
        }
        .animate-flow {
            animation: flow 1s linear infinite;
        }
      `}</style>
    </div>
  );
};