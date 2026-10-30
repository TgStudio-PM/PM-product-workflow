# 新增页面：产品经理操作说明

下面用完全虚构的 `demo-help` 信息页演示如何新增一个简单页面。页面脚手架命令是可选的，也可以按“手动新增方式”复制模板。示例只是本地原型，不代表生产接口、身份或持久化能力。

## 使用页面脚手架

在 `starters/vue-prototype/` 工程根目录运行：

```bash
npm run page:new -- demo-help guide "演示帮助"
```

参数依次是模块标识、页面标识和显示标题。命令创建 `src/modules/demo-help/pages/guide/`，复制 `Page.vue`、`mock.ts`、`RULES.md`，将标题写入 mock，并把组件、路由、标题和菜单名加入 `src/app/page-registry.ts`。路由会生成为 `/demo-help/guide`。

模块和页面标识须使用以小写英文字母开头的小写字母、数字和连字符。命令遇到不安全标识、重复路由、导入名冲突或已存在的页面目录时会报错，不覆盖已有内容。新增项中的角色与说明是教学占位文字，不能作为权限或需求事实；请按已确认需求核对。

`page:new` 只处理页面目录和注册表，不创建模块事实文件。首次创建模块时，可选运行：

```bash
npm run facts:new -- demo-help
```

命令将五份空白模板原样复制到 `src/modules/demo-help/facts/module/`；目标目录已存在时拒绝覆盖，模板缺文件或模块标识不安全时会报错。该命令不填写或确认业务规则。也可手工将 `module-template/facts/module/` 复制到 `src/modules/<模块>/facts/module/`；模板包含当前状态、业务规则、页面流程、决策和错误记录。每个页面的 `RULES.md` 应链接到所属模块的 `../../facts/module/BUSINESS_RULES.md`，规则正文只维护在模块事实文件中。页面和字段迭代时，按证据分别记录当前实现、待确认事项和已由产品负责人确认的规则；不要把生成的页面文案或 mock 自动提升为已确认需求。

请继续按页面需求修改 `mock.ts`、`Page.vue` 和 `RULES.md`：mock 保存虚构展示数据，页面组件负责交互与呈现，规则索引记录本页验收点并链接模块事实。字段或规则变化时同步对应事实文档。

如果新模块需要与后端协作讨论服务端数据或行为，按需复制[可选模块 API 对接记录模板](../api-template/API_HANDOFF.md)到使用者模块的 `contracts/API_HANDOFF.md`。该文件是模块对接细节的单一权威位置；服务端字段和接口实现由前后端确认，业务含义与规则依据模块事实并由产品负责人确认。本工程没有生产后端，不能猜接口 URL、HTTP 方法、认证方式或生产字段。已有材料申报虚构案例的 `src/modules/material-submission/contracts/README.md` 是该案例自己的讨论材料，不是生产契约，也不需要为了新增模块改写或复制其案例事实。

## 手动新增方式

1. 复制 `page-template/` 到 `src/modules/<模块>/pages/<页面>/`。
2. 在页面目录维护 `mock.ts`、`Page.vue` 和 `RULES.md`。
3. 在 `src/app/page-registry.ts` 增加组件导入和静态注册项。注册表同时驱动页面切换与导航；通常无需修改 `src/app/router.ts`。每个路由应唯一。

## 部分完成后的接续

如果 `page:new` 提示页面目录已创建、但 `src/app/page-registry.ts` 未更新，不要直接重跑命令；目标目录已存在，重试会被拒绝。按当前文件现场继续：

1. 在项目根目录检查目标目录中的 `Page.vue`、`mock.ts` 和 `RULES.md`；若项目使用 Git，同时核对 `git status --short`，保留已有修改。
2. 检查 `src/app/page-registry.ts` 当前是否已有目标页面的组件导入和静态路由。已存在时不要重复添加。
3. 若缺失，按上文“手动新增方式”只补相应导入和注册项；保留注册表中的其他现有变更，不用旧快照覆盖整个文件。
4. 运行 `npm run typecheck` 和 `npm run preview:pack`，并从入口核对新页面及相关旧页面；在已有模块 `CURRENT.md` 或接续记录中简记失败现场和下一步，不必为此新建文件。

离线预览打包会逐项读取注册表的 `path` 和 `title`。两者需使用确定的字符串，字段先后顺序不限；动态计算的标题或路径会在打包时被明确拒绝。

## 验收与离线预览

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
