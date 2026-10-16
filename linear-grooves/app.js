'use strict';

/* ---------- Sticking library ----------
 * Linear = no two limbs ever strike together. A groove is built by
 * chaining short groups of hand notes that end on a kick (RLK, RLRK …),
 * so each slot of the bar has exactly one voice.
 */
const LIB = {
  2: ['RK', 'LK'],
  3: ['RLK', 'LRK', 'RRK', 'LLK'],
  4: ['RLRK', 'RLLK', 'LRLK', 'RRLK', 'LRRK'],
  5: ['RLRLK', 'RLRRK', 'RLLRK', 'LRLLK', 'RRLLK'],
  6: ['RLRLRK', 'RLRLLK', 'RRLLRK', 'RLLRLK'],
  7: ['RLRLRLK', 'RLRRLRK', 'RLLRLLK', 'RRLLRRK'],
  8: ['RLRLRLRK', 'RLRRLRLK', 'RLLRLRRK', 'RRLLRRLK'],
};
const DOUBLE_KICK = {
  3: ['RKK', 'LKK'],
  4: ['RLKK', 'LRKK'],
  5: ['RLRKK', 'RLLKK'],
  6: ['RLRLKK', 'RLLRKK'],
  7: ['RLRLRKK', 'RLRRLKK'],
  8: ['RLRLRLKK', 'RLRRLRKK'],
};
// Max same-hand run per library; 'classic' uses the curated lists above.
const LIB_RUN = { ext: 2, all: Infinity };
const LIB_NAME = { classic: '常見', ext: '較多', all: '全部' };

// Difficulty presets: one tap instead of five advanced settings.
const LEVELS = {
  easy: { sizes: [3, 4], lib: 'classic', doubleKick: false, hint: '每組 3–4 個音，都是鼓手常用的打法。適合第一次練線性節奏。' },
  mid:  { sizes: [3, 4, 5], lib: 'ext', doubleKick: false, hint: '每組 3–5 個音，打法變化更多。' },
  hard: { sizes: [2, 3, 4, 5, 6, 7], lib: 'all', doubleKick: true, hint: '每組 2–7 個音，所有打法都可能出現，也會連踩大鼓。' },
};
function detectLevel() {
  return Object.keys(LEVELS).find((k) => {
    const L = LEVELS[k];
    return L.lib === S.lib && L.doubleKick === S.doubleKick &&
      L.sizes.join() === S.sizes.slice().sort((a, b) => a - b).join();
  }) || 'custom';
}
function syncLevel() {
  const lv = detectLevel();
  document.querySelectorAll('input[name="level"]').forEach((el) => { el.checked = el.value === lv; });
  $('#levelHint').textContent = lv === 'custom' ? '目前使用你在「進階規則」裡的自訂設定。選一個難度可以回到預設。' : LEVELS[lv].hint;
}

