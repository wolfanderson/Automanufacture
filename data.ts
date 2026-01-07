import { ProcessNode, NodeType, NodeStatus } from './types';

const generateMockMetrics = (count: number, volatility: number) => {
  return Array.from({ length: count }, (_, i) => ({
    time: `10:${i < 10 ? '0' + i : i}`,
    value: 80 + Math.random() * volatility,
    expected: 85
  }));
};

// Helper to generate many stations
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
      ...generateBulkStations('stamp', 18) // Add some bulk for testing
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
              imgUrl: 'https://picsum.photos/600/400'
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
    status: NodeStatus.CRITICAL,
    children: [
      {
        id: 'st-engine-mount',
        label: 'Engine Marriage',
        type: NodeType.STATION,
        status: NodeStatus.CRITICAL,
        children: [
           {
            id: 'insp-torque',
            label: 'Bolt Torque Data',
            type: NodeType.INSPECTION,
            status: NodeStatus.CRITICAL,
            meta: {
              description: 'Automated nutrunner torque values.',
              metrics: generateMockMetrics(20, 30) 
            }
          }
        ]
      },
      ...generateBulkStations('asm', 148) // HUGE dataset for Assembly
    ]
  }
];