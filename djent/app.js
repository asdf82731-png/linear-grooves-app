'use strict';

/* ---------- Library ----------
 * Two layers. Top: the cymbal keeps a steady 4/4 pulse (right hand) and the snare sits on a backbeat (left hand).
 * Bottom: the riff — a cell of groups that repeats across the barline, like a djent guitar part.
 * A group is a string, one character per slot: K kick, S snare, . rest.
 * Defaults per exercise: sub (slots per beat), snare ('3' half-time, '24' backbeat, 'riff' snare comes from the riff),
 * pulse ('q' quarters, 'h' halves, 'e' eighths), cym ('china', 'crash', 'ride', 'hh').
 * The kick has no dynamics: every hit is the same level.
 */
const LIB = {
  chug: [
    { id: 'c-332', name: '3-3-2 Chug', en: '3 + 3 + 2 · 一小節剛好兩輪', riff: ['KK.', 'KK.', 'K.'],
      tip: '一小節分成 3+3+2 兩輪，是很多 Djent riff 的骨架。先數清楚「1 e & a」，看每一組從哪裡開始。' },
    { id: 'c-233', name: '2-3-3 Chug', en: '2 + 3 + 3', riff: ['K.', 'KK.', 'KK.'],
      tip: '和 3-3-2 一樣的音，只是換個起點。重拍落在短的那一組，聽起來更往前衝。' },
    { id: 'c-33334', name: '3-3-3-3-4', en: '四組 3 加一組 4 · 湊滿一小節', riff: ['KK.', 'KK.', 'KK.', 'KK.', 'K.KK'],
      tip: '前面四組 3 會「跑掉」，最後一組 4 把它拉回第 1 拍。這是練跨小節之前最好的暖身。' },
    { id: 'c-556', name: '5-5-6', en: '5 + 5 + 6', riff: ['KKK..', 'KKK..', 'KK.KK.'],
      tip: '長一點的分組。休止的地方腳完全放鬆，下一組的第一下才會準。' },
    { id: 'c-16', name: 'Half-time 16 分連續', en: '大鼓 16 分不停 · 小鼓第 3 拍', riff: ['KKKK'],
      tip: '雙踏左右交替不停，第 3 拍小鼓那一下大鼓會讓開。先求兩腳平均，再加速。' },
    { id: 'c-gal', name: 'Gallop Chug', en: 'K – K K · 8 分＋兩個 16 分', riff: ['K.KK'],
      tip: '金屬樂常見的「咚–咚咚」。後面兩下要平均，不要擠在一起。' },
  ],
  odd: [
    { id: 'o-3', name: '3 個一組', en: '3 對 4 · 3 小節接回第 1 拍', riff: ['KK.'],
      tip: '每組的第一下輪流落在 1、a、&、e……上面的鈸一直是 4 分音符，跟著鈸數拍就不會迷路。' },
    { id: 'o-5', name: '5 個一組', en: '5 對 4 · 5 小節接回第 1 拍', riff: ['K.KK.'],
      tip: 'Meshuggah 類型最經典的長度。預設在樂句結尾截斷；想聽它真正接回來，把「樂句結尾」改成「跑完整個循環」。' },
    { id: 'o-7', name: '7 個一組', en: '7 對 4 · 7 小節接回第 1 拍', riff: ['KK.KK..'],
      tip: '7 個音比一拍半多一點，很容易數錯。先慢到每一組的第一下都對得到數拍。' },
    { id: 'o-9', name: '9 個一組', en: '9 對 4', riff: ['KKK.KK.K.'],
      tip: '9 = 一拍加 5 個 16 分音符。每組開頭的位置每次往後挪一格。' },
    { id: 'o-11', name: '11 個一組', en: '11 對 4', riff: ['KK.KK.KKK..'],
      tip: '長分組的重點是記住整句 riff 的形狀，不要一個一個數。' },
    { id: 'o-13', name: '13 個一組', en: '13 對 4', riff: ['KKK.KK.KK.K..'],
      tip: '最長的一組。截斷時你只會聽到它的前段，跑完整個循環要 13 小節。' },
    { id: 'o-57', name: '5 + 7', en: '兩組不同長度 · 12 個音一循環', riff: ['KK.K.', 'KKK.KK.'],
      tip: '一短一長，12 個音剛好是 3 拍，所以 3 小節就會接回第 1 拍。' },
    { id: 'o-335', name: '3 + 3 + 5', en: '11 個音一循環', riff: ['KK.', 'KK.', 'KKK..'],
      tip: '兩組短的接一組長的。聽起來像「切、切、長」，用這個感覺記，不要數。' },
  ],
  snare: [
    { id: 's-kks', name: 'K K S', en: '大鼓兩下＋小鼓 · 3 個一組', riff: ['KKS'], snare: 'riff', cym: 'crash',
      tip: '小鼓也跟著 riff 走，下層手腳輪流（線性）。鈸繼續打 4 分音符，讓你知道拍子在哪。' },
    { id: 's-kskks', name: 'K S K K S', en: '5 個一組', riff: ['KSKKS'], snare: 'riff', cym: 'crash',
      tip: '小鼓在第 2 和第 5 下。左手不要跟著鈸一起打，鈸是右手、小鼓是左手。' },
    { id: 's-kksks', name: 'K K S K S', en: '5 個一組', riff: ['KKSKS'], snare: 'riff', cym: 'crash',
      tip: '和上一個同樣的長度，小鼓位置不同，聽起來完全不一樣。' },
    { id: 's-7', name: 'K K – S K K S', en: '7 個一組', riff: ['KK.SKKS'], snare: 'riff', cym: 'crash',
      tip: '中間的休止讓 riff 有呼吸。休止也要數。' },
    { id: 's-6', name: 'K K S K – S', en: '6 個一組 · 3 小節接回第 1 拍', riff: ['KKSK.S'], snare: 'riff', cym: 'crash',
      tip: '6 個 16 分音符等於一拍半，像三拍子壓在四拍子上面。' },
    { id: 's-34', name: '3 + 4', en: 'K S K  ·  K K S –', riff: ['KSK', 'KKS.'], snare: 'riff', cym: 'crash',
      tip: '兩組不同的形狀接在一起，7 個音一循環。' },
  ],
  sext: [
    { id: 'x-kkk', name: 'K K K 三連踩', en: '六連音 · 每拍前半三連踩', sub: 6, riff: ['KKK...'],
      tip: '三下要平均，像一個「嘟嚕嚕」。後半拍完全休息，讓腳回到起始位置。' },
    { id: 'x-kks', name: 'K K S 三連音 Chug', en: '六連音 · 小鼓跟著 riff', sub: 6, riff: ['KKS'], snare: 'riff', cym: 'crash',
      tip: '三連音感覺的線性 Chug，速度快時聽起來像一串滾奏。' },
    { id: 'x-4', name: '六連音 4 個一組', en: '4 對 6 · 2 拍接回拍點', sub: 6, riff: ['KKK.'],
      tip: '4 個音放在一拍 6 格裡，第二組會從拍子中間開始。跟著鈸數「1 la li & la li」。' },
    { id: 'x-5', name: '六連音 5 個一組', en: '5 對 6 · 5 小節接回第 1 拍', sub: 6, riff: ['KKKK.'],
      tip: '最難的一個：六連音加上奇數分組。先降到很慢，確認每組第一下的位置。' },
  ],
};

