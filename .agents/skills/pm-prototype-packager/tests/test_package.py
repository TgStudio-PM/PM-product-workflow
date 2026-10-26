from __future__ import annotations

import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

import importlib.util


SCRIPT = Path(__file__).parents[1] / "scripts" / "package.py"
SPEC = importlib.util.spec_from_file_location("prototype_package", SCRIPT)
package = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(package)


class PackageTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "source"
        self.source.mkdir()
        self.profile_path = self.root / "profile.json"
        self.output = self.root / "bundle.zip"

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write(self, rel: str, content: str = "fixture") -> None:
        path = self.source / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def profile(self, kind: str, include: list[str], required: list[str], entry: str, **extra: object) -> None:
        data = {
            "schema_version": 1,
            "kind": kind,
            "name": "Fictional fixture",
            "output": "deliveries/fixture.zip",
            "include": include,
            "required": required,
            "entry": entry,
            **extra,
        }
        self.profile_path.write_text(json.dumps(data), encoding="utf-8")

    def build_and_verify(self) -> None:
        package.build(self.source, self.profile_path, self.output)
        package.verify(self.output)

    def test_builds_all_three_delivery_kinds_with_allowlist(self) -> None:
        scenarios = [
            ("static-preview", {"index.html": '<script src="app.js"></script><link rel="stylesheet" href="app.css">', "app.js": "ok", "app.css": "body{}"}, ["index.html", "app.js", "app.css"], "index.html", {"pages": ["index.html"]}),
            ("frontend-source", {"package.json": '{"scripts":{}}', "src/main.js": "ok"}, ["package.json", "src/main.js"], "src/main.js", {}),
            ("backend-requirements", {"API.md": "fictional contract"}, ["API.md"], "API.md", {}),
        ]
        for kind, files, required, entry, extra in scenarios:
            with self.subTest(kind=kind):
                for name, content in files.items():
                    self.write(name, content)
                self.profile(kind, required, required, entry, **extra)
                self.build_and_verify()
                with zipfile.ZipFile(self.output) as archive:
                    readme = archive.read("README.md").decode("utf-8")
                    self.assertIn("README.md", archive.namelist())
                    self.assertIn("manifest.json", archive.namelist())
                    self.assertIn("SHA256SUMS", archive.namelist())
                    self.assertNotIn("unlisted.txt", archive.namelist())
                    self.assertIn(b"file contents are not scanned", archive.read("README.md"))
                    self.assertNotIn("python package.py --verify", readme)
                    self.assertIn("not included in this ZIP by default", readme)
                    self.assertIn("<path-to-PM-product-workflow>", readme)
                    if kind == "static-preview":
                        self.assertIn(b"cannot prove arbitrary JavaScript", archive.read("README.md"))
                        self.assertIn("open the declared entry in the target browser", readme)
                    elif kind == "frontend-source":
                        self.assertIn("directory containing `package.json`", readme)
                        self.assertNotIn("docs/ADD_PAGE.md", readme)
                    else:
                        self.assertIn("read the requirements at the declared entry", readme)
                for name in files:
                    (self.source / name).unlink()

    def test_frontend_readme_mentions_optional_page_guide_only_when_included(self) -> None:
        self.write("package.json", '{"scripts":{}}')
        self.write("docs/ADD_PAGE.md", "Fictional page guide")
        self.profile("frontend-source", ["package.json", "docs/ADD_PAGE.md"], ["package.json"], "package.json")
        self.build_and_verify()
        with zipfile.ZipFile(self.output) as archive:
            readme = archive.read("README.md").decode("utf-8")
        self.assertIn("docs/ADD_PAGE.md", readme)

    def test_frontend_readme_without_package_json_does_not_assume_node_or_npm(self) -> None:
        self.write("index.html", "<main>Fictional static source</main>")
        self.write("styles.css", "main { color: black; }")
        self.profile("frontend-source", ["index.html", "styles.css"], ["index.html"], "index.html")
        self.build_and_verify()
        with zipfile.ZipFile(self.output) as archive:
            readme = archive.read("README.md").decode("utf-8")
        self.assertIn("read the declared entry above", readme)
        self.assertIn("does not specify Node.js or npm", readme)
        self.assertNotIn("directory containing `package.json`", readme)
        self.assertNotIn("install dependencies", readme)

    def test_rejects_missing_required_file(self) -> None:
        self.write("index.html", "ok")
        self.profile("frontend-source", ["index.html", "missing.json"], ["missing.json"], "index.html")
        with self.assertRaisesRegex(package.PackageError, "SOURCE-05"):
            package.build(self.source, self.profile_path, self.output)

    def test_markdown_relative_links_resolve_inside_package(self) -> None:
        self.write("docs/guide.md", """[trial](./ADD%5FTRIAL.md#step)\n\n[external](https://example.invalid/missing.md)\n\n[section](#local)\n\n```md\n[example](missing.md)\n```\n""")
        self.write("docs/ADD_TRIAL.md", "fictional trial")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        self.build_and_verify()

    def test_reference_markdown_links_resolve_with_normalized_labels_and_titles(self) -> None:
        self.write("docs/guide.md", """[setup][  INSTALL   Steps ]\n\n[space path][]\n\n[INSTALL steps]: <setup.md> \"Setup guide\"\n[space path]: <path with spaces.md> 'A title'\n""")
        self.write("docs/setup.md", "setup")
        self.write("docs/path with spaces.md", "spaces")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        self.build_and_verify()

    def test_rejects_missing_reference_markdown_target_during_build(self) -> None:
        self.write("docs/guide.md", "[setup][steps]\n\n[steps]: missing.md\n")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-01.*docs/guide.md:1"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_reference_markdown_target_escaping_bundle(self) -> None:
        self.write("docs/guide.md", "[setup][]\n\n[setup]: ../../../outside.md\n")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-02.*docs/guide.md:1"):
            package.build(self.source, self.profile_path, self.output)

    def test_ignores_unused_reference_definitions_and_non_links_in_code(self) -> None:
        self.write("docs/guide.md", """An ordinary [bracketed] word.\n\n`[example][code]`\n\n```md\n[other][sample]\n[sample]: missing-in-fence.md\n```\n\n[unused]: absent.md\n[code]: missing-inline-code.md\n""")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        self.build_and_verify()

    def test_reference_external_and_fragment_targets_are_skipped(self) -> None:
        self.write("docs/guide.md", """[external][url]\n[section][anchor]\n\n[url]: https://example.invalid/missing.md \"Remote\"\n[anchor]: #section\n""")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        self.build_and_verify()

    def test_standalone_verify_rejects_resigned_missing_reference_link(self) -> None:
        self.write("docs/guide.md", "[setup][steps]\n\n[steps]: present.md\n")
        self.write("docs/present.md", "present")
        self.profile("backend-requirements", ["docs"], ["docs/guide.md"], "docs/guide.md")
        self.build_and_verify()

        forged = self.root / "resigned-reference-link.zip"
        with zipfile.ZipFile(self.output) as original:
            items = {name: original.read(name) for name in original.namelist()}
        items["docs/guide.md"] = b"[setup][steps]\n\n[steps]: missing.md\n"
        manifest = json.loads(items["manifest.json"])
        manifest["files"]["docs/guide.md"] = package._sha(items["docs/guide.md"])
        items["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        items["SHA256SUMS"] = "".join(
            f"{digest}  {name}\n" for name, digest in sorted(manifest["files"].items())
        ).encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in items.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-01.*docs/guide.md:1"):
            package.verify(forged)

    def test_rejects_missing_markdown_relative_link_during_build(self) -> None:
        self.write("docs/guide.md", "[trial](ADD_PAGE_TRIAL.md)")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-01.*docs/guide.md:1"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_markdown_relative_link_escaping_bundle(self) -> None:
        self.write("docs/guide.md", "[outside](../../../outside.md)")
        self.profile("frontend-source", ["docs"], ["docs/guide.md"], "docs/guide.md")
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-02.*docs/guide.md:1"):
            package.build(self.source, self.profile_path, self.output)

    def test_standalone_verify_rejects_missing_markdown_link(self) -> None:
        payload = {
            "README.md": b"Fictional package\n",
            "entry.md": b"Fictional entry\n",
            "docs/guide.md": b"[missing](missing.md)\n",
        }
        manifest = {
            "schema_version": 1,
            "kind": "backend-requirements",
            "entry": "entry.md",
            "required": ["entry.md"],
            "pages": [],
            "files": {name: package._sha(content) for name, content in payload.items()},
        }
        sums = "".join(f"{digest}  {name}\n" for name, digest in sorted(manifest["files"].items())).encode()
        with zipfile.ZipFile(self.output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, content in payload.items():
                archive.writestr(name, content)
            archive.writestr("manifest.json", json.dumps(manifest).encode())
            archive.writestr("SHA256SUMS", sums)
        with self.assertRaisesRegex(package.PackageError, "MARKDOWN-01.*docs/guide.md:1"):
            package.verify(self.output)

    def test_rejects_missing_static_asset(self) -> None:
        self.write("index.html", '<script src="missing.js"></script>')
        self.profile("static-preview", ["index.html"], ["index.html"], "index.html", pages=["index.html"])
        with self.assertRaisesRegex(package.PackageError, "ASSET-03"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_remote_runtime_resource(self) -> None:
        self.write("index.html", '<script src="https://example.invalid/app.js"></script>')
        self.profile("static-preview", ["index.html"], ["index.html"], "index.html", pages=["index.html"])
        with self.assertRaisesRegex(package.PackageError, "ASSET-01"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_executable_data_uri_contexts_during_build(self) -> None:
        cases = [
            ("script", '<script src="data:text/javascript,fetch(1)"></script>', None),
            ("iframe", '<iframe src="data:text/html,%3Cscript%3Efetch(1)%3C/script%3E"></iframe>', None),
            ("srcdoc", '<iframe srcdoc="&lt;script&gt;fetch(1)&lt;/script&gt;"></iframe>', None),
            ("object", '<object data="data:text/html,%3Cscript%3Efetch(1)%3C/script%3E"></object>', None),
            ("embed", '<embed src="data:text/html,%3Cscript%3Efetch(1)%3C/script%3E">', None),
            ("stylesheet-link", '<link rel="stylesheet" href="data:text/css,body%7Bcolor:red%7D">', None),
            ("modulepreload-link", '<link rel="modulepreload" href="data:text/javascript,fetch(1)">', None),
            ("css-import", '<link rel="stylesheet" href="style.css">', '@import url("data:text/css,body%7Bcolor:red%7D");'),
        ]
        for index, (label, html, css) in enumerate(cases):
            with self.subTest(context=label):
                entry = f"index-{index}.html"
                included = [entry]
                self.write(entry, html)
                if css is not None:
                    stylesheet = f"style-{index}.css"
                    self.write(entry, html.replace('href="style.css"', f'href="{stylesheet}"'))
                    self.write(stylesheet, css)
                    included.append(stylesheet)
                self.profile("static-preview", included, [entry], entry, pages=[entry])
                with self.assertRaisesRegex(package.PackageError, "ASSET-10"):
                    package.build(self.source, self.profile_path, self.output)

    def test_allows_non_executable_embedded_raster_images(self) -> None:
        data_uri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/hXcAAAAASUVORK5CYII="
        self.write("index.html", f'<img alt="fictional pixel" src="{data_uri}"><div class="pixel"></div>')
        self.write("style.css", f'.pixel {{ background-image: url("{data_uri}"); }}')
        self.profile("static-preview", ["index.html", "style.css"], ["index.html"], "index.html", pages=["index.html"])
        self.build_and_verify()

    def test_verify_reaudits_executable_data_uri_in_resigned_static_archive(self) -> None:
        self.write("index.html", '<main>Fictional preview</main>')
        self.profile("static-preview", ["index.html"], ["index.html"], "index.html", pages=["index.html"])
        self.build_and_verify()
        forged = self.root / "resigned-active-data.zip"
        with zipfile.ZipFile(self.output) as original:
            payload = {name: original.read(name) for name in original.namelist() if name not in {"manifest.json", "SHA256SUMS"}}
        payload["index.html"] = b'<script src="data:text/javascript,fetch(1)"></script>'
        manifest = {
            "schema_version": 1,
            "kind": "static-preview",
            "name": "Fictional fixture",
            "entry": "index.html",
            "required": ["index.html"],
            "pages": ["index.html"],
            "files": {name: package._sha(data) for name, data in sorted(payload.items())},
        }
        manifest_bytes = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        sums = "".join(f"{digest}  {name}\n" for name, digest in sorted(manifest["files"].items())).encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in payload.items():
                archive.writestr(name, data)
            archive.writestr("manifest.json", manifest_bytes)
            archive.writestr("SHA256SUMS", sums)
        with self.assertRaisesRegex(package.PackageError, "ASSET-10"):
            package.verify(forged)

    def test_rejects_missing_inline_css_asset(self) -> None:
        self.write("index.html", '<div style="background:url(./missing.png)"></div>')
        self.profile("static-preview", ["index.html"], ["index.html"], "index.html", pages=["index.html"])
        with self.assertRaisesRegex(package.PackageError, "ASSET-03"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_missing_css_import(self) -> None:
        self.write("index.html", '<link rel="stylesheet" href="app.css">')
        self.write("app.css", '@import "missing.css";')
        self.profile("static-preview", ["index.html", "app.css"], ["index.html"], "index.html", pages=["index.html"])
        with self.assertRaisesRegex(package.PackageError, "ASSET-03"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_remote_css_import(self) -> None:
        self.write("index.html", '<link rel="stylesheet" href="app.css">')
        self.write("app.css", '@import url("https://example.invalid/theme.css");')
        self.profile("static-preview", ["index.html", "app.css"], ["index.html"], "index.html", pages=["index.html"])
        with self.assertRaisesRegex(package.PackageError, "ASSET-01"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_module_script_and_javascript_imports(self) -> None:
        cases = [
            ('<script type="module" src="app.js"></script>', "window.fixture = true;", "ASSET-07"),
            ('<script src="app.js"></script>', "import './feature.js';", "ASSET-07"),
            ('<script src="app.js"></script>', "import('./feature.js');", "ASSET-07"),
        ]
        for html, script, expected in cases:
            with self.subTest(html=html, script=script):
                self.write("index.html", html)
                self.write("app.js", script)
                self.write("feature.js", "window.fixture = true;")
                self.profile("static-preview", ["index.html", "app.js", "feature.js"], ["index.html"], "index.html", pages=["index.html"])
                with self.assertRaisesRegex(package.PackageError, expected):
                    package.build(self.source, self.profile_path, self.output)
                for rel in ("index.html", "app.js", "feature.js"):
                    (self.source / rel).unlink()

    def test_rejects_common_javascript_network_apis(self) -> None:
        for api in ("fetch('/data')", "new XMLHttpRequest()", "new WebSocket('ws://example.invalid')", "axios.get('/data')"):
            with self.subTest(api=api):
                self.write("index.html", '<script src="app.js"></script>')
                self.write("app.js", f"{api};")
                self.profile("static-preview", ["index.html", "app.js"], ["index.html"], "index.html", pages=["index.html"])
                with self.assertRaisesRegex(package.PackageError, "ASSET-08"):
                    package.build(self.source, self.profile_path, self.output)
                (self.source / "index.html").unlink()
                (self.source / "app.js").unlink()

    def test_rejects_forbidden_directory(self) -> None:
        self.write("src/node_modules/package/index.js")
        self.profile("frontend-source", ["src"], ["src/node_modules/package/index.js"], "src/node_modules/package/index.js")
        with self.assertRaisesRegex(package.PackageError, "PROFILE-02"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_traversal_profile(self) -> None:
        self.profile("frontend-source", ["../secret.txt"], ["../secret.txt"], "../secret.txt")
        with self.assertRaisesRegex(package.PackageError, "PROFILE-01"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_symlink_source(self) -> None:
        self.write("real.txt")
        try:
            (self.source / "alias.txt").symlink_to(self.source / "real.txt")
        except OSError as exc:
            self.skipTest(f"symlink creation is unavailable: {type(exc).__name__}")
        self.profile("frontend-source", ["alias.txt"], ["alias.txt"], "alias.txt")
        with self.assertRaisesRegex(package.PackageError, "SOURCE-01"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_output_inside_source(self) -> None:
        self.write("index.html")
        self.profile("frontend-source", ["index.html"], ["index.html"], "index.html")
        with self.assertRaisesRegex(package.PackageError, "PATH-03"):
            package.build(self.source, self.profile_path, self.source / "bundle.zip")

    def test_verify_detects_tampered_payload(self) -> None:
        self.write("contract.md", "first")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.build_and_verify()
        tampered = self.root / "tampered.zip"
        with zipfile.ZipFile(self.output) as original, zipfile.ZipFile(tampered, "w") as changed:
            for name in original.namelist():
                data = original.read(name)
                if name == "contract.md":
                    data = b"changed"
                changed.writestr(name, data)
        with self.assertRaisesRegex(package.PackageError, "VERIFY-07"):
            package.verify(tampered)

    def test_verify_rejects_special_files_and_dos_directories(self) -> None:
        self.write("note.txt", "unchanged fictional payload")
        self.profile("backend-requirements", ["note.txt"], ["note.txt"], "note.txt")
        self.build_and_verify()

        cases = [
            ("symlink", 3, 0o120777 << 16),
            ("fifo", 3, 0o010600 << 16),
            ("character-device", 3, 0o020600 << 16),
            ("dos-directory", 0, 0x10),
        ]
        for label, create_system, external_attr in cases:
            with self.subTest(entry_type=label):
                tampered = self.root / f"{label}.zip"
                with zipfile.ZipFile(self.output) as original, zipfile.ZipFile(tampered, "w") as changed:
                    for source_info in original.infolist():
                        info = zipfile.ZipInfo(source_info.filename, source_info.date_time)
                        info.compress_type = source_info.compress_type
                        info.create_system = source_info.create_system
                        info.external_attr = source_info.external_attr
                        if source_info.filename == "note.txt":
                            info.create_system = create_system
                            info.external_attr = external_attr
                        changed.writestr(info, original.read(source_info.filename))
                with self.assertRaisesRegex(package.PackageError, "VERIFY-02"):
                    package.verify(tampered)

    def test_verify_accepts_regular_files_without_unix_type_bits(self) -> None:
        self.write("note.txt", "unchanged fictional payload")
        self.profile("backend-requirements", ["note.txt"], ["note.txt"], "note.txt")
        self.build_and_verify()
        compatible = self.root / "no-unix-type.zip"
        with zipfile.ZipFile(self.output) as original, zipfile.ZipFile(compatible, "w") as changed:
            for source_info in original.infolist():
                info = zipfile.ZipInfo(source_info.filename, source_info.date_time)
                info.compress_type = source_info.compress_type
                info.create_system = source_info.create_system
                info.external_attr = source_info.external_attr
                if source_info.filename == "note.txt":
                    info.create_system = 3
                    info.external_attr = 0o644 << 16
                changed.writestr(info, original.read(source_info.filename))
        package.verify(compatible)

    def test_verify_reaudits_resigned_static_archive(self) -> None:
        self.write("index.html", '<script src="app.js"></script>')
        self.write("app.js", "window.fixture = true;")
        self.profile("static-preview", ["index.html", "app.js"], ["index.html"], "index.html", pages=["index.html"])
        self.build_and_verify()
        forged = self.root / "resigned.zip"
        with zipfile.ZipFile(self.output) as original:
            payload = {name: original.read(name) for name in original.namelist() if name not in {"manifest.json", "SHA256SUMS"}}
        payload["index.html"] = b'<script src="missing.js"></script>'
        manifest = {
            "schema_version": 1,
            "kind": "static-preview",
            "name": "Fictional fixture",
            "entry": "index.html",
            "required": ["index.html"],
            "pages": ["index.html"],
            "files": {name: package._sha(data) for name, data in sorted(payload.items())},
        }
        manifest_bytes = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        sums = "".join(f"{digest}  {name}\n" for name, digest in sorted(manifest["files"].items())).encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in payload.items():
                archive.writestr(name, data)
            archive.writestr("manifest.json", manifest_bytes)
            archive.writestr("SHA256SUMS", sums)
        with self.assertRaisesRegex(package.PackageError, "ASSET-03"):
            package.verify(forged)

    def test_verify_rejects_manifest_entry_missing_from_generic_package(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.build_and_verify()
        forged = self.root / "missing-entry.zip"
        with zipfile.ZipFile(self.output) as original:
            items = {name: original.read(name) for name in original.namelist()}
        manifest = json.loads(items["manifest.json"])
        manifest["entry"] = "not-in-archive.md"
        manifest["required"].append("not-in-archive.md")
        items["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in items.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(package.PackageError, "VERIFY-10"):
            package.verify(forged)

    def test_verify_rejects_missing_generic_required_path(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.build_and_verify()
        forged = self.root / "missing-required.zip"
        with zipfile.ZipFile(self.output) as original:
            items = {name: original.read(name) for name in original.namelist()}
        manifest = json.loads(items["manifest.json"])
        manifest["required"].append("missing-attachment.md")
        items["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in items.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(package.PackageError, "VERIFY-12"):
            package.verify(forged)

    def test_verify_rejects_unsupported_manifest_schema(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.build_and_verify()
        forged = self.root / "unsupported-schema.zip"
        with zipfile.ZipFile(self.output) as original:
            items = {name: original.read(name) for name in original.namelist()}
        manifest = json.loads(items["manifest.json"])
        manifest["schema_version"] = 2
        items["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode("utf-8")
        with zipfile.ZipFile(forged, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, data in items.items():
                archive.writestr(name, data)
        with self.assertRaisesRegex(package.PackageError, "VERIFY-04"):
            package.verify(forged)

    def test_rejects_sensitive_allowlisted_filenames(self) -> None:
        for rel in (".env.local", "private.pem", "client.p12", "service-account.json"):
            with self.subTest(rel=rel):
                self.write(rel, "fictional test content")
                self.profile("frontend-source", [rel], [rel], rel)
                with self.assertRaisesRegex(package.PackageError, "SOURCE-06"):
                    package.build(self.source, self.profile_path, self.output)
                (self.source / rel).unlink()

    def test_failed_build_preserves_existing_output_and_removes_temp(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.output.write_bytes(b"previous valid artifact")
        with patch.object(package, "verify", side_effect=package.PackageError("VERIFY-TEST expected failure")):
            with self.assertRaisesRegex(package.PackageError, "VERIFY-TEST"):
                package.build(self.source, self.profile_path, self.output)
        self.assertEqual(self.output.read_bytes(), b"previous valid artifact")
        self.assertEqual(list(self.root.glob(f".{self.output.name}.*.tmp")), [])

    def test_cli_build_and_standalone_verify(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.assertEqual(package.main([
            "--source", str(self.source), "--profile", str(self.profile_path), "--output", str(self.output),
        ]), 0)
        self.assertEqual(package.main(["--verify", str(self.output)]), 0)

    def test_profile_output_is_used_when_cli_override_is_omitted(self) -> None:
        self.write("contract.md", "fictional")
        self.profile("backend-requirements", ["contract.md"], ["contract.md"], "contract.md")
        self.assertEqual(package.main(["--source", str(self.source), "--profile", str(self.profile_path)]), 0)
        self.assertTrue((self.root / "deliveries" / "fixture.zip").is_file())

    def test_rejects_profile_paths_not_covered_by_include(self) -> None:
        self.write("index.html")
        self.profile("frontend-source", ["index.html"], ["index.html"], "outside/main.js")
        with self.assertRaisesRegex(package.PackageError, "PROFILE-09"):
            package.build(self.source, self.profile_path, self.output)

    def test_rejects_root_directory_allowlist(self) -> None:
        self.profile("frontend-source", ["."], ["index.html"], "index.html")
        with self.assertRaisesRegex(package.PackageError, "PROFILE-01"):
            package.build(self.source, self.profile_path, self.output)


if __name__ == "__main__":
    unittest.main()
