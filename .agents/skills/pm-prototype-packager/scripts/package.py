#!/usr/bin/env python3
"""Build and verify profile-driven prototype delivery ZIP files.

This stdlib-only utility packages explicitly allowlisted files. It checks the
archive's integrity and, for static previews, verifies local HTML/CSS resource
references. It does not claim browser or runtime acceptance.
"""

from __future__ import annotations

import argparse
import hashlib
import html.parser
import json
import os
import re
import stat
import sys
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
from typing import Iterable
from urllib.parse import unquote, urlsplit


FORBIDDEN_SEGMENTS = {
    ".git", ".hg", ".svn", "node_modules", "dist", "temp", "tmp",
    "__pycache__", ".venv", "venv", ".codex-local",
}
KINDS = {"static-preview", "frontend-source", "backend-requirements"}
METADATA_NAMES = {"readme.md", "manifest.json", "sha256sums"}
SENSITIVE_EXACT_NAMES = {
    "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519", "credentials.json",
    "secret.json", "secrets.json", "token.json", "service-account.json",
}
SENSITIVE_SUFFIXES = {
    ".pem", ".key", ".p12", ".pfx", ".p7b", ".p7c", ".p7s",
    ".crt", ".cer", ".der", ".jks", ".keystore", ".ppk",
}
SCHEMA_VERSION = 1


class PackageError(Exception):
    """Expected input or package validation failure."""


