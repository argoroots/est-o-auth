const express = require('express')

const APP_VERSION = process.env.VERSION || require('../package').version
const APP_STARTED = new Date().toISOString()
const APP_PORT = process.env.PORT || 3000

// start express app
const app = express()

// Hide Powered By
app.disable('x-powered-by')

// get correct client IP behind nginx
app.set('trust proxy', true)

app.get('/', (req, res) => {
  res.send({
    result: true,
    version: APP_VERSION,
    started: APP_STARTED
  })
})

// start server
app.listen(APP_PORT, function () {
  console.log(new Date().toString() + ' started listening port ' + APP_PORT)
})
