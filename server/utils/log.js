// Makes an untrusted value safe for a one-line log entry: control characters escaped, length capped
export function logSafe (value, maxLength = 200) {
  const text = String(value ?? '')
  // eslint-disable-next-line no-control-regex
  const escaped = text.replace(/[\x00-\x1f\x7f]/g, (char) => JSON.stringify(char).slice(1, -1))

  return escaped.length > maxLength ? `${escaped.substring(0, maxLength)}…` : escaped
}
