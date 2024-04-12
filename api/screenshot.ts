
const chrome = require('@sparticuz/chromium')
const puppeteer = require('puppeteer-core')

// const getAbsoluteURL = (hash: string, path?: string) => {
//   if (!process.env.NODE_ENV) {
//     return `http://localhost:3000/${hash}`
//   }

//   return `https://image.w.kodadot.xyz/ipfs/${path}/${hash}`
// }

// type ScreenshotRequest = {
// 	url: string
// 	settings?: Settings
// }

// export type Settings = {
// 	delay?: number;
// 	width?: number;
// 	height?: number;
// }


const performCanvasCapture = async (page: any, canvasSelector: string) => {
  try {
    // get the base64 image from the CANVAS targetted
    const base64 = await page.$eval(canvasSelector, el => {
      if (!el || el.tagName !== "CANVAS") return null
      return 'found'

    })
    if (!base64) throw new Error("No canvas found")
    console.log("Screenshotting...")
    const screenshot = await page.screenshot({ encoding: "base64", type: "jpeg" });
    console.log("Done screenshotting")
    const dataURL = `data:image/png;base64,${screenshot}`;
    console.log({dataURL})

    return dataURL
    // return Buffer.from(pureBase64, "base64")
  } catch (err) {
    return null
  }
}

export default async (req: any, res: any) => {
  let {
    // query: { hash, path, resolution },
    body,
    method
  } = req

 console.log({body})
  if (method !== 'POST') {
    // CORS https://vercel.com/guides/how-to-enable-cors
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    return res.status(200).end()
  }

  if (!body) return res.status(400).end(`No body provided`)

  if (typeof body == 'string') {
    try {
      body = JSON.parse(body)
      console.log("Parsed body", body)
    } catch (error) {
      return res.status(400).end("Invalid body")
    }
  }

  if (typeof body === 'object' && !body.url) return res.status(400).end(`No url provided`)

  const isProd = process.env.NODE_ENV === 'production'

  let browser

  if (isProd) {
    browser = await puppeteer.launch({
      args: chrome.args,
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath(),
      headless: 'new',
      ignoreHTTPSErrors: true
    })
  } else {
    console.log("Launching browser")
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    });
  }

  const page = await browser.newPage()

  await page.setViewport({ width: 600, height: 600 })

  // const url = getAbsoluteURL(`?hash=${hash}`, path)

  const url = body.url

  console.log('url', url)


  await page.goto(url);

  const selector = 'canvas';

  const canvas = await page.waitForSelector(selector);


  const element = await performCanvasCapture(page, selector) // const element = page.$(selector)


  // const data = await page.screenshot({
  //   type: 'png'
  // })

  const data = element

  await browser.close()
  // Set the s-maxage property which caches the images then on the Vercel edge
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate')
  res.setHeader('Content-Type', 'image/png')
  // CORS
  // res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  res.end(data)
}
