from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "maintainers" / "scripts"))

from check_markdown_links import check_file, main as markdown_links_main  # noqa: E402
from check_public_content import classify_risk, main as public_content_main, scan_text  # noqa: E402


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

    def test_template_path_is_medium_risk_case_insensitively(self) -> None:
        root = self.make_repo({"README.md": "Project overview\n"})
        self.write_files(root, {"Templates/Package-Profiles/FRONTEND-SOURCE.JSON": "{}\n"})
        self.commit_changes(root)
        self.assertEqual(
            classify_risk(root, "base"),
            ("medium", ["Templates/Package-Profiles/FRONTEND-SOURCE.JSON"]),
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

    def test_short_secret_placeholder_is_not_flagged(self) -> None:
        sample = "The example " + "api" + "_key=" + "demo" + " is a short placeholder.\n"
        self.assertEqual(scan_text("sample.md", sample), [])

    def test_detects_quoted_secret_keys_and_multiline_assignments(self) -> None:
        samples = (
            "{" + '"' + "api_key" + '"' + ": " + '"' + "exampleSecret123" + '"' + "}\n",
            "{" + "'" + "access_token" + "'" + "   =   " + "'" + "exampleSecret123" + "'" + "}\n",
            "{" + '"' + "client_secret" + '"' + "\n : \n" + '"' + "exampleSecret123" + '"' + "}\n",
            "{" + "password" + "\n=\n" + "exampleSecret123" + "}\n",
        )

        for sample in samples:
            with self.subTest(sample=sample):
                findings = scan_text("sample.json", sample)
                self.assertEqual([item.rule for item in findings], ["SECRET_ASSIGNMENT"])
                self.assertEqual(findings[0].path, "sample.json")
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


class DeliveryProfileTemplateTests(unittest.TestCase):
    def test_profile_templates_build_and_independently_verify_with_minimal_inputs(self) -> None:
        profile_dir = ROOT / "templates/package-profiles"
        packager = ROOT / ".agents/skills/pm-prototype-packager/scripts/package.py"
        scenarios = (
            ("static-preview.json", "static-preview", "index.html", "<!doctype html><html><body>fixture</body></html>"),
            ("frontend-source.json", "frontend-source", "source-entry.txt", "fictional source fixture"),
            ("backend-requirements.json", "backend-requirements", "requirements.md", "# Fictional requirements\n待项目证据确认。"),
        )

        for template_name, expected_kind, entry, content in scenarios:
            with self.subTest(template=template_name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                profile_path = root / "profile.json"
                profile_path.write_bytes((profile_dir / template_name).read_bytes())
                config = json.loads(profile_path.read_text(encoding="utf-8"))
                self.assertEqual(config["kind"], expected_kind)
                config["include"] = [entry]
                config["required"] = [entry]
                config["entry"] = entry
                if expected_kind == "static-preview":
                    config["pages"] = [entry]
                profile_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

                source = root / "source"
                source.mkdir()
                (source / entry).write_text(content, encoding="utf-8")
                archive = root / "candidate.zip"
                build = subprocess.run(
                    [
                        sys.executable,
                        str(packager),
                        "--source",
                        str(source),
                        "--profile",
                        str(profile_path),
                        "--output",
                        str(archive),
                    ],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                )
                self.assertEqual(build.returncode, 0, build.stdout + build.stderr)
                self.assertTrue(archive.is_file())

                verify = subprocess.run(
                    [sys.executable, str(packager), "--verify", str(archive)],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                )
                self.assertEqual(verify.returncode, 0, verify.stdout + verify.stderr)

                with zipfile.ZipFile(archive) as package:
                    names = set(package.namelist())
                    manifest = json.loads(package.read("manifest.json").decode("utf-8"))
                self.assertEqual(manifest["kind"], expected_kind)
                self.assertIn(entry, names)
                self.assertIn(entry, manifest["required"])
                self.assertEqual(
                    names,
                    set(manifest["files"]) | {"manifest.json", "SHA256SUMS"},
                )


class MaintenanceScriptFailureTests(unittest.TestCase):
    HINT = "Run repository maintenance checks in a Git clone/checkout; check the root path and any base ref."

    def test_non_git_cli_failures_give_checkout_guidance(self) -> None:
        cases = (
            (ROOT / "maintainers/scripts/check_markdown_links.py", lambda root: [str(root)]),
            (ROOT / "maintainers/scripts/check_public_content.py", lambda root: ["--root", str(root)]),
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for script, arguments in cases:
                with self.subTest(script=script.name):
                    result = subprocess.run(
                        [sys.executable, str(script), *arguments(root)],
                        cwd=ROOT,
                        capture_output=True,
                        text=True,
                        encoding="utf-8",
                    )
                    output = result.stdout + result.stderr
                    self.assertEqual(result.returncode, 2)
                    self.assertIn("[CHECK_ERROR] CalledProcessError", result.stderr)
                    self.assertIn(self.HINT, result.stderr)
                    self.assertNotIn("passed", output.casefold())
                    self.assertNotIn(str(root), output)

    def test_called_process_error_does_not_echo_command_or_stderr(self) -> None:
        sentinel = "ISSUE180_SENSITIVE_GIT_COMMAND_AND_STDERR"
        cases = (
            (markdown_links_main, "check_markdown_links.subprocess.run", lambda root: ["check_markdown_links.py", str(root)]),
            (public_content_main, "check_public_content.subprocess.run", lambda root: ["check_public_content.py", "--root", str(root)]),
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for main, target, arguments in cases:
                with self.subTest(main=main.__module__):
                    error = subprocess.CalledProcessError(
                        128,
                        ["git", sentinel],
                        stderr=sentinel,
                    )
                    stderr = StringIO()
                    stdout = StringIO()
                    with (
                        patch(target, side_effect=error),
                        patch.object(sys, "argv", arguments(root)),
                        redirect_stdout(stdout),
                        redirect_stderr(stderr),
                    ):
                        exit_code = main()
                    output = stdout.getvalue() + stderr.getvalue()
                    self.assertEqual(exit_code, 2)
                    self.assertIn("[CHECK_ERROR] CalledProcessError", stderr.getvalue())
                    self.assertIn(self.HINT, stderr.getvalue())
                    self.assertNotIn(sentinel, output)
                    self.assertNotIn(str(root), output)
                    self.assertNotIn("passed", output.casefold())


if __name__ == "__main__":
    unittest.main()
