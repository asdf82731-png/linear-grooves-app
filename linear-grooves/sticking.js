'use strict';

/* ---------- Exercises ----------
 * Token grammar: [f|d]?[R|L]>?   f = flam, d = drag (grace notes by the other hand), > = accent.
 * Each pattern fills whole beats of `sub` notes per beat and loops.
 */
const RUDIMENTS = [
  { id: 'single',  name: '單擊',              en: 'Single Stroke Roll',   sub: 4, p: 'R L R L R L R L' },
  { id: 'double',  name: '雙擊',              en: 'Double Stroke Roll',   sub: 4, p: 'R R L L R R L L' },
  { id: 'triple',  name: '三擊',              en: 'Triple Stroke Roll',   sub: 3, p: 'R R R L L L' },
  { id: 'para',    name: '單 Paradiddle',     en: 'Single Paradiddle',    sub: 4, p: 'R> L R R L> R L L' },
  { id: 'six',     name: '六擊滾奏',          en: 'Six Stroke Roll',      sub: 6, p: 'R> L L R R L> R> L L R R L>' },
  { id: 'flam',    name: 'Flam（裝飾音）',    en: 'Flam',                 sub: 1, p: 'fR> fL> fR> fL>' },
  { id: 'flamtap', name: 'Flam Tap',          en: 'Flam Tap',             sub: 4, p: 'fR> R fL> L fR> R fL> L' },
  { id: 'flamacc', name: 'Flam Accent',       en: 'Flam Accent',          sub: 3, p: 'fR> L R fL> R L' },
  { id: 'swiss',   name: 'Swiss Army Triplet', en: 'Swiss Army Triplet',  sub: 3, p: 'fR> R L fR> R L' },
  { id: 'drag',    name: 'Drag（雙裝飾音）',  en: 'Drag',                 sub: 1, p: 'dR> dL> dR> dL>' },
];

// Paradiddle family: the four inversions of R L R R, then the longer and ornamented versions.
const PARADIDDLES = [
  { id: 'para',      name: '單 Paradiddle',            en: 'Single Paradiddle · R L R R',   sub: 4, p: 'R> L R R L> R L L' },
  { id: 'para-rev',  name: '反轉 Paradiddle',          en: 'Reverse · R R L R',             sub: 4, p: 'R> R L R L> L R L' },
  { id: 'invpara',   name: '反向 Paradiddle',          en: 'Inverted · R L L R',            sub: 4, p: 'R> L L R L> R R L' },
  { id: 'para-del',  name: '延遲 Paradiddle',          en: 'Delayed · R L R L',             sub: 4, p: 'R> L R L L> R L R' },
  { id: 'dblpara',   name: '雙 Paradiddle',            en: 'Double Paradiddle',             sub: 6, p: 'R> L R L R R L> R L R L L' },
  { id: 'tripara',   name: '三 Paradiddle',            en: 'Triple Paradiddle',             sub: 4, p: 'R> L R L R L R R L> R L R L R L L' },
  { id: 'paradd',    name: 'Paradiddle-diddle',        en: 'R L R R L L',                   sub: 6, p: 'R> L R R L L R> L R R L L' },
  { id: 'para-6',    name: 'Paradiddle 打六連音',      en: '8 個音的手順放在 6 連音上，重音會錯開', sub: 6,
    p: 'R> L R R L> R L L R> L R R L> R L L R> L R R L> R L L' },
  { id: 'flampara',  name: 'Flam Paradiddle',          en: 'Flam Paradiddle',               sub: 4, p: 'fR> L R R fL> R L L' },
  { id: 'flamparadd', name: 'Flam Paradiddle-diddle',  en: 'Flam Paradiddle-diddle',        sub: 6, p: 'fR> L R R L L fL> R L L R R' },
];

// Polyrhythms a:b — the right hand plays a evenly spaced notes while the left plays b
// over the same span. The span is b beats of a slots each, so the click follows the b hand.
const POLYS = [[3, 2], [4, 3], [5, 4], [5, 3], [5, 2], [7, 4], [2, 3], [3, 4]];

