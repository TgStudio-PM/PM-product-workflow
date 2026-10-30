import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { test } from 'node:test'
import { deflateSync } from 'node:zlib'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function createOnePixelPng() {
  function crc32(bytes) {
    let crc = 0xffffffff
    for (const byte of bytes) {
      crc ^= byte
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const content = Buffer.concat([typeBytes, data])
    const length = Buffer.alloc(4)
    const checksum = Buffer.alloc(4)
    length.writeUInt32BE(data.length)
    checksum.writeUInt32BE(crc32(content))
    return Buffer.concat([length, content, checksum])
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(1, 0)
  header.writeUInt32BE(1, 4)
  header[8] = 8
  header[9] = 6

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0, 32, 120, 184, 255]))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

async function createFixture(t) {
  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'tg-studio-preview-verify-'))
  t.after(() => rm(fixtureRoot, { recursive: true, force: true }))

  await mkdir(path.join(fixtureRoot, 'scripts'), { recursive: true })
  await Promise.all([
    cp(path.join(starterRoot, 'scripts', 'build-preview.mjs'), path.join(fixtureRoot, 'scripts', 'build-preview.mjs')),
    cp(path.join(starterRoot, 'scripts', 'vue-runtime-notices.mjs'), path.join(fixtureRoot, 'scripts', 'vue-runtime-notices.mjs')),
    cp(path.join(starterRoot, 'scripts', 'verify-preview.mjs'), path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')),
    cp(path.join(starterRoot, 'scripts', 'page-registry.mjs'), path.join(fixtureRoot, 'scripts', 'page-registry.mjs')),
    cp(path.join(starterRoot, 'src'), path.join(fixtureRoot, 'src'), { recursive: true }),
    cp(path.join(starterRoot, 'package.json'), path.join(fixtureRoot, 'package.json')),
    cp(path.join(starterRoot, 'dist', 'preview'), path.join(fixtureRoot, 'dist', 'preview'), { recursive: true }),
    symlink(path.join(starterRoot, 'node_modules'), path.join(fixtureRoot, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'),
  ])

  return fixtureRoot
}

function verify(fixtureRoot) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'verify-preview.mjs')], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  })
}

function buildPreview(fixtureRoot) {
  return spawnSync(process.execPath, [path.join(fixtureRoot, 'scripts', 'build-preview.mjs')], {
    cwd: fixtureRoot,
    encoding: 'utf8',
  })
}

async function readManifest(fixtureRoot) {
  const manifestPath = path.join(fixtureRoot, 'dist', 'preview', 'manifest.json')
  return { manifestPath, manifest: JSON.parse(await readFile(manifestPath, 'utf8')) }
}

async function writeManifest(fixtureRoot, manifestPath, manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await updateManifestHash(fixtureRoot)
}

async function updateContentHash(fixtureRoot, file) {
  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const content = await readFile(path.join(previewRoot, file))
  const { createHash } = await import('node:crypto')
  const digest = createHash('sha256').update(content).digest('hex')
  const sumsPath = path.join(previewRoot, 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
  const index = lines.findIndex((line) => line.endsWith(`  ${file}`))
  assert.notEqual(index, -1, `测试夹具应包含 ${file} 摘要`)
  lines[index] = `${digest}  ${file}`
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
}

async function updateManifestHash(fixtureRoot) {
  await updateContentHash(fixtureRoot, 'manifest.json')
}

async function snapshotPreviewFiles(fixtureRoot) {
  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const entries = await readdir(previewRoot, { withFileTypes: true })
  const files = await Promise.all(entries.filter((entry) => entry.isFile()).map(async ({ name }) => {
    const content = await readFile(path.join(previewRoot, name))
    const hash = createHash('sha256').update(content).digest('hex')
    return [name, hash]
  }))
  return Object.fromEntries(files)
}

test('valid preview package passes in an isolated copy', async (t) => {
  const fixtureRoot = await createFixture(t)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /离线包审计通过/)
})

