---
name: gov-ui-refactor
description: Apply scoped UI fixes to an existing government or enterprise web prototype while preserving its stack, components, and confirmed behavior. Use for approved visual or interaction adjustments, not a full application rewrite.
---

# Tg Studio · UI 定向改造

将明确的界面需求或已选定的评审项落实为现有原型代码。先核对项目入口、目标版本、未提交改动、设计规范、受影响页面与组件，以及本轮允许的修改范围。

1. 沿用项目技术栈和组件体系，包括既有 Element UI / Element Plus；保留路由、字段、业务规则、数据来源和用户现场。截图用于理解目标，不替代现有页面行为。不要默认另做单文件 HTML 或重写项目。
2. 平台适用条款优先，其次是项目确认的设计与组件约定，再参考可选 [gov-enterprise-cn Profile](../../../profiles/gov-enterprise-cn/PROFILE.md)。缺少依据时不承诺平台合规。没有确定视觉方向的整体重设计，先明确方向再扩大实施。
3. 只改本轮需求对应的样式与交互；共享组件的变化检查其它调用处。业务调整、接口变化或超范围问题单列待确认，独立且明确的部分继续。原型页面中的说明服务实际操作，不默认插入开发说明、版本页脚或重复提示；保留用户要求及操作所必需的文案。
4. 在实际运行版本中复核受影响入口、关键操作、异常反馈及目标桌面视口/缩放。按项目现有命令做相关回归；无法运行时交付代码和待验证项，不把构建当作界面复核。需要生成独立文件时使用授权输出位置，保留已有文件。

回传改动位置、对应需求/发现项、实际验证和遗留问题。事实或规则确有变化时增量同步已有记录；不因样式调整重写整套业务文档。
