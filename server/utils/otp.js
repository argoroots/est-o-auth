import { randomInt, timingSafeEqual } from 'crypto'

// One-time codes for e-mail and phone login. One live code per target (the session key), a resend
// cooldown so a public client_id cannot be used to flood a mailbox or phone, and a bounded number
// of guesses per code.
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

export function isEmail (value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

// E.164: leading + and 7 to 15 digits
export function isPhone (value) {
  return typeof value === 'string' && /^\+\d{7,15}$/.test(value)
}

// Creates and stores a fresh code for the target, replacing any earlier one. fixedCode is for the test user.
export async function createOtp (key, data, fixedCode) {
  const existing = await getSessionData(key, false, SESSION_TTL.OTP)

  if (existing && Date.now() - existing.sent < RESEND_COOLDOWN_MS) {
    throw createError({ statusCode: 429, statusMessage: 'Please wait before requesting a new code' })
  }

  const code = fixedCode ?? String(randomInt(0, 1_000_000)).padStart(6, '0')

  await setSessionData(key, { ...data, code, attempts: 0, sent: Date.now() })

  return code
}

// Checks a submitted code. A correct code consumes the session and returns its data; a wrong one
// counts an attempt and deletes the session after MAX_ATTEMPTS. Returns undefined on any failure.
export async function verifyOtp (key, code) {
  const session = await getSessionData(key, false, SESSION_TTL.OTP)

  if (!session) return

  const expected = Buffer.from(session.code)
  const given = Buffer.from(String(code ?? ''))
  const matches = given.length === expected.length && timingSafeEqual(given, expected)

  if (matches) {
    // Consume exactly once; a concurrent correct submission loses here
    const consumed = await getSessionData(key, true)

    return consumed ? session : undefined
  }

  const attempts = session.attempts + 1

  if (attempts >= MAX_ATTEMPTS) await getSessionData(key, true)
  else await setSessionData(key, { ...session, attempts }, session.sent)
}
