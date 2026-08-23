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
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();

  // 1. Screenshot 1: Showcase
  const showcasePath = 'file:///' + resolve(rootDir, 'scripts/mockups/showcase.html').replace(/\\/g, '/');
  console.log(`Navigating to ${showcasePath}...`);
  await page.goto(showcasePath, { waitUntil: 'networkidle0' });
  const out1 = resolve(assetsDir, 'screenshot-1-showcase.png');
  await page.screenshot({ path: out1, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log(`Generated: ${out1}`);

  // 2. Screenshot 2: Popup Detail
  const popupPath = 'file:///' + resolve(rootDir, 'scripts/mockups/popup_detail.html').replace(/\\/g, '/');
  console.log(`Navigating to ${popupPath}...`);
  await page.goto(popupPath, { waitUntil: 'networkidle0' });
  const out2 = resolve(assetsDir, 'screenshot-2-popup.png');
  await page.screenshot({ path: out2, clip: { x: 0, y: 0, width: 1280, height: 800 } });
  console.log(`Generated: ${out2}`);

  await browser.close();
  console.log('Screenshots generation completed successfully!');
}

run().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