const ACCENT_BASES = {
  single: { name: '單擊', p: 'RL' },
  double: { name: '雙擊', p: 'RRLL' },
  para:   { name: 'Paradiddle', p: 'RLRRLRLL' },
};
const COUNTS = { 1: [''], 2: ['', '&'], 3: ['', '&', 'a'], 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
const SUB_NAME = { 1: '4 分音符', 2: '8 分音符', 3: '三連音', 4: '16 分音符', 6: '六連音' };
const MODES = ['rud', 'para', 'rand', 'acc', 'poly'];

const MIN_BPM = 30;
const DEFAULTS = {
  mode: 'rud', rSub: 4, rRun: 2, aBase: 'single', aSub: 4,
  reps: 8, autoNext: true, leftLead: false,
  bpm: 70, click: true, clickSub: true, countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 140,
  seenGuide: false, polyMute: 'none', idx: { rud: 0, para: 0, rand: 0, acc: 0, poly: 0 },
};

/* ---------- Storage (best effort) ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const S = Object.assign({}, DEFAULTS, load('sc.settings', {}));
S.idx = Object.assign({}, DEFAULTS.idx, S.idx);
let best = load('sc.best', {});
let randomSheet = load('sc.random', null);

const $ = (s) => document.querySelector(s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function saveSettings() { save('sc.settings', S); }

/* ---------- Building exercise sheets ---------- */
function parse(p) {
  return p.trim().split(/\s+/).map((t) => {
    const m = /^([fd]?)([RL])(>?)$/.exec(t);
    return { h: m[2], acc: !!m[3], g: m[1] === 'f' ? 1 : m[1] === 'd' ? 2 : 0 };
  });
}
function stickString(notes) { return notes.map((n) => n.h).join(''); }

function randomHands(n, maxRun) {
  let out = '', run = 0;
  for (let i = 0; i < n; i++) {
    let h = pick('RL');
    if (out && h === out[out.length - 1] && run >= maxRun) h = h === 'R' ? 'L' : 'R';
    run = out && h === out[out.length - 1] ? run + 1 : 1;
    out += h;
  }
  return out;
}

function makeRandomSheet() {
  const n = S.rSub * 4, seen = new Set(), list = [];
  for (let tries = 0; list.length < 8 && tries < 400; tries++) {
    const h = randomHands(n, S.rRun);
    if (seen.has(h)) continue;
    seen.add(h);
    list.push(h);
  }
  randomSheet = { sub: S.rSub, run: S.rRun, list };
  save('sc.random', randomSheet);
  S.idx.rand = 0;
}

function sheet() {
  if (S.mode === 'rud' || S.mode === 'para') {
    return (S.mode === 'rud' ? RUDIMENTS : PARADIDDLES)
      .map((r) => ({ key: 'rud:' + r.id, name: r.name, sub: r.sub, notes: parse(r.p), en: r.en }));
  }
  if (S.mode === 'poly') {
    return POLYS.map(([a, b]) => {
      const notes = [];
      for (let i = 0; i < a * b; i++) {
        const r = i % b === 0, l = i % a === 0;
        notes.push({ h: r && l ? 'B' : r ? 'R' : l ? 'L' : '-', acc: i === 0, g: 0 });
      }
      return { key: `poly:${a}:${b}`, name: `${a} 對 ${b}`, sub: a, notes, poly: { a, b } };
    });
  }
  if (S.mode === 'rand') {
    if (!randomSheet || randomSheet.sub !== S.rSub || randomSheet.run !== S.rRun) makeRandomSheet();
    return randomSheet.list.map((h, i) => ({
      key: 'rand:' + h, name: `隨機 ${i + 1}`, sub: randomSheet.sub,
      notes: [...h].map((c) => ({ h: c, acc: false, g: 0 })),
    }));
  }
  // Accent moving: the same hand pattern, accent walks through every position.
  const base = ACCENT_BASES[S.aBase].p;
  const unit = Math.max(base.length, S.aSub);
  const total = Math.ceil((S.aSub * 4) / unit) * unit;
  const out = [];
  for (let k = 0; k < unit; k++) {
    const notes = [];
    for (let i = 0; i < total; i++) notes.push({ h: base[i % base.length], acc: i % unit === k, g: 0 });
    const pos = k % S.aSub;
    const beat = Math.floor(k / S.aSub) + 1;
    const where = `${beat}${pos ? ' ' + COUNTS[S.aSub][pos] : ''}`;
    out.push({ key: `acc:${S.aBase}:${S.aSub}:${k}`, name: `重音在「${where}」`, sub: S.aSub, notes });
  }
  return out;
}

let SHEET = [];
let cur = null;      // exercise being shown
let SL = [];         // its notes after the left-lead swap

function swapped(notes) {
  if (!S.leftLead) return notes;
  const swap = { R: 'L', L: 'R', B: 'B', '-': '-' };
  return notes.map((n) => Object.assign({}, n, { h: swap[n.h] }));
}
function exAt(i) { return SHEET[((i % SHEET.length) + SHEET.length) % SHEET.length]; }

/* ---------- Rendering ---------- */
function renderAll() {
  SHEET = sheet();
  S.idx[S.mode] = Math.min(S.idx[S.mode] || 0, SHEET.length - 1);
  renderList();
  showExercise(S.idx[S.mode]);
  renderModeOpts();
}

function showExercise(i) {
  S.idx[S.mode] = ((i % SHEET.length) + SHEET.length) % SHEET.length;
  saveSettings();
  cur = SHEET[S.idx[S.mode]];
  SL = swapped(cur.notes);
  $('#exName').textContent = cur.name;
  $('#exEn').textContent = cur.en ? (cur.en === cur.name ? '' : cur.en) : stickString(SL).replace(/(.{4})/g, '$1 ').trim();
  if (cur.poly) {
    const many = S.leftLead ? '左' : '右', few = S.leftLead ? '右' : '左';
    $('#exEn').textContent = `${many}手平均打 ${cur.poly.a} 下，${few}手同時平均打 ${cur.poly.b} 下`;
    $('#exMeta').textContent = `節拍器跟著${few}手（每拍一下） · 第 ${S.idx[S.mode] + 1} / ${SHEET.length} 個`;
  } else {
    $('#exMeta').textContent = `${SUB_NAME[cur.sub]} · ${cur.notes.length / cur.sub} 拍一循環 · 第 ${S.idx[S.mode] + 1} / ${SHEET.length} 個`;
  }
  renderBest();
  $('#big').hidden = !!cur.poly;
  renderBig();
  renderNotation();
  indexHighlights();
  document.querySelectorAll('.ex').forEach((el) => el.classList.toggle('cur', +el.dataset.i === S.idx[S.mode]));
  setReps(0);
}

function renderBest() {
  const b = best[cur.key];
  $('#exBest').textContent = b ? `最佳 ${b} BPM` : '還沒記錄';
  $('#btnDone').textContent = `✓ 打順了，記錄 ${S.bpm} BPM`;
}

function renderBig() {
  let html = '';
  for (let b = 0; b < SL.length / cur.sub; b++) {
    html += '<span class="bt">';
    for (let k = 0; k < cur.sub; k++) {
      const i = b * cur.sub + k, n = SL[i];
      const g = n.g ? `<sup>${(n.h === 'R' ? 'l' : 'r').repeat(n.g)}</sup>` : '';
      const txt = n.h === 'B' ? '<b class="R">R</b><b class="L">L</b>' : n.h === '-' ? '·' : n.h;
      const cls = n.h === '-' ? 'rest' : n.h;
      html += `<span class="n ${cls}${n.acc && !cur.poly ? ' acc' : ''}" data-i="${i}">${g}${txt}</span>`;
    }
    html += '</span>';
  }
  $('#big').innerHTML = html;
}

// Polyrhythms read better as two lanes than as notation.
function renderLanes() {
  const { a, b } = cur.poly, total = a * b;
  const slotW = Math.max(11, Math.min(30, 330 / total));
  const x0 = 30, W = x0 + total * slotW + 8, H = 120, yR = 34, yL = 74;
  const parts = [];
  for (let i = 0; i < total; i++) {
    const x = x0 + i * slotW;
    parts.push(`<rect class="ph" data-i="${i}" x="${x}" y="10" width="${slotW}" height="${H - 34}" rx="3"/>`);
  }
  parts.push(`<line class="sl" x1="${x0}" x2="${W - 8}" y1="${yR}" y2="${yR}"/><line class="sl" x1="${x0}" x2="${W - 8}" y1="${yL}" y2="${yL}"/>`);
  for (let bt = 0; bt <= b; bt++) {
    const x = x0 + bt * a * slotW;
    parts.push(`<line class="beat" x1="${x}" x2="${x}" y1="14" y2="${H - 28}"/>`);
    if (bt < b) parts.push(`<text class="cnt" x="${x + 3}" y="${H - 12}">${bt + 1}</text>`);
  }
  const r = Math.min(8, slotW * 0.42);
  SL.forEach((n, i) => {
    const cx = x0 + i * slotW + slotW / 2;
    if (n.h === 'R' || n.h === 'B') parts.push(`<circle class="hit R" cx="${cx}" cy="${yR}" r="${r}"/>`);
    if (n.h === 'L' || n.h === 'B') parts.push(`<circle class="hit L" cx="${cx}" cy="${yL}" r="${r}"/>`);
  });
  parts.push(`<text class="stk R" x="10" y="${yR + 4}">R</text><text class="stk L" x="10" y="${yL + 4}">L</text>`);
  $('#notation').innerHTML = `<svg class="staff lanes" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cur.name} 雙手位置圖">${parts.join('')}</svg>`;
}

function renderNotation() {
  if (cur.poly) return renderLanes();
  const sub = cur.sub, beats = SL.length / sub;
  const slotW = { 1: 46, 2: 34, 3: 28, 4: 24, 6: 19 }[sub];
  const beatGap = sub === 1 ? 0 : 10, x0 = 34, line = 70, beamY = 38, H = 122;
  const beatW = sub * slotW + beatGap;
  const W = x0 + beats * beatW + 10;
  const ph = [], body = [];
  for (let bt = 0; bt < beats; bt++) {
    const xs = [];
    for (let k = 0; k < sub; k++) {
      const i = bt * sub + k, n = SL[i];
      const x = x0 + bt * beatW + k * slotW + slotW / 2 + (n.g ? 4 : 0);
      xs.push(x);
      ph.push(`<rect class="ph" data-i="${i}" x="${x0 + bt * beatW + k * slotW}" y="4" width="${slotW}" height="${H - 8}" rx="3"/>`);
      body.push(`<ellipse class="nh" cx="${x}" cy="${line}" rx="4.8" ry="3.5" transform="rotate(-22 ${x} ${line})"/>`);
      body.push(`<line class="st" x1="${x + 4.3}" y1="${line - 1}" x2="${x + 4.3}" y2="${beamY}"/>`);
      for (let gi = 0; gi < n.g; gi++) {
        const gx = x - 11 - (n.g - 1 - gi) * 6;
        body.push(`<ellipse class="nh" cx="${gx}" cy="${line - 1}" rx="2.8" ry="2.1" transform="rotate(-22 ${gx} ${line - 1})"/>`);
        body.push(`<line class="st" x1="${gx + 2.6}" y1="${line - 2}" x2="${gx + 2.6}" y2="${line - 18}"/>`);
      }
      if (n.g === 1) body.push(`<line class="st" x1="${x - 13}" y1="${line - 6}" x2="${x - 6}" y2="${line - 14}"/>`);
      if (n.g === 2) body.push(`<rect class="bm" x="${x - 20}" y="${line - 19}" width="8" height="2"/><rect class="bm" x="${x - 20}" y="${line - 15.5}" width="8" height="2"/>`);
      if (n.acc) body.push(`<path class="ac" d="M${x - 3} ${beamY - 14}L${x + 5} ${beamY - 11}L${x - 3} ${beamY - 8}"/>`);
      body.push(`<text class="stk ${n.h}" x="${x}" y="96" text-anchor="middle">${n.h}</text>`);
      body.push(`<text class="cnt" x="${x}" y="112" text-anchor="middle">${k === 0 ? bt + 1 : COUNTS[sub][k]}</text>`);
    }
    if (sub > 1) {
      const bx1 = xs[0] + 3.7, bx2 = xs[xs.length - 1] + 4.9;
      body.push(`<rect class="bm" x="${bx1}" y="${beamY}" width="${bx2 - bx1}" height="4"/>`);
      if (sub >= 4) body.push(`<rect class="bm" x="${bx1}" y="${beamY + 7}" width="${bx2 - bx1}" height="4"/>`);
      if (sub === 3 || sub === 6) body.push(`<text class="tup" x="${(bx1 + bx2) / 2}" y="14" text-anchor="middle">${sub}</text>`);
    }
  }
  $('#notation').innerHTML =
    `<svg class="staff" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.66)}px" role="img" aria-label="${cur.name} 譜例">` +
    ph.join('') +
    `<line class="sl" x1="6" x2="${W - 4}" y1="${line}" y2="${line}"/>` +
    `<rect class="bl" x="12" y="${line - 8}" width="3" height="16"/><rect class="bl" x="18" y="${line - 8}" width="3" height="16"/>` +
    `<rect class="bl" x="${W - 9}" y="${line - 8}" width="1" height="16"/><rect class="bl" x="${W - 6}" y="${line - 8}" width="3" height="16"/>` +
    body.join('') + '</svg>';
}

function renderList() {
  $('#exList').innerHTML = SHEET.map((ex, i) => {
    const b = best[ex.key];
    const st = ex.poly
      ? swapped(ex.notes).map((n) => (n.h === '-' ? '<b class="rest">·</b>' : n.h === 'B' ? '<b class="B">✕</b>' : `<b class="${n.h}">${n.h}</b>`)).join('')
      : swapped(ex.notes).map((n) => `<b class="${n.h}${n.acc ? ' acc' : ''}">${n.h}</b>`).join('');
    return `<li><button type="button" class="ex" data-i="${i}">
      <span class="ex-main"><span class="ex-name">${ex.name}</span><span class="ex-st">${st}</span></span>
      <span class="ex-best${b ? ' has' : ''}">${b ? b + ' BPM' : '—'}</span>
    </button></li>`;
  }).join('');
}

function renderModeOpts() {
  document.querySelectorAll('.mode-opts').forEach((el) => { el.hidden = el.dataset.mode !== S.mode; });
  $(`#mode-${S.mode}`).checked = true;
  $(`#rSub${S.rSub}`).checked = true;
  $('#rRun').value = S.rRun;
  $('#aBase').value = S.aBase;
  $(`#aSub${S.aSub}`).checked = true;
  $('#polyMute').value = S.polyMute;
}

let hlMap = [], lastHl = -1;
function indexHighlights() {
  hlMap = SL.map(() => []);
  document.querySelectorAll('#big [data-i], #notation .ph[data-i]').forEach((el) => hlMap[+el.dataset.i].push(el));
  lastHl = -1;
}
function highlight(i) {
  if (lastHl >= 0 && hlMap[lastHl]) hlMap[lastHl].forEach((el) => el.classList.remove('on'));
  if (i >= 0 && hlMap[i]) hlMap[i].forEach((el) => el.classList.add('on'));
  lastHl = i;
}
function setReps(n) {
  const total = S.autoNext && S.reps ? ` / ${S.reps}` : '';
  $('#reps').textContent = playing ? `第 ${n + 1}${total} 次` : (S.autoNext && S.reps ? `每個練 ${S.reps} 次` : '重複練同一個');
}

/* ---------- Audio: practice-pad sound, R panned right, L left ---------- */
let ctx = null, master = null, clickBus = null, noiseBuf = null;
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
    master.gain.value = 2.4;
    master.connect(comp).connect(half).connect(clip).connect(ctx.destination);
    clickBus = ctx.createGain();
    clickBus.gain.value = 0.9;
    clickBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}
