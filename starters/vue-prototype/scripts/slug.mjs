const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

/** Validate a module or page identifier using the page:new contract. */
export function assertSlug(value, label) {
  if (typeof value !== 'string' || !slugPattern.test(value) || value.split('-').some((part) => reservedWindowsNames.test(part))) {
    throw new Error(`${label}只能使用小写英文字母、数字和连字符，并以字母开头。`)
  }
}
