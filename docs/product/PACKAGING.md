# 原型交付包

本指南面向产品经理和协作开发者。交付前先明确接收者需要查看页面、修改前端源码，还是评审后端需求，再使用对应 profile。三类交付有不同的内容范围和验收责任。

## 三类交付

| 类型 | Profile | 用途 | 机器检查可以说明什么 | 还需要的产品验收 |
| --- | --- | --- | --- | --- |
| 静态预览 | `examples/package-profiles/static-preview.json` | 提供可离线打开的页面 | 白名单、入口和常见 HTML/CSS 资源引用可检查，清单与哈希可复核 | 解压后在目标浏览器打开入口，实际操作核心流程并确认页面符合预期 |
| 前端源码 | `examples/package-profiles/frontend-source.json` | 交给前端同事安装、修改和构建 | 文件白名单、必需文件、ZIP 完整性与哈希可检查 | 在干净环境安装依赖、类型检查、构建，并按目标浏览器验收运行效果 |
| 后端需求材料 | `examples/package-profiles/backend-requirements.json` | 与后端同事讨论字段、流程、接口问题 | 文档范围、必需文件、ZIP 完整性与哈希可检查 | 产品及前后端人员共同确认事实、数据结构、权限和接口语义；待确认内容不能直接实现为生产契约 |

示例 profile 仅使用仓库原创的虚构材料申报页面和 Tg Studio Vue 原型模板。后端需求包刻意不包含页面代码或 mock 数据；材料只是讨论输入，不表示已有生产接口。真实项目交付前，应另行确认授权、保密边界、目标文件清单和接收方要求，不得将真实项目文件复制到本公开案例中。

每个 ZIP 内的 `README.md` 会依据交付类型说明如何使用：静态预览包解压后在目标浏览器打开声明入口；前端源码包先查看声明入口和文件清单，仅当包内确实包含 `package.json` 时才提示进入其所在目录，并按实际脚本和已有项目说明处理依赖或运行；不含 `package.json` 时不假定使用 Node.js 或 npm；后端需求包解压后阅读声明入口中的材料。只有当 ZIP 实际包含 `docs/ADD_PAGE.md` 时，前端包 README 才会链接该新增页面指南。README 只说明使用入口，不代表浏览器、工程或产品验收已经通过。

ZIP README 还会提供可选的独立验包命令。验包脚本属于 PM-product-workflow 仓库，默认不随 ZIP 提供；接收者需先取得该仓库，再将仓库内脚本路径和 ZIP 路径传给 Python：

```text
python <path-to-PM-product-workflow>/.agents/skills/pm-prototype-packager/scripts/package.py --verify <path-to-archive.zip>
```

随包的交接材料以解压根目录为路径基准。在交付副本中改写本机定位、补齐被引用的必要事实，保留源项目原件；不要原样附入本机接力日志。源端验证日志未随包交付时，注明其覆盖范围及接收方需重新执行的检查。

包生成后才取得的新验证结论，应绑定原候选的哈希另行记录，不回写或覆盖旧 ZIP。确需更新包内材料时，另用唯一文件名生成新候选，并重新验包、记录新哈希。

## 使用示例

以下命令在仓库根目录的 Windows PowerShell 中运行。要求本机可调用 Python 3；打包脚本使用 Python 标准库。命令把产物写入本地忽略目录，避免把生成 ZIP 上传到公开仓库。

```powershell
New-Item -ItemType Directory -Force .codex-local/packages | Out-Null

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --source examples/material-submission `
  --profile examples/package-profiles/static-preview.json `
  --output .codex-local/packages/material-submission-preview.zip

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --verify .codex-local/packages/material-submission-preview.zip
```

静态预览成功生成后，解压到本地临时目录，在目标浏览器打开解压目录中的 `index.html`，检查主要交互并确认离线资源可用：

```powershell
Expand-Archive -Force .codex-local/packages/material-submission-preview.zip .codex-local/packages/material-submission-preview
Start-Process (Resolve-Path .codex-local/packages/material-submission-preview/index.html)
```

浏览器验收应至少覆盖说明必填校验、必备材料确认、暂存后刷新恢复、提交后只读和清除演示数据。此处是本仓库虚构案例的建议检查点；其他项目应依据其已确认规则制定自己的产品验收。

