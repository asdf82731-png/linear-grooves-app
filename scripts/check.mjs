// Automatic check of the built apps on the screens they are used on: phone and the TCL NXTPAPER 11 tablet, portrait
// and landscape. For every page it checks that
//   - it opens without errors,
//   - the play button is fully on screen without scrolling,
//   - the tempo number shows all three digits (it is set to the highest tempo for this),
//   - the page does not scroll sideways,
//   - after one visit the app opens offline with its font (generated service worker),
//   - a Linear Grooves share link opens the same groove,
//   - Time Keeper counts hits from an electronic drum (fake MIDI input),
//   - (phone portrait only) pressing play makes the screen follow the beat without errors, and play again stops it.
// Run `npm run build` first, then `npm run check` (or `npm run check -- djent` for one app).
// First time on a new computer: `npx playwright install chromium`.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {extname, join, normalize, resolve} from 'node:path';
import {chromium} from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const PAGES = [
  {app: 'double-pedal', path: 'double-pedal/'},
  {app: 'djent', path: 'djent/'},
  {app: 'timekeeper', path: 'timekeeper/'},
  {app: 'linear-grooves', path: 'linear-grooves/'},
  {app: 'linear-grooves', path: 'linear-grooves/sticking.html'},
  // Pro Metronome has its own layout: 開始 sits in the transport row and the tempo goes up to 300
  {app: 'metronome', path: 'metronome/', play: '.transport button:first-child', bpm: '.bpm input', maxBpm: 300},
];
const PLAY = '.dock .play', BPM = 'input.bpm', MAX_BPM = 240;
// CSS sizes: a Pixel-class phone, and the 11" tablet (2000×1200 screen at 1.5×).
const SCREENS = [
  {name: '手機直向', viewport: {width: 412, height: 915}},
  {name: '手機橫向', viewport: {width: 915, height: 412}},
  {name: '平板直向', viewport: {width: 800, height: 1333}},
  {name: '平板橫向', viewport: {width: 1333, height: 800}},
];

const TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml'};
function serve() {
  const server = createServer(async (req, res) => {
    let file = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    try {
      if (!file.startsWith(ROOT)) throw new Error('outside');
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      res.writeHead(200, {'content-type': TYPES[extname(file)] || 'application/octet-stream'});
      res.end(await readFile(file));
    } catch {
      res.writeHead(404); res.end();
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function checkPage(browser, base, page, screen) {
  const problems = [];
  const ctx = await browser.newContext({viewport: screen.viewport, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());   // the check works offline; system font stands in
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push(`程式錯誤：${e.message}`));
  // a file that fails to load is reported by its address (the console message does not name it); fonts are blocked on purpose
  p.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problems.push(`主控台錯誤：${m.text()}`); });
  p.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)\.com/.test(r.url())) problems.push(`載入失敗：${r.url()}`); });
  p.on('response', r => { if (r.status() >= 400) problems.push(`找不到檔案（${r.status()}）：${r.url()}`); });
  await p.goto(base + page.path, {waitUntil: 'load'});
  const playSel = page.play || PLAY, maxBpm = page.maxBpm || MAX_BPM;
  await p.locator(playSel).waitFor({timeout: 10000}).catch(() => {});

  // play button fully inside the screen, before any scrolling
  const play = await p.locator(playSel).boundingBox();
  if (!play) problems.push('找不到播放鍵');
  else if (play.y < 0 || play.x < 0 || play.y + play.height > screen.viewport.height + 0.5 || play.x + play.width > screen.viewport.width + 0.5) {
    problems.push(`播放鍵沒有完整出現在畫面上（位置 ${Math.round(play.x)},${Math.round(play.y)}，大小 ${Math.round(play.width)}×${Math.round(play.height)}）`);
  }

  // three-digit tempo: type the highest tempo, then the number must fit its field
  const bpm = p.locator(page.bpm || BPM);
  try {
    await bpm.focus({timeout: 5000});
    await bpm.fill(String(maxBpm), {timeout: 5000, force: true});
    await bpm.press('Enter', {timeout: 5000});
    await p.waitForTimeout(150);
    const fit = await bpm.evaluate(el => ({value: el.value, scroll: el.scrollWidth, client: el.clientWidth}));
    if (fit.value !== String(maxBpm)) problems.push(`BPM 輸入 ${maxBpm} 後顯示「${fit.value}」`);
    if (fit.scroll > fit.client + 1) problems.push(`BPM ${fit.value} 被截斷（需要 ${fit.scroll}px，只有 ${fit.client}px）`);
  } catch (e) {
    problems.push(`沒辦法在 BPM 欄位輸入數字：${e.message.split('\n')[0]}`);
  }

  // nothing wider than the screen
  const wide = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (wide > 1) problems.push(`頁面可以左右捲動（多出 ${wide}px）`);

  // playback: the scheduler runs and the screen follows the beat (counted as DOM changes while playing)
  if (screen === SCREENS[0]) {
    try {
      await p.evaluate(() => { window.__mut = 0; new MutationObserver(m => { window.__mut += m.length; }).observe(document.body, {subtree: true, attributes: true, childList: true, characterData: true}); });
      await p.locator(playSel).click({timeout: 5000});
      await p.waitForTimeout(1500);
      const moved = await p.evaluate(() => window.__mut);
      if (process.env.DEBUG) console.log(page.path, moved);
      if (moved < 5) problems.push(`按播放後畫面沒有跟著拍子動（只有 ${moved} 次變化）`);
      await p.locator(playSel).click({timeout: 5000});
      await p.waitForTimeout(300);
      const after = await p.evaluate(() => window.__mut);
      await p.waitForTimeout(600);
      const still = await p.evaluate(() => window.__mut) - after;
      if (still > 3) problems.push(`再按一次播放後還在動（${still} 次變化），沒有停下來`);
    } catch (e) {
      problems.push(`播放測試失敗：${e.message.split('\n')[0]}`);
    }
  }

  await ctx.close();
  return problems;
}

