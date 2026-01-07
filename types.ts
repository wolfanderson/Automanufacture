export enum NodeType {
  WORKSHOP = 'WORKSHOP',
  STATION = 'STATION',
  INSPECTION = 'INSPECTION'
}

export enum NodeStatus {
  NORMAL = 'NORMAL', // Green/Active
  WARNING = 'WARNING', // Yellow
  CRITICAL = 'CRITICAL', // Red
  INACTIVE = 'INACTIVE' // Gray/Dimmed
}

// Chart data point interface
export interface MetricPoint {
  time: string;
  value: number;
  expected: number;
}

// Flexible metadata interface for inspection details
export interface NodeMeta {
  description?: string;
  responsiblePerson?: string;
  lastUpdated?: string;
  metrics?: MetricPoint[]; // For L3 visualization
  imgUrl?: string; // Placeholder for camera feed or snapshot
}

// The recursive structure
export interface ProcessNode {
  id: string;
  label: string;
  type: NodeType;
  status: NodeStatus;
  children?: ProcessNode[]; // Recursive definition
  meta?: NodeMeta;
}

// App State
export interface AppState {
  selectedWorkshopId: string | null;
  selectedStationId: string | null;
}