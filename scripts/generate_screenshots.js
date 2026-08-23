import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const assetsDir = resolve(rootDir, 'assets');

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir, { recursive: true });
}

function getExecutablePath() {
  const paths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\tools\\chrome-win64\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

function getIconBase64(name) {
  const iconPath = resolve(rootDir, 'src/icons', name);
  if (existsSync(iconPath)) {
    return 'data:image/png;base64,' + readFileSync(iconPath).toString('base64');
  }
  return '';
}

async function run() {
  const executablePath = getExecutablePath();
  console.log(`Launching browser using: ${executablePath || 'default'}...`);

  // Load official icons as base64 data URIs
  const icon16 = getIconBase64('icon16.png');
  const icon32 = getIconBase64('icon32.png');
  const icon48 = getIconBase64('icon48.png');
  const icon128 = getIconBase64('icon128.png');
  const icon200 = getIconBase64('icon200.png');

  console.log('Loaded official icons: icon16, icon32, icon48, icon128, icon200');

  const browser = await puppeteer.launch({
    executablePath,
    headless: true
  });

  const page = await browser.newPage();

  const targets = [
    // Standard Screenshots (1280x800)
    { html: 'scripts/mockups/showcase.html', out: 'assets/screenshot-1-showcase.png', width: 1280, height: 800 },
    { html: 'scripts/mockups/popup_detail.html', out: 'assets/screenshot-2-popup.png', width: 1280, height: 800 },
    { html: 'scripts/mockups/showcase_fr.html', out: 'assets/screenshot-1-showcase-fr.png', width: 1280, height: 800 },
    { html: 'scripts/mockups/popup_detail_fr.html', out: 'assets/screenshot-2-popup-fr.png', width: 1280, height: 800 },

    // Promo Tiles (440x280)
    { html: 'scripts/mockups/promo_small.html', out: 'assets/promo-small-440x280.png', width: 440, height: 280 },
    { html: 'scripts/mockups/promo_small_fr.html', out: 'assets/promo-small-440x280-fr.png', width: 440, height: 280 },

    // Marquee Promo Banners (1400x560)
    { html: 'scripts/mockups/promo_marquee.html', out: 'assets/promo-marquee-1400x560.png', width: 1400, height: 560 },
    { html: 'scripts/mockups/promo_marquee_fr.html', out: 'assets/promo-marquee-1400x560-fr.png', width: 1400, height: 560 }
  ];

  for (const target of targets) {
    const rawHtml = readFileSync(resolve(rootDir, target.html), 'utf-8');
    const processedHtml = rawHtml
      .replace(/__ICON_16__/g, icon16)
      .replace(/__ICON_32__/g, icon32)
      .replace(/__ICON_48__/g, icon48)
      .replace(/__ICON_128__/g, icon128)
      .replace(/__ICON_200__/g, icon200);

    const fullOutPath = resolve(rootDir, target.out);
    console.log(`Rendering ${target.html} (${target.width}x${target.height}) with Base64 HD Logos -> ${target.out}...`);
    
    await page.setViewport({ width: target.width, height: target.height, deviceScaleFactor: 1 });
    await page.setContent(processedHtml, { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: fullOutPath, clip: { x: 0, y: 0, width: target.width, height: target.height } });
    console.log(`✓ Generated: ${target.out}`);
  }

  await browser.close();
  console.log('All 8 screenshots and promo assets generated successfully with HD official logo!');
}

run().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
