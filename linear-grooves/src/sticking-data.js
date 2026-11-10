// Sticking exercises, sheets and notation (moved from the old sticking.js; S is the settings object).

/* ---------- Exercises ----------
 * Token grammar: [f|d]?[R|L]>?   f = flam, d = drag (grace notes by the other hand), > = accent.
 * Each pattern fills whole beats of `sub` notes per beat and loops.
 */
export const RUDIMENTS = [
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
export const PARADIDDLES = [
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
export const POLYS = [[3, 2], [4, 3], [5, 4], [5, 3], [5, 2], [7, 4], [2, 3], [3, 4]];

export const ACCENT_BASES = {
  single: { name: '單擊', p: 'RL' },
  single2: { name: '單擊（兩個重音）', p: 'RL', two: true },
  double: { name: '雙擊', p: 'RRLL' },
  para:   { name: 'Paradiddle', p: 'RLRRLRLL' },
};
export const COUNTS = { 1: [''], 2: ['', '&'], 3: ['', '&', 'a'], 4: ['', 'e', '&', 'a'], 6: ['', 'la', 'li', '&', 'la', 'li'] };
export const SUB_NAME = { 1: '4 分音符', 2: '8 分音符', 3: '三連音', 4: '16 分音符', 6: '六連音' };
export const MODES = ['rud', 'para', 'rand', 'acc', 'poly'];

export const pick = (a) => a[Math.floor(Math.random() * a.length)];

/* ---------- Building exercise sheets ---------- */
export function parse(p) {
  return p.trim().split(/\s+/).map((t) => {
    const m = /^([fd]?)([RL])(>?)$/.exec(t);
    return { h: m[2], acc: !!m[3], g: m[1] === 'f' ? 1 : m[1] === 'd' ? 2 : 0 };
  });
}
export function stickString(notes) { return notes.map((n) => n.h).join(''); }

export function randomHands(n, maxRun) {
  let out = '', run = 0;
  for (let i = 0; i < n; i++) {
    let h = pick('RL');
    if (out && h === out[out.length - 1] && run >= maxRun) h = h === 'R' ? 'L' : 'R';
    run = out && h === out[out.length - 1] ? run + 1 : 1;
    out += h;
  }
  return out;
}

export function makeRandom(S) {
  const n = S.rSub * 4, seen = new Set(), list = [];
  for (let tries = 0; list.length < 8 && tries < 400; tries++) {
    const h = randomHands(n, S.rRun);
    if (seen.has(h)) continue;
    seen.add(h);
    list.push(h);
  }
  return { sub: S.rSub, run: S.rRun, list };
}

// The exercises of the current mode; rand is the saved random sheet ({ sub, run, list }).
export function sheet(S, rand) {
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
    return rand.list.map((h, i) => ({
      key: 'rand:' + h, name: `隨機 ${i + 1}`, sub: rand.sub,
      notes: [...h].map((c) => ({ h: c, acc: false, g: 0 })),
    }));
  }
  // Accent moving: the same hand pattern, accent walks through every position
  // (or, for a two-accent base, every pair of positions in the beat).
  const { p: base, two } = ACCENT_BASES[S.aBase];
  const unit = Math.max(base.length, S.aSub);
  const total = Math.ceil((S.aSub * 4) / unit) * unit;
  const spot = (k) => `${Math.floor(k / S.aSub) + 1}${k % S.aSub ? ' ' + COUNTS[S.aSub][k % S.aSub] : ''}`;
  const sets = [];
  for (let a = 0; a < unit; a++) {
    if (!two) sets.push([a]);
    else for (let b = a + 1; b < unit; b++) sets.push([a, b]);
  }
  return sets.map((ks) => {
    const notes = [];
    for (let i = 0; i < total; i++) notes.push({ h: base[i % base.length], acc: ks.includes(i % unit), g: 0 });
    return { key: `acc:${S.aBase}:${S.aSub}:${ks.join('-')}`, name: `重音在「${two ? ks.map((k) => COUNTS[S.aSub][k % S.aSub] || '1').join('、') : spot(ks[0])}」`, sub: S.aSub, notes };
  });
}

export function swapped(notes, leftLead) {
  if (!leftLead) return notes;
  const swap = { R: 'L', L: 'R', B: 'B', '-': '-' };
  return notes.map((n) => Object.assign({}, n, { h: swap[n.h] }));
}
// Polyrhythms read better as two lanes than as notation.
function lanesHtml(cur, SL) {
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
  return `<svg class="staff lanes" viewBox="0 0 ${W} ${H}" role="img" aria-label="${cur.name} 雙手位置圖">${parts.join('')}</svg>`;
}

// The exercise on a single line (or two lanes for a polyrhythm); every slot carries data-i for highlighting.
export function notationHtml(cur, SL) {
  if (cur.poly) return lanesHtml(cur, SL);
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
  return `<svg class="staff" viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.66)}px" role="img" aria-label="${cur.name} 譜例">` +
    ph.join('') +
    `<line class="sl" x1="6" x2="${W - 4}" y1="${line}" y2="${line}"/>` +
    `<rect class="bl" x="12" y="${line - 8}" width="3" height="16"/><rect class="bl" x="18" y="${line - 8}" width="3" height="16"/>` +
    `<rect class="bl" x="${W - 9}" y="${line - 8}" width="1" height="16"/><rect class="bl" x="${W - 6}" y="${line - 8}" width="3" height="16"/>` +
    body.join('') + '</svg>';
}

// The first two beats on a single line (accents, flams, drags), to recognise an exercise at a glance.
export function miniFor(ex, leftLead) {
  if (ex.poly || !window.MiniStaff) return '';
  const notes = swapped(ex.notes, leftLead).slice(0, 2 * ex.sub);
  return window.MiniStaff.svg({
    sub: ex.sub, line: true, label: `${ex.name}：前 2 拍`,
    slots: notes.map((n) => [{ inst: 'pad', limb: n.h, acc: n.acc, grace: n.g }]),
    letters: notes.map((n) => ({ c: n.h, cls: n.h })),
  });
}

