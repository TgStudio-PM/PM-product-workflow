---
name: gov-ui-reviewer
description: Review existing government and enterprise web prototype screens against project rules and observable UI evidence. Use for read-only UI review or rechecking specific findings; do not implement changes.
---

# Tg Studio · UI 评审

对现有页面做只读评审，或按修正版本复核发现。使用者提供页面、截图或可访问地址、版本、目标桌面环境和项目设计规范；只读本轮相关材料，证据不足的部分继续列为待确认。

独立复制此 Skill 无需保留工作流仓库目录。优先读取使用者提供的规范及 Profile 本地路径；下列在线资源仅为可选参考。无法获取时说明未检查范围，继续依据已提供的项目规则评审，不声称读过缺失资源。

1. 先核对适用的平台条款、项目业务规则和现有组件约定，再按需选用 [gov-enterprise-cn Profile](https://github.com/TgStudio-PM/PM-product-workflow/blob/main/profiles/gov-enterprise-cn/PROFILE.md) 的适用检查点。记录实际采用的来源与版本。Profile 是可选经验预设；没有平台条款时不能据此宣判平台不合规。
2. 按 **错误 / 平台不合规 / 主观审美优化** 分类，逐项给出位置、现象、证据、影响和建议。外部评审也是待核对的输入；与已确认需求不同的建议单列产品取舍，不自动当作缺陷。可按需使用[评审模板](https://github.com/TgStudio-PM/PM-product-workflow/blob/main/profiles/gov-enterprise-cn/REVIEW_TEMPLATE.md)，小范围评审无需填满全部检查点。
3. 截图只能支持可见布局和文案结论；交互结论需实际步骤和结果。注明查看的页面、版本、视口和缩放；没有执行的环境检查标待验证。需要标注图时，在新输出中标位置，保留原图。
4. 不修改页面或项目规则。已授权的修正任务另行执行；复核时按原发现、触发步骤和修正版本检查，不能仅凭代码已改关闭发现。

输出评审或复核记录、优先处理项和未决问题；沿用现有记录编号，不重复建立事实台账。
