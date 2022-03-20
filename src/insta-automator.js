const puppeteer = require('puppeteer');

function log() {
  if (process.env.ENABLE_LOG) {
    console.log(...arguments)
  }
}

if (process.env.NODE_ENV !== 'production') {
  log('Not in production mode. Using .env file!')
  require('dotenv').config()
}

const cred = {
  username: process.env.INSTAGRAM_USERNAME,
  password: process.env.INSTAGRAM_PASSWORD
}

log('Using', process.env.INSTAGRAM_USERNAME, 'as authenticated user.');

const makeClick = (page) => {
  return async (sel, shouldThrow = true) => {
    try {
      return await page.click(sel)
    } catch (e) {
      log('click exception: ', e.message)
      if (shouldThrow)
        throw e
    }
  }
}

const selector = {
  login: {
    url: "https://www.instagram.com/accounts/login/",
    username: "input[name=\"username\"]",
    password: "input[name=\"password\"]",
    loginBtn: "button[type=\"submit\"]",
  },
}

let browser
async function login() {
  if (browser)
    return
  await loginHeadless()
}

async function loginWithUI() {
  browser = await puppeteer.launch({
    headless: false,
    args: [
      '--no-sandbox',
    ]
  })
  const page = await browser.newPage()
  await page.goto(selector.login.url, {
    waitUntil: 'networkidle0',
  });

  const click = makeClick(page)
  await click(selector.login.username)
  await page.keyboard.type(cred.username)
  await click(selector.login.password)
  await page.keyboard.type(cred.password)
  await click(selector.login.loginBtn)
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
}

let loggedIn = false;

async function loginHeadless() {
  log('LoginHeadless...')
  browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
    ]
  })
  const page = await browser.newPage()
  await page.goto(selector.login.url, {
    waitUntil: 'networkidle0',
  });
  const click = makeClick(page)
  log('Selecting username input...')
  await click(selector.login.username)
  await page.keyboard.type(cred.username)
  log('Selecting password input...')
  await click(selector.login.password)
  await page.keyboard.type(cred.password)
  log('Click login button...')
  await click(selector.login.loginBtn)
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
  // TODO: ensure that login is not error!
  log('Logged in...')
  loggedIn = true;
}

async function proxy(url) {
  try {
    if (!loggedIn)
      return "Not logged in";

    log('proxy to', url);
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'networkidle0', })
    const responseBody = await response.text();
    await page.close();
    log('responseBody', responseBody);
    return responseBody;
  } catch (e) {
    console.error(e)
    return "";
  }
}

module.exports = {
  login,
  proxy
}
