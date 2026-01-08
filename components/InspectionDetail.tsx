import React from 'react';
import { ProcessNode, NodeStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Eye, ShieldCheck, AlertTriangle, Activity, XCircle, ArrowRight } from 'lucide-react';

interface InspectionDetailProps {
  station: ProcessNode | undefined;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-industrial-900 border border-gray-700 p-2 rounded shadow-xl text-xs">
        <p className="text-gray-500 mb-1 font-mono">{label}</p>
        <span className="text-neon-blue font-bold">
          {payload[0].value.toFixed(1)}
        </span>
      </div>
    );
  }
  return null;
};

export const InspectionDetail: React.FC<InspectionDetailProps> = ({ station }) => {
  if (!station) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-industrial-900 text-gray-600 px-8 text-center">
         <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
            <ArrowRight size={24} className="opacity-50" />
         </div>
         <h3 className="text-lg font-semibold text-gray-400 mb-2">请选择工位</h3>
         <p className="text-xs text-gray-600 font-mono">点击左侧任意工位以查看详细检测数据和监控画面。</p>
      </div>
    );
  }

  const inspections = station.children || [];

  return (
    <div className="h-full flex flex-col bg-industrial-900 border-l border-gray-800 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-industrial-800/50">
          <div className="flex items-center justify-between mb-2">
             <div className="text-xs text-neon-blue font-mono border border-neon-blue/30 px-2 py-0.5 rounded bg-neon-blue/5">
                {station.id.toUpperCase()}
             </div>
             <StatusBadge status={station.status} size="sm" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
            {station.label}
          </h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase font-bold tracking-wider mb-2 px-1">
             <Activity size={12} /> 检测项 ({inspections.length})
          </div>

          {inspections.map((item) => (
            <div key={item.id} className="bg-gray-800/40 rounded-lg border border-gray-700/50 overflow-hidden hover:border-gray-600 transition-colors">
               {/* Item Header */}
               <div className="px-4 py-3 flex justify-between items-start border-b border-gray-700/30 bg-gray-800/30">
                  <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                         {item.status === NodeStatus.CRITICAL 
                            ? <XCircle size={16} className="text-neon-red" /> 
                            : <ShieldCheck size={16} className="text-neon-green" />
                         }
                      </div>
                      <div>
                          <h4 className="text-sm font-semibold text-gray-200">{item.label}</h4>
                          <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.meta?.description}</p>
                      </div>
                  </div>
               </div>

               {/* Item Body (Chart/Image) */}
               <div className="p-3 h-40">
                  {item.meta?.imgUrl ? (
                       <div className="relative w-full h-full rounded overflow-hidden group">
                          <img src={item.meta.imgUrl} alt="Inspection" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-[10px] text-white font-mono flex items-center gap-1">
                              <Eye size={10} /> CAM_01
                          </div>
                       </div>
                  ) : item.meta?.metrics ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={item.meta.metrics}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                              <XAxis dataKey="time" hide />
                              <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                              <Tooltip content={<CustomTooltip />} />
                              <ReferenceLine y={85} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                              <Line 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke={item.status === NodeStatus.CRITICAL ? '#ff2a2a' : '#00f0ff'} 
                                  strokeWidth={2}
                                  dot={false}
                                  activeDot={{r: 4}}
                              />
                          </LineChart>
                      </ResponsiveContainer>
                  ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-600">暂无数据</div>
                  )}
               </div>
            </div>
          ))}

          {inspections.length === 0 && (
             <div className="text-center py-8 text-gray-600 text-xs">该工位未配置检测项</div>
          )}
      </div>
    </div>
  );
};