'use strict';

/* ---------- Exercises ----------
 * Each exercise is a set of lanes, one per limb: RH right hand, LH left hand, RF right foot, LF left foot.
 * A lane is a string with one character per slot (spaces are ignored):
 *   x hit, . rest. No accents or soft notes: every hit is played at the same level.
 * `sub` = slots per beat; the pattern loops after (slots / sub) beats.
 * Instruments: RH plays `hand` ('hh' closed hi-hat, 'ride', 'sn' snare), LH snare,
 * RF bass drum, LF bass drum (double pedal) or 'hf' hi-hat foot.
 */
const BASIC = [
  { id: 'q-alt', name: '4 分音符交替', en: 'Quarter Notes · R L R L', sub: 1,
    RF: 'x . x .', LF: '. x . x',
    tip: '先用腳跟放下（Heel Down）慢慢踩，聽左右兩下是不是一樣大聲。' },
  { id: '8-single', name: '8 分音符單擊', en: 'Eighth Note Singles', sub: 2,
    RF: 'x. x. x. x.', LF: '.x .x .x .x',
    tip: '踩完讓拍頭自己彈回來，不要壓在鼓皮上。' },
  { id: 'trip-single', name: '三連音單擊', en: 'Triplet Singles · R L R  L R L', sub: 3,
    RF: 'x.x .x. x.x .x.', LF: '.x. x.x .x. x.x',
    tip: '每拍的第一下輪流落在右腳、左腳，兩隻腳都要練到能「帶拍」。' },
  { id: '16-single', name: '16 分音符單擊', en: 'Sixteenth Note Singles', sub: 4,
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.x .x.x .x.x .x.x',
    tip: '雙踏最核心的練習。速度上不去時改用腳跟抬起（Heel Up），讓腿的重量往下。' },
  { id: '16-double', name: '雙擊', en: 'Double Strokes · R R L L', sub: 4,
    RF: 'xx.. xx.. xx.. xx..', LF: '..xx ..xx ..xx ..xx',
    tip: '同一腳連踩兩下，第二下容易變小聲。可以試試滑踩（Slide）或腳跟腳尖（Heel-Toe）。' },
  { id: 'para', name: '腳的 Paradiddle', en: 'Paradiddle · R L R R  L R L L', sub: 4,
    RF: 'x.xx .x.. x.xx .x..', LF: '.x.. x.xx .x.. x.xx',
    tip: '把手的 Paradiddle 搬到腳上，訓練兩腳不規則交替。' },
  { id: 'gallop', name: 'Gallop 馬蹄', en: 'R L R –  (16th 前三個)', sub: 4,
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.. .x.. .x.. .x..',
    tip: '金屬樂常用的「噠噠噠–」。三下要平均，不要擠在一起。' },
  { id: 'gallop-rev', name: '反 Gallop', en: '– R L R  (16th 後三個)', sub: 4,
    RF: '.x.x .x.x .x.x .x.x', LF: '..x. ..x. ..x. ..x.',
    tip: '從每拍的「e」開始，拍點上是空的，要心裡數 1 e & a。' },
  { id: 'burst4', name: '4 音爆發', en: 'Burst · R L R L  R –', sub: 4,
    RF: 'x.x. x... x.x. x...', LF: '.x.x .... .x.x ....',
    tip: '短短一串快速雙踏再停下來，練習「快速起停」，比一直連續踩更容易練出速度。' },
  { id: 'burst6', name: '6 音爆發', en: 'Burst · R L R L R L  R –', sub: 4,
    RF: 'x.x. x.x. x... ....', LF: '.x.x .x.x .... ....',
    tip: '踩完一串一定要停得乾淨，休止也是練習的一部分。' },
  { id: '6-single', name: '六連音單擊', en: 'Sextuplet Singles', sub: 6,
    RF: 'x.x.x. x.x.x. x.x.x. x.x.x.', LF: '.x.x.x .x.x.x .x.x.x .x.x.x',
    tip: '最快的一級。先用三連音的速度一半來練，再慢慢加速。' },
];

