import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';

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
          copyFileSync(resolve(__dirname, 'src/manifest.json'), resolve(outDir, 'manifest.json'));
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