def _safe_relative(value: object, label: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or "\\" in value or "\x00" in value:
        raise PackageError(f"PROFILE-01 {label}: expected a non-empty relative POSIX path")
    path = PurePosixPath(value)
    if not path.parts or path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise PackageError(f"PROFILE-01 {label}: unsafe relative path")
    if path.parts and re.match(r"^[A-Za-z]:", path.parts[0]):
        raise PackageError(f"PROFILE-01 {label}: drive-qualified path is not allowed")
    if any(part.casefold() in FORBIDDEN_SEGMENTS for part in path.parts):
        raise PackageError(f"PROFILE-02 {label}: forbidden directory segment")
    return path


def _load_profile(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise PackageError(f"PROFILE-03 unable to read profile ({type(exc).__name__})") from None
    if not isinstance(data, dict) or data.get("schema_version") != SCHEMA_VERSION:
        raise PackageError("PROFILE-04 unsupported or invalid schema_version")
    if data.get("kind") not in KINDS:
        raise PackageError("PROFILE-05 kind must be static-preview, frontend-source, or backend-requirements")
    output_path = _safe_relative(data.get("output"), "output")
    if output_path.suffix.casefold() != ".zip":
        raise PackageError("PROFILE-12 output must name a .zip file")
    if not isinstance(data.get("name"), str) or not data["name"].strip():
        raise PackageError("PROFILE-06 name is required")
    for key in ("include", "required"):
        if not isinstance(data.get(key), list) or not data[key]:
            raise PackageError(f"PROFILE-07 {key} must be a non-empty list")
        parsed = [_safe_relative(item, f"{key}[{index}]") for index, item in enumerate(data[key])]
        folded = [str(item).casefold() for item in parsed]
        if len(set(folded)) != len(folded):
            raise PackageError(f"PROFILE-08 {key} contains duplicate paths")
    entry = _safe_relative(data.get("entry"), "entry")
    for required in data["required"] + [data["entry"]]:
        required_path = _safe_relative(required, "required/entry")
        if not any(required_path == inc or inc in required_path.parents for inc in map(PurePosixPath, data["include"])):
            raise PackageError("PROFILE-09 required files and entry must be covered by include")
    if data["kind"] == "static-preview":
        pages = data.get("pages", [])
        if not isinstance(pages, list):
            raise PackageError("PROFILE-10 pages must be a list")
        for index, page in enumerate(pages):
            _safe_relative(page, f"pages[{index}]")
    if "limitations" in data and not isinstance(data["limitations"], str):
        raise PackageError("PROFILE-11 limitations must be text")
    return data


def _walk_entry(root: Path, relative: PurePosixPath) -> Path:
    candidate = root
    for part in relative.parts:
        candidate = candidate / part
        if candidate.is_symlink():
            raise PackageError("SOURCE-01 symbolic links are not allowed")
    try:
        candidate.resolve(strict=False).relative_to(root.resolve(strict=True))
    except (OSError, ValueError):
        raise PackageError("SOURCE-02 path escapes source or does not exist") from None
    return candidate


def _check_sensitive_filename(path: PurePosixPath) -> None:
    name = path.name.casefold()
    if (name == ".env" or name.startswith(".env.") or name in SENSITIVE_EXACT_NAMES
            or PurePosixPath(name).suffix in SENSITIVE_SUFFIXES):
        raise PackageError("SOURCE-06 sensitive filename or credential file type is not allowed")


def _collect_files(root: Path, profile: dict) -> dict[str, bytes]:
    files: dict[str, bytes] = {}
    folded: set[str] = set()
    for raw in profile["include"]:
        rel = _safe_relative(raw, "include")
        source = _walk_entry(root, rel)
        if not source.exists():
            continue
        candidates = [source] if source.is_file() else sorted(source.rglob("*")) if source.is_dir() else []
        for candidate in candidates:
            if candidate.is_symlink():
                raise PackageError("SOURCE-01 symbolic links are not allowed")
            if not candidate.is_file():
                continue
            relative = PurePosixPath(candidate.relative_to(root).as_posix())
            _safe_relative(relative.as_posix(), "source")
            _check_sensitive_filename(relative)
            archive_name = relative.as_posix()
            case_key = archive_name.casefold()
            if case_key in folded or case_key in METADATA_NAMES:
                raise PackageError("SOURCE-03 duplicate or reserved archive path")
            folded.add(case_key)
            try:
                files[archive_name] = candidate.read_bytes()
            except OSError:
                raise PackageError("SOURCE-04 unable to read allowlisted file") from None
    for raw in profile["required"] + [profile["entry"]] + profile.get("pages", []):
        rel = _safe_relative(raw, "required")
        if rel.as_posix() not in files:
            raise PackageError("SOURCE-05 required file, entry, or page is missing from allowlisted files")
    return files


class _ReferenceParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str]] = []
        self.inline_css: list[str] = []
        self.inline_scripts: list[str] = []
        self._inside_style = False
        self._inside_script = False
        self.has_module_script = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("src"):
            self.refs.append(("src", values["src"] or ""))
        if values.get("srcset"):
            for candidate in (values["srcset"] or "").split(","):
                ref = candidate.strip().split()
                if ref:
                    self.refs.append(("srcset", ref[0]))
        if values.get("style"):
            self.inline_css.append(values["style"] or "")
        if tag.casefold() == "style":
            self._inside_style = True
        if tag.casefold() == "script":
            self._inside_script = True
            script_type = (values.get("type") or "").split(";", 1)[0].strip().casefold()
            if script_type == "module":
                self.has_module_script = True
        href = values.get("href")
        rel = (values.get("rel") or "").casefold().split()
        if href and (tag.casefold() != "a" or any(item in rel for item in ("stylesheet", "icon", "preload", "modulepreload"))):
            self.refs.append(("href", href))

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag.casefold() == "style":
            self._inside_style = False
        if tag.casefold() == "script":
            self._inside_script = False

    def handle_data(self, data: str) -> None:
        if self._inside_style:
            self.inline_css.append(data)
        if self._inside_script:
            self.inline_scripts.append(data)


def _resolve_reference(base_file: str, reference: str, files: dict[str, bytes]) -> None:
    ref = reference.strip()
    if not ref or ref.startswith("#") or ref.casefold().startswith("data:"):
        return
    parts = urlsplit(ref)
    if parts.scheme or parts.netloc or ref.startswith("/") or ref.startswith("\\"):
        raise PackageError("ASSET-01 static preview contains a remote or absolute runtime reference")
    decoded = unquote(parts.path)
    if not decoded:
        return
    base = PurePosixPath(base_file).parent
    components = list(base.parts)
    for part in decoded.replace("\\", "/").split("/"):
        if part in ("", "."):
            continue
        if part == "..":
            if not components:
                raise PackageError("ASSET-02 static preview reference escapes bundle root")
            components.pop()
        else:
            components.append(part)
    target = PurePosixPath(*components).as_posix()
    if target not in files:
        raise PackageError("ASSET-03 static preview has an unresolved local resource reference")


