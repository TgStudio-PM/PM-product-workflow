# 新增页面：产品经理操作说明

下面用完全虚构的 `demo-help` 信息页演示如何新增一个简单页面。页面脚手架命令是可选的，也可以按“手动新增方式”复制模板。示例只是本地原型，不代表生产接口、身份或持久化能力。

## 使用页面脚手架

在 `starters/vue-prototype/` 工程根目录运行：

```bash
npm run page:new -- demo-help guide "演示帮助"
```

参数依次是模块标识、页面标识和显示标题。命令创建 `src/modules/demo-help/pages/guide/`，复制 `Page.vue`、`mock.ts`、`RULES.md`，将标题写入 mock，并把组件、路由、标题和菜单名加入 `src/app/page-registry.ts`。路由会生成为 `/demo-help/guide`。

模块和页面标识须使用以小写英文字母开头的小写字母、数字和连字符。命令遇到不安全标识、重复路由、导入名冲突或已存在的页面目录时会报错，不覆盖已有内容。新增项中的角色与说明是教学占位文字，不能作为权限或需求事实；请按已确认需求核对。

脚手架只处理目录和注册表的重复工作。请继续按页面需求修改 `mock.ts`、`Page.vue` 和 `RULES.md`：mock 保存虚构展示数据，页面组件负责交互与呈现，规则索引记录验收点并链接模块事实。字段或规则变化时同步对应事实文档。

如果需要与后端协作，在模块 `contracts/` 记录字段结构、样例、校验及待确认问题；不要猜接口 URL、HTTP 方法或认证方式。

## 手动新增方式

1. 复制 `page-template/` 到 `src/modules/<模块>/pages/<页面>/`。
2. 在页面目录维护 `mock.ts`、`Page.vue` 和 `RULES.md`。
3. 在 `src/app/page-registry.ts` 增加组件导入和静态注册项。注册表同时驱动页面切换与导航；通常无需修改 `src/app/router.ts`。每个路由应唯一。

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
