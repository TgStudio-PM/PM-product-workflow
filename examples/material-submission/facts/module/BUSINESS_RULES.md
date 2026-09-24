# 业务规则

| ID | 规则 | 状态 | 适用范围 | 产品确认依据 | 当前实现证据 | 最近修改 |
| --- | --- | --- | --- | --- | --- | --- |
| BR-001 | 页面品牌为 Tg Studio；申报事项固定显示为“Tg Studio 示例项目材料申报”。 | 已确认 | 页面品牌与事项信息 | DEC-001：Tg Studio 是页面品牌，事项名称是本案例原创展示文案 | `examples/material-submission/index.html` 的品牌和事项字段 | 2026-09-24 |
| BR-002 | 申请说明去除首尾空白后不得为空，最多 500 个字符。 | 已确认 | 申报表单 | Issue #8：说明为必填；DEC-001：本案例原创设定 500 字上限 | `examples/material-submission/index.html` 的长度限制；`examples/material-submission/app.js` 的提交校验 | 2026-09-24 |
| BR-003 | “项目背景说明”“页面流程草图”“迭代计划摘要”三项演示材料全部确认后才可提交；勾选仅表示已备齐，不上传文件。 | 已确认 | 材料清单与提交校验 | Issue #8：使用虚构材料清单并验证必填；DEC-001：本案例以勾选确认、不上传文件 | `examples/material-submission/index.html` 材料说明；`examples/material-submission/app.js` 的必填判断 | 2026-09-24 |
| BR-004 | 未提交内容以“草稿”保存至当前浏览器本地存储，重新打开或刷新页面时恢复。 | 已确认 | 草稿 | Issue #8：本地草稿暂存与恢复；DEC-001：本案例使用当前浏览器本地存储 | `examples/material-submission/app.js` 的本地存储读写 | 2026-09-24 |
| BR-005 | 必填校验通过后状态变为“已提交”，申请说明与材料确认控件只读且不能再次提交。 | 已确认 | 提交后 | Issue #8：提交后只读；DEC-001：本案例状态和控件锁定决定 | `examples/material-submission/app.js` 的提交状态与控件锁定 | 2026-09-24 |
| BR-006 | “清除演示数据”只移除此案例使用的本地存储键，重置页面并回到“草稿”。 | 已确认 | 重置 | Issue #8：清除演示数据并重开；DEC-001：本案例清除专用本地数据后回到草稿 | `examples/material-submission/app.js` 的重置处理 | 2026-09-24 |
| BR-007 | 本案例不上传文件、不发起网络请求、不生成真实办件；内容为虚构教学示例。 | 已确认 | 整个案例 | Issue #8：案例完全虚构且离线运行；DEC-001：不上传文件、不模拟真实办理 | `examples/material-submission/index.html` 的教学提示；`examples/material-submission/app.js` 未发起网络请求 | 2026-09-24 |

## 冲突处理

页面代码说明当前实现。规则调整须同步 `PAGE_FLOW.md`、`CURRENT.md` 和受影响的页面代码；不能仅依据代码反推确认新的业务需求。发现差异时先记录差异与证据，再决定修改方向。
