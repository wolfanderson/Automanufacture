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
      // 1. 前装主线 (Front Assembly): Z001 - Z078
      {
        id: 'zone-front-main',
        label: '前装主线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'asm-front-z001',
            label: 'Z001', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '上线投产' },
            children: []
           },
           {
            id: 'asm-front-gap-1',
            label: 'Z002-Z053', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-front-z054',
            label: 'Z054', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 }, 
            children: [
                {
                    id: 'insp-z054-harness',
                    label: '智驾域控制器线束检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '智能驾驶域控线束接口连接完整性与锁扣状态AI检测。',
                        metrics: generateMockMetrics(20, 5)
                    }
                },
                {
                    id: 'insp-z054-install',
                    label: '控制器错漏装检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '基于3D点云对比的控制器安装到位与防错检测。',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
          },
          {
            id: 'asm-front-gap-2',
            label: 'Z055-Z077', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-front-z078',
            label: 'Z078', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '前装下线' },
            children: []
           },
        ]
      },

      // 2. 底盘线 (Chassis): Z079 - Z132
      {
        id: 'zone-chassis-main',
        label: '底盘合装线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'asm-chassis-z079',
            label: 'Z079',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '底盘上线' },
            children: [] 
           },
           {
            id: 'asm-chassis-gap-1',
            label: 'Z080-Z089',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z090',
            label: 'Z090',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: [
                {
                    id: 'insp-z090-subframe',
                    label: '副车架自动拧紧检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '副车架关键连接点扭矩与角度实时监控。',
                        metrics: generateMockMetrics(20, 3)
                    }
                },
                {
                    id: 'insp-z090-visual',
                    label: '底盘合装到位检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '基于3D视觉的底盘与车身对合间隙检测。',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-2',
            label: 'Z091-Z114',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z115',
            label: 'Z115',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 },
            children: [
                {
                    id: 'insp-z115-harness',
                    label: '前舱线束检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '前舱线束布局与连接器状态AI视觉检测。',
                        metrics: generateMockMetrics(20, 3)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-3',
            label: 'Z116-Z127',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z128',
            label: 'Z128',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 }, 
            children: [
                {
                    id: 'insp-z128-harness',
                    label: '底盘线束检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '底盘线束走向及卡扣完整性检测。',
                        metrics: generateMockMetrics(20, 4)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-4',
            label: 'Z129-Z131',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z132',
            label: 'Z132',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '流转至后装' },
            children: [] 
           },
        ]
      },

      // 3. 后装线 (Rear): Z133 - Z191
      {
        id: 'zone-rear-main',
        label: '后装主线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
           {
            id: 'asm-rear-z133',
            label: 'Z133', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '后装上线' },
            children: []
           },
           {
            id: 'asm-rear-gap-1',
            label: 'Z134-Z150', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-rear-z151',
            label: 'Z151', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 1 }, 
            children: [
                {
                    id: 'insp-z151-trim',
                    label: '内饰板安装检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: 'C柱内饰板卡扣安装状态检测。',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
           },
           {
             id: 'asm-rear-gap-2',
             label: 'Z152-Z190', 
             type: NodeType.STATION,
             status: NodeStatus.INACTIVE,
             meta: { colSpan: 1, isPlaceholder: true },
             children: []
           },
           {
            id: 'asm-rear-z191',
            label: 'Z191', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, description: '后装下线' },
            children: []
           },
        ]
      },

      // 4. 电池合装线 (Battery): Z192 - Z200
      {
        id: 'zone-battery-main',
        label: '电池合装线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'asm-batt-z192',
                label: 'Z192', 
                type: NodeType.STATION,
                status: NodeStatus.INACTIVE,
                meta: { colSpan: 1, description: '电池合装上线' },
                children: []
            },
            {
                id: 'asm-batt-z196', // Moved from Rear
                label: 'Z196', 
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { colSpan: 1 }, 
                children: [
                    {
                        id: 'insp-z196-roof',
                        label: '全景天幕安装',
                        type: NodeType.INSPECTION,
                        status: NodeStatus.NORMAL,
                        meta: {
                            description: '全景天幕机械臂安装位置度与密封性检测。',
                            metrics: generateMockMetrics(20, 2),
                            imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80'
                        }
                    }
                ]
            },
            {
                id: 'asm-batt-z197', // Moved from Rear
                label: 'Z197', 
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { colSpan: 1 }, 
                children: [
                    {
                        id: 'insp-z197-taillight',
                        label: '尾灯间隙面差检测',
                        type: NodeType.INSPECTION,
                        status: NodeStatus.NORMAL,
                        meta: {
                            description: '贯穿式尾灯与后备箱盖间隙均匀度检测。',
                            metrics: generateMockMetrics(20, 1.5)
                        }
                    }
                ]
            },
            {
                id: 'asm-batt-gap', 
                label: 'Z198', 
                type: NodeType.STATION,
                status: NodeStatus.INACTIVE,
                meta: { colSpan: 1, isPlaceholder: true },
                children: []
            },
            {
                id: 'asm-batt-z199', // Moved from Rear
                label: 'Z199', 
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { colSpan: 1 }, 
                children: [
                    {
                        id: 'insp-z199-seats',
                        label: '后排座椅安装检测',
                        type: NodeType.INSPECTION,
                        status: NodeStatus.NORMAL,
                        meta: {
                            description: '后排座椅滑轨锁止状态与头枕高度自动检测。',
                            metrics: generateMockMetrics(20, 3)
                        }
                    }
                ]
            },
            {
                id: 'asm-batt-z200',
                label: 'Z200', 
                type: NodeType.STATION,
                status: NodeStatus.INACTIVE,
                meta: { colSpan: 1, description: '最终下线' },
                children: []
            },
        ]
      },

      // 5. 分装集成区 (Sub-Assembly)
      {
        id: 'zone-sub-assembly',
        label: '分装集成区',
        type: NodeType.ZONE,
        status: NodeStatus.WARNING,
        children: [
          {
            id: 'asm-powertrain',
            label: '动总分装线', 
            type: NodeType.STATION,
            status: NodeStatus.WARNING,
            meta: { colSpan: 3 }, // Wider
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
          // MODIFIED: Rear Module Line to resemble Door Sub-assembly with FH006 grouping
          {
            id: 'asm-rear-module',
            label: '后模块分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '后模块综合分装' },
            children: [
                {
                    id: 'fh006-01',
                    label: '前保分装', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: 'FH006 前保险杠分装' 
                    },
                    children: [
                        {
                            id: 'insp-fh006-f-harness',
                            label: '线束错漏装检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '前保线束接口、卡扣位置及型号正确性检测。',
                                metrics: generateMockMetrics(20, 3)
                            }
                        }
                    ]
                },
                {
                    id: 'fh006-02',
                    label: '后保分装', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: 'FH006 后保险杠分装' 
                    },
                    children: [
                        {
                            id: 'insp-fh006-r-harness',
                            label: '线束错漏装检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '后保线束走向及雷达传感器连接状态检测。',
                                metrics: generateMockMetrics(20, 4)
                            }
                        }
                    ]
                }
            ]
          },
          // New Group Structure: Chassis Pre-assembly -> DY007 (ColSpan 2)
          {
            id: 'asm-chassis-pre',
            label: '底盘预装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '底盘预装' }, // Width changed to 2
            children: [
                 {
                    id: 'dy007',
                    label: '底盘前/后模块',
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: '底盘预装核心工位' 
                    },
                    children: [
                        {
                            id: 'insp-dy007-front',
                            label: '前零件防错检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '底盘预装线-前部关键零部件防错识别。',
                                metrics: generateMockMetrics(20, 2)
                            }
                        },
                        {
                            id: 'insp-dy007-rear',
                            label: '后零件防错检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '底盘预装线-后部关键零部件防错识别。',
                                metrics: generateMockMetrics(20, 2)
                            }
                        }
                    ]
                 }
            ]
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
          },
          // New Group Structure: Door Sub-assembly -> DR026, DR033 (ColSpan 2)
          {
            id: 'asm-door-sub',
            label: '门分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '门分装' }, // Width changed to 2
            children: [
                {
                    id: 'dr026',
                    label: 'DR026', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: '车门分装检测点A' 
                    },
                    children: [
                        {
                            id: 'insp-dr026-main',
                            label: '车门分装检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '车门内部附件安装完整性检查。',
                                metrics: generateMockMetrics(20, 3)
                            }
                        }
                    ]
                },
                {
                    id: 'dr033',
                    label: 'DR033', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: '车门分装检测点B' 
                    },
                    children: [
                        {
                            id: 'insp-dr033-main',
                            label: '车门饰板检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '车门内饰板安装间隙与平整度检测。',
                                metrics: generateMockMetrics(20, 4)
                            }
                        }
                    ]
                }
            ]
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
      // 1. CP7 调整线
      {
        id: 'zone-eol-cp7',
        label: 'CP7 调整线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-cp7',
                label: 'CP7 调整与返修',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '下线后首道调整工序' },
                children: [
                    { id: 'insp-eol-cp7', label: '整车间隙面差初检', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 2) } }
                ]
            }
        ]
      },
      // 2. 检测线
      {
        id: 'zone-eol-test-line',
        label: '检测线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-test',
                label: '四轮定位与安规测试',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '四轮定位、转鼓、侧滑、制动测试' },
                children: [
                     { id: 'insp-eol-align', label: '四轮定位数据', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 1) } },
                     { id: 'insp-eol-brake', label: '制动力测试', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 2) } }
                ]
            }
        ]
      },
      // 3. 强化路试
      {
        id: 'zone-eol-road-intensive',
        label: '强化路试',
        type: NodeType.ZONE,
        status: NodeStatus.WARNING,
        children: [
             {
                id: 'st-eol-intensive',
                label: '特殊路面测试',
                type: NodeType.STATION,
                status: NodeStatus.WARNING,
                meta: { description: '扭曲路、比利时路、搓板路震动测试' },
                children: [
                    { id: 'insp-suspension', label: '悬挂系统应力监测', type: NodeType.INSPECTION, status: NodeStatus.WARNING, meta: { metrics: generateMockMetrics(20, 15) } }
                ]
             }
        ]
      },
      // 4. ORT
      {
        id: 'zone-eol-ort',
        label: 'ORT 测试',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-ort',
                label: 'ORT 抽检循环',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '持续可靠性与耐久性抽样检测' },
                children: [
                    { id: 'insp-rel', label: '可靠性循环数据', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 2) } }
                ]
            }
        ]
      },
      // 5. 老化/人工检
      {
        id: 'zone-eol-aging',
        label: '老化/人工检',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-aging',
                label: '高压老化与静态检查',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '整车高压系统老化及人工静态外观检查' },
                children: [
                     { id: 'insp-battery', label: '电池放电测试', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 3) } }
                ]
            }
        ]
      },
      // 6. 动态路试
      {
        id: 'zone-eol-road-dyn',
        label: '动态路试',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
             {
                id: 'st-eol-dyn',
                label: '综合道路测试',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '厂区跑道异响（NVH）与动态性能评估' },
                children: [
                     { id: 'insp-nvh', label: 'NVH 频谱分析', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 4) } }
                ]
             }
        ]
      },
      // 7. 地沟检测
      {
        id: 'zone-eol-pit',
        label: '地沟检测',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-pit',
                label: '底盘目视检查',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '底部管路、螺栓、防腐涂层检查' },
                children: [
                    { id: 'insp-leak', label: '底盘防漏液检测', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 1) } }
                ]
            }
        ]
      },
      // 8. 小黑屋
      {
        id: 'zone-eol-dark',
        label: '小黑屋',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
             {
                id: 'st-eol-dark',
                label: '灯光隧道检测',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '灯光光型、亮度及内饰氛围灯检查' },
                children: [
                    { id: 'insp-headlight', label: '大灯校准参数', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 2) } }
                ]
             }
        ]
      },
      // 9. 淋雨线
      {
        id: 'zone-eol-shower',
        label: '淋雨线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
             {
                id: 'st-eol-shower',
                label: '高压淋雨测试',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '模拟暴雨环境检测整车密封性' },
                children: [
                    { id: 'insp-seal', label: '湿度传感器阵列', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 4) } }
                ]
             }
        ]
      },
      // 10. CP8/9 终检
      {
        id: 'zone-eol-cp89',
        label: 'CP8/9 终检',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-cp89',
                label: '最终验收与合格证打印',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '全车整备、最终质量门验收及发运' },
                children: [
                    { id: 'insp-final', label: 'VES 综合评分', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 1) } }
                ]
            }
        ]
      }
    ]
  }
];