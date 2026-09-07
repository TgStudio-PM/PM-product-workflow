#!/usr/bin/env python3
"""Validate repository-relative Markdown links without network access."""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote


LINK = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
EXTERNAL_PREFIXES = ("http://", "https://", "mailto:", "tel:")


def exists_case_sensitive(path: Path, root: Path) -> bool:
    root_absolute = Path(os.path.abspath(root))
    path_absolute = Path(os.path.abspath(path))
    try:
        relative = path_absolute.relative_to(root_absolute)
    except ValueError:
        return False
    current = root_absolute
    for part in relative.parts:
        if not current.is_dir() or part not in {item.name for item in current.iterdir()}:
            return False
        current = current / part
    return current.exists()


def target_path(source: Path, raw: str, root: Path) -> Path | None:
    target = raw.strip().strip("<>").split()[0]
    lowered = target.casefold()
    if not target or target.startswith("#") or lowered.startswith(EXTERNAL_PREFIXES):
        return None
    target = unquote(target.split("#", 1)[0].split("?", 1)[0])
    if not target:
        return None
    return (root / target.lstrip("/")) if target.startswith("/") else (source.parent / target)


def markdown_files(root: Path) -> list[Path]:
    result = subprocess.run(
        ["git", "-C", str(root), "ls-files", "--cached", "--others", "--exclude-standard", "*.md"],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return [root / line for line in result.stdout.splitlines() if line]


def check_file(path: Path, root: Path) -> list[tuple[int, str]]:
    missing: list[tuple[int, str]] = []
    fenced = False
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fenced = not fenced
            continue
        if fenced:
            continue
        for match in LINK.finditer(line):
            candidate = target_path(path, match.group(1), root)
            if candidate is not None and not exists_case_sensitive(candidate, root):
                missing.append((number, match.group(1)))
    return missing


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    missing: list[tuple[str, int, str]] = []
    try:
        for path in markdown_files(root):
            for line, target in check_file(path, root):
                missing.append((path.relative_to(root).as_posix(), line, target))
    except (OSError, UnicodeDecodeError, subprocess.CalledProcessError) as error:
        print(f"[CHECK_ERROR] {type(error).__name__}", file=sys.stderr)
        return 2
    for path, line, target in missing:
        print(f"[MISSING_LINK] {path}:{line} -> {target}", file=sys.stderr)
    if missing:
        return 1
    print("Markdown link check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
