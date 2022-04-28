async function get404 (method, pathname, params, res) {
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ method, pathname, params }))
}

async function get500 (res) {
  res.writeHead(500, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: true }))
}

module.exports = {
  get404,
  get500
}
