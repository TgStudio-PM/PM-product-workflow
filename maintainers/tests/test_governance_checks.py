from __future__ import annotations

import sys
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "maintainers" / "scripts"))

from check_markdown_links import check_file  # noqa: E402
from check_public_content import classify_risk, scan_text  # noqa: E402


def git(root: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)


class RiskClassificationTests(unittest.TestCase):
    def make_repo(self, files: dict[str, bytes | str]) -> Path:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        git(root, "init", "-q")
        git(root, "config", "user.email", "test@example.invalid")
        git(root, "config", "user.name", "Governance Test")
        self.write_files(root, files)
        git(root, "add", "--all")
        git(root, "commit", "-qm", "base")
        git(root, "branch", "base")
        return root

    @staticmethod
    def write_files(root: Path, files: dict[str, bytes | str]) -> None:
        for name, content in files.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            if isinstance(content, bytes):
                path.write_bytes(content)
            else:
                path.write_text(content, encoding="utf-8")

    @staticmethod
    def commit_changes(root: Path) -> None:
        git(root, "add", "--all")
        git(root, "commit", "-qm", "change")

    def test_readme_context_does_not_escalate_ordinary_edit(self) -> None:
        root = self.make_repo({"README.md": "Header\n- [x] 建立 README、开源边界和基础模板\nfooter one\n"})
        (root / "README.md").write_text(
            "Header\n- [x] 建立 README、开源边界和基础模板\nfooter updated\n", encoding="utf-8"
        )
        self.commit_changes(root)
        self.assertEqual(classify_risk(root, "base"), ("medium", ["README.md"]))

    def test_added_and_removed_readme_high_risk_terms_escalate(self) -> None:
        for before, after in (
            ("普通说明\n", "新增开源边界说明\n"),
            ("开源边界说明\n", "普通说明\n"),
            ("普通说明\n", "++ 开源边界说明\n"),
            ("-- 开源边界说明\n", "普通说明\n"),
        ):
            with self.subTest(before=before, after=after):
                root = self.make_repo({"README.md": before})
                (root / "README.md").write_text(after, encoding="utf-8")
                self.commit_changes(root)
                self.assertEqual(classify_risk(root, "base")[0], "high")

    def test_readme_deletion_and_rename_are_high_risk(self) -> None:
        deleted = self.make_repo({"README.md": "Project overview\n"})
        (deleted / "README.md").unlink()
        self.commit_changes(deleted)
        self.assertEqual(classify_risk(deleted, "base")[0], "high")

        renamed = self.make_repo({"README.md": "Project overview\n"})
        git(renamed, "mv", "README.md", "README-archive.md")
        self.commit_changes(renamed)
        self.assertEqual(classify_risk(renamed, "base")[0], "high")

    def test_binary_readme_is_conservatively_high_risk(self) -> None:
        root = self.make_repo({"README.md": "Project overview\n"})
        (root / "README.md").write_bytes(b"\x00binary\xff")
        self.commit_changes(root)
        self.assertEqual(classify_risk(root, "base")[0], "high")

    def test_invalid_utf8_readme_diff_is_conservatively_high_risk(self) -> None:
        root = self.make_repo({"README.md": b"Project overview\n"})
        (root / "README.md").write_bytes(b"Project overview\nInvalid byte: \xff\n")
        self.commit_changes(root)
        self.assertEqual(classify_risk(root, "base")[0], "high")

    def test_product_starter_is_medium_risk_case_insensitively(self) -> None:
        root = self.make_repo({"README.md": "Project overview\n"})
        self.write_files(root, {"Starters/Vue-Prototype/package.json": "{}\n"})
        self.commit_changes(root)
        self.assertEqual(
            classify_risk(root, "base"),
            ("medium", ["Starters/Vue-Prototype/package.json"]),
        )

    def test_existing_high_risk_path_stays_high_case_insensitively(self) -> None:
        root = self.make_repo({"maintainers/GOVERNANCE.md": "Rule one\n"})
        (root / "maintainers/GOVERNANCE.md").write_text("Rule two\n", encoding="utf-8")
        self.commit_changes(root)
        self.assertEqual(classify_risk(root, "base")[0], "high")


class PublicContentTests(unittest.TestCase):
    def test_detects_sensitive_patterns_without_returning_values(self) -> None:
        sample = "pass" + "word=" + "exampleSecret123\n"
        findings = scan_text("sample.md", sample)
        self.assertEqual([item.rule for item in findings], ["SECRET_ASSIGNMENT"])
        self.assertEqual(findings[0].path, "sample.md")
        self.assertEqual(findings[0].line, 1)

    def test_private_denylist_reports_only_rule_index(self) -> None:
        findings = scan_text("sample.md", "Restricted Example", ("Restricted Example",))
        self.assertEqual(findings[0].rule, "PRIVATE_DENYLIST_001")


class MarkdownLinkTests(unittest.TestCase):
    def test_valid_relative_link(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs").mkdir()
            source = root / "README.md"
            source.write_text("[Rules](docs/rules.md)\n", encoding="utf-8")
            (root / "docs" / "rules.md").write_text("# Rules\n", encoding="utf-8")
            self.assertEqual(check_file(source, root), [])

    def test_missing_or_wrong_case_link(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "docs").mkdir()
            source = root / "README.md"
            source.write_text("[Rules](docs/Rules.md)\n", encoding="utf-8")
            (root / "docs" / "rules.md").write_text("# Rules\n", encoding="utf-8")
            self.assertEqual(check_file(source, root), [(1, "docs/Rules.md")])


if __name__ == "__main__":
    unittest.main()