// y = offset from the top staff line, in px (half a staff space = 4).
const VOICES = {
  hh:   { label: 'HH', y: -4, cym: true },  // G5, above the staff
  ride: { label: 'RD', y: 0,  cym: true },  // F5, top line
  t1:   { label: 'T1', y: 4 },              // E5
  sn:   { label: 'SN', y: 12 },             // C5
  ft:   { label: 'FT', y: 20 },             // A4
  k:    { label: 'BD', y: 28 },             // F4
};
const COUNTS = { 4: ['', 'e', '&', 'a'], 3: ['', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
const SUB_NAME = { 4: '16 分音符', 3: '8 分三連音', 6: '16 分六連音' };

const MIN_BPM = 40;
const DEFAULTS = {
  sub: 4, beats: 4, bars: 1, sizes: [3, 4], kickPos: 'end', doubleKick: false, lib: 'classic', seenGuide: false,
  orch: 'hh', accents: true, bpm: 80, click: true, countIn: false,
  trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 140,
};

/* ---------- Storage (best effort) ---------- */
function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const S = Object.assign({}, DEFAULTS, load('lg.settings', {}));
let favs = load('lg.favs', []);
let pattern = load('lg.pattern', null);
let SL = [];          // flattened slots of the current pattern

const $ = (s) => document.querySelector(s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------- Generator ---------- */
// Every R/L string of length n whose same-hand runs stay within maxRun.
function handStrings(n, maxRun) {
  const out = [];
  (function walk(str, run) {
    if (str.length === n) { out.push(str); return; }
    for (const h of 'RL') {
      const r = str && str[str.length - 1] === h ? run + 1 : 1;
      if (r <= maxRun) walk(str + h, r);
    }
  })('', 0);
  return out;
}

const poolCache = new Map();
function pool(size) {
  const key = [size, S.lib, S.doubleKick, S.kickPos].join();
  if (poolCache.has(key)) return poolCache.get(key);
  let list;
  if (S.lib === 'classic') {
    list = LIB[size].slice();
    if (S.doubleKick && DOUBLE_KICK[size]) list = list.concat(DOUBLE_KICK[size]);
  } else {
    const run = LIB_RUN[S.lib];
    list = handStrings(size - 1, run).map((h) => h + 'K');
    if (S.doubleKick && size >= 3) list = list.concat(handStrings(size - 2, run).map((h) => h + 'KK'));
  }
  if (S.kickPos === 'start') list = list.map((s) => s.slice(-1) + s.slice(0, -1));
  poolCache.set(key, list);
  return list;
}

function voicesFor(stick) {
  let rv = 'hh', lv = 'sn';
  if (S.orch === 'ride') rv = 'ride';
  else if (S.orch === 'toms') { rv = pick(['hh', 't1', 'ft', 'ft']); lv = pick(['sn', 'sn', 't1']); }
  return [...stick].map((c) => (c === 'K' ? 'k' : c === 'R' ? rv : lv));
}

function makeGroup(size, avoid) {
  let list = pool(size);
  if (avoid && list.length > 1) list = list.filter((s) => s !== avoid);
  const stick = pick(list);
  return { stick, voices: voicesFor(stick) };
}

// Random composition of n using only the allowed sizes (DP keeps every step solvable).
function partition(n, sizes) {
  const ok = Array(n + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= n; i++) ok[i] = sizes.some((s) => s <= i && ok[i - s]);
  if (!ok[n]) return null;
  const out = [];
  let rem = n;
  while (rem > 0) {
    const s = pick(sizes.filter((x) => x <= rem && ok[rem - x]));
    out.push(s);
    rem -= s;
  }
  return out;
}

function generate() {
  const n = S.beats * S.sub * S.bars;
  const sizes = S.sizes.slice().sort((a, b) => a - b);
  const parts = sizes.length ? partition(n, sizes) : null;
  if (!parts) {
    flash(`目前的「每組長度」湊不滿一小節（${n} 個音），請在進階規則多勾幾種長度`);
    return false;
  }
  pattern = { sub: S.sub, beats: S.beats, bars: S.bars, shift: 0, groups: parts.map((s) => makeGroup(s)) };
  closePicker();
  patternChanged(true);
  return true;
}

// Displacement: the whole groove is rotated right by p.shift slots,
// so slot i plays base note (i - shift) and groups can wrap over the barline.
function flatten(p) {
  const base = [];
  p.groups.forEach((g, gi) => {
    [...g.stick].forEach((limb, k) => {
      base.push({ limb, voice: g.voices[k], acc: S.accents && k === 0, g: gi });
    });
  });
  const n = base.length, sh = ((p.shift || 0) % n + n) % n;
  return base.map((_, i) => base[(i - sh + n) % n]);
}
function displayIndex(baseIndex) {
  const n = SL.length, sh = ((pattern.shift || 0) % n + n) % n;
  return (baseIndex + sh) % n;
}

/* ---------- Rendering ---------- */
function renderNotation() {
  const p = pattern;
  const per = p.beats * p.sub;
  const slotW = p.sub === 3 ? 30 : p.sub === 6 ? 19 : 24;
  const beatGap = 12, x0 = 60, top = 56, H = 132;
  const beatW = p.sub * slotW + beatGap;
  const W = x0 + p.beats * beatW + 8;
  const beamY = 30;
  let html = '';

  for (let b = 0; b < p.bars; b++) {
    const ph = [], body = [], beams = [];
    let s = `<svg class="staff" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.66)}px" role="img" aria-label="第 ${b + 1} 小節譜例">`;

    for (let bt = 0; bt < p.beats; bt++) {
      const xs = [];
      for (let k = 0; k < p.sub; k++) {
        const idx = b * per + bt * p.sub + k;
        const sl = SL[idx];
        const x = x0 + bt * beatW + k * slotW + slotW / 2;
        xs.push(x);
        ph.push(`<rect class="ph" data-i="${idx}" x="${x - slotW / 2}" y="4" width="${slotW}" height="${H - 8}" rx="3"/>`);
        const v = VOICES[sl.voice];
        const y = top + v.y;
        if (v.cym) {
          body.push(`<path class="xh" d="M${x - 3.6} ${y - 3.6}L${x + 3.6} ${y + 3.6}M${x - 3.6} ${y + 3.6}L${x + 3.6} ${y - 3.6}"/>`);
        } else {
          body.push(`<ellipse class="nh" cx="${x}" cy="${y}" rx="4.7" ry="3.4" transform="rotate(-22 ${x} ${y})"/>`);
        }
        body.push(`<line class="st" x1="${x + 4.2}" y1="${y - 1}" x2="${x + 4.2}" y2="${beamY}"/>`);
        if (sl.acc) body.push(`<path class="ac" d="M${x - 3} ${beamY - 13}L${x + 5} ${beamY - 10}L${x - 3} ${beamY - 7}"/>`);
        body.push(`<text class="stk ${sl.limb}" x="${x}" y="108" text-anchor="middle">${sl.limb}</text>`);
        body.push(`<text class="cnt" x="${x}" y="124" text-anchor="middle">${k === 0 ? bt + 1 : COUNTS[p.sub][k]}</text>`);
      }
      const bx1 = xs[0] + 4.2 - 0.6, bx2 = xs[xs.length - 1] + 4.2 + 0.6;
      beams.push(`<rect class="bm" x="${bx1}" y="${beamY}" width="${bx2 - bx1}" height="4"/>`);
      if (p.sub !== 3) beams.push(`<rect class="bm" x="${bx1}" y="${beamY + 7}" width="${bx2 - bx1}" height="4"/>`);
      if (p.sub !== 4) {
        beams.push(`<text class="tup" x="${(bx1 + bx2) / 2}" y="12" text-anchor="middle">${p.sub}</text>`);
      }
    }

    // Group brackets under the sticking row, split at group borders.
    let runStart = 0;
    for (let k = 1; k <= per; k++) {
      const idx = b * per + k;
      if (k === per || SL[idx].g !== SL[idx - 1].g) {
        const a = slotX(runStart), z = slotX(k - 1);
        body.push(`<line class="gb" x1="${a - 6}" y1="113" x2="${z + 6}" y2="113"/>`);
        runStart = k;
      }
    }
    function slotX(k) {
      const bt = Math.floor(k / p.sub);
      return x0 + bt * beatW + (k % p.sub) * slotW + slotW / 2;
    }

    s += ph.join('');
    for (let i = 0; i < 5; i++) s += `<line class="sl" x1="6" x2="${W - 4}" y1="${top + i * 8}" y2="${top + i * 8}"/>`;
    s += `<rect class="bl" x="12" y="${top + 8}" width="3.5" height="16"/><rect class="bl" x="19" y="${top + 8}" width="3.5" height="16"/>`;
    if (b === 0) s += `<text class="ts" x="40" y="${top + 15}" text-anchor="middle">${p.beats}</text><text class="ts" x="40" y="${top + 31}" text-anchor="middle">4</text>`;
    if (p.bars > 1) s += `<text class="bnum" x="6" y="${top - 8}">${b + 1}</text>`;
    s += `<rect class="bl" x="6" y="${top}" width="1" height="32"/>`;
    if (b === p.bars - 1) {
      s += `<rect class="bl" x="${W - 10}" y="${top}" width="1" height="32"/><rect class="bl" x="${W - 7}" y="${top}" width="3.5" height="32"/>`;
    } else {
      s += `<rect class="bl" x="${W - 5}" y="${top}" width="1" height="32"/>`;
    }
    s += beams.join('') + body.join('') + '</svg>';
    html += s;
  }
  $('#notation').innerHTML = html;
}

function renderStrip() {
  let i = 0;
  $('#strip').innerHTML = pattern.groups.map((g, gi) => {
    const chips = [...g.stick].map((limb, k) => {
      const acc = S.accents && k === 0 ? ' acc' : '';
      return `<span class="chip ${limb}${acc}" data-i="${displayIndex(i++)}">${limb}<small>${VOICES[g.voices[k]].label}</small></span>`;
    }).join('');
    const sel = picker === gi ? ' sel' : '';
    return `<button type="button" class="grp${sel}" data-g="${gi}" aria-label="替換第 ${gi + 1} 組（${g.stick}）">${chips}</button>`;
  }).join('');
}

let hlMap = [];
function indexHighlights() {
  hlMap = SL.map(() => []);
  document.querySelectorAll('.ph[data-i], .chip[data-i]').forEach((el) => {
    hlMap[+el.dataset.i].push(el);
  });
}

function patternChanged(fresh) {
  SL = flatten(pattern);
  $('#meta').textContent = `${SUB_NAME[pattern.sub]} · ${pattern.beats}/4 · ${pattern.bars} 小節 · ${pattern.groups.length} 組`;
  $('#shiftOut').textContent = shiftLabel();
  $('#shift0').hidden = !pattern.shift;
  renderPicker();
  renderNotation();
  renderStrip();
  indexHighlights();
  lastHl = -1;
  save('lg.pattern', pattern);
  if (fresh && playing) cur = 0;   // restart the new groove on the next slot
}

function stickingText(p) {
  const t = p.groups.map((g) => [...g.stick].join(' ')).join(' | ');
  return p.shift ? `${t}（位移 +${p.shift}）` : t;
}
function shiftLabel() {
  const sh = pattern.shift || 0;
  if (!sh) return '在原位';
  const beat = Math.floor(sh / pattern.sub), k = sh % pattern.sub;
  return `往後挪了 ${sh} 個音（第一組從「${beat + 1}${k ? ' ' + COUNTS[pattern.sub][k] : ''}」開始）`;
}

/* ---------- Group picker: substitute or permute one group ---------- */
let picker = -1;
function rotations(stick) {
  const out = [];
  for (let r = 1; r < stick.length; r++) out.push(stick.slice(r) + stick.slice(0, r));
  return [...new Set(out)].filter((x) => x !== stick);
}
function renderPicker() {
  const box = $('#picker');
  if (picker < 0 || !pattern.groups[picker]) { box.hidden = true; return; }
  const g = pattern.groups[picker];
  const opts = (list) => list.map((s) =>
    `<button type="button" class="opt${s === g.stick ? ' cur' : ''}" data-stick="${s}">${[...s].map((c) => `<b class="${c}">${c}</b>`).join('')}</button>`).join('');
  const rot = rotations(g.stick);
  const all = pool(g.stick.length);
  box.hidden = false;
  box.innerHTML = `
    <div class="pk-head">
      <strong>換掉第 ${picker + 1} 組</strong>
      <button type="button" class="ghost sm" data-act="random">隨便換一個</button>
      <button type="button" class="primary-sm" data-act="close">完成</button>
    </div>
    <div class="pk-lbl">點下面任一個打法，就會換上去，可以邊播放邊試。</div>
    ${rot.length ? `<div class="pk-sub">同樣的音，換個起點</div><div class="pk-opts">${opts(rot)}</div>` : ''}
    <div class="pk-sub">其他 ${g.stick.length} 個音的打法（${all.length} 種）</div>
    <div class="pk-opts pk-scroll">${opts(all)}</div>`;
}
function closePicker() { picker = -1; }
function setGroup(gi, stick) {
  const g = pattern.groups[gi];
  // Same notes in a new order: keep each hand on the drum it was on.
  if ([...stick].sort().join('') === [...g.stick].sort().join('')) {
    const on = { K: 'k' };
    [...g.stick].forEach((c, k) => { on[c] = on[c] || g.voices[k]; });
    g.voices = [...stick].map((c) => on[c]);
  } else {
    g.voices = voicesFor(stick);
  }
  g.stick = stick;
  patternChanged(false);
}

/* ---------- Audio (synthesised kit, no samples) ---------- */
let ctx = null, master = null, noiseBuf = null;

function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Loud but clean for phone speakers: boost, then a limiter that only touches the loudest peaks,
    // then a soft clipper that rounds off any attack the limiter lets through (output stays below 0 dBFS).
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = 0;
    comp.knee.value = 0;
    comp.ratio.value = 20;
    comp.attack.value = 0;
    comp.release.value = 0.05;
    // The shaper's input range is ±1, so feed it half the signal and let its curve cover ±2:
    // straight line up to 0.7 (soft and accented notes keep their difference), then bends smoothly toward 0.98.
    const half = ctx.createGain();
    half.gain.value = 0.5;
    const clip = ctx.createWaveShaper();
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++) {
      const x = ((i / (curve.length - 1)) * 2 - 1) * 2, a = Math.abs(x);
      curve[i] = Math.sign(x) * (a <= 0.7 ? a : 0.7 + 0.28 * Math.tanh((a - 0.7) / 0.28));
    }
    clip.curve = curve;
    master = ctx.createGain();
    master.gain.value = 2;
    master.connect(comp).connect(half).connect(clip).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function env(g, t, peak, dec) {
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dec);
}
function noise(t, dec, type, freq, peak, q) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (q) f.Q.value = q;
  const g = ctx.createGain();
  env(g, t, peak, dec);
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dec + 0.02);
}
function tone(t, f0, f1, dec, peak, type) {
  const o = ctx.createOscillator();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.6);
  const g = ctx.createGain();
  env(g, t, peak, dec);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dec + 0.02);
}
const KIT = {
  k:    (t, a) => { tone(t, 150, 44, 0.36, 1.0 * a); noise(t, 0.012, 'lowpass', 3000, 0.25 * a); },
  sn:   (t, a) => { noise(t, 0.16, 'highpass', 1400, 0.6 * a); tone(t, 230, 170, 0.08, 0.35 * a, 'triangle'); },
  hh:   (t, a) => { noise(t, 0.045, 'highpass', 7800, 0.38 * a); },
  ride: (t, a) => { noise(t, 0.5, 'bandpass', 6200, 0.18 * a, 0.9); tone(t, 2400, 2350, 0.35, 0.03 * a, 'triangle'); },
  t1:   (t, a) => { tone(t, 230, 155, 0.28, 0.75 * a); noise(t, 0.02, 'bandpass', 1500, 0.15 * a); },
  ft:   (t, a) => { tone(t, 125, 82, 0.4, 0.85 * a); noise(t, 0.02, 'bandpass', 900, 0.15 * a); },
};
function click(t, downbeat) {
  const f = downbeat ? 2000 : 1400;
  tone(t, f, f, 0.03, 0.22, 'square');
}

