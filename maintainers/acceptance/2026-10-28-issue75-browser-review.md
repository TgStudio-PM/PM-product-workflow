# Issue #75：离线预览浏览器复验记录

- 日期：2026-10-28
- 执行方式：外部 AI 自动化浏览器复验；本记录由维护者复核报告、结果文件及包内哈希
- 环境：Windows Chrome、Edge；`file://`；1280×800
- 浏览器精确版本：未记录
- 对应修复：[Issue #75](https://github.com/TgStudio-PM/PM-product-workflow/issues/75)、[PR #133](https://github.com/TgStudio-PM/PM-product-workflow/pull/133)；复验包由修复提交 `0d33767210cfeef51e288aad124625ab939d6115` 的隔离副本增加原创 PNG 标记后构建。

## 结果

| 检查项 | 结果 |
|---|---|
| CSS 内嵌 2×2 PNG 标记放大后显示四色标记 | 通过 |
| 页面导航及草稿刷新恢复 | 通过 |
| HTTP(S) 请求 | 0 |
| 失败请求、pageerror、consoleerror | 0 |

静态包的 `SHA256SUMS` 所列 6 个文件均与实际摘要匹配；清单文件本身不在哈希列表中。入口 `index.html` SHA-256：`1A2DD49B9331ABA73B0C66904818B7F875AD9BB8ACE5EF1ACA821968534632CB`；CSS SHA-256：`32f0d82da034e047f6d40cc899a696f9c2860872f4743de02207ba1e7fbfc0cb`。

外部复验报告 SHA-256：`52332D6DFB19F9BA37FEAFEF9772D2336059E3FD6F17B61C4F9643ADE928777A`；结构化结果 SHA-256：`EEB7350A95F7475F90C8259173C11F10A75939F2F488696E29F8D62247C71A52`。

## 验收边界

结果支持 Issue #75 指定静态预览包在 Chrome、Edge `file://` 下的本轮机器层复验。它不代表维护者亲自重新运行浏览器，也不替代独立非开发产品经理人测、其他视口复验、原生案例第四轮复验或正式发布验收。浏览器精确版本待补。