def _audit_static(files: dict[str, bytes], profile: dict) -> None:
    entry = profile.get("entry")
    if not isinstance(entry, str) or entry not in files or PurePosixPath(entry).suffix.casefold() != ".html":
        raise PackageError("ASSET-06 static-preview entry must be an included HTML file")
    pages = profile.get("pages") or [entry]
    css_url = re.compile(r"url\(\s*(['\"]?)(.*?)\1\s*\)", re.IGNORECASE | re.DOTALL)
    css_import = re.compile(r"@import\s+(?:url\(\s*)?(?:['\"]([^'\"]+)['\"]|([^'\"\s);]+))", re.IGNORECASE)
    js_module = re.compile(r"(?m)^\s*import\s+(?!\()|\bimport\s*\(|\bexport\s+[^;\n]*\sfrom\s*['\"]")
    js_network = re.compile(
        r"\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|\bEventSource\s*\(|"
        r"\bsendBeacon\s*\(|\bimportScripts\s*\(|\baxios(?:\s*\.\s*\w+)?\s*\(|\b(?:\$|jQuery)\.ajax\s*\(|"
        r"\b(?:SharedWorker|Worker)\s*\(|\bserviceWorker\b",
        re.IGNORECASE,
    )

    def audit_css(text: str, filename: str) -> None:
        for match in css_url.finditer(text):
            _resolve_reference(filename, match.group(2), files)
        for match in css_import.finditer(text):
            _resolve_reference(filename, match.group(1) or match.group(2), files)

    def audit_js(text: str) -> None:
        if js_module.search(text):
            raise PackageError("ASSET-07 static preview contains JavaScript module loading")
        if js_network.search(text):
            raise PackageError("ASSET-08 static preview contains a common network API reference")

    for name, content in files.items():
        suffix = PurePosixPath(name).suffix.casefold()
        if suffix == ".html":
            try:
                parser = _ReferenceParser()
                parser.feed(content.decode("utf-8"))
                parser.close()
            except (UnicodeError, ValueError):
                raise PackageError("ASSET-04 unable to parse UTF-8 HTML resource references") from None
            if parser.has_module_script:
                raise PackageError("ASSET-07 static preview contains a module script")
            for _, ref in parser.refs:
                _resolve_reference(name, ref, files)
            for inline_css in parser.inline_css:
                audit_css(inline_css, name)
            for inline_script in parser.inline_scripts:
                audit_js(inline_script)
        elif suffix == ".css":
            try:
                text = content.decode("utf-8")
            except UnicodeError:
                raise PackageError("ASSET-05 unable to parse UTF-8 CSS resource references") from None
            audit_css(text, name)
        elif suffix in {".js", ".mjs", ".cjs"}:
            try:
                text = content.decode("utf-8")
            except UnicodeError:
                raise PackageError("ASSET-09 unable to parse UTF-8 JavaScript references") from None
            audit_js(text)
    for page in pages:
        if page not in files or PurePosixPath(page).suffix.casefold() != ".html":
            raise PackageError("ASSET-06 each static-preview page must be an included HTML file")


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _readme(profile: dict, filenames: Iterable[str]) -> bytes:
    lines = [
        f"# {profile['name']}", "",
        f"交付类型 / Delivery kind: `{profile['kind']}`.",
        f"声明入口 / Declared entry: `{profile['entry']}`.", "",
        "本包只包含交付 Profile 选定的文件。生成与完整性检查不等于浏览器运行、工程构建、后端对接或生产验收。",
        "This archive contains only files selected by its package profile. Its creation and integrity checks do not establish browser, runtime, backend, or production acceptance.",
        "脚本会拒绝常见凭据或证书文件名，但不扫描文件内容，不能据此证明包内没有敏感信息。",
        "Common secret and certificate filenames are rejected, but file contents are not scanned and this does not prove that the archive contains no secrets.",
        "", "## 文件清单 / Included files", "",
    ]
    lines.extend(f"- `{name}`" for name in sorted(filenames))
    if profile.get("limitations"):
        lines.extend(["", "## 已知限制 / Limitations", "", profile["limitations"].strip()])
    if profile["kind"] == "static-preview":
        lines.extend([
            "",
            "静态离线检查只覆盖常见 HTML/CSS 资源引用、JavaScript 模块加载和常见网络 API 特征；它不能证明任意 JavaScript 都不会联网，仍须在目标浏览器验收。",
            "Static offline checks cover common HTML/CSS resource references, JavaScript module loading, and common network APIs. They are heuristic and cannot prove arbitrary JavaScript has no network behavior; browser testing is still required.",
        ])
    lines.extend(["", "验包 / Verify the archive: `python package.py --verify <archive.zip>`.", ""])
    return "\n".join(lines).encode("utf-8")


