import { ProcessNode, NodeType, NodeStatus } from './types';

const generateMockMetrics = (count: number, volatility: number) => {
  return Array.from({ length: count }, (_, i) => ({
    time: `10:${i < 10 ? '0' + i : i}`,
    value: 80 + Math.random() * volatility,
    expected: 85
  }));
};

// Helper to generate stations INSIDE a line (L3 items)
const generateLineStations = (prefix: string, count: number): ProcessNode[] => {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random();
    let status = NodeStatus.NORMAL;
    if (r > 0.96) status = NodeStatus.CRITICAL;
    else if (r > 0.9) status = NodeStatus.WARNING;
    
    // In this model, these are children of the L2 "Line" node.
    // They are technically L3 but we treat them as individual stations with metrics.
    return {
        id: `${prefix}-op-${(i + 1) * 10}`,
        label: `OP-${(i + 1) * 10} Assembly Task`,
        type: NodeType.INSPECTION, // Use INSPECTION type so they appear in the right sidebar list
        status: status,
        meta: {
            description: `Automated assembly operation ${(i+1)*10}`,
            metrics: generateMockMetrics(20, 10),
            // Randomly assign an image to some
            imgUrl: r > 0.7 ? 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=400&q=80' : undefined
        }
    };
  });
};

// Helper to generate many stations (legacy L2 style)
const generateBulkStations = (prefix: string, count: number): ProcessNode[] => {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random();
    let status = NodeStatus.NORMAL;
    if (r > 0.95) status = NodeStatus.CRITICAL;
    else if (r > 0.85) status = NodeStatus.WARNING;
    else if (r > 0.8) status = NodeStatus.INACTIVE;

    return {
      id: `${prefix}-${i + 1}`,
      label: `Station ${prefix.toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
      type: NodeType.STATION,
      status: status,
      children: [
        {
          id: `${prefix}-${i + 1}-insp-1`,
          label: 'Primary AI Check',
          type: NodeType.INSPECTION,
          status: status === NodeStatus.INACTIVE ? NodeStatus.INACTIVE : status,
          meta: {
            description: 'Automated visual inspection point.',
            metrics: generateMockMetrics(15, status === NodeStatus.CRITICAL ? 25 : 5)
          }
        },
        {
          id: `${prefix}-${i + 1}-insp-2`,
          label: 'Sensor Telemetry',
          type: NodeType.INSPECTION,
          status: NodeStatus.NORMAL,
          meta: {
            description: 'IoT sensor data stream.',
            metrics: generateMockMetrics(15, 2)
          }
        }
      ]
    };
  });
};

export const MOCK_DATA: ProcessNode[] = [
  {
    id: 'ws-stamping',
    label: 'Stamping', 
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-custom-01', 
        label: '✨ Manual Quality Check', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL, 
        children: [
          {
            id: 'insp-visual-01',
            label: 'Surface Scratch Scan',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'High-res camera surface analysis.',
              metrics: generateMockMetrics(20, 2),
              imgUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
            }
          }
        ]
      },
      {
        id: 'st-metal-feed',
        label: 'Sheet Metal Feed',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-thickness',
            label: 'Thickness Gauge',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'Laser measurement of sheet metal thickness.',
              metrics: generateMockMetrics(20, 5)
            }
          }
        ]
      },
      {
        id: 'st-press-A',
        label: 'Press Line A',
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'insp-pressure',
            label: 'Pressure Monitor',
            type: NodeType.INSPECTION,
            status: NodeStatus.WARNING,
            meta: {
              description: 'Real-time hydraulic pressure monitoring.',
              metrics: generateMockMetrics(20, 15)
            }
          }
        ]
      },
      ...generateBulkStations('stamp', 18) 
    ]
  },
  {
    id: 'ws-welding',
    label: 'Welding',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-door-install',
        label: 'Door Frame Install',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-gap-check',
            label: 'Gap & Flush AI Check',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'AI Vision system detecting gap variances.',
              metrics: generateMockMetrics(20, 2),
              imgUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80'
            }
          },
          {
            id: 'insp-spot-weld',
            label: 'Spot Weld Integrity',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'Ultrasonic testing of weld points.',
              metrics: generateMockMetrics(20, 3)
            }
          }
        ]
      },
      ...generateBulkStations('weld', 45)
    ]
  },
  {
    id: 'ws-painting',
    label: 'Painting',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
        {
        id: 'st-primer',
        label: 'Electrophoresis',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
             {
            id: 'insp-ph-level',
            label: 'Tank pH Level',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'Chemical bath acidity monitoring.',
              metrics: generateMockMetrics(20, 1)
            }
          }
        ]
        },
        ...generateBulkStations('paint', 30)
    ]
  },
  {
    id: 'ws-assembly',
    label: 'Assembly',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL, // Override critical for now
    children: [
      // --- Top Row: Sub-assemblies ---
      {
        id: 'asm-rear-drive',
        label: 'Rear Drive Sub-Assy', // 后驱分装线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('rd', 5)
      },
      {
        id: 'asm-front-drive',
        label: 'Front Drive Sub-Assy', // 前驱分装线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('fd', 5)
      },
      {
        id: 'asm-powertrain',
        label: 'Powertrain Line', // 动总分装线
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        meta: { colSpan: 2 }, // Wider
        children: generateLineStations('pt', 12)
      },
      {
        id: 'asm-rear-module',
        label: 'Rear Module Sub', // 后模块分装线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('rm', 6)
      },
       {
        id: 'asm-chassis-pre',
        label: 'Chassis Pre-Assy', // 底盘预装线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('cpre', 8)
      },
      // --- Row 2: Chassis Lines (Full width style) ---
      {
        id: 'asm-chassis-1',
        label: 'Chassis Line 1', // 底盘1线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 4 }, // Takes full row on medium screens
        children: generateLineStations('cl1', 18)
      },
      {
        id: 'asm-chassis-2',
        label: 'Chassis Line 2', // 底盘2线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 4 },
        children: generateLineStations('cl2', 18)
      },
      // --- Row 3: Door & Front ---
      {
        id: 'asm-door',
        label: 'Door Line', // 车门线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 2 },
        children: generateLineStations('door', 15)
      },
      {
        id: 'asm-windshield',
        label: 'Windshield Glazing', // 风挡涂胶
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('wsg', 4)
      },
       {
        id: 'asm-front-4',
        label: 'Front Assy Line 4', // 前装4线
        type: NodeType.STATION,
        status: NodeStatus.CRITICAL,
        meta: { colSpan: 3 },
        children: generateLineStations('fa4', 20)
      },
      // --- Row 4: Front & Sub ---
      {
        id: 'asm-roof',
        label: 'Pano Roof', // 天幕涂胶
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('prf', 3)
      },
      {
        id: 'asm-heat-pump',
        label: 'Heat Pump', // 热泵分装
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('hp', 5)
      },
      {
        id: 'asm-front-3',
        label: 'Front Assy Line 3', // 前装3线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 3 },
        children: generateLineStations('fa3', 20)
      },
      {
        id: 'asm-ip',
        label: 'IP Sub-Assy', // IP分装线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 1 },
        children: generateLineStations('ip', 8)
      },
      // --- Row 5: Front/Rear ---
      {
        id: 'asm-front-2',
        label: 'Front Assy Line 2', // 前装2线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 3 },
        children: generateLineStations('fa2', 20)
      },
      {
        id: 'asm-front-1',
        label: 'Front Assy Line 1', // 前装1线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 3 },
        children: generateLineStations('fa1', 20)
      },
      // --- Row 6: Rear ---
      {
        id: 'asm-rear-1',
        label: 'Rear Assy Line 1', // 后装1线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 3 },
        children: generateLineStations('ra1', 15)
      },
      {
        id: 'asm-rear-2',
        label: 'Rear Assy Line 2', // 后装2线
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: { colSpan: 3 },
        children: generateLineStations('ra2', 15)
      },
      // --- Aux ---
      {
        id: 'asm-supply',
        label: 'Supply Room', // 辅房
        type: NodeType.STATION,
        status: NodeStatus.INACTIVE,
        meta: { colSpan: 6 },
        children: []
      }
    ]
  },
  {
    id: 'ws-eol',
    label: 'EOL Inspection', 
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-aging',
        label: 'Aging Test', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-battery',
            label: 'Battery Discharge',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'HV Battery load test cycle.', metrics: generateMockMetrics(20, 3) }
           }
        ]
      },
      {
        id: 'st-dyn-road',
        label: 'Dynamic Road Test',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-nvh',
            label: 'NVH Analysis',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Noise, vibration, and harshness metrics.', metrics: generateMockMetrics(20, 5) }
          }
        ]
      },
      {
        id: 'st-intensive-road',
        label: 'Intensive Road Test',
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'insp-suspension',
            label: 'Suspension Check',
            type: NodeType.INSPECTION,
            status: NodeStatus.WARNING,
            meta: { description: 'Shock absorber thermal stress data.', metrics: generateMockMetrics(20, 15) }
           }
        ]
      },
      {
        id: 'st-ort',
        label: 'ORT',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-rel',
            label: 'Reliability Cycle',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Continuous operation stress testing.', metrics: generateMockMetrics(20, 2) }
           }
        ]
      },
      {
        id: 'st-pit',
        label: 'Pit Inspection', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-leak',
            label: 'Fluid Leak Check',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Undercarriage visual fluid inspection.', metrics: generateMockMetrics(20, 1) }
           }
        ]
      },
      {
        id: 'st-dark-room',
        label: 'Light Tunnel',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-headlight',
            label: 'Headlight Aim',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Matrix LED projection alignment.', metrics: generateMockMetrics(20, 2) }
           }
        ]
      },
      {
        id: 'st-shower',
        label: 'Rain Test',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-seal',
            label: 'Cabin Sealing',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Humidity sensor array reading.', metrics: generateMockMetrics(20, 4) }
           }
        ]
      },
      {
        id: 'st-cp89',
        label: 'CP8/9', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-final',
            label: 'Final Buy-off',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: 'Complete vehicle digital sign-off.', metrics: generateMockMetrics(20, 1) }
           }
        ]
      }
    ]
  }
];