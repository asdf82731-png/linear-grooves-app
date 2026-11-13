// Offline test of Time Keeper's hit detector (timekeeper/src/public/onset-worklet.js), the exact file that ships.
// Synthesised recordings with known hit times go through the detector in 128-sample blocks, like the AudioWorklet.
// For each case it prints hits found / missed / extra and the timing error, for the envelope path alone (the old
// detector) and with the spectral-flux path, and fails when the full detector misses what it must catch.
// Run: npm test
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../timekeeper/src/public/onset-worklet.js', import.meta.url), 'utf8');
const sandbox = {module: {exports: {}}, Math, Float32Array, Uint16Array};
vm.runInNewContext(code, sandbox);
const {OnsetDetector} = sandbox.module.exports;

const SR = 48000;
let seed = 1;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

function buffer(sec) { return new Float32Array(Math.round(sec * SR)); }
// stick on a pad / snare / hi-hat: a bright noise burst with a fast decay; `hp` makes it thinner (hi-hat)
function hit(buf, t, amp, decayMs = 25, hp = 0) {
  const s0 = Math.round(t * SR), len = Math.round(decayMs * 8 * SR / 1000);
  let prev = 0;
  for (let i = 0; i < len && s0 + i < buf.length; i++) {
    let n = gauss();
    if (hp) { const v = n - prev * hp; prev = n; n = v; }
    buf[s0 + i] += amp * 0.4 * n * Math.exp(-i / (decayMs * SR / 1000));
  }
}
// a ringing drum or bass note: a low sine that decays slowly
function ring(buf, t, amp, freq, decaySec) {
  const s0 = Math.round(t * SR);
  for (let i = 0; s0 + i < buf.length; i++) buf[s0 + i] += amp * Math.sin(2 * Math.PI * freq * i / SR) * Math.exp(-i / (decaySec * SR)) * Math.min(1, i / 48);
}
function noise(buf, amp) { for (let i = 0; i < buf.length; i++) buf[i] += amp * gauss(); }

function detect(buf, opts) {
  const d = new OnsetDetector(SR, opts), found = [];
  for (let b = 0; b < buf.length; b += 128) {
    for (const i of d.process(buf.subarray(b, b + 128))) found.push((b + i) / SR);
  }
  return found.filter(t => t >= 0.2);   // the recording itself starting is not a hit
}
// match found hits to expected ones within ±15 ms
function score(expected, found) {
  const used = new Set(), errs = [];
  let hits = 0;
  for (const t of expected) {
    let best = -1, bestD = 0.015;
    found.forEach((f, k) => { const dd = Math.abs(f - t); if (!used.has(k) && dd <= bestD) { best = k; bestD = dd; } });
    if (best >= 0) { used.add(best); hits++; errs.push((found[best] - t) * 1000); }
  }
  const mean = errs.length ? errs.reduce((a, x) => a + Math.abs(x), 0) / errs.length : 0;
  const worst = errs.length ? Math.max(...errs.map(Math.abs)) : 0;
  return {hits, missed: expected.length - hits, extra: found.length - hits, mean, worst};
}

const cases = [];
{ // 1. pad: accents and ghost notes, some ghost notes 70 ms after an accent
  seed = 3;
  const buf = buffer(8), exp = [];
  let t = 0.3;
  while (t < 7.6) {
    const acc = rnd() < 0.3, a = acc ? 0.6 + rnd() * 0.3 : 0.07 + rnd() * 0.12;   // ghost notes stay above the default sensitivity (−35 dBFS)
    hit(buf, t, a); exp.push(t);
    if (acc && rnd() < 0.5) { hit(buf, t + 0.07, 0.06); exp.push(t + 0.07); t += 0.07; }
    t += 0.12 + rnd() * 0.25;
  }
  noise(buf, 0.0005);
  cases.push({name: '打擊墊：重音＋鬼音（有些鬼音只比重音的尾音大一點）', buf, exp, noWorse: true});
}
{ // 2. eighth-note hi-hat over a floor tom / bass note that rings loudly every bar
  seed = 5;
  const buf = buffer(8), exp = [];
  for (let bar = 0; bar < 4; bar++) {
    const t0 = 0.3 + bar * 1.8;
    ring(buf, t0, 0.7, 82, 1.2); exp.push(t0);
    for (let k = 1; k < 8; k++) { const t = t0 + k * 0.225; hit(buf, t, 0.12, 12, 0.95); exp.push(t); }
  }
  noise(buf, 0.0005);
  cases.push({name: '低音鼓／貝斯持續響＋8 分 Hi-hat', buf, exp, need: 0.9});
}
{ // 3. no hits: steady noise and a slowly beating low drone must stay silent
  seed = 7;
  const buf = buffer(6);
  noise(buf, 0.01);
  for (let i = 0; i < buf.length; i++) buf[i] += 0.3 * Math.sin(2 * Math.PI * 110 * i / SR) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 1.5 * i / SR)) * Math.min(1, i / SR);   // fades in over 1 s
  cases.push({name: '沒有打擊：雜音＋持續低音', buf, exp: [], maxExtra: 0});
}

let failed = 0;
for (const c of cases) {
  const old = score(c.exp, detect(c.buf, {flux: false})), now = score(c.exp, detect(c.buf, {}));
  const fmt = r => `抓到 ${r.hits}/${c.exp.length}，漏 ${r.missed}，多 ${r.extra}，平均誤差 ${r.mean.toFixed(1)} ms，最大 ${r.worst.toFixed(1)} ms`;
  const bad = (c.noWorse && now.hits < old.hits) || (c.need && now.hits < c.need * c.exp.length) || (c.maxExtra !== undefined && now.extra > c.maxExtra)
    || now.extra > old.extra + 1 || now.worst > 10;
  console.log(`${bad ? '✗' : '✓'} ${c.name}\n    只看音量（舊）：${fmt(old)}\n    加頻譜變化（新）：${fmt(now)}`);
  if (bad) failed++;
}
console.log(failed ? `\n${failed} 項沒通過` : '\n全部通過');
process.exit(failed ? 1 : 0);
