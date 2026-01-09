import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { ProcessNode, NodeStatus, NodeType } from '../types';
import { AlertCircle, CheckCircle, Ban, AlertTriangle, ChevronDown, Activity, Box, MoreHorizontal } from 'lucide-react';

interface StationListProps {
  workshop: ProcessNode | undefined;
  selectedStationId: string | null;
  onSelect: (id: string) => void;
}

type PathVariant = 'default' | 'dimmed' | 'bright';

interface PathData {
    d: string;
    type: 'straight' | 'complex';
    variant: PathVariant;
}

export const StationList: React.FC<StationListProps> = ({ workshop, selectedStationId, onSelect }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [paths, setPaths] = useState<PathData[]>([]);
  
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

  // --- Connection Logic ---
  const calculatePaths = () => {
    if (!workshop?.children || !contentRef.current) return;
    
    const newPaths: PathData[] = [];
    const containerRect = contentRef.current.getBoundingClientRect();
    const children = workshop.children.filter(c => c.type === NodeType.ZONE || c.type === NodeType.STATION);

    // 1. Zone-to-Zone Connections (Vertical/Complex)
    for (let i = 0; i < children.length - 1; i++) {
      const currentId = children[i].id;
      const nextId = children[i+1].id;
      
      // Stop connecting if the next item is the Sub-Assembly zone (it should be isolated or handled differently)
      if (nextId === 'zone-sub-assembly') continue;

      const currentEl = itemsRef.current.get(currentId);
      const nextEl = itemsRef.current.get(nextId);

      if (currentEl && nextEl) {
        const currRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        // Connect Bottom Center of Current to Top Center of Next (Vertical Flow)
        if (children[i].type === NodeType.ZONE) {
            let startX = currRect.left + currRect.width / 2 - containerRect.left;
            const startY = currRect.bottom - containerRect.top;
            
            let endX = nextRect.left + nextRect.width / 2 - containerRect.left;
            const endY = nextRect.top - containerRect.top;

             if (Math.abs(startX - endX) < 20) {
                 const avgX = Math.round((startX + endX) / 2);
                 startX = avgX;
                 endX = avgX;
             } else {
                 startX = Math.round(startX);
                 endX = Math.round(endX);
             }
             
             const roundedStartY = Math.round(startY);
             const roundedEndY = Math.round(endY);

             // Draw a nice stepped line
             let path = `M ${startX} ${roundedStartY}`;
             path += ` L ${startX} ${Math.round(roundedStartY + (roundedEndY - roundedStartY) / 2)}`;
             path += ` L ${endX} ${Math.round(roundedStartY + (roundedEndY - roundedStartY) / 2)}`;
             path += ` L ${endX} ${roundedEndY}`;

             // Use 'default' to match other workshops (consistency)
             newPaths.push({ d: path, type: 'complex', variant: 'default' });
        } else {
             // Standard left-to-right flow for simple workshops
             const startX = Math.round(currRect.right - containerRect.left);
             const startY = Math.round(currRect.top + currRect.height / 2 - containerRect.top);
             const endX = Math.round(nextRect.left - containerRect.left);
             const endY = Math.round(nextRect.top + nextRect.height / 2 - containerRect.top);
             
             if (Math.abs(currRect.top - nextRect.top) < 50 && endX > startX) {
                 // Use default (which we will style subtly) for station connections
                 newPaths.push({ d: `M ${startX} ${startY} L ${endX} ${endY}`, type: 'straight', variant: 'default' });
             }
        }
      }
    }

    // 2. Intra-Zone Connections (Horizontal/Straight for adjacent stations)
    // Specifically targeting the main assembly lines to ensure internal flow
    const flowZones = ['zone-front-main', 'zone-chassis-main', 'zone-rear-main', 'zone-battery-main'];
    
    children.forEach(zone => {
        // Skip connection lines for Sub-Assembly Zone as requested
        if (zone.id === 'zone-sub-assembly') return;

        if (zone.type === NodeType.ZONE && zone.children && zone.children.length > 1) {
             const isFlowZone = flowZones.includes(zone.id);

             for (let j = 0; j < zone.children.length - 1; j++) {
                 const c1 = zone.children[j];
                 const c2 = zone.children[j+1];
                 const el1 = itemsRef.current.get(c1.id);
                 const el2 = itemsRef.current.get(c2.id);

                 if (el1 && el2) {
                     const r1 = el1.getBoundingClientRect();
                     const r2 = el2.getBoundingClientRect();

                     // Connect Right of 1 to Left of 2
                     // Check if they are roughly on the same row (within 30px vertical alignment)
                     if (Math.abs(r1.top - r2.top) < 30) {
                        const startX = Math.round(r1.right - containerRect.left);
                        const startY = Math.round(r1.top + r1.height / 2 - containerRect.top);
                        const endX = Math.round(r2.left - containerRect.left);
                        const endY = Math.round(r2.top + r2.height / 2 - containerRect.top);

                        if (endX > startX) {
                            // Use default variant for station connections to get the optical flow
                            newPaths.push({
                                d: `M ${startX} ${startY} L ${endX} ${endY}`,
                                type: 'straight',
                                variant: 'default'
                            });
                        }
                     }
                 }
             }
        }
    });

    setPaths(newPaths);
  };

  useLayoutEffect(() => {
    // Initial calculation
    calculatePaths();
    
    // Safety timeout to ensure DOM is fully painted
    const timer = setTimeout(calculatePaths, 250);

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

  // Helper to render a clickable station card or a group container
  const renderStationCard = (station: ProcessNode, index: number, isSubItem: boolean = false) => {
    // 1. Check if this is a grouping station (contains child Stations)
    const subStations = station.children?.filter(c => c.type === NodeType.STATION);
    const isGroup = subStations && subStations.length > 0;
    
    const colSpan = station.meta?.colSpan || 1;
    const spanClass = colSpan === 2 ? 'col-span-2' : 
                      colSpan === 3 ? 'col-span-3' : 
                      colSpan >= 4 ? 'col-span-4' : 'col-span-1';

    // RENDER GROUP CONTAINER
    if (isGroup) {
         return (
            <div
                key={station.id}
                ref={(el) => {
                     if(el) itemsRef.current.set(station.id, el);
                     else itemsRef.current.delete(station.id);
                }}
                className={`${spanClass} h-[130px] flex flex-col gap-1 p-2 rounded-lg border-2 border-dashed border-industrial-600 bg-industrial-800/20`}
            >
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-0.5 pl-1 h-5 flex-shrink-0">
                    <Box size={12} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider truncate">{station.label}</span>
                </div>
                
                {/* Render Children (Recursively) - Horizontal Layout */}
                <div className="flex flex-row gap-2 flex-1 w-full h-full min-h-0">
                    {subStations!.map((sub, i) => renderStationCard(sub, i, true))}
                </div>
            </div>
         );
    }


    // RENDER STANDARD CARD
    const isSelected = selectedStationId === station.id;
    const isInactive = station.status === NodeStatus.INACTIVE;
    const isPlaceholder = station.meta?.isPlaceholder;

    // Special Rendering for Placeholder/Gap Stations
    if (isPlaceholder) {
        return (
            <div
                key={station.id}
                ref={(el) => {
                     if(el) itemsRef.current.set(station.id, el);
                     else itemsRef.current.delete(station.id);
                }}
                className={`${spanClass} h-[130px] w-full flex flex-col items-center justify-center border-2 border-transparent rounded text-gray-400 select-none px-2`}
            >
                <MoreHorizontal size={24} className="opacity-50 mb-1" />
                <span className="text-xs font-mono font-bold text-center w-full break-words leading-tight opacity-90">{station.label}</span>
            </div>
        );
    }

    let statusColor = 'bg-industrial-600';
    let borderColor = 'border-industrial-700';
    let shadowClass = '';
    
    if (station.status === NodeStatus.NORMAL) {
        statusColor = 'bg-neon-green';
        borderColor = isSelected ? 'border-neon-green' : 'border-industrial-600';
        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(10,255,0,0.3)]' : '';
    } else if (station.status === NodeStatus.WARNING) {
        statusColor = 'bg-neon-yellow';
        borderColor = isSelected ? 'border-neon-yellow' : 'border-industrial-600';
        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(252,238,10,0.3)]' : '';
    } else if (station.status === NodeStatus.CRITICAL) {
        statusColor = 'bg-neon-red';
        borderColor = isSelected ? 'border-neon-red' : 'border-industrial-600';
        shadowClass = isSelected ? 'shadow-[0_0_15px_rgba(255,42,42,0.4)]' : '';
    }

    // Adjust height for nested items to be more compact
    const heightClass = isSubItem ? 'h-full' : 'h-[130px]';
    const labelSizeClass = isSubItem ? 'text-sm font-bold line-clamp-2 leading-tight' : (colSpan > 1 ? 'text-xl' : 'text-lg line-clamp-2');
    const paddingClass = isSubItem ? 'p-2' : 'p-4';

    return (
        <button
            key={station.id}
            ref={(el) => {
                 if(el) itemsRef.current.set(station.id, el);
                 else itemsRef.current.delete(station.id);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(station.id)
            }}
            className={`
                ${isSubItem ? 'flex-1 min-w-0' : spanClass}
                ${heightClass}
                relative flex flex-col justify-between rounded-lg border-2 text-left transition-all duration-200 group
                bg-industrial-800
                ${paddingClass}
                ${isSelected ? `scale-[1.02] -translate-y-1 ${shadowClass} z-20 bg-industrial-700` : 'hover:border-gray-500 hover:bg-industrial-700 hover:-translate-y-0.5'}
                ${isInactive ? 'opacity-50 grayscale bg-industrial-900' : 'cursor-pointer'}
                ${borderColor}
            `}
        >
            {/* Header */}
            <div className={`flex justify-between items-start w-full ${isSubItem ? 'mb-1' : 'mb-2'}`}>
                <span className={`${isSubItem ? 'text-[10px]' : 'text-xs'} font-mono tracking-wider uppercase truncate max-w-[80%] font-semibold ${isSelected ? 'text-neon-blue' : 'text-gray-400'}`}>
                    {station.id.replace('asm-', '').replace('front-','').replace('chassis-', '').replace('rear-', '').replace('door-sub-', '').replace('batt-', '').replace('st-eol-', '').toUpperCase()}
                </span>
                <div className={`${isSubItem ? 'h-2 w-2' : 'h-2.5 w-2.5'} rounded-full ${statusColor} shadow-sm flex-shrink-0`}></div>
            </div>

            {/* Label */}
            <div className="flex-1 flex items-center">
                    <h3 className={`${labelSizeClass} ${isSelected ? 'text-white' : 'text-gray-100'}`}>
                    {station.label}
                    </h3>
            </div>

            {/* Footer/Progress */}
            <div className="w-full h-[4px] bg-industrial-900 rounded-full overflow-hidden mt-auto border border-industrial-700/50">
                <div className={`h-full ${statusColor} w-full opacity-90`}></div>
            </div>
        </button>
    );
  };

  if (!workshop) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 font-mono text-base bg-industrial-900">
        请选择车间
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-900">
      {/* CSS Animation Injection */}
      <style>{`
        @keyframes flowAnimation {
          0% { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .flow-path {
          animation: flowAnimation 2.5s linear infinite;
        }
        .flow-path-bright {
          animation: flowAnimation 1.2s linear infinite;
        }
        .flow-path-dim {
          animation: flowAnimation 5s linear infinite;
        }
      `}</style>

      {/* Header */}
      <div className="p-5 border-b border-industrial-700 bg-industrial-800 z-30 flex items-center justify-between shadow-lg relative h-20 flex-shrink-0">
        <div>
           <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
             <span className="text-neon-blue mr-1">#</span>
             {workshop.label}
           </h2>
        </div>
        <div className="flex gap-4">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-neon-green/10 rounded border border-neon-green/30">
                <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-base font-bold text-neon-green font-mono">{stats.normal} 正常</span>
            </div>
             <div className="flex items-center gap-2 px-4 py-1.5 bg-neon-red/10 rounded border border-neon-red/30">
                <span className="w-2.5 h-2.5 rounded-full bg-neon-red animate-pulse"></span>
                <span className="text-base font-bold text-neon-red font-mono">{stats.critical} 告警</span>
            </div>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-industrial-900 relative" ref={scrollContainerRef}>
        <div className="relative min-h-full pb-20 pt-10 px-10" ref={contentRef}>
            
            {/* Grid Content - Rendered first to be below SVG */}
            <div className="relative z-10 space-y-20">
                {workshop.children && workshop.children[0].type === NodeType.ZONE ? (
                     // Zoned Layout (Assembly & EOL)
                     <div className="flex flex-col gap-20 max-w-7xl mx-auto">
                        {workshop.children.map((zone) => (
                            <div 
                                key={zone.id} 
                                ref={(el) => {
                                    if(el) itemsRef.current.set(zone.id, el);
                                    else itemsRef.current.delete(zone.id);
                                }}
                                className={`
                                    relative bg-industrial-800 border-2 border-industrial-700 rounded-xl p-10 transition-all duration-300
                                    ${zone.id === 'zone-sub-assembly' ? 'mt-12 border-neon-blue/20 bg-industrial-800' : ''}
                                `}
                            >
                                {/* Zone Header */}
                                <div className="absolute -top-6 left-8 bg-industrial-900 border-2 border-industrial-600 px-8 py-2 rounded-full flex items-center gap-3 shadow-lg z-20">
                                    <Box size={20} className="text-neon-blue" />
                                    <span className="text-xl font-bold text-white tracking-wide">{zone.label}</span>
                                    {zone.status === NodeStatus.CRITICAL && <AlertCircle size={20} className="text-neon-red animate-pulse" />}
                                </div>
                                
                                {/* Zone Children Grid */}
                                <div className={`mt-6 gap-6 ${
                                    zone.id === 'zone-front-main' 
                                    ? 'grid grid-cols-6' 
                                    : zone.id === 'zone-chassis-main' 
                                      ? 'grid grid-cols-5' 
                                      : zone.id === 'zone-rear-main'
                                        ? 'grid grid-cols-5' // Narrowed from 7
                                        : zone.id === 'zone-battery-main'
                                          ? 'grid grid-cols-6' // New battery line
                                          : zone.id.startsWith('zone-eol') 
                                            ? 'grid grid-cols-1 max-w-4xl mx-auto' 
                                            : 'grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8' // Default / Sub-assembly
                                }`}>
                                    {zone.children?.map(station => renderStationCard(station, 0, false))}
                                </div>
                            </div>
                        ))}
                     </div>
                ) : (
                    // Default Flat Layout (Stamping, Welding, etc.)
                    <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-8 gap-y-12 auto-rows-[120px]">
                        {workshop.children?.map((station, i) => renderStationCard(station, i, false))}
                    </div>
                )}
            </div>

            {/* SVG Circuit Layer */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible">
                {paths.map((p, i) => {
                    const isDimmed = p.variant === 'dimmed';
                    const isBright = p.variant === 'bright';
                    const baseOpacity = isDimmed ? 0.1 : 0.2; // Reduced from 0.3 for subtler rails
                    const glowOpacity = isDimmed ? 0 : (isBright ? 0.5 : 0.3); 
                    const coreOpacity = isDimmed ? 0.1 : (isBright ? 0.9 : 0.6);
                    const animClass = isDimmed ? 'flow-path-dim' : (isBright ? 'flow-path-bright' : 'flow-path');
                    return (
                        <g key={i}>
                            {/* Background Mask - Thinner */}
                            <path d={p.d} stroke="#0f172a" strokeWidth="8" fill="none" strokeLinecap="round" opacity={1}/>
                            {/* Glow - Softer */}
                            {!isDimmed && <path d={p.d} stroke="#00f0ff" strokeWidth={isBright ? "20" : "12"} strokeOpacity={glowOpacity} fill="none" strokeLinecap="round" style={{ filter: 'blur(8px)' }}/>}
                            {/* Static Rail - Thinner */}
                             <path d={p.d} stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" opacity={baseOpacity}/>
                            {/* Flow Beam */}
                            <path d={p.d} stroke="#00f0ff" strokeWidth={isBright ? "3" : "2"} strokeDasharray={isDimmed ? "5 25" : "10 50"} strokeLinecap="round" fill="none" className={animClass} opacity={coreOpacity}/>
                        </g>
                    );
                })}
            </svg>
        </div>
      </div>
    </div>
  );
};