def build(source: Path, profile_path: Path, output: Path | None = None) -> None:
    try:
        root = source.resolve(strict=True)
    except OSError:
        raise PackageError("PATH-01 source path is invalid") from None
    if not root.is_dir():
        raise PackageError("PATH-02 source must be a directory")
    profile = _load_profile(profile_path)
    try:
        profile_root = profile_path.resolve(strict=True).parent
        destination = (output if output is not None else profile_root / profile["output"]).resolve(strict=False)
    except OSError:
        raise PackageError("PATH-01 profile or output path is invalid") from None
    try:
        destination.relative_to(root)
        raise PackageError("PATH-03 output must be outside the source directory")
    except ValueError:
        pass
    if profile_path.resolve(strict=False) == destination:
        raise PackageError("PATH-04 profile and output paths must differ")
    files = _collect_files(root, profile)
    if profile["kind"] == "static-preview":
        _audit_static(files, profile)
    readme = _readme(profile, files)
    files["README.md"] = readme
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "kind": profile["kind"],
        "name": profile["name"],
        "entry": profile["entry"],
        "required": sorted(set(profile["required"] + [profile["entry"]])),
        "pages": profile.get("pages", []),
        "files": {name: _sha(content) for name, content in sorted(files.items())},
    }
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    sums = "".join(f"{digest}  {name}\n" for name, digest in sorted(manifest["files"].items())).encode("utf-8")
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        file_descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{destination.name}.", suffix=".tmp", dir=destination.parent,
        )
        temporary_path = Path(temporary_name)
        os.close(file_descriptor)
        with zipfile.ZipFile(temporary_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, content in sorted(files.items()):
                archive.writestr(name, content)
            archive.writestr("manifest.json", manifest_bytes)
            archive.writestr("SHA256SUMS", sums)
        verify(temporary_path)
        os.replace(temporary_path, destination)
    except PackageError:
        raise
    except OSError:
        raise PackageError("OUTPUT-01 unable to write archive") from None
    finally:
        if temporary_path is not None:
            try:
                temporary_path.unlink(missing_ok=True)
            except OSError:
                pass


def verify(archive_path: Path) -> None:
    try:
        with zipfile.ZipFile(archive_path, "r") as archive:
            infos = archive.infolist()
            names = [info.filename for info in infos]
            if len(names) != len(set(name.casefold() for name in names)):
                raise PackageError("VERIFY-01 archive has duplicate or case-colliding paths")
            if any(_is_directory_or_special_entry(info) for info in infos):
                raise PackageError("VERIFY-02 archive contains directory or non-regular file entries")
            for name in names:
                _safe_relative(name, "archive")
                _check_sensitive_filename(PurePosixPath(name))
            if not {"manifest.json", "SHA256SUMS", "README.md"}.issubset(names):
                raise PackageError("VERIFY-03 archive metadata is incomplete")
            manifest = json.loads(archive.read("manifest.json").decode("utf-8"))
            expected = manifest.get("files") if isinstance(manifest, dict) else None
            if (not isinstance(expected, dict) or "README.md" not in expected
                    or type(manifest.get("schema_version")) is not int
                    or manifest["schema_version"] != SCHEMA_VERSION
                    or manifest.get("kind") not in KINDS or not isinstance(manifest.get("entry"), str)
                    or not isinstance(manifest.get("required"), list)
                    or not isinstance(manifest.get("pages", []), list)):
                raise PackageError("VERIFY-04 manifest is invalid")
            if set(names) != set(expected) | {"manifest.json", "SHA256SUMS"}:
                raise PackageError("VERIFY-05 archive entries do not match manifest")
            normalized: dict[str, str] = {}
            for name, digest in expected.items():
                safe = _safe_relative(name, "manifest")
                if safe.as_posix() != name or not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
                    raise PackageError("VERIFY-06 manifest contains an unsafe path or invalid digest")
                actual = _sha(archive.read(name))
                if actual != digest:
                    raise PackageError("VERIFY-07 file hash does not match manifest")
                normalized[name] = digest
            expected_sums = "".join(f"{digest}  {name}\n" for name, digest in sorted(normalized.items())).encode("utf-8")
            if archive.read("SHA256SUMS") != expected_sums:
                raise PackageError("VERIFY-08 SHA256SUMS does not match manifest")
            entry = _safe_relative(manifest["entry"], "manifest entry").as_posix()
            required_paths = [_safe_relative(path, "manifest required").as_posix() for path in manifest["required"]]
            if entry not in normalized or entry not in required_paths:
                raise PackageError("VERIFY-10 manifest entry is not a required archive file")
            if len(required_paths) != len(set(path.casefold() for path in required_paths)):
                raise PackageError("VERIFY-11 manifest required paths contain duplicates")
            if any(path not in normalized for path in required_paths):
                raise PackageError("VERIFY-12 manifest required file is missing from archive")
            if manifest["kind"] == "static-preview":
                for page in manifest.get("pages", []):
                    page_path = _safe_relative(page, "manifest page").as_posix()
                    if page_path not in normalized:
                        raise PackageError("VERIFY-13 manifest page is missing from archive")
                payload = {name: archive.read(name) for name in expected}
                _audit_static(payload, {"entry": manifest["entry"], "pages": manifest.get("pages", [])})
    except PackageError:
        raise
    except (OSError, zipfile.BadZipFile, UnicodeError, json.JSONDecodeError, KeyError, RuntimeError):
        raise PackageError("VERIFY-09 archive is unreadable or malformed") from None


def _is_directory_or_special_entry(info: zipfile.ZipInfo) -> bool:
    """Reject directory and non-regular filesystem entries from ZIP metadata."""
    if info.is_dir() or info.external_attr & 0x10:
        return True

    if info.create_system == 3:
        unix_mode = info.external_attr >> 16
        file_type = stat.S_IFMT(unix_mode)
        return file_type not in (0, stat.S_IFREG)

    return False


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="Source root (build mode)")
    parser.add_argument("--profile", type=Path, help="JSON allowlist profile (build mode)")
    parser.add_argument("--output", type=Path, help="Override profile output path (build mode)")
    parser.add_argument("--verify", type=Path, help="Verify an existing self-contained ZIP")
    args = parser.parse_args(argv)
    try:
        if args.verify is not None:
            if args.source or args.profile or args.output:
                parser.error("--verify cannot be combined with --source, --profile, or --output")
            verify(args.verify)
            print("VERIFY-OK archive integrity verified")
        else:
            if not args.source or not args.profile:
                parser.error("build mode requires --source and --profile")
            build(args.source, args.profile, args.output)
            profile = _load_profile(args.profile)
            final_output = args.output if args.output is not None else args.profile.resolve(strict=True).parent / profile["output"]
            verify(final_output)
            print("PACKAGE-OK archive built and integrity verified")
        return 0
    except PackageError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
