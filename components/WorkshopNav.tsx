import React from 'react';
import { ProcessNode, NodeType } from '../types';
import { Factory, Cog, SprayCan, Wrench, Activity } from 'lucide-react';

interface WorkshopNavProps {
  workshops: ProcessNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getIcon = (label: string) => {
  if (label.includes('冲压')) return <Factory size={26} />;
  if (label.includes('焊装')) return <Activity size={26} />;
  if (label.includes('涂装')) return <SprayCan size={26} />;
  if (label.includes('总装')) return <Wrench size={26} />;
  return <Cog size={26} />;
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

export const WorkshopNav: React.FC<WorkshopNavProps> = ({ workshops, selectedId, onSelect }) => {
  return (
    <div className="flex flex-row items-center w-full h-24 bg-industrial-900 border-b border-industrial-700 px-8 shadow-md z-40 flex-shrink-0">
      {/* Logo Section */}
      <div className="flex flex-col mr-16 flex-shrink-0 select-none">
        <h1 className="text-3xl font-bold text-white tracking-wider flex items-center gap-4">
           <div className="w-2 h-10 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
           智界 - 产线工艺检测平台
        </h1>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex-1 flex overflow-x-auto h-full items-center gap-4 no-scrollbar">
        {workshops.map((node) => {
          const isSelected = selectedId === node.id;
          const stationCount = getStationCount(node);

          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`
                relative group transition-all duration-200 h-16 px-8 min-w-[200px] flex items-center gap-4 rounded-t-lg border-b-2
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
                <div className={`font-bold tracking-wide transition-all ${isSelected ? 'text-xl' : 'text-lg'}`}>
                    {node.label}
                </div>
                <div className={`text-sm font-mono mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
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

      {/* Right Side Status */}
      <div className="ml-10 pl-10 border-l border-industrial-700 h-14 flex flex-col justify-center text-right flex-shrink-0">
        <div className="text-sm text-gray-400 mb-1 font-medium">系统运行状态</div>
        <div className="flex items-center gap-2 justify-end">
            <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
            </span>
            <span className="text-neon-green font-bold tracking-wider text-base">在线运行</span>
        </div>
      </div>
    </div>
  );
};