import React, { useState, useMemo } from 'react';
import { WorkshopNav } from './components/WorkshopNav';
import { StationList } from './components/StationList';
import { InspectionDetail } from './components/InspectionDetail';
import { MOCK_DATA } from './data';
import { ProcessNode } from './types';

const App: React.FC = () => {
  // --- State Management ---
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(MOCK_DATA[0].id);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // --- Derived State ---
  const selectedWorkshop = useMemo(() => 
    MOCK_DATA.find(w => w.id === selectedWorkshopId),
  [selectedWorkshopId]);

  const selectedStation = useMemo(() => {
    if (!selectedWorkshop || !selectedStationId) return undefined;
    return selectedWorkshop.children?.find(s => s.id === selectedStationId);
  }, [selectedWorkshop, selectedStationId]);

  // --- Handlers ---
  const handleWorkshopSelect = (id: string) => {
    setSelectedWorkshopId(id);
    setSelectedStationId(null); 
  };

  const handleStationSelect = (id: string) => {
    setSelectedStationId(id);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-industrial-900 text-gray-100 overflow-hidden font-sans selection:bg-neon-blue selection:text-black bg-grid-pattern bg-[size:40px_40px]">
      
      {/* Layer 1: Workshops (Top Header) */}
      <WorkshopNav 
        workshops={MOCK_DATA} 
        selectedId={selectedWorkshopId} 
        onSelect={handleWorkshopSelect} 
      />

      {/* Main Content: Flex Row (Left: L2 Grid, Right: L3 Sidebar) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Layer 2: Stations (Main Grid Area) */}
        <main className="flex-1 relative z-10 flex flex-col min-w-0">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-0 w-full h-96 bg-neon-blue/5 blur-[100px] pointer-events-none transform -translate-y-1/2"></div>
          
          <StationList 
            workshop={selectedWorkshop} 
            selectedStationId={selectedStationId} 
            onSelect={handleStationSelect} 
          />
        </main>

        {/* Layer 3: Inspection Details (Right Sidebar) */}
        <aside className="w-[400px] flex-shrink-0 z-20 transition-all duration-300 ease-in-out border-l border-gray-800 bg-industrial-900">
           <InspectionDetail 
             station={selectedStation} 
           />
        </aside>

      </div>

    </div>
  );
};

export default App;