test('builds the exact empty favicon declaration and verifies the generated package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)

  const html = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'index.html'), 'utf8')
  assert.ok(html.includes('<link rel="icon" href="data:,">'))
  const result = verify(fixtureRoot)
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('builds complete notices from installed Vue runtime package metadata and license files', async (t) => {
  const fixtureRoot = await createFixture(t)
  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)

  const previewRoot = path.join(fixtureRoot, 'dist', 'preview')
  const noticeFile = 'THIRD_PARTY_NOTICES.txt'
  const noticeText = await readFile(path.join(previewRoot, noticeFile), 'utf8')
  const runtimePackages = ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom']
  const licenseTexts = []
  for (const packageName of runtimePackages) {
    const packageRoot = path.join(starterRoot, 'node_modules', ...packageName.split('/'))
    const metadata = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'))
    const licenseText = await readFile(path.join(packageRoot, 'LICENSE'), 'utf8')
    assert.ok(noticeText.includes(`${metadata.name}@${metadata.version} (license: ${metadata.license})`))
    assert.ok(noticeText.includes(licenseText), `${packageName} full LICENSE body should be retained verbatim`)
    licenseTexts.push(licenseText)
  }
  assert.equal((noticeText.match(/----- BEGIN LICENSE TEXT -----/g) ?? []).length, new Set(licenseTexts).size)

  const { manifest } = await readManifest(fixtureRoot)
  assert.ok(manifest.files.includes(noticeFile))
  assert.ok((await readFile(path.join(previewRoot, 'README.md'), 'utf8')).includes(noticeFile))
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)
})

test('rejects a missing third-party notice file', async (t) => {
  const fixtureRoot = await createFixture(t)
  await rm(path.join(fixtureRoot, 'dist', 'preview', 'THIRD_PARTY_NOTICES.txt'), { force: true })

  const result = verify(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /缺少必要产物：THIRD_PARTY_NOTICES\.txt/)
})

test('rejects a re-signed stale third-party notice body', async (t) => {
  const fixtureRoot = await createFixture(t)
  const noticePath = path.join(fixtureRoot, 'dist', 'preview', 'THIRD_PARTY_NOTICES.txt')
  const current = await readFile(noticePath, 'utf8')
  const vueMetadata = JSON.parse(await readFile(path.join(starterRoot, 'node_modules', 'vue', 'package.json'), 'utf8'))
  const stale = current.replace(`${vueMetadata.name}@${vueMetadata.version}`, `${vueMetadata.name}@0.0.0`)
  assert.notEqual(stale, current)
  await writeFile(noticePath, stale, 'utf8')
  await updateContentHash(fixtureRoot, 'THIRD_PARTY_NOTICES.txt')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /THIRD_PARTY_NOTICES\.txt 与当前安装的 Vue 运行依赖许可说明不一致/)
  assert.doesNotMatch(result.stderr, /文件校验值不匹配：THIRD_PARTY_NOTICES\.txt/)
})

test('continues to verify an existing package without a favicon declaration', async (t) => {
  const fixtureRoot = await createFixture(t)
  const htmlPath = path.join(fixtureRoot, 'dist', 'preview', 'index.html')
  const html = await readFile(htmlPath, 'utf8')
  await writeFile(htmlPath, html.replace('<link rel="icon" href="data:,">\n', ''), 'utf8')
  await updateContentHash(fixtureRoot, 'index.html')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('rejects data and remote HTML resource references after the checksum is updated', async (t) => {
  const references = [
    ['script src data URI', '<script defer src="data:,"></script>'],
    ['stylesheet href data URI', '<link rel="stylesheet" href="data:,"></link>'],
    ['nonempty data favicon', '<link rel="icon" href="data:image/png;base64,AQIDBA==">'],
    ['SVG data favicon', '<link rel="icon" href="data:image/svg+xml,<svg>">'],
    ['remote favicon', '<link rel="icon" href="https://example.invalid/favicon.ico">'],
  ]

  for (const [name, reference] of references) {
    await t.test(name, async (t) => {
      const fixtureRoot = await createFixture(t)
      const htmlPath = path.join(fixtureRoot, 'dist', 'preview', 'index.html')
      const html = await readFile(htmlPath, 'utf8')
      await writeFile(htmlPath, html.replace('</head>', `${reference}\n  </head>`), 'utf8')
      await updateContentHash(fixtureRoot, 'index.html')

      const result = verify(fixtureRoot)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /入口包含非相对资源引用：/)
    })
  }
})

test('rejects missing CSS url resources after the checksum is updated', async (t) => {
  const fixtureRoot = await createFixture(t)
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  const css = `${await readFile(cssPath, 'utf8')}\n.broken { background: url('./missing.png'); }\n`
  await writeFile(cssPath, css, 'utf8')
  await updateContentHash(fixtureRoot, 'styles.css')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /样式表资源不存在或越界：\.\/missing\.png/)
})