const GROOVE = [
  { id: 'g-8', name: '8 分雙踏＋搖滾節奏', en: 'Eighth Notes Under a Backbeat', sub: 4, hand: 'hh',
    RH: 'x.x. x.x. x.x. x.x.', LH: '.... x... .... x...',
    RF: 'x... x... x... x...', LF: '..x. ..x. ..x. ..x.',
    tip: '腳踩 8 分音符，剛好和 Hi-hat 一起。先求手腳對齊。' },
  { id: 'g-16', name: '16 分連續雙踏', en: 'Continuous 16ths', sub: 4, hand: 'ride',
    RH: 'x... x... x... x...', LH: '.... x... .... x...',
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.x .x.x .x.x .x.x',
    tip: '手只打 4 分音符，讓你專心聽腳是不是平均。' },
  { id: 'g-gallop', name: 'Gallop 節奏', en: 'Gallop Groove', sub: 4, hand: 'hh',
    RH: 'x.x. x.x. x.x. x.x.', LH: '.... x... .... x...',
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.. .x.. .x.. .x..',
    tip: '「噠噠噠–」的最後一下和 Hi-hat 的反拍分開，要特別注意。' },
  { id: 'g-trip', name: '三連音雙踏', en: 'Triplet Double Bass', sub: 3, hand: 'ride',
    RH: 'x.. x.. x.. x..', LH: '... x.. ... x..',
    RF: 'x.x .x. x.x .x.', LF: '.x. x.x .x. x.x',
    tip: '6/8、Shuffle 感覺的雙踏，第二拍由左腳起拍。' },
  { id: 'g-half', name: 'Half-time 雙踏', en: 'Half-time Feel', sub: 4, hand: 'ride',
    RH: 'x.x. x.x. x.x. x.x.', LH: '.... .... x... ....',
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.x .x.x .x.x .x.x',
    tip: '小鼓只在第 3 拍，速度感變一半，腳還是一樣密。' },
  { id: 'g-accent', name: '大鼓點綴（雙擊）', en: 'Kick Doubles · R L inside a groove', sub: 4, hand: 'hh',
    RH: 'x.x. x.x. x.x. x.x.', LH: '.... x... .... x...',
    RF: 'x... ..x. x.x. ....', LF: '.... ...x ...x ....',
    tip: '平常是單腳的節奏，快速的兩下用左腳補，讓右腳不用趕。' },
  { id: 'g-crash', name: '雙踏＋打點', en: 'Unison Hits', sub: 4, hand: 'ride',
    RH: 'x... .... x... ....', LH: '.... x... .... x...',
    RF: 'x.x. x.x. x.x. x.x.', LF: '.x.x .x.x .x.x .x.x',
    tip: '手只打大拍，腳持續踩，練習上半身放鬆、下半身不停。' },
];

const COMBO = [
  { id: 'c-rff', name: 'R + 腳腳（三連音）', en: 'R  r l', sub: 3, hand: 'sn',
    RH: 'x.. x.. x.. x..', RF: '.x. .x. .x. .x.', LF: '..x ..x ..x ..x',
    tip: '最基本的手腳組合：手一下、腳兩下。' },
  { id: 'c-rlff', name: 'R L + 腳腳', en: 'R L  r l', sub: 4, hand: 'sn',
    RH: 'x... x... x... x...', LH: '.x.. .x.. .x.. .x..', RF: '..x. ..x. ..x. ..x.', LF: '...x ...x ...x ...x',
    tip: '16 分音符的四音組合，聽起來像雙踏版的單擊。' },
  { id: 'c-ffrl', name: '腳腳 + R L', en: 'r l  R L', sub: 4, hand: 'sn',
    RH: '..x. ..x. ..x. ..x.', LH: '...x ...x ...x ...x', RF: 'x... x... x... x...', LF: '.x.. .x.. .x.. .x..',
    tip: '由腳起拍，拍點落在大鼓上。' },
  { id: 'c-rlrlff', name: 'R L R L + 腳腳（六連音）', en: 'R L R L  r l', sub: 6, hand: 'sn',
    RH: 'x.x... x.x... x.x... x.x...', LH: '.x.x.. .x.x.. .x.x.. .x.x..',
    RF: '....x. ....x. ....x. ....x.', LF: '.....x .....x .....x .....x',
    tip: '經典過門。手的四下可以分到不同筒鼓。' },
  { id: 'c-rrllff', name: 'R R L L + 腳腳（六連音）', en: 'R R L L  r l', sub: 6, hand: 'sn',
    RH: 'xx.... xx.... xx.... xx....', LH: '..xx.. ..xx.. ..xx.. ..xx..',
    RF: '....x. ....x. ....x. ....x.', LF: '.....x .....x .....x .....x',
    tip: '手雙擊、腳單擊，速度快時聽起來像一串滾奏。' },
  { id: 'c-rlrff', name: '5 音組 R L R + 腳腳', en: 'R L R  r l  · 跨小節 5 拍一循環', sub: 4, hand: 'sn',
    RH: 'x.x.. x.x.. x.x.. x.x..', LH: '.x... .x... .x... .x...',
    RF: '...x. ...x. ...x. ...x.', LF: '....x ....x ....x ....x',
    tip: '5 個音一組放在 16 分音符上，每組的第一下每次落在不同位置，5 拍才回到原點。' },
  { id: 'c-rffl', name: 'R + 腳腳 + L', en: 'R  r l  L', sub: 4, hand: 'sn',
    RH: 'x... x... x... x...', LH: '...x ...x ...x ...x', RF: '.x.. .x.. .x.. .x..', LF: '..x. ..x. ..x. ..x.',
    tip: '腳被夾在兩手中間，練習手腳快速換手。' },
];

