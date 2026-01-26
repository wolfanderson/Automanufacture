import React, { useState, useMemo } from 'react';
import { WorkshopNav } from './components/WorkshopNav';
import { StationList } from './components/StationList';
import { InspectionDetail } from './components/InspectionDetail';
import { MOCK_DATA } from './data';
import { ProcessNode, ViewMode } from './types';

const App: React.FC = () => {
  // --- State Management ---
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(MOCK_DATA[0].id);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  
  // --- New Mode State ---
  const [viewMode, setViewMode] = useState<ViewMode>('LINE');
  const [searchVin, setSearchVin] = useState<string>('');

  // --- Derived State ---
  const selectedWorkshop = useMemo(() => 
    MOCK_DATA.find(w => w.id === selectedWorkshopId),
  [selectedWorkshopId]);

  const selectedStation = useMemo(() => {
    if (!selectedWorkshop || !selectedStationId) return undefined;

    // Recursively find the selected station (needed for nested Zones)
    const findNode = (nodes: ProcessNode[]): ProcessNode | undefined => {
      for (const node of nodes) {
        if (node.id === selectedStationId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findNode(selectedWorkshop.children || []);
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
    <div className="flex flex-col h-screen w-screen bg-industrial-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Layer 1: Workshops (Top Header) */}
      <WorkshopNav 
        workshops={MOCK_DATA} 
        selectedId={selectedWorkshopId} 
        onSelect={handleWorkshopSelect}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchVin={searchVin}
        onSearchVinChange={setSearchVin}
      />

      {/* Main Content: Flex Row (Left: L2 Grid, Right: L3 Sidebar) */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Layer 2: Stations (Main Grid Area) */}
        <main className="flex-1 relative z-10 flex flex-col min-w-0 bg-industrial-900">
          <StationList 
            workshop={selectedWorkshop} 
            selectedStationId={selectedStationId} 
            onSelect={handleStationSelect}
            viewMode={viewMode}
            searchVin={searchVin}
          />
        </main>

        {/* Layer 3: Inspection Details (Right Sidebar) */}
        <aside className="w-[450px] flex-shrink-0 z-20 transition-all duration-300 ease-in-out border-l border-industrial-700 bg-industrial-800">
           <InspectionDetail 
             station={selectedStation} 
             viewMode={viewMode}
             searchVin={searchVin}
           />
        </aside>

      </div>

    </div>
  );
};

export default App;