import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {purgeAtomicCss} from './scripts/purge-css.mjs';

// One app per build (APP=double-pedal). Source lives in <app>/src/; the build is written to <app>/,
// which GitHub Pages serves as is. Each app stays its own PWA: own folder, scope, manifest id and cache prefix.
const app = process.env.APP || 'double-pedal';
const src = resolve(app, 'src');
const pages = readdirSync(src).filter(f => f.endsWith('.html'));

// assets/files.json lists every built file, so a service worker can precache chunks no page names directly
// (Astryx loads parts such as the phone bottom sheet with import(), so they are split off and fetched when needed).
const precacheList = {
  name: 'precache-list',
  enforce: 'post',
  generateBundle(_, bundle) {
    const files = Object.keys(bundle).filter(f => f.startsWith('assets/'));
    this.emitFile({type: 'asset', fileName: 'assets/files.json', source: JSON.stringify(files)});
  },
};

export default defineConfig({
  root: src,
  base: './',
  plugins: [react(), purgeAtomicCss(), precacheList],
  build: {
    outDir: '..', emptyOutDir: false, assetsDir: 'assets', chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: Object.fromEntries(pages.map(p => [p.replace('.html', ''), resolve(src, p)])),
    },
  },
});