// Offline: the generated sw.js precaches everything, so after one visit the app opens with the network off,
// with the Figtree font (bundled with the app, no Google Fonts) loaded.
async function checkOffline(browser, port, app) {
  const problems = [];
  const ctx = await browser.newContext({viewport: SCREENS[0].viewport});
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push(`程式錯誤：${e.message}`));
  try {
    // a service worker needs a secure origin: localhost counts
    await p.goto(`http://localhost:${port}/${app}/`, {waitUntil: 'load'});
    await p.evaluate(() => navigator.serviceWorker.ready);
    await p.waitForTimeout(300);
    await ctx.setOffline(true);
    await p.reload({waitUntil: 'load'});
    await p.waitForTimeout(500);
    const buttons = await p.evaluate(() => document.querySelectorAll('button').length);
    if (buttons < 3) problems.push(`離線時打不開（只有 ${buttons} 個按鈕）`);
    const font = await p.evaluate(async () => (await document.fonts.load('16px Figtree')).some(f => f.family.replace(/["']/g, '') === 'Figtree' && f.status === 'loaded'));
    if (!font) problems.push('離線時 Figtree 字型沒有載入');
  } catch (e) {
    problems.push(`離線測試失敗：${e.message.split('\n')[0]}`);
  }
  await ctx.close();
  return problems;
}

// Time Keeper with an electronic drum: a fake MIDI input sends a note-on every 100 ms while playing;
// the hits must reach the timing meter.
async function checkMidi(browser, base) {
  const problems = [];
  const ctx = await browser.newContext({viewport: SCREENS[0].viewport, serviceWorkers: 'block'});
  await ctx.addInitScript(() => {
    const input = {name: '測試電子鼓', state: 'connected', onmidimessage: null};
    window.__midiInput = input;
    navigator.requestMIDIAccess = async () => ({inputs: new Map([['1', input]]), outputs: new Map(), onstatechange: null});
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push(`程式錯誤：${e.message}`));
  try {
    await p.goto(base + 'timekeeper/', {waitUntil: 'load'});
    await p.getByRole('button', {name: '連接電子鼓'}).click({timeout: 5000});
    await p.getByText('已連接：測試電子鼓').first().waitFor({timeout: 3000});
    await p.locator(PLAY).click();
    await p.evaluate(() => { window.__midiTimer = setInterval(() => window.__midiInput.onmidimessage?.({data: [0x99, 38, 100], timeStamp: performance.now()}), 100); });
    await p.waitForTimeout(4000);
    const last = await p.locator('.meter-last').textContent();
    if (!last || last.includes('還沒有聽到')) problems.push(`電子鼓的打擊沒有被算進去（顯示「${last}」）`);
    await p.locator(PLAY).click();
  } catch (e) {
    problems.push(`MIDI 測試失敗：${e.message.split('\n')[0]}`);
  }
  await ctx.close();
  return problems;
}

// Linear Grooves share link: make a new groove, copy its link, open the link in a fresh browser: same groove.
async function checkShare(browser, base) {
  const problems = [];
  const ctx = await browser.newContext({viewport: SCREENS[0].viewport, serviceWorkers: 'block'});
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], {origin: base});
  await ctx.addInitScript(() => { delete Navigator.prototype.share; });   // use the clipboard path
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push(`程式錯誤：${e.message}`));
  try {
    await p.goto(base + 'linear-grooves/', {waitUntil: 'load'});
    // change the groove so it is not simply the default one
    await p.getByRole('radio', {name: /隨機產生/}).check({timeout: 5000, force: true});
    await p.getByRole('button', {name: /修改這個節奏/}).click({timeout: 5000});
    await p.getByRole('button', {name: '對調', exact: true}).click({timeout: 5000});
    await p.getByRole('button', {name: '換起點', exact: true}).click({timeout: 5000});
    const before = await p.locator('.notation, .meta').allTextContents();
    await p.getByRole('button', {name: '分享連結'}).click({timeout: 5000});
    await p.waitForTimeout(200);
    const url = await p.evaluate(() => navigator.clipboard.readText());
    if (!/#g=[A-Za-z0-9_-]+$/.test(url)) throw new Error(`連結格式不對：${url.slice(0, 80)}`);
    const ctx2 = await browser.newContext({viewport: SCREENS[0].viewport, serviceWorkers: 'block'});
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => problems.push(`程式錯誤（打開連結）：${e.message}`));
    await p2.goto(url.replace(/^https?:\/\/[^/]+\//, base), {waitUntil: 'load'});
    await p2.waitForTimeout(500);
    const after = await p2.locator('.notation, .meta').allTextContents();
    if (JSON.stringify(after) !== JSON.stringify(before)) problems.push('打開分享連結後，節奏和分享的不一樣');
    if ((await p2.evaluate(() => location.hash))) problems.push('打開分享連結後網址還留著 #g=');
    await ctx2.close();
  } catch (e) {
    problems.push(`分享連結測試失敗：${e.message.split('\n')[0]}`);
  }
  await ctx.close();
  return problems;
}

const only = process.argv.slice(2);
const pages = only.length ? PAGES.filter(pg => only.includes(pg.app)) : PAGES;
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch(process.env.PW_CHROMIUM ? {executablePath: process.env.PW_CHROMIUM} : {});
let failed = 0;
for (const page of pages) {
  for (const screen of SCREENS) {
    const problems = await checkPage(browser, base, page, screen).catch(e => [`檢查中斷：${e.message.split('\n')[0]}`]);
    console.log(`${problems.length ? '✗' : '✓'} ${page.path.padEnd(30)} ${screen.name}`);
    for (const pr of problems) console.log(`    ${pr}`);
    if (problems.length) failed++;
  }
}
for (const app of [...new Set(pages.map(pg => pg.app))]) {
  const problems = await checkOffline(browser, server.address().port, app);
  console.log(`${problems.length ? '✗' : '✓'} ${(app + '/').padEnd(30)} 離線`);
  for (const pr of problems) console.log(`    ${pr}`);
  if (problems.length) failed++;
}
if (pages.some(pg => pg.app === 'linear-grooves')) {
  const problems = await checkShare(browser, base);
  console.log(`${problems.length ? '✗' : '✓'} ${'linear-grooves/'.padEnd(30)} 分享連結`);
  for (const pr of problems) console.log(`    ${pr}`);
  if (problems.length) failed++;
}
if (pages.some(pg => pg.app === 'timekeeper')) {
  const problems = await checkMidi(browser, base);
  console.log(`${problems.length ? '✗' : '✓'} ${'timekeeper/'.padEnd(30)} 電子鼓（MIDI）`);
  for (const pr of problems) console.log(`    ${pr}`);
  if (problems.length) failed++;
}
await browser.close();
server.close();
console.log(failed ? `\n${failed} 項沒通過` : '\n全部通過');
process.exit(failed ? 1 : 0);
