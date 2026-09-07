from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from check_markdown_links import check_file  # noqa: E402
from check_public_content import scan_text  # noqa: E402


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
