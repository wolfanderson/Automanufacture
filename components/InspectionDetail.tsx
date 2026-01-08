import React, { useState, useMemo } from 'react';
import { ProcessNode, NodeStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Search, Filter, CheckCircle2, XCircle, ArrowRight, Calendar, Hash, Ban 
} from 'lucide-react';

interface InspectionDetailProps {
  station: ProcessNode | undefined;
}

// Mock Data Generators for the specific view requirements
const generateTrendData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Random pass rate between 98.0 and 100.0
    const rate = 98 + Math.random() * 2;
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: Number(rate.toFixed(2)),
    });
  }
  return data;
};

interface VehicleRecord {
  id: string;
  vin: string;
  itemName: string;
  result: 'PASS' | 'FAIL';
  time: string;
  value: string; // Measured value
}

const generateTableData = (station: ProcessNode): VehicleRecord[] => {
  if (!station || !station.children) return [];
  
  const records: VehicleRecord[] = [];
  const inspectionItems = station.children; // These are the L3 items (e.g., Nameplate Check)

  // Simulate 10 vehicles
  for (let i = 1; i <= 10; i++) {
    const vinSuffix = i.toString().padStart(6, '0'); // 000001, 000002...
    const vin = `LHPV2024${vinSuffix}`;
    const baseTimeHour = 8 + i; // simplistic time progression

    // For each vehicle, simulate all inspection items defined in the station
    inspectionItems.forEach((item, idx) => {
       const isFail = Math.random() > 0.98; // 2% chance of failure
       records.push({
         id: `${vin}-${item.id}`,
         vin: vin,
         itemName: item.label,
         result: isFail ? 'FAIL' : 'PASS',
         time: `2024-05-20 ${baseTimeHour < 10 ? '0'+baseTimeHour : baseTimeHour}:${15 + idx}`,
         value: isFail ? 'ERR_02' : 'OK'
       });
    });
  }
  return records;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-industrial-900 border border-gray-700 p-3 rounded shadow-xl text-xs z-50">
        <p className="text-gray-400 mb-1 font-mono">{label}</p>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-neon-green"></span>
           <span className="text-gray-200">合格率: </span>
           <span className="text-neon-green font-bold text-sm">
             {payload[0].value}%
           </span>
        </div>
      </div>
    );
  }
  return null;
};

