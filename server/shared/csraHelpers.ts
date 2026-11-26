export const csraTranslations: Record<string, string> = {
  LOW: 'Low',
  MED: 'Medium',
  STANDARD: 'Standard',
  HI: 'High',
  HI_GEN: 'High General',
  HI_SPFC: 'High Specific',
}

/**
 * NOMIS CSRA codes that mean a high cell-sharing risk. HI is the legacy High; HI_GEN (High General) and
 * HI_SPFC (High Specific) replace it under the new CSRA policy.
 */
export const highCsraCodes = ['HI', 'HI_GEN', 'HI_SPFC']

export const isHighCsra = (csraClassificationCode?: string): boolean => highCsraCodes.includes(csraClassificationCode)

export default {
  csraTranslations,
  highCsraCodes,
  isHighCsra,
}
