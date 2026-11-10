// Result and practice-log charts as SVG strings (moved from the old app.js).
import {PERFECT_MS} from './core.js';

// Offset of every hit over time: early below the line, late above; hollow dots were played in silence.
// Drawn at the container's own width so the 11 px labels stay 11 px on a phone.
export function hitChart(hits, dur, width) {
  const W = Math.round(Math.max(300, Math.min(760, width || 640))), H = 200, L = 44, R = 12, T = 12, B = 28, lim = 60;
  const X = (s) => L + (Math.min(s, dur) / Math.max(dur, 1)) * (W - L - R);
  const Y = (ms) => T + ((lim - Math.max(-lim, Math.min(lim, ms))) / (2 * lim)) * (H - T - B);
  let g = `<rect class="band" x="${L}" y="${Y(PERFECT_MS)}" width="${W - L - R}" height="${Y(-PERFECT_MS) - Y(PERFECT_MS)}"/>`;
  for (const v of [-60, -30, 0, 30, 60]) {
    g += `<line class="${v ? 'grid' : 'zero'}" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/>`;
    g += `<text class="ax" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${v > 0 ? '+' : ''}${v}</text>`;
  }
  const step = (dur > 240 ? 60 : dur > 60 ? 30 : 10) * (W < 480 ? 2 : 1);
  const tl = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`);
  let s = 0;
  for (; s <= dur; s += step) g += `<text class="ax" x="${X(s)}" y="${H - 8}" text-anchor="middle">${tl(s)}</text>`;
  const end = Math.round(dur);
  if (end - (s - step) >= step / 2) g += `<text class="ax" x="${X(end)}" y="${H - 8}" text-anchor="end">${tl(end)}</text>`;
  for (const h of hits) {
    const cls = Math.abs(h.off) <= PERFECT_MS ? 'ok' : h.off < 0 ? 'early' : 'late';
    g += `<circle class="pt ${cls}${h.mute ? ' mute' : ''}" cx="${X(h.at).toFixed(1)}" cy="${Y(h.off).toFixed(1)}" r="3"/>`;
  }
  g += `<text class="ax" x="${L + 4}" y="${T + 10}">晚 ↑</text><text class="ax" x="${L + 4}" y="${H - B - 4}">早 ↓</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="每一下的偏差（毫秒）">${g}</svg>`;
}

// Stability over the last 30 sessions that used the microphone, oldest on the left.
export function logChart(log) {
  const pts = log.filter((e) => e.sd != null).slice(0, 30).reverse();
  if (pts.length < 2) return '';
  const W = 360, H = 140, L = 34, R = 10, T = 12, B = 22;
  const top = Math.max(20, Math.ceil(Math.max(...pts.map((p) => p.sd)) / 10) * 10);
  const X = (i) => L + (i / (pts.length - 1)) * (W - L - R), Y = (v) => T + (1 - v / top) * (H - T - B);
  let g = '';
  for (const v of [0, top / 2, top]) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 5}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<polyline class="line" points="${pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.sd).toFixed(1)}`).join(' ')}"/>`;
  g += pts.map((p, i) => `<circle class="pt${i === pts.length - 1 ? ' last' : ''}" cx="${X(i).toFixed(1)}" cy="${Y(p.sd).toFixed(1)}" r="${i === pts.length - 1 ? 4 : 2.5}"/>`).join('');
  g += `<text class="ax" x="${L}" y="${H - 6}">穩定度（±ms，越低越穩）· 最近 ${pts.length} 次</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="最近幾次練習的穩定度">${g}</svg>`;
}
