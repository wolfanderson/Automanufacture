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
    label: 'Stamping', // L1: 车间名称
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      // --- 在这里新增自定义工位 (L2) ---
      {
        id: 'st-custom-01', // 唯一ID
        label: '✨ Manual Quality Check', // 工位显示名称
        type: NodeType.STATION,
        status: NodeStatus.NORMAL, // 状态: NORMAL, WARNING, CRITICAL, INACTIVE
        children: [
          // --- 在这里新增检测项 (L3) ---
          {
            id: 'insp-visual-01',
            label: 'Surface Scratch Scan',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'High-res camera surface analysis.',
              // 模拟图表数据
              metrics: generateMockMetrics(20, 2),
              // 可选：图片URL
              imgUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
            }
          }
        ]
      },
      // ------------------------------------
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
  },
  {
    id: 'ws-eol',
    label: 'EOL Inspection', // 下线检测
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-aging',
        label: 'Aging Test', // 老化测试
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
        label: 'Dynamic Road Test', // 动态路试
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
        label: 'Intensive Road Test', // 强化路试
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
        label: 'ORT', // ORT
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
        label: 'Pit Inspection', // 地沟检测
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
        label: 'Light Tunnel', // 小黑屋
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
        label: 'Rain Test', // 淋雨线
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
        label: 'CP8/9', // CP8/9
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