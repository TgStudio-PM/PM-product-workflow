# 决策记录

## DEC-001

- 日期：2026-09-24
- 状态：已确认
- 背景：需要一个可离线运行的完整教学例子，展示原型代码与项目事实如何共同维护。
- 决定：首轮只实现单页虚构材料申报；“公共空间微更新材料申报”、三项演示材料和 500 字说明上限均为本案例原创展示设定，不代表现实事项或政策；材料通过勾选确认，不上传文件；草稿使用浏览器本地存储，提交后只读，可清除本案例数据重开。
- 理由：覆盖填报、必填校验、暂存、提交、重置闭环，同时明确静态页面能力边界。
- 影响规则：BR-001 至 BR-007。
- 影响页面或文件：`examples/material-submission/index.html`、`examples/material-submission/styles.css`、`examples/material-submission/app.js`、`examples/material-submission/facts/module/`。
- 验证：规则与页面已静态核对；真实浏览器下的离线交互验收待主线完成。
