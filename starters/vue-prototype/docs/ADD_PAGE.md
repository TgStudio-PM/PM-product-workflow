# 新增页面：产品经理操作说明

下面用完全虚构的 `demo-help` 信息页演示如何新增一个简单页面。按实际模块和页面改名；示例只是本地原型，不代表生产接口、身份或持久化能力。

## 1. 复制页面模板

在 `starters/vue-prototype/` 工程根目录运行 PowerShell：

```powershell
New-Item -ItemType Directory -Force .\src\modules\demo-help\pages | Out-Null
Copy-Item -Path .\page-template -Destination .\src\modules\demo-help\pages\guide -Recurse
```

这会创建 `src/modules/demo-help/pages/guide/`，其中包含 `Page.vue`、`mock.ts` 和 `RULES.md`。将 `demo-help`、`guide` 和页面显示名称替换为自己的虚构演示模块、页面标识和名称；标识应使用小写英文与连字符。

## 2. 更新页面内容

- 在 `mock.ts` 放页面要展示的虚构数据，避免把数据直接写进视图。
- 按预期交互修改 `Page.vue`，优先使用 `src/shared/components/` 中的共享组件。
- 在 `RULES.md` 记录页面行为、验收点和待确认事项。字段或规则变化时同步更新。

## 3. 注册页面

`src/app/page-registry.ts` 是页面组件、hash 路径和导航菜单的唯一注册位置。按现有条目补一个组件导入和注册项，例如：

```ts
import DemoHelpPage from '../modules/demo-help/pages/guide/Page.vue'

// 在 pageRegistry 数组中增加：
{
  path: '/demo-help/guide',
  title: '演示帮助',
  menuLabel: '演示帮助',
  demoRole: '教学案例使用者',
  description: '查看虚构的页面使用提示。',
  component: DemoHelpPage,
},
```

替换组件名、导入路径、唯一的 `path`、标题、菜单名、演示角色和说明。该注册表同时驱动页面切换与导航；通常无需修改 `src/app/router.ts`。保持单一注册项，避免重复路径。

离线预览打包会逐项读取注册表的 `path` 和 `title`。两者请写成确定的字符串，字段先后顺序不限；动态计算的标题或路径会在打包时被明确拒绝。

如果需要与后端协作，在模块 `contracts/` 记录字段结构、样例、校验及待确认问题；不要猜接口 URL、HTTP 方法或认证方式。

## 4. 验收与离线预览

在工程根目录运行：

```powershell
npm run typecheck
npm run dev
```

从导航进入新页，确认页面展示与 `mock.ts`、`RULES.md` 一致；刷新后直接打开该 hash 路径也应能回到新页。若要交付离线预览，再运行：

```powershell
npm run preview:pack
npm run preview:verify
```

`preview:pack` 会构建并审计离线预览包；通过后可双击 `dist/preview/index.html`，或将 `dist/preview/` 放到静态服务器。包使用随包提供的本地资源，不需要 Node 服务或 CDN。静态审计通过不等同于浏览器验收；请在目标浏览器实测 `file://` 页面导航、刷新和核心交互，并回归已有页面。非开发产品经理计时复做请使用[新增页面人测卡](ADD_PAGE_TRIAL.md)。
