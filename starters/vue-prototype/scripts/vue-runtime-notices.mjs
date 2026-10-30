import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const THIRD_PARTY_NOTICES_FILE = 'THIRD_PARTY_NOTICES.txt'

const runtimePackages = ['vue', '@vue/shared', '@vue/reactivity', '@vue/runtime-core', '@vue/runtime-dom']

async function readRequiredFile(filePath, label) {
  try {
    return await readFile(filePath, 'utf8')
  } catch (error) {
    throw new Error(`无法读取 Vue 运行依赖 ${label}（${error.code ?? error.name}）。`)
  }
}

export async function generateVueRuntimeNotices(projectRoot) {
  const packages = []
  for (const expectedName of runtimePackages) {
    const packageDirectory = path.join(projectRoot, 'node_modules', ...expectedName.split('/'))
    const packageJsonPath = path.join(packageDirectory, 'package.json')
    const metadataText = await readRequiredFile(packageJsonPath, `${expectedName}/package.json`)
    let metadata
    try {
      metadata = JSON.parse(metadataText)
    } catch {
      throw new Error(`Vue 运行依赖 ${expectedName} 的 package.json 无法解析。`)
    }
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      throw new Error(`Vue 运行依赖 ${expectedName} 的 package.json 不是有效对象。`)
    }
    if (metadata?.name !== expectedName) {
      throw new Error(`Vue 运行依赖名称不匹配：期望 ${expectedName}，实际 ${String(metadata?.name)}。`)
    }
    if (typeof metadata.version !== 'string' || !metadata.version.trim()) {
      throw new Error(`Vue 运行依赖 ${expectedName} 缺少有效 version 字段。`)
    }
    if (typeof metadata.license !== 'string' || !metadata.license.trim()) {
      throw new Error(`Vue 运行依赖 ${expectedName} 缺少有效 license 字段。`)
    }

    const licenseText = await readRequiredFile(path.join(packageDirectory, 'LICENSE'), `${expectedName}/LICENSE`)
    if (!licenseText.trim()) throw new Error(`Vue 运行依赖 ${expectedName} 的 LICENSE 正文为空。`)
    packages.push({ name: metadata.name, version: metadata.version, license: metadata.license, licenseText })
  }

  const groups = new Map()
  for (const dependency of packages) {
    const group = groups.get(dependency.licenseText) ?? { licenseText: dependency.licenseText, packages: [] }
    group.packages.push(dependency)
    groups.set(dependency.licenseText, group)
  }

  const lines = [
    '# Vue runtime dependency notices',
    '',
    'Generated from the installed Vue runtime packages listed below. Each license body is copied verbatim from that package\'s LICENSE file.',
    'This fixed list covers the Vue runtime components used by this starter; it is not a general dependency audit.',
    '',
  ]
  let groupNumber = 0
  for (const group of groups.values()) {
    groupNumber += 1
    const entries = group.packages.map(({ name, version, license }) => `${name}@${version} (license: ${license})`)
    lines.push(
      `## License text group ${groupNumber}`,
      '',
      `Packages: ${entries.join('; ')}`,
      '',
      '----- BEGIN LICENSE TEXT -----',
      group.licenseText,
      '----- END LICENSE TEXT -----',
      '',
    )
  }
  return lines.join('\n')
}