const HIHAT = [
  { id: 'h-24', name: '腳踩鈸 2、4 拍', en: 'Hi-hat Foot on 2 & 4', sub: 2, hand: 'ride', lf: 'hf',
    RH: 'x.x.x.x.', LH: '..x...x.', RF: 'x...x...', LF: '..x...x.',
    tip: '左腳和小鼓同時在 2、4 拍。腳尖踩下就放鬆，「嚓」要短。' },
  { id: 'h-q', name: '腳踩鈸 每拍', en: 'Hi-hat Foot on Every Beat', sub: 2, hand: 'ride', lf: 'hf',
    RH: 'x.x.x.x.', LH: '..x...x.', RF: 'x...x...', LF: 'x.x.x.x.',
    tip: '左腳變成你的節拍器，穩定地每拍一下。' },
  { id: 'h-and', name: '腳踩鈸 反拍', en: 'Hi-hat Foot on the &s', sub: 2, hand: 'ride', lf: 'hf',
    RH: 'x.x.x.x.', LH: '..x...x.', RF: 'x...x...', LF: '.x.x.x.x',
    tip: '左腳都在「&」，和右手錯開，是很好的獨立性練習。' },
  { id: 'h-alt', name: '大鼓／腳踩鈸 交替', en: 'Bass & Hi-hat Foot Alternating', sub: 4, hand: 'ride', lf: 'hf',
    RH: 'x... x... x... x...', RF: 'x.x. x.x. x.x. x.x.', LF: '.x.x .x.x .x.x .x.x',
    tip: '兩腳像雙踏一樣交替，只是左腳在 Hi-hat。' },
  { id: 'h-swing', name: 'Swing：大鼓四分音符＋2、4', en: 'Jazz Ride · bass on every beat · hi-hat 2 & 4', sub: 3, hand: 'ride', lf: 'hf',
    RH: 'x.. x.x x.. x.x', RF: 'x.. x.. x.. x..', LF: '... x.. ... x..',
    tip: '爵士最基本的雙腳：大鼓每拍踩一下，Hi-hat 清楚地在 2、4。' },
  { id: 'h-swing-comp', name: 'Swing＋左手 Comping', en: 'Swing with snare comping on the "let"', sub: 3, hand: 'ride', lf: 'hf',
    RH: 'x.. x.x x.. x.x', LH: '... ..x ... ..x', RF: 'x.. x.. x.. x..', LF: '... x.. ... x..',
    tip: '左手在三連音的最後一個音補一下，雙腳保持不變。' },
  { id: 'h-samba', name: 'Samba 雙腳', en: 'Samba · bass 1 . . a  · hi-hat on &', sub: 4, hand: 'ride', lf: 'hf',
    RH: 'x.xx x.xx x.xx x.xx', RF: 'x..x x..x x..x x..x', LF: '..x. ..x. ..x. ..x.',
    tip: '大鼓「咚–咚咚」的感覺，Hi-hat 夾在中間的「&」。先只練雙腳再加手。' },
  { id: 'h-clave', name: '左腳 Clave（Son 3-2）', en: 'Son Clave 3-2 on the hi-hat foot · 2 小節', sub: 4, hand: 'ride', lf: 'hf',
    RH: 'x.x. x.x. x.x. x.x. x.x. x.x. x.x. x.x.',
    RF: 'x... .... x... .... x... .... x... ....',
    LF: 'x... ..x. .... x... .... x... x... ....',
    tip: '拉丁鼓常見：左腳踩出 Clave 節奏，手和右腳保持穩定。' },
];

