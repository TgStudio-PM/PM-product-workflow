import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { readRegisteredPages } from './page-registry.mjs'
import { assertSlug } from './slug.mjs'

const requiredTemplateFiles = ['Page.vue', 'mock.ts', 'RULES.md']

function pascalCase(value) {
  return value.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('')
}

function unwrapExpression(expression) {
  let current = expression
  while (current && (
    ts.isAsExpression(current)
    || ts.isSatisfiesExpression(current)
    || ts.isParenthesizedExpression(current)
    || ts.isTypeAssertionExpression(current)
    || ts.isNonNullExpression(current)
  )) current = current.expression
  return current
}

function topLevelBindings(sourceFile) {
  const names = new Set()
  const addBinding = (name) => {
    if (ts.isIdentifier(name)) names.add(name.text)
    else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) if (ts.isBindingElement(element)) addBinding(element.name)
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const clause = statement.importClause
      if (clause.name) addBinding(clause.name)
      if (clause.namedBindings) {
        if (ts.isNamespaceImport(clause.namedBindings)) addBinding(clause.namedBindings.name)
        else for (const specifier of clause.namedBindings.elements) addBinding(specifier.name)
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) addBinding(declaration.name)
    } else if (
      (ts.isFunctionDeclaration(statement)
        || ts.isClassDeclaration(statement)
        || ts.isInterfaceDeclaration(statement)
        || ts.isTypeAliasDeclaration(statement)
        || ts.isEnumDeclaration(statement))
      && statement.name
    ) addBinding(statement.name)
  }
  return names
}

function registryInsertions(source, componentName, importPath, route, title, eol) {
  const sourceFile = ts.createSourceFile('page-registry.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  if (sourceFile.parseDiagnostics.length > 0) throw new Error('page-registry.ts 存在语法错误，请先修复后再新增页面。')

  const declarations = []
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'pageRegistry') declarations.push(declaration)
    }
  }
  const initializer = declarations.length === 1 ? unwrapExpression(declarations[0].initializer) : undefined
  if (declarations.length !== 1 || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error('page-registry.ts 必须包含唯一的静态 pageRegistry 数组。')
  }
  if (topLevelBindings(sourceFile).has(componentName)) {
    throw new Error(`组件导入名 ${componentName} 已存在；请选择不同的模块或页面标识。`)
  }

  const importStatements = sourceFile.statements.filter(ts.isImportDeclaration)
  const importPosition = importStatements.length > 0 ? importStatements.at(-1).end : 0
  const importText = `${importPosition === 0 ? '' : eol}import ${componentName} from '${importPath}'`
  const itemText = `  {${eol}    path: ${JSON.stringify(route)},${eol}    title: ${JSON.stringify(title)},${eol}    menuLabel: ${JSON.stringify(title)},${eol}    demoRole: ${JSON.stringify('教学示例角色（请按项目事实核对）')},${eol}    description: ${JSON.stringify('新建页面占位说明；请按已确认需求修改。')},${eol}    component: ${componentName},${eol}  },${eol}`

  const insertions = [
    { position: initializer.end - 1, text: itemText },
    { position: importPosition, text: importText },
  ]
  const lastElement = initializer.elements.at(-1)
  if (lastElement && !initializer.elements.hasTrailingComma) {
    insertions.push({ position: lastElement.end, text: ',' })
  }
  return insertions
}

function applyInsertions(source, insertions) {
  let result = source
  for (const insertion of [...insertions].sort((left, right) => right.position - left.position)) {
    result = `${result.slice(0, insertion.position)}${insertion.text}${result.slice(insertion.position)}`
  }
  return result
}

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
      const displayPath = path.relative(root, componentPath).split(path.sep).join('/') || '.'
      throw new Error(`路径父项不是目录，无法安全写入：${displayPath}`)
    }
  }
}

function replaceTemplateTitle(mockSource, title) {
  const marker = "title: '新页面标题'"
  const index = mockSource.indexOf(marker)
  if (index < 0 || mockSource.indexOf(marker, index + marker.length) >= 0) {
    throw new Error('页面模板 mock.ts 中未找到唯一标题占位符；请检查模板后重试。')
  }
  return `${mockSource.slice(0, index)}title: ${JSON.stringify(title)}${mockSource.slice(index + marker.length)}`
}

