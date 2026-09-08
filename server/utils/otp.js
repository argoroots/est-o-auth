import { randomInt, timingSafeEqual } from 'crypto'

// One live code per target, a resend cooldown, and a bounded number of guesses; both enforced atomically in DynamoDB
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

// Plausible e-mail address of at most 254 characters
export function isEmail (value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Estonian number only (+372 and 7 or 8 digits); other countries are where SMS pumping targets live
export function isPhone (value) {
  return typeof value === 'string' && /^\+372\d{7,8}$/.test(value)
}

// Estonian personal code GYYMMDDSSSC: century/sex digit, real past birth date, modulo 11 check digit
export function isIdcode (value) {
  if (typeof value !== 'string' || !/^[1-8]\d{10}$/.test(value)) return false

  const digits = Array.from(value, Number)

  // G: 1-2 = 1800s, 3-4 = 1900s, 5-6 = 2000s, 7-8 = 2100s
  const century = 1800 + Math.floor((digits[0] - 1) / 2) * 100
  const year = century + Number(value.substring(1, 3))
  const month = Number(value.substring(3, 5))
  const day = Number(value.substring(5, 7))
  const birthDate = new Date(Date.UTC(year, month - 1, day))
  const isRealDate = birthDate.getUTCFullYear() === year && birthDate.getUTCMonth() === month - 1 && birthDate.getUTCDate() === day

  if (!isRealDate || birthDate > new Date()) return false

  const checksum = (weights) => weights.reduce((sum, weight, i) => sum + weight * digits[i], 0) % 11

  let check = checksum([1, 2, 3, 4, 5, 6, 7, 8, 9, 1])

  if (check === 10) check = checksum([3, 4, 5, 6, 7, 8, 9, 1, 2, 3])
  if (check === 10) check = 0

  return check === digits[10]
}

// Creates and stores a fresh code for the target ('email' or 'phone'); 429 within the resend cooldown
export async function createOtp (type, target, data, fixedCode) {
  const code = fixedCode ?? String(randomInt(0, 1_000_000)).padStart(6, '0')
  const stored = await setSessionDataUnlessRecent(targetKey(type, target), { ...data, code }, RESEND_COOLDOWN_MS, SESSION_TTL.OTP)

  if (!stored) throw apiError(429, 'limit.resend')

  return code
}

// Checks a submitted code, counting the attempt first; a match consumes the code and returns its data
export async function verifyOtp (type, target, code) {
  const key = targetKey(type, target)
  const session = await countSessionAttempt(key, MAX_ATTEMPTS, SESSION_TTL.OTP)

  if (!session) return

  const expected = Buffer.from(session.data.code)
  const given = Buffer.from(String(code ?? ''))
  const matches = given.length === expected.length && timingSafeEqual(given, expected)

  if (matches) {
    // Consume exactly once; a concurrent correct submission loses here
    const consumed = await getSessionData(key, true)

    return consumed ? session.data : undefined
  }

  // Last allowed guess was wrong: drop the code so a fresh one must be requested
  if (session.attempts >= MAX_ATTEMPTS) await getSessionData(key, true)
}
