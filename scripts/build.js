import { build } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const target = process.argv[2] || 'chrome';
const outDir = resolve(rootDir, target === 'firefox' ? 'dist-firefox' : 'dist-chrome');

console.log(`Building extension for target: ${target} -> ${outDir}`);

// Clean outDir
if (existsSync(outDir)) {
  rmSync(outDir, { recursive: true, force: true });
}
mkdirSync(outDir, { recursive: true });

async function buildAll() {
  // 1. Build Popup (HTML)
  console.log('Building Popup UI...');
  await build({
    root: rootDir,
    configFile: false,
    build: {
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          popup: resolve(rootDir, 'src/popup/popup.html')
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  });

  // 2. Build Content Script (IIFE - single self-contained script)
  console.log('Building Content Script (IIFE)...');
  await build({
    root: rootDir,
    configFile: false,
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'ImmoBoussoleContent',
        fileName: () => 'content.js'
      }
    }
  });

  // 3. Build Background Service Worker (IIFE - single self-contained script)
  console.log('Building Background Service Worker (IIFE)...');
  await build({
    root: rootDir,
    configFile: false,
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: resolve(rootDir, 'src/background/serviceWorker.ts'),
        formats: ['iife'],
        name: 'ImmoBoussoleBackground',
        fileName: () => 'background.js'
      }
    }
  });

  // 4. Copy and adjust manifest.json
  console.log('Generating manifest.json...');
  const manifestRaw = readFileSync(resolve(rootDir, 'src/manifest.json'), 'utf-8');
  const manifest = JSON.parse(manifestRaw);

  if (target === 'chrome') {
    manifest.background = {
      service_worker: 'background.js'
    };
    delete manifest.browser_specific_settings;
  } else if (target === 'firefox') {
    manifest.background = {
      scripts: ['background.js']
    };
  }

  writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 5. Copy styles, _locales, and icons
  console.log('Copying assets, _locales, and icons...');
  if (existsSync(resolve(rootDir, 'src/content/content.css'))) {
    copyFileSync(resolve(rootDir, 'src/content/content.css'), resolve(outDir, 'content.css'));
  }
  const localesDir = resolve(rootDir, '_locales');
  if (existsSync(localesDir)) {
    cpSync(localesDir, resolve(outDir, '_locales'), { recursive: true });
  }
  const iconsDir = resolve(rootDir, 'public/icons');
  if (existsSync(iconsDir)) {
    cpSync(iconsDir, resolve(outDir, 'icons'), { recursive: true });
  }

  console.log(`Build for ${target} completed successfully in ${outDir}!`);
}

buildAll().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