// Gospel-chops fills: linear hand/foot cells (R right hand, L left hand, K kick). A fill repeats its cells
// and is right-aligned so it always ends on a complete cell and lands on the next downbeat.
const FILLS = [
  { id: 'f-rlk', name: 'R L K', en: '1 拍 Fill · 3 個一組', cells: ['RLK'], len: 'b1',
    tip: '最基本的 Gospel chops。右手打筒鼓、左手打小鼓、腳踩大鼓，三個肢體輪流，不重疊。' },
  { id: 'f-rlkk', name: 'R L K K', en: '2 拍 Fill · 4 個一組', cells: ['RLKK'], len: 'b2',
    tip: '腳連兩下（雙踏左右各一下）。手的兩下和腳的兩下要一樣平均。' },
  { id: 'f-rlrkk', name: 'R L R K K', en: '1 小節 Fill · 5 個一組', cells: ['RLRKK'], len: 'bar',
    tip: '5 個一組放在 16 分音符上，Fill 本身也會跨拍。從最後一組往回算，結尾一定落在下一小節的第 1 拍。' },
  { id: 'f-sext', name: 'R L R L K K', en: '2 拍 Fill · 六連音', cells: ['RLRLKK'], sub: 6, len: 'b2',
    tip: '經典六連音 Chops：手四下、腳兩下。手的四下可以從高音筒鼓一路往下到落地鼓。' },
  { id: 'f-mix', name: 'R L K + R L R K', en: '1 小節 Fill · 3 + 4', cells: ['RLK', 'RLRK'], len: 'bar',
    tip: '一組 3、一組 4 輪流。先把兩種形狀分開練熟，再接在一起。' },
  { id: 'f-bar', name: '整小節 Chops', en: 'R L R L K · R L K · R L K K', cells: ['RLRLK', 'RLK', 'RLKK'], len: 'bar',
    tip: '三種分組接成一整小節。這種長 Fill 的重點是放鬆，手腳的音量都一樣。' },
];
LIB.fill = FILLS.map((f) => ({
  id: f.id, name: f.name, en: f.en, sub: f.sub || 4, riff: f.sub === 6 ? ['KK.KK.'] : ['K.KK'], fill: f.id, tip: f.tip,
}));