test('rejects missing CSS imports after the checksum is updated', async (t) => {
  const fixtureRoot = await createFixture(t)
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  const css = `${await readFile(cssPath, 'utf8')}\n@import './missing.css';\n`
  await writeFile(cssPath, css, 'utf8')
  await updateContentHash(fixtureRoot, 'styles.css')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /离线预览 CSS 不支持 @import/)
})

test('rejects remote, absolute, and escaping CSS url resources', async (t) => {
  for (const reference of ['https://example.invalid/image.png', '/image.png', '../../outside.png']) {
    await t.test(reference, async (t) => {
      const fixtureRoot = await createFixture(t)
      const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
      const css = `${await readFile(cssPath, 'utf8')}\n.fixture { background: url('${reference}'); }\n`
      await writeFile(cssPath, css, 'utf8')
      await updateContentHash(fixtureRoot, 'styles.css')

      const result = verify(fixtureRoot)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /样式表包含外部或绝对 URL|样式表资源不存在或越界/)
    })
  }
})

test('allows CSS local fragment references', async (t) => {
  const fixtureRoot = await createFixture(t)
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  const css = `${await readFile(cssPath, 'utf8')}\n.fixture { filter: url(#local-filter); }\n`
  await writeFile(cssPath, css, 'utf8')
  await updateContentHash(fixtureRoot, 'styles.css')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('builds and verifies a local PNG background inlined by Vite', async (t) => {
  const fixtureRoot = await createFixture(t)
  const assetsPath = path.join(fixtureRoot, 'src', 'assets')
  await mkdir(assetsPath, { recursive: true })
  await writeFile(path.join(assetsPath, 'pixel.png'), createOnePixelPng())

  const sourceCssPath = path.join(fixtureRoot, 'src', 'style.css')
  const sourceCss = await readFile(sourceCssPath, 'utf8')
  await writeFile(sourceCssPath, `${sourceCss}\n.fixture { background-image: url('./assets/pixel.png'); }\n`, 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)

  const outputCss = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'styles.css'), 'utf8')
  assert.match(outputCss, /url\(data:image\/png;base64,[A-Za-z0-9+/]+=*\)/)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)
})

