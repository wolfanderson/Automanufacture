import React from 'react';
import { ProcessNode, NodeType, ViewMode } from '../types';
import { Factory, Cog, SprayCan, Wrench, Activity, Search, LayoutGrid, Car } from 'lucide-react';

interface WorkshopNavProps {
  workshops: ProcessNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchVin: string;
  onSearchVinChange: (vin: string) => void;
}

const getIcon = (label: string) => {
  if (label.includes('冲压')) return <Factory size={28} />;
  if (label.includes('焊装')) return <Activity size={28} />;
  if (label.includes('涂装')) return <SprayCan size={28} />;
  if (label.includes('总装')) return <Wrench size={28} />;
  return <Cog size={28} />;
};

// Helper function to recursively count leaf stations
const getStationCount = (node: ProcessNode): number => {
  if (!node.children) return 0;
  
  let count = 0;
  
  const traverse = (nodes: ProcessNode[]) => {
    nodes.forEach(child => {
      // If it is a ZONE, dive in
      if (child.type === NodeType.ZONE) {
        if (child.children) traverse(child.children);
        return;
      }

      // If it is a STATION
      if (child.type === NodeType.STATION) {
        // Check if it is a placeholder - don't count gaps
        if (child.meta?.isPlaceholder) return;

        // Check if it acts as a container for other stations (e.g., Sub-assembly groups like "Door Sub-assembly")
        // If it has children that are also STATIONS, it's a container.
        const subStations = child.children?.filter(c => c.type === NodeType.STATION);
        
        if (subStations && subStations.length > 0) {
           // It's a container, recurse to count its children
           traverse(child.children!);
        } else {
           // It's a leaf station (actual work unit) or a station with only inspections
           count++;
        }
      }
    });
  };

  traverse(node.children);
  return count;
};

export const WorkshopNav: React.FC<WorkshopNavProps> = ({ 
  workshops, selectedId, onSelect, 
  viewMode, onViewModeChange, 
  searchVin, onSearchVinChange 
}) => {
  return (
    <div className="flex flex-row items-center w-full h-24 bg-industrial-900 border-b border-industrial-700 px-8 shadow-md z-40 flex-shrink-0">
      {/* Logo Section */}
      <div className="flex flex-col mr-10 flex-shrink-0 select-none">
        <h1 className="text-4xl font-bold text-white tracking-wider flex items-center gap-4">
           <div className="w-2.5 h-11 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
           智界 - 产线工艺检测平台
        </h1>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex-1 flex overflow-x-auto h-full items-center gap-4 no-scrollbar mr-4">
        {workshops.map((node) => {
          const isSelected = selectedId === node.id;
          const stationCount = getStationCount(node);

          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`
                relative group transition-all duration-200 h-16 px-6 min-w-[200px] flex items-center gap-4 rounded-t-lg border-b-2 flex-shrink-0
                ${isSelected 
                  ? 'border-neon-blue bg-industrial-800 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-industrial-800/50'
                }
              `}
            >
              <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-neon-blue/20 text-neon-blue' : 'bg-industrial-700 text-gray-400 group-hover:bg-industrial-600 group-hover:text-white'}`}>
                {getIcon(node.label)}
              </div>
              <div className="flex flex-col items-start">
                <div className={`font-bold tracking-wide transition-all ${isSelected ? 'text-2xl' : 'text-xl'}`}>
                    {node.label}
                </div>
                <div className={`text-base font-mono mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                    {stationCount} 个工位
                </div>
              </div>
              
              {/* Active Glow Bar at Bottom */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Side Control Panel */}
      <div className="ml-4 pl-6 border-l border-industrial-700 h-16 flex flex-row items-center gap-6 flex-shrink-0">
        
        {/* Mode Switcher */}
        <div className="flex bg-industrial-800 p-1 rounded-lg border border-industrial-600">
            <button 
                onClick={() => onViewModeChange('LINE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'LINE' ? 'bg-industrial-700 text-white shadow-md font-bold' : 'text-gray-400 hover:text-gray-200'}`}
            >
                <LayoutGrid size={18} />
                <span className="text-sm">产线模式</span>
            </button>
            <button 
                onClick={() => onViewModeChange('VEHICLE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${viewMode === 'VEHICLE' ? 'bg-neon-blue/20 text-neon-blue shadow-md font-bold' : 'text-gray-400 hover:text-gray-200'}`}
            >
                <Car size={18} />
                <span className="text-sm">车辆模式</span>
            </button>
        </div>

        {/* Search Bar (Only for Vehicle Mode) */}
        {viewMode === 'VEHICLE' && (
             <div className="relative w-64 animate-in fade-in slide-in-from-right-4 duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-blue" size={18} />
                <input 
                    type="text" 
                    placeholder="请输入VIN码搜索..." 
                    value={searchVin}
                    onChange={(e) => onSearchVinChange(e.target.value)}
                    className="w-full bg-industrial-800 border border-neon-blue/50 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                />
            </div>
        )}

        {/* System Status (Simplified) */}
        {viewMode === 'LINE' && (
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                </span>
                <span className="text-neon-green font-bold text-sm hidden xl:block">系统在线</span>
            </div>
        )}
      </div>
    </div>
  );
};