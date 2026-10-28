# 贡献指南

感谢你改进 PM-product-workflow。本文件只说明贡献入口，完整治理规则以根目录 `AGENTS.md` 和 `maintainers/` 为准。

## 开始前

1. 读取 `AGENTS.md` 指定的维护文档并核对远端最新 `main`。
2. 从最新 `main` 创建独立分支，一个 PR 只处理一个核心目标。
3. 贡献案例和数据必须完全虚构；不得提交真实项目材料、本机路径、凭据或授权不明的资产。
4. 根据 `maintainers/MAINTENANCE_POLICY.md` 判断风险，无法确定时提高一级。

## PR 最低要求

- 说明触发问题、最终行为、影响范围和风险理由。
- 同步受影响的产品文档、模板、Profile、案例或维护规则。
- 分别记录产品验收与机器验证，并列出未执行项。
- 完成公开内容和 Markdown 链接检查。
- 高风险变更也通过 PR 留痕；Coding Agent 按维护政策加强差异、来源、授权和验证审查，并自行决定是否合并，不逐项请求产品负责人批准。证据不足或检查失败时不得合并。

PR 合并授权不代表正式发布授权。创建 GitHub Release、发布包或对外发布声明须单独取得明确授权。

本地验证命令：

```bash
python -m unittest discover -s maintainers/tests -v
python maintainers/scripts/check_public_content.py --root .
python maintainers/scripts/check_markdown_links.py .
git diff --check
```

`maintainers/scripts/check_public_content.py` 以及使用 `--base-ref` 的差异风险判断依赖 Git 文件清单、提交历史和 Git 命令，应在正式 Git 工作副本中运行。GitHub 的 Download ZIP 不包含 `.git` 元数据；若要参与仓库维护，请先获取 Git 工作副本。普通产品使用者请从[产品指南](docs/product/README.md)开始；产品模板和打包命令不因此要求 Git。
