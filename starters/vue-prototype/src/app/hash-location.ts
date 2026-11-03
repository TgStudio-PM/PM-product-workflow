export interface HashLocation {
  path: string
  query: URLSearchParams
  isRegistered: boolean
}

function browserSerializedPath(path: string): string {
  const url = new URL('file:///')
  url.hash = `#${path}`
  return url.hash.slice(1)
}

export function resolveHashLocation(hash: string, registeredPaths: readonly string[]): HashLocation {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  const queryIndex = fragment.indexOf('?')
  const requestedPath = queryIndex === -1 ? fragment : fragment.slice(0, queryIndex)
  const queryString = queryIndex === -1 ? '' : fragment.slice(queryIndex + 1)
  const registeredPath = requestedPath
    ? registeredPaths.find((candidate) => candidate === requestedPath || browserSerializedPath(candidate) === requestedPath)
    : undefined
  const path = requestedPath ? registeredPath ?? requestedPath : registeredPaths[0] || ''

  return {
    path,
    query: new URLSearchParams(queryString),
    isRegistered: requestedPath ? registeredPath !== undefined : registeredPaths.includes(path),
  }
}
