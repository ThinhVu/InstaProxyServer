const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const InstaAutomator = require('./insta-automator')

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

InstaAutomator.login()
app.get('/v1', async (req, res) => res.send(await InstaAutomator.proxy(req.query.url)))
app.get('/xigappid', async (req, res) => res.send(await InstaAutomator.gatherXIGAppId()))
app.get('/', async (req, res) => {
  res.send(`/v1/url?={instagram_api} to get json data. \r\n /xigappid to re-evaluate x-ig-app-id if the bootstrapped value is outdated in some cases.`)
})
const port = process.env.PORT || 8084
app.listen(port, () => console.log(`App start at port: ${port}`))
