import { randomBytes } from 'crypto'

export default defineEventHandler((event) => {
  const nonce = randomBytes(32).toString('base64')

  return { nonce }
})
