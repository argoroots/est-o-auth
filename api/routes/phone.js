const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')
const storage = require('./_storage.js')

async function postPhone (headers, params, res) {
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

  if (!params.phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter phone is required' }))
    return
  }

  const code = await storage.setPhoneSession({
    redirect_uri: params.redirect_uri,
    state: params.state,
    phone: params.phone
  })

  const url = `${process.env.EMAIL_URL}?email=${params.email}&code=${code}`

  const sns = new SNSClient({
    region: process.env.AWS_SES_REGION,
    credentials: {
      accessKeyId: process.env.AWS_SES_ID,
      secretAccessKey: process.env.AWS_SES_KEY
    }
  })

  await sns.send(new PublishCommand({
    PhoneNumber: params.phone,
    Message: `Your verification code is ${code}`
  }))

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ smsSent: true }))
}

async function postCode (headers, params, res) {
  if (!params.phone) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter phone is required' }))
    return
  }

  if (!params.code) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Parameter code is required' }))
    return
  }

  const phoneSession = await storage.getPhoneSession(params.phone, params.code)

  if (!phoneSession) {
    res.writeHead(403, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid phone or code' }))
    return
  }

  const code = await storage.saveUser({
    phone: phoneSession.phone
  })

  const query = { code }

  if (phoneSession.state) {
    query.state = phoneSession.state
  }

  const queryString = Object.keys(query).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`).join('&')

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ redirect: `${phoneSession.redirect_uri}?${queryString}` }))
}

module.exports = {
  postPhone,
  postCode
}
