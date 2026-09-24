# Tg Studio Vue 原型工程模板

这是一个面向产品经理的 Vue 3 + Vite 原型模板。它用完全虚构的材料申报案例演示页面配置、页面模板、mock 数据、业务规则、共享组件、前后端交接和离线预览。开发者可协作完善接口与实现；这里没有真实项目资料或生产后端。

## 从这里开始

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev
```

浏览器打开 Vite 显示的本地地址。页面可热更新，导航和路由集中在 `src/app/page-registry.ts` 与 `src/app/router.ts`。

### 快速新增一个页面

这是面向简单页面的操作目标；实际用时取决于页面交互和规则复杂度，尚未经过非开发产品经理的计时验收。

1. 复制 `page-template/` 到 `src/modules/<模块>/pages/<页面>/`。
2. 在目录的 `mock.ts` 和 `RULES.md` 填入虚构演示数据与已确认/待确认规则，再实现 `Page.vue`。
3. 在 `src/app/page-registry.ts` 注册路由、标题、菜单名、角色说明和页面组件。
4. 运行 `npm run typecheck`，用 `npm run dev` 打开新路由检查。

可照着 `src/modules/overview/pages/home/` 和 `src/modules/material-submission/pages/apply/` 阅读。使用共享组件可参考 `src/shared/components/`。如果字段要交给后端确认，先记录到模块 `contracts/`；未确认的 URL、HTTP 方法、认证和持久化策略保持待定。

详细步骤：[`docs/ADD_PAGE.md`](docs/ADD_PAGE.md)。

## 与前后端协作

- 前端原型数据和本地浏览器存储在页面之外的 `mock.ts`、`data/` 中。
- `src/modules/material-submission/contracts/` 区分虚构案例已确认的数据结构和后端待确认事项。当前合同只表达原型边界，不声称已有 API。
- 前后端对接时共同补齐接口路径、方法、认证、错误码、分页和持久化；确认后替换数据适配层，页面应继续消费同一业务数据类型。

说明：[`docs/FRONTEND_HANDOFF.md`](docs/FRONTEND_HANDOFF.md)、[`docs/BACKEND_HANDOFF.md`](docs/BACKEND_HANDOFF.md)。

## 打包离线预览

```bash
npm run preview:pack
```

命令构建经典 JavaScript 脚本，整理页面清单、使用说明和文件校验值，并自动执行离线包审计。通过后，可尝试双击 `dist/preview/index.html`，也可把 `dist/preview/` 放到静态服务器。包仅依赖随包提供的本地文件，不需要 Node 服务或 CDN。每个目标浏览器的 `file://` 行为仍需实测。

```bash
npm run preview:verify
```

单独重跑包审计。检查入口引用、相对资源、已注册路由、包目录白名单、文件哈希、模块脚本/外部资源引用及依赖声明。审计通过代表静态结构符合规则，不代替浏览器交互验收。

## 示例边界

材料申报页按虚构案例 BR-001 至 BR-007 展示本地草稿、材料确认、表单校验、提交锁定和清除演示数据。确认材料只是一项本地状态，不上传文件；提交不发起网络请求，也不生成真实办件。业务事实以 `src/modules/material-submission/facts/module/` 为准。

本模板提供页面结构、注册表、共享 UI 组件和本地 mock 适配示例。它不提供真实 API、身份认证、权限、生产持久化、文件上传或后端处理。更多产品经理操作说明见 `docs/`。

本 Vue 示例与仓库原生案例的页面、状态、规则和静态交付方式对照见[案例实现对照](docs/CASE_COMPARISON.md)。
