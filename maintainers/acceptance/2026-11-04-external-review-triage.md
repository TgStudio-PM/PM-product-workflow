# 外部评审线索取舍摘要

日期：2026-11-04。

本摘要为取舍记录；报告自述测试未逐项复核，非产品验收。

## 证据边界

- 五份报告主要基于 `12d8e92`；一份静态报告版本未完全核实。均非独立真人 PM 验收。
- 配套 JSON 仅属外部工程观察，不累加或覆盖仓库结果。
- Vue JSON 含新增“试用帮助”页，是演练副本、非 `main` 快照。
- Grok 工作区是 TanStack/React 报告应用，无原 ZIP/完整日志；三图仅作页面观察，不引入框架或演练需求。

## 取舍

| 线索 | 处理 |
| --- | --- |
| 项目与 README 状态滞后 | 已由 [Issue #179](https://github.com/TgStudio-PM/PM-product-workflow/issues/179) 修正；详见[错误记录](../errors/ERR-20261104-001.md)。 |
| `test:preview-verify` 缺 `dist` 前置 | 已复现并补前置提示与 README，缺件明确非零；详见 [ERR-20261104-002](../errors/ERR-20261104-002.md) 与 [Issue #181](https://github.com/TgStudio-PM/PM-product-workflow/issues/181)。 |
| 非 Git 目录中的维护脚本报错 | CLI 已独立复现；[Issue #180](https://github.com/TgStudio-PM/PM-product-workflow/issues/180) 待修。保留 exit 2，不回显 Git 原始 stderr。 |
| 模板主任务后移建议 | 与当前模板顺序不符；单行 Markdown 不构成长度限制，不增字段。 |
| 暂存后材料仍缺 | 证据不足以确认是缺陷；不改提交规则。 |
| 端口、默认打开方式、跨平台示例和帮助文案 | 低优先；按实际需求做最小补充，不建通用体系。 |

## 范围

不增迭代模板、不重做演示、不转向移动端；维持独立非开发 PM 验收，不发 Release。原报告、JSON、日志和图片不入仓库。
