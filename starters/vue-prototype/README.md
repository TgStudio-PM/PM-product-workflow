# Tg Studio Vue 原型工程参考

这是 PM-product-workflow 的可复制 Vue + Vite 两页参考工程。页面内容完全虚构，用于演示产品经理如何快速迭代页面，并验证开发预览与离线静态构建路径。

## 本机开发

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev
```

开发服务器提供 Vue 单文件组件热更新。演示导航由 `src/app/page-registry.ts` 集中登记，地址使用 hash，适用于离线包的静态入口。

## 生成离线预览包

```bash
npm run preview:pack
```

产物输出到 `dist/preview/`。其中 `index.html` 引用相对路径的经典脚本和本地样式；运行时不读取本地 JSON，不加载 CDN 或外部资源。可双击 `dist/preview/index.html` 进行浏览器验收。构建成功本身不等于所有浏览器的 `file://` 行为已经通过验证。

## 示例页面

- 原型概览：说明模板范围和迭代原则。
- 材料申报：按本仓库虚构案例的 BR-001 至 BR-007 实现本地草稿、材料确认、校验、提交锁定和清除演示数据。

材料申报页的确认规则索引在 `src/modules/material-submission/pages/apply/RULES.md`；规则事实以仓库 `examples/material-submission/facts/module/` 中的业务规则和页面流程为准。

## 目录简述

```text
src/app/                         页面注册表与应用入口
src/modules/overview/            虚构概览页
src/modules/material-submission/ 虚构材料申报页与页面 mock
scripts/build-preview.mjs        生成 IIFE 离线预览包
```

本阶段只验证两页工程、热更新入口和静态打包技术路径，不包含完整组件库、真实 API、权限认证、文件上传或生产业务处理。
