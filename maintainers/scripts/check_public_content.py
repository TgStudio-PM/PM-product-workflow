#!/usr/bin/env python3
"""Check repository governance, public-content safety, and change risk."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REQUIRED_FILES = (
    "AGENTS.md",
    "README.md",
    "maintainers/PROJECT_CHARTER.md",
    "maintainers/OPEN_SOURCE_BOUNDARY.md",
    "maintainers/GOVERNANCE.md",
    "maintainers/MAINTENANCE_POLICY.md",
    "maintainers/WORKFLOW.md",
    "maintainers/CURRENT.md",
)

TEXT_SUFFIXES = {
    "", ".css", ".csv", ".html", ".ini", ".js", ".json", ".md",
    ".mjs", ".py", ".toml", ".ts", ".tsx", ".txt", ".vue", ".xml",
    ".yaml", ".yml",
}

FORBIDDEN_SUFFIXES = {".7z", ".key", ".p12", ".pem", ".pfx", ".rar", ".zip"}
FORBIDDEN_PARTS = {".codex", "dist", "internal", "node_modules", "private"}

PATTERNS = (
    ("WINDOWS_HOME_PATH", re.compile(r"(?i)(?:[A-Z]:[\\/](?:Users|Documents and Settings)[\\/][^\\/\s]+)")),
    ("UNIX_HOME_PATH", re.compile(r"/(?:home|Users)/[A-Za-z0-9._-]+/")),
    ("PRIVATE_KEY", re.compile("-" * 5 + r"BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY")),
    ("SECRET_ASSIGNMENT", re.compile(r"(?i)\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9_+\-/=]{8,}")),
    ("PRIVATE_IPV4", re.compile(r"(?<!\d)(?:10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})(?!\d)")),
    ("CN_MOBILE", re.compile(r"(?<!\d)1[3-9]\d{9}(?!\d)")),
    ("CN_ID", re.compile(r"(?<!\d)[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[0-9Xx](?!\d)")),
)

HIGH_RISK_PATHS = {
    "AGENTS.md",
    "LICENSE",
    "maintainers/PROJECT_CHARTER.md",
    "maintainers/OPEN_SOURCE_BOUNDARY.md",
    "maintainers/GOVERNANCE.md",
    "maintainers/MAINTENANCE_POLICY.md",
    "maintainers/WORKFLOW.md",
    ".github/pull_request_template.md",
}
HIGH_RISK_PREFIXES = (".github/workflows/", "maintainers/scripts/check_public_content.py")
MEDIUM_RISK_PREFIXES = (".agents/skills/", "docs/product/", "examples/", "profiles/", "templates/")
README_HIGH_RISK_TERMS = ("定位", "使命", "开源边界", "license", "自动合并", "维护规则")


@dataclass(frozen=True)
class Finding:
    rule: str
    path: str
    line: int = 0


def git_paths(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        check=True,
        capture_output=True,
    )
    return [root / item.decode("utf-8") for item in result.stdout.split(b"\0") if item]


def line_number(text: str, start: int) -> int:
    return text.count("\n", 0, start) + 1


def scan_text(relative: str, text: str, private_terms: tuple[str, ...] = ()) -> list[Finding]:
    findings: list[Finding] = []
    for rule, pattern in PATTERNS:
        for match in pattern.finditer(text):
            findings.append(Finding(rule, relative, line_number(text, match.start())))
    lowered = text.casefold()
    for index, term in enumerate(private_terms, start=1):
        start = lowered.find(term.casefold())
        if start >= 0:
            findings.append(Finding(f"PRIVATE_DENYLIST_{index:03d}", relative, line_number(text, start)))
    return findings


def load_private_terms(root: Path) -> tuple[tuple[str, ...], list[Finding]]:
    configured = os.environ.get("PM_WORKFLOW_PRIVATE_DENYLIST")
    if not configured:
        return (), []
    path = Path(configured).expanduser().resolve()
    try:
        path.relative_to(root.resolve())
    except ValueError:
        pass
    else:
        return (), [Finding("PRIVATE_DENYLIST_INSIDE_REPO", path.name)]
    if not path.is_file():
        return (), [Finding("PRIVATE_DENYLIST_NOT_FOUND", path.name)]
    terms = tuple(
        line.strip() for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    )
    return terms, []


def validate_repository(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for required in REQUIRED_FILES:
        if not (root / required).is_file():
            findings.append(Finding("MISSING_GOVERNANCE_FILE", required))

    agents_path = root / "AGENTS.md"
    if agents_path.is_file():
        agents = agents_path.read_text(encoding="utf-8")
        for required in REQUIRED_FILES[2:]:
            if required not in agents:
                findings.append(Finding("AGENTS_MISSING_REFERENCE", required))

    private_terms, configuration_findings = load_private_terms(root)
    findings.extend(configuration_findings)

    for path in git_paths(root):
        relative = path.relative_to(root).as_posix()
        lowered_parts = {part.casefold() for part in path.relative_to(root).parts[:-1]}
        suffix = path.suffix.casefold()
        if suffix in FORBIDDEN_SUFFIXES or lowered_parts.intersection(FORBIDDEN_PARTS):
            findings.append(Finding("FORBIDDEN_TRACKED_PATH", relative))
            continue
        if path.name == ".env" or (path.name.startswith(".env.") and path.name != ".env.example"):
            findings.append(Finding("FORBIDDEN_ENV_FILE", relative))
            continue
        if suffix not in TEXT_SUFFIXES or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            findings.append(Finding("NON_UTF8_TEXT", relative))
            continue
        findings.extend(scan_text(relative, text, private_terms))
    return findings


def changed_files(root: Path, base_ref: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(root), "diff", "--name-only", f"{base_ref}...HEAD", "--"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def classify_risk(root: Path, base_ref: str | None) -> tuple[str, list[str]]:
    if not base_ref:
        return "not-evaluated", []
    files = changed_files(root, base_ref)
    reasons: list[str] = []
    risk = "low"
    for path in files:
        lowered = path.casefold()
        if path in HIGH_RISK_PATHS or lowered.startswith(tuple(item.casefold() for item in HIGH_RISK_PREFIXES)):
            risk = "high"
            reasons.append(path)
        elif lowered.startswith(tuple(item.casefold() for item in MEDIUM_RISK_PREFIXES)) and risk == "low":
            risk = "medium"
            reasons.append(path)
        elif path == "README.md":
            diff = subprocess.run(
                ["git", "-C", str(root), "diff", f"{base_ref}...HEAD", "--", path],
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
            ).stdout.casefold()
            if any(term.casefold() in diff for term in README_HIGH_RISK_TERMS):
                risk = "high"
            elif risk == "low":
                risk = "medium"
            reasons.append(path)
    return risk, sorted(set(reasons))


def publish_risk(risk: str, reasons: list[str]) -> None:
    print(f"Change risk: {risk.upper()}")
    for path in reasons:
        print(f"Risk path: {path}")
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"risk={risk}\n")
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as handle:
            handle.write(f"## Governance risk\n\n**{risk.upper()}**\n")
            if reasons:
                handle.write("\nPaths affecting classification:\n")
                for path in reasons:
                    handle.write(f"- `{path}`\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--base-ref")
    args = parser.parse_args()
    root = Path(args.root).resolve()

    try:
        findings = validate_repository(root)
        risk, reasons = classify_risk(root, args.base_ref)
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"[CHECK_ERROR] {type(error).__name__}", file=sys.stderr)
        return 2

    publish_risk(risk, reasons)
    for finding in findings:
        location = f":{finding.line}" if finding.line else ""
        print(f"[{finding.rule}] {finding.path}{location}", file=sys.stderr)
    if findings:
        print(f"Public-content check failed with {len(findings)} finding(s).", file=sys.stderr)
        return 1
    print("Public-content check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
