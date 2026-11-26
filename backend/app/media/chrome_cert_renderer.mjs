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

function loadDataUrl(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'svg' ? 'image/svg+xml' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png');
  const b64 = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${b64}`;
}

function buildDefaultCertHtml(item, meta, logos) {
  const name = escapeHtml(item.name);
  const dept = escapeHtml(item.department || '');
  const eventTitle = escapeHtml(meta.eventTitle || 'Discovering UiPath & RPA');
  const rawSubtitle = String(meta.subtitle || 'Certificate of Participation').trim();
  const words = rawSubtitle.split(/\s+/);
  const lastWord = words.length > 1 ? escapeHtml(words.pop()) : '';
  const leadWords = escapeHtml(words.join(' '));
  const issueDate = escapeHtml(meta.issueDate || 'November 28, 2026');
  const issuerName = escapeHtml(meta.issuerName || 'Arjun R');
  const issuerRole = escapeHtml(meta.issuerRole || 'UiPath Student Developer Champion (SDC) AJIET');

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
    background-color: #ffffff;
    background-image:
      linear-gradient(to right, #e6f0f5 1px, transparent 1px),
      linear-gradient(to bottom, #e6f0f5 1px, transparent 1px);
    background-size: 46px 46px;
    color: #0b0f19;
    font-family: 'Ubuntu', 'Inter', system-ui, -apple-system, sans-serif;
    position: relative;
    overflow: hidden;
    padding: 40px 44px 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  /* Geometric L-shaped pixel block accents inspired by UiPath Community poster */
  .px-block {
    position: absolute;
    pointer-events: none;
    z-index: 0;
  }
  /* Top-right light sky L-block */
  .px-tr-1 { top: 138px; right: 46px; width: 46px; height: 92px; background: #cbe8f3; }
  .px-tr-2 { top: 184px; right: 92px; width: 46px; height: 46px; background: #cbe8f3; }
  /* Mid-right teal L-block */
  .px-mr-1 { top: 368px; right: 46px; width: 92px; height: 46px; background: #0098aa; }
  .px-mr-2 { top: 414px; right: 46px; width: 46px; height: 46px; background: #0098aa; }
  .px-mr-3 { top: 322px; right: 92px; width: 46px; height: 46px; background: #9bd6e8; }
  .px-mr-4 { top: 414px; right: 92px; width: 46px; height: 46px; background: #d6eef6; }
  /* Bottom-left deep navy-teal L-block (sits cleanly above footer) */
  .px-bl-1 { bottom: 184px; left: 46px; width: 92px; height: 46px; background: #145e80; }
  .px-bl-2 { bottom: 138px; left: 46px; width: 46px; height: 46px; background: #145e80; }

  .content-layer {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 12px;
    border-bottom: 1.5px solid #e2edf3;
  }
  .logo-uipath-community {
    height: 42px;
    width: auto;
    object-fit: contain;
  }
  .logo-ieee-cs {
    height: 68px;
    width: auto;
    object-fit: contain;
  }
  .logo-ajiet {
    height: 84px;
    width: auto;
    object-fit: contain;
  }
  .logo-enigma {
    height: 84px;
    width: auto;
    object-fit: contain;
  }
  .logo-community-white {
    height: 84px;
    width: 84px;
    object-fit: contain;
    border-radius: 50%;
  }
  .logo-student-dev {
    height: 82px;
    width: auto;
    object-fit: contain;
  }
  .center-stage {
    text-align: center;
    padding: 0 56px;
    margin-top: -10px;
  }
  .heading {
    font-size: 46px;
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1.08;
    text-transform: uppercase;
    color: #0b0f19;
  }
  .heading-accent {
    color: #fa4616;
  }
  .accent-pill {
    display: inline-block;
    margin-top: 14px;
    padding: 6px 20px;
    background: #0b0f19;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 1.2px;
    text-transform: uppercase;
  }
  .recipient {
    font-size: 52px;
    font-weight: 800;
    color: #0b0f19;
    margin: 22px auto 6px;
    padding: 0 36px 8px;
    border-bottom: 3px solid #fa4616;
    display: inline-block;
    min-width: 500px;
  }
  .dept {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.8px;
    color: #1e293b;
    margin-top: 8px;
  }
  .body-copy {
    font-size: 19px;
    line-height: 1.55;
    color: #1e293b;
    max-width: 760px;
    margin: 18px auto 0;
  }
  .event-name {
    font-weight: 700;
    color: #0b0f19;
  }
  .footer-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 10px 12px 0;
    border-top: 1.5px solid #cbd5e1;
  }
  .meta-block {
    width: 150px;
    font-size: 14px;
    color: #1e293b;
    text-align: left;
    padding-top: 52px;
  }
  .meta-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    margin-bottom: 2px;
  }
  .meta-value {
    font-size: 14px;
    font-weight: 700;
    color: #0b0f19;
  }
  .sig-block {
    width: 265px;
    text-align: center;
  }
  .sig-block-advisor {
    width: 255px;
    text-align: center;
  }
  .sig-block-hod {
    width: 200px;
    text-align: center;
  }
  .sig-img-slot {
    height: 66px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .sig-img {
    height: 66px;
    width: auto;
    object-fit: contain;
    margin-bottom: -4px;
  }
  .sig-img-advisor {
    height: 54px;
    width: auto;
    object-fit: contain;
    margin-bottom: 2px;
  }
  .sig-line {
    border-top: 2px solid #0b0f19;
    padding-top: 7px;
    font-size: 15px;
    font-weight: 700;
    color: #0b0f19;
  }
  .sig-sub {
    font-size: 11px;
    font-weight: 500;
    color: #475569;
    margin-top: 2px;
  }
</style>
</head>
<body>
  <div class="px-block px-tr-1"></div>
  <div class="px-block px-tr-2"></div>
  <div class="px-block px-mr-1"></div>
  <div class="px-block px-mr-2"></div>
  <div class="px-block px-mr-3"></div>
  <div class="px-block px-mr-4"></div>
  <div class="px-block px-bl-1"></div>
  <div class="px-block px-bl-2"></div>

  <div class="content-layer">
    <div class="top-bar">
      ${logos.uipathCommunity ? `<img class="logo-uipath-community" src="${logos.uipathCommunity}" alt="UiPath Community" />` : ''}
      ${logos.ieeeCs ? `<img class="logo-ieee-cs" src="${logos.ieeeCs}" alt="IEEE Computer Society" />` : ''}
      ${logos.ajiet ? `<img class="logo-ajiet" src="${logos.ajiet}" alt="AJIET" />` : ''}
      ${logos.enigmaBranch ? `<img class="logo-enigma" src="${logos.enigmaBranch}" alt="ENIGMA Branch" />` : ''}
      ${logos.communityWhite ? `<img class="logo-community-white" src="${logos.communityWhite}" alt="UiPath Community AJIET" />` : ''}
      ${logos.studentDev ? `<img class="logo-student-dev" src="${logos.studentDev}" alt="UiPath Student Developer" />` : ''}
    </div>

    <div class="center-stage">
      <div class="heading">
        ${leadWords} ${lastWord ? `<span class="heading-accent">${lastWord}</span>` : ''}
      </div>
      <div class="accent-pill">Proudly Presented To</div>
      <div>
        <div class="recipient">${name}</div>
      </div>
      ${dept ? `<div class="dept">${dept}</div>` : ''}
      <div class="body-copy">
        for active participation and successful completion of
        <span class="event-name">${eventTitle}</span>,
        organized by UiPath Community AJIET.
      </div>
    </div>

    <div class="footer-row">
      <div class="meta-block">
        <div class="meta-label">Date Issued</div>
        <div class="meta-value">${issueDate}</div>
      </div>
      <div class="sig-block">
        <div class="sig-img-slot">
          ${logos.signature ? `<img class="sig-img" src="${logos.signature}" alt="Signature" />` : ''}
        </div>
        <div class="sig-line">${issuerName}</div>
        <div class="sig-sub">${issuerRole}</div>
      </div>
      <div class="sig-block-advisor">
        <div class="sig-img-slot">
          ${logos.kanmaniSignature ? `<img class="sig-img-advisor" src="${logos.kanmaniSignature}" alt="Kanmani Signature" />` : ''}
        </div>
        <div class="sig-line">Kanmani</div>
        <div class="sig-sub">Faculty Advisor, IEEE Computer Society<br />Student Branch Chapter</div>
      </div>
      <div class="sig-block-hod">
        <div class="sig-img-slot"></div>
        <div class="sig-line">Dr. Antony P J</div>
        <div class="sig-sub">Vice Principal &amp; HOD</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildCustomImageCertHtml(item, meta, templateDataUrl) {
  const name = escapeHtml(item.name);
  const certId = escapeHtml(item.certId);
  const issueDate = escapeHtml(meta.issueDate || 'November 28, 2026');
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

  const brandingDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../../frontend/public/assets/branding');
  const logos = {
    ajiet: loadDataUrl(path.join(brandingDir, 'ajiet_logo.png')),
    enigmaBranch: loadDataUrl(path.join(brandingDir, 'enigma_branch_logo.png')),
    ieeeCs: loadDataUrl(path.join(brandingDir, 'ieee_computer_society.png')),
    communityWhite: loadDataUrl(path.join(brandingDir, 'uipath_community_ajiet_white.png')),
    uipathCommunity: loadDataUrl(path.join(brandingDir, 'uipath_community_lockup.png')),
    studentDev: loadDataUrl(path.join(brandingDir, 'uipath_student_developer.png')),
    signature: loadDataUrl(path.join(brandingDir, 'arjun_signature.png')),
    kanmaniSignature: loadDataUrl(path.join(brandingDir, 'kanmani_signature.png'))
  };

  let templateDataUrl = loadDataUrl(templatePath);

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });

  for (const item of items) {
    const html = templateDataUrl
      ? buildCustomImageCertHtml(item, meta, templateDataUrl)
      : buildDefaultCertHtml(item, meta, logos);
    await page.setContent(html, { waitUntil: 'load' });
    if (item.previewPngPath) {
      await page.screenshot({ path: item.previewPngPath, fullPage: false });
    }
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
