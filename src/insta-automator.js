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

let browser;
async function login() {
  if (browser)
    return
  await loginHeadless();
  await gatherXIGAppId();
}

process.on('uncaughtException', e => console.log(e))

async function loginWithUI() {
  try {
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
  } catch (e) {
    console.error(e)
  }
}

let loggedIn = false;
let xIGAppId = '';

async function loginHeadless() {
  try {
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
  } catch (e) {
    console.error(e)
  }
}

async function gatherXIGAppId() {
  log('gatherXIGAppId...');
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', request => {
    const request_headers = request.headers();
    log('request_headers', request_headers)
    if (request_headers['x-ig-app-id']) {
      xIGAppId = request_headers['x-ig-app-id'];
      log('Found: x-ig-app-id', request_headers['x-ig-app-id']);
    }
    request.continue();
  });
  const theRockProfile = 'https://www.instagram.com/therock/'
  await page.goto(theRockProfile, {waitUntil: 'networkidle0'});
}

async function proxy(url) {
  try {
    if (!loggedIn)
      return "Not logged in";

    log('proxy to', url);
    const page = await browser.newPage();
    if (xIGAppId) {
      page.setExtraHTTPHeaders({ 'x-ig-app-id': xIGAppId })
    }
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
  proxy,
  gatherXIGAppId
}
