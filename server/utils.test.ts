import { capitalize, formatLocation, formatName, mapToQueryString, properCaseName, putLastNameFirst } from './utils'

describe('capitalize()', () => {
  describe('when a string IS NOT provided', () => {
    it('should return an empty string', () => {
      // @ts-expect-error: Test requires invalid types passed in
      expect(capitalize()).toEqual('')
      // @ts-expect-error: Test requires invalid types passed in
      expect(capitalize(['array item 1, array item 2'])).toEqual('')
      // @ts-expect-error: Test requires invalid types passed in
      expect(capitalize({ key: 'value' })).toEqual('')
      // @ts-expect-error: Test requires invalid types passed in
      expect(capitalize(1)).toEqual('')
    })
  })

  describe('when a string IS provided', () => {
    it('should handle uppercased strings', () => {
      expect(capitalize('HOUSEBLOCK 1')).toEqual('Houseblock 1')
    })

    it('should handle lowercased strings', () => {
      expect(capitalize('houseblock 1')).toEqual('Houseblock 1')
    })

    it('should handle multiple word strings', () => {
      expect(capitalize('Segregation Unit')).toEqual('Segregation unit')
    })
  })
})

describe('formatLocation()', () => {
  it('should cope with undefined', () => {
    expect(formatLocation(undefined)).toEqual(undefined)
  })
  it('should cope with null', () => {
    expect(formatLocation(null)).toEqual(undefined)
  })
  it('should preserve normal location names', () => {
    expect(formatLocation('A1234BC')).toEqual('A1234BC')
  })
  it('should convert RECP,CSWAP,COURT', () => {
    expect(formatLocation('RECP')).not.toEqual('RECP')
    expect(formatLocation('CSWAP')).not.toEqual('CSWAP')
    expect(formatLocation('COURT')).not.toEqual('COURT')
  })
})

describe('formatName', () => {
  it('Can format name', () => {
    expect(formatName('bob', 'smith')).toEqual('Bob Smith')
  })
  it('can format first name only', () => {
    expect(formatName('BOB', '')).toEqual('Bob')
  })
  it('can format last name only', () => {
    expect(formatName(undefined, 'Smith')).toEqual('Smith')
  })
  it('can format empty name', () => {
    expect(formatName('', '')).toEqual('')
  })
  it('can format no name', () => {
    expect(formatName(undefined, undefined)).toEqual('')
  })
})

describe('mapToQueryString', () => {
  it('should handle empty maps', () => {
    expect(mapToQueryString({})).toEqual('')
  })

  it('should handle single key values', () => {
    expect(mapToQueryString({ key1: 'val' })).toEqual('key1=val')
  })

  it('should handle non-string, scalar values', () => {
    expect(mapToQueryString({ key1: 1, key2: true })).toEqual('key1=1&key2=true')
  })

  it('should ignore null values', () => {
    expect(mapToQueryString({ key1: 1, key2: null })).toEqual('key1=1')
  })

  it('should handle encode values', () => {
    expect(mapToQueryString({ key1: "Hi, I'm here" })).toEqual("key1=Hi%2C%20I'm%20here")
  })
})

describe('properCaseName', () => {
  it('null string', () => {
    expect(properCaseName(null)).toEqual('')
  })
  it('empty string', () => {
    expect(properCaseName('')).toEqual('')
  })
  it('Lower Case', () => {
    expect(properCaseName('bob')).toEqual('Bob')
  })
  it('Mixed Case', () => {
    expect(properCaseName('GDgeHHdGr')).toEqual('Gdgehhdgr')
  })
  it('Multiple words', () => {
    expect(properCaseName('BOB SMITH')).toEqual('Bob smith')
  })
  it('Hyphenated', () => {
    expect(properCaseName('MONTGOMERY-FOSTER-SMYTH-WALLACE-BOB')).toEqual('Montgomery-Foster-Smyth-Wallace-Bob')
  })
})

describe('putLastNameFirst()', () => {
  it('should return null if no names specified', () => {
    // @ts-expect-error: Test requires invalid types passed in
    expect(putLastNameFirst()).toEqual(null)
  })

  it('should return correctly formatted last name if no first name specified', () => {
    expect(putLastNameFirst('', 'LASTNAME')).toEqual('Lastname')
  })

  it('should return correctly formatted first name if no last name specified', () => {
    // @ts-expect-error: Test requires invalid types passed in
    expect(putLastNameFirst('FIRSTNAME')).toEqual('Firstname')
  })

  it('should return correctly formatted last name and first name if both specified', () => {
    expect(putLastNameFirst('FIRSTNAME', 'LASTNAME')).toEqual('Lastname, Firstname')
  })
})
