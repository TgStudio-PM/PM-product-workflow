import OverviewPage from '../modules/overview/pages/home/Page.vue'
import MaterialSubmissionPage from '../modules/material-submission/pages/apply/Page.vue'

export const pageRegistry = [
  {
    path: '/overview',
    title: '原型概览',
    menuLabel: '原型概览',
    demoRole: '教学案例使用者',
    component: OverviewPage,
  },
  {
    path: '/material-submission/apply',
    title: '材料申报',
    menuLabel: '材料申报',
    demoRole: '教学案例使用者',
    component: MaterialSubmissionPage,
  },
] as const

export type PagePath = (typeof pageRegistry)[number]['path']
