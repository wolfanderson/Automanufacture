import React from 'react';
import { ProcessNode } from '../types';
import { Factory, Cog, SprayCan, Wrench, Activity } from 'lucide-react';

interface WorkshopNavProps {
  workshops: ProcessNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getIcon = (label: string) => {
  if (label.includes('Stamping')) return <Factory size={20} />;
  if (label.includes('Welding')) return <Activity size={20} />;
  if (label.includes('Painting')) return <SprayCan size={20} />;
  if (label.includes('Assembly')) return <Wrench size={20} />;
  return <Cog size={20} />;
};

export const WorkshopNav: React.FC<WorkshopNavProps> = ({ workshops, selectedId, onSelect }) => {
  return (
    <div className="flex flex-row items-center w-full h-24 bg-industrial-900 border-b border-gray-800 px-6 shadow-2xl z-40 flex-shrink-0">
      {/* Logo Section */}
      <div className="flex flex-col mr-12 flex-shrink-0 select-none">
        <h1 className="text-2xl font-bold text-white tracking-widest flex items-center gap-3">
           <div className="w-3 h-8 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
           PLANTERA
        </h1>
        <p className="text-[10px] text-gray-500 font-mono mt-1 pl-6 tracking-wider">MFG-OS v2.4.0</p>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex-1 flex overflow-x-auto h-full items-center gap-2 no-scrollbar mask-image-linear-gradient">
        {workshops.map((node) => {
          const isSelected = selectedId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`
                relative group transition-all duration-300 h-16 px-6 min-w-[200px] flex items-center gap-4 rounded-t-md border-b-2
                ${isSelected 
                  ? 'border-neon-blue bg-gradient-to-t from-neon-blue/10 to-transparent text-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }
              `}
            >
              <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-neon-blue/20 text-neon-blue' : 'bg-gray-800 text-gray-600 group-hover:bg-gray-700'}`}>
                {getIcon(node.label)}
              </div>
              <div className="flex flex-col items-start">
                <div className="font-semibold tracking-wide uppercase text-sm">{node.label}</div>
                <div className="text-[10px] text-gray-600 font-mono">
                    {node.children?.length || 0} STATIONS
                </div>
              </div>
              
              {/* Active Glow Bar at Bottom */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neon-blue shadow-[0_0_15px_rgba(0,240,255,1)]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Side Status */}
      <div className="ml-8 pl-8 border-l border-gray-800 h-12 flex flex-col justify-center text-right flex-shrink-0">
        <div className="text-xs text-gray-500 font-mono mb-1">SYSTEM STATUS</div>
        <div className="flex items-center gap-2 justify-end">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
            </span>
            <span className="text-neon-green font-bold tracking-wider text-sm">ONLINE</span>
        </div>
      </div>
    </div>
  );
};