// Single-foot work: only the right foot on the bass drum. `swap: true` lets 「左腳開始」 move it to the left foot.
const HEEL = [
  { id: 'ht-split', name: 'Heel-Toe 分解（8 分雙擊）', en: 'Heel · Toe  —  慢慢分開兩個動作', sub: 2, swap: true,
    RF: 'xx .. xx .. xx .. xx ..',
    tip: '第一下腳跟往下踩，腳尖抬著；第二下腳跟留在原位，換腳尖往下踩。先慢到每個動作都看得清楚。' },
  { id: 'ht-16', name: 'Heel-Toe 雙擊（1 e）', en: 'Doubles on the beat · R R – –', sub: 4, swap: true,
    RF: 'xx.. xx.. xx.. xx..',
    tip: '把分解的兩個動作連起來，變成一個「搖」的動作。兩下要一樣大聲，第二下最容易變小。' },
  { id: 'ht-16-off', name: 'Heel-Toe 雙擊（& a）', en: 'Doubles off the beat · – – R R', sub: 4, swap: true,
    RF: '..xx ..xx ..xx ..xx',
    tip: '拍點上是空的，雙擊落在「& a」。心裡數 1 e & a，不要被拉回拍點。' },
  { id: 'ht-trip', name: '三連音雙擊', en: 'Triplet Doubles · R R –', sub: 3, swap: true,
    RF: 'xx. xx. xx. xx.',
    tip: '比 16 分雙擊寬一點，適合剛連起來的 Heel-Toe。休息的那一格讓腳回到起始位置。' },
  { id: 'ht-groove', name: 'Heel-Toe＋搖滾節奏', en: 'Single-pedal doubles in a groove', sub: 4, hand: 'hh', swap: true,
    RH: 'x.x. x.x. x.x. x.x.', LH: '.... x... .... x...',
    RF: 'x... ..xx x... ..xx',
    tip: '單踏板最常見的雙擊位置：「& a」接下一拍。手先打到不用想，再專心聽腳的兩下。' },
  { id: 'sf-3', name: '單腳三擊', en: 'Triples · R R R –', sub: 4, swap: true,
    RF: 'xxx. xxx. xxx. xxx.',
    tip: '可以用「腳跟、腳尖、腳跟」，或滑踩（Slide）加一下。三下要平均，不要越踩越小聲。' },
  { id: 'sf-4', name: '單腳連 4 下', en: 'Four in a row · R R R R  – – – –', sub: 4, swap: true,
    RF: 'xxxx .... xxxx ....',
    tip: '一拍連踩、一拍休息。休息時腳完全放鬆，下一串才不會越來越緊。' },
  { id: 'sf-8to16', name: '8 分轉 16 分', en: 'Eighths → Sixteenths · 同一腳不停', sub: 4, swap: true,
    RF: 'x.x. x.x. xxxx xxxx',
    tip: '前兩拍 8 分、後兩拍 16 分，速度換檔時腳不要突然用力，靠腳踝和腳跟腳尖帶。' },
  { id: 'sf-trip', name: '單腳三連音連續', en: 'Continuous Triplets · one foot', sub: 3, swap: true,
    RF: 'xxx xxx xxx xxx',
    tip: '心裡數拍，每拍的第一下對準節拍器。腿累了就降速，不要硬撐。' },
  { id: 'sf-16', name: '單腳 16 分連續', en: 'Continuous 16ths · one foot', sub: 4, swap: true,
    RF: 'xxxx xxxx xxxx xxxx',
    tip: '最難的一個。先在 60 BPM 以下踩穩，可以試 Swivel 轉腳或 Heel-Toe 輪流，讓大腿不用每下都出力。' },
];

