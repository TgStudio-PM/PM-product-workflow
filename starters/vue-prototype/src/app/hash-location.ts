export interface HashLocation {
  path: string
  query: URLSearchParams
  isRegistered: boolean
}

export function resolveHashLocation(hash: string, registeredPaths: readonly string[]): HashLocation {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  const queryIndex = fragment.indexOf('?')
  const requestedPath = queryIndex === -1 ? fragment : fragment.slice(0, queryIndex)
  const queryString = queryIndex === -1 ? '' : fragment.slice(queryIndex + 1)
  const path = requestedPath || registeredPaths[0] || ''

  return {
    path,
    query: new URLSearchParams(queryString),
    isRegistered: registeredPaths.includes(path),
  }
}