### 前端源码包

```powershell
python .agents/skills/pm-prototype-packager/scripts/package.py `
  --source starters/vue-prototype `
  --profile examples/package-profiles/frontend-source.json `
  --output .codex-local/packages/vue-prototype-frontend.zip

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --verify .codex-local/packages/vue-prototype-frontend.zip

Expand-Archive -Force .codex-local/packages/vue-prototype-frontend.zip .codex-local/packages/vue-prototype-frontend
Push-Location .codex-local/packages/vue-prototype-frontend
npm ci
npm run typecheck
npm run preview:pack
npm run preview:verify
npm run test:preview-verify
Pop-Location
```

依赖安装和命令运行属于源码包的工程验证。`npm run test:preview-verify` 会在隔离临时副本检查正常包及 manifest/摘要异常能否被拒绝。它们不代表产品规则正确，也不替代在接收方目标浏览器和运行环境中的验收。`npm run preview:pack` 产生的静态预览目录可另行按静态预览方式检查。

Vue starter 的 `npm run preview:pack` 会随离线预览生成 `THIRD_PARTY_NOTICES.txt`，内容取自当前安装的 Vue 运行组件包名、版本、许可字段和完整 `LICENSE` 正文；清单与摘要会一并校验。若再将该目录制作为独立静态 ZIP，应确保白名单包含此文件；旧版七文件 Vue 预览需重新构建。该固定清单只覆盖已确认的 Vue 运行组件，其他新增运行依赖需按实际使用单独维护，不构成全依赖许可审计。

<a id="backend-requirements-package"></a>
### 后端需求材料包

> **下面的原始示例命令只打包材料申报模块。** 要打包新模块，请先完成下方的 [新模块定制步骤](#customize-backend-requirements)，不要直接运行这组示例命令。

```powershell
python .agents/skills/pm-prototype-packager/scripts/package.py `
  --source starters/vue-prototype `
  --profile examples/package-profiles/backend-requirements.json `
  --output .codex-local/packages/material-submission-backend-requirements.zip

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --verify .codex-local/packages/material-submission-backend-requirements.zip
```

将解压后的 `docs/BACKEND_HANDOFF.md`、合同说明和材料申报模块事实交给相关人员逐项评审。确认 API 地址、HTTP 方法、身份权限、字段可空性、错误结构、持久化和审计要求等事项前，保持为待确认。页面上的按钮名称或 mock 结构不能单独证明后端行为。

<a id="customize-backend-requirements"></a>
#### 为新模块定制后端需求包

当前 `backend-requirements.json` 是材料申报虚构案例的固定白名单。它不会跟随 `page:new` 或新建模块自动改变；直接用它打包，只会交付 Profile 明列的材料申报事实与合同内容，不代表其他新模块已交付。要为新模块准备包，按以下步骤复制并调整 Profile：

1. 将 `examples/package-profiles/backend-requirements.json` 复制到本机忽略目录。下面使用虚构模块标识 `demo-help`；实际操作时将其替换为目标模块标识，不要把个人交付配置提交到公开仓库：

```powershell
New-Item -ItemType Directory -Force .codex-local/profiles | Out-Null
Copy-Item examples/package-profiles/backend-requirements.json .codex-local/profiles/demo-help-backend-requirements.json
```

2. 在 `include` 和 `required` 中保留通用入口 `docs/BACKEND_HANDOFF.md` 及它链接的 `api-template/API_HANDOFF.md`，避免包内相对链接断开。
3. 将 Profile 中 `src/modules/material-submission/...` 项替换为目标 `src/modules/<module>/...`，并更新 `name` 与 `limitations` 以描述目标模块和待确认边界。`include` 可包含目标模块的 `facts/module/` 和实际存在的 `contracts/API_HANDOFF.md`；`required` 则逐项列出入口、通用 API 模板及目标模块实际存在的规则事实文件。完整模块模板通常含 `CURRENT.md`、`BUSINESS_RULES.md`、`PAGE_FLOW.md`、`DECISIONS.md`、`ERROR_LEDGER.md`。模块 API 记录是可选文件：已创建时须同时列入 `include` 和 `required`，未创建时两处都省略；不要根据页面或 mock 猜接口、权限或持久化。
4. 用 `--output` 将 ZIP 写入 `.codex-local/packages/`，再运行独立验包：

