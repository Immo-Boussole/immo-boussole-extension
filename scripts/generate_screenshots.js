import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

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

async function run() {
  const executablePath = getExecutablePath();
  console.log(`Launching browser using: ${executablePath || 'default'}...`);
  
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
    const fullHtmlPath = 'file:///' + resolve(rootDir, target.html).replace(/\\/g, '/');
    const fullOutPath = resolve(rootDir, target.out);
    console.log(`Rendering ${target.html} (${target.width}x${target.height}) -> ${target.out}...`);
    await page.setViewport({ width: target.width, height: target.height, deviceScaleFactor: 1 });
    await page.goto(fullHtmlPath, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: fullOutPath, clip: { x: 0, y: 0, width: target.width, height: target.height } });
    console.log(`✓ Generated: ${target.out}`);
  }

  await browser.close();
  console.log('All screenshots and promo assets generated successfully!');
}

run().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
