export const arrayToQueryString = (array: string[] | number[] | boolean[], key: string): string =>
  array && array.map(item => `${key}=${encodeURIComponent(item)}`).join('&')

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

export default {
  arrayToQueryString,
  forenameToInitial,
  mapToQueryString,
}
