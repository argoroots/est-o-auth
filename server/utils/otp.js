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

// E.164: leading + and 7 to 15 digits
export function isPhone (value) {
  return typeof value === 'string' && /^\+\d{7,15}$/.test(value)
}

// Creates and stores a fresh code for the target, replacing any earlier one that is past the resend
// cooldown. fixedCode is for the test user.
export async function createOtp (key, data, fixedCode) {
  const code = fixedCode ?? String(randomInt(0, 1_000_000)).padStart(6, '0')
  const stored = await setSessionDataUnlessRecent(key, { ...data, code }, RESEND_COOLDOWN_MS)

  if (!stored) throw createError({ statusCode: 429, statusMessage: 'Please wait before requesting a new code' })

  return code
}

// Checks a submitted code. Every call counts as an attempt before the code is compared, so at most
// MAX_ATTEMPTS comparisons ever happen for one code. A correct code consumes the session and returns
// its data. Returns undefined on any failure.
export async function verifyOtp (key, code) {
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