```powershell
New-Item -ItemType Directory -Force .codex-local/packages | Out-Null

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --source starters/vue-prototype `
  --profile .codex-local/profiles/demo-help-backend-requirements.json `
  --output .codex-local/packages/demo-help-backend-requirements.zip

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --verify .codex-local/packages/demo-help-backend-requirements.zip

python -m zipfile -l .codex-local/packages/demo-help-backend-requirements.zip
```

5. 查看 ZIP 清单，确认 `docs/BACKEND_HANDOFF.md`、通用模板及目标模块事实均在包内；同时确认没有误带入 `material-submission`、页面源码或 mock。实际 API 和业务语义仍需产品及前后端责任人确认。

该新模块适配步骤已用完全虚构模块的隔离 Profile 验证：ZIP 生成与独立验包通过，清单只含目标模块文件、共享交接文档和 API 模板，没有材料申报模块、页面源码或 mock。该结果只验证白名单打包和包结构，不代表接口或产品验收。

## Profile 与白名单

每个 profile 声明一个交付类型、名称、输出文件名、允许收集的路径、必须存在的路径和入口。路径相对于 `--source`；`include` 只能列出明确文件或子目录，不能指向整个项目根目录。`required` 和 `entry` 必须被 `include` 覆盖。静态预览还可声明 `pages`，用于要求页面入口存在。Profile 中的 `output` 是相对 profile 所在目录的默认 ZIP 路径；使用上面的 `--output` 可将产物存到忽略目录或其他安全位置。

打包器拒绝路径逃逸、符号链接、profile 选入的常见临时/依赖目录、重复 ZIP 路径和不完整必需文件；路径组件不能以 ASCII 空格或句点结尾，且文件路径不能同时作为另一包内文件的父目录（按大小写折叠检查，包含生成的元数据文件）。原有普通点文件、中文、内部空格及正常嵌套目录仍可用。若旧包中含有上述歧义路径，请修正源文件名或目录结构并重新生成清单与 ZIP；不能通过重命名解压后的文件来保留旧清单校验。此检查限定于这些已覆盖的路径冲突，不代表完整 Windows 文件名兼容性审计。打包器在包中生成 `README.md`、`manifest.json` 与 `SHA256SUMS`。

打包和独立验包会检查 Markdown 常见行内相对链接，以及正文实际使用的完整 `[text][label]` 和折叠 `[label][]` 引用式相对链接是否指向包内文件。引用标签按大小写不敏感方式匹配，内部空白会折叠；定义支持尖括号包围的含空格路径和同一行的常见可选标题。外链、纯片段、代码示例和未使用的引用定义会跳过。检查不覆盖 shortcut-style `[label]`、完整 CommonMark 语法、跨行标题等较少见形式；不要把它视作通用 Markdown 解析器。若白名单目录递归遇到 `node_modules`、`dist` 等禁入路径，打包会失败，不会静默跳过这些内容；应调整 `include` 白名单。静态预览会检查 HTML/CSS 中可识别的本地资源引用，并拒绝可识别的远程或绝对资源引用、JavaScript 模块加载、脚本/内嵌文档/样式导入上下文中的可执行 `data:` 引用，以及常见 JavaScript 网络 API 的静态特征。图片等非执行用途的内嵌 `data:` 资源仍可使用。该启发式扫描无法证明所有动态代码都不会联网，也不能代替浏览器网络检查。源码 profile 可显式包含需要交付的源代码和锁文件，但不能选择禁入目录。

必须区分三种结论：

- **包结构检查**：脚本成功生成 ZIP、必需路径存在、归档清单和 SHA256 一致。
- **工程或运行验证**：在干净副本安装、类型检查、构建，或在目标浏览器打开静态包并检查资源与交互。
- **产品和对接验收**：产品经理核对规则、角色、状态和流程；前后端人员确认接口及数据契约。

第一类通过不能代替第二、第三类。未运行的检查应明确标为未运行；脚本没有检查生产服务、真实权限、数据持久化或后端接口。
