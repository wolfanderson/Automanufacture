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
        label: `OP-${(i + 1) * 10} 装配任务`,
        type: NodeType.INSPECTION, // Use INSPECTION type so they appear in the right sidebar list
        status: status,
        meta: {
            description: `自动化装配工序 #${(i+1)*10}`,
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
      label: `工位 ${prefix.toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
      type: NodeType.STATION,
      status: status,
      children: [
        {
          id: `${prefix}-${i + 1}-insp-1`,
          label: '主 AI 视觉检测',
          type: NodeType.INSPECTION,
          status: status === NodeStatus.INACTIVE ? NodeStatus.INACTIVE : status,
          meta: {
            description: '自动化视觉外观检查点。',
            metrics: generateMockMetrics(15, status === NodeStatus.CRITICAL ? 25 : 5)
          }
        },
        {
          id: `${prefix}-${i + 1}-insp-2`,
          label: '传感器遥测数据',
          type: NodeType.INSPECTION,
          status: NodeStatus.NORMAL,
          meta: {
            description: 'IoT 物联网传感器实时流。',
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
    label: '冲压车间', 
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-custom-01', 
        label: '✨ 人工质检站', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL, 
        children: [
          {
            id: 'insp-visual-01',
            label: '表面划痕扫描',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: '高清工业相机表面缺陷分析。',
              metrics: generateMockMetrics(20, 2),
              imgUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80'
            }
          }
        ]
      },
      {
        id: 'st-metal-feed',
        label: '板材上料区',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-thickness',
            label: '厚度检测规',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: '激光实时测量板材厚度。',
              metrics: generateMockMetrics(20, 5)
            }
          }
        ]
      },
      {
        id: 'st-press-A',
        label: '冲压 A 线',
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'insp-pressure',
            label: '压力监控',
            type: NodeType.INSPECTION,
            status: NodeStatus.WARNING,
            meta: {
              description: '液压机实时压力数值监控。',
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
    label: '焊装车间',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-door-install',
        label: '门框安装工位',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-gap-check',
            label: '间隙面差 AI 检测',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: 'AI 视觉系统自动检测安装间隙偏差。',
              metrics: generateMockMetrics(20, 2),
              imgUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=800&q=80'
            }
          },
          {
            id: 'insp-spot-weld',
            label: '焊点完整性检测',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: '关键结构焊点超声波探伤。',
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
    label: '涂装车间',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
        {
        id: 'st-primer',
        label: '电泳池',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
             {
            id: 'insp-ph-level',
            label: '槽液 pH 值',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: {
              description: '电泳槽化学酸碱度实时监测。',
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
    label: '总装车间',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL, 
    children: [
      // 1. 分装集成区 (Zone)
      {
        id: 'zone-sub-assembly',
        label: '分装集成区 (Sub-Assembly Area)',
        type: NodeType.ZONE,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'asm-powertrain',
            label: '动总分装线', 
            type: NodeType.STATION,
            status: NodeStatus.WARNING,
            meta: { colSpan: 2 }, 
            children: generateLineStations('pt', 12)
          },
          {
            id: 'asm-rear-drive',
            label: '后驱分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('rd', 5)
          },
          {
            id: 'asm-front-drive',
            label: '前驱分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('fd', 5)
          },
          {
            id: 'asm-rear-module',
            label: '后模块分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('rm', 6)
          },
          {
            id: 'asm-heat-pump',
            label: '热泵分装', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('hp', 5)
          },
          {
            id: 'asm-ip',
            label: '仪表台分装', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('ip', 8)
          },
          {
            id: 'asm-chassis-pre',
            label: '底盘预装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: generateLineStations('cpre', 8)
          },
        ]
      },

      // 2. 前装主线 (Zone)
      {
        id: 'zone-front-main',
        label: '前装主线 (Front Assembly)',
        type: NodeType.ZONE,
        status: NodeStatus.CRITICAL,
        children: [
           {
            id: 'asm-front-1',
            label: '前装 1 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('fa1', 20)
          },
          {
            id: 'asm-front-2',
            label: '前装 2 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('fa2', 20)
          },
          {
            id: 'asm-front-3',
            label: '前装 3 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('fa3', 20)
          },
          {
            id: 'asm-front-4',
            label: '前装 4 线', 
            type: NodeType.STATION,
            status: NodeStatus.CRITICAL,
            meta: { colSpan: 2 },
            children: generateLineStations('fa4', 20)
          },
          {
            id: 'asm-windshield',
            label: '风挡涂胶', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: [
                {
                    id: 'insp-wsg-primer',
                    label: '玻璃底涂动作检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '机械臂自动进行玻璃底涂涂抹动作监控与轨迹分析。',
                        metrics: generateMockMetrics(20, 2),
                        imgUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc7471?auto=format&fit=crop&w=800&q=80'
                    }
                }
            ]
          },
          {
            id: 'asm-roof',
            label: '天幕涂胶', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: [
                {
                    id: 'insp-prf-primer',
                    label: '玻璃底涂动作检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '天幕玻璃底涂动作执行情况实时监控。',
                        metrics: generateMockMetrics(20, 2),
                        imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
                    }
                }
            ]
          }
        ]
      },

      // 3. 底盘线 (Zone)
      {
        id: 'zone-chassis-main',
        label: '底盘合装线 (Chassis Marriage)',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'asm-chassis-1',
            label: '底盘 1 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 4 }, 
            children: generateLineStations('cl1', 18)
          },
          {
            id: 'asm-chassis-2',
            label: '底盘 2 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 4 },
            children: generateLineStations('cl2', 18)
          },
        ]
      },

      // 4. 后装线 (Zone)
      {
        id: 'zone-rear-main',
        label: '后装主线 (Rear Assembly)',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'asm-door',
            label: '车门线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('door', 15)
          },
          {
            id: 'asm-rear-1',
            label: '后装 1 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('ra1', 15)
          },
          {
            id: 'asm-rear-2',
            label: '后装 2 线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2 },
            children: generateLineStations('ra2', 15)
          },
          {
            id: 'asm-supply',
            label: '辅房/物料区', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 2 },
            children: []
          }
        ]
      }
    ]
  },
  {
    id: 'ws-eol',
    label: '下线检测', 
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-aging',
        label: '老化测试', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-battery',
            label: '电池放电测试',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '高压电池负载循环测试数据。', metrics: generateMockMetrics(20, 3) }
           }
        ]
      },
      {
        id: 'st-dyn-road',
        label: '动态路试',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-nvh',
            label: 'NVH 分析',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '噪音、振动与声振粗糙度指标分析。', metrics: generateMockMetrics(20, 5) }
          }
        ]
      },
      {
        id: 'st-intensive-road',
        label: '强化路试',
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'insp-suspension',
            label: '悬挂系统检测',
            type: NodeType.INSPECTION,
            status: NodeStatus.WARNING,
            meta: { description: '减震器热应力与耐久性数据。', metrics: generateMockMetrics(20, 15) }
           }
        ]
      },
      {
        id: 'st-ort',
        label: 'ORT 测试',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-rel',
            label: '可靠性循环',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '持续运行压力测试与故障率分析。', metrics: generateMockMetrics(20, 2) }
           }
        ]
      },
      {
        id: 'st-pit',
        label: '地沟检测', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-leak',
            label: '底盘测漏',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '底盘管路液体泄漏目视检查。', metrics: generateMockMetrics(20, 1) }
           }
        ]
      },
      {
        id: 'st-dark-room',
        label: '灯光隧道',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
          {
            id: 'insp-headlight',
            label: '大灯校准',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '矩阵 LED 大灯投影角度校准。', metrics: generateMockMetrics(20, 2) }
           }
        ]
      },
      {
        id: 'st-shower',
        label: '淋雨线',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-seal',
            label: '驾驶室密封性',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '车内湿度传感器阵列读数。', metrics: generateMockMetrics(20, 4) }
           }
        ]
      },
      {
        id: 'st-cp89',
        label: 'CP8/9 终检', 
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'insp-final',
            label: '最终验收',
            type: NodeType.INSPECTION,
            status: NodeStatus.NORMAL,
            meta: { description: '整车各项指标数字签收。', metrics: generateMockMetrics(20, 1) }
           }
        ]
      }
    ]
  }
];