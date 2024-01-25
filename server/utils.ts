export const arrayToQueryString = (array: string[] | number[] | boolean[], key: string): string =>
  array && array.map(item => `${key}=${encodeURIComponent(item)}`).join('&')

export const capitalize = (string: string): string => {
  if (typeof string !== 'string') return ''
  const lowerCase = string.toLowerCase()
  return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1)
}

export const isBlank = (str: string): boolean => !str || /^\s*$/.test(str)

export const mapToQueryString = (params: Record<never, never>): string =>
  Object.keys(params)
    .filter(key => params[key])
    .map(key => {
      if (Array.isArray(params[key])) return arrayToQueryString(params[key], key)
      return `${key}=${encodeURIComponent(params[key])}`
    })
    .join('&')

export const forenameToInitial = (name: { charAt: () => unknown; split: (arg0: string) => unknown[] }): string => {
  if (!name) return null
  return `${name.charAt()}. ${name.split(' ').pop()}`
}

export const formatLocation = (locationName: string): string => {
  if (!locationName) return undefined
  if (locationName.includes('RECP')) return 'Reception'
  if (locationName.includes('CSWAP')) return 'No cell allocated'
  if (locationName.includes('COURT')) return 'Court'
  return locationName
}

export const formatName = (firstName: string, lastName: string): string =>
  [properCaseName(firstName), properCaseName(lastName)].filter(Boolean).join(' ')

/**
 * Converts a name (first name, last name, middle name, etc.) to proper case equivalent, handling double-barreled names
 * correctly (i.e. each part in a double-barreled is converted to proper case).
 * @param name name to be converted.
 * @returns name converted to proper case.
 */
export const properCaseName = (name: string): string => (isBlank(name) ? '' : name.split('-').map(capitalize).join('-'))

export const putLastNameFirst = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) return null
  if (!firstName && lastName) return properCaseName(lastName)
  if (firstName && !lastName) return properCaseName(firstName)

  return `${properCaseName(lastName)}, ${properCaseName(firstName)}`
}

export const hasLength = (array: unknown[]): boolean => array && array.length > 0

export const groupBy = (array: any[], key: string): Record<string, unknown> =>
  array &&
  array.reduce((acc, current) => {
    const group = current[key]

    return { ...acc, [group]: [...(acc[group] || []), current] }
  }, {})

export default {
  arrayToQueryString,
  capitalize,
  forenameToInitial,
  formatLocation,
  formatName,
  isBlank,
  mapToQueryString,
  properCaseName,
  putLastNameFirst,
  hasLength,
  groupBy,
}