/* ---------- Transport ---------- */
let playing = false, cur = 0, nextTime = 0, timer = null, countSlots = 0, loops = 0;
let queue = [], lastHl = -1, wakeLock = null;

function slotDur() { return 60 / S.bpm / pattern.sub; }

function scheduleSlot(n, t) {
  const sub = pattern.sub;
  if (n < 0) {
    const k = n + countSlots;
    if (k % sub === 0) {
      click(t, k === 0);
      queue.push({ t, i: -1, count: k / sub + 1 });
    }
    return;
  }
  const len = SL.length;
  const i = n % len;
  if (i === 0 && n > 0) {
    loops++;
    if (S.trainer && loops % S.trainerEvery === 0 && S.bpm < S.trainerMax) {
      setBpm(Math.min(S.trainerMax, S.bpm + S.trainerStep));
      queue.push({ t, i: -2, msg: `加速到 ${S.bpm} BPM` });
    }
  }
  const s = SL[i];
  KIT[s.voice](t, s.acc ? 1 : 0.55);
  if (S.click && i % sub === 0) click(t, i % (pattern.beats * sub) === 0);
  queue.push({ t, i });
}

function tick() {
  while (nextTime < ctx.currentTime + 0.12) {
    scheduleSlot(cur, nextTime);
    nextTime += slotDur();
    cur++;
  }
}

