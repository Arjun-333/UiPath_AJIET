const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  console.log('Navigating to http://localhost:8080/app/#hq ...');
  await page.goto('http://localhost:8080/app/#hq', { waitUntil: 'networkidle' });

  // Give canvas 2.5 seconds to settle animations and load sprites
  await page.waitForTimeout(2500);

  const screenshotPath = path.join(screenshotDir, 'floor0.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Also copy to artifact directory for presentation
  const artifactPath = '/home/arjun/.gemini/antigravity/brain/787fc2b5-0969-4294-b652-8a0f2b79644a/floor0.png';
  fs.copyFileSync(screenshotPath, artifactPath);
  console.log(`Copied screenshot to ${artifactPath}`);

  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