export const InspectionDetail: React.FC<InspectionDetailProps> = ({ station }) => {
  const [vinFilter, setVinFilter] = useState('');

  // Memoize data generation to avoid flicker on re-renders, updates when station changes
  const trendData = useMemo(() => {
    if (!station) return [];
    return generateTrendData();
  }, [station?.id]);

  const tableData = useMemo(() => {
    if (!station) return [];
    return generateTableData(station);
  }, [station?.id]);

  // Derived state for table
  const filteredRecords = useMemo(() => {
    return tableData.filter(r => r.vin.includes(vinFilter));
  }, [tableData, vinFilter]);

  if (!station) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-industrial-900 text-gray-600 px-8 text-center border-l border-gray-800">
         <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6 animate-pulse">
            <Activity size={32} className="opacity-40" />
         </div>
         <h3 className="text-xl font-bold text-gray-400 mb-2 tracking-wide">工位数据看板</h3>
         <p className="text-xs text-gray-500 font-mono max-w-[200px]">点击左侧工位图查看实时合格率趋势与单车检测明细。</p>
      </div>
    );
  }

  // Handle No Data / Inactive State
  if (station.status === NodeStatus.INACTIVE || !station.children || station.children.length === 0) {
     return (
        <div className="h-full flex flex-col bg-industrial-900 border-l border-gray-800 shadow-[-20px_0_40px_rgba(0,0,0,0.6)] relative z-30">
            {/* Header Area (Minimal) */}
            <div className="px-6 py-5 border-b border-gray-800 bg-industrial-800/80 backdrop-blur-md flex-shrink-0 opacity-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-gray-500 font-mono border border-gray-700 px-2 py-0.5 rounded bg-gray-800 tracking-wider">
                        STATION ID: {station.id.replace('asm-', '').toUpperCase()}
                    </div>
                    <StatusBadge status={station.status} size="sm" />
                </div>
                <h2 className="text-lg font-bold text-gray-400 tracking-tight leading-tight flex items-center gap-2">
                    {station.label}
                </h2>
            </div>
            
            {/* Empty State Body */}
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/30 flex items-center justify-center mb-4 border border-gray-700 border-dashed">
                    <Ban size={24} className="opacity-40" />
                </div>
                <h3 className="text-lg font-bold text-gray-500 mb-1">暂无检测数据</h3>
                <p className="text-xs text-gray-600 font-mono">该工位当前处于未激活状态或尚未配置 L3 检测项。</p>
            </div>
        </div>
     );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-900 border-l border-gray-800 shadow-[-20px_0_40px_rgba(0,0,0,0.6)] relative z-30">
      
      {/* 1. Header Area */}
      <div className="px-6 py-5 border-b border-gray-800 bg-industrial-800/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
             <div className="text-[10px] text-neon-blue font-mono border border-neon-blue/30 px-2 py-0.5 rounded bg-neon-blue/5 tracking-wider">
                STATION ID: {station.id.replace('asm-', '').toUpperCase()}
             </div>
             <StatusBadge status={station.status} size="sm" pulsing />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight flex items-center gap-2">
            {station.label}
          </h2>
          <div className="text-[10px] text-gray-500 mt-1 font-mono flex gap-4">
             <span>包含检测项: {station.children?.length || 0}</span>
             <span>负责人: 张工 (ID: 8902)</span>
          </div>
      </div>

      {/* 2. Top Half: Pass Rate Trend Chart */}
      <div className="h-[35%] min-h-[220px] p-4 border-b border-gray-800 bg-industrial-900/50 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider">
                  <Activity size={14} className="text-neon-green" />
                  30天一次合格率趋势 (FPY)
              </h3>
              <span className="text-neon-green font-mono text-xs font-bold bg-neon-green/10 px-2 py-0.5 rounded">
                  Avg: 99.2%
              </span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                    <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0aff00" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0aff00" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fill: '#6b7280'}} 
                        axisLine={false} 
                        tickLine={false}
                        interval={4}
                    />
                    <YAxis 
                        domain={[96, 100]} 
                        tick={{fontSize: 10, fill: '#6b7280'}} 
                        axisLine={false} 
                        tickLine={false} 
                        width={25}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                    <ReferenceLine y={98} stroke="#0aff00" strokeDasharray="3 3" strokeOpacity={0.4} label={{ position: 'right',  value: 'Target', fill: '#0aff00', fontSize: 10 }} />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0aff00" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        activeDot={{r: 4, strokeWidth: 0, fill: '#fff'}}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 3. Bottom Half: Vehicle Inspection Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-industrial-900/30">
          
          {/* Table Controls */}
          <div className="p-4 flex items-center gap-3 border-b border-gray-800">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                 <input 
                    type="text" 
                    placeholder="输入 VIN 码筛选..." 
                    value={vinFilter}
                    onChange={(e) => setVinFilter(e.target.value)}
                    className="w-full bg-industrial-800 border border-gray-700 rounded-md py-1.5 pl-9 pr-3 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all font-mono"
                 />
             </div>
             <button className="p-1.5 text-gray-400 hover:text-white bg-industrial-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors">
                <Filter size={14} />
             </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-800/50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <div className="col-span-4 pl-1">车辆 VIN 码</div>
              <div className="col-span-5">检测项名称</div>
              <div className="col-span-3 text-right pr-2">结果</div>
          </div>

          {/* Scrollable Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
             {filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
                    <div 
                        key={row.id} 
                        className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded border border-transparent hover:bg-white/5 hover:border-gray-700 transition-colors group"
                    >
                        {/* VIN */}
                        <div className="col-span-4 flex flex-col justify-center">
                            <span className="text-xs font-mono text-neon-blue group-hover:text-white transition-colors">{row.vin}</span>
                            <span className="text-[9px] text-gray-600">{row.time}</span>
                        </div>
                        
                        {/* Item Name */}
                        <div className="col-span-5 text-xs text-gray-300 leading-tight">
                            {row.itemName}
                        </div>

                        {/* Result */}
                        <div className="col-span-3 flex justify-end">
                            {row.result === 'PASS' ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-[10px] font-bold text-neon-green">
                                    <CheckCircle2 size={10} /> PASS
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-red/10 border border-neon-red/20 text-[10px] font-bold text-neon-red animate-pulse">
                                    <XCircle size={10} /> FAIL
                                </span>
                            )}
                        </div>
                    </div>
                ))
             ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600 gap-2">
                    <Search size={24} className="opacity-20" />
                    <span className="text-xs">未找到匹配的车辆记录</span>
                </div>
             )}
          </div>
      </div>

    </div>
  );
};