const COUNTS = { 1: [''], 2: ['', '&'], 3: ['', '&', 'a'], 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
const SUB_NAME = { 1: '4 分音符', 2: '8 分音符', 3: '三連音', 4: '16 分音符', 6: '六連音' };
const MODES = ['basic', 'heel', 'groove', 'combo', 'hh', 'rand'];
const LANES = ['RH', 'LH', 'RF', 'LF'];
const INST_NAME = { hh: 'Hi-hat', ride: 'Ride', sn: '小鼓', bd: '大鼓', hf: '腳踩鈸' };
const LIMB_NAME = { RH: '右手', LH: '左手', RF: '右腳', LF: '左腳' };
const AMP = { x: 0.62 };

const MIN_BPM = 30;
const DEFAULTS = {
  mode: 'basic', rSub: 4, rRun: 2, rRest: false,
  reps: 8, autoNext: false, leftLead: false, playPart: 'all', timer: 0,
  bpm: 70, click: true, clickSub: 'soft', countIn: false, trainer: false, trainerEvery: 4, trainerStep: 5, trainerMax: 160,
  seenGuide: false, idx: { basic: 0, heel: 0, groove: 0, combo: 0, hh: 0, rand: 0 },
};

/* ---------- Storage (best effort) ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const S = Object.assign({}, DEFAULTS, load('ft.settings', {}));
S.idx = Object.assign({}, DEFAULTS.idx, S.idx);
let best = load('ft.best', {});
let randomSheet = load('ft.random', null);

const $ = (s) => document.querySelector(s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function saveSettings() { save('ft.settings', S); }

/* ---------- Building exercise sheets ---------- */
// Turns a definition into { lanes: [{ limb, inst, hits: ['x'|'.'] }], len }.
function build(def, mode) {
  const lanes = [];
  for (const limb of LANES) {
    if (!def[limb]) continue;
    const hits = [...def[limb].replace(/\s+/g, '')];
    const inst = limb === 'RH' ? (def.hand || 'hh') : limb === 'LH' ? 'sn' : limb === 'RF' ? 'bd' : (def.lf || 'bd');
    lanes.push({ limb, inst, hits });
  }
  const len = Math.max(...lanes.map((l) => l.hits.length));
  lanes.forEach((l) => { while (l.hits.length < len) l.hits.push('.'); });
  return {
    key: `${mode}:${def.id}`, name: def.name, en: def.en, tip: def.tip, sub: def.sub, lanes, len,
    doublePedal: !!def.swap || lanes.some((l) => l.limb === 'LF' && l.inst === 'bd'),
    linear: mode === 'combo',
  };
}

// Feet-only exercise from a sticking string like "RLRL" ("-" is a rest).
function feetFrom(st, sub, key, name, extra) {
  const RF = [], LF = [];
  [...st].forEach((c, i) => {
    RF.push(c === 'R' ? 'x' : '.');
    LF.push(c === 'L' ? 'x' : '.');
  });
  const ex = build({ id: key, name, sub, RF: RF.join(''), LF: LF.join('') }, '');
  return Object.assign(ex, { key }, extra);
}

function randomFeet(n, maxRun, rests) {
  let out = '', run = 0, last = '';
  for (let i = 0; i < n; i++) {
    if (rests && i > 0 && Math.random() < 0.25) { out += '-'; continue; }
    let f = pick('RL');
    if (f === last && run >= maxRun) f = f === 'R' ? 'L' : 'R';
    run = f === last ? run + 1 : 1;
    last = f;
    out += f;
  }
  return out;
}

function makeRandomSheet() {
  const n = S.rSub * 4, seen = new Set(), list = [];
  for (let tries = 0; list.length < 8 && tries < 400; tries++) {
    const f = randomFeet(n, S.rRun, S.rRest);
    if (seen.has(f)) continue;
    seen.add(f);
    list.push(f);
  }
  randomSheet = { sub: S.rSub, run: S.rRun, rest: S.rRest, list };
  save('ft.random', randomSheet);
  S.idx.rand = 0;
}

function sheet() {
  const lists = { basic: BASIC, heel: HEEL, groove: GROOVE, combo: COMBO, hh: HIHAT };
  if (lists[S.mode]) return lists[S.mode].map((d) => build(d, S.mode));
  if (!randomSheet || randomSheet.sub !== S.rSub || randomSheet.run !== S.rRun || randomSheet.rest !== S.rRest) makeRandomSheet();
  return randomSheet.list.map((f, i) => feetFrom(f, randomSheet.sub,
    'rand:' + f, `隨機 ${i + 1}`, { tip: '先看清楚整排再開始，休止（·）的地方腳要停住。' }));
}

let SHEET = [];
let cur = null;      // exercise being shown
let CL = [];         // its lanes after the left-lead swap

function swapped(ex) {
  if (!S.leftLead || !ex.doublePedal) return ex.lanes;
  return ex.lanes.map((l) => Object.assign({}, l, { limb: l.limb === 'RF' ? 'LF' : l.limb === 'LF' ? 'RF' : l.limb }))
    .sort((a, b) => LANES.indexOf(a.limb) - LANES.indexOf(b.limb));
}
function exAt(i) { return SHEET[((i % SHEET.length) + SHEET.length) % SHEET.length]; }

// One symbol per slot: the foot sticking (or, for linear hand-foot combos, whichever limb plays).
function sticking(ex, lanes) {
  const out = [];
  for (let i = 0; i < ex.len; i++) {
    const on = lanes.filter((l) => l.hits[i] !== '.' && (ex.linear || l.limb[1] === 'F'));
    if (!on.length) out.push({ c: '·', cls: 'rest' });
    else if (on.length > 1) out.push({ c: '✕', cls: 'B' });
    else out.push({ c: on[0].limb[0], cls: (on[0].limb[1] === 'F' ? 'f' : '') + on[0].limb[0] });
  }
  return out;
}

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
  CL = swapped(cur);
  $('#exName').textContent = cur.name;
  $('#exEn').textContent = cur.en || sticking(cur, CL).map((s) => s.c).join('').replace(/(.{4})/g, '$1 ').trim();
  $('#exMeta').textContent = `${SUB_NAME[cur.sub]} · ${cur.len / cur.sub} 拍一循環 · 第 ${S.idx[S.mode] + 1} / ${SHEET.length} 個`;
  $('#exTip').textContent = cur.tip || '';
  $('#exTip').hidden = !cur.tip;
  renderBest();
  $('#big').hidden = S.mode === 'hh';
  renderBig();
  renderGrid();
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
  const st = sticking(cur, CL);
  let html = '';
  for (let b = 0; b < cur.len / cur.sub; b++) {
    html += '<span class="bt">';
    for (let k = 0; k < cur.sub; k++) {
      const i = b * cur.sub + k, s = st[i];
      html += `<span class="n ${s.cls}" data-i="${i}">${s.c}</span>`;
    }
    html += '</span>';
  }
  $('#big').innerHTML = html;
}

