import React, { useState, useMemo } from 'react';
import { ProcessNode, NodeStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from 'recharts';
import { 
  Activity, Search, Filter, CheckCircle2, XCircle, ArrowRight, Calendar, Hash, Ban, Box, ScanLine, Clock 
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
  result: 'PASS' | 'FAIL';
  time: string;
}

const generateTableData = (station: ProcessNode): VehicleRecord[] => {
  if (!station) return [];
  
  const records: VehicleRecord[] = [];
  // Simulate 15 vehicles passing through the station
  for (let i = 1; i <= 15; i++) {
    const vinSuffix = (5000 + i).toString(); 
    const vin = `LHPV2024${vinSuffix}`;
    
    // Generate a time sequence (descending broadly if we reverse later, or just random today)
    // Let's make them somewhat sequential for realism
    const h = 9 + Math.floor(i / 4);
    const m = (i * 15) % 60;
    const timeStr = `2024-05-20 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${Math.floor(Math.random()*59).toString().padStart(2,'0')}`;

    // 5% failure rate simulation
    const isFail = Math.random() > 0.95; 

    records.push({
      id: vin,
      vin: vin,
      time: timeStr,
      result: isFail ? 'FAIL' : 'PASS',
    });
  }
  // Return newest first
  return records.reverse();
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-industrial-800 border border-industrial-600 p-3 rounded shadow-xl text-sm z-50">
        <p className="text-gray-300 mb-1 font-mono">{label}</p>
        <div className="flex items-center gap-2">
           <span className="w-2.5 h-2.5 rounded-full bg-neon-green"></span>
           <span className="text-gray-100 font-medium">合格率: </span>
           <span className="text-neon-green font-bold text-lg">
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
      <div className="h-full flex flex-col items-center justify-center bg-industrial-800 text-gray-400 px-8 text-center border-l border-industrial-700">
         <div className="w-28 h-28 rounded-full bg-industrial-700 flex items-center justify-center mb-6">
            <Activity size={56} className="text-gray-500" />
         </div>
         <h3 className="text-3xl font-bold text-gray-200 mb-3 tracking-wide">工位数据看板</h3>
         <p className="text-lg text-gray-500 max-w-[320px]">请点击左侧工位图，查看实时合格率趋势与单车检测明细。</p>
      </div>
    );
  }

  // Handle No Data / Inactive State
  if (station.status === NodeStatus.INACTIVE) {
     return (
        <div className="h-full flex flex-col bg-industrial-800 border-l border-industrial-700 shadow-xl relative z-30">
            {/* Header Area (Minimal) */}
            <div className="px-8 py-8 border-b border-industrial-700 bg-industrial-800 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-base text-gray-400 font-mono border border-industrial-600 px-3 py-1 rounded bg-industrial-700 tracking-wider font-semibold">
                         {station.id.replace('asm-', '').toUpperCase()}
                    </div>
                    <StatusBadge status={station.status} size="md" />
                </div>
                <h2 className="text-4xl font-bold text-gray-300 tracking-tight leading-tight flex items-center gap-2">
                    {station.label}
                </h2>
            </div>
            
            {/* Empty State Body */}
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 px-8 text-center bg-industrial-800">
                <div className="w-24 h-24 rounded-full bg-industrial-700 flex items-center justify-center mb-5 border-2 border-industrial-600 border-dashed">
                    <Ban size={40} className="opacity-50" />
                </div>
                <h3 className="text-3xl font-bold text-gray-400 mb-3">暂无检测数据</h3>
                <p className="text-lg text-gray-500">该工位当前处于未激活状态。</p>
            </div>
        </div>
     );
  }

  return (
    <div className="h-full flex flex-col bg-industrial-800 border-l border-industrial-700 shadow-2xl relative z-30">
      
      {/* 1. Header Area */}
      <div className="px-8 py-8 border-b border-industrial-700 bg-industrial-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
             <div className="text-base text-neon-blue font-mono border border-neon-blue/30 px-3 py-1 rounded bg-neon-blue/5 tracking-wider font-semibold">
                {station.id.replace('asm-', '').toUpperCase()}
             </div>
             <StatusBadge status={station.status} size="md" pulsing />
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight leading-tight flex items-center gap-3">
            {station.label}
          </h2>

          {/* New Info Cards Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-industrial-700/30 p-4 rounded-lg border border-industrial-600/60 hover:bg-industrial-700/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <Box size={16} className="text-neon-blue" />
                    <span className="text-sm font-bold text-gray-400 font-mono tracking-wider">检测对象</span>
                </div>
                <div className="text-lg text-gray-200 font-medium leading-snug line-clamp-3">
                    {station.meta?.inspectionObject || '暂无详细描述'}
                </div>
            </div>
            <div className="bg-industrial-700/30 p-4 rounded-lg border border-industrial-600/60 hover:bg-industrial-700/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <ScanLine size={16} className="text-neon-green" />
                    <span className="text-sm font-bold text-gray-400 font-mono tracking-wider">检测方案</span>
                </div>
                <div className="text-lg text-gray-200 font-medium leading-snug line-clamp-3">
                    {station.meta?.inspectionMethod || '标准视觉检测'}
                </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-6 font-mono flex gap-6 pt-3 border-t border-industrial-700/30">
             <span>Items: <span className="text-gray-300 font-bold">{station.children?.length || 0}</span></span>
             <span className="w-px h-4 bg-industrial-600"></span>
             <span>Resp: <span className="text-gray-300 font-bold">张工 (8902)</span></span>
          </div>
      </div>

      {/* 2. Top Half: Pass Rate Trend Chart */}
      <div className="h-[30%] min-h-[220px] p-8 border-b border-industrial-700 bg-industrial-800 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-base font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wide">
                  <Activity size={20} className="text-neon-green" />
                  通过率
              </h3>
              <span className="text-neon-green font-mono text-base font-bold">
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false}
                        interval={6}
                    />
                    <YAxis 
                        domain={[96, 100]} 
                        tick={{fontSize: 12, fill: '#94a3b8'}} 
                        axisLine={false} 
                        tickLine={false} 
                        width={30}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1 }} />
                    <ReferenceLine y={98} stroke="#0aff00" strokeDasharray="3 3" strokeOpacity={0.6} label={{ position: 'insideTopRight',  value: 'Target', fill: '#0aff00', fontSize: 12 }} />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0aff00" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        activeDot={{r: 5, strokeWidth: 2, stroke: '#0f172a', fill: '#fff'}}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* 3. Bottom Half: Vehicle Inspection Table */}
      <div className="flex-1 flex flex-col min-h-0 bg-industrial-800">
          
          {/* Table Controls */}
          <div className="px-8 py-4 flex items-center gap-3 border-b border-industrial-700 bg-industrial-800">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search VIN..." 
                    value={vinFilter}
                    onChange={(e) => setVinFilter(e.target.value)}
                    className="w-full bg-industrial-900 border border-industrial-600 rounded-lg py-2.5 pl-10 pr-4 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
                 />
             </div>
             <button className="p-2.5 text-gray-400 hover:text-white bg-industrial-900 border border-industrial-600 rounded-lg hover:bg-industrial-700 transition-colors">
                <Filter size={18} />
             </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-8 py-3 bg-industrial-700/30 text-sm font-bold text-gray-400 border-b border-industrial-700 uppercase tracking-wider">
              <div className="col-span-5 pl-1">VIN 码</div>
              <div className="col-span-4">检测时间</div>
              <div className="col-span-3 text-right pr-2">检测状态</div>
          </div>

          {/* Scrollable Rows */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-industrial-800">
             {filteredRecords.length > 0 ? (
                filteredRecords.map((row) => (
                    <div 
                        key={row.id} 
                        className="grid grid-cols-12 gap-2 items-center px-4 py-3 rounded border border-industrial-700/50 bg-industrial-900/40 hover:bg-industrial-700/60 hover:border-industrial-600 transition-all group"
                    >
                        {/* VIN */}
                        <div className="col-span-5 flex flex-col justify-center">
                            <span className="text-sm font-mono text-neon-blue group-hover:text-white transition-colors font-bold tracking-wide">{row.vin}</span>
                        </div>
                        
                        {/* Time */}
                        <div className="col-span-4 flex items-center gap-1.5 text-sm text-gray-400 font-mono">
                            <Clock size={14} className="opacity-50" />
                            {row.time}
                        </div>

                        {/* Result */}
                        <div className="col-span-3 flex justify-end">
                            {row.result === 'PASS' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neon-green/5 border border-neon-green/10 text-xs font-bold text-neon-green">
                                    <CheckCircle2 size={12} /> PASS
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neon-red/5 border border-neon-red/10 text-xs font-bold text-neon-red animate-pulse">
                                    <XCircle size={12} /> FAIL
                                </span>
                            )}
                        </div>
                    </div>
                ))
             ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-3">
                    <Search size={40} className="opacity-20" />
                    <span className="text-lg font-medium">暂无记录</span>
                </div>
             )}
          </div>
      </div>

    </div>
  );
};