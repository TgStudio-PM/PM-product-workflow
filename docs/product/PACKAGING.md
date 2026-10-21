# 原型交付包

本指南面向产品经理和协作开发者。交付前先明确接收者需要查看页面、修改前端源码，还是评审后端需求，再使用对应 profile。三类交付有不同的内容范围和验收责任。

## 三类交付

| 类型 | Profile | 用途 | 机器检查可以说明什么 | 还需要的产品验收 |
| --- | --- | --- | --- | --- |
| 静态预览 | `examples/package-profiles/static-preview.json` | 提供可离线打开的页面 | 白名单、入口和常见 HTML/CSS 资源引用可检查，清单与哈希可复核 | 解压后在目标浏览器打开入口，实际操作核心流程并确认页面符合预期 |
| 前端源码 | `examples/package-profiles/frontend-source.json` | 交给前端同事安装、修改和构建 | 文件白名单、必需文件、ZIP 完整性与哈希可检查 | 在干净环境安装依赖、类型检查、构建，并按目标浏览器验收运行效果 |
| 后端需求材料 | `examples/package-profiles/backend-requirements.json` | 与后端同事讨论字段、流程、接口问题 | 文档范围、必需文件、ZIP 完整性与哈希可检查 | 产品及前后端人员共同确认事实、数据结构、权限和接口语义；待确认内容不能直接实现为生产契约 |

示例 profile 仅使用仓库原创的虚构材料申报页面和 Tg Studio Vue 原型模板。后端需求包刻意不包含页面代码或 mock 数据；材料只是讨论输入，不表示已有生产接口。真实项目交付前，应另行确认授权、保密边界、目标文件清单和接收方要求，不得将真实项目文件复制到本公开案例中。

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
Pop-Location
```

依赖安装和命令运行属于源码包的工程验证。它们不代表产品规则正确，也不替代在接收方目标浏览器和运行环境中的验收。`npm run preview:pack` 产生的静态预览目录可另行按静态预览方式检查。

### 后端需求材料包

```powershell
python .agents/skills/pm-prototype-packager/scripts/package.py `
  --source starters/vue-prototype `
  --profile examples/package-profiles/backend-requirements.json `
  --output .codex-local/packages/material-submission-backend-requirements.zip

python .agents/skills/pm-prototype-packager/scripts/package.py `
  --verify .codex-local/packages/material-submission-backend-requirements.zip
```

将解压后的 `docs/BACKEND_HANDOFF.md`、合同说明和模块事实交给相关人员逐项评审。确认 API 地址、HTTP 方法、身份权限、字段可空性、错误结构、持久化和审计要求等事项前，保持为待确认。页面上的按钮名称或 mock 结构不能单独证明后端行为。

## Profile 与白名单

每个 profile 声明一个交付类型、名称、输出文件名、允许收集的路径、必须存在的路径和入口。路径相对于 `--source`；`include` 只能列出明确文件或子目录，不能指向整个项目根目录。`required` 和 `entry` 必须被 `include` 覆盖。静态预览还可声明 `pages`，用于要求页面入口存在。Profile 中的 `output` 是相对 profile 所在目录的默认 ZIP 路径；使用上面的 `--output` 可将产物存到忽略目录或其他安全位置。

打包器拒绝路径逃逸、符号链接、profile 选入的常见临时/依赖目录、重复 ZIP 路径和不完整必需文件，并在包中生成 `README.md`、`manifest.json` 与 `SHA256SUMS`。若白名单目录递归遇到 `node_modules`、`dist` 等禁入路径，打包会失败，不会静默跳过这些内容；应调整 `include` 白名单。静态预览会检查 HTML/CSS 中可识别的本地资源引用，并拒绝可识别的远程或绝对资源引用、JavaScript 模块加载，以及常见 JavaScript 网络 API 的静态特征。该启发式扫描无法证明所有动态代码都不会联网，也不能代替浏览器网络检查。源码 profile 可显式包含需要交付的源代码和锁文件，但不能选择禁入目录。

必须区分三种结论：

- **包结构检查**：脚本成功生成 ZIP、必需路径存在、归档清单和 SHA256 一致。
- **工程或运行验证**：在干净副本安装、类型检查、构建，或在目标浏览器打开静态包并检查资源与交互。
- **产品和对接验收**：产品经理核对规则、角色、状态和流程；前后端人员确认接口及数据契约。

第一类通过不能代替第二、第三类。未运行的检查应明确标为未运行；脚本没有检查生产服务、真实权限、数据持久化或后端接口。
