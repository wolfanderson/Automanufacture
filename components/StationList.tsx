import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { ProcessNode, NodeStatus } from '../types';
import { AlertCircle, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

interface StationListProps {
  workshop: ProcessNode | undefined;
  selectedStationId: string | null;
  onSelect: (id: string) => void;
}

export const StationList: React.FC<StationListProps> = ({ workshop, selectedStationId, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
    if (!workshop?.children || !contentRef.current) return;
    
    const newPaths: { d: string; type: 'straight' | 'complex' }[] = [];
    const containerRect = contentRef.current.getBoundingClientRect();
    const children = workshop.children;

    for (let i = 0; i < children.length - 1; i++) {
      const currentId = children[i].id;
      const nextId = children[i+1].id;
      
      const currentEl = itemsRef.current.get(currentId);
      const nextEl = itemsRef.current.get(nextId);

      if (currentEl && nextEl) {
        const currRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        const startX = currRect.right - containerRect.left;
        const startY = currRect.top + currRect.height / 2 - containerRect.top;
        
        const endX = nextRect.left - containerRect.left;
        const endY = nextRect.top + nextRect.height / 2 - containerRect.top;

        // Skip connection if elements are too far apart vertically (different logical zones)
        if (Math.abs(currRect.top - nextRect.top) > 200) continue;

        const isSameRow = Math.abs(currRect.top - nextRect.top) < 30;

        if (isSameRow) {
           if (endX > startX) {
              newPaths.push({
                d: `M ${startX} ${startY} L ${endX} ${endY}`,
                type: 'straight'
              });
           }
        } else {
          // Compact PCB style routing
          const padding = 12; 
          const midY = (startY + endY) / 2;
          
          let path = `M ${startX} ${startY}`;
          path += ` L ${startX + padding} ${startY}`; 
          path += ` L ${startX + padding} ${midY}`;   
          path += ` L ${endX - padding} ${midY}`;     
          path += ` L ${endX - padding} ${endY}`;     
          path += ` L ${endX} ${endY}`;               
          
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
    const observer = new ResizeObserver(() => {
        window.requestAnimationFrame(calculatePaths);
    });

    if (scrollContainerRef.current) observer.observe(scrollContainerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
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
      <div className="p-2 border-b border-gray-800 bg-industrial-900/95 backdrop-blur z-30 flex items-center justify-between shadow-lg relative h-12 flex-shrink-0">
        <div>
           <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
             <span className="text-neon-blue">L2</span>
             {workshop.label.toUpperCase()}
           </h2>
        </div>
        <div className="flex gap-2">
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neon-green/5 rounded border border-neon-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-xs font-bold text-neon-green font-mono">{stats.normal}</span>
            </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neon-red/5 rounded border border-neon-red/20">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-red animate-pulse"></span>
                <span className="text-xs font-bold text-neon-red font-mono">{stats.critical}</span>
            </div>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-industrial-900/20 relative" ref={scrollContainerRef}>
        <div className="relative min-h-full" ref={contentRef}>
            
            {/* SVG Circuit Layer */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {paths.map((p, i) => (
                    <g key={`${i}-${p.type}`}>
                        <path d={p.d} fill="none" stroke="#1f2937" strokeWidth="2" />
                        <path d={p.d} fill="none" stroke="#00f0ff" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" 
                            strokeOpacity={p.type === 'straight' ? "0.9" : "0.7"}
                            className="animate-flow" filter="url(#glow-strong)" />
                    </g>
                ))}
            </svg>

            {/* Grid Content */}
            <div className="p-6 pb-32 relative z-10">
                {/* Switch from auto-fill to fixed column grid to support col-span */}
                <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-6 gap-y-10 auto-rows-[90px]">
                {workshop.children?.map((station, index) => {
                    const isSelected = selectedStationId === station.id;
                    const isInactive = station.status === NodeStatus.INACTIVE;
                    const colSpan = station.meta?.colSpan || 1;
                    
                    let statusColor = 'bg-gray-700';
                    let borderColor = 'border-gray-800';
                    let shadowClass = '';
                    
                    if (station.status === NodeStatus.NORMAL) {
                        statusColor = 'bg-neon-green';
                        borderColor = isSelected ? 'border-neon-green' : 'border-gray-700';
                        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(10,255,0,0.3)]' : '';
                    } else if (station.status === NodeStatus.WARNING) {
                        statusColor = 'bg-neon-yellow';
                        borderColor = isSelected ? 'border-neon-yellow' : 'border-gray-700';
                        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(252,238,10,0.3)]' : '';
                    } else if (station.status === NodeStatus.CRITICAL) {
                        statusColor = 'bg-neon-red';
                        borderColor = isSelected ? 'border-neon-red' : 'border-gray-700';
                        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(255,42,42,0.4)]' : '';
                    }

                    // Dynamic col-span classes
                    const spanClass = colSpan === 2 ? 'col-span-2' : 
                                      colSpan === 3 ? 'col-span-3' : 
                                      colSpan >= 4 ? 'col-span-4' : 'col-span-1';

                    return (
                        <button
                            key={station.id}
                            ref={el => {
                                if (el) itemsRef.current.set(station.id, el);
                                else itemsRef.current.delete(station.id);
                            }}
                            onClick={() => !isInactive && onSelect(station.id)}
                            className={`
                                ${spanClass}
                                relative flex flex-col justify-between h-full p-3 rounded border text-left transition-all duration-200 group
                                bg-industrial-800/80 backdrop-blur-sm
                                ${isSelected ? `scale-[1.02] -translate-y-1 ${shadowClass} z-20 bg-gray-800` : 'hover:border-gray-600 hover:bg-industrial-800 hover:-translate-y-0.5'}
                                ${isInactive ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                ${borderColor}
                            `}
                        >
                            {/* Connector Nodes (Hidden for full-width lines to look cleaner, or adjusted) */}
                            <div className={`absolute top-1/2 -left-[5px] w-[8px] h-[8px] rounded-full bg-industrial-900 border ${isSelected ? 'border-neon-blue' : 'border-gray-600'} flex items-center justify-center z-30`}>
                                <div className="w-0.5 h-0.5 rounded-full bg-gray-500"></div>
                            </div>
                            <div className={`absolute top-1/2 -right-[5px] w-[8px] h-[8px] rounded-full bg-industrial-900 border ${isSelected ? 'border-neon-blue' : 'border-gray-600'} flex items-center justify-center z-30`}>
                                <div className={`w-0.5 h-0.5 rounded-full ${index < (workshop.children?.length || 0) - 1 ? 'bg-neon-blue' : 'bg-gray-500'}`}></div>
                            </div>

                            {/* Header */}
                            <div className="flex justify-between items-start w-full mb-1">
                                <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase truncate max-w-[80%]">
                                    {station.id.replace('asm-', '').toUpperCase()}
                                </span>
                                <div className={`h-2 w-2 rounded-full ${statusColor} shadow-sm flex-shrink-0`}></div>
                            </div>

                            {/* Label */}
                            <div className="flex-1 flex items-center">
                                 <h3 className={`font-bold leading-tight ${colSpan > 1 ? 'text-lg' : 'text-xs line-clamp-2'} ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                    {station.label}
                                 </h3>
                            </div>

                            {/* Footer/Progress */}
                            <div className="w-full h-[3px] bg-gray-700/50 rounded-full overflow-hidden mt-auto">
                                <div className={`h-full ${statusColor} w-full opacity-70`}></div>
                            </div>
                            
                            {/* Station Count for large blocks */}
                            {colSpan > 1 && (
                                <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 font-mono hidden lg:block">
                                    {station.children?.length || 0} STATIONS
                                </div>
                            )}
                        </button>
                    );
                })}
                </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes flow {
            from { stroke-dashoffset: 8; }
            to { stroke-dashoffset: 0; }
        }
        .animate-flow {
            animation: flow 0.4s linear infinite;
        }
      `}</style>
    </div>
  );
};