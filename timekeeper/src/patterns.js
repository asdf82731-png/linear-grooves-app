// The ten things to play while practising, and their mini staves (moved from the old app.js).

/* What to play while practising. Every hit lands on the quarter or eighth-note grid, because the
 * microphone only checks those; picking a pattern sets 「你打的音符」 to match (det).
 * One bar of 4/4 per pattern, one character per slot (x hit, . rest); sub = slots per beat.
 * RH plays `hand` (sn or hh), LH snare, RF bass drum, LF bass drum (double pedal). */
export const PATTERNS = [
  { id: 'q-single', group: '單擊', name: '4 分音符 R L R L', sub: 1, det: 'q', hand: 'sn', RH: 'x.x.', LH: '.x.x' },
  { id: 'e-single', group: '單擊', name: '8 分音符 R L R L', sub: 2, det: 'e', hand: 'sn', RH: 'x.x.x.x.', LH: '.x.x.x.x' },
  { id: 'e-double', group: '手法', name: '8 分雙擊 R R L L', sub: 2, det: 'e', hand: 'sn', RH: 'xx..xx..', LH: '..xx..xx' },
  { id: 'e-para', group: '手法', name: '8 分 Paradiddle', sub: 2, det: 'e', hand: 'sn', RH: 'x.xx.x..', LH: '.x..x.xx' },
  { id: 'beat8', group: '節奏', name: '8 beat', sub: 2, det: 'e', hand: 'hh', RH: 'xxxxxxxx', LH: '..x...x.', RF: 'x...x...' },
  { id: 'beat8-var', group: '節奏', name: '8 beat 變化（大鼓加 3 的 &）', sub: 2, det: 'e', hand: 'hh', RH: 'xxxxxxxx', LH: '..x...x.', RF: 'x...xx..' },
  { id: 'half', group: '節奏', name: 'Half-time（小鼓第 3 拍）', sub: 2, det: 'e', hand: 'hh', RH: 'xxxxxxxx', LH: '....x...', RF: 'x.......' },
  { id: 'four', group: '節奏', name: 'Four on the floor', sub: 2, det: 'e', hand: 'hh', RH: 'xxxxxxxx', LH: '..x...x.', RF: 'x.x.x.x.' },
  { id: 'q-kick', group: '大鼓', name: '4 分大鼓', sub: 1, det: 'q', RF: 'xxxx' },
  { id: 'e-double-bass', group: '大鼓', name: '8 分雙踏 R L R L', sub: 2, det: 'e', RF: 'x.x.x.x.', LF: '.x.x.x.x' },
];
const LIMBS = [['RH'], ['LH'], ['RF'], ['LF']];

// A pattern as mini-staff slots: `beats` beats from the start.
export function patternStaff(p, beats, scale) {
  if (!window.MiniStaff) return '';
  const n = beats * p.sub, slots = [], letters = [];
  for (let i = 0; i < n; i++) {
    const hits = [];
    for (const [lane] of LIMBS) {
      if (!p[lane] || p[lane][i % p[lane].length] !== 'x') continue;
      hits.push({ inst: lane === 'RH' ? p.hand : lane === 'LH' ? 'sn' : 'bd', limb: lane });
    }
    // One letter per slot: a foot first, then the snare hand, then the right hand (H on the hi-hat).
    const foot = hits.find((h) => h.limb[1] === 'F'), lh = hits.find((h) => h.limb === 'LH'), rh = hits.find((h) => h.limb === 'RH');
    slots.push(hits);
    letters.push(foot ? { c: foot.limb[0], cls: 'f' + foot.limb[0] }
      : lh ? { c: 'L', cls: 'L' }
        : rh ? { c: p.hand === 'hh' ? 'H' : 'R', cls: 'R' } : { c: '·', cls: 'rest' });
  }
  return window.MiniStaff.svg({ sub: p.sub, slots, letters, scale, label: `${p.name}：${beats === 4 ? '一小節' : '前 2 拍'}` });
}
