const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const InstaAutomator = require('./insta-automator')

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

InstaAutomator.login()
app.get('/v1', async (req, res) => res.send(await InstaAutomator.proxy(req.query.url)))

const port = process.env.PORT || 8084
app.listen(port, () => console.log(`App start at port: ${port}`))