// Kit grid: one row per limb, one column per slot, beats separated by a line.
// Patterns longer than 5 beats wrap into systems of 4 beats, like bars on a page.
function gridSystem(b0, b1) {
  const row = (label, cls, cell) => {
    let h = `<div class="kr ${cls}"><span class="kl">${label}</span>`;
    for (let b = b0; b < b1; b++) {
      h += '<span class="kb">';
      for (let k = 0; k < cur.sub; k++) h += cell(b * cur.sub + k, k, b);
      h += '</span>';
    }
    return h + '</div>';
  };
  let html = '';
  for (const l of CL) {
    const label = `${LIMB_NAME[l.limb]}<small>${INST_NAME[l.inst]}</small>`;
    html += row(label, l.limb, (i) => {
      const h = l.hits[i];
      const mark = h === '.' ? '' : `<i class="hit ${l.inst}"></i>`;
      return `<span class="kc" data-i="${i}">${mark}</span>`;
    });
  }
  // Sextuplets are too narrow to spell out every syllable; keep the beat and the "&".
  const bar = (cur.len / cur.sub) % 4 === 0 ? 4 : Infinity;   // multi-bar patterns count 1–4 in every bar
  const count = (k, b) => (k === 0 ? (b % bar) + 1 : cur.sub === 6 ? (k === 3 ? '&' : '') : COUNTS[cur.sub][k]);
  return html + row('', 'cnt', (i, k, b) => `<span class="kc">${count(k, b)}</span>`);
}

function renderGrid() {
  const beats = cur.len / cur.sub;
  const per = beats > 5 ? 4 : beats;
  let html = '';
  for (let b0 = 0; b0 < beats; b0 += per) html += `<div class="ksys">${gridSystem(b0, Math.min(beats, b0 + per))}</div>`;
  const grid = $('#grid');
  grid.style.setProperty('--slots', per * cur.sub);
  grid.classList.toggle('dense', cur.sub >= 6);
  grid.innerHTML = html;
  grid.setAttribute('aria-label', `${cur.name}：` + CL.map((l) => `${LIMB_NAME[l.limb]}${INST_NAME[l.inst]}`).join('、'));
  $('#legend').innerHTML = CL.map((l) => `<span><i class="dot ${l.limb}"></i>${LIMB_NAME[l.limb]}・${INST_NAME[l.inst]}</span>`).join('');
}

// The first two beats as a small staff (hands and feet), to recognise an exercise at a glance.
function miniFor(ex, lanes) {
  const n = Math.min(ex.len, 2 * ex.sub);
  const slots = [];
  for (let i = 0; i < n; i++) slots.push(lanes.filter((l) => l.hits[i] !== '.').map((l) => ({ inst: l.inst, limb: l.limb })));
  const letters = sticking(ex, lanes).slice(0, n);
  return window.MiniStaff ? MiniStaff.svg({ sub: ex.sub, slots, letters, label: `${ex.name}：前 2 拍` }) : '';
}

function renderList() {
  $('#exList').innerHTML = SHEET.map((ex, i) => {
    const b = best[ex.key];
    const lanes = swapped(ex);
    const st = sticking(ex, lanes).map((s) => `<b class="${s.cls}">${s.c}</b>`).join('');
    return `<li><button type="button" class="ex" data-i="${i}">
      <span class="ex-main"><span class="ex-name">${ex.name}</span><span class="ex-st">${st}</span></span>
      <span class="ex-mini">${miniFor(ex, lanes)}</span>
      <span class="ex-best${b ? ' has' : ''}">${b ? b + ' BPM' : '—'}</span>
    </button></li>`;
  }).join('');
}

function renderModeOpts() {
  document.querySelectorAll('.mode-opts').forEach((el) => { el.hidden = el.dataset.mode !== S.mode; });
  $(`#mode-${S.mode}`).checked = true;
  $(`#rSub${S.rSub}`).checked = true;
  $('#rRun').value = S.rRun;
  $('#rRest').checked = S.rRest;
}

let hlMap = [], lastHl = -1;
function indexHighlights() {
  hlMap = Array.from({ length: cur.len }, () => []);
  document.querySelectorAll('#big [data-i], #grid .kc[data-i]').forEach((el) => hlMap[+el.dataset.i].push(el));
  lastHl = -1;
}
function highlight(i) {
  if (lastHl >= 0 && hlMap[lastHl]) hlMap[lastHl].forEach((el) => el.classList.remove('on'));
  if (i >= 0 && hlMap[i]) hlMap[i].forEach((el) => el.classList.add('on'));
  lastHl = i;
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

/* ---------- Audio: synthesized kit; right foot panned right, left foot left ---------- */
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
    // straight line up to 0.7 (normal hits are untouched), then bends smoothly toward 0.98.
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
    master.gain.value = 2.8;
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
    env(tone(t, 0.28, 'sine', 115, 44), t, amp * 1.1, 0.28).connect(dest);
    env(noise(t, 0.02, 'lowpass', 3000), t, amp * 0.25, 0.02).connect(dest);
  } else if (inst === 'sn') {
    env(noise(t, 0.16, 'bandpass', 1900, 0.8), t, amp * 0.8, 0.16).connect(dest);
    env(tone(t, 0.08, 'triangle', 220, 170), t, amp * 0.5, 0.08).connect(dest);
  } else if (inst === 'hh') {
    env(noise(t, 0.05, 'highpass', 7500), t, amp * 0.45, 0.05).connect(dest);
  } else if (inst === 'hf') {
    env(noise(t, 0.045, 'bandpass', 5200, 1.5), t, amp * 0.6, 0.045).connect(dest);
  } else if (inst === 'ride') {
    env(noise(t, 0.4, 'highpass', 5200), t, amp * 0.22, 0.4).connect(dest);
    env(tone(t, 0.3, 'square', 760), t, amp * 0.035, 0.3).connect(dest);
    env(tone(t, 0.3, 'square', 1140), t, amp * 0.025, 0.3).connect(dest);
  }
}
const PAN = { RH: 0.2, LH: -0.1, RF: 0.35, LF: -0.35 };
// Metronome: the same wood-block click on every beat — no louder or higher first beat.
// Subdivisions (e & a …) use the very same click, softer or (setting 「跟拍點一樣大聲」) at the same level.
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
function audible(limb) {
  if (S.playPart === 'all') return true;
  if (S.playPart === 'none') return false;
  return S.playPart === 'hands' ? limb[1] === 'H' : limb[1] === 'F';
}

/* ---------- Transport ---------- */
let playing = false, step = 0, nextTime = 0, timer = null, countSlots = 0, reps = 0, loops = 0, startedAt = 0;
let queue = [], wakeLock = null;
let schedEx = null, schedCL = [];   // what the scheduler is playing (can run ahead of the screen)

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
      schedCL = swapped(schedEx);
      step = 0; n = 0; i = 0;
      queue.push({ t, show: nextIdx });
    }
    queue.push({ t, reps });
  }
  for (const l of schedCL) {
    const h = l.hits[i];
    if (h !== '.' && audible(l.limb)) hit(l.inst, t, AMP[h], PAN[l.limb]);
  }
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
  schedCL = CL;
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
  $('#playPart').value = S.playPart;
  $('#timerSel').value = S.timer;
  $('#click').checked = S.click;
  $('#clickSub').value = S.clickSub;
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
    save('ft.best', best);
    renderBest();
    renderList();
    document.querySelectorAll('.ex').forEach((el) => el.classList.toggle('cur', +el.dataset.i === S.idx[S.mode]));
    flash(S.bpm > prev ? `記錄 ${S.bpm} BPM！下次試試 ${S.bpm + 5}` : `已記錄，你的最佳是 ${prev} BPM`);
  });

  const rebuild = (fn) => () => { if (playing) stop(); fn(); saveSettings(); renderAll(); };
  document.querySelectorAll('input[name="mode"]').forEach((el) => el.addEventListener('change', rebuild(() => { S.mode = el.value; })));
  document.querySelectorAll('input[name="rSub"]').forEach((el) => el.addEventListener('change', rebuild(() => { S.rSub = +el.value; })));
  $('#rRun').addEventListener('change', rebuild(() => { S.rRun = +$('#rRun').value; }));
  $('#rRest').addEventListener('change', rebuild(() => { S.rRest = $('#rRest').checked; }));
  $('#btnReroll').addEventListener('click', () => { if (playing) stop(); makeRandomSheet(); renderAll(); flash('換了一組新的隨機腳順'); });

  $('#exList').addEventListener('click', (e) => {
    const b = e.target.closest('.ex');
    if (!b) return;
    go(+b.dataset.i);
    $('#practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#playPart').addEventListener('change', (e) => { S.playPart = e.target.value; saveSettings(); });
  $('#timerSel').addEventListener('change', (e) => { S.timer = +e.target.value; startedAt = performance.now(); saveSettings(); setReps(reps); });
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
// Exercises loop by default. Earlier versions saved auto-advance as on, so turn it off once.
if (!S.loopByDefault) { S.autoNext = false; S.loopByDefault = true; }
if (!['soft', 'same', 'off'].includes(S.clickSub)) S.clickSub = S.clickSub === false ? 'off' : 'soft';
if (!MODES.includes(S.mode)) S.mode = 'basic';
if (![2, 3, 4].includes(S.rSub)) S.rSub = 4;
syncControls();
bind();
renderAll();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker?.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}
