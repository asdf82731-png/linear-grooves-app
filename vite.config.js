import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, relative, join} from 'node:path';
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

// <app>/sw.js is generated from shared/src/sw-template.js: it precaches the pages, everything in public/ and every
// built file, and its cache version is a hash of all of them, so a changed app always installs as a new version.
const CACHE_PREFIX = {'linear-grooves': 'grooves-', 'double-pedal': 'dp-', djent: 'dj-', timekeeper: 'tk-', metronome: 'pro-metronome-'};
function walk(dir) {
  return readdirSync(dir).flatMap(f => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]);
}
const serviceWorker = {
  name: 'service-worker',
  enforce: 'post',
  generateBundle(_, bundle) {
    const pub = resolve(src, 'public');
    const publicFiles = walk(pub).map(f => relative(pub, f).split('\\').join('/')).filter(f => f !== 'sw.js');
    const built = Object.keys(bundle);
    const hash = createHash('sha256');
    for (const f of built.sort()) {
      const b = bundle[f];
      hash.update(f).update(b.type === 'chunk' ? b.code : b.source);
    }
    for (const f of publicFiles.sort()) hash.update(f).update(readFileSync(join(pub, f)));
    hash.update(readFileSync(resolve('shared/src/sw-template.js')));
    const files = ['./', ...built.filter(f => f !== 'assets/files.json'), ...publicFiles];
    const source = readFileSync(resolve('shared/src/sw-template.js'), 'utf8')
      .replace('__PREFIX__', JSON.stringify(CACHE_PREFIX[app] || app + '-'))
      .replace('__HASH__', JSON.stringify(hash.digest('hex').slice(0, 10)))
      .replace('__FILES__', JSON.stringify(files));
    this.emitFile({type: 'asset', fileName: 'sw.js', source});
  },
};

export default defineConfig({
  root: src,
  base: './',
  plugins: [react(), purgeAtomicCss(), precacheList, serviceWorker],
  build: {
    outDir: '..', emptyOutDir: false, assetsDir: 'assets', chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: Object.fromEntries(pages.map(p => [p.replace('.html', ''), resolve(src, p)])),
    },
  },
});