test('allows canonical base64 data URIs for supported raster MIME types', async (t) => {
  const fixtureRoot = await createFixture(t)
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  const uris = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']
    .map((mime, index) => `.fixture-${index} { background-image: url('data:${mime};base64,AQIDBA=='); }`)
    .join('\n')
  const css = `${await readFile(cssPath, 'utf8')}\n${uris}\n`
  await writeFile(cssPath, css, 'utf8')
  await updateContentHash(fixtureRoot, 'styles.css')

  const result = verify(fixtureRoot)
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

test('rejects unsupported and malformed CSS data URIs without echoing their contents', async (t) => {
  const references = [
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:text/html;base64,PGgxPk5vPC9oMT4=',
    'data:image/png,AQIDBA==',
    'data:image/png;base64,',
    'data:image/png;base64,AQIDBA',
    'data:image/png;base64,AQIDBA===',
    'data:image/png;base64,AQ!D',
    'data:image/png;base64,AQIDBA==extra',
    'data:image/png;charset=utf-8;base64,AQIDBA==',
  ]
  const fixtureRoot = await createFixture(t)
  const cssPath = path.join(fixtureRoot, 'dist', 'preview', 'styles.css')
  const baselineCss = await readFile(cssPath, 'utf8')

  for (const [index, reference] of references.entries()) {
    await t.test(`${index + 1}: ${reference.split(',')[0]}`, async () => {
      const css = `${baselineCss}\n.fixture { background-image: url('${reference}'); }\n`
      await writeFile(cssPath, css, 'utf8')
      await updateContentHash(fixtureRoot, 'styles.css')

      const result = verify(fixtureRoot)
      assert.equal(result.status, 1)
      assert.match(result.stderr, /样式表包含不支持或格式无效的数据 URI/)
      assert.doesNotMatch(result.stderr, /PHN2Zz|PGgx|AQIDBA/)
    })
  }

  await t.test('valid raster data URI is still rejected in @import', async () => {
    const dataUri = `data:image/png;base64,${createOnePixelPng().toString('base64')}`
    await writeFile(cssPath, `${baselineCss}\n@import url('${dataUri}');\n`, 'utf8')
    await updateContentHash(fixtureRoot, 'styles.css')

    const result = verify(fixtureRoot)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /离线预览 CSS 不支持 @import/)
    assert.doesNotMatch(result.stderr, /AQIDBA/)
  })
})

test('builds and verifies pages when the first registry entry lists title before path', async (t) => {
  const fixtureRoot = await createFixture(t)
  const baseline = await readManifest(fixtureRoot)
  const baselinePages = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8')
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const original = "path: '/overview',\n    title: '原型概览',"
  assert.ok(registry.includes(original), '测试夹具应包含首个页面的路由和标题')
  await writeFile(registryPath, registry.replace(original, "title: '原型概览',\n    path: '/overview',"), 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)

  const { manifest } = await readManifest(fixtureRoot)
  assert.deepEqual(manifest.pages, baseline.manifest.pages)
  assert.equal(await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8'), baselinePages)
})

test('formats punctuation and multiline titles as safe table cells while preserving manifest values', async (t) => {
  const fixtureRoot = await createFixture(t)
  const baseline = await readManifest(fixtureRoot)
  const baselinePages = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8')
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const title = '演示 | <指南> *强调* _字段_ [链接](地址) `代码` &\r\n第二行'
  await writeFile(registryPath, registry.replace("title: '材料申报'", `title: ${JSON.stringify(title)}`), 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)

  const { manifest } = await readManifest(fixtureRoot)
  const targetRoute = '/material-submission/apply'
  const expectedPages = baseline.manifest.pages.map((page) => (
    page.route === targetRoute ? { ...page, title } : page
  ))
  const targetIndex = baseline.manifest.pages.findIndex((page) => page.route === targetRoute)
  assert.equal(targetIndex, 1, '基线中的目标页应是第二页')
  assert.deepEqual(manifest.pages, expectedPages)

  const originalRow = '| /material-submission/apply | 材料申报 |'
  const expectedRow = '| /material-submission/apply | 演示 &#124; &lt;指南&gt; &#42;强调&#42; &#95;字段&#95; &#91;链接&#93;&#40;地址&#41; &#96;代码&#96; &amp;<br>第二行 |'
  assert.ok(baselinePages.includes(originalRow), '基线页面清单应包含被修改页的原始行')
  assert.equal(
    await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8'),
    baselinePages.replace(originalRow, expectedRow),
  )
})

test('builds and verifies an additional page without colliding with existing routes', async (t) => {
  const fixtureRoot = await createFixture(t)
  const baseline = await readManifest(fixtureRoot)
  const baselinePages = await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8')
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const marker = '] as const'
  assert.ok(registry.includes(marker), '测试夹具应包含静态页面注册表结尾')
  const existingRoutes = new Set(baseline.manifest.pages.map((page) => page.route))
  const routeBase = '/demo-help/guide'
  let route = routeBase
  let suffix = 1
  while (existingRoutes.has(route)) route = `${routeBase}-${suffix++}`
  assert.equal(existingRoutes.has(route), false, '附加页面应使用当前注册表中未占用的路由')
  const title = '附加测试页'
  const addedPage = [
    '  {',
    `    path: ${JSON.stringify(route)},`,
    `    title: ${JSON.stringify(title)},`,
    `    menuLabel: ${JSON.stringify(title)},`,
    "    demoRole: '教学案例使用者',",
    "    description: '虚构的附加页面回归测试。',",
    '    component: OverviewPage,',
    '  },',
  ].join('\n')
  await writeFile(registryPath, registry.replace(marker, `${addedPage}\n${marker}`), 'utf8')

  const buildResult = buildPreview(fixtureRoot)
  assert.equal(buildResult.status, 0, buildResult.stderr || buildResult.stdout)
  const verifyResult = verify(fixtureRoot)
  assert.equal(verifyResult.status, 0, verifyResult.stderr || verifyResult.stdout)

  const { manifest } = await readManifest(fixtureRoot)
  assert.deepEqual(manifest.pages, [...baseline.manifest.pages, { route, title }])
  assert.equal(
    await readFile(path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md'), 'utf8'),
    `${baselinePages}| ${route} | ${title} |\n`,
  )
})

test('rejects a modified PAGES.md even when its checksum is updated', async (t) => {
  const fixtureRoot = await createFixture(t)
  const pagesPath = path.join(fixtureRoot, 'dist', 'preview', 'PAGES.md')
  const original = await readFile(pagesPath, 'utf8')
  await writeFile(pagesPath, original.replace('| /overview | 原型概览 |', '| /overview | 原型 | 概览 |'), 'utf8')
  await updateContentHash(fixtureRoot, 'PAGES.md')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /PAGES\.md 与源码页面注册表不一致/)
})

test('rejects dynamic page metadata before building an offline package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  await writeFile(registryPath, registry.replace("title: '原型概览'", 'title: makePageTitle()'), 'utf8')

  const result = buildPreview(fixtureRoot)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /title 必须是静态字符串/)
})

