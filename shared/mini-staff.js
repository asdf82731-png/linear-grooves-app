'use strict';

/* Half-bar mini staff for exercise lists, shared by all four apps.
 * Each app turns its own exercise format into slots and calls MiniStaff.svg():
 *   { sub, slots: [[{ inst, limb, acc, ghost, grace }]], letters: [{ c, cls }], line, label }
 * inst: china crash hh ride t1 t2 sn ft bd hf (hi-hat foot) pad (sticking on a single line)
 * limb colours the letter row: R / L (hands), K, fR / fL (feet), rest.
 * The same drum notation as the big staff in each app, drawn small: cymbals are x heads,
 * drums are note heads, accents are > above the beam, ghost notes sit in parentheses.
 * Colours come from each app's own tokens (--ink, --muted, --r, --l, --k, --lf), so both themes work.
 */
(function () {
  // Positions from the top staff line, in px; one staff space is 6.
  const Y = { china: -9, crash: -6, hh: -3, ride: 0, t1: 3, t2: 6, sn: 9, pad: 12, ft: 15, bd: 21, hf: 27 };
  const CYM = { china: 1, crash: 1, hh: 1, ride: 1, hf: 1 };
  const SLOT_W = { 1: 22, 2: 16, 3: 13, 4: 11, 6: 8 };
  const TOP = 32, BEAM = 10;

  const CSS = `
.ms { display: block; max-width: 100%; height: auto; overflow: visible; }
.ms .sl { stroke: var(--muted); stroke-width: 0.8; }
.ms .ld { stroke: var(--ink); stroke-width: 0.8; }
.ms .nh, .ms .bm, .ms .gp { fill: var(--ink); }
.ms .gn { fill: var(--ink); opacity: 0.8; }
.ms .xh { stroke: var(--ink); stroke-width: 1.3; stroke-linecap: round; fill: none; }
.ms .xo { fill: none; stroke: var(--ink); stroke-width: 0.9; }
.ms .st, .ms .gs { stroke: var(--ink); stroke-width: 1; }
.ms .ac { fill: none; stroke: var(--ink); stroke-width: 1.1; stroke-linejoin: round; }
.ms .gp { font: 9px sans-serif; }
.ms .lt { font: 600 8.5px var(--f-mono, ui-monospace, monospace); fill: var(--muted); }
.ms .lt.R { fill: var(--r); } .ms .lt.L { fill: var(--l); }
.ms .lt.K, .ms .lt.fR { fill: var(--k); } .ms .lt.fL { fill: var(--lf, #7A4FB0); }
.ms .lt.rest { fill: var(--line); }`;

  function injectCss() {
    if (document.getElementById('mini-staff-css')) return;
    const el = document.createElement('style');
    el.id = 'mini-staff-css';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function svg(o) {
    if (typeof document !== 'undefined') injectCss();
    const sub = o.sub, slots = o.slots, n = slots.length, beats = Math.ceil(n / sub);
    const sw = SLOT_W[sub] || 10, gap = 6, x0 = 8;
    const beatW = sub * sw + gap;
    const W = Math.round(x0 + beats * beatW + 2);
    const letters = !!(o.letters && o.letters.length);
    const H = TOP + (o.line ? 20 : 30) + (letters ? 14 : 0);
    const X = (i) => x0 + Math.floor(i / sub) * beatW + (i % sub) * sw + sw / 2;
    const body = [], beams = [];

    // Staff: five lines, or one line for sticking exercises.
    let s = '';
    if (o.line) s += `<line class="sl" x1="2" x2="${W - 1}" y1="${TOP + 12}" y2="${TOP + 12}"/>`;
    else for (let l = 0; l < 5; l++) s += `<line class="sl" x1="2" x2="${W - 1}" y1="${TOP + l * 6}" y2="${TOP + l * 6}"/>`;

    for (let b = 0; b < beats; b++) {
      const xs = [];
      for (let k = 0; k < sub; k++) {
        const i = b * sub + k;
        if (i >= n) break;
        const hits = slots[i] || [];
        if (!hits.length) continue;
        const x = X(i);
        xs.push(x);
        let low = -99, acc = false;
        for (const h of hits) {
          const y = TOP + (Y[h.inst] == null ? 9 : Y[h.inst]);
          low = Math.max(low, y);
          if (h.acc) acc = true;
          if (!o.line && (y < TOP - 4)) body.push(`<line class="ld" x1="${x - 5}" x2="${x + 5}" y1="${TOP - 6}" y2="${TOP - 6}"/>`);
          if (!o.line && y > TOP + 26) body.push(`<line class="ld" x1="${x - 5}" x2="${x + 5}" y1="${TOP + 30}" y2="${TOP + 30}"/>`);
          if (CYM[h.inst]) {
            body.push(`<path class="xh" d="M${x - 2.8} ${y - 2.8}L${x + 2.8} ${y + 2.8}M${x - 2.8} ${y + 2.8}L${x + 2.8} ${y - 2.8}"/>`);
            if (h.inst === 'china') body.push(`<circle class="xo" cx="${x}" cy="${y}" r="4.2"/>`);
          } else {
            body.push(`<ellipse class="nh" cx="${x}" cy="${y}" rx="3.6" ry="2.6" transform="rotate(-22 ${x} ${y})"/>`);
          }
          if (h.ghost) body.push(`<text class="gp" x="${x - 8}" y="${y + 3}">(</text><text class="gp" x="${x + 5}" y="${y + 3}">)</text>`);
          // Grace notes (flam 1, drag 2): small heads just before the main note, slashed stem.
          for (let g = 0; g < (h.grace || 0); g++) {
            const gx = x - 6 - g * 3.5, gy = y - 1;
            body.push(`<ellipse class="gn" cx="${gx}" cy="${gy}" rx="2" ry="1.5"/><line class="gs" x1="${gx + 1.8}" y1="${gy}" x2="${gx + 1.8}" y2="${gy - 9}"/>`);
          }
        }
        body.push(`<line class="st" x1="${x + 3.2}" y1="${low - 1}" x2="${x + 3.2}" y2="${BEAM}"/>`);
        if (acc) body.push(`<path class="ac" d="M${x} ${BEAM - 9}L${x + 6} ${BEAM - 6.5}L${x} ${BEAM - 4}"/>`);
      }
      // Beams: one for eighths and triplets, two for sixteenths and sextuplets; quarters have none.
      if (xs.length && sub > 1) {
        const bx1 = xs[0] + 2.7, bx2 = xs.length > 1 ? xs[xs.length - 1] + 3.7 : xs[0] + 9;
        beams.push(`<rect class="bm" x="${bx1}" y="${BEAM}" width="${bx2 - bx1}" height="2.5"/>`);
        if (sub >= 4) beams.push(`<rect class="bm" x="${bx1}" y="${BEAM + 4.5}" width="${bx2 - bx1}" height="2.5"/>`);
      }
    }

    if (letters) {
      const ly = H - 3;
      o.letters.slice(0, n).forEach((l, i) => {
        if (l && l.c) body.push(`<text class="lt ${l.cls || ''}" x="${X(i)}" y="${ly}" text-anchor="middle">${l.c}</text>`);
      });
    }
    const scale = o.scale || 1.2;
    return `<svg class="ms" viewBox="0 0 ${W} ${H}" width="${Math.round(W * scale)}" height="${Math.round(H * scale)}" role="img" aria-label="${o.label || '半小節譜例'}">${s}${beams.join('')}${body.join('')}</svg>`;
  }

  const api = { svg };
  if (typeof window !== 'undefined') window.MiniStaff = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
