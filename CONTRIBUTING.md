# 贡献指南

感谢你改进 PM-product-workflow。欢迎围绕产品工作流、项目/模块模板、现有 Skills、可选设计 Profile，以及可复现的问题提交改进。贡献应服务于实际的原型开发和持续迭代，不以新增演示应用或样例页面为目标。

## 开始前

1. 读取 `AGENTS.md` 指定的维护文档并核对远端最新 `main`。
2. 从最新 `main` 创建独立分支，一个 PR 只处理一个核心目标。
3. 只提交有权公开的内容；具体保密与来源要求见[开源边界](maintainers/OPEN_SOURCE_BOUNDARY.md)。
4. 根据 `maintainers/MAINTENANCE_POLICY.md` 判断风险，无法确定时提高一级。

## PR 最低要求

- 说明触发问题、预期行为和影响范围。
- 同步受影响的工作流文档、模板、Skill、Profile 或维护规则。
- 分别说明产品验收与机器验证，并列出未执行项。
- 完成公开内容和 Markdown 链接检查。
- 高风险变更通过 PR 留痕并按维护政策审查；合并授权不包含正式 Release。

本地验证命令：

```bash
python -m unittest discover -s maintainers/tests -v
python maintainers/scripts/check_public_content.py --root .
python maintainers/scripts/check_markdown_links.py .
git diff --check
```

`check_public_content.py` 与差异风险判断依赖 Git 文件清单和提交历史，应在正式 Git 工作副本中运行。普通产品使用者从[产品指南](docs/product/README.md)开始；模板和打包命令不要求 Git。