const CATS = ['chug', 'odd', 'snare', 'sext', 'fill'];
const COUNTS = { 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
const SUB_NAME = { 4: '16 分音符', 6: '16 分六連音' };
const INST_NAME = { china: 'China', crash: 'Crash', ride: 'Ride', hh: 'Hi-hat', t1: '中鼓', t2: '中鼓 2', ft: '落地鼓', sn: '小鼓', bd: '大鼓' };
const FILL_LEN_NAME = { b1: '1 拍', b2: '2 拍', bar: '1 小節', none: '' };
// Grid rows, top to bottom. 'gp' is the group bracket row of the riff.
// Both feet share the kick row; the dot colour tells them apart (right green, left purple).
const ROWS = ['cy', 'tm', 'gp', 'sn', 'bd'];
const ROW_NAME = { cy: '鈸', tm: '筒鼓', gp: '分組', sn: '小鼓', bd: '大鼓' };
const PAN = { RH: 0.2, LH: -0.1, RF: 0.35, LF: -0.35 };
const AMP = 0.62;

const MIN_BPM = 30;
const DEFAULTS = {
  cat: 'chug', idx: { chug: 0, odd: 0, snare: 0, sext: 0, fill: 0 },
  basic: false, view: 'staff', phrase: 4, fillLen: 'auto', fillPick: 'rand', end: 'cut',
  sub: 'auto', pulse: 'auto', snare: 'auto', cym: 'auto', pedal: 'double',
  reps: 8, autoNext: false, playPart: 'all', timer: 0,
  bpm: 80, click: true, clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 160,
  seenGuide: false,
};

/* ---------- Storage (best effort) ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const saved = load('dj.settings', {});
const S = Object.assign({}, DEFAULTS, saved);
S.idx = Object.assign({}, DEFAULTS.idx, S.idx);
let best = load('dj.best', {});

const $ = (s) => document.querySelector(s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function saveSettings() { save('dj.settings', S); }

/* ---------- Building a phrase ---------- */
let fillChoice = {};   // exercise id → fill id, when the fill is picked at random

function fillFor(def) {
  if (def.fill) return FILLS.find((f) => f.id === def.fill);
  if (S.fillPick !== 'rand') return FILLS.find((f) => f.id === S.fillPick) || FILLS[0];
  if (!fillChoice[def.id]) fillChoice[def.id] = pick(FILLS).id;
  return FILLS.find((f) => f.id === fillChoice[def.id]);
}
function fillLenFor(def) {
  if (S.fillLen !== 'auto') return S.fillLen;
  return def.fill ? FILLS.find((f) => f.id === def.fill).len : 'bar';
}

// Smallest number of bars, at least `min`, after which a cell of `cell` slots lands back on beat 1.
function fullBars(cell, bar, min) {
  const cycle = cell / gcd(cell, bar);
  return Math.ceil(min / cycle) * cycle;
}

/* Turns a library entry into a playable phrase:
 * { key, name, sub, bar, bars, len, slots: [[{ row, inst, limb }]], grp: [{ n, start, end, ret, cut, alt }], fillFrom, … } */
function build(def, cat) {
  const sub = S.sub === 'auto' ? (def.sub || 4) : +S.sub;
  const bar = 4 * sub;
  const cell = def.riff.join('');
  const starts = [];   // group start offsets within the cell
  def.riff.reduce((o, g) => { starts.push(o); return o + g.length; }, 0);

  const fl = fillLenFor(def);
  const fillSlots = { b1: sub, b2: 2 * sub, bar, none: 0 }[fl];
  const bars = S.end === 'full' ? fullBars(cell.length, bar, S.phrase) : S.phrase;
  const len = bars * bar;
  const fillFrom = len - fillSlots;
  const snare = S.snare === 'auto' ? (def.snare || '3') : S.snare;
  const pulse = S.pulse === 'auto' ? (def.pulse || 'q') : S.pulse;
  const cym = S.basic ? 'hh' : S.cym === 'auto' ? (def.cym || 'china') : S.cym;
  const single = S.pedal === 'single';

  const slots = Array.from({ length: len }, () => []);
  const grp = Array.from({ length: len }, () => null);

  // Top layer: cymbal pulse (stops for the fill), crash on beat 1 when a fill leads back into the phrase.
  const every = pulse === 'h' ? 2 * sub : pulse === 'e' ? sub / 2 : sub;
  for (let i = 0; i < fillFrom; i++) {
    if (i % every) continue;
    const inst = i === 0 && fillSlots && !S.basic ? 'crash' : cym;
    slots[i].push({ row: 'cy', inst, limb: 'RH' });
  }

  // Bottom layer: the riff cell repeats from beat 1 and is cut where the fill starts (or at the end of the phrase).
  const backbeat = (i) => (snare === '3' ? i % bar === 2 * sub : snare === '24' ? i % bar === sub || i % bar === 3 * sub : false);
  let serial = -1, foot = 'R';
  for (let i = 0; i < fillFrom; i++) {
    const p = i % cell.length;
    const gi = starts.indexOf(p);
    if (gi >= 0) {
      serial++;
      foot = 'R';
      const n = def.riff[gi].length;
      grp[i] = { n, start: true, alt: serial % 2, ret: p === 0 && i > 0 && i % bar === 0 && bar % cell.length !== 0, cut: i + n > fillFrom };
    } else {
      grp[i] = { alt: serial % 2 };
    }
    let ch = cell[p];
    if (snare !== 'riff' && ch === 'S') ch = 'K';
    if (backbeat(i)) ch = 'S';
    if (ch === 'S') slots[i].push({ row: 'sn', inst: 'sn', limb: 'LH' });
    else if (ch === 'K') {
      const f = single ? 'R' : foot;
      slots[i].push({ row: 'bd', inst: 'bd', limb: f + 'F' });
      foot = foot === 'R' ? 'L' : 'R';
    }
  }
  for (let i = 0; i < fillFrom; i++) {
    if (grp[i] && (i + 1 === fillFrom || (grp[i + 1] && grp[i + 1].start))) grp[i].end = true;
  }

  // Fill: cells repeated and right-aligned, so the last cell is complete.
  let fill = null;
  if (fillSlots) {
    fill = fillFor(def);
    let seq = '';
    const marks = [];
    for (let c = 0; seq.length < fillSlots; c++) {
      marks.push(seq.length);
      seq += fill.cells[c % fill.cells.length];
    }
    // seq is made of whole cells; its tail ends on a complete cell, and the first one may be cut.
    const drop = seq.length - fillSlots;
    const tail = seq.slice(drop);
    const cellStarts = new Set(marks.map((m) => m - drop).filter((m) => m >= 0));
    let fs = -1, ffoot = 'R';
    for (let k = 0; k < fillSlots; k++) {
      const i = fillFrom + k, c = tail[k];
      if (k === 0 || cellStarts.has(k)) {
        fs++;
        ffoot = 'R';
        let n = 1;
        while (k + n < fillSlots && !cellStarts.has(k + n)) n++;
        grp[i] = { n, start: true, alt: fs % 2, fill: true };
      } else grp[i] = { alt: fs % 2, fill: true };
      const frac = k / fillSlots;
      if (c === 'R') {
        const inst = S.basic ? 'hh' : frac < 1 / 3 ? 't1' : frac < 2 / 3 ? 't2' : 'ft';
        slots[i].push({ row: S.basic ? 'cy' : 'tm', inst, limb: 'RH' });
      } else if (c === 'L') {
        slots[i].push({ row: 'sn', inst: 'sn', limb: 'LH' });
      } else if (c === 'K') {
        const f = single ? 'R' : ffoot;
        slots[i].push({ row: 'bd', inst: 'bd', limb: f + 'F' });
        ffoot = ffoot === 'R' ? 'L' : 'R';
      }
    }
    for (let i = fillFrom; i < len; i++) {
      if (i + 1 === len || grp[i + 1].start) grp[i].end = true;
    }
  }

  return {
    key: def.id, def, cat, name: def.name, en: def.en, tip: def.tip,
    sub, bar, bars, len, cell: cell.length, riff: def.riff, slots, grp, fillFrom, fill, fillLen: fl,
    snare, pulse, cym, cycleBars: cell.length / gcd(cell.length, bar),
  };
}

let SHEET = [];
let cur = null;

function sheet() { return LIB[S.cat].map((d) => build(d, S.cat)); }
function exAt(i) { return SHEET[((i % SHEET.length) + SHEET.length) % SHEET.length]; }

/* ---------- Rendering ---------- */
function riffText(riff) {
  return riff.map((g) => [...g].map((c) => `<b class="${c === '.' ? 'rest' : c}">${c === '.' ? '·' : c}</b>`).join('')).join('<i>|</i>');
}

function renderAll() {
  SHEET = sheet();
  S.idx[S.cat] = Math.min(S.idx[S.cat] || 0, SHEET.length - 1);
  renderList();
  showExercise(S.idx[S.cat]);
  syncCat();
}

function rebuildCurrent() {
  SHEET = sheet();
  cur = SHEET[S.idx[S.cat]];
  showExercise(S.idx[S.cat]);
}

function describe(ex) {
  const parts = [SUB_NAME[ex.sub], `${ex.bars} 小節`];
  parts.push(ex.fill ? `最後 ${FILL_LEN_NAME[ex.fillLen]} Fill` : '沒有 Fill');
  parts.push(`第 ${S.idx[S.cat] + 1} / ${SHEET.length} 個`);
  return parts.join(' · ');
}
function cycleText(ex) {
  const groups = ex.riff.map((g) => g.length).join(' + ');
  const n = ex.riff.length > 1 ? `${groups} = ${ex.cell} 個音一循環` : `${ex.cell} 個音一組`;
  if (ex.bar % ex.cell === 0) return `${n}，每小節都從第 1 拍重新開始。`;
  const back = `要 ${ex.cycleBars} 小節才接回第 1 拍`;
  if (S.end === 'full') return `${n}，${back}，這個樂句跑完整個循環（${ex.bars} 小節）${ex.fill ? '，Fill 蓋掉最後一段' : ''}。`;
  return `${n}，${back}。這個樂句在第 ${ex.bars} 小節${ex.fill ? '的 Fill 前' : '結尾'}截斷（✂），下一輪從頭開始。`;
}

function showExercise(i) {
  S.idx[S.cat] = ((i % SHEET.length) + SHEET.length) % SHEET.length;
  saveSettings();
  cur = SHEET[S.idx[S.cat]];
  $('#exName').textContent = cur.name;
  $('#exEn').textContent = cur.en;
  $('#exMeta').textContent = describe(cur);
  $('#exCycle').textContent = cycleText(cur);
  $('#exTip').textContent = cur.tip || '';
  $('#exFill').innerHTML = cur.fill ? `Fill：<b>${cur.fill.name}</b>${S.basic ? '（基本練習：Hi-hat、小鼓、大鼓）' : '（右手筒鼓、左手小鼓）'}` : '';
  $('#btnFill').hidden = !(cur.fill && !cur.def.fill && S.fillPick === 'rand');
  renderBest();
  renderSheet();
  document.querySelectorAll('.ex').forEach((el) => el.classList.toggle('cur', +el.dataset.i === S.idx[S.cat]));
  setReps(0);
}

function renderBest() {
  const b = best[cur.key];
  $('#exBest').textContent = b ? `最佳 ${b} BPM` : '還沒記錄';
  $('#btnDone').textContent = `✓ 打順了，記錄 ${S.bpm} BPM`;
}

function renderSheet() {
  $('#grid').hidden = S.view !== 'grid';
  $('#staff').hidden = S.view !== 'staff';
  if (S.view === 'grid') renderGrid(); else renderStaff();
  renderLegend();
  indexHighlights();
}

// Rows for one bar: cymbal, groups, snare and kick always; toms only where the fill uses them.
function usedRows(ex, b) {
  const used = new Set(['cy', 'gp', 'sn', 'bd']);
  ex.slots.slice(b * ex.bar, (b + 1) * ex.bar).forEach((s) => s.forEach((h) => used.add(h.row)));
  return ROWS.filter((r) => used.has(r));
}

function rowLabel(ex, r) {
  if (r === 'cy') return `${ROW_NAME.cy}<small>${INST_NAME[ex.cym]}</small>`;
  if (r === 'bd') return `${ROW_NAME.bd}<small>${S.pedal === 'single' ? '右腳' : '<em class="fR">右</em><em class="fL">左</em>腳'}</small>`;
  return ROW_NAME[r];
}

// Kit grid: one bar per row of the page, so beat 1 of every bar lines up on the left
// and you can see each group's start drift to the right.
function renderGrid() {
  const ex = cur;
  let html = '';
  for (let b = 0; b < ex.bars; b++) {
    const rows = usedRows(ex, b);
    html += `<div class="ksys" data-bar="${b}">`;
    for (const r of rows) {
      html += `<div class="kr ${r}"><span class="kl">${rowLabel(ex, r)}</span>`;
      for (let bt = 0; bt < 4; bt++) {
        html += '<span class="kb">';
        for (let k = 0; k < ex.sub; k++) {
          const i = b * ex.bar + bt * ex.sub + k;
          const fill = i >= ex.fillFrom ? ' fill' : '';
          if (r === 'gp') {
            const g = ex.grp[i];
            const cls = ['gc', g.alt ? 'alt' : '', g.start ? 's' : '', g.end ? 'e' : '', g.fill ? 'f' : ''].join(' ');
            const txt = g.start ? `${g.ret ? '↺' : ''}${g.n}${g.cut ? '✂' : ''}` : '';
            const title = g.ret ? ' title="接回第 1 拍"' : g.cut ? ' title="截斷"' : '';
            html += `<span class="kc${fill}" data-i="${i}"><span class="${cls}"${title}>${txt}</span></span>`;
          } else {
            const h = ex.slots[i].find((x) => x.row === r);
            html += `<span class="kc${fill}" data-i="${i}">${h ? `<i class="hit ${h.inst} ${h.limb}"></i>` : ''}</span>`;
          }
        }
        html += '</span>';
      }
      html += '</div>';
    }
    // Counting row; sextuplets keep just the beat and the "&".
    html += `<div class="kr cnt"><span class="kl">第 ${b + 1} 小節</span>`;
    for (let bt = 0; bt < 4; bt++) {
      html += '<span class="kb">';
      for (let k = 0; k < ex.sub; k++) {
        const c = k === 0 ? bt + 1 : ex.sub === 6 ? (k === 3 ? '&' : '') : COUNTS[4][k];
        html += `<span class="kc">${c}</span>`;
      }
      html += '</span>';
    }
    html += '</div></div>';
  }
  const grid = $('#grid');
  grid.style.setProperty('--slots', ex.bar);
  grid.classList.toggle('dense', ex.sub >= 6);
  grid.innerHTML = html;
  grid.setAttribute('aria-label', `${ex.name}：${ex.bars} 小節`);
}

// Staff positions: offset from the top staff line in px (half a staff space = 4).
const STAFF_Y = { china: -12, crash: -8, hh: -4, ride: 0, t1: 4, t2: 8, sn: 12, ft: 20, bd: 28 };
const CYMBALS = new Set(['china', 'crash', 'hh', 'ride']);

function renderStaff() {
  const ex = cur;
  const slotW = ex.sub === 6 ? 16 : 22, beatGap = 10, top = 52, H = 140, beamY = 22;
  const beatW = ex.sub * slotW + beatGap;
  let html = '';
  for (let b = 0; b < ex.bars; b++) {
    const x0 = b === 0 ? 54 : 22;
    const W = x0 + 4 * beatW + 8;
    const slotX = (k) => x0 + Math.floor(k / ex.sub) * beatW + (k % ex.sub) * slotW + slotW / 2;
    const ph = [], body = [], beams = [];
    for (let bt = 0; bt < 4; bt++) {
      const xs = [];
      for (let k = 0; k < ex.sub; k++) {
        const kk = bt * ex.sub + k, i = b * ex.bar + kk, x = slotX(kk);
        const fill = i >= ex.fillFrom ? ' fill' : '';
        ph.push(`<rect class="ph${fill}" data-i="${i}" x="${x - slotW / 2}" y="4" width="${slotW}" height="${H - 8}" rx="3"/>`);
        const hits = ex.slots[i];
        if (hits.length) {
          xs.push(x);
          let low = -99;
          for (const h of hits) {
            const y = top + STAFF_Y[h.inst];
            low = Math.max(low, y);
            if (y <= top - 8) body.push(`<line class="sl" x1="${x - 7}" x2="${x + 7}" y1="${top - 8}" y2="${top - 8}"/>`);
            if (CYMBALS.has(h.inst)) {
              body.push(`<path class="xh" d="M${x - 3.6} ${y - 3.6}L${x + 3.6} ${y + 3.6}M${x - 3.6} ${y + 3.6}L${x + 3.6} ${y - 3.6}"/>`);
              if (h.inst === 'china') body.push(`<circle class="xo" cx="${x}" cy="${y}" r="5.4"/>`);
            } else {
              body.push(`<ellipse class="nh" cx="${x}" cy="${y}" rx="4.7" ry="3.4" transform="rotate(-22 ${x} ${y})"/>`);
            }
          }
          body.push(`<line class="st" x1="${x + 4.2}" y1="${low - 1}" x2="${x + 4.2}" y2="${beamY}"/>`);
          // One letter per slot for the bottom layer: feet R/L, snare S, fill hands R/L.
          const low1 = hits.find((h) => h.row === 'bd');
          const hand = hits.find((h) => h.row === 'tm' || (h.row === 'sn') || (h.row === 'cy' && i >= ex.fillFrom));
          if (low1) body.push(`<text class="stk ${low1.limb}" x="${x}" y="104" text-anchor="middle">${low1.limb[0]}</text>`);
          else if (hand) body.push(`<text class="stk ${hand.limb}" x="${x}" y="104" text-anchor="middle">${hand.row === 'sn' && i < ex.fillFrom ? 'S' : hand.limb[0]}</text>`);
        }
        body.push(`<text class="cnt" x="${x}" y="134" text-anchor="middle">${k === 0 ? bt + 1 : ex.sub === 6 ? (k === 3 ? '&' : '') : COUNTS[4][k]}</text>`);
      }
      if (xs.length) {
        const bx1 = xs[0] + 3.6, bx2 = xs.length > 1 ? xs[xs.length - 1] + 4.8 : xs[0] + 11;
        beams.push(`<rect class="bm" x="${bx1}" y="${beamY}" width="${bx2 - bx1}" height="4"/>`);
        beams.push(`<rect class="bm" x="${bx1}" y="${beamY + 7}" width="${bx2 - bx1}" height="4"/>`);
        if (ex.sub === 6) beams.push(`<text class="tup" x="${(bx1 + bx2) / 2}" y="14" text-anchor="middle">6</text>`);
      }
    }
    // Group brackets under the letters, with ↺ (back on beat 1) and ✂ (cut) markers.
    for (let k = 0; k < ex.bar; k++) {
      const i = b * ex.bar + k, g = ex.grp[i];
      if (!g.start) continue;
      let e = k;
      while (e + 1 < ex.bar && !ex.grp[i + (e - k) + 1].start) e++;
      body.push(`<line class="gb${g.alt ? ' alt' : ''}${g.fill ? ' f' : ''}" x1="${slotX(k) - 7}" y1="114" x2="${slotX(e) + 7}" y2="114"/>`);
      const mark = `${g.ret ? '↺ ' : ''}${g.n}${g.cut ? ' ✂' : ''}`;
      body.push(`<text class="gn" x="${slotX(k) - 6}" y="124">${mark}</text>`);
    }
    let s = `<svg class="staff" data-bar="${b}" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.7)}px" role="img" aria-label="第 ${b + 1} 小節譜例">`;
    s += ph.join('');
    for (let l = 0; l < 5; l++) s += `<line class="sl" x1="6" x2="${W - 4}" y1="${top + l * 8}" y2="${top + l * 8}"/>`;
    s += `<rect class="bl" x="6" y="${top}" width="1" height="32"/>`;
    if (b === 0) {
      s += `<rect class="bl" x="12" y="${top + 8}" width="3.5" height="16"/><rect class="bl" x="19" y="${top + 8}" width="3.5" height="16"/>`;
      s += `<text class="ts" x="38" y="${top + 15}" text-anchor="middle">4</text><text class="ts" x="38" y="${top + 31}" text-anchor="middle">4</text>`;
    }
    s += `<text class="bnum" x="8" y="${top - 16}">${b + 1}</text>`;
    s += b === ex.bars - 1
      ? `<rect class="bl" x="${W - 10}" y="${top}" width="1" height="32"/><rect class="bl" x="${W - 7}" y="${top}" width="3.5" height="32"/>`
      : `<rect class="bl" x="${W - 5}" y="${top}" width="1" height="32"/>`;
    s += beams.join('') + body.join('') + '</svg>';
    html += s;
  }
  $('#staff').innerHTML = html;
}

function renderLegend() {
  const used = new Set();
  cur.slots.forEach((s) => s.forEach((h) => used.add(h.limb)));
  const names = { RH: '右手', LH: '左手', RF: '右腳', LF: '左腳' };
  $('#legend').innerHTML = ['RH', 'LH', 'RF', 'LF'].filter((l) => used.has(l))
    .map((l) => `<span><i class="dot ${l}"></i>${names[l]}</span>`).join('') +
    '<span class="lg-note">↺ 接回第 1 拍　✂ 截斷</span>';
}

function renderList() {
  $('#exList').innerHTML = SHEET.map((ex, i) => {
    const b = best[ex.key];
    const st = ex.def.fill ? riffText(FILLS.find((f) => f.id === ex.def.fill).cells) : riffText(ex.riff);
    return `<li><button type="button" class="ex" data-i="${i}">
      <span class="ex-main"><span class="ex-name">${ex.name}</span><span class="ex-st">${st}</span></span>
      <span class="ex-best${b ? ' has' : ''}">${b ? b + ' BPM' : '—'}</span>
    </button></li>`;
  }).join('');
}

function syncCat() {
  $(`#cat-${S.cat}`).checked = true;
  document.querySelectorAll('.mode-opts').forEach((el) => { el.hidden = el.dataset.cat !== S.cat; });
}

let hlMap = [], lastHl = -1, barEls = [];
function indexHighlights() {
  hlMap = Array.from({ length: cur.len }, () => []);
  const box = S.view === 'grid' ? '#grid' : '#staff';
  document.querySelectorAll(`${box} [data-i]`).forEach((el) => hlMap[+el.dataset.i].push(el));
  barEls = [...document.querySelectorAll(`${box} [data-bar]`)];
  lastHl = -1;
}
function highlight(i) {
  if (lastHl >= 0 && hlMap[lastHl]) hlMap[lastHl].forEach((el) => el.classList.remove('on'));
  if (i >= 0 && hlMap[i]) hlMap[i].forEach((el) => el.classList.add('on'));
  lastHl = i;
  // Keep the bar being played on screen.
  if (i >= 0 && i % cur.bar === 0) {
    const el = barEls[i / cur.bar];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
function setReps(n) {
  const total = S.autoNext && S.reps ? ` / ${S.reps}` : '';
  let txt = playing ? `第 ${n + 1}${total} 次` : (S.autoNext && S.reps ? `每個練 ${S.reps} 次` : '重複練同一個');
  if (playing && S.timer) {
    const left = Math.max(0, Math.ceil(S.timer * 60 - (performance.now() - startedAt) / 1000));
    txt += ` · 剩 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  }
  $('#reps').textContent = txt;
}

/* ---------- Audio: synthesized kit, no samples ---------- */
let ctx = null, master = null, clickBus = null, noiseBuf = null;
function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Same chain as the other apps: boost, a limiter that only touches the loudest peaks,
    // then a soft clipper that rounds off anything the limiter lets through.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = 0;
    comp.knee.value = 0;
    comp.ratio.value = 20;
    comp.attack.value = 0;
    comp.release.value = 0.05;
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
    master.gain.value = 2.6;
    master.connect(comp).connect(half).connect(clip).connect(ctx.destination);
    clickBus = ctx.createGain();
    clickBus.gain.value = 0.9;
    clickBus.connect(comp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
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
function env(node, t, amp, dur) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(Math.max(0.0001, amp), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  node.connect(g);
  return g;
}
function noise(t, dur, type, freq, q) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (q) f.Q.value = q;
  src.connect(f);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
  return f;
}
function tone(t, dur, type, f0, f1) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  o.start(t);
  o.stop(t + dur + 0.02);
  return o;
}
function hit(inst, t, amp, pan) {
  const dest = out(pan);
  if (inst === 'bd') {
    // Tight metal kick: short body plus a click so fast doubles stay clear.
    env(tone(t, 0.2, 'sine', 130, 48), t, amp * 1.15, 0.2).connect(dest);
    env(noise(t, 0.015, 'highpass', 2500), t, amp * 0.35, 0.015).connect(dest);
  } else if (inst === 'sn') {
    env(noise(t, 0.18, 'bandpass', 1900, 0.8), t, amp * 0.85, 0.18).connect(dest);
    env(tone(t, 0.08, 'triangle', 220, 170), t, amp * 0.5, 0.08).connect(dest);
  } else if (inst === 'hh') {
    env(noise(t, 0.05, 'highpass', 7500), t, amp * 0.45, 0.05).connect(dest);
  } else if (inst === 'ride') {
    env(noise(t, 0.4, 'highpass', 5200), t, amp * 0.22, 0.4).connect(dest);
    env(tone(t, 0.3, 'square', 760), t, amp * 0.035, 0.3).connect(dest);
    env(tone(t, 0.3, 'square', 1140), t, amp * 0.025, 0.3).connect(dest);
  } else if (inst === 'crash') {
    // Bright wash with a fast attack.
    env(noise(t, 1.1, 'highpass', 4200), t, amp * 0.34, 1.1).connect(dest);
    env(noise(t, 0.5, 'bandpass', 3000, 0.6), t, amp * 0.18, 0.5).connect(dest);
  } else if (inst === 'china') {
    // Trashy and shorter than a crash: a mid-band noise burst plus clashing square partials.
    env(noise(t, 0.55, 'bandpass', 2600, 0.9), t, amp * 0.42, 0.55).connect(dest);
    env(noise(t, 0.35, 'highpass', 6000), t, amp * 0.16, 0.35).connect(dest);
    for (const [f, a] of [[523, 0.03], [787, 0.025], [1171, 0.02]]) env(tone(t, 0.4, 'square', f), t, amp * a, 0.4).connect(dest);
  } else if (inst === 't1' || inst === 't2' || inst === 'ft') {
    const [f0, f1, d] = { t1: [230, 155, 0.28], t2: [175, 118, 0.32], ft: [125, 82, 0.4] }[inst];
    env(tone(t, d, 'sine', f0, f1), t, amp * 0.95, d).connect(dest);
    env(noise(t, 0.02, 'bandpass', 1300, 1), t, amp * 0.18, 0.02).connect(dest);
  }
}
// Metronome: the same wood-block click on every beat (see PROJECT_BACKGROUND §5).
const SUB_CLICK = 0.3;
function click(t, level = 1) {
  const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(1250, t);
  o.frequency.exponentialRampToValueAtTime(875, t + 0.09);
  lp.type = 'lowpass';
  lp.frequency.value = 3500;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.002);
  g.gain.setValueAtTime(level, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(lp).connect(g).connect(clickBus);
  o.start(t);
  o.stop(t + 0.11);
}
function audible(limb) {
  if (S.playPart === 'all') return true;
  if (S.playPart === 'none') return false;
  return S.playPart === 'hands' ? limb[1] === 'H' : limb[1] === 'F';
}

/* ---------- Transport ---------- */
let playing = false, step = 0, nextTime = 0, timer = null, countSlots = 0, reps = 0, loops = 0, startedAt = 0;
let queue = [], wakeLock = null, schedEx = null;

function scheduleSlot(n, t) {
  const sub = schedEx.sub;
  if (n < 0) {
    const k = n + countSlots;
    if (k % sub === 0) { click(t); queue.push({ t, count: k / sub + 1 }); }
    return;
  }
  let i = n % schedEx.len;
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
      step = 0; n = 0; i = 0;
      queue.push({ t, show: nextIdx });
    }
    queue.push({ t, reps });
  }
  for (const h of schedEx.slots[i]) if (audible(h.limb)) hit(h.inst, t, AMP, PAN[h.limb]);
  if (S.click && i % sub === 0) click(t);
  else if (S.click && S.clickSub !== 'off') click(t, S.clickSub === 'same' ? 1 : SUB_CLICK);
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
  if (S.timer && performance.now() - startedAt >= S.timer * 60000) {
    stop();
    flash(`時間到！練了 ${S.timer} 分鐘`);
    return;
  }
  const now = ctx.currentTime;
  while (queue.length && queue[0].t <= now) {
    const e = queue.shift();
    if (e.show !== undefined) { showExercise(e.show); flash(`下一個：${cur.name}`); }
    else if (e.count !== undefined) $('#status').textContent = `預備 ${e.count}`;
    else if (e.msg) flash(e.msg);
    else if (e.reps !== undefined) setReps(e.reps);
    else {
      if (e.i === 0 && $('#status').textContent.startsWith('預備')) $('#status').textContent = '';
      if (e.i % schedEx.sub === 0 && S.timer) setReps(reps);
      highlight(e.i);
    }
  }
  requestAnimationFrame(draw);
}

async function play() {
  ensureAudio();
  playing = true;
  schedEx = cur;
  countSlots = S.countIn ? 4 * cur.sub : 0;
  step = -countSlots;
  reps = 0;
  loops = 0;
  queue = [];
  startedAt = performance.now();
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
function go(i) {
  showExercise(i);
  if (playing) { stop(); play(); }
}
// Settings that change the phrase: rebuild it, and keep playing on the new one.
function reshape(fn) {
  const was = playing;
  if (was) stop();
  fn();
  saveSettings();
  rebuildCurrent();
  syncControls();
  if (was) play();
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
const SELECTS = ['view', 'fillLen', 'fillPick', 'end', 'sub', 'pulse', 'snare', 'cym', 'playPart'];

function syncControls() {
  for (const k of SELECTS) $(`#${k}`).value = String(S[k]);
  $(`#phrase${S.phrase}`).checked = true;
  $(S.pedal === 'single' ? '#pedalSingle' : '#pedalDouble').checked = true;
  $('#basic').checked = S.basic;
  $('#cym').disabled = S.basic;
  $('#cymNote').hidden = !S.basic;
  $('#fillPick').disabled = S.cat === 'fill' || S.fillLen === 'none';
  $('#phraseNote').hidden = S.end !== 'full';
  document.body.classList.toggle('basic', S.basic);
  $('#repsSel').value = S.reps;
  $('#autoNext').checked = S.autoNext;
  $('#timerSel').value = S.timer;
  $('#click').checked = S.click;
  $('#clickSub').value = S.clickSub;
  $('#countIn').checked = S.countIn;
  $('#trainer').checked = S.trainer;
  $('#trainerEvery').value = S.trainerEvery;
  $('#trainerStep').value = S.trainerStep;
  $('#trainerMax').value = S.trainerMax;
  $('#trainerOpts').hidden = !S.trainer;
  setBpm(S.bpm);
}

function bind() {
  $('#btnPlay').addEventListener('click', () => (playing ? stop() : play()));
  $('#btnNext').addEventListener('click', () => go(S.idx[S.cat] + 1));
  $('#btnPrev').addEventListener('click', () => go(S.idx[S.cat] - 1));
  $('#btnNext2').addEventListener('click', () => go(S.idx[S.cat] + 1));
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
    save('dj.best', best);
    renderBest();
    renderList();
    document.querySelectorAll('.ex').forEach((el) => el.classList.toggle('cur', +el.dataset.i === S.idx[S.cat]));
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  });

  document.querySelectorAll('input[name="cat"]').forEach((el) => el.addEventListener('change', () => {
    if (playing) stop();
    S.cat = el.value;
    saveSettings();
    renderAll();
    syncControls();
  }));
  $('#exList').addEventListener('click', (e) => {
    const b = e.target.closest('.ex');
    if (!b) return;
    go(+b.dataset.i);
    $('#practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Groove settings: each one rebuilds the phrase.
  $('#basic').addEventListener('change', (e) => reshape(() => { S.basic = e.target.checked; }));
  $('#view').addEventListener('change', (e) => { S.view = e.target.value; saveSettings(); renderSheet(); });
  for (const k of ['fillLen', 'fillPick', 'end', 'sub', 'pulse', 'snare', 'cym']) {
    $(`#${k}`).addEventListener('change', (e) => reshape(() => { S[k] = e.target.value; }));
  }
  document.querySelectorAll('input[name="phrase"]').forEach((el) => el.addEventListener('change', () => reshape(() => { S.phrase = +el.value; })));
  document.querySelectorAll('input[name="pedal"]').forEach((el) => el.addEventListener('change', () => reshape(() => { S.pedal = el.value; })));
  $('#btnFill').addEventListener('click', () => reshape(() => {
    const now = fillChoice[cur.key];
    fillChoice[cur.key] = pick(FILLS.filter((f) => f.id !== now)).id;
  }));
  $('#btnReset').addEventListener('click', () => reshape(() => {
    Object.assign(S, { sub: 'auto', pulse: 'auto', snare: 'auto', cym: 'auto' });
    flash('上層打法回到練習預設');
  }));

  $('#playPart').addEventListener('change', (e) => { S.playPart = e.target.value; saveSettings(); });
  $('#timerSel').addEventListener('change', (e) => { S.timer = +e.target.value; startedAt = performance.now(); saveSettings(); setReps(reps); });
  $('#repsSel').addEventListener('change', (e) => { S.reps = +e.target.value; saveSettings(); setReps(reps); });
  $('#autoNext').addEventListener('change', (e) => { S.autoNext = e.target.checked; saveSettings(); setReps(reps); });
  $('#click').addEventListener('change', (e) => { S.click = e.target.checked; saveSettings(); });
  $('#clickSub').addEventListener('change', (e) => { S.clickSub = e.target.value; saveSettings(); });
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
    else if (e.key === 'ArrowRight') go(S.idx[S.cat] + 1);
    else if (e.key === 'ArrowLeft') go(S.idx[S.cat] - 1);
  });
  document.addEventListener('visibilitychange', async () => {
    if (playing && document.visibilityState === 'visible' && !wakeLock) {
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
    }
  });
}

/* ---------- Boot ---------- */
// v2: the staff became the default view; switch settings saved before that over once.
if (saved.v !== 2) { S.view = 'staff'; S.v = 2; }
if (!CATS.includes(S.cat)) S.cat = 'chug';
if (![2, 4, 8].includes(S.phrase)) S.phrase = 4;
if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = 'soft';
if (S.fillPick !== 'rand' && !FILLS.some((f) => f.id === S.fillPick)) S.fillPick = 'rand';
$('#guide').hidden = !!S.seenGuide;
$('#helpBtn').setAttribute('aria-expanded', String(!S.seenGuide));
$('#fillPick').insertAdjacentHTML('beforeend', FILLS.map((f) => `<option value="${f.id}">${f.name}</option>`).join(''));
syncControls();
bind();
renderAll();
syncControls();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker?.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}
