// Double Pedal exercises and the pure helpers that turn them into lanes, sticking letters and random sheets.

/* ---------- Exercises ----------
 * Each exercise is a set of lanes, one per limb: RH right hand, LH left hand, RF right foot, LF left foot.
 * A lane is a string with one character per slot (spaces are ignored):
 *   x hit, . rest. No accents or soft notes: every hit is played at the same level.
 * `sub` = slots per beat; the pattern loops after (slots / sub) beats.
 * Instruments: RH plays `hand` ('hh' closed hi-hat, 'ride', 'sn' snare), LH snare,
 * RF bass drum, LF bass drum (double pedal) or 'hf' hi-hat foot.
 */
export const BASIC = [
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

export const GROOVE = [
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

export const COMBO = [
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

export const HIHAT = [
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
export const HEEL = [
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

export const COUNTS = { 1: [''], 2: ['', '&'], 3: ['', '&', 'a'], 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
export const SUB_NAME = { 1: '4 分音符', 2: '8 分音符', 3: '三連音', 4: '16 分音符', 6: '六連音' };
export const MODES = ['basic', 'heel', 'groove', 'combo', 'hh', 'rand'];
export const LANES = ['RH', 'LH', 'RF', 'LF'];
export const INST_NAME = { hh: 'Hi-hat', ride: 'Ride', sn: '小鼓', bd: '大鼓', hf: '腳踩鈸' };
export const LIMB_NAME = { RH: '右手', LH: '左手', RF: '右腳', LF: '左腳' };
export const AMP = { x: 0.62 };

export const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Turns a definition into { lanes: [{ limb, inst, hits: ['x'|'.'] }], len }.
export function build(def, mode) {
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
export function feetFrom(st, sub, key, name, extra) {
  const RF = [], LF = [];
  [...st].forEach((c, i) => {
    RF.push(c === 'R' ? 'x' : '.');
    LF.push(c === 'L' ? 'x' : '.');
  });
  const ex = build({ id: key, name, sub, RF: RF.join(''), LF: LF.join('') }, '');
  return Object.assign(ex, { key }, extra);
}

export function randomFeet(n, maxRun, rests) {
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

// Right and left foot swap places for 「左腳開始」 (double-pedal exercises only).
export function swapped(ex, leftLead) {
  if (!leftLead || !ex.doublePedal) return ex.lanes;
  return ex.lanes.map((l) => Object.assign({}, l, { limb: l.limb === 'RF' ? 'LF' : l.limb === 'LF' ? 'RF' : l.limb }))
    .sort((a, b) => LANES.indexOf(a.limb) - LANES.indexOf(b.limb));
}

// One symbol per slot: the foot sticking (or, for linear hand-foot combos, whichever limb plays).
export function sticking(ex, lanes) {
  const out = [];
  for (let i = 0; i < ex.len; i++) {
    const on = lanes.filter((l) => l.hits[i] !== '.' && (ex.linear || l.limb[1] === 'F'));
    if (!on.length) out.push({ c: '·', cls: 'rest' });
    else if (on.length > 1) out.push({ c: '✕', cls: 'B' });
    else out.push({ c: on[0].limb[0], cls: (on[0].limb[1] === 'F' ? 'f' : '') + on[0].limb[0] });
  }
  return out;
}

