export const overviewMock = {
  summary: [
    { label: '工程模式', value: 'Vue 3 + Vite', note: '开发时使用热更新' },
    { label: '离线入口', value: '相对路径静态包', note: '不加载外网资源' },
    { label: '页面注册', value: '统一配置', note: '菜单、标题与组件对应' },
  ],
  columns: [
    { key: 'title', label: '页面名称' },
    { key: 'menu', label: '菜单' },
    { key: 'role', label: '演示角色标识' },
  ],
} as const
