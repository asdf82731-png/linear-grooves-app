import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readdirSync} from 'node:fs';
import {resolve} from 'node:path';

// One app per build (APP=double-pedal). Source lives in <app>/src/; the build is written to <app>/,
// which GitHub Pages serves as is. Each app stays its own PWA: own folder, scope, manifest id and cache prefix.
const app = process.env.APP || 'double-pedal';
const src = resolve(app, 'src');
const pages = readdirSync(src).filter(f => f.endsWith('.html'));

export default defineConfig({
  root: src,
  base: './',
  plugins: [react()],
  build: {
    outDir: '..', emptyOutDir: false, assetsDir: 'assets', chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: Object.fromEntries(pages.map(p => [p.replace('.html', ''), resolve(src, p)])),
      // a single page bundles into one JS file, so the service worker can precache everything index.html names
      output: pages.length === 1 ? {inlineDynamicImports: true} : {},
    },
  },
});
