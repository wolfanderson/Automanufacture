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
    id: 'ws-casting',
    label: '压铸车间',
    type: NodeType.WORKSHOP,
    status: NodeStatus.NORMAL,
    children: [
      {
        id: 'st-cast-island',
        label: '一体化压铸岛',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
            description: '9000T 超大型一体化压铸机群'
        },
        children: [
           { id: 'insp-cast-param', label: '压射参数监控', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: '实时监控压射速度、压力、模温数据。', metrics: generateMockMetrics(20, 5) } }
        ]
      },
      {
        id: 'st-cast-integrity',
        label: '完整性检测',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
             description: 'AI 辅助铸件完整性扫描'
        },
        children: [
             { id: 'insp-cast-integrity', label: '铸件完整性', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: '铸件轮廓及溢流渣包完整性视觉检测。', metrics: generateMockMetrics(20, 2) } }
        ]
      },
      {
        id: 'st-cast-visual',
        label: '视觉外观检测',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
            description: '高精度机械臂视觉检测'
        },
        children: [
             { id: 'insp-cast-visual-ai', label: '外观缺陷AI', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: 'AI识别裂纹、冷隔、气泡等表面缺陷。', metrics: generateMockMetrics(20, 4) } }
        ]
      },
      {
        id: 'st-cast-dim',
        label: '尺寸检测',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
            description: '在线激光尺寸测量'
        },
        children: [
             { id: 'insp-cast-dim-laser', label: '激光在线测量', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: '关键安装点及面轮廓度激光测量。', metrics: generateMockMetrics(20, 1) } }
        ]
      },
      {
        id: 'st-cast-xray',
        label: '内部探伤检测',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
            description: '工业 X-Ray 探伤柜'
        },
        children: [
             { id: 'insp-cast-xray', label: 'X-Ray探伤', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: 'X射线透视检测内部缩孔、气孔缺陷。', metrics: generateMockMetrics(20, 3) } }
        ]
      },
      {
        id: 'st-cast-cnc',
        label: '机加工中心',
        type: NodeType.STATION,
        status: NodeStatus.WARNING,
        meta: {
            description: 'G-V1530B 精密加工中心'
        },
        children: [
             { id: 'insp-cast-cnc-proc', label: '加工精度监控', type: NodeType.INSPECTION, status: NodeStatus.WARNING, meta: { description: '机加工尺寸精度及刀具状态实时监控。', metrics: generateMockMetrics(20, 12) } }
        ]
      },
      {
        id: 'st-cast-assembly-verify',
        label: '视觉错漏装检测',
        type: NodeType.STATION,
        status: NodeStatus.NORMAL,
        meta: {
            description: '嵌件安装视觉复核'
        },
        children: [
             { id: 'insp-cast-assembly', label: '嵌件检测', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { description: '螺柱、螺母等嵌件错漏装视觉复核。', metrics: generateMockMetrics(20, 0) } }
        ]
      }
    ]
  },
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
      // 0. 分装集成区 (Sub-Assembly) - Cleaned up and flattened to 10 cols
      {
        id: 'zone-sub-assembly',
        label: '分装集成区',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL, // Changed to NORMAL as inactive items are removed
        children: [
          // 1. Powertrain (Col 2)
          {
            id: 'asm-powertrain',
            label: '动总分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL, 
            meta: { colSpan: 2, description: '动力总成综合分装' },
            children: [
                {
                    id: 'dy002',
                    label: '空簧&螺簧分装',
                    type: NodeType.STATION,
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: 'DY002 空簧螺簧分装',
                        inspectionObject: '进气软管',
                        inspectionMethod: '手机拍照'
                    },
                    children: [
                         {
                            id: 'insp-dy002-visual',
                            label: '软管外观检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '人工使用手机拍照上传，AI辅助判定软管位置。',
                                metrics: generateMockMetrics(20, 2)
                            }
                         }
                    ]
                }
            ]
          },
          // 2. Rear Module (Col 2)
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
                    type: NodeType.STATION,
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
                    type: NodeType.STATION,
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
          // 3. Chassis Pre-assembly (Col 2)
          {
            id: 'asm-chassis-pre',
            label: '底盘预装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '底盘预装' },
            children: [
                 {
                    id: 'dy007',
                    label: '底盘前/后模块',
                    type: NodeType.STATION,
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
          // 4. Glue Line (Combined) (Col 2)
          {
            id: 'asm-glue-line',
            label: '涂胶线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '玻璃涂胶集成' }, // Combined colSpan 2
            children: [
                {
                    id: 'asm-windshield',
                    label: '风挡涂胶', 
                    type: NodeType.STATION, // Inner
                    status: NodeStatus.NORMAL,
                    meta: { },
                    children: [
                        {
                            id: 'insp-wsg-primer',
                            label: '玻璃底涂动作检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '机械臂自动进行玻璃底涂涂抹动作监控与轨迹分析。',
                                metrics: generateMockMetrics(20, 2)
                            }
                        }
                    ]
                },
                {
                    id: 'asm-roof',
                    label: '天幕涂胶', 
                    type: NodeType.STATION, // Inner
                    status: NodeStatus.NORMAL,
                    meta: { },
                    children: [
                        {
                            id: 'insp-prf-primer',
                            label: '玻璃底涂动作检测',
                            type: NodeType.INSPECTION,
                            status: NodeStatus.NORMAL,
                            meta: {
                                description: '天幕玻璃底涂动作执行情况实时监控。',
                                metrics: generateMockMetrics(20, 2)
                            }
                        }
                    ]
                }
            ]
          },
          // 5. Door Sub-assembly (Col 2)
          {
            id: 'asm-door-sub',
            label: '门分装线', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { colSpan: 2, description: '门分装' },
            children: [
                {
                    id: 'dr026',
                    label: '裸车门', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: '车门分装检测点A',
                        inspectionMethod: '机械臂拍照检测'
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
                    label: '饰板车门', 
                    type: NodeType.STATION, // Inner station
                    status: NodeStatus.NORMAL,
                    meta: { 
                        description: '车门分装检测点B' ,
                        inspectionMethod: '机械臂拍照检测'
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
      },

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
            id: 'asm-front-gap-1a',
            label: 'Z002-Z035', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-front-z036',
            label: '室内地板线束',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: {
                colSpan: 2, // Stretched
                inspectionObject: '室内地板线束走向、卡扣',
                inspectionMethod: '手机拍照检测'
            },
            children: [
                {
                    id: 'insp-z036-visual',
                    label: '线束外观检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '室内地板线束铺设路径与固定点检查',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
           },
           {
            id: 'asm-front-gap-1b',
            label: 'Z037-Z053',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-front-z054',
            label: '智驾域控安装', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { 
                colSpan: 2, // Stretched
                inspectionObject: '域控制器主体、散热背板、接地线',
                inspectionMethod: '固定相机视觉检测'
            }, 
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
            label: 'Z055-Z076', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-front-z077',
            label: '前舱线束安装', 
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { 
                colSpan: 2, // Stretched
                inspectionObject: '前舱主线束、大灯接口、ABS泵插头',
                inspectionMethod: '固定相机拍照检测'
            }, 
            children: [
                {
                    id: 'insp-z077-harness',
                    label: '线束连接检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '前舱线束关键接插件连接状态与布线规范性检测。',
                        metrics: generateMockMetrics(20, 3)
                    }
                }
            ]
           },
           {
            id: 'asm-front-z078',
            label: 'Z078', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 2, description: '前装下线' }, // Stretched to align right (total 12)
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
            label: 'Z080-Z103',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z104',
            label: '底盘线束安装',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { 
                colSpan: 1,
                inspectionObject: '底盘主线束走向、EPB插头、轮速传感器线缆',
                inspectionMethod: '固定相机拍照检测'
            },
            children: [
                {
                    id: 'insp-z104-harness',
                    label: '底盘线束检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '底盘线束走向、卡扣完整性及接插件锁止状态检测。',
                        metrics: generateMockMetrics(20, 3)
                    }
                },
                {
                    id: 'insp-z104-routing',
                    label: '管路干涉检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '线束与周边制动管路、冷却管路间隙干涉风险排查。',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-2a',
            label: 'Z105-Z107',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: [] 
           },
           {
            id: 'asm-chassis-z108',
            label: '空调线束总成',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: {
                colSpan: 1,
                inspectionObject: '空调线束接插件、固定卡扣',
                inspectionMethod: '手机拍照检测'
            },
            children: [
                {
                    id: 'insp-z108-conn',
                    label: '接插件连接检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '空调线束关键接口连接状态',
                        metrics: generateMockMetrics(20, 3)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-2b',
            label: 'Z109-Z111',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-chassis-z112',
            label: '储气罐',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: {
                colSpan: 1,
                inspectionObject: '储气罐安装位置、气管连接',
                inspectionMethod: '手机拍照检测'
            },
            children: [
                {
                    id: 'insp-z112-install',
                    label: '储气罐安装检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '储气罐固定螺栓与气管接口检查',
                        metrics: generateMockMetrics(20, 2)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-2c',
            label: 'Z113-Z116',
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-chassis-z117',
            label: '高压电加热器',
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: {
                colSpan: 1,
                inspectionObject: '电加热器本体、高压线束',
                inspectionMethod: '手机拍照检测'
            },
            children: [
                {
                    id: 'insp-z117-hv',
                    label: '高压接口检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '高压线束橙色互锁接插件状态确认',
                        metrics: generateMockMetrics(20, 4)
                    }
                }
            ]
           },
           {
            id: 'asm-chassis-gap-2d',
            label: 'Z118-Z131',
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
            label: 'Z134-Z141', 
            type: NodeType.STATION,
            status: NodeStatus.INACTIVE,
            meta: { colSpan: 1, isPlaceholder: true },
            children: []
           },
           {
            id: 'asm-rear-z142',
            label: '压缩机', // Updated label
            type: NodeType.STATION,
            status: NodeStatus.NORMAL,
            meta: { 
                colSpan: 1,
                inspectionObject: '压缩机安装、皮带/高压线', // Updated info
                inspectionMethod: '手机拍照检测'
            }, 
            children: [
                {
                    id: 'insp-z142-mount',
                    label: '压缩机安装检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '压缩机固定与管路连接状态',
                        metrics: generateMockMetrics(20, 2)
                    }
                },
                {
                    id: 'insp-z142-conn', // Keep/Modify existing child ID structure
                    label: '管路连接检测',
                    type: NodeType.INSPECTION,
                    status: NodeStatus.NORMAL,
                    meta: {
                        description: '压缩机进排气管路及电连接检测。',
                        metrics: generateMockMetrics(20, 3)
                    }
                }
            ]
           },
           {
             id: 'asm-rear-gap-2',
             label: 'Z143-Z190', 
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
                label: '电池包输送1', 
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
                label: '电池包输送2', 
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
                label: '底盘高压线束', 
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { 
                    colSpan: 1,
                    inspectionObject: '高低压线束接插件、前底盘护板和后保险杠螺栓',
                    inspectionMethod: '机械臂拍照检测'
                }, 
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
            { id: 'eol-cp7-gap', label: '间隙检查&后门槛安装', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '车身间隙、后门槛饰板', inspectionMethod: '间隙尺 & 扭矩枪' }, children: [] },
            { id: 'eol-cp7-fill', label: '加注', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '冷却液、制动液、洗涤液', inspectionMethod: '自动加注机数据互联' }, children: [] },
            { id: 'eol-cp7-elec', label: '电检', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '整车控制器、ECU/TCU', inspectionMethod: 'OBD诊断仪自动扫描' }, children: [] },
            { id: 'eol-cp7-func', label: '基础功能检查', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '雨刮、喇叭、车窗升降', inspectionMethod: '人工操作确认' }, children: [] },
            { id: 'eol-cp7-flush', label: '间隙面差检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '四门两盖匹配度', inspectionMethod: '激光面差仪' }, children: [] },
            { id: 'eol-cp7-ext', label: '外观检测', type: NodeType.STATION, status: NodeStatus.WARNING, meta: { inspectionObject: '漆面划痕、凹陷', inspectionMethod: '高亮光廊目视' }, children: [] },
            { id: 'eol-cp7-int', label: '内饰检查', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '座椅、仪表台、顶棚', inspectionMethod: '人工目视 & 触摸' }, children: [] },
            { id: 'eol-cp7-phone', label: '手机映射', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: 'CarPlay / Carlife 连接', inspectionMethod: '实机连接测试' }, children: [] },
            { id: 'eol-cp7-frunk', label: '前舱检查', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '前备箱盖锁止、内衬', inspectionMethod: '人工检查' }, children: [] },
            { id: 'eol-cp7-trim', label: '外饰检查', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '字标、饰条、轮眉', inspectionMethod: '视觉对比' }, children: [] },
            { id: 'eol-cp7-charge', label: '快慢充检查', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '交/直流充电口功能', inspectionMethod: '模拟充电桩测试' }, children: [] },
        ]
      },
      // 2. 检测线
      {
        id: 'zone-eol-test-line',
        label: '检测线',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            { id: 'eol-test-bump', label: '颠簸路', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '底盘异响、减震器功能', inspectionMethod: '特定路谱行驶' }, children: [] },
            { id: 'eol-test-align', label: '四轮调整', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '前束角、外倾角', inspectionMethod: '3D四轮定位仪' }, children: [] },
            { id: 'eol-test-light', label: '大灯检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '近光/远光切线、亮度', inspectionMethod: '自动大灯检测仪' }, children: [] },
            { id: 'eol-test-slip', label: '侧滑测试', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '车轮侧滑量', inspectionMethod: '侧滑试验台' }, children: [] },
            { id: 'eol-test-dyno', label: '转毂测试', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '加速、制动、ABS功能', inspectionMethod: '底盘测功机' }, children: [] },
            { id: 'eol-test-radar', label: 'ADS雷达标定', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '毫米波/激光雷达角度', inspectionMethod: '多普勒模拟器标定' }, children: [] },
            { id: 'eol-test-cam', label: '整车相机标定', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '环视/智驾摄像头参数', inspectionMethod: '标定房靶标识别' }, children: [] },
        ]
      },
      // 3. 小黑屋 (Moved UP to share row with Test Line)
      {
        id: 'zone-eol-dark',
        label: '小黑屋',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
             { id: 'eol-dark-chassis', label: '底盘AI划伤检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '底盘护板、电池包底部', inspectionMethod: '线扫相机AI识别' }, children: [] },
             { id: 'eol-dark-sound', label: '异响AI检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '整车动态异响', inspectionMethod: '声学阵列分析' }, children: [] },
             { id: 'eol-dark-proj', label: '投影大灯检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: 'DLP投影图案清晰度', inspectionMethod: '高动态工业相机' }, children: [] },
        ]
      },
      // 4. 强化路试
      {
        id: 'zone-eol-road-intensive',
        label: '强化路试',
        type: NodeType.ZONE,
        status: NodeStatus.WARNING,
        children: [
             {
                id: 'st-eol-intensive',
                label: '强化路试',
                type: NodeType.STATION,
                status: NodeStatus.WARNING,
                meta: { description: '扭曲路、比利时路、搓板路震动测试' },
                children: [
                    { id: 'insp-suspension', label: '悬挂系统应力监测', type: NodeType.INSPECTION, status: NodeStatus.WARNING, meta: { metrics: generateMockMetrics(20, 15) } }
                ]
             }
        ]
      },
      // 5. ORT
      {
        id: 'zone-eol-ort',
        label: 'ORT 测试',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-ort',
                label: 'ORT 测试',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '持续可靠性与耐久性抽样检测' },
                children: [
                    { id: 'insp-rel', label: '可靠性循环数据', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 2) } }
                ]
            }
        ]
      },
      // 6. 老化/人工检
      {
        id: 'zone-eol-aging',
        label: '老化/人工检',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-aging',
                label: '老化测试/人工检',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '整车电气系统老化及人工点检' },
                children: [
                     { id: 'insp-battery', label: '老化测试', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 3) } }
                ]
            }
        ]
      },
      // 7. 动态路试
      {
        id: 'zone-eol-road-dyn',
        label: '动态路试',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
             {
                id: 'st-eol-dyn',
                label: '动态路试',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '厂区跑道异响（NVH）与动态性能评估' },
                children: [
                     { id: 'insp-nvh', label: 'NVH 频谱分析', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 4) } }
                ]
             }
        ]
      },
      // 8. 地沟检测
      {
        id: 'zone-eol-pit',
        label: '地沟检测',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            {
                id: 'st-eol-pit',
                label: '地沟检测',
                type: NodeType.STATION,
                status: NodeStatus.NORMAL,
                meta: { description: '底部管路、螺栓、防腐涂层检查' },
                children: [
                    { id: 'insp-leak', label: '底盘防漏液检测', type: NodeType.INSPECTION, status: NodeStatus.NORMAL, meta: { metrics: generateMockMetrics(20, 1) } }
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
             { id: 'eol-show-ambient', label: '淋雨检测 （氛围灯检测）', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '全车氛围灯颜色/亮度', inspectionMethod: '暗室视觉检测' }, children: [] },
             { id: 'eol-show-iso', label: '绝缘检测（安规）', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '高压系统绝缘阻值', inspectionMethod: '安规测试仪' }, children: [] },
             { id: 'eol-show-rain', label: '淋雨检验', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '天窗、车门、涉水密封性', inspectionMethod: '高压喷淋' }, children: [] },
        ]
      },
      // 10. CP8/9 终检
      {
        id: 'zone-eol-cp89',
        label: 'CP8/9 终检',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            { id: 'eol-cp8-elec', label: '电检', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '休眠电流、故障码清除', inspectionMethod: '最终OBD检测' }, children: [] },
            { id: 'eol-cp8-final', label: '外饰内饰检测', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '最终整车外观/内饰状态', inspectionMethod: '人工检测' }, children: [] },
            { id: 'eol-cp8-cert', label: '合格证&随车卡', type: NodeType.STATION, status: NodeStatus.NORMAL, meta: { inspectionObject: '车辆一致性证书', inspectionMethod: '手机拍照检测' }, children: [] },
        ]
      },
      // 11. 气味测评实验室
      {
        id: 'zone-eol-smell-lab',
        label: '气味测评实验室',
        type: NodeType.ZONE,
        status: NodeStatus.NORMAL,
        children: [
            { 
              id: 'eol-smell-ai', 
              label: '气味AI检测', 
              type: NodeType.STATION, 
              status: NodeStatus.NORMAL, 
              meta: { 
                inspectionObject: '车内空气质量、VOCs', 
                inspectionMethod: '电子鼻气味分析仪' 
              }, 
              children: [] 
            }
        ]
      }
    ]
  }
];