function out(pan) {
  if (!ctx.createStereoPanner) return master;
  const p = ctx.createStereoPanner();
  p.pan.value = pan;
  p.connect(master);
  return p;
}
function pad(t, hand, amp) {
  const dest = out(hand === 'R' ? 0.35 : -0.35);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 2200;
  f.Q.value = 1.2;
  const g = ctx.createGain();
  g.gain.setValueAtTime(amp, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + 0.09);
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(420, t);
  o.frequency.exponentialRampToValueAtTime(240, t + 0.04);
  const og = ctx.createGain();
  og.gain.setValueAtTime(amp * 0.5, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(og).connect(dest);
  o.start(t);
  o.stop(t + 0.06);
}
// Metronome: the same wood-block click on every beat — no louder or higher first beat.
// Subdivisions (e & a …) use the very same click at a lower level.
// Pitch sweep from Pro Metronome's 木魚 kit, but a filtered square wave held at full level for 25 ms,
// so it stays clearly louder than the drums instead of hiding under them.
const SUB_CLICK = 0.3;   // subdivision clicks: same sound, about 10 dB under the beat
function click(t, level = 1) {
  const o = ctx.createOscillator(), tone = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(1250, t);
  o.frequency.exponentialRampToValueAtTime(875, t + 0.09);
  tone.type = 'lowpass';
  tone.frequency.value = 3500;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.002);
  g.gain.setValueAtTime(level, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(tone).connect(g).connect(clickBus);
  o.start(t);
  o.stop(t + 0.11);
}

/* ---------- Transport ---------- */
let playing = false, step = 0, nextTime = 0, timer = null, countSlots = 0, reps = 0, loops = 0;
let queue = [], wakeLock = null;
let schedEx = null, schedSL = [];   // what the scheduler is playing (can run ahead of the screen)

function scheduleSlot(n, t) {
  const sub = schedEx.sub;
  if (n < 0) {
    const k = n + countSlots;
    if (k % sub === 0) { click(t); queue.push({ t, count: k / sub + 1 }); }
    return;
  }
  let i = n % schedSL.length;
  if (i === 0 && n > 0) {
    reps++;
    loops++;
    if (S.trainer && loops % S.trainerEvery === 0 && S.bpm < S.trainerMax) {
      setBpm(Math.min(S.trainerMax, S.bpm + S.trainerStep));
      queue.push({ t, msg: `加快到 ${S.bpm} BPM` });
    }
    if (S.autoNext && S.reps && reps >= S.reps) {
      reps = 0;
      const nextIdx = (SHEET.indexOf(schedEx) + 1) % SHEET.length;
      schedEx = exAt(nextIdx);
      schedSL = swapped(schedEx.notes);
      step = 0; n = 0; i = 0;
      queue.push({ t, show: nextIdx });
    }
    queue.push({ t, reps });
  }
  const note = schedSL[i];
  const amp = note.acc ? 1 : 0.42;
  if (schedEx.poly) {
    const hit = (h) => { if (S.polyMute !== h) pad(t, h, h === 'R' ? 0.7 : 0.55); };
    if (note.h === 'R' || note.h === 'B') hit('R');
    if (note.h === 'L' || note.h === 'B') hit('L');
  } else {
    if (note.g) {
      const other = note.h === 'R' ? 'L' : 'R';
      for (let k = note.g; k >= 1; k--) pad(t - 0.028 * k, other, 0.16);
    }
    pad(t, note.h, amp);
  }
  if (S.click && i % sub === 0) click(t);
  else if (S.click && S.clickSub && !schedEx.poly) click(t, SUB_CLICK);
  queue.push({ t, i });
}

function tick() {
  while (nextTime < ctx.currentTime + 0.12) {
    scheduleSlot(step, nextTime);
    nextTime += 60 / S.bpm / schedEx.sub;
    step++;
  }
}

function draw() {
  if (!playing) return;
  const now = ctx.currentTime;
  while (queue.length && queue[0].t <= now) {
    const e = queue.shift();
    if (e.show !== undefined) { showExercise(e.show); flash(`下一個：${cur.name}`); }
    else if (e.count !== undefined) $('#status').textContent = `預備 ${e.count}`;
    else if (e.msg) flash(e.msg);
    else if (e.reps !== undefined) setReps(e.reps);
    else {
      if (e.i === 0 && $('#status').textContent.startsWith('預備')) $('#status').textContent = '';
      highlight(e.i);
    }
  }
  requestAnimationFrame(draw);
}

async function play() {
  ensureAudio();
  playing = true;
  schedEx = cur;
  schedSL = SL;
  countSlots = S.countIn ? 4 * cur.sub : 0;
  step = -countSlots;
  reps = 0;
  loops = 0;
  queue = [];
  nextTime = ctx.currentTime + 0.08;
  setReps(0);
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
  setReps(0);
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}
// Jump to another exercise; while playing, restart cleanly on it.
function go(i) {
  showExercise(i);
  if (playing) { stop(); play(); }
}
function setPlayIcon() {
  $('#playIcon').setAttribute('d', playing ? 'M6 5h4.5v14H6zM13.5 5H18v14h-4.5z' : 'M7 4.5v15l13-7.5z');
  $('#btnPlay').setAttribute('aria-label', playing ? '停止' : '播放');
}
function setBpm(v) {
  S.bpm = Math.max(MIN_BPM, Math.min(240, Math.round(v)));
  $('#bpm').value = S.bpm;
  if (document.activeElement !== $('#bpmOut')) $('#bpmOut').value = S.bpm;
  if (cur) $('#btnDone').textContent = `✓ 打順了，記錄 ${S.bpm} BPM`;
  saveSettings();
}

let flashTimer = null;
function flash(msg) {
  $('#status').textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { if ($('#status').textContent === msg) $('#status').textContent = ''; }, 2600);
}

