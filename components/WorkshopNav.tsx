import React from 'react';
import { ProcessNode } from '../types';
import { Factory, Cog, SprayCan, Wrench, Activity } from 'lucide-react';

interface WorkshopNavProps {
  workshops: ProcessNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getIcon = (label: string) => {
  if (label.includes('冲压')) return <Factory size={24} />;
  if (label.includes('焊装')) return <Activity size={24} />;
  if (label.includes('涂装')) return <SprayCan size={24} />;
  if (label.includes('总装')) return <Wrench size={24} />;
  return <Cog size={24} />;
};

export const WorkshopNav: React.FC<WorkshopNavProps> = ({ workshops, selectedId, onSelect }) => {
  return (
    <div className="flex flex-row items-center w-full h-24 bg-industrial-900 border-b border-gray-800 px-8 shadow-2xl z-40 flex-shrink-0">
      {/* Logo Section */}
      <div className="flex flex-col mr-16 flex-shrink-0 select-none">
        <h1 className="text-3xl font-bold text-white tracking-wider flex items-center gap-4">
           <div className="w-2 h-10 bg-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
           汽车制造工艺平台
        </h1>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="flex-1 flex overflow-x-auto h-full items-center gap-4 no-scrollbar mask-image-linear-gradient">
        {workshops.map((node) => {
          const isSelected = selectedId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => onSelect(node.id)}
              className={`
                relative group transition-all duration-300 h-16 px-8 min-w-[180px] flex items-center gap-4 rounded-t-lg border-b-2
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
                <div className="font-bold tracking-wide text-lg">{node.label}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                    {node.children?.length || 0} 个工位
                </div>
              </div>
              
              {/* Active Glow Bar at Bottom */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neon-blue shadow-[0_0_15px_rgba(0,240,255,1)]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Side Status */}
      <div className="ml-10 pl-10 border-l border-gray-800 h-14 flex flex-col justify-center text-right flex-shrink-0">
        <div className="text-sm text-gray-500 mb-1">系统运行状态</div>
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