function draw() {
  if (!playing) return;
  const now = ctx.currentTime;
  while (queue.length && queue[0].t <= now) {
    const e = queue.shift();
    if (e.i === -1) { $('#status').textContent = `預備 ${e.count}`; }
    else if (e.i === -2) { $('#status').textContent = e.msg; }
    else {
      if (e.i === 0 && $('#status').textContent.startsWith('預備')) $('#status').textContent = '';
      highlight(e.i);
    }
  }
  requestAnimationFrame(draw);
}

function highlight(i) {
  if (lastHl >= 0 && hlMap[lastHl]) hlMap[lastHl].forEach((el) => el.classList.remove('on'));
  if (hlMap[i]) hlMap[i].forEach((el) => el.classList.add('on'));
  lastHl = i;
}

async function play() {
  ensureAudio();
  playing = true;
  countSlots = S.countIn ? pattern.beats * pattern.sub : 0;
  cur = -countSlots;
  loops = 0;
  queue = [];
  nextTime = ctx.currentTime + 0.08;
  tick();
  timer = setInterval(tick, 25);
  requestAnimationFrame(draw);
  setPlayIcon();
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
}

function stop() {
  playing = false;
  clearInterval(timer);
  queue = [];
  highlight(-1);
  $('#status').textContent = '';
  setPlayIcon();
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}

function setPlayIcon() {
  $('#playIcon').setAttribute('d', playing ? 'M6 5h4.5v14H6zM13.5 5H18v14h-4.5z' : 'M7 4.5v15l13-7.5z');
  $('#btnPlay').setAttribute('aria-label', playing ? '停止' : '播放');
}

function setBpm(v) {
  S.bpm = Math.max(MIN_BPM, Math.min(240, Math.round(v)));
  $('#bpm').value = S.bpm;
  if (document.activeElement !== $('#bpmOut')) $('#bpmOut').value = S.bpm;
  saveSettings();
}

/* ---------- UI helpers ---------- */
let flashTimer = null;
function flash(msg) {
  $('#status').textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { if ($('#status').textContent === msg) $('#status').textContent = ''; }, 2600);
}
function saveSettings() { save('lg.settings', S); if (document.getElementById('levelHint')) syncLevel(); }

function renderFavs() {
  const ul = $('#favs');
  if (!favs.length) {
    ul.innerHTML = '<li class="empty">還沒有收藏。遇到喜歡的節奏，按樂譜右上角的「☆ 收藏」。</li>';
    return;
  }
  ul.innerHTML = favs.map((f, i) => `
    <li class="fav">
      <div class="fav-main">
        <div class="fav-stk">${stickingText(f.p)}</div>
        <div class="fav-meta">${SUB_NAME[f.p.sub]} · ${f.p.beats}/4 · ${f.p.bars} 小節 · ${f.bpm} BPM</div>
      </div>
      <button type="button" class="ghost" data-load="${i}">載入</button>
      <button type="button" class="ghost del" data-del="${i}">刪除</button>
    </li>`).join('');
}

