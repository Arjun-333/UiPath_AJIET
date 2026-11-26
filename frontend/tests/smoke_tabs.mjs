import { chromium } from 'playwright';

const BASE_URL = process.env.AUTONOMIA_URL || 'http://localhost:8080/app/';
const TABS = ['hq', 'command', 'vault', 'qa', 'workforce'];

const run = async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.status() >= 400) {
      errors.push(`HTTP ${res.status()}: ${res.url()}`);
    }
  });

  for (const tab of TABS) {
    await page.goto(`${BASE_URL}#${tab}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(400);
    const bodyText = await page.locator('body').innerText();
    if (!bodyText || bodyText.trim().length < 20) {
      throw new Error(`Tab #${tab} rendered empty body`);
    }
    console.log(`PASS #${tab}`);
  }

  await browser.close();

  if (errors.length > 0) {
    throw new Error(`Console/page errors detected:\n${errors.join('\n')}`);
  }
  console.log('All 5 tabs passed smoke test with 0 errors.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
