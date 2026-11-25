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

  await page.waitForTimeout(1500);

  // Click on Floor 2 button in the floor switcher
  console.log('Switching to Floor 2...');
  await page.waitForSelector('button[title*="Floor 2"]', { timeout: 10000 });
  await page.click('button[title*="Floor 2"]');

  // Wait 2.5s for Floor 2 sprites, animations, and diorama to settle
  await page.waitForTimeout(2500);

  const screenshotPath = path.join(screenshotDir, 'floor2.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved screenshot to ${screenshotPath}`);

  const artifactPath = '/home/arjun/.gemini/antigravity/brain/787fc2b5-0969-4294-b652-8a0f2b79644a/floor2.png';
  fs.copyFileSync(screenshotPath, artifactPath);
  console.log(`Copied screenshot to ${artifactPath}`);

  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
