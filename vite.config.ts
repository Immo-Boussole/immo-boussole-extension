import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: mode === 'chrome' ? 'dist-chrome' : mode === 'firefox' ? 'dist-firefox' : 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/popup.html'),
          background: resolve(__dirname, 'src/background/serviceWorker.ts'),
          content: resolve(__dirname, 'src/content/index.ts')
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background') return 'background.js';
            if (chunkInfo.name === 'content') return 'content.js';
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    plugins: [
      {
        name: 'copy-manifest-and-assets',
        writeBundle(options) {
          const outDir = options.dir || 'dist';
          if (!existsSync(outDir)) {
            mkdirSync(outDir, { recursive: true });
          }

          // Process manifest.json according to browser target
          const manifestRaw = readFileSync(resolve(__dirname, 'src/manifest.json'), 'utf-8');
          const manifest = JSON.parse(manifestRaw);

          if (mode === 'chrome') {
            // Chrome and Edge (Chromium MV3) require service_worker
            manifest.background = {
              service_worker: 'background.js',
              type: 'module'
            };
            // Remove Firefox-specific gecko settings
            delete manifest.browser_specific_settings;
          } else if (mode === 'firefox') {
            // Firefox MV3 uses scripts
            manifest.background = {
              scripts: ['background.js'],
              type: 'module'
            };
          }

          writeFileSync(resolve(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

          if (existsSync(resolve(__dirname, 'src/content/content.css'))) {
            copyFileSync(resolve(__dirname, 'src/content/content.css'), resolve(outDir, 'content.css'));
          }
          const localesDir = resolve(__dirname, '_locales');
          if (existsSync(localesDir)) {
            cpSync(localesDir, resolve(outDir, '_locales'), { recursive: true });
          }
          const iconsDir = resolve(__dirname, 'public/icons');
          if (existsSync(iconsDir)) {
            cpSync(iconsDir, resolve(outDir, 'icons'), { recursive: true });
          }
        }
      }
    ]
  };
});