function syncControls() {
  $(`#sub${S.sub}`).checked = true;
  $('#beats').value = S.beats;
  $(`#bars${S.bars}`).checked = true;
  [2, 3, 4, 5, 6, 7, 8].forEach((n) => { $(`#size${n}`).checked = S.sizes.includes(n); });
  ($(`#lib-${S.lib}`) || $('#lib-classic')).checked = true;
  $(S.kickPos === 'start' ? '#kpStart' : '#kpEnd').checked = true;
  $('#orch').value = S.orch;
  $('#doubleKick').checked = S.doubleKick;
  $('#accents').checked = S.accents;
  $('#click').checked = S.click;
  $('#countIn').checked = S.countIn;
  $('#trainer').checked = S.trainer;
  $('#trainerEvery').value = S.trainerEvery;
  $('#trainerStep').value = S.trainerStep;
  $('#trainerMax').value = S.trainerMax;
  $('#trainerOpts').hidden = !S.trainer;
  $('#guide').hidden = !!S.seenGuide;
  $('#helpBtn').setAttribute('aria-expanded', String(!S.seenGuide));
  setBpm(S.bpm);
  syncLevel();
}

/* ---------- Events ---------- */
function bind() {
  $('#btnPlay').addEventListener('click', () => (playing ? stop() : play()));
  document.querySelectorAll('input[name="level"]').forEach((el) => el.addEventListener('change', () => {
    const L = LEVELS[el.value];
    Object.assign(S, { sizes: L.sizes.slice(), lib: L.lib, doubleKick: L.doubleKick });
    syncControls();
    saveSettings();
    generate();
  }));
  const showGuide = (show) => {
    $('#guide').hidden = !show;
    $('#helpBtn').setAttribute('aria-expanded', String(show));
    if (show) $('#guide').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#helpBtn').addEventListener('click', () => showGuide($('#guide').hidden));
  $('#guideOk').addEventListener('click', () => { S.seenGuide = true; saveSettings(); showGuide(false); });
  $('#btnGen').addEventListener('click', generate);
  $('#bpm').addEventListener('input', (e) => setBpm(+e.target.value));
  $('#bpmDown').addEventListener('click', () => setBpm(S.bpm - 5));
  $('#bpmUp').addEventListener('click', () => setBpm(S.bpm + 5));
  // Tap the number to type a tempo directly.
  const bpmIn = $('#bpmOut');
  bpmIn.addEventListener('focus', () => { bpmIn.select(); setTimeout(() => bpmIn.select(), 0); });
  bpmIn.addEventListener('input', () => { bpmIn.value = bpmIn.value.replace(/\D/g, '').slice(0, 3); });
  bpmIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') bpmIn.blur();
    else if (e.key === 'Escape') { bpmIn.value = S.bpm; bpmIn.blur(); }
  });
  bpmIn.addEventListener('blur', () => {
    const v = parseInt(bpmIn.value, 10);
    if (!v) { bpmIn.value = S.bpm; return; }
    setBpm(v);
    if (S.bpm !== v) flash(`速度可以設定 ${MIN_BPM}–240，已改成 ${S.bpm}`);
  });

  // Structural rules → regenerate.
  document.querySelectorAll('input[name="sub"]').forEach((el) => el.addEventListener('change', () => { S.sub = +el.value; saveSettings(); generate(); }));
  document.querySelectorAll('input[name="bars"]').forEach((el) => el.addEventListener('change', () => { S.bars = +el.value; saveSettings(); generate(); }));
  document.querySelectorAll('input[name="kickPos"]').forEach((el) => el.addEventListener('change', () => { S.kickPos = el.value; saveSettings(); generate(); }));
  $('#beats').addEventListener('change', (e) => { S.beats = +e.target.value; saveSettings(); generate(); });
  $('#sizes').addEventListener('change', () => {
    S.sizes = [2, 3, 4, 5, 6, 7, 8].filter((n) => $(`#size${n}`).checked);
    saveSettings();
    generate();
  });
  $('#doubleKick').addEventListener('change', (e) => { S.doubleKick = e.target.checked; saveSettings(); generate(); });

  // Cosmetic rules → keep the sticking.
  $('#orch').addEventListener('change', (e) => { S.orch = e.target.value; saveSettings(); revoice(); });
  $('#accents').addEventListener('change', (e) => { S.accents = e.target.checked; saveSettings(); patternChanged(false); });

  $('#click').addEventListener('change', (e) => { S.click = e.target.checked; saveSettings(); });
  $('#countIn').addEventListener('change', (e) => { S.countIn = e.target.checked; saveSettings(); });
  $('#trainer').addEventListener('change', (e) => { S.trainer = e.target.checked; $('#trainerOpts').hidden = !S.trainer; loops = 0; saveSettings(); });
  $('#trainerEvery').addEventListener('change', (e) => { S.trainerEvery = +e.target.value; saveSettings(); });
  $('#trainerStep').addEventListener('change', (e) => { S.trainerStep = +e.target.value; saveSettings(); });
  $('#trainerMax').addEventListener('change', (e) => {
    S.trainerMax = Math.max(40, Math.min(260, +e.target.value || DEFAULTS.trainerMax));
    e.target.value = S.trainerMax;
    saveSettings();
  });

  $('#strip').addEventListener('click', (e) => {
    const btn = e.target.closest('.grp');
    if (!btn) return;
    const gi = +btn.dataset.g;
    picker = picker === gi ? -1 : gi;
    renderStrip();
    indexHighlights();
    renderPicker();
  });
  $('#picker').addEventListener('click', (e) => {
    const opt = e.target.closest('[data-stick]');
    const act = e.target.closest('[data-act]');
    if (opt) setGroup(picker, opt.dataset.stick);
    else if (act && act.dataset.act === 'random') {
      const old = pattern.groups[picker];
      pattern.groups[picker] = makeGroup(old.stick.length, old.stick);
      patternChanged(false);
    } else if (act && act.dataset.act === 'close') {
      closePicker();
      patternChanged(false);
    }
  });

  // Displacement and permutation of the whole groove.
  const shiftBy = (d) => {
    const n = SL.length;
    pattern.shift = (((pattern.shift || 0) + d) % n + n) % n;
    patternChanged(false);
  };
  $('#shiftL').addEventListener('click', () => shiftBy(-1));
  $('#shiftR').addEventListener('click', () => shiftBy(1));
  $('#shift0').addEventListener('click', () => { pattern.shift = 0; patternChanged(false); });
  $('#btnRotate').addEventListener('click', () => {
    pattern.groups.forEach((g) => {
      g.stick = g.stick.slice(1) + g.stick[0];
      g.voices = g.voices.slice(1).concat(g.voices[0]);
    });
    patternChanged(false);
    flash('每組都改從下一個音開始');
  });
  $('#btnShuffle').addEventListener('click', () => {
    const gs = pattern.groups;
    if (gs.length < 2) return;
    const before = gs.map((g) => g.stick).join();
    for (let t = 0; t < 10 && gs.map((g) => g.stick).join() === before; t++) {
      for (let i = gs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gs[i], gs[j]] = [gs[j], gs[i]];
      }
    }
    closePicker();
    patternChanged(false);
    flash('已打亂各組順序');
  });
  document.querySelectorAll('input[name="lib"]').forEach((el) => el.addEventListener('change', () => {
    S.lib = el.value; saveSettings(); generate();
    flash(`打法變化：${LIB_NAME[S.lib]}`);
  }));

  $('#btnRevoice').addEventListener('click', revoice);
  $('#btnMirror').addEventListener('click', () => {
    const swap = { R: 'L', L: 'R', K: 'K' };
    pattern.groups.forEach((g) => {
      g.stick = [...g.stick].map((c) => swap[c]).join('');
      g.voices = voicesFor(g.stick);
    });
    patternChanged(false);
    flash('左右手已對調');
  });
  $('#btnCopy').addEventListener('click', async () => {
    const text = `${stickingText(pattern)}  (${SUB_NAME[pattern.sub]}, ${pattern.beats}/4, ${S.bpm} BPM)`;
    try { await navigator.clipboard.writeText(text); flash('已複製，可以貼到筆記或傳給別人'); }
    catch { flash(text); }
  });
  $('#btnFav').addEventListener('click', () => {
    favs.unshift({ p: JSON.parse(JSON.stringify(pattern)), bpm: S.bpm });
    favs = favs.slice(0, 50);
    save('lg.favs', favs);
    renderFavs();
    flash('已加入「我的收藏」');
  });
  $('#favs').addEventListener('click', (e) => {
    const l = e.target.closest('[data-load]');
    const d = e.target.closest('[data-del]');
    if (l) {
      const f = favs[+l.dataset.load];
      pattern = JSON.parse(JSON.stringify(f.p));
      closePicker();
      Object.assign(S, { sub: pattern.sub, beats: pattern.beats, bars: pattern.bars });
      syncControls();
      setBpm(f.bpm);
      patternChanged(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      flash('已載入');
    } else if (d) {
      if (!d.classList.contains('armed')) {
        d.classList.add('armed');
        d.textContent = '確定刪除？';
        setTimeout(() => { if (d.isConnected) { d.classList.remove('armed'); d.textContent = '刪除'; } }, 3000);
        return;
      }
      favs.splice(+d.dataset.del, 1);
      save('lg.favs', favs);
      renderFavs();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.key === 'g' || e.key === 'G') generate();
  });
  document.addEventListener('visibilitychange', async () => {
    if (playing && document.visibilityState === 'visible' && !wakeLock) {
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
    }
  });
}

function revoice() {
  pattern.groups.forEach((g) => { g.voices = voicesFor(g.stick); });
  patternChanged(false);
}

/* ---------- Boot ---------- */
function validPattern(p) {
  return p && Array.isArray(p.groups) && p.groups.length && [3, 4, 6].includes(p.sub) &&
    p.groups.reduce((n, g) => n + g.stick.length, 0) === p.beats * p.sub * p.bars;
}

syncControls();
bind();
renderFavs();
if (validPattern(pattern)) {
  Object.assign(S, { sub: pattern.sub, beats: pattern.beats, bars: pattern.bars });
  syncControls();
  patternChanged(false);
} else if (!generate()) {
  Object.assign(S, { sizes: DEFAULTS.sizes });
  syncControls();
  generate();
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker?.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}
