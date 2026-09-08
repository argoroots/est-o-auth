import { randomInt, timingSafeEqual } from 'crypto'

// One-time codes for e-mail and phone login. One live code per target (the session key), a resend
// cooldown so a public client_id cannot be used to flood a mailbox or phone, and a bounded number
// of guesses per code. Both limits are enforced with conditional DynamoDB writes, so concurrent
// requests cannot slip past them.
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

export function isEmail (value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// Estonian number only, +372 and 7 or 8 digits: this service authenticates Estonian users, and refusing
// every other country removes the premium-rate ranges that SMS pumping relies on
export function isPhone (value) {
  return typeof value === 'string' && /^\+372\d{7,8}$/.test(value)
}

// Estonian personal identification code, GYYMMDDSSSC: G is sex and century (1-2: 1800s, 3-4: 1900s,
// 5-6: 2000s, 7-8: 2100s; odd male, even female), YYMMDD the date of birth, SSS a serial number and
// C a modulo 11 check digit. Requires a real calendar date not in the future and a correct check digit.
export function isIdcode (value) {
  if (typeof value !== 'string' || !/^[1-8]\d{10}$/.test(value)) return false

  const digits = Array.from(value, Number)

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

// Creates and stores a fresh code for the target (type is 'email' or 'phone'), replacing any earlier
// one that is past the resend cooldown. fixedCode is for the test user.
export async function createOtp (type, target, data, fixedCode) {
  const code = fixedCode ?? String(randomInt(0, 1_000_000)).padStart(6, '0')
  const stored = await setSessionDataUnlessRecent(targetKey(type, target), { ...data, code }, RESEND_COOLDOWN_MS, SESSION_TTL.OTP)

  if (!stored) throw createError({ statusCode: 429, statusMessage: 'Please wait before requesting a new code' })

  return code
}

// Checks a submitted code. Every call counts as an attempt before the code is compared, so at most
// MAX_ATTEMPTS comparisons ever happen for one code. A correct code consumes the session and returns
// its data. Returns undefined on any failure.
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
