import { chromium } from '../../../frontend/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDefaultCertHtml(item, meta) {
  const name = escapeHtml(item.name);
  const dept = escapeHtml(item.department || '');
  const certId = escapeHtml(item.certId);
  const eventTitle = escapeHtml(meta.eventTitle || 'UiPath Community AJIET Automation Workshop');
  const subtitle = escapeHtml(meta.subtitle || 'Certificate of Participation');
  const issueDate = escapeHtml(meta.issueDate || '');
  const issuerName = escapeHtml(meta.issuerName || 'Arjun');
  const issuerRole = escapeHtml(meta.issuerRole || 'Founder & CEO, UiPath Community AJIET');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 1123px 794px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1123px;
    height: 794px;
    background: #fcfbf7;
    color: #0f172a;
    font-family: 'Ubuntu', Georgia, serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px;
  }
  .frame-outer {
    width: 100%;
    height: 100%;
    border: 6px solid #0f172a;
    padding: 12px;
    position: relative;
    background: radial-gradient(circle at 50% 35%, #ffffff 0%, #f8fafc 75%, #f1f5f9 100%);
  }
  .frame-inner {
    width: 100%;
    height: 100%;
    border: 2px solid #ea580c;
    padding: 48px 64px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
    position: relative;
  }
  .corner {
    position: absolute;
    width: 28px;
    height: 28px;
    border-color: #ea580c;
    border-style: solid;
  }
  .tl { top: 10px; left: 10px; border-width: 4px 0 0 4px; }
  .tr { top: 10px; right: 10px; border-width: 4px 4px 0 0; }
  .bl { bottom: 10px; left: 10px; border-width: 0 0 4px 4px; }
  .br { bottom: 10px; right: 10px; border-width: 0 4px 4px 0; }
  .org {
    font-family: 'Ubuntu', sans-serif;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3.5px;
    text-transform: uppercase;
    color: #ea580c;
  }
  .heading {
    font-size: 46px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #0f172a;
    margin-top: 10px;
    text-transform: uppercase;
  }
  .divider {
    width: 160px;
    height: 3px;
    background: linear-gradient(90deg, transparent, #ea580c, transparent);
    margin: 14px auto 0;
  }
  .present-text {
    font-family: 'Ubuntu', sans-serif;
    font-size: 17px;
    color: #475569;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 22px;
  }
  .recipient {
    font-size: 52px;
    font-weight: 700;
    color: #0f172a;
    margin: 14px auto 6px;
    padding: 0 30px 10px;
    border-bottom: 2px solid #cbd5e1;
    display: inline-block;
    min-width: 480px;
  }
  .dept {
    font-family: 'Ubuntu', sans-serif;
    font-size: 16px;
    color: #64748b;
    margin-top: 4px;
  }
  .body-copy {
    font-family: 'Ubuntu', sans-serif;
    font-size: 19px;
    line-height: 1.6;
    color: #334155;
    max-width: 780px;
    margin: 18px auto 0;
  }
  .event-name {
    font-weight: 700;
    color: #0f172a;
  }
  .footer-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 28px;
    padding-top: 16px;
  }
  .sig-block {
    width: 240px;
    text-align: center;
    font-family: 'Ubuntu', sans-serif;
  }
  .sig-line {
    border-top: 1.5px solid #334155;
    padding-top: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
  .sig-sub {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
  }
  .meta-block {
    font-family: 'Ubuntu Mono', monospace;
    font-size: 13px;
    color: #475569;
    text-align: left;
    line-height: 1.6;
  }
  .seal {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    border: 3px double #ea580c;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Ubuntu', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #ea580c;
    letter-spacing: 1px;
    text-transform: uppercase;
    background: #fff7ed;
  }
</style>
</head>
<body>
  <div class="frame-outer">
    <div class="frame-inner">
      <div class="corner tl"></div>
      <div class="corner tr"></div>
      <div class="corner bl"></div>
      <div class="corner br"></div>
      <div>
        <div class="org">UiPath Community AJIET</div>
        <div class="heading">${subtitle}</div>
        <div class="divider"></div>
      </div>
      <div>
        <div class="present-text">This certificate is proudly presented to</div>
        <div class="recipient">${name}</div>
        ${dept ? `<div class="dept">${dept}</div>` : ''}
        <div class="body-copy">
          for active participation and successful completion of
          <span class="event-name">${eventTitle}</span>,
          organized by UiPath Community AJIET.
        </div>
      </div>
      <div class="footer-row">
        <div class="meta-block">
          <div>Date: <strong>${issueDate}</strong></div>
          <div>Certificate ID: <strong>${certId}</strong></div>
        </div>
        <div class="seal">Verified<br/>AJIET</div>
        <div class="sig-block">
          <div class="sig-line">${issuerName}</div>
          <div class="sig-sub">${issuerRole}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildCustomImageCertHtml(item, meta, templateDataUrl) {
  const name = escapeHtml(item.name);
  const certId = escapeHtml(item.certId);
  const issueDate = escapeHtml(meta.issueDate || '');
  const nameY = Number(meta.nameY ?? 48);
  const nameSize = Number(meta.nameSize ?? 46);
  const textColor = escapeHtml(meta.textColor || '#0f172a');
  const showMeta = meta.showMeta !== false;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 1123px 794px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1123px;
    height: 794px;
    position: relative;
    overflow: hidden;
    font-family: 'Ubuntu', Georgia, serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .name-overlay {
    position: absolute;
    left: 60px;
    right: 60px;
    top: ${nameY}%;
    transform: translateY(-50%);
    text-align: center;
    font-size: ${nameSize}px;
    font-weight: 700;
    color: ${textColor};
  }
  .meta-overlay {
    position: absolute;
    left: 64px;
    bottom: 32px;
    font-family: 'Ubuntu Mono', monospace;
    font-size: 13px;
    color: ${textColor};
    opacity: 0.85;
  }
</style>
</head>
<body>
  <img class="bg" src="${templateDataUrl}" />
  <div class="name-overlay">${name}</div>
  ${showMeta ? `<div class="meta-overlay">ID: ${certId}${issueDate ? ` • ${issueDate}` : ''}</div>` : ''}
</body>
</html>`;
}

async function main() {
  const cfgPath = process.argv[2];
  if (!cfgPath || !fs.existsSync(cfgPath)) {
    console.error('Usage: node chrome_cert_renderer.mjs <config.json>');
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const { items = [], meta = {}, templatePath = null } = payload;

  let templateDataUrl = null;
  if (templatePath && fs.existsSync(templatePath)) {
    const ext = path.extname(templatePath).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const b64 = fs.readFileSync(templatePath).toString('base64');
    templateDataUrl = `data:${mime};base64,${b64}`;
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });

  for (const item of items) {
    const html = templateDataUrl
      ? buildCustomImageCertHtml(item, meta, templateDataUrl)
      : buildDefaultCertHtml(item, meta);
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: item.outputPath,
      width: '1123px',
      height: '794px',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
  }

  await browser.close();
}

await main();
