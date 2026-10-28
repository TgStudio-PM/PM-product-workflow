import ts from 'typescript'

const markdownCellEntities = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['|', '&#124;'],
  ['\\', '&#92;'],
  ['`', '&#96;'],
  ['*', '&#42;'],
  ['_', '&#95;'],
  ['~', '&#126;'],
  ['[', '&#91;'],
  [']', '&#93;'],
  ['(', '&#40;'],
  [')', '&#41;'],
  ['!', '&#33;'],
])

export function formatMarkdownTableCell(value) {
  return String(value)
    .replace(/\r\n|[\r\n]|[&<>|\\`*_~\[\]()!]/g, (character) => {
      if (character === '\r\n' || character === '\r' || character === '\n') return '<br>'
      return markdownCellEntities.get(character)
    })
}

export function formatPagesMarkdown(pages) {
  return `# 页面清单\n\n| 路由 | 页面 |\n| --- | --- |\n${pages.map(({ route, title }) => `| ${formatMarkdownTableCell(route)} | ${formatMarkdownTableCell(title)} |`).join('\n')}\n`
}

export function readRegisteredPages(registrySource) {
  const sourceFile = ts.createSourceFile('page-registry.ts', registrySource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  if (sourceFile.parseDiagnostics.length > 0) {
    const message = ts.flattenDiagnosticMessageText(sourceFile.parseDiagnostics[0].messageText, ' ')
    throw new Error(`页面注册表包含 TypeScript 语法错误，无法安全读取：${message}`)
  }
  const declarations = []

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

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'pageRegistry') declarations.push(declaration)
    }
  }

  const initializer = declarations.length === 1 ? unwrapExpression(declarations[0].initializer) : undefined
  if (declarations.length !== 1 || !ts.isArrayLiteralExpression(initializer)) {
    throw new Error('页面注册表必须是唯一的静态 pageRegistry 数组。')
  }

  const pages = initializer.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`页面注册表第 ${index + 1} 项必须是静态对象。`)
    }

    const metadata = new Map()
    for (const property of element.properties) {
      if (ts.isSpreadAssignment(property) || !ts.isPropertyAssignment(property) || property.name && ts.isComputedPropertyName(property.name)) {
        throw new Error(`页面注册表第 ${index + 1} 项必须只包含静态属性。`)
      }
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : undefined
      if (key !== 'path' && key !== 'title') continue
      if (metadata.has(key)) throw new Error(`页面注册表第 ${index + 1} 项包含重复的 ${key} 字段。`)
      if (!ts.isStringLiteral(property.initializer) && !ts.isNoSubstitutionTemplateLiteral(property.initializer)) {
        throw new Error(`页面注册表第 ${index + 1} 项的 ${key} 必须是静态字符串。`)
      }
      metadata.set(key, property.initializer.text)
    }

    for (const key of ['path', 'title']) {
      if (!metadata.has(key) || !metadata.get(key)) {
        throw new Error(`页面注册表第 ${index + 1} 项缺少有效的 ${key} 字段。`)
      }
    }

    const route = metadata.get('path')
    if (route.includes('?')) {
      throw new Error(`页面注册表第 ${index + 1} 项的登记 path 只写静态路径，查询参数放页面链接。`)
    }

    return { route, title: metadata.get('title') }
  })

  if (pages.length === 0) throw new Error('页面注册表没有可打包的页面路由。')

  const routeCounts = new Map()
  for (const { route } of pages) routeCounts.set(route, (routeCounts.get(route) ?? 0) + 1)
  const duplicateRoutes = [...routeCounts].filter(([, count]) => count > 1).map(([route]) => route)
  if (duplicateRoutes.length > 0) {
    throw new Error(`页面注册表包含重复路由，无法生成离线包：${duplicateRoutes.join('、')}`)
  }

  return pages
}
