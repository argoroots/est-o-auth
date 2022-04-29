const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')
const storage = require('./_storage.js')

async function postEmail (headers, params, res) {
  if (params.response_type !== 'code') {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter response_type must be "code"' }))
    return
  }

  if (!params.redirect_uri) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter redirect_uri is required' }))
    return
  }

  if (!params.email) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter email is required' }))
    return
  }

  const code = await storage.setEmailSession({
    redirect_uri: params.redirect_uri,
    state: params.state,
    email: params.email
  })

  const url = `${process.env.EMAIL_URL}?email=${params.email}&code=${code}`

  const ses = new SESClient({
    accessKeyId: process.env.AWS_SES_ID,
    secretAccessKey: process.env.AWS_SES_KEY,
    region: process.env.AWS_SES_REGION
  })

  await ses.send(new SendEmailCommand({
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [params.email]
    },
    Message: {
      Subject: {
        Data: 'Verification Code'
      },
      Body: {
        Html: {
          Data: `Your verification code is <strong>${code}</strong><br><br>... or just <a href="${url}">open this link</a>.`
        }
      }
    }
  }))

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ emailSent: true }))
}

async function postCode (headers, params, res) {
  if (!params.email) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter email is required' }))
    return
  }

  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter code is required' }))
    return
  }

  const emailSession = await storage.getEmailSession(params.email, params.code)

  if (!emailSession) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid e-mail or code' }))
    return
  }

  const code = await storage.saveUser({
    email: emailSession.email
  })

  const query = { code }

  if (emailSession.state) {
    query.state = emailSession.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ redirect: `${emailSession.redirect_uri}?${queryString}` }))
}

module.exports = {
  postEmail,
  postCode
}
