import { createDefaultMindMapData } from '@/platform/shared/configSchema'
import { getPreferredMindMapThemeValue } from '@/stores/runtime'

export function createBlankMindMapProjectContent(isDark = false, layout) {
  const themeTemplate = getPreferredMindMapThemeValue(!!isDark)
  return createDefaultMindMapData('思维导图', themeTemplate, layout)
}

export function createScenarioMindMapData(scenario = 'meeting', isDark = false) {
  const createBlankProjectContent = layout =>
    createBlankMindMapProjectContent(isDark, layout)

      const layout =
        scenario === 'project' || scenario === 'okr'
          ? 'organizationStructure'
          : 'mindMap'
      const data = createBlankProjectContent(layout)
      if (scenario === 'project') {
        data.root.data.text = '项目计划'
        data.root.children = [
          {
            data: { text: '目标与范围' },
            children: [
              { data: { text: '成功标准' }, children: [] },
              { data: { text: '非目标' }, children: [] }
            ]
          },
          {
            data: { text: '里程碑' },
            children: [
              { data: { text: '方案评审' }, children: [] },
              { data: { text: '开发完成' }, children: [] },
              { data: { text: '上线发布' }, children: [] }
            ]
          },
          {
            data: { text: '风险与依赖' },
            children: [
              { data: { text: '资源风险' }, children: [] },
              { data: { text: '外部依赖' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'learning') {
        data.root.data.text = '学习计划'
        data.root.children = [
          {
            data: { text: '学习目标' },
            children: [
              { data: { text: '核心概念' }, children: [] },
              { data: { text: '可交付成果' }, children: [] }
            ]
          },
          {
            data: { text: '学习路径' },
            children: [
              { data: { text: '基础' }, children: [] },
              { data: { text: '进阶' }, children: [] },
              { data: { text: '实践项目' }, children: [] }
            ]
          },
          {
            data: { text: '复盘节奏' },
            children: [
              { data: { text: '每周回顾' }, children: [] },
              { data: { text: '错题/问题本' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'review') {
        data.root.data.text = '复盘总结'
        data.root.children = [
          {
            data: { text: '目标回顾' },
            children: [
              { data: { text: '预期结果' }, children: [] },
              { data: { text: '实际结果' }, children: [] }
            ]
          },
          {
            data: { text: '过程分析' },
            children: [
              { data: { text: '做得好的' }, children: [] },
              { data: { text: '可改进的' }, children: [] }
            ]
          },
          {
            data: { text: '行动项' },
            children: [
              { data: { text: '立即行动' }, children: [] },
              { data: { text: '下周期计划' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'okr') {
        data.root.data.text = 'OKR'
        data.root.children = [
          {
            data: { text: 'O1 核心目标' },
            children: [
              { data: { text: 'KR1 可量化结果' }, children: [] },
              { data: { text: 'KR2 可量化结果' }, children: [] },
              { data: { text: 'KR3 可量化结果' }, children: [] }
            ]
          },
          {
            data: { text: 'O2 支撑目标' },
            children: [
              { data: { text: 'KR1 可量化结果' }, children: [] },
              { data: { text: 'KR2 可量化结果' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'weekly') {
        data.root.data.text = '周报'
        data.root.children = [
          {
            data: { text: '本周进展' },
            children: [
              { data: { text: '已完成' }, children: [] },
              { data: { text: '进行中' }, children: [] }
            ]
          },
          {
            data: { text: '风险阻塞' },
            children: [
              { data: { text: '风险项' }, children: [] },
              { data: { text: '需要支持' }, children: [] }
            ]
          },
          {
            data: { text: '下周计划' },
            children: [
              { data: { text: '优先事项' }, children: [] },
              { data: { text: '时间安排' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'interview') {
        data.root.data.text = '面试准备'
        data.root.children = [
          {
            data: { text: '岗位理解' },
            children: [
              { data: { text: '职责重点' }, children: [] },
              { data: { text: '能力要求' }, children: [] }
            ]
          },
          {
            data: { text: '项目故事' },
            children: [
              { data: { text: '背景与目标' }, children: [] },
              { data: { text: '行动与结果' }, children: [] }
            ]
          },
          {
            data: { text: '问答清单' },
            children: [
              { data: { text: '高频问题' }, children: [] },
              { data: { text: '反问问题' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'reading') {
        data.root.data.text = '读书笔记'
        data.root.children = [
          {
            data: { text: '核心观点' },
            children: [
              { data: { text: '观点 1' }, children: [] },
              { data: { text: '观点 2' }, children: [] }
            ]
          },
          {
            data: { text: '金句摘录' },
            children: [
              { data: { text: '摘录 1' }, children: [] }
            ]
          },
          {
            data: { text: '行动启发' },
            children: [
              { data: { text: '可落地行动' }, children: [] },
              { data: { text: '关联项目' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'business') {
        data.root.data.text = '商业计划'
        data.root.children = [
          {
            data: { text: '市场与用户' },
            children: [
              { data: { text: '目标用户' }, children: [] },
              { data: { text: '核心痛点' }, children: [] }
            ]
          },
          {
            data: { text: '产品方案' },
            children: [
              { data: { text: '价值主张' }, children: [] },
              { data: { text: '关键功能' }, children: [] }
            ]
          },
          {
            data: { text: '增长与商业' },
            children: [
              { data: { text: '获客路径' }, children: [] },
              { data: { text: '收入模型' }, children: [] }
            ]
          },
          {
            data: { text: '里程碑' },
            children: [
              { data: { text: 'MVP' }, children: [] },
              { data: { text: '验证目标' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'knowledge') {
        data.root.data.text = '知识管理'
        data.root.children = [
          {
            data: { text: '知识采集' },
            children: [
              { data: { text: '来源清单' }, children: [] },
              { data: { text: '摘录规范' }, children: [] }
            ]
          },
          {
            data: { text: '知识整理' },
            children: [
              { data: { text: '主题分类' }, children: [] },
              { data: { text: '标签体系' }, children: [] }
            ]
          },
          {
            data: { text: '知识应用' },
            children: [
              { data: { text: '复用场景' }, children: [] },
              { data: { text: '输出作品' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'competitor') {
        data.root.data.text = '竞品分析'
        data.root.children = [
          {
            data: { text: '竞品画像' },
            children: [
              { data: { text: '定位与客群' }, children: [] },
              { data: { text: '核心卖点' }, children: [] }
            ]
          },
          {
            data: { text: '能力对比' },
            children: [
              { data: { text: '优势' }, children: [] },
              { data: { text: '劣势' }, children: [] }
            ]
          },
          {
            data: { text: '策略启发' },
            children: [
              { data: { text: '可借鉴点' }, children: [] },
              { data: { text: '差异化机会' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'retro') {
        data.root.data.text = '复盘会'
        data.root.children = [
          {
            data: { text: '目标与结果' },
            children: [
              { data: { text: '预期' }, children: [] },
              { data: { text: '实际' }, children: [] }
            ]
          },
          {
            data: { text: '过程观察' },
            children: [
              { data: { text: 'Keep' }, children: [] },
              { data: { text: 'Problem' }, children: [] },
              { data: { text: 'Try' }, children: [] }
            ]
          },
          {
            data: { text: '行动项' },
            children: [
              { data: { text: '负责人' }, children: [] },
              { data: { text: '截止时间' }, children: [] }
            ]
          }
        ]
        return data
      }
      if (scenario === 'roadmap') {
        data.root.data.text = '产品路线图'
        data.root.children = [
          {
            data: { text: 'Now' },
            children: [
              { data: { text: 'P0 功能' }, children: [] },
              { data: { text: '体验修复' }, children: [] }
            ]
          },
          {
            data: { text: 'Next' },
            children: [
              { data: { text: '增长能力' }, children: [] },
              { data: { text: '平台能力' }, children: [] }
            ]
          },
          {
            data: { text: 'Later' },
            children: [{ data: { text: '探索方向' }, children: [] }]
          }
        ]
        return data
      }
      if (scenario === 'content') {
        data.root.data.text = '内容日历'
        data.root.children = [
          {
            data: { text: '本周选题' },
            children: [
              { data: { text: '主题 A' }, children: [] },
              { data: { text: '主题 B' }, children: [] }
            ]
          },
          {
            data: { text: '生产安排' },
            children: [
              { data: { text: '撰稿' }, children: [] },
              { data: { text: '设计' }, children: [] },
              { data: { text: '发布' }, children: [] }
            ]
          },
          {
            data: { text: '复盘指标' },
            children: [
              { data: { text: '阅读/互动' }, children: [] },
              { data: { text: '转化' }, children: [] }
            ]
          }
        ]
        return data
      }
      data.root.data.text = '会议纪要'
      data.root.children = [
        {
          data: { text: '议题' },
          children: [
            { data: { text: '议题 1' }, children: [] },
            { data: { text: '议题 2' }, children: [] }
          ]
        },
        {
          data: { text: '决议' },
          children: [{ data: { text: '决议 1' }, children: [] }]
        },
        {
          data: { text: '待办' },
          children: [{ data: { text: '负责人 / 截止时间' }, children: [] }]
        }
      ]
      return data
}
