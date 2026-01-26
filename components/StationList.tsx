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
  
  const isEol = workshop?.id === 'ws-eol';
  const isAssembly = workshop?.id === 'ws-assembly';
  const isCompactView = isEol || isAssembly;

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
      
      // Stop connecting if the current item is the Sub-Assembly zone (it's at the top now, don't connect down)
      if (currentId === 'zone-sub-assembly') continue;

      const currentEl = itemsRef.current.get(currentId);
      const nextEl = itemsRef.current.get(nextId);

      if (currentEl && nextEl) {
        const currRect = currentEl.getBoundingClientRect();
        const nextRect = nextEl.getBoundingClientRect();

        // LOGIC FOR EOL/ASSEMBLY GRID CONNECTIONS
        if (isCompactView) {
             // For vertical stacking in compact view (Assembly), draw simple center-to-center lines
             if (isAssembly) {
                 const centerX = Math.round(currRect.left + currRect.width / 2 - containerRect.left);
                 const bottomY = Math.round(currRect.bottom - containerRect.top);
                 const topY = Math.round(nextRect.top - containerRect.top);
                 
                 // If stacked vertically
                 if (Math.abs(currRect.left - nextRect.left) < 50 && topY > bottomY) {
                      newPaths.push({ 
                          d: `M ${centerX} ${bottomY} L ${centerX} ${topY}`, 
                          type: 'straight', 
                          variant: 'default' 
                      });
                 }
             } 
             // Logic for EOL grid flow
             else {
                 const centerX_Curr = Math.round(currRect.left + currRect.width / 2 - containerRect.left);
                 const centerY_Curr = Math.round(currRect.top + currRect.height / 2 - containerRect.top);
                 
                 const centerX_Next = Math.round(nextRect.left + nextRect.width / 2 - containerRect.left);
                 const centerY_Next = Math.round(nextRect.top + nextRect.height / 2 - containerRect.top);

                 const isNextBelow = nextRect.top > currRect.bottom - 20; // Tolerance for next row
                 const isNextRight = nextRect.left > currRect.right - 20; // Tolerance for same row

                 if (isNextBelow) {
                     // Smart Alignment: If items overlap horizontally, drop straight down from the matching X
                     // This fixes the dogleg between CP7 (wide) and Test Line (narrower, below left)
                     const minX = Math.round(currRect.left - containerRect.left);
                     const maxX = Math.round(currRect.right - containerRect.left);
                     
                     let startX = centerX_Curr;
                     
                     // If destination center is within source bounds, align start X to destination center
                     if (centerX_Next >= minX && centerX_Next <= maxX) {
                        startX = centerX_Next;
                     }

                     const startY = Math.round(currRect.bottom - containerRect.top);
                     const endX = centerX_Next;
                     const endY = Math.round(nextRect.top - containerRect.top);
                     
                     const midY = (startY + endY) / 2;
                     const path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
                     
                     newPaths.push({ d: path, type: 'complex', variant: 'default' });
                 } else if (isNextRight) {
                     // Connect Right of Curr to Left of Next (Straight Path)
                     const startX = Math.round(currRect.right - containerRect.left);
                     const startY = centerY_Curr;
                     const endX = Math.round(nextRect.left - containerRect.left);
                     const endY = centerY_Next;
                     
                     newPaths.push({ d: `M ${startX} ${startY} L ${endX} ${endY}`, type: 'straight', variant: 'default' });
                 }
             }
        } 
        // LOGIC FOR STANDARD VERTICAL ZONES (Stamping/Welding/Painting if they used Zones)
        else if (children[i].type === NodeType.ZONE) {
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

             let path = `M ${startX} ${roundedStartY}`;
             path += ` L ${startX} ${Math.round(roundedStartY + (roundedEndY - roundedStartY) / 2)}`;
             path += ` L ${endX} ${Math.round(roundedStartY + (roundedEndY - roundedStartY) / 2)}`;
             path += ` L ${endX} ${roundedEndY}`;

             newPaths.push({ d: path, type: 'complex', variant: 'default' });
        } else {
             // Standard left-to-right flow for simple workshops
             const startX = Math.round(currRect.right - containerRect.left);
             const startY = Math.round(currRect.top + currRect.height / 2 - containerRect.top);
             const endX = Math.round(nextRect.left - containerRect.left);
             const endY = Math.round(nextRect.top + nextRect.height / 2 - containerRect.top);
             
             if (Math.abs(currRect.top - nextRect.top) < 50 && endX > startX) {
                 newPaths.push({ d: `M ${startX} ${startY} L ${endX} ${endY}`, type: 'straight', variant: 'default' });
             }
        }
      }
    }

    // 2. Intra-Zone Connections
    const flowZones = ['zone-front-main', 'zone-chassis-main', 'zone-rear-main', 'zone-battery-main'];
    
    children.forEach(zone => {
        if (zone.id === 'zone-sub-assembly') return;

        // EOL and Assembly zones behave like flow zones for internal items
        const isFlowZone = flowZones.includes(zone.id) || zone.id.startsWith('zone-eol');

        if (zone.type === NodeType.ZONE && zone.children && zone.children.length > 1 && isFlowZone) {
             
             for (let j = 0; j < zone.children.length - 1; j++) {
                 const c1 = zone.children[j];
                 const c2 = zone.children[j+1];
                 const el1 = itemsRef.current.get(c1.id);
                 const el2 = itemsRef.current.get(c2.id);

                 if (el1 && el2) {
                     const r1 = el1.getBoundingClientRect();
                     const r2 = el2.getBoundingClientRect();

                     // Connect Right of 1 to Left of 2
                     if (Math.abs(r1.top - r2.top) < 40) { // Tolerance
                        const startX = Math.round(r1.right - containerRect.left);
                        const startY = Math.round(r1.top + r1.height / 2 - containerRect.top);
                        const endX = Math.round(r2.left - containerRect.left);
                        const endY = Math.round(r2.top + r2.height / 2 - containerRect.top);

                        if (endX > startX) {
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
    calculatePaths();
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
  const renderStationCard = (station: ProcessNode, index: number, isSubItem: boolean = false, compactMode: boolean = false) => {
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
                className={`${spanClass} ${compactMode ? (isEol ? 'h-[90px]' : 'h-[110px]') : 'h-[130px]'} flex flex-col gap-1 p-2 rounded-lg border-2 border-dashed border-industrial-600 bg-industrial-800/20`}
            >
                <div className="flex items-center gap-2 mb-0.5 pl-1 h-5 flex-shrink-0">
                    <Box size={14} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider truncate">{station.label}</span>
                </div>
                <div className="flex flex-row gap-2 flex-1 w-full h-full min-h-0">
                    {subStations!.map((sub, i) => renderStationCard(sub, i, true, compactMode))}
                </div>
            </div>
         );
    }

    // RENDER STANDARD CARD
    const isSelected = selectedStationId === station.id;
    const isInactive = station.status === NodeStatus.INACTIVE;
    const isPlaceholder = station.meta?.isPlaceholder;

    // Compact Mode Adjustments for EOL/Assembly View
    // EOL cards are shorter (h-[64px]) to allow for larger vertical gaps
    const cardHeight = compactMode ? (isEol ? 'h-[64px]' : 'h-[80px]') : 'h-[130px]';
    const cardPadding = compactMode ? 'p-2' : (isSubItem ? 'p-2' : 'p-4');
    const headerMb = compactMode ? 'mb-1' : (isSubItem ? 'mb-1' : 'mb-2');
    
    // Increased Font Sizes for Label
    const labelSize = compactMode ? 'text-base leading-tight font-bold line-clamp-2' : (isSubItem 
        ? 'text-base font-bold line-clamp-2 leading-tight' 
        : (colSpan > 1 ? 'text-3xl' : 'text-lg font-bold leading-snug line-clamp-3 break-words'));

    // Special Rendering for Placeholder
    if (isPlaceholder) {
        return (
            <div
                key={station.id}
                ref={(el) => { if(el) itemsRef.current.set(station.id, el); else itemsRef.current.delete(station.id); }}
                className={`${spanClass} ${cardHeight} w-full flex flex-col items-center justify-center border-2 border-transparent rounded text-gray-400 select-none px-2`}
            >
                <MoreHorizontal size={28} className="opacity-50 mb-1" />
                <span className="text-sm font-mono font-bold text-center w-full break-words leading-tight opacity-90">{station.label}</span>
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

    return (
        <button
            key={station.id}
            ref={(el) => { if(el) itemsRef.current.set(station.id, el); else itemsRef.current.delete(station.id); }}
            onClick={(e) => { e.stopPropagation(); onSelect(station.id) }}
            className={`
                ${isSubItem ? 'flex-1 min-w-0' : spanClass}
                ${cardHeight}
                relative flex flex-col justify-between rounded-lg border-2 text-left transition-all duration-200 group
                bg-industrial-800
                ${cardPadding}
                ${isSelected ? `scale-[1.02] -translate-y-1 ${shadowClass} z-20 bg-industrial-700` : 'hover:border-gray-500 hover:bg-industrial-700 hover:-translate-y-0.5'}
                ${isInactive ? 'opacity-50 grayscale bg-industrial-900' : 'cursor-pointer'}
                ${borderColor}
            `}
        >
            {/* Header */}
            <div className={`flex justify-between items-start w-full ${headerMb}`}>
                {/* Increased Font Size for ID */}
                <span className={`${compactMode ? 'text-xs' : (isSubItem ? 'text-xs' : 'text-sm')} font-mono tracking-wider uppercase truncate max-w-[80%] font-semibold ${isSelected ? 'text-neon-blue' : 'text-gray-400'}`}>
                    {station.id.replace('asm-', '').replace('front-','').replace('chassis-', '').replace('rear-', '').replace('door-sub-', '').replace('batt-', '').replace('st-eol-', '').replace('eol-', '').toUpperCase()}
                </span>
                <div className={`${compactMode ? 'h-2.5 w-2.5' : (isSubItem ? 'h-2.5 w-2.5' : 'h-3 w-3')} rounded-full ${statusColor} shadow-sm flex-shrink-0`}></div>
            </div>

            {/* Label */}
            <div className="flex-1 flex items-center">
                    <h3 className={`${labelSize} ${isSelected ? 'text-white' : 'text-gray-100'}`}>
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
      <div className="h-full flex items-center justify-center text-gray-400 font-mono text-xl bg-industrial-900">
        请选择车间
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-900">
      <style>{`
        @keyframes flowAnimation { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
        .flow-path { animation: flowAnimation 2.5s linear infinite; }
        .flow-path-bright { animation: flowAnimation 1.2s linear infinite; }
        .flow-path-dim { animation: flowAnimation 5s linear infinite; }
      `}</style>

      {/* Header */}
      <div className="p-5 border-b border-industrial-700 bg-industrial-800 z-30 flex items-center justify-between shadow-lg relative h-20 flex-shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
             <span className="text-neon-blue mr-1">#</span>
             {workshop.label}
           </h2>
        </div>
        <div className="flex gap-4">
             <div className="flex items-center gap-2 px-5 py-2 bg-neon-green/10 rounded border border-neon-green/30">
                <span className="w-3 h-3 rounded-full bg-neon-green animate-pulse"></span>
                <span className="text-lg font-bold text-neon-green font-mono">{stats.normal} 正常</span>
            </div>
             <div className="flex items-center gap-2 px-5 py-2 bg-neon-red/10 rounded border border-neon-red/30">
                <span className="w-3 h-3 rounded-full bg-neon-red animate-pulse"></span>
                <span className="text-lg font-bold text-neon-red font-mono">{stats.critical} 告警</span>
            </div>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar bg-industrial-900 relative ${isCompactView ? 'overflow-hidden' : ''}`} ref={scrollContainerRef}>
        <div className={`relative min-h-full ${isCompactView ? 'p-4' : 'pb-20 pt-10 px-10'}`} ref={contentRef}>
            
            <div className="relative z-10">
                {workshop.children && workshop.children[0].type === NodeType.ZONE ? (
                     // COMPACT LAYOUT (EOL & ASSEMBLY DASHBOARD)
                     isCompactView ? (
                         <div className={`grid max-w-full h-full ${isEol ? 'grid-cols-5 gap-x-4 gap-y-20 py-8' : 'grid-cols-12 gap-3'}`}>
                            {workshop.children.map((zone) => {
                                // Dynamic Span Calculation
                                let colSpan = 'col-span-1';
                                let innerGrid = 'grid-cols-1';
                                
                                if (isAssembly) {
                                    // Assembly Dashboard Logic (Stacked Full Width)
                                    switch(zone.id) {
                                        case 'zone-sub-assembly': colSpan = 'col-span-12'; innerGrid = 'grid-cols-10'; break; 
                                        case 'zone-front-main': colSpan = 'col-span-12'; innerGrid = 'grid-cols-12'; break;
                                        case 'zone-chassis-main': colSpan = 'col-span-12'; innerGrid = 'grid-cols-11'; break;
                                        case 'zone-rear-main': colSpan = 'col-span-12'; innerGrid = 'grid-cols-5'; break;
                                        case 'zone-battery-main': colSpan = 'col-span-12'; innerGrid = 'grid-cols-6'; break;
                                        default: colSpan = 'col-span-12'; innerGrid = 'grid-cols-4'; break;
                                    }
                                } else {
                                    // EOL Dashboard Logic
                                    switch(zone.id) {
                                        case 'zone-eol-cp7': colSpan = 'col-span-5'; innerGrid = 'grid-cols-6'; break;
                                        case 'zone-eol-test-line': colSpan = 'col-span-3'; innerGrid = 'grid-cols-4'; break;
                                        case 'zone-eol-dark': colSpan = 'col-span-2'; innerGrid = 'grid-cols-3'; break;
                                        case 'zone-eol-shower': colSpan = 'col-span-2'; innerGrid = 'grid-cols-3'; break;
                                        case 'zone-eol-cp89': colSpan = 'col-span-2'; innerGrid = 'grid-cols-3'; break; // Changed to span 2 (was 3)
                                        case 'zone-eol-smell-lab': colSpan = 'col-span-1'; innerGrid = 'grid-cols-1'; break; // Changed to span 1 (was 2)
                                        default: colSpan = 'col-span-1'; innerGrid = 'grid-cols-1'; break;
                                    }
                                }

                                return (
                                    <div 
                                        key={zone.id}
                                        ref={(el) => { if(el) itemsRef.current.set(zone.id, el); else itemsRef.current.delete(zone.id); }}
                                        className={`relative bg-industrial-800 border border-industrial-700 rounded-lg ${isEol ? 'p-2' : 'p-3'} ${colSpan}`}
                                    >
                                        {/* Inline Zone Header */}
                                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-industrial-700/50">
                                            <Box size={16} className="text-neon-blue" />
                                            {/* Increased Zone Label Font Size */}
                                            <span className="text-base font-bold text-gray-200 tracking-wide">{zone.label}</span>
                                            {zone.status === NodeStatus.WARNING && <AlertCircle size={16} className="text-neon-yellow" />}
                                            {zone.status === NodeStatus.CRITICAL && <AlertCircle size={16} className="text-neon-red animate-pulse" />}
                                        </div>
                                        {/* Inner Grid */}
                                        <div className={`grid gap-2 ${innerGrid}`}>
                                            {zone.children?.map(station => renderStationCard(station, 0, false, true))}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                     ) : (
                         // STANDARD VERTICAL LAYOUT
                         <div className="flex flex-col gap-20 max-w-7xl mx-auto">
                            {workshop.children.map((zone) => (
                                <div 
                                    key={zone.id} 
                                    ref={(el) => { if(el) itemsRef.current.set(zone.id, el); else itemsRef.current.delete(zone.id); }}
                                    className={`
                                        relative bg-industrial-800 border-2 border-industrial-700 rounded-xl p-10 transition-all duration-300
                                        ${zone.id === 'zone-sub-assembly' ? 'border-neon-blue/20 bg-industrial-800' : ''}
                                    `}
                                >
                                    {/* Floating Zone Header */}
                                    <div className="absolute -top-6 left-8 bg-industrial-900 border-2 border-industrial-600 px-8 py-2 rounded-full flex items-center gap-3 shadow-lg z-20">
                                        <Box size={24} className="text-neon-blue" />
                                        {/* Increased Font Size */}
                                        <span className="text-2xl font-bold text-white tracking-wide">{zone.label}</span>
                                        {zone.status === NodeStatus.CRITICAL && <AlertCircle size={24} className="text-neon-red animate-pulse" />}
                                    </div>
                                    
                                    {/* Zone Children Grid */}
                                    <div className={`mt-6 gap-6 ${
                                        zone.id === 'zone-front-main' 
                                        ? 'grid grid-cols-4 lg:grid-cols-8' 
                                        : zone.id === 'zone-chassis-main' || zone.id === 'zone-battery-main'
                                          ? 'grid grid-cols-6' 
                                          : zone.id === 'zone-rear-main' || zone.id === 'zone-sub-assembly'
                                            ? 'grid grid-cols-5' 
                                            : 'grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                                    }`}>
                                        {zone.children?.map(station => renderStationCard(station, 0, false))}
                                    </div>
                                </div>
                            ))}
                         </div>
                     )
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
                    const baseOpacity = isDimmed ? 0.1 : 0.2; 
                    const glowOpacity = isDimmed ? 0 : (isBright ? 0.5 : 0.3); 
                    const coreOpacity = isDimmed ? 0.1 : (isBright ? 0.9 : 0.6);
                    const animClass = isDimmed ? 'flow-path-dim' : (isBright ? 'flow-path-bright' : 'flow-path');
                    return (
                        <g key={i}>
                            <path d={p.d} stroke="#0f172a" strokeWidth="8" fill="none" strokeLinecap="round" opacity={1}/>
                            {!isDimmed && <path d={p.d} stroke="#00f0ff" strokeWidth={isBright ? "20" : "12"} strokeOpacity={glowOpacity} fill="none" strokeLinecap="round" style={{ filter: 'blur(8px)' }}/>}
                             <path d={p.d} stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" opacity={baseOpacity}/>
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