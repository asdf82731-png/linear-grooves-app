// Djent library, phrase builder and the staff / grid renderers (moved from the old app.js; S is the settings object).

/* ---------- Library ----------
 * Two layers. Top: the cymbal keeps a steady 4/4 pulse (right hand) and the snare sits on a backbeat (left hand).
 * Bottom: the riff — a cell of groups that repeats across the barline, like a djent guitar part.
 * A group is a string, one character per slot: K kick, S snare, g ghost note on the snare, . rest.
 * Defaults per exercise: sub (slots per beat), snare ('3' half-time, '24' backbeat, 'riff' snare comes from the riff),
 * pulse ('q' quarters, 'h' halves, 'e' eighths), cym ('ride' by default, 'crash', 'china', 'hh').
 * The kick has no dynamics: every hit is the same level. Only the ghost-note grooves use snare dynamics
 * (ghost / normal / accented backbeat) and a lighter hi-hat between the beats.
 */
export const LIB = {
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

// Ghost-note grooves: half-time, accented snare on 3, quiet snare notes in between (Sleep Token verses, R&B).
LIB.ghost = [
  { id: 'g-1', name: 'Ghost note 入門', en: '第 3 拍前後各一個 Ghost', riff: ['K......g.....g..'],
    tip: 'Ghost note 很輕，棒子離鼓皮只有 1～2 公分；第 3 拍的重音要打出來。兩種音量差越多，律動越有層次。' },
  { id: 'g-2', name: 'Ghost 夾在大鼓之間', en: 'K – g K  · – – g –', riff: ['K.gK..g.....g.K.'],
    tip: '大鼓和 Ghost note 輪流，同一時間只有一個鼓。手放鬆，讓 Ghost 自然地落下去就好。' },
  { id: 'g-3', name: '16 分 Hi-hat＋Ghost', en: 'Hi-hat 16 分 · Ghost 在 e 和 a', riff: ['K..g.gK......g.g'], pulse: 's',
    tip: '右手 Hi-hat 打 16 分，拍點稍微重一點。左手的 Ghost 和右手錯開，不要被右手帶著一起變大聲。' },
  { id: 'g-4', name: 'Ghost 串', en: '連續兩個 Ghost note', riff: ['K.gg.gK...g.gg.K'],
    tip: '兩個 Ghost 連在一起像「嘟嚕」，用手指和手腕的回彈，不要用手臂出力。' },
  { id: 'g-5', name: 'R&B Half-time', en: '大鼓在 a · Ghost 在 &', riff: ['K..K..g...gK.g..'],
    tip: '慢一點更有感覺（70～90 BPM）。大鼓落在「a」，要準，不要搶拍。' },
  { id: 'g-6', name: '雙踏＋Ghost', en: '大鼓兩連下 · Ghost 補空', riff: ['KK.gKK.g...gKKg.'],
    tip: '腳兩連下（右左），手只補一個很輕的 Ghost。先關掉 Ghost 只練腳，再加回來。' },
  { id: 'g-7', name: '5 個一組 Ghost riff', en: 'K g K – g · 跨小節', riff: ['KgK.g'],
    tip: '把 Ghost note 放進 Djent 的奇數分組裡。每組的第一下是大鼓，跟著鈸數拍就不會迷路。' },
  { id: 'g-8', name: '7 個一組 Ghost riff', en: 'K K – g K – g · 跨小節', riff: ['KK.gK.g'],
    tip: '7 個一組，Ghost note 也跟著每小節換位置。小鼓第 3 拍的重音永遠不動。' },
].map((d) => Object.assign(d, { cym: 'hh', pulse: d.pulse || 'e', dyn: true }));

// Gospel-chops fills: linear hand/foot cells (R right hand, L left hand, K kick). A fill repeats its cells
// and is right-aligned so it always ends on a complete cell and lands on the next downbeat.
export const FILLS = [
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

export const CATS = ['chug', 'odd', 'snare', 'sext', 'ghost', 'fill'];
export const COUNTS = { 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
export const SUB_NAME = { 4: '16 分音符', 6: '16 分六連音' };
export const INST_NAME = { china: 'China', crash: 'Crash', ride: 'Ride', hh: 'Hi-hat', t1: '中鼓', t2: '中鼓 2', ft: '落地鼓', sn: '小鼓', bd: '大鼓' };
export const FILL_LEN_NAME = { b1: '1 拍', b2: '2 拍', bar: '1 小節', none: '' };
// Grid rows, top to bottom. 'gp' is the group bracket row of the riff.
// Both feet share the kick row; the dot colour tells them apart (right green, left purple).
export const ROWS = ['cy', 'tm', 'gp', 'sn', 'bd'];
export const ROW_NAME = { cy: '鈸', tm: '筒鼓', gp: '分組', sn: '小鼓', bd: '大鼓' };
export const PAN = { RH: 0.2, LH: -0.1, RF: 0.35, LF: -0.35 };
export const AMP = 0.62;
// Levels for the ghost-note grooves: g ghost, a accented backbeat, s hi-hat between the beats.
export const LEVEL = { g: 0.28, a: 1.45, s: 0.7 };

export const pick = (a) => a[Math.floor(Math.random() * a.length)];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

function fillFor(def, S, fillChoice) {
  if (def.fill) return FILLS.find((f) => f.id === def.fill);
  if (S.fillPick !== 'rand') return FILLS.find((f) => f.id === S.fillPick) || FILLS[0];
  if (!fillChoice[def.id]) fillChoice[def.id] = pick(FILLS).id;
  return FILLS.find((f) => f.id === fillChoice[def.id]);
}
function fillLenFor(def, S) {
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
// fillChoice: exercise id → fill id, when the fill is picked at random (kept across rebuilds by the caller)
export function build(def, cat, S, fillChoice) {
  const sub = S.sub === 'auto' ? (def.sub || 4) : +S.sub;
  const bar = 4 * sub;
  const cell = def.riff.join('');
  const starts = [];   // group start offsets within the cell
  def.riff.reduce((o, g) => { starts.push(o); return o + g.length; }, 0);

  const fl = fillLenFor(def, S);
  const fillSlots = { b1: sub, b2: 2 * sub, bar, none: 0 }[fl];
  const bars = S.end === 'full' ? fullBars(cell.length, bar, S.phrase) : S.phrase;
  const len = bars * bar;
  const fillFrom = len - fillSlots;
  const snare = S.snare === 'auto' ? (def.snare || '3') : S.snare;
  const pulse = S.pulse === 'auto' ? (def.pulse || 'q') : S.pulse;
  // Ride by default: the synthesized china was too harsh to play along with on every beat.
  const cym = S.basic ? 'hh' : S.cym === 'auto' ? (def.cym || 'ride') : S.cym;
  const single = S.pedal === 'single';

  const slots = Array.from({ length: len }, () => []);
  const grp = Array.from({ length: len }, () => null);

  // Top layer: cymbal pulse (stops for the fill), crash on beat 1 when a fill leads back into the phrase.
  const every = pulse === 'h' ? 2 * sub : pulse === 'e' ? sub / 2 : pulse === 's' ? 1 : sub;
  for (let i = 0; i < fillFrom; i++) {
    if (i % every) continue;
    const inst = i === 0 && fillSlots && !S.basic ? 'crash' : cym;
    slots[i].push({ row: 'cy', inst, limb: 'RH', lvl: def.dyn && i % sub ? 's' : undefined });
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
    const bb = backbeat(i);
    if (bb) ch = 'S';
    if (ch === 'S') slots[i].push({ row: 'sn', inst: 'sn', limb: 'LH', lvl: def.dyn && bb ? 'a' : undefined });
    else if (ch === 'g') slots[i].push({ row: 'sn', inst: 'sn', limb: 'LH', lvl: 'g' });
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
    fill = fillFor(def, S, fillChoice);
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

// Riff as coloured letters (HTML) for the exercise list.
export function riffText(riff) {
  return riff.map((g) => [...g].map((c) => `<b class="${c === '.' ? 'rest' : c}">${c === '.' ? '·' : c === 'g' ? '(S)' : c}</b>`).join('')).join('<i>|</i>');
}

export function describe(ex, S, idx, n) {
  const parts = [SUB_NAME[ex.sub], `${ex.bars} 小節`];
  parts.push(ex.fill ? `最後 ${FILL_LEN_NAME[ex.fillLen]} Fill` : '沒有 Fill');
  parts.push(`第 ${idx + 1} / ${n} 個`);
  return parts.join(' · ');
}
export function cycleText(ex, S) {
  const groups = ex.riff.map((g) => g.length).join(' + ');
  const n = ex.riff.length > 1 ? `${groups} = ${ex.cell} 個音一循環` : `${ex.cell} 個音一組`;
  if (ex.bar % ex.cell === 0) return `${n}，每小節都從第 1 拍重新開始。`;
  const back = `要 ${ex.cycleBars} 小節才接回第 1 拍`;
  if (S.end === 'full') return `${n}，${back}，這個樂句跑完整個循環（${ex.bars} 小節）${ex.fill ? '，Fill 蓋掉最後一段' : ''}。`;
  return `${n}，${back}。這個樂句在第 ${ex.bars} 小節${ex.fill ? '的 Fill 前' : '結尾'}截斷（✂），下一輪從頭開始。`;
}

// Rows for one bar: cymbal, groups, snare and kick always; toms only where the fill uses them.
function usedRows(ex, b) {
  const used = new Set(['cy', 'gp', 'sn', 'bd']);
  ex.slots.slice(b * ex.bar, (b + 1) * ex.bar).forEach((s) => s.forEach((h) => used.add(h.row)));
  return ROWS.filter((r) => used.has(r));
}

function rowLabel(ex, r, S) {
  if (r === 'cy') return `${ROW_NAME.cy}<small>${INST_NAME[ex.cym]}</small>`;
  if (r === 'bd') return `${ROW_NAME.bd}<small>${S.pedal === 'single' ? '右腳' : '<em class="fR">右</em><em class="fL">左</em>腳'}</small>`;
  return ROW_NAME[r];
}

// Kit grid: one bar per row of the page, so beat 1 of every bar lines up on the left
// and you can see each group's start drift to the right.
// Returns the grid's HTML; every slot cell carries data-i so the player can light it.
export function gridHtml(ex, S) {
  let html = '';
  for (let b = 0; b < ex.bars; b++) {
    const rows = usedRows(ex, b);
    html += `<div class="ksys" data-bar="${b}">`;
    for (const r of rows) {
      html += `<div class="kr ${r}"><span class="kl">${rowLabel(ex, r, S)}</span>`;
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
            html += `<span class="kc${fill}" data-i="${i}">${h ? `<i class="hit ${h.inst} ${h.limb}${h.lvl ? ' lv-' + h.lvl : ''}"></i>` : ''}</span>`;
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
  return html;
}

// Staff positions: offset from the top staff line in px (half a staff space = 4).
const STAFF_Y = { china: -12, crash: -8, hh: -4, ride: 0, t1: 4, t2: 8, sn: 12, ft: 20, bd: 28 };
const CYMBALS = new Set(['china', 'crash', 'hh', 'ride']);

// Returns one SVG per bar; every slot carries data-i (highlight rect) and every bar data-bar.
export function staffHtml(ex) {
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
              // Ghost notes in parentheses; an accent mark above the beam for the accented backbeat.
              if (h.lvl === 'g') body.push(`<text class="gp" x="${x - 9.5}" y="${y + 4}">(</text><text class="gp" x="${x + 6}" y="${y + 4}">)</text>`);
              if (h.lvl === 'a') body.push(`<path class="ac" d="M${x} ${beamY - 14}L${x + 8} ${beamY - 11}L${x} ${beamY - 8}"/>`);
            }
          }
          body.push(`<line class="st" x1="${x + 4.2}" y1="${low - 1}" x2="${x + 4.2}" y2="${beamY}"/>`);
          // One letter per slot for the bottom layer: feet R/L, snare S, fill hands R/L.
          const low1 = hits.find((h) => h.row === 'bd');
          const hand = hits.find((h) => h.row === 'tm' || (h.row === 'sn') || (h.row === 'cy' && i >= ex.fillFrom));
          if (low1) body.push(`<text class="stk ${low1.limb}" x="${x}" y="104" text-anchor="middle">${low1.limb[0]}</text>`);
          else if (hand) {
            const letter = hand.row === 'sn' && i < ex.fillFrom ? (hand.lvl === 'g' ? 'g' : 'S') : hand.limb[0];
            body.push(`<text class="stk ${hand.limb}${hand.lvl === 'g' ? ' gh' : ''}" x="${x}" y="104" text-anchor="middle">${letter}</text>`);
          }
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
  return html;
}

// Half a bar of the phrase as a small staff, to recognise an exercise at a glance.
// Fill exercises show the last two beats, where the fill is.
export function miniFor(ex) {
  const n = 2 * ex.sub, start = ex.cat === 'fill' && ex.fill ? ex.len - n : 0;
  const part = ex.slots.slice(start, start + n);
  const slots = part.map((s) => s.map((h) => ({ inst: h.inst, limb: h.limb, ghost: h.lvl === 'g', acc: h.lvl === 'a' })));
  const letters = part.map((s, k) => {
    const foot = s.find((h) => h.row === 'bd'), sn = s.find((h) => h.row === 'sn'), tm = s.find((h) => h.row === 'tm');
    if (foot) return { c: foot.limb[0], cls: 'f' + foot.limb[0] };
    if (sn) return { c: sn.lvl === 'g' ? 'g' : start + k >= ex.fillFrom ? 'L' : 'S', cls: 'L' };
    if (tm || (start + k >= ex.fillFrom && s.length)) return { c: 'R', cls: 'R' };
    return { c: '·', cls: 'rest' };
  });
  return window.MiniStaff ? window.MiniStaff.svg({ sub: ex.sub, slots, letters, label: `${ex.name}：${ex.cat === 'fill' ? '最後' : '前'} 2 拍` }) : '';
}

