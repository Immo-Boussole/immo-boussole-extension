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

  // Dynamic version injection from ENV / CI / package.json
  let version = process.env.EXTENSION_VERSION;
  if (!version && process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME) {
    version = process.env.GITHUB_REF_NAME.replace(/^v/, '');
  } else if (!version && process.env.GITHUB_RUN_NUMBER) {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
    const baseVer = pkg.version ? pkg.version.split('.').slice(0, 2).join('.') : '1.0';
    version = `${baseVer}.${process.env.GITHUB_RUN_NUMBER}`;
  } else if (!version) {
    const pkg = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf-8'));
    version = pkg.version || '1.0.0';
  }

  // Format valid manifest version (integers separated by dots)
  version = version.replace(/[^0-9.]/g, '') || '1.0.0';
  manifest.version = version;
  console.log(`Injecting extension version: ${version}`);

  if (target === 'chrome') {
    manifest.background = {
      service_worker: 'background.js'
    };
    delete manifest.browser_specific_settings;
  } else if (target === 'firefox') {
    manifest.background = {
      scripts: ['background.js']
    };
    delete manifest.side_panel;
    if (Array.isArray(manifest.permissions)) {
      manifest.permissions = manifest.permissions.filter((p) => p !== 'sidePanel');
    }
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

  console.log(`Build for ${target} completed successfully with version ${version} in ${outDir}!`);
}

buildAll().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