/* ---------- Controls ---------- */
function syncControls() {
  $('#repsSel').value = S.reps;
  $('#autoNext').checked = S.autoNext;
  $('#leftLead').checked = S.leftLead;
  $('#click').checked = S.click;
  $('#clickSub').checked = S.clickSub;
  $('#countIn').checked = S.countIn;
  $('#trainer').checked = S.trainer;
  $('#trainerEvery').value = S.trainerEvery;
  $('#trainerStep').value = S.trainerStep;
  $('#trainerMax').value = S.trainerMax;
  $('#trainerOpts').hidden = !S.trainer;
  $('#guide').hidden = !!S.seenGuide;
  $('#helpBtn').setAttribute('aria-expanded', String(!S.seenGuide));
  setBpm(S.bpm);
}

function bind() {
  $('#btnPlay').addEventListener('click', () => (playing ? stop() : play()));
  $('#btnNext').addEventListener('click', () => go(S.idx[S.mode] + 1));
  $('#btnPrev').addEventListener('click', () => go(S.idx[S.mode] - 1));
  $('#btnNext2').addEventListener('click', () => go(S.idx[S.mode] + 1));
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

  const showGuide = (show) => {
    $('#guide').hidden = !show;
    $('#helpBtn').setAttribute('aria-expanded', String(show));
    if (show) $('#guide').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#helpBtn').addEventListener('click', () => showGuide($('#guide').hidden));
  $('#guideOk').addEventListener('click', () => { S.seenGuide = true; saveSettings(); showGuide(false); });

  $('#btnDone').addEventListener('click', () => {
    const prev = best[cur.key] || 0;
    best[cur.key] = Math.max(prev, S.bpm);
    save('sc.best', best);
    renderBest();
    renderList();
    document.querySelectorAll('.ex').forEach((el) => el.classList.toggle('cur', +el.dataset.i === S.idx[S.mode]));
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  });

  document.querySelectorAll('input[name="mode"]').forEach((el) => el.addEventListener('change', () => {
    if (playing) stop();
    S.mode = el.value;
    saveSettings();
    renderAll();
  }));
  document.querySelectorAll('input[name="rSub"]').forEach((el) => el.addEventListener('change', () => {
    if (playing) stop();
    S.rSub = +el.value; saveSettings(); renderAll();
  }));
  $('#rRun').addEventListener('change', (e) => { if (playing) stop(); S.rRun = +e.target.value; saveSettings(); renderAll(); });
  $('#btnReroll').addEventListener('click', () => { if (playing) stop(); makeRandomSheet(); renderAll(); flash('換了一組新的隨機手順'); });
  $('#polyMute').addEventListener('change', (e) => { S.polyMute = e.target.value; saveSettings(); });
  $('#aBase').addEventListener('change', (e) => { if (playing) stop(); S.aBase = e.target.value; S.idx.acc = 0; saveSettings(); renderAll(); });
  document.querySelectorAll('input[name="aSub"]').forEach((el) => el.addEventListener('change', () => {
    if (playing) stop();
    S.aSub = +el.value; S.idx.acc = 0; saveSettings(); renderAll();
  }));

  $('#exList').addEventListener('click', (e) => {
    const b = e.target.closest('.ex');
    if (!b) return;
    go(+b.dataset.i);
    $('#practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#repsSel').addEventListener('change', (e) => { S.reps = +e.target.value; saveSettings(); setReps(reps); });
  $('#autoNext').addEventListener('change', (e) => { S.autoNext = e.target.checked; saveSettings(); setReps(reps); });
  $('#leftLead').addEventListener('change', (e) => {
    S.leftLead = e.target.checked; saveSettings();
    const was = playing;
    if (was) stop();
    renderList();
    showExercise(S.idx[S.mode]);
    if (was) play();
  });
  $('#click').addEventListener('change', (e) => { S.click = e.target.checked; saveSettings(); });
  $('#clickSub').addEventListener('change', (e) => { S.clickSub = e.target.checked; saveSettings(); });
  $('#countIn').addEventListener('change', (e) => { S.countIn = e.target.checked; saveSettings(); });
  $('#trainer').addEventListener('change', (e) => { S.trainer = e.target.checked; $('#trainerOpts').hidden = !S.trainer; loops = 0; saveSettings(); });
  $('#trainerEvery').addEventListener('change', (e) => { S.trainerEvery = +e.target.value; saveSettings(); });
  $('#trainerStep').addEventListener('change', (e) => { S.trainerStep = +e.target.value; saveSettings(); });
  $('#trainerMax').addEventListener('change', (e) => {
    S.trainerMax = Math.max(30, Math.min(260, +e.target.value || DEFAULTS.trainerMax));
    e.target.value = S.trainerMax;
    saveSettings();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.key === 'ArrowRight') go(S.idx[S.mode] + 1);
    else if (e.key === 'ArrowLeft') go(S.idx[S.mode] - 1);
  });
  document.addEventListener('visibilitychange', async () => {
    if (playing && document.visibilityState === 'visible' && !wakeLock) {
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
    }
  });
}

/* ---------- Boot ---------- */
if (!MODES.includes(S.mode)) S.mode = 'rud';
if (!ACCENT_BASES[S.aBase]) S.aBase = 'single';
syncControls();
bind();
renderAll();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker?.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}
