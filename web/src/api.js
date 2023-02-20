export async function get (pathname, params) {
  const search = new URLSearchParams(params).toString()

  return await fetch(`${import.meta.env.VITE_APP_API_URL || ''}/api/${pathname}?${search}`).then(response => response.json())
}

export async function post (pathname, body) {
  return await fetch(`${import.meta.env.VITE_APP_API_URL || ''}/api/${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(response => response.json())
}
