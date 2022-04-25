const aws = require('aws-sdk')

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

  const code = '12345678'
  const url = `${process.env.EMAIL_URL}?code=${code}`

  const ses = new aws.SES({
    accessKeyId: process.env.AWS_SES_ID,
    secretAccessKey: process.env.AWS_SES_KEY,
    region: process.env.AWS_SES_REGION
  })

  await ses.sendEmail({
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
          Data: `Your verification code is <strong>${code}</strong>.<br><br>... or just open url <a href="${url}">${url}</a>.`
        }
      }
    }
  }).promise()
}

module.exports = {
  postEmail
}
