# Tg Studio Vue 原型工程模板

这是一个面向产品经理的 Vue 3 + Vite 原型模板。它用完全虚构的材料申报案例演示页面配置、页面模板、mock 数据、业务规则、共享组件、前后端交接和离线预览。开发者可协作完善接口与实现；这里没有真实项目资料或生产后端。

## 从这里开始

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev
```

浏览器打开 Vite 显示的本地地址。页面可热更新，导航和路由集中在 `src/app/page-registry.ts` 与 `src/app/router.ts`。

页面登记的 `path` 只写静态路径，例如 `/material-submission/apply`，不要把 `?id=...` 写入注册表。深链接可以使用 `#/material-submission/apply?id=demo-001`；路由按路径匹配，查询参数可从 `useHashRouter()` 返回的 `query`（`URLSearchParams`）读取。示例不会根据这些参数自动加载业务记录，参数含义仍需由项目确认。空 Hash 使用默认入口；未登记的地址显示明确提示及已有页面链接。

按需在模块 `PAGE_FLOW.md` 中记录导航配置的引用位置、非菜单入口及返回/取消目标，保持登记源唯一。需要前后端协作时，在 `contracts/API_HANDOFF.md` 中确认菜单与路由的来源及其与服务端授权的边界。

### 快速新增一个页面

这是面向简单页面的操作目标；实际用时取决于页面交互和规则复杂度。“不超过五分钟”仍是目标，尚未经过非开发产品经理计时验收。需要复做时，请使用[新增页面人测卡](docs/ADD_PAGE_TRIAL.md)。

可运行页面脚手架命令，自动复制模板并注册页面：

```bash
npm run page:new -- demo-help guide "演示帮助"
```

`demo-help` 是模块标识，`guide` 是页面标识，`演示帮助` 是页面标题。命令会生成 `src/modules/demo-help/pages/guide/`，把标题写入 mock，并将页面加入注册表。它拒绝不安全标识、已存在的路由或目录，不覆盖现有内容。角色和说明使用明确的教学占位文字，需按已确认需求核对。

接着在页面目录的 `mock.ts`、`RULES.md` 和 `Page.vue` 中补齐虚构演示内容和交互，再运行 `npm run typecheck`，用 `npm run dev` 打开新路由检查。也可以按[手动新增步骤](docs/ADD_PAGE.md#手动新增方式)复制模板并编辑注册表。五分钟仍是目标，尚未经过非开发产品经理计时验收；需要复做时请使用[新增页面人测卡](docs/ADD_PAGE_TRIAL.md)。

首次在新模块下加页时，可先运行可选命令复制五份空白模块事实模板：

```bash
npm run facts:new -- demo-help
```

命令会创建 `src/modules/demo-help/facts/module/`，只复制模板原文；若目标目录已存在则拒绝覆盖。它不会填写或确认业务规则。也可继续按[新增页面说明](docs/ADD_PAGE.md#手动新增方式)手工复制。新增页面时，页面 `RULES.md` 应链接到 `../../facts/module/BUSINESS_RULES.md`。`page:new` 与 `facts:new` 是独立可选命令，详见[新增页面说明](docs/ADD_PAGE.md)。

可照着 `src/modules/overview/pages/home/` 和 `src/modules/material-submission/pages/apply/` 阅读。使用共享组件可参考 `src/shared/components/`。如果字段要交给后端确认，先记录到模块 `contracts/`；未确认的 URL、HTTP 方法、认证和持久化策略保持待定。

默认界面采用政务蓝、14px 常用正文和适配宽屏的布局；样式集中在 `src/style.css`，可按具体项目的设计规范调整颜色、字号和布局。CSS 视口下的适配检查不等同于 Windows 125% 缩放或目标浏览器的实机验收。

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

命令先运行 Vue 类型检查，再构建经典 JavaScript 脚本、整理页面清单、使用说明和文件校验值，最后执行离线包结构审计。类型检查失败时不会生成新的预览包。通过后，可尝试双击 `dist/preview/index.html`，也可把 `dist/preview/` 放到静态服务器。包仅依赖随包提供的本地文件，不需要 Node 服务或 CDN。每个目标浏览器的 `file://` 行为仍需实测。

```bash
npm run preview:verify
```

单独重跑包审计。检查入口引用、相对资源、已注册路由、包目录白名单、文件哈希、模块脚本/外部资源引用及依赖声明。预览包只输出一份 `styles.css`，因此不支持 CSS `@import`；CSS `url()` 的相对目标须在预览包内，也允许 Vite 内嵌的 PNG、JPEG、GIF、WebP、AVIF 栅格图片 data URI。审计只检查资源引用的静态格式，不验证图片能否实际解码或渲染，也不代替浏览器交互与离线验收。

从旧版本升级后，请先重新运行 `npm run preview:pack`。新版审计会核对 `manifest.json` 的页面标题、文件清单及其 SHA-256，并核对 `PAGES.md` 的 Markdown 安全转义；包含表格分隔符、换行或 Markdown/HTML 特殊字符标题的旧包应重新生成。

## 示例边界

材料申报页按虚构案例 BR-001 至 BR-007 展示本地草稿、材料确认、表单校验、提交锁定和清除演示数据。确认材料只是一项本地状态，不上传文件；提交不发起网络请求，也不生成真实办件。业务事实以 `src/modules/material-submission/facts/module/` 为准。

本模板提供页面结构、注册表、共享 UI 组件和本地 mock 适配示例。它不提供真实 API、身份认证、权限、生产持久化、文件上传或后端处理。更多产品经理操作说明见 `docs/`。

本 Vue 示例与仓库原生案例的页面、状态、规则和静态交付方式对照见[案例实现对照](docs/CASE_COMPARISON.md)。
