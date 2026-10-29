# Issue #156 工作流与交付验收摘要

- 日期：2026-10-29
- 范围：[Issue #156](https://github.com/TgStudio-PM/PM-product-workflow/issues/156) 的公开源基线和完全虚构隔离演练；不是实际业务批准、目标 PM 人测或正式发布。
- 代码基线：PR #158 已合并到 `main`，提交 `e2b9088184c8391bc79d0fb16bd5f36004f1417d`。`starters/vue-prototype/` 与 `examples/material-submission/` 相对 `057f395fb5390d181461fa62c3cddeefcb478331` 无差异；原导出 71 个文件的 SHA-256 和隔离 Git 起始的 58 个 blob 已核对。

## 公开源基线 `file://` 自动化

- 环境：Node 24.22.1、Playwright 1.62.1、Chrome 155.0.8059.86、Edge 156.0.4314.50；headless，1440×900，DSF 1。分别检查 native direct、Vue overview、Vue direct，共 6 个浏览器/入口 suite，每 suite 18 项。
- 结果：108 pass、0 fail、0 unrun；72 个 `file:` 请求事件，HTTP(S) 尝试、失败请求、console error、pageerror、fatal error 均为 0；生成 4 张截图。
- 这仅证明上述公开提交快照的这组自动化运行，不证明手工双击关联、目标 PM 人测、真实服务或正式发布。

## 原创隔离演练与独立复核

- “材料申报”改名和 `space-sketch` 改必备只用于隔离练习；未改变公开案例的规则或质量定位。fork-none 接续完成未完成的 h1，保留了 README 与 LOCAL_NOTE 现场标记；版本未知的开发反馈未覆盖确认的演练目标。
- 源端证据范围经接收方独立复核后，`_02` 前端包和后端包只补充元数据/证据可用性说明；原 TASK_INPUT、FEEDBACK_INPUT 字节保持不变。前端 README 明确输入目录属于源端、不是包清单，原始全量证据不在包内；HANDOFF 相对路径可达，但提交号仅为源端记录，包内不含 `.git` 历史。后端 README、BACKEND_HANDOFF 和 DECISIONS 说明源端 HANDOFF 未随包，接收者不能在包内复核；规则、未知反馈和 API 待确认状态保留，未发现新增 Markdown 断链。没有新增 API、扫描能力或生产能力。
- 规则引用遗漏由独立 forward 发现，经委派修正并由主线复核；见[ERR-20261029-002](../errors/ERR-20261029-002.md)。PR #158 的 CI 通过。
- 演练原矩阵为 10 pass、2 fail、0 unrun；scenario 2 的两项旧失败保留。首次失败读了提交后已消失的错误 locator；后续定向 QA 又把 checkbox 自身 `disabledProperty` 错当成禁用判据。实际为父 fieldset `disabled`，checkbox 自身 disabled 为 false，但 `matches(:disabled)` 为 true。
- 主线对 scenario 2 做了单独、只读 DOM 复核：先确认缺项时提交被拦截并显示全部三项提示，再选中 `space-sketch` 确认已提交、fieldset/textarea/submit 禁用，以及三个 checkbox 均有效禁用。Chrome 与 Edge 各 1 项通过，HTTP 尝试及运行错误为 0。
- 合并口径是原 10 项通过加独立复核的 2 项通过，覆盖 12 个不同浏览器×场景组合；不是单轮 12/12。旧失败记录未改写，也不据此声称旧 QA 脚本全部通过。QA 记录见[ERR-20261029-003](../errors/ERR-20261029-003.md)。
- 本机中断标记哈希已留存：README `8F378FDEF3700CA99EFEB4F0F72EF3D127EEE5EB85F4181B72C273CD4B706EF9`；LOCAL_NOTE `AE3099EAEBDC1E5E822159CAD5A87D706288996AD8D90EC5C88D2C4F7C8C1535`。它们是现场保留核对值，不是交付包内容。

## 本地交付候选

- 前端源码：`vue-original-exercise-frontend-source_20261029_02.zip`，SHA-256 `B17A21E00A582F27C56D5569820E56EFEB1312DA77A31BE20BE1C9B2AD502724`，入口 `project/index.html`。独立验包、干净副本 `npm ci`、typecheck 和 `preview:pack` 通过；59 个非 README payload 文件与 `_01` 逐字节一致。
- 后端需求：`vue-original-exercise-backend-requirements_20261029_02.zip`，SHA-256 `5EEECCCB913844339908809B1562F5FC90C68183356DBDFBE4D5ED443056BEEB`，入口 `project/docs/BACKEND_HANDOFF.md`。独立验包通过；不含页面源码或 mock。真实 API、权限和生产契约仍未确认。
- 静态预览：保留 `vue-original-exercise-static-preview_20261029_01.zip`，SHA-256 `F71E42819B2C206B390467A7ED7FBD444DFA5B4229B7DAA124FE4F0FB53B795A`，入口 `index.html`。独立验包通过；未重建 `_02`，因为前端干净构建的 4 个静态运行文件哈希与该候选一致。scenario 2 浏览器复核针对该哈希。
- 三个 ZIP 均为本机候选，无公开下载或正式 Release；`_01` 保留，未原位覆盖。交付与验包结论不代表生产契约、目标 PM 验收或发布授权。

## 仍待完成

独立非开发产品经理完整主任务人测、手工离线打开/文件关联、Windows 真机 2K/125% 反馈、真实前后端契约及正式 Release 授权仍未完成。本摘要和 Agent/浏览器自动化不替代这些结论。