test('rejects a registered path containing a query during offline verification', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, registry.replace("path: '/overview'", "path: '/overview?mode=1'"), 'utf8')

  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /登记 path 只写静态路径，查询参数放页面链接/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '验包失败不应修改离线包文件或其 SHA 清单')
})

test('rejects a registered path containing a query before replacing the offline package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, registry.replace("path: '/overview'", "path: '/overview?mode=1'"), 'utf8')

  const result = buildPreview(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /登记 path 只写静态路径，查询参数放页面链接/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '构建失败不应修改离线包文件或其 SHA 清单')
})

test('rejects a syntactically invalid registry during offline verification without modifying the package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, `${registry}\nconst =\n`, 'utf8')

  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /页面注册表包含 TypeScript 语法错误/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '验包失败不应修改离线包文件或其 SHA 清单')
})

test('rejects a syntactically invalid registry during direct preview build before replacing the package', async (t) => {
  const fixtureRoot = await createFixture(t)
  const registryPath = path.join(fixtureRoot, 'src', 'app', 'page-registry.ts')
  const registry = await readFile(registryPath, 'utf8')
  const originalPackage = await snapshotPreviewFiles(fixtureRoot)
  await writeFile(registryPath, `${registry}\nconst =\n`, 'utf8')

  const result = buildPreview(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /页面注册表包含 TypeScript 语法错误/)
  assert.deepEqual(await snapshotPreviewFiles(fixtureRoot), originalPackage, '构建失败不应修改离线包文件或其 SHA 清单')
})

test('rejects a manifest title that differs from the registered page', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.pages[0].title = '伪造页面标题'
  await writeManifest(fixtureRoot, manifestPath, manifest)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 页面路由或标题与源码页面注册表不一致/)
})

test('rejects a manifest file list that names a missing artifact', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.files = ['missing-runtime.js']
  await writeManifest(fixtureRoot, manifestPath, manifest)
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 文件清单与离线包内容文件不一致/)
})

test('rejects manifest tampering when its checksum is unchanged', async (t) => {
  const fixtureRoot = await createFixture(t)
  const { manifestPath, manifest } = await readManifest(fixtureRoot)
  manifest.name = 'tampered-preview'
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /manifest 名称与离线预览包不一致|文件校验值不匹配：manifest\.json/)
})

test('rejects SHA256SUMS without the manifest checksum', async (t) => {
  const fixtureRoot = await createFixture(t)
  const sumsPath = path.join(fixtureRoot, 'dist', 'preview', 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
    .filter((line) => !/\s+manifest\.json$/.test(line))
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /SHA256SUMS 缺少文件：manifest\.json/)
})

test('rejects duplicate and unexpected SHA256SUMS entries', async (t) => {
  const fixtureRoot = await createFixture(t)
  const sumsPath = path.join(fixtureRoot, 'dist', 'preview', 'SHA256SUMS')
  const lines = (await readFile(sumsPath, 'utf8')).trimEnd().split(/\r?\n/)
  const index = lines.findIndex((line) => /\s+manifest\.json$/.test(line))
  lines.push(lines[index], `${'0'.repeat(64)}  extra.txt`)
  await writeFile(sumsPath, `${lines.join('\n')}\n`, 'utf8')
  const result = verify(fixtureRoot)

  assert.equal(result.status, 1)
  assert.match(result.stderr, /SHA256SUMS 包含重复条目：manifest\.json/)
  assert.match(result.stderr, /SHA256SUMS 包含额外文件：extra\.txt/)
})
