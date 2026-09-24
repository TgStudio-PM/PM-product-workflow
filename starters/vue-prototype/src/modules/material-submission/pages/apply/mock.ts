export const applicationMock = {
  matterName: 'Tg Studio 示例项目材料申报',
  materials: [
    { id: 'project-note', name: '项目背景说明', description: '演示材料 A · 内容由使用者自行准备', required: true },
    { id: 'space-sketch', name: '页面流程草图', description: '演示材料 B · 内容由使用者自行准备', required: false },
    { id: 'schedule', name: '迭代计划摘要', description: '演示材料 C · 内容由使用者自行准备', required: true },
  ],
} as const

export type MaterialId = (typeof applicationMock.materials)[number]['id']
