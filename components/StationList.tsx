import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { ProcessNode, NodeStatus, NodeType } from '../types';
import { AlertCircle, CheckCircle, Ban, AlertTriangle, ChevronDown, Activity, Box } from 'lucide-react';

interface StationListProps {
  workshop: ProcessNode | undefined;
  selectedStationId: string | null;
  onSelect: (id: string) => void;
}

export const StationList: React.FC<StationListProps> = ({ workshop, selectedStationId, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [paths, setPaths] = useState<{ d: string; type: 'straight' | 'complex' }[]>([]);
  
  // Calculate global stats for the header
  const stats = useMemo(() => {
    if (!workshop?.children) return { total: 0, normal: 0, warning: 0, critical: 0, inactive: 0 };
    
    // Recursive counter since we now have nested Zones
    const countNodes = (nodes: ProcessNode[]): any => {
        let lStats = { total: 0, normal: 0, warning: 0, critical: 0, inactive: 0 };
        nodes.forEach(node => {
            if (node.type === NodeType.STATION) {
                lStats.total++;
                if (node.status === NodeStatus.NORMAL) lStats.normal++;
                if (node.status === NodeStatus.WARNING) lStats.warning++;
                if (node.status === NodeStatus.CRITICAL) lStats.critical++;
                if (node.status === NodeStatus.INACTIVE) lStats.inactive++;
            }
            if (node.children) {
                const childStats = countNodes(node.children);
                lStats.total += childStats.total;
                lStats.normal += childStats.normal;
                lStats.warning += childStats.warning;
                lStats.critical += childStats.critical;
                lStats.inactive += childStats.inactive;
            }
        });
        return lStats;
    }
    return countNodes(workshop.children);
  }, [workshop]);

  // --- Connection Logic (Zone to Zone) ---
  const calculatePaths = () => {
    if (!workshop?.children || !contentRef.current) return;
    
    const newPaths: { d: string; type: 'straight' | 'complex' }[] = [];
    const containerRect = contentRef.current.getBoundingClientRect();
    const children = workshop.children.filter(c => c.type === NodeType.ZONE || c.type === NodeType.STATION);

    for (let i = 0; i < children.length - 1; i++) {
      const currentId = children[i].id;
      const nextId = children[i+1].id;
      
      // Stop connecting if the next item is the Sub-Assembly zone (it should be isolated)
      if (nextId === 'zone-sub-assembly') continue;

      const currentEl = itemsRef.current.get(currentId);
      const nextEl = itemsRef.current.get(nextId);

      if (currentEl && nextEl) {
        const currRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        // Connect Bottom Center of Current to Top Center of Next (Vertical Flow)
        if (children[i].type === NodeType.ZONE) {
            const startX = currRect.left + currRect.width / 2 - containerRect.left;
            const startY = currRect.bottom - containerRect.top;
            
            const endX = nextRect.left + nextRect.width / 2 - containerRect.left;
            const endY = nextRect.top - containerRect.top;

             // Draw a nice stepped line
             let path = `M ${startX} ${startY}`;
             path += ` L ${startX} ${startY + (endY - startY) / 2}`;
             path += ` L ${endX} ${startY + (endY - startY) / 2}`;
             path += ` L ${endX} ${endY}`;

             newPaths.push({ d: path, type: 'complex' });
        } else {
             // Standard left-to-right flow for simple workshops
             const startX = currRect.right - containerRect.left;
             const startY = currRect.top + currRect.height / 2 - containerRect.top;
             const endX = nextRect.left - containerRect.left;
             const endY = nextRect.top + nextRect.height / 2 - containerRect.top;
             
             // Only draw if on same row (approx) and moving left-to-right
             if (Math.abs(currRect.top - nextRect.top) < 50 && endX > startX) {
                 newPaths.push({ d: `M ${startX} ${startY} L ${endX} ${endY}`, type: 'straight' });
             }
        }
      }
    }
    setPaths(newPaths);
  };

  useLayoutEffect(() => {
    // Initial calculation
    calculatePaths();
    
    // Safety timeout to ensure DOM is fully painted
    const timer = setTimeout(calculatePaths, 100);

    const observer = new ResizeObserver(() => {
        window.requestAnimationFrame(calculatePaths);
    });
    
    if (scrollContainerRef.current) observer.observe(scrollContainerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    
    return () => {
        observer.disconnect();
        clearTimeout(timer);
    };
  }, [workshop]);

  // Helper to render a clickable station card
  const renderStationCard = (station: ProcessNode, index: number, isSubItem: boolean = false) => {
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

    // Grid classes
    const spanClass = colSpan === 2 ? 'col-span-2' : 
                      colSpan === 3 ? 'col-span-3' : 
                      colSpan >= 4 ? 'col-span-4' : 'col-span-1';

    return (
        <button
            key={station.id}
            ref={!isSubItem ? (el) => {
                 if(el) itemsRef.current.set(station.id, el);
                 else itemsRef.current.delete(station.id);
            } : undefined}
            onClick={(e) => {
                e.stopPropagation();
                !isInactive && onSelect(station.id)
            }}
            className={`
                ${isSubItem ? spanClass : spanClass}
                relative flex flex-col justify-between p-3 rounded border text-left transition-all duration-200 group
                ${isSubItem ? 'h-[80px] bg-industrial-700/50' : 'h-[90px] bg-industrial-800/80 backdrop-blur-sm'}
                ${isSelected ? `scale-[1.02] -translate-y-1 ${shadowClass} z-20 bg-gray-700` : 'hover:border-gray-500 hover:bg-industrial-700 hover:-translate-y-0.5'}
                ${isInactive ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                ${borderColor}
            `}
        >
            {/* Header */}
            <div className="flex justify-between items-start w-full mb-1">
                <span className="text-[9px] font-mono text-gray-500 tracking-wider uppercase truncate max-w-[80%]">
                    {station.id.replace('asm-', '').toUpperCase()}
                </span>
                <div className={`h-2 w-2 rounded-full ${statusColor} shadow-sm flex-shrink-0`}></div>
            </div>

            {/* Label */}
            <div className="flex-1 flex items-center">
                    <h3 className={`font-bold leading-tight ${colSpan > 1 ? 'text-sm' : 'text-xs line-clamp-2'} ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {station.label}
                    </h3>
            </div>

            {/* Footer/Progress */}
            <div className="w-full h-[3px] bg-gray-700/50 rounded-full overflow-hidden mt-auto">
                <div className={`h-full ${statusColor} w-full opacity-70`}></div>
            </div>
        </button>
    );
  };

  if (!workshop) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 font-mono text-sm bg-industrial-900/50">
        请选择车间
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-900/30">
      {/* CSS Animation Injection */}
      <style>{`
        @keyframes dash-flow {
          0% {
            stroke-dashoffset: 24;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .animate-dash-flow {
          animation: dash-flow 0.5s linear infinite;
        }
      `}</style>

      {/* Header */}
      <div className="p-2 border-b border-gray-800 bg-industrial-900/95 backdrop-blur z-30 flex items-center justify-between shadow-lg relative h-12 flex-shrink-0">
        <div>
           <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
             <span className="text-neon-blue">L2</span>
             {workshop.label}
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
        <div className="relative min-h-full pb-20 pt-8 px-6" ref={contentRef}>
            
            {/* SVG Circuit Layer with CSS Animation */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
                <defs>
                    <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {paths.map((p, i) => (
                    <g key={`${i}-${p.type}`}>
                         {/* 1. Background Rail (Darker, Thicker to be visible on dark bg) */}
                        <path 
                            d={p.d} 
                            fill="none" 
                            stroke="#111827" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                        />
                         <path 
                            d={p.d} 
                            fill="none" 
                            stroke="#1f2937" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                        />
                        
                        {/* 2. Marching Dashes (The Ants) - Using CSS Animation Class */}
                        <path
                            d={p.d}
                            fill="none"
                            stroke="#00f0ff"
                            strokeWidth="3"
                            strokeDasharray="12 12" 
                            strokeLinecap="round"
                            className="animate-dash-flow"
                            filter="url(#line-glow)"
                            opacity="1"
                        />
                    </g>
                ))}
            </svg>

            {/* Grid Content */}
            <div className="relative z-10 space-y-16">
                {/* 
                   Special Render Logic:
                   If the node is a ZONE, render it as a full-width Section.
                   If the node is a STATION, render it as part of a default grid (fallback for non-zoned workshops).
                */}
                {workshop.children && workshop.children[0].type === NodeType.ZONE ? (
                     // Zoned Layout (Assembly)
                     <div className="flex flex-col gap-16 max-w-7xl mx-auto">
                        {workshop.children.map((zone) => (
                            <div 
                                key={zone.id} 
                                ref={(el) => {
                                    if(el) itemsRef.current.set(zone.id, el);
                                    else itemsRef.current.delete(zone.id);
                                }}
                                className={`
                                    relative bg-industrial-800/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm transition-all duration-300
                                    ${zone.id === 'zone-sub-assembly' ? 'mt-12 border-neon-blue/10 bg-industrial-900/60' : ''}
                                `}
                            >
                                {/* Zone Header */}
                                <div className="absolute -top-4 left-6 bg-industrial-900 border border-neon-blue/30 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                                    <Box size={14} className="text-neon-blue" />
                                    <span className="text-sm font-bold text-gray-100 tracking-wide">{zone.label}</span>
                                    {zone.status === NodeStatus.CRITICAL && <AlertCircle size={14} className="text-neon-red animate-pulse" />}
                                </div>
                                
                                {/* Zone Children Grid */}
                                <div className="mt-4 grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {zone.children?.map(station => renderStationCard(station, 0, true))}
                                </div>

                                {/* Decorative Corner Markers */}
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon-blue/50 rounded-tl"></div>
                                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neon-blue/50 rounded-tr"></div>
                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neon-blue/50 rounded-bl"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon-blue/50 rounded-br"></div>
                            </div>
                        ))}
                     </div>
                ) : (
                    // Default Flat Layout (Stamping, Welding, etc.)
                    <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-6 gap-y-10 auto-rows-[90px]">
                        {workshop.children?.map((station, i) => renderStationCard(station, i, false))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};