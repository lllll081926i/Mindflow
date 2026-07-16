const FLOWCHART_TEMPLATES = {
  blank: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '开始', note: '流程起点：明确触发条件',
        x: 120,
        y: 120,
        width: 140,
        height: 56
      }),
      createFlowchartNode({
        id: 'node-process',
        type: 'process',
        text: '处理步骤',
        x: 120,
        y: 236
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '结束', note: '流程终点：确认完成标准',
        x: 120,
        y: 352,
        width: 140,
        height: 56
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-process',
        source: 'node-start',
        target: 'node-process'
      }),
      createFlowchartEdge({
        id: 'edge-process-end',
        source: 'node-process',
        target: 'node-end'
      })
    ]
  }),
  approval: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '提交申请', note: '流程起点：明确触发条件',
        x: 120,
        y: 120
      }),
      createFlowchartNode({ id: 'node-review', type: 'decision', text: '审批通过？', note: '决策点：记录判断依据与审批标准',
        x: 120,
        y: 240,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-approved',
        type: 'process',
        text: '执行审批结果',
        x: 360,
        y: 240
      }),
      createFlowchartNode({
        id: 'node-rejected',
        type: 'end',
        text: '驳回结束',
        x: 120,
        y: 392
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '流程完成', note: '流程终点：确认完成标准',
        x: 360,
        y: 392
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-review',
        source: 'node-start',
        target: 'node-review'
      }),
      createFlowchartEdge({
        id: 'edge-review-approved',
        source: 'node-review',
        target: 'node-approved',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-review-rejected',
        source: 'node-review',
        target: 'node-rejected',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-approved-end',
        source: 'node-approved',
        target: 'node-end'
      })
    ]
  }),
  troubleshooting: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '发现问题', note: '流程起点：明确触发条件',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-collect',
        type: 'input',
        text: '收集现场信息',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-diagnose',
        type: 'decision',
        text: '定位到原因？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'process',
        text: '执行修复',
        x: 360,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-loop',
        type: 'process',
        text: '补充排查',
        x: 120,
        y: 516
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '验证完成', note: '流程终点：确认完成标准',
        x: 360,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-collect',
        source: 'node-start',
        target: 'node-collect'
      }),
      createFlowchartEdge({
        id: 'edge-collect-diagnose',
        source: 'node-collect',
        target: 'node-diagnose'
      }),
      createFlowchartEdge({
        id: 'edge-diagnose-fix',
        source: 'node-diagnose',
        target: 'node-fix',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-diagnose-loop',
        source: 'node-diagnose',
        target: 'node-loop',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-fix-end',
        source: 'node-fix',
        target: 'node-end'
      }),
      createFlowchartEdge({
        id: 'edge-loop-collect',
        source: 'node-loop',
        target: 'node-collect',
        label: '继续'
      })
    ]
  }),
  release: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '开发完成', note: '流程起点：明确触发条件',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-qa',
        type: 'process',
        text: '测试验证',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '验证通过？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-release',
        type: 'process',
        text: '执行发布',
        x: 380,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'process',
        text: '修复问题',
        x: 120,
        y: 516
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '上线完成', note: '流程终点：确认完成标准',
        x: 380,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-qa',
        source: 'node-start',
        target: 'node-qa'
      }),
      createFlowchartEdge({
        id: 'edge-qa-check',
        source: 'node-qa',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-release',
        source: 'node-check',
        target: 'node-release',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-check-fix',
        source: 'node-check',
        target: 'node-fix',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-fix-qa',
        source: 'node-fix',
        target: 'node-qa'
      }),
      createFlowchartEdge({
        id: 'edge-release-end',
        source: 'node-release',
        target: 'node-end'
      })
    ]
  }),
  ticket: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '收到工单', note: '流程起点：明确触发条件',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-record',
        type: 'input',
        text: '记录问题',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '可直接解决？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-assign',
        type: 'process',
        text: '分派处理',
        x: 380,
        y: 360
      }),
      createFlowchartNode({
        id: 'node-reply',
        type: 'process',
        text: '回复用户',
        x: 380,
        y: 500
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '关闭工单', note: '流程终点：确认完成标准',
        x: 380,
        y: 620
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-record',
        source: 'node-start',
        target: 'node-record'
      }),
      createFlowchartEdge({
        id: 'edge-record-check',
        source: 'node-record',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-reply',
        source: 'node-check',
        target: 'node-reply',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-check-assign',
        source: 'node-check',
        target: 'node-assign',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-assign-reply',
        source: 'node-assign',
        target: 'node-reply'
      }),
      createFlowchartEdge({
        id: 'edge-reply-end',
        source: 'node-reply',
        target: 'node-end'
      })
    ]
  }),
  onboarding: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '发起入职', note: '流程起点：明确触发条件',
        x: 120,
        y: 120
      }),
      createFlowchartNode({
        id: 'node-prepare',
        type: 'process',
        text: '准备账号设备',
        x: 120,
        y: 236
      }),
      createFlowchartNode({
        id: 'node-check',
        type: 'decision',
        text: '资料齐全？',
        x: 120,
        y: 360,
        width: 168,
        height: 92
      }),
      createFlowchartNode({
        id: 'node-fix',
        type: 'input',
        text: '补齐资料',
        x: 120,
        y: 516
      }),
      createFlowchartNode({
        id: 'node-training',
        type: 'process',
        text: '安排培训',
        x: 380,
        y: 360
      }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '完成入职', note: '流程终点：确认完成标准',
        x: 380,
        y: 516
      })
    ],
    edges: [
      createFlowchartEdge({
        id: 'edge-start-prepare',
        source: 'node-start',
        target: 'node-prepare'
      }),
      createFlowchartEdge({
        id: 'edge-prepare-check',
        source: 'node-prepare',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-check-fix',
        source: 'node-check',
        target: 'node-fix',
        label: '否'
      }),
      createFlowchartEdge({
        id: 'edge-check-training',
        source: 'node-check',
        target: 'node-training',
        label: '是'
      }),
      createFlowchartEdge({
        id: 'edge-fix-check',
        source: 'node-fix',
        target: 'node-check'
      }),
      createFlowchartEdge({
        id: 'edge-training-end',
        source: 'node-training',
        target: 'node-end'
      })
    ]
  }),
  customerJourney: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '用户进入', note: '流程起点：明确触发条件', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-touch', type: 'input', text: '触达入口', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-need', type: 'decision', text: '需求明确？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-guide', type: 'process', text: '引导选择', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-action', type: 'process', text: '完成关键动作', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-feedback', type: 'input', text: '收集反馈', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '留存跟进', note: '流程终点：确认完成标准', x: 380, y: 620 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-touch', source: 'node-start', target: 'node-touch' }),
      createFlowchartEdge({ id: 'edge-touch-need', source: 'node-touch', target: 'node-need' }),
      createFlowchartEdge({ id: 'edge-need-action', source: 'node-need', target: 'node-action', label: '是' }),
      createFlowchartEdge({ id: 'edge-need-guide', source: 'node-need', target: 'node-guide', label: '否' }),
      createFlowchartEdge({ id: 'edge-guide-action', source: 'node-guide', target: 'node-action' }),
      createFlowchartEdge({ id: 'edge-action-feedback', source: 'node-action', target: 'node-feedback' }),
      createFlowchartEdge({ id: 'edge-feedback-end', source: 'node-feedback', target: 'node-end' })
    ]
  }),
  incident: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '告警触发', note: '流程起点：明确触发条件', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-triage', type: 'process', text: '初步分级', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-major', type: 'decision', text: '重大故障？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-warroom', type: 'process', text: '建立响应群', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-fix', type: 'process', text: '止血修复', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-normal', type: 'process', text: '常规处理', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-review', type: 'input', text: '复盘记录', note: '决策点：记录判断依据与审批标准', x: 380, y: 640 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-triage', source: 'node-start', target: 'node-triage' }),
      createFlowchartEdge({ id: 'edge-triage-major', source: 'node-triage', target: 'node-major' }),
      createFlowchartEdge({ id: 'edge-major-warroom', source: 'node-major', target: 'node-warroom', label: '是' }),
      createFlowchartEdge({ id: 'edge-major-normal', source: 'node-major', target: 'node-normal', label: '否' }),
      createFlowchartEdge({ id: 'edge-warroom-fix', source: 'node-warroom', target: 'node-fix' }),
      createFlowchartEdge({ id: 'edge-fix-review', source: 'node-fix', target: 'node-review' }),
      createFlowchartEdge({ id: 'edge-normal-review', source: 'node-normal', target: 'node-review' })
    ]
  }),
  dataPipeline: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-source', type: 'input', text: '数据源', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-ingest', type: 'process', text: '采集入湖', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-quality', type: 'decision', text: '质量通过？', x: 120, y: 360, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-clean', type: 'process', text: '清洗转换', x: 380, y: 360 }),
      createFlowchartNode({ id: 'node-repair', type: 'process', text: '修复重跑', x: 120, y: 516 }),
      createFlowchartNode({ id: 'node-serve', type: 'process', text: '服务发布', x: 380, y: 500 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '监控告警', note: '流程终点：确认完成标准', x: 380, y: 620 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-source-ingest', source: 'node-source', target: 'node-ingest' }),
      createFlowchartEdge({ id: 'edge-ingest-quality', source: 'node-ingest', target: 'node-quality' }),
      createFlowchartEdge({ id: 'edge-quality-clean', source: 'node-quality', target: 'node-clean', label: '是' }),
      createFlowchartEdge({ id: 'edge-quality-repair', source: 'node-quality', target: 'node-repair', label: '否' }),
      createFlowchartEdge({ id: 'edge-repair-ingest', source: 'node-repair', target: 'node-ingest' }),
      createFlowchartEdge({ id: 'edge-clean-serve', source: 'node-clean', target: 'node-serve' }),
      createFlowchartEdge({ id: 'edge-serve-end', source: 'node-serve', target: 'node-end' })
    ]
  }),
  projectPlan: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-start', type: 'start', text: '立项', note: '流程起点：明确触发条件', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-scope', type: 'input', text: '确认范围', note: '先澄清范围，再进入方案/计划', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-plan', type: 'process', text: '拆解计划', x: 120, y: 352 }),
      createFlowchartNode({ id: 'node-risk', type: 'decision', text: '风险可控？', note: '风险决策：明确可控标准', x: 120, y: 476, width: 168, height: 92 }),
      createFlowchartNode({ id: 'node-execute', type: 'process', text: '执行交付', x: 380, y: 476 }),
      createFlowchartNode({ id: 'node-adjust', type: 'process', text: '调整方案', x: 120, y: 636 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '验收归档', note: '流程终点：确认完成标准', x: 380, y: 636 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-start-scope', source: 'node-start', target: 'node-scope' }),
      createFlowchartEdge({ id: 'edge-scope-plan', source: 'node-scope', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-plan-risk', source: 'node-plan', target: 'node-risk' }),
      createFlowchartEdge({ id: 'edge-risk-execute', source: 'node-risk', target: 'node-execute', label: '是' }),
      createFlowchartEdge({ id: 'edge-risk-adjust', source: 'node-risk', target: 'node-adjust', label: '否' }),
      createFlowchartEdge({ id: 'edge-adjust-plan', source: 'node-adjust', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-execute-end', source: 'node-execute', target: 'node-end' })
    ]
  }),

  crossFunctionalApproval: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-request', type: 'start', text: '提交需求', note: '跨部门需求入口，补充背景与优先级', x: 120, y: 100 }),
      createFlowchartNode({ id: 'node-product', type: 'process', text: '产品评估', x: 120, y: 250 }),
      createFlowchartNode({ id: 'node-design', type: 'process', text: '设计确认', x: 420, y: 250 }),
      createFlowchartNode({ id: 'node-tech', type: 'process', text: '技术评审', x: 720, y: 250 }),
      createFlowchartNode({ id: 'node-approve', type: 'decision', text: '跨部门通过？', note: '审批节点：补充审批人与时限', x: 420, y: 410, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-rework', type: 'process', text: '补充材料', x: 120, y: 590 }),
      createFlowchartNode({ id: 'node-schedule', type: 'process', text: '排期执行', x: 720, y: 590 }),
      createFlowchartNode({ id: 'node-end', type: 'end', text: '进入交付', note: '流程终点：确认完成标准', x: 720, y: 740 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-request-product', source: 'node-request', target: 'node-product' }),
      createFlowchartEdge({ id: 'edge-product-design', source: 'node-product', target: 'node-design' }),
      createFlowchartEdge({ id: 'edge-design-tech', source: 'node-design', target: 'node-tech' }),
      createFlowchartEdge({ id: 'edge-tech-approve', source: 'node-tech', target: 'node-approve' }),
      createFlowchartEdge({ id: 'edge-approve-schedule', source: 'node-approve', target: 'node-schedule', label: '是' }),
      createFlowchartEdge({ id: 'edge-approve-rework', source: 'node-approve', target: 'node-rework', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-rework-product', source: 'node-rework', target: 'node-product', label: '再评估', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-schedule-end', source: 'node-schedule', target: 'node-end' })
    ]
  }),


  supportEscalation: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-ticket', type: 'start', text: '收到故障工单', note: '记录故障来源与紧急程度', x: 120, y: 100 }),
      createFlowchartNode({ id: 'node-l1', type: 'process', text: 'L1 初步排查', x: 120, y: 250 }),
      createFlowchartNode({ id: 'node-severity', type: 'decision', text: '影响范围升级？', note: '升级前同步影响面与客户预期', x: 120, y: 410, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-l2', type: 'process', text: 'L2 深入诊断', x: 420, y: 410 }),
      createFlowchartNode({ id: 'node-comm', type: 'input', text: '同步客户状态', x: 740, y: 410 }),
      createFlowchartNode({ id: 'node-warroom', type: 'process', text: '启动应急响应', x: 420, y: 590 }),
      createFlowchartNode({ id: 'node-recover', type: 'process', text: '恢复服务', x: 740, y: 590 }),
      createFlowchartNode({ id: 'node-postmortem', type: 'end', text: '复盘归档', x: 740, y: 740 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-ticket-l1', source: 'node-ticket', target: 'node-l1' }),
      createFlowchartEdge({ id: 'edge-l1-severity', source: 'node-l1', target: 'node-severity' }),
      createFlowchartEdge({ id: 'edge-severity-l2', source: 'node-severity', target: 'node-l2', label: '是' }),
      createFlowchartEdge({ id: 'edge-severity-comm', source: 'node-severity', target: 'node-comm', label: '同步' }),
      createFlowchartEdge({ id: 'edge-l2-warroom', source: 'node-l2', target: 'node-warroom' }),
      createFlowchartEdge({ id: 'edge-warroom-recover', source: 'node-warroom', target: 'node-recover' }),
      createFlowchartEdge({ id: 'edge-comm-recover', source: 'node-comm', target: 'node-recover', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-recover-postmortem', source: 'node-recover', target: 'node-postmortem' })
    ]
  }),

  contentReview: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-brief', type: 'start', text: '提交稿件', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-edit', type: 'process', text: '编辑初审', x: 120, y: 236 }),
      createFlowchartNode({ id: 'node-brand', type: 'process', text: '品牌校对', x: 380, y: 236 }),
      createFlowchartNode({
        id: 'node-legal',
        type: 'decision',
        text: '是否涉及合规？',
        x: 640,
        y: 236,
        width: 188,
        height: 92
      }),
      createFlowchartNode({ id: 'node-compliance', type: 'process', text: '法务复审', x: 640, y: 404 }),
      createFlowchartNode({ id: 'node-revise', type: 'process', text: '修改回退', x: 120, y: 520 }),
      createFlowchartNode({ id: 'node-publish', type: 'end', text: '排期发布', x: 640, y: 568 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-brief-edit', source: 'node-brief', target: 'node-edit' }),
      createFlowchartEdge({ id: 'edge-edit-brand', source: 'node-edit', target: 'node-brand' }),
      createFlowchartEdge({ id: 'edge-brand-legal', source: 'node-brand', target: 'node-legal' }),
      createFlowchartEdge({ id: 'edge-legal-compliance', source: 'node-legal', target: 'node-compliance', label: '是' }),
      createFlowchartEdge({ id: 'edge-legal-publish', source: 'node-legal', target: 'node-publish', label: '否' }),
      createFlowchartEdge({ id: 'edge-compliance-publish', source: 'node-compliance', target: 'node-publish' }),
      createFlowchartEdge({
        id: 'edge-compliance-revise',
        source: 'node-compliance',
        target: 'node-revise',
        label: '需修改',
        style: { dashed: true }
      }),
      createFlowchartEdge({ id: 'edge-revise-edit', source: 'node-revise', target: 'node-edit' })
    ]
  }),
  procurement: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-apply', type: 'start', text: '提出采购申请', x: 120, y: 120 }),
      createFlowchartNode({ id: 'node-budget', type: 'process', text: '预算核验', x: 120, y: 236 }),
      createFlowchartNode({
        id: 'node-vendor',
        type: 'decision',
        text: '已有合格供应商？',
        x: 120,
        y: 376,
        width: 196,
        height: 92
      }),
      createFlowchartNode({ id: 'node-rfq', type: 'process', text: '询价比选', x: 420, y: 376 }),
      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同审批', x: 700, y: 376 }),
      createFlowchartNode({ id: 'node-purchase', type: 'process', text: '下单采购', x: 700, y: 544 }),
      createFlowchartNode({ id: 'node-receive', type: 'end', text: '到货验收', x: 700, y: 688 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-apply-budget', source: 'node-apply', target: 'node-budget' }),
      createFlowchartEdge({ id: 'edge-budget-vendor', source: 'node-budget', target: 'node-vendor' }),
      createFlowchartEdge({ id: 'edge-vendor-rfq', source: 'node-vendor', target: 'node-rfq', label: '否' }),
      createFlowchartEdge({
        id: 'edge-vendor-contract',
        source: 'node-vendor',
        target: 'node-contract',
        label: '是'
      }),
      createFlowchartEdge({ id: 'edge-rfq-contract', source: 'node-rfq', target: 'node-contract' }),
      createFlowchartEdge({ id: 'edge-contract-purchase', source: 'node-contract', target: 'node-purchase' }),
      createFlowchartEdge({ id: 'edge-purchase-receive', source: 'node-purchase', target: 'node-receive' })
    ]
  }),

  salesPipeline: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-lead', type: 'start', text: '线索进入', note: '线索来源与渠道标记', x: 120, y: 100 }),
      createFlowchartNode({ id: 'node-qualify', type: 'process', text: '线索筛选', x: 120, y: 250 }),
      createFlowchartNode({ id: 'node-demo', type: 'process', text: '方案演示', x: 420, y: 250 }),
      createFlowchartNode({ id: 'node-intent', type: 'decision', text: '客户有明确意向？', note: '意向判断决定报价或继续培育', x: 740, y: 238, width: 196, height: 92 }),
      createFlowchartNode({ id: 'node-proposal', type: 'process', text: '报价提案', x: 740, y: 430 }),
      createFlowchartNode({ id: 'node-follow', type: 'process', text: '继续跟进', x: 420, y: 590 }),
      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同签署', x: 1020, y: 430 }),
      createFlowchartNode({ id: 'node-close', type: 'end', text: '成交回款', note: '确认回款与交接完成', x: 1020, y: 590 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-lead-qualify', source: 'node-lead', target: 'node-qualify' }),
      createFlowchartEdge({ id: 'edge-qualify-demo', source: 'node-qualify', target: 'node-demo' }),
      createFlowchartEdge({ id: 'edge-demo-intent', source: 'node-demo', target: 'node-intent' }),
      createFlowchartEdge({ id: 'edge-intent-proposal', source: 'node-intent', target: 'node-proposal', label: '是' }),
      createFlowchartEdge({ id: 'edge-intent-follow', source: 'node-intent', target: 'node-follow', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-follow-demo', source: 'node-follow', target: 'node-demo', label: '复访' }),
      createFlowchartEdge({ id: 'edge-proposal-contract', source: 'node-proposal', target: 'node-contract' }),
      createFlowchartEdge({ id: 'edge-contract-close', source: 'node-contract', target: 'node-close' })
    ]
  }),

  enterpriseDelivery: title => ({
    title,
    nodes: [
      createFlowchartNode({ id: 'node-demand', type: 'start', text: '需求进入', x: 100, y: 110 }),
      createFlowchartNode({ id: 'node-triage', type: 'process', text: '需求分级', x: 360, y: 110 }),
      createFlowchartNode({ id: 'node-scope', type: 'decision', text: '范围清晰？', note: '先澄清范围，再进入方案/计划', x: 620, y: 98, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-solution', type: 'process', text: '方案设计', x: 900, y: 110 }),
      createFlowchartNode({ id: 'node-estimate', type: 'process', text: '成本评估', x: 1180, y: 110 }),
      createFlowchartNode({ id: 'node-approve', type: 'decision', text: '审批通过？', note: '审批节点：补充审批人与时限', x: 1460, y: 98, width: 188, height: 92 }),

      createFlowchartNode({ id: 'node-contract', type: 'process', text: '合同确认', x: 100, y: 300 }),
      createFlowchartNode({ id: 'node-resource', type: 'process', text: '资源排期', x: 360, y: 300 }),
      createFlowchartNode({ id: 'node-procure', type: 'process', text: '采购准备', x: 620, y: 300 }),
      createFlowchartNode({ id: 'node-vendor', type: 'decision', text: '供应就绪？', x: 900, y: 288, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-kickoff', type: 'process', text: '项目启动', x: 1180, y: 300 }),
      createFlowchartNode({ id: 'node-plan', type: 'process', text: '交付计划', x: 1460, y: 300 }),

      createFlowchartNode({ id: 'node-build', type: 'process', text: '实施配置', x: 100, y: 490 }),
      createFlowchartNode({ id: 'node-integrate', type: 'process', text: '系统联调', x: 360, y: 490 }),
      createFlowchartNode({ id: 'node-data', type: 'input', text: '数据导入', x: 620, y: 490 }),
      createFlowchartNode({ id: 'node-qa', type: 'decision', text: '验收通过？', x: 900, y: 478, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-training', type: 'process', text: '用户培训', x: 1180, y: 490 }),
      createFlowchartNode({ id: 'node-live', type: 'process', text: '上线切换', x: 1460, y: 490 }),

      createFlowchartNode({ id: 'node-monitor', type: 'process', text: '运行监控', x: 100, y: 680 }),
      createFlowchartNode({ id: 'node-support', type: 'process', text: '问题响应', x: 360, y: 680 }),
      createFlowchartNode({ id: 'node-stabilize', type: 'decision', text: '运行稳定？', x: 620, y: 668, width: 188, height: 92 }),
      createFlowchartNode({ id: 'node-handover', type: 'process', text: '运营交接', x: 900, y: 680 }),
      createFlowchartNode({ id: 'node-review', type: 'process', text: '复盘沉淀', note: '决策点：记录判断依据与审批标准', x: 1180, y: 680 }),
      createFlowchartNode({ id: 'node-close-delivery', type: 'end', text: '项目关闭', x: 1460, y: 680 })
    ],
    edges: [
      createFlowchartEdge({ id: 'edge-demand-triage', source: 'node-demand', target: 'node-triage' }),
      createFlowchartEdge({ id: 'edge-triage-scope', source: 'node-triage', target: 'node-scope' }),
      createFlowchartEdge({ id: 'edge-scope-solution', source: 'node-scope', target: 'node-solution', label: '是' }),
      createFlowchartEdge({ id: 'edge-solution-estimate', source: 'node-solution', target: 'node-estimate' }),
      createFlowchartEdge({ id: 'edge-estimate-approve', source: 'node-estimate', target: 'node-approve' }),
      createFlowchartEdge({ id: 'edge-approve-contract', source: 'node-approve', target: 'node-contract', label: '通过' }),
      createFlowchartEdge({ id: 'edge-contract-resource', source: 'node-contract', target: 'node-resource' }),
      createFlowchartEdge({ id: 'edge-resource-procure', source: 'node-resource', target: 'node-procure' }),
      createFlowchartEdge({ id: 'edge-procure-vendor', source: 'node-procure', target: 'node-vendor' }),
      createFlowchartEdge({ id: 'edge-vendor-kickoff', source: 'node-vendor', target: 'node-kickoff', label: '是' }),
      createFlowchartEdge({ id: 'edge-kickoff-plan', source: 'node-kickoff', target: 'node-plan' }),
      createFlowchartEdge({ id: 'edge-plan-build', source: 'node-plan', target: 'node-build' }),
      createFlowchartEdge({ id: 'edge-build-integrate', source: 'node-build', target: 'node-integrate' }),
      createFlowchartEdge({ id: 'edge-integrate-data', source: 'node-integrate', target: 'node-data' }),
      createFlowchartEdge({ id: 'edge-data-qa', source: 'node-data', target: 'node-qa' }),
      createFlowchartEdge({ id: 'edge-qa-training', source: 'node-qa', target: 'node-training', label: '是' }),
      createFlowchartEdge({ id: 'edge-training-live', source: 'node-training', target: 'node-live' }),
      createFlowchartEdge({ id: 'edge-live-monitor', source: 'node-live', target: 'node-monitor' }),
      createFlowchartEdge({ id: 'edge-monitor-support', source: 'node-monitor', target: 'node-support' }),
      createFlowchartEdge({ id: 'edge-support-stabilize', source: 'node-support', target: 'node-stabilize' }),
      createFlowchartEdge({ id: 'edge-stabilize-handover', source: 'node-stabilize', target: 'node-handover', label: '是' }),
      createFlowchartEdge({ id: 'edge-handover-review', source: 'node-handover', target: 'node-review' }),
      createFlowchartEdge({ id: 'edge-review-close-delivery', source: 'node-review', target: 'node-close-delivery' }),
      createFlowchartEdge({ id: 'edge-scope-triage', source: 'node-scope', target: 'node-triage', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-approve-estimate', source: 'node-approve', target: 'node-estimate', label: '退回', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-vendor-procure', source: 'node-vendor', target: 'node-procure', label: '否', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-qa-build', source: 'node-qa', target: 'node-build', label: '返工', style: { dashed: true } }),
      createFlowchartEdge({ id: 'edge-stabilize-support', source: 'node-stabilize', target: 'node-support', label: '否', style: { dashed: true } })
    ]
  })
}

export const FLOWCHART_TEMPLATE_PRESETS = [
  { id: 'approval', labelKey: 'flowchart.templateApproval', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'crossFunctionalApproval', labelKey: 'flowchart.templateCrossFunctionalApproval', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'contentReview', labelKey: 'flowchart.templateContentReview', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'procurement', labelKey: 'flowchart.templateProcurement', categoryKey: 'flowchart.templateCategoryOps' },
  { id: 'release', labelKey: 'flowchart.templateRelease', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'projectPlan', labelKey: 'flowchart.templateProjectPlan', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'dataPipeline', labelKey: 'flowchart.templateDataPipeline', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'enterpriseDelivery', labelKey: 'flowchart.templateEnterpriseDelivery', categoryKey: 'flowchart.templateCategoryDelivery' },
  { id: 'ticket', labelKey: 'flowchart.templateTicket', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'troubleshooting', labelKey: 'flowchart.templateTroubleshooting', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'incident', labelKey: 'flowchart.templateIncident', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'supportEscalation', labelKey: 'flowchart.templateSupportEscalation', categoryKey: 'flowchart.templateCategoryService' },
  { id: 'onboarding', labelKey: 'flowchart.templateOnboarding', categoryKey: 'flowchart.templateCategoryBusiness' },
  { id: 'customerJourney', labelKey: 'flowchart.templateCustomerJourney', categoryKey: 'flowchart.templateCategoryBusiness' },
  { id: 'salesPipeline', labelKey: 'flowchart.templateSalesPipeline', categoryKey: 'flowchart.templateCategoryBusiness' }
]

export const getFlowchartTemplateMeta = templateId => {
  return (
    FLOWCHART_TEMPLATE_PRESETS.find(item => item.id === templateId) ||
    FLOWCHART_TEMPLATE_PRESETS[0]
  )
}