/** Create a starter page and register it without overwriting existing files. */
export async function createPage({ root = process.cwd(), module, page, title }) {
  assertSlug(module, '模块标识')
  assertSlug(page, '页面标识')
  if (typeof title !== 'string' || !title.trim()) throw new Error('页面标题不能为空。')

  const projectRoot = path.resolve(root)
  const templateRoot = path.join(projectRoot, 'page-template')
  const targetDirectory = path.join(projectRoot, 'src', 'modules', module, 'pages', page)
  const registryPath = path.join(projectRoot, 'src', 'app', 'page-registry.ts')
  await assertNoSymlinkComponents(projectRoot, templateRoot)
  await assertNoSymlinkComponents(projectRoot, targetDirectory)
  await assertNoSymlinkComponents(projectRoot, registryPath)
  if (await lstatIfExists(targetDirectory)) throw new Error(`目标目录已存在，不会覆盖：src/modules/${module}/pages/${page}`)

  const templateEntries = await readdir(templateRoot, { withFileTypes: true })
  for (const file of requiredTemplateFiles) {
    const entry = templateEntries.find((item) => item.name === file)
    if (!entry?.isFile()) throw new Error(`页面模板缺少普通文件：page-template/${file}`)
  }

  const registrySource = await readFile(registryPath, 'utf8')
  let existingPages
  try {
    existingPages = readRegisteredPages(registrySource)
  } catch (error) {
    throw new Error(`无法安全读取 page-registry.ts：${error.message}`)
  }

  const route = `/${module}/${page}`
  if (existingPages.some((item) => item.route === route)) throw new Error(`页面路由已存在：${route}`)
  const componentName = `${pascalCase(module)}${pascalCase(page)}Page`
  const importPath = `../modules/${module}/pages/${page}/Page.vue`
  const eol = registrySource.includes('\r\n') ? '\r\n' : '\n'
  const nextRegistry = applyInsertions(
    registrySource,
    registryInsertions(registrySource, componentName, importPath, route, title.trim(), eol),
  )
  const generatedSourceFile = ts.createSourceFile('page-registry.ts', nextRegistry, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  if (generatedSourceFile.parseDiagnostics.length > 0) {
    const details = generatedSourceFile.parseDiagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('; ')
    throw new Error(`生成的注册表存在 TypeScript 语法错误：${details}`)
  }
  let registeredPages
  try {
    registeredPages = readRegisteredPages(nextRegistry)
  } catch (error) {
    throw new Error(`生成的注册表未通过静态检查：${error.message}`)
  }
  if (!registeredPages.some((item) => item.route === route && item.title === title.trim())) {
    throw new Error('生成后的页面路由与标题校验失败；未写入文件。')
  }

  const templateFiles = new Map()
  for (const file of requiredTemplateFiles) {
    templateFiles.set(file, await readFile(path.join(templateRoot, file), 'utf8'))
  }
  templateFiles.set('mock.ts', replaceTemplateTitle(templateFiles.get('mock.ts'), title.trim()))

  const parentDirectory = path.dirname(targetDirectory)
  await assertNoSymlinkComponents(projectRoot, parentDirectory)
  await mkdir(parentDirectory, { recursive: true })
  await assertNoSymlinkComponents(projectRoot, parentDirectory)
  const stagingDirectory = await mkdtemp(path.join(parentDirectory, `.page-new-${page}-`))
  const registryTempPath = `${registryPath}.page-new-${process.pid}-${Date.now()}`
  let stagingExists = true
  let registryTempExists = false
  try {
    for (const [file, content] of templateFiles) {
      await assertNoSymlinkComponents(projectRoot, templateRoot)
      await assertNoSymlinkComponents(projectRoot, stagingDirectory)
      await writeFile(path.join(stagingDirectory, file), content, { encoding: 'utf8', flag: 'wx' })
    }
    await assertNoSymlinkComponents(projectRoot, path.dirname(registryPath))
    await assertNoSymlinkComponents(projectRoot, registryPath)
    await writeFile(registryTempPath, nextRegistry, { encoding: 'utf8', flag: 'wx' })
    registryTempExists = true

    await assertNoSymlinkComponents(projectRoot, parentDirectory)
    await assertNoSymlinkComponents(projectRoot, targetDirectory)
    if (await lstatIfExists(targetDirectory)) throw new Error('目标目录在操作期间出现变化；未覆盖现有内容。')
    await assertNoSymlinkComponents(projectRoot, path.dirname(registryPath))
    await assertNoSymlinkComponents(projectRoot, registryPath)
    if ((await readFile(registryPath, 'utf8')) !== registrySource) {
      throw new Error('page-registry.ts 在操作期间发生变化；请检查并重试。')
    }

    await assertNoSymlinkComponents(projectRoot, parentDirectory)
    await assertNoSymlinkComponents(projectRoot, targetDirectory)
    await rename(stagingDirectory, targetDirectory)
    stagingExists = false
    try {
      await assertNoSymlinkComponents(projectRoot, path.dirname(registryPath))
      await assertNoSymlinkComponents(projectRoot, registryPath)
      await rename(registryTempPath, registryPath)
      registryTempExists = false
    } catch (error) {
      const createdDirectory = path.relative(projectRoot, targetDirectory).split(path.sep).join('/')
      throw new Error(`页面文件已创建：${createdDirectory}；src/app/page-registry.ts 未更新。请按 docs/ADD_PAGE.md「部分完成后的接续」核对并补充注册项；直接重复 page:new 会因目标目录已存在而被拒绝。原始错误：${error.message}`)
    }
  } finally {
    if (stagingExists) await rm(stagingDirectory, { recursive: true, force: true })
    if (registryTempExists) await rm(registryTempPath, { force: true })
  }

  return { route, directory: path.relative(projectRoot, targetDirectory).split(path.sep).join('/') }
}

async function main() {
  const [module, page, title, ...extra] = process.argv.slice(2)
  if (!module || !page || !title || extra.length > 0) {
    throw new Error('用法：npm run page:new -- <module> <page> <title>，例如 npm run page:new -- demo-help guide "演示帮助"')
  }
  const result = await createPage({ module, page, title })
  console.log(`已创建 ${result.directory}，路由为 ${result.route}。请检查角色/说明占位文案，并按已确认需求完善 mock.ts、Page.vue 和 RULES.md。`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`PAGE-NEW-01 ${error.message}`)
    process.exitCode = 1
  })
}
