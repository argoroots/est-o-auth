// Digits only; an 8-digit or shorter number is taken as Estonian and gets the +372 prefix
export function normalizePhone (value) {
  if (!value) return value

  const digits = value.replace(/\D/g, '')

  return `+${digits.length <= 8 ? '372' : ''}${digits}`
}

// Digits only
export function normalizeIdcode (value) {
  if (!value) return value

  return value.replace(/\D/g, '')
}
