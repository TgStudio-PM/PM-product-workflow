import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { assertSlug } from './slug.mjs'

const requiredTemplateFiles = ['CURRENT.md', 'BUSINESS_RULES.md', 'PAGE_FLOW.md', 'DECISIONS.md', 'ERROR_LEDGER.md']

async function lstatIfExists(filePath) {
  try {
    return await lstat(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    throw error
  }
}

async function assertNoSymlinkComponents(root, targetPath) {
  const relativePath = path.relative(root, targetPath)
  if (path.isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${path.sep}`)) {
    throw new Error(`检查路径超出工程目录：${targetPath}`)
  }

  const components = [root]
  let currentPath = root
  for (const component of relativePath.split(path.sep).filter(Boolean)) {
    currentPath = path.join(currentPath, component)
    components.push(currentPath)
  }
  for (let index = 0; index < components.length; index += 1) {
    const componentPath = components[index]
    const stat = await lstatIfExists(componentPath)
    if (!stat) return
    if (stat.isSymbolicLink()) {
      const displayPath = path.relative(root, componentPath).split(path.sep).join('/') || '.'
      throw new Error(`路径包含符号链接，为保护工程外文件已拒绝：${displayPath}`)
    }
    if (index < components.length - 1 && !stat.isDirectory()) {
      throw new Error(`路径父项不是目录，无法安全写入：${path.relative(root, componentPath).split(path.sep).join('/') || '.'}`)
    }
  }
}

/** Copy the blank module fact templates without modifying existing project files. */
export async function createFacts({ root = process.cwd(), module }) {
  assertSlug(module, '模块标识')

  const projectRoot = path.resolve(root)
  const templateDirectory = path.join(projectRoot, 'module-template', 'facts', 'module')
  const targetDirectory = path.join(projectRoot, 'src', 'modules', module, 'facts', 'module')
  await assertNoSymlinkComponents(projectRoot, templateDirectory)
  await assertNoSymlinkComponents(projectRoot, targetDirectory)
  if (await lstatIfExists(targetDirectory)) throw new Error(`目标目录已存在，不会覆盖：src/modules/${module}/facts/module`)

  const templateEntries = await readdir(templateDirectory, { withFileTypes: true })
  const templateFiles = new Map()
  for (const file of requiredTemplateFiles) {
    const entry = templateEntries.find((item) => item.name === file)
    if (!entry?.isFile()) throw new Error(`模块事实模板缺少普通文件：module-template/facts/module/${file}`)
    templateFiles.set(file, await readFile(path.join(templateDirectory, file)))
  }

  const parentDirectory = path.dirname(targetDirectory)
  await assertNoSymlinkComponents(projectRoot, parentDirectory)
  await mkdir(parentDirectory, { recursive: true })
  await assertNoSymlinkComponents(projectRoot, parentDirectory)
  const stagingDirectory = await mkdtemp(path.join(parentDirectory, `.facts-new-${module}-`))
  let stagingExists = true
  try {
    for (const [file, content] of templateFiles) {
      await assertNoSymlinkComponents(projectRoot, templateDirectory)
      await assertNoSymlinkComponents(projectRoot, stagingDirectory)
      await writeFile(path.join(stagingDirectory, file), content, { flag: 'wx' })
    }

    await assertNoSymlinkComponents(projectRoot, parentDirectory)
    await assertNoSymlinkComponents(projectRoot, targetDirectory)
    if (await lstatIfExists(targetDirectory)) throw new Error('目标目录在操作期间出现变化；未覆盖现有内容。')
    await rename(stagingDirectory, targetDirectory)
    stagingExists = false
  } finally {
    if (stagingExists) await rm(stagingDirectory, { recursive: true, force: true })
  }

  return {
    directory: path.relative(projectRoot, targetDirectory).split(path.sep).join('/'),
    files: requiredTemplateFiles,
  }
}

async function main() {
  const [module, ...extra] = process.argv.slice(2)
  if (!module || extra.length > 0) {
    throw new Error('用法：npm run facts:new -- <module>，例如 npm run facts:new -- demo-help')
  }
  const result = await createFacts({ module })
  console.log(`已创建 ${result.directory}，复制了 ${result.files.length} 份空白事实模板。请按证据填写；不要将页面现状或 mock 自动标为已确认业务规则，并让页面 RULES.md 链接到 ../../facts/module/BUSINESS_RULES.md。`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`FACTS-NEW-01 ${error.message}`)
    process.exitCode = 1
  })
}
