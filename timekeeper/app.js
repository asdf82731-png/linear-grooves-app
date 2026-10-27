'use strict';

/* Time Keeper: a metronome that checks your time.
 * The metronome is scheduled one beat at a time on the AudioContext clock. The microphone runs through
 * an AudioWorklet (onset-worklet.js) on that same clock, so every detected hit can be compared directly
 * with the beat it belongs to. The latency calibration removes the delay of the whole loop
 * (tablet → Xenyx → headphones → you → tablet microphone).
 */

const MODE_NAME = { metro: '節拍器', gap: 'Gap click', shift: '位移節拍器', ramp: '漸進速度' };

/* What to play while practising. Every hit lands on the quarter or eighth-note grid, because the
 * microphone only checks those; picking a pattern sets 「你打的音符」 to match (det).
 * One bar of 4/4 per pattern, one character per slot (x hit, . rest); sub = slots per beat.
 * RH plays `hand` (sn or hh), LH snare, RF bass drum, LF bass drum (double pedal). */
const PATTERNS = [
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
function patternStaff(p, beats, scale) {
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
  return MiniStaff.svg({ sub: p.sub, slots, letters, scale, label: `${p.name}：${beats === 4 ? '一小節' : '前 2 拍'}` });
}
const SHIFT_NAME = { 24: '2、4 拍', and: '每拍的 &', e: '每拍的 e', a: '每拍的 a', bar: '每小節第 1 拍', '2bar': '每 2 小節第 1 拍' };
const SHIFT_CELL = { and: 2, e: 1, a: 3 };   // where the click sits in a beat split into 1 e & a
const SUB_NAME = { 2: '8 分音符', 3: '8 分三連音', 4: '16 分音符', 6: '16 分六連音' };
const MIN_BPM = 30, MAX_BPM = 300;
const SUB_CLICK = 0.3;          // subdivision clicks: same sound, about 10 dB under the beat
const PERFECT_MS = 10;          // within ±10 ms counts as on time
const GAP_OK_MS = 30;           // a Gap click round succeeds when the return beat is within ±30 ms
const LOG_MAX = 500;

const DEFAULTS = {
  mode: 'gap', bpm: 80, meter: 4, subGrid: 2, subLevel: 'off', countIn: true,
  gapPlay: 2, gapMute: 2, gapShow: false, gapGrow: false, gapMax: 8,
  shiftPos: '24', rampKind: 'linear', rampEnd: 120, rampEvery: 4, rampStep: 5,
  detNote: 'q', sens: 6, seenGuide: false, pattern: 'q-single',
};

/* ---------- Storage (best effort) ---------- */
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const S = Object.assign({}, DEFAULTS, load('tk.settings', {}));
let log = load('tk.log', []);
let latencyRec = load('tk.latency', null);   // { ms, date }

const $ = (s) => document.querySelector(s);
function saveSettings() { save('tk.settings', S); }
const latencyMs = () => (latencyRec ? latencyRec.ms : 0);
const clampBpm = (v) => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)));

/* ---------- Audio ---------- */
let ctx = null, clickBus = null;
function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    // Same output chain as the other apps: a limiter that only touches the loudest peaks, then a soft clipper.
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
    comp.connect(half).connect(clip).connect(ctx.destination);
    clickBus = ctx.createGain();
    clickBus.gain.value = 0.9;
    clickBus.connect(comp);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

// The same wood-block click as the other apps, on every beat (no louder first beat).
let nodes = [];   // scheduled clicks, so stop() can silence the ones not yet played
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
  nodes.push({ o, t });
}

/* ---------- Scheduler: one beat at a time ---------- */
let playing = false, timer = null, wakeLock = null;
let nextT = 0, beatNo = 0, beatInBar = 0, barNo = 0, curBpm = 80, firstBeatT = 0;
let cycleNo = 0, cycleBar = 0, muteBars = 2;     // Gap click
let rampDir = 1;                                 // 漸進速度
let queue = [];                                  // what the screen should show, and when
let expected = [];                               // beat grid the hits are compared with

function startState() {
  curBpm = S.bpm;
  beatNo = S.countIn ? -S.meter : 0;
  beatInBar = 0;
  barNo = 0;
  cycleNo = 0;
  cycleBar = 0;
  muteBars = S.gapMute;
  rampDir = S.rampEnd >= S.bpm ? 1 : -1;
  lastReturn = null;
  gapPairs = [];
}

// Called at the start of every bar (after the count-in): tempo steps and Gap click growth.
function barStart(t) {
  if (S.mode === 'ramp' && barNo > 0 && barNo % S.rampEvery === 0) {
    const start = S.bpm, end = S.rampEnd, lo = Math.min(start, end), hi = Math.max(start, end);
    let next = curBpm + rampDir * S.rampStep;
    if (S.rampKind === 'ladder') {
      if (next >= hi || next <= lo) { next = Math.max(lo, Math.min(hi, next)); rampDir = -rampDir; }
    } else {
      next = rampDir > 0 ? Math.min(end, next) : Math.max(end, next);
    }
    if (next !== curBpm) {
      curBpm = next;
      queue.push({ t, bpm: curBpm });
    }
  }
  if (S.mode === 'gap' && S.gapGrow && cycleNo > 0 && cycleBar === S.gapPlay && muteBars < S.gapMax) {
    const ok = !micActive || (lastReturn && lastReturn.cycle === cycleNo && Math.abs(lastReturn.off) <= GAP_OK_MS);
    if (ok) {
      muteBars++;
      queue.push({ t, msg: `成功！這一輪安靜 ${muteBars} 小節` });
    }
  }
}

function infoText(muted) {
  if (S.mode === 'gap') {
    const where = muted ? `安靜中（第 ${cycleBar - S.gapPlay + 1} / ${muteBars} 小節）` : `響（第 ${cycleBar + 1} / ${S.gapPlay} 小節）`;
    return `第 ${cycleNo + 1} 輪 · ${where}`;
  }
  if (S.mode === 'ramp') {
    const left = S.rampEvery - (barNo % S.rampEvery);
    const done = S.rampKind === 'linear' && curBpm === S.rampEnd;
    return `${curBpm} BPM · ${done ? '已經到終點' : `再 ${left} 小節變速`}`;
  }
  if (S.mode === 'shift') return `click 在：${SHIFT_NAME[S.shiftPos]} · 第 ${barNo + 1} 小節`;
  return `${S.meter}/4 · 第 ${barNo + 1} 小節`;
}

function scheduleBeat(t) {
  const dur = 60 / curBpm;
  if (beatNo < 0) {                                   // count-in: a plain click on every beat
    click(t);
    queue.push({ t, count: beatNo + S.meter + 1 });
  } else {
    if (beatInBar === 0) barStart(t);
    const d = 60 / curBpm;                            // barStart may have changed the tempo
    const muted = S.mode === 'gap' && cycleBar >= S.gapPlay;
    if (S.mode === 'shift') {
      const p = S.shiftPos;
      if (p === '24' && beatInBar % 2 === 1) click(t);
      else if (SHIFT_CELL[p]) click(t + (d * SHIFT_CELL[p]) / 4);
      else if (p === 'bar' && beatInBar === 0) click(t);
      else if (p === '2bar' && beatInBar === 0 && barNo % 2 === 0) click(t);
    } else if (!muted) {
      click(t);
      if (S.subLevel !== 'off') for (let j = 1; j < S.subGrid; j++) click(t + (d * j) / S.subGrid, S.subLevel === 'same' ? 1 : SUB_CLICK);
    }
    // The grid your hits are compared with: every beat, or every eighth note.
    const ret = S.mode === 'gap' && cycleNo > 0 && cycleBar === 0 && beatInBar === 0 ? cycleNo : null;
    const parts = S.detNote === 'e' ? 2 : 1;
    for (let k = 0; k < parts; k++) {
      expected.push({ t: t + (d * k) / parts, w: d / parts / 2, mute: muted, cycle: cycleNo, bpm: curBpm, ret: k === 0 ? ret : null });
      if (sess) sess.grid.push(t + (d * k) / parts);
    }
    const hide = muted && !S.gapShow;
    queue.push({ t, beat: beatInBar, muted, hide, info: hide ? `第 ${cycleNo + 1} 輪 · 安靜中，繼續打` : infoText(muted) });
  }
  nextT = t + (beatNo < 0 ? dur : 60 / curBpm);
  beatNo++;
  if (beatNo <= 0) return;                            // still counting in (beatNo 0 = first real beat)
  if (++beatInBar >= S.meter) {
    beatInBar = 0;
    barNo++;
    if (S.mode === 'gap' && ++cycleBar >= S.gapPlay + muteBars) { cycleBar = 0; cycleNo++; }
  }
}

function tick() {
  while (nextT < ctx.currentTime + 0.15) scheduleBeat(nextT);
  const old = ctx.currentTime - 2;
  if (expected.length && expected[0].t < old) expected = expected.filter((e) => e.t >= old);
  if (nodes.length > 64) nodes = nodes.filter((n) => n.t > ctx.currentTime - 1);
}

/* ---------- Screen ---------- */
let lit = -1;
function renderBeats() {
  const shift = S.mode === 'shift';
  let html = '';
  for (let b = 0; b < S.meter; b++) {
    let cells = '';
    if (shift) {
      const on = (k) => (S.shiftPos === '24' ? b % 2 === 1 && k === 0
        : SHIFT_CELL[S.shiftPos] != null ? k === SHIFT_CELL[S.shiftPos]
          : b === 0 && k === 0);
      cells = `<span class="cells">${[0, 1, 2, 3].map((k) => `<i class="${on(k) ? 'c' : ''}"></i>`).join('')}</span>`;
    }
    html += `<span class="beat${b === 0 ? ' one' : ''}" data-b="${b}"><b>${b + 1}</b>${cells}</span>`;
  }
  $('#beats').innerHTML = html;
  $('#beats').classList.toggle('many', S.meter > 5);
  lit = -1;
}
function lightBeat(b) {
  const els = $('#beats').children;
  if (lit >= 0 && els[lit]) els[lit].classList.remove('on');
  if (b >= 0 && els[b]) els[b].classList.add('on');
  lit = b;
}

const curPattern = () => PATTERNS.find((p) => p.id === S.pattern) || PATTERNS[0];

// The pattern list (name + half a bar) and the full bar on the practice card.
function renderPatterns() {
  const p = curPattern();
  $('#patName').textContent = p.name;
  $('#patStaff').innerHTML = patternStaff(p, 4, 1.7);
  let html = '', group = '';
  PATTERNS.forEach((q, i) => {
    if (q.group !== group) { group = q.group; html += `<li class="pat-group">${group}</li>`; }
    html += `<li><button type="button" class="ex${q.id === p.id ? ' cur' : ''}" data-p="${q.id}">
      <span class="ex-main"><span class="ex-name">${q.name}</span><span class="ex-en">偵測 ${q.det === 'e' ? '8 分' : '4 分'}音符</span></span>
      <span class="ex-mini">${patternStaff(q, 2)}</span></button></li>`;
  });
  $('#patList').innerHTML = html;
}

function renderMode() {
  $('#modeName').textContent = MODE_NAME[S.mode];
  const sub = {
    metro: `${S.meter}/4${S.subLevel === 'off' ? '' : ` · 細分 ${SUB_NAME[S.subGrid]}`}`,
    gap: `響 ${S.gapPlay} 小節 · 安靜 ${S.gapMute} 小節${S.gapGrow ? `（漸進到 ${S.gapMax}）` : ''}`,
    shift: `click 在 ${SHIFT_NAME[S.shiftPos]}`,
    ramp: `${S.bpm} → ${S.rampEnd} BPM · 每 ${S.rampEvery} 小節 ${S.rampEnd >= S.bpm ? '+' : '−'}${S.rampStep}${S.rampKind === 'ladder' ? ' · 速度梯' : ''}`,
  }[S.mode];
  $('#modeSub').textContent = sub;
  document.querySelectorAll('.mode-opts').forEach((el) => { el.hidden = el.dataset.mode !== S.mode; });
  $(`#mode-${S.mode}`).checked = true;
  if (!playing) $('#info').textContent = `${S.meter}/4 · 按 ▶ 開始${micActive ? '，麥克風正在聽' : ''}`;
  renderBeats();
}

let flashTimer = null;
function flash(msg) {
  $('#status').textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { if ($('#status').textContent === msg) $('#status').textContent = ''; }, 2600);
}

function draw() {
  if (!playing) return;
  const now = ctx.currentTime;
  while (queue.length && queue[0].t <= now) {
    const e = queue.shift();
    if (e.count !== undefined) {
      $('#status').textContent = `預備 ${e.count}`;
      lightBeat(e.count - 1);
    } else if (e.bpm !== undefined) {
      showBpm(e.bpm);
      flash(`${e.bpm} BPM`);
    } else if (e.msg) flash(e.msg);
    else {
      if ($('#status').textContent.startsWith('預備')) $('#status').textContent = '';
      lightBeat(e.hide ? -1 : e.beat);
      $('#beats').classList.toggle('quiet', e.muted);
      $('#info').textContent = e.info;
    }
  }
  requestAnimationFrame(draw);
}

/* ---------- Transport ---------- */
async function play() {
  if (calib) cancelCalib('已取消校正');
  ensureAudio();
  playing = true;
  startState();
  queue = [];
  expected = [];
  nodes = [];
  nextT = ctx.currentTime + 0.1;
  firstBeatT = nextT + (S.countIn ? (S.meter * 60) / S.bpm : 0);
  startSession();
  tick();
  timer = setInterval(tick, 25);
  requestAnimationFrame(draw);
  setPlayIcon();
  $('#result').hidden = true;
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { wakeLock = null; }
}
function stop() {
  if (!playing) return;
  playing = false;
  clearInterval(timer);
  const now = ctx.currentTime;
  for (const n of nodes) if (n.t > now) { try { n.o.stop(); } catch { /* already stopped */ } }
  nodes = [];
  queue = [];
  lightBeat(-1);
  $('#beats').classList.remove('quiet');
  $('#status').textContent = '';
  showBpm(S.bpm);
  setPlayIcon();
  finishSession(now);
  renderMode();
  try { wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}
function setPlayIcon() {
  $('#playIcon').setAttribute('d', playing ? 'M6 5h4.5v14H6zM13.5 5H18v14h-4.5z' : 'M7 4.5v15l13-7.5z');
  $('#btnPlay').setAttribute('aria-label', playing ? '停止' : '播放');
}
function showBpm(v) {
  $('#bpm').value = v;
  if (document.activeElement !== $('#bpmOut')) $('#bpmOut').value = v;
}
function setBpm(v) {
  S.bpm = clampBpm(v);
  showBpm(S.bpm);
  if (playing && S.mode !== 'ramp') curBpm = S.bpm;   // takes effect from the next beat
  saveSettings();
  renderMode();
}
// Changes that alter the beat pattern restart cleanly.
function restartIfPlaying() { if (playing) { stop(); play(); } }

/* ---------- Tap tempo ---------- */
let taps = [];
function tap() {
  const now = performance.now();
  if (taps.length && now - taps.at(-1) > 2000) taps = [];
  taps.push(now);
  if (taps.length > 4) taps.shift();
  if (taps.length < 4) { flash(`再點 ${4 - taps.length} 下`); return; }
  const avg = (taps.at(-1) - taps[0]) / 3;
  setBpm(60000 / avg);
  flash(`${S.bpm} BPM`);
}

/* ---------- Microphone ---------- */
let micActive = false, micStream = null, micSrc = null, micNode = null, workletReady = false;
let lastReturn = null, gapPairs = [];

async function micStart() {
  ensureAudio();
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('這個瀏覽器不能用麥克風'), { name: 'NoMedia' });
    if (!ctx.audioWorklet) throw Object.assign(new Error('這個瀏覽器不支援 AudioWorklet'), { name: 'NoWorklet' });
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    if (!workletReady) { await ctx.audioWorklet.addModule('onset-worklet.js'); workletReady = true; }
    micSrc = ctx.createMediaStreamSource(micStream);
    micNode = new AudioWorkletNode(ctx, 'onset');
    micNode.port.onmessage = onMic;
    micNode.port.postMessage({ sensitivity: S.sens });
    // The detector has to be pulled by the graph to run; route it to the output at zero volume.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    micSrc.connect(micNode).connect(mute).connect(ctx.destination);
    micActive = true;
    setMicUi();
    if (!latencyRec) flash('第一次使用，請先做「延遲校正」');
    else flash('麥克風開始聽了');
  } catch (err) {
    micStop();
    const msg = err.name === 'NotAllowedError' ? '沒有麥克風權限：請到 Chrome 的網站設定允許麥克風'
      : err.name === 'NotFoundError' ? '找不到麥克風'
        : `麥克風打不開：${err.message}`;
    flash(msg);
    $('#levelNote').textContent = msg;
  }
}
function micStop() {
  try { micSrc?.disconnect(); micNode?.disconnect(); } catch { /* ignore */ }
  micStream?.getTracks().forEach((tr) => tr.stop());
  micStream = micSrc = micNode = null;
  micActive = false;
  if (calib) cancelCalib('麥克風關了，校正取消');
  setMicUi();
}
function setMicUi() {
  $('#btnMic').textContent = micActive ? '停止聽' : '開始聽';
  $('#btnMic').setAttribute('aria-pressed', String(micActive));
  $('#btnMic').classList.toggle('on', micActive);
  $('#meter').hidden = !micActive;
  if (!micActive) { $('#levelBar').style.width = '0'; }
  if (!playing) renderMode();
}

// dBFS → position on the level meter (−60 … 0 dB)
const levelPos = (v) => Math.max(0, Math.min(100, ((20 * Math.log10(Math.max(v, 1e-6)) + 60) / 60) * 100));
function onMic(e) {
  const d = e.data;
  if (d.level !== undefined) {
    $('#levelBar').style.width = `${levelPos(d.level)}%`;
    $('#levelThr').style.left = `${levelPos(d.threshold)}%`;
    $('#levelNote').textContent = d.level > d.threshold ? '有聽到打擊' : '目前很安靜';
  } else if (d.hit !== undefined) handleHit(d.hit);
}

// A hit at AudioContext time `raw`: match it to the nearest beat (or eighth) and score it.
function handleHit(raw) {
  if (calib) { calibHit(raw); return; }
  if (!playing || !sess) return;
  const t = raw - latencyMs() / 1000;
  let best = null, bd = Infinity;
  for (const e of expected) {
    const d = Math.abs(t - e.t);
    if (d < bd) { bd = d; best = e; }
  }
  if (!best || bd > best.w || best.hit) return;
  best.hit = true;
  const off = (t - best.t) * 1000;
  sess.hits.push({ at: best.t - firstBeatT, off, mute: best.mute });
  showHit(off);
  if (best.mute) gapPairs.push({ cycle: best.cycle, e: best.t, t, bpm: best.bpm });
  if (best.ret != null) {
    lastReturn = { cycle: best.ret, off };
    const speed = gapSpeed(best.ret - 1);
    flash(`回來時${describeOff(off)}${speed ? `；安靜時你的速度約 ${speed.bpm.toFixed(1)} BPM` : ''}`);
  }
}

// Your tempo while the click was silent: the slope of your hits against the beats they belong to.
function gapSpeed(cycle) {
  const p = gapPairs.filter((x) => x.cycle === cycle);
  gapPairs = gapPairs.filter((x) => x.cycle > cycle);
  if (p.length < 4 || p.at(-1).e - p[0].e < 1) return null;
  const me = p.reduce((s, x) => s + x.e, 0) / p.length, mt = p.reduce((s, x) => s + x.t, 0) / p.length;
  let num = 0, den = 0;
  for (const x of p) { num += (x.e - me) * (x.t - mt); den += (x.e - me) ** 2; }
  const slope = num / den, bpm = p[0].bpm / slope;
  if (sess) sess.gapBpms.push({ bpm, target: p[0].bpm });
  return { bpm };
}

function describeOff(off) {
  const r = Math.round(Math.abs(off));
  if (r <= PERFECT_MS) return `很準（${off < 0 ? '−' : '+'}${r} 毫秒）`;
  return off < 0 ? `快了 ${r} 毫秒` : `慢了 ${r} 毫秒`;
}

let recent = [];
function showHit(off) {
  recent.push(off);
  if (recent.length > 8) recent.shift();
  $('#meterDots').innerHTML = recent.map((o, i) => {
    const x = 50 + (Math.max(-50, Math.min(50, o)) / 50) * 50;
    const cls = Math.abs(o) <= PERFECT_MS ? 'ok' : o < 0 ? 'early' : 'late';
    return `<i class="${cls}" style="left:${x}%;opacity:${(0.25 + (0.75 * (i + 1)) / recent.length).toFixed(2)}"></i>`;
  }).join('');
  $('#meterLast').textContent = `這一下${describeOff(off)}`;
}

/* ---------- Latency calibration: tap 8 times along with the click ---------- */
let calib = null, calibTimer = null;
function startCalib() {
  if (!micActive) { flash('先按左下角「開始聽」打開麥克風'); return; }
  if (playing) stop();
  ensureAudio();
  const beat = 60 / 80, t0 = ctx.currentTime + 0.4;
  calib = { clicks: [], hits: [] };
  for (let k = 0; k < 12; k++) { click(t0 + k * beat); calib.clicks.push(t0 + k * beat); }
  $('#calibOut').textContent = '先聽 4 下，第 5 下開始跟著 click 打 8 下（打小鼓 pad）';
  $('#btnCalib').textContent = '取消校正';
  calibTimer = setTimeout(finishCalib, (t0 + 12 * beat + 0.6 - ctx.currentTime) * 1000);
}
function calibHit(raw) {
  const tapClicks = calib.clicks.slice(4);
  if (raw < tapClicks[0] - 0.3) return;
  let bd = Infinity;
  for (const c of tapClicks) if (Math.abs(raw - c) < Math.abs(bd)) bd = raw - c;
  if (Math.abs(bd) > 0.35) return;
  calib.hits.push(bd * 1000);
  $('#calibOut').textContent = `第 ${calib.hits.length} / 8 下`;
  if (calib.hits.length >= 8) finishCalib();
}
function finishCalib() {
  clearTimeout(calibTimer);
  if (!calib) return;
  const h = calib.hits.slice().sort((a, b) => a - b);
  calib = null;
  $('#btnCalib').textContent = '延遲校正';
  if (h.length < 6) { $('#calibOut').textContent = `只抓到 ${h.length} 下，請調高靈敏度再試一次`; return; }
  const mid = Math.floor(h.length / 2);
  const med = h.length % 2 ? h[mid] : (h[mid - 1] + h[mid]) / 2;
  if (med < -30 || med > 400) { $('#calibOut').textContent = `量到 ${Math.round(med)} 毫秒，不太合理，請再試一次`; return; }
  latencyRec = { ms: Math.round(med), date: new Date().toISOString().slice(0, 10) };
  save('tk.latency', latencyRec);
  renderCalib();
  flash(`校正完成：延遲 ${latencyRec.ms} 毫秒`);
}
function cancelCalib(msg) {
  clearTimeout(calibTimer);
  calib = null;
  if (ctx) for (const n of nodes) if (n.t > ctx.currentTime) { try { n.o.stop(); } catch { /* ignore */ } }
  nodes = [];
  $('#btnCalib').textContent = '延遲校正';
  renderCalib();
  if (msg) flash(msg);
}
function renderCalib() {
  $('#calibOut').textContent = latencyRec ? `延遲 ${latencyRec.ms} 毫秒（${latencyRec.date} 校正）；換了平板位置或接線請重做` : '還沒校正';
}

/* ---------- Sessions, results and the practice log ---------- */
let sess = null;
function startSession() {
  sess = { mode: S.mode, bpm: S.bpm, hits: [], grid: [], gapBpms: [] };
  recent = [];
  $('#meterDots').innerHTML = '';
  $('#meterLast').textContent = '還沒有聽到打擊';
}
const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = avg(a); return Math.sqrt(avg(a.map((x) => (x - m) ** 2))); };

function finishSession(stopT) {
  const s = sess;
  sess = null;
  if (!s) return;
  const dur = Math.max(0, stopT - firstBeatT);
  const offs = s.hits.map((h) => h.off);
  const due = s.grid.filter((t) => t <= stopT - 0.05).length;
  const entry = { d: new Date().toISOString(), mode: s.mode, bpm: s.bpm, dur: Math.round(dur) };
  if (offs.length >= 4) {
    entry.n = offs.length;
    entry.due = due;
    entry.mean = Math.round(avg(offs) * 10) / 10;
    entry.sd = Math.round(sd(offs) * 10) / 10;
    if (s.gapBpms.length) entry.gap = Math.round(avg(s.gapBpms.map((g) => g.bpm - g.target)) * 10) / 10;
    showResult(s, entry, dur);
  }
  if (dur >= 10) {
    log.unshift(entry);
    log = log.slice(0, LOG_MAX);
    save('tk.log', log);
    renderLog();
  }
}

function showResult(s, e, dur) {
  const lean = e.mean < -5 ? '偏早（搶拍）' : e.mean > 5 ? '偏晚（拖拍）' : '很準';
  const steady = e.sd < 10 ? '非常穩' : e.sd < 20 ? '穩' : '不太穩';
  const drift = e.gap == null ? '<b>—</b><small>Gap click 開麥克風才有</small>'
    : `<b>${e.gap > 0 ? '+' : ''}${e.gap} BPM</b><small>安靜時比設定${Math.abs(e.gap) < 1 ? '幾乎一樣' : e.gap > 0 ? '快' : '慢'}</small>`;
  $('#stats').innerHTML = `
    <div class="stat"><span>平均偏差</span><b>${e.mean > 0 ? '+' : ''}${e.mean} ms</b><small>${lean}</small></div>
    <div class="stat"><span>穩定度</span><b>±${e.sd} ms</b><small>${steady}</small></div>
    <div class="stat"><span>速度飄移</span>${drift}</div>`;
  $('#result').hidden = false;   // shown first, so the chart can be drawn at the width it really has
  $('#chart').innerHTML = hitChart(s.hits, dur, $('#chart').clientWidth);
  const rate = e.due ? e.n / e.due : 1;
  $('#resultNote').textContent = `抓到 ${e.n} / ${e.due} 下${rate < 0.9 ? '：抓不到的太多，數字可能不準，試著調高靈敏度或把平板放近一點' : ''}。${latencyRec ? '' : '還沒做延遲校正，平均偏差會包含裝置延遲。'}`;
}

// Offset of every hit over time: early below the line, late above; hollow dots were played in silence.
// Drawn at the container's own width so the 11 px labels stay 11 px on a phone.
function hitChart(hits, dur, width) {
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

function renderLog() {
  const fmt = (iso) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  $('#log').innerHTML = log.length ? log.slice(0, 20).map((e) => `
    <li><span class="lg-when">${fmt(e.d)}</span><span class="lg-what">${MODE_NAME[e.mode] || e.mode} · ${e.bpm} BPM · ${mmss(e.dur)}</span>
    <span class="lg-num">${e.sd != null ? `${e.mean > 0 ? '+' : ''}${e.mean} ms · ±${e.sd}` : '—'}</span></li>`).join('')
    : '<li class="empty">還沒有紀錄。練超過 10 秒、按停止後會記在這裡。</li>';
  $('#btnClearLog').hidden = !log.length;
  // Stability over the last 30 sessions that used the microphone, oldest on the left.
  const pts = log.filter((e) => e.sd != null).slice(0, 30).reverse();
  if (pts.length < 2) { $('#logChart').innerHTML = ''; return; }
  const W = 360, H = 140, L = 34, R = 10, T = 12, B = 22;
  const top = Math.max(20, Math.ceil(Math.max(...pts.map((p) => p.sd)) / 10) * 10);
  const X = (i) => L + (i / (pts.length - 1)) * (W - L - R), Y = (v) => T + (1 - v / top) * (H - T - B);
  let g = '';
  for (const v of [0, top / 2, top]) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 5}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`;
  g += `<polyline class="line" points="${pts.map((p, i) => `${X(i).toFixed(1)},${Y(p.sd).toFixed(1)}`).join(' ')}"/>`;
  g += pts.map((p, i) => `<circle class="pt${i === pts.length - 1 ? ' last' : ''}" cx="${X(i).toFixed(1)}" cy="${Y(p.sd).toFixed(1)}" r="${i === pts.length - 1 ? 4 : 2.5}"/>`).join('');
  g += `<text class="ax" x="${L}" y="${H - 6}">穩定度（±ms，越低越穩）· 最近 ${pts.length} 次</text>`;
  $('#logChart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="最近幾次練習的穩定度">${g}</svg>`;
}

/* ---------- Controls ---------- */
function syncControls() {
  $('#meterSel').value = S.meter;
  $('#subGrid').value = S.subGrid;
  $('#subLevel').value = S.subLevel;
  $('#countIn').checked = S.countIn;
  $('#gapPlay').value = S.gapPlay;
  $('#gapMute').value = S.gapMute;
  $('#gapShow').checked = S.gapShow;
  $('#gapGrow').checked = S.gapGrow;
  $('#gapMax').value = S.gapMax;
  $('#gapGrowOpts').hidden = !S.gapGrow;
  $('#shiftPos').value = S.shiftPos;
  $(S.rampKind === 'ladder' ? '#rampLadder' : '#rampLinear').checked = true;
  $('#rampEnd').value = S.rampEnd;
  $('#rampEvery').value = S.rampEvery;
  $('#rampStep').value = S.rampStep;
  $(S.detNote === 'e' ? '#detE' : '#detQ').checked = true;
  $('#sens').value = S.sens;
  $('#sensOut').textContent = S.sens;
  $('#guide').hidden = !!S.seenGuide;
  $('#helpBtn').setAttribute('aria-expanded', String(!S.seenGuide));
  showBpm(S.bpm);
  renderCalib();
}

function bind() {
  $('#btnPlay').addEventListener('click', () => (playing ? stop() : play()));
  $('#btnMic').addEventListener('click', () => (micActive ? micStop() : micStart()));
  $('#btnTap').addEventListener('click', tap);
  $('#btnCalib').addEventListener('click', () => (calib ? cancelCalib('已取消校正') : startCalib()));
  $('#bpm').addEventListener('input', (e) => setBpm(+e.target.value));
  $('#bpmDown').addEventListener('click', () => setBpm(S.bpm - 5));
  $('#bpmUp').addEventListener('click', () => setBpm(S.bpm + 5));
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
    if (S.bpm !== v) flash(`速度可以設定 ${MIN_BPM}–${MAX_BPM}，已改成 ${S.bpm}`);
  });

  const showGuide = (show) => {
    $('#guide').hidden = !show;
    $('#helpBtn').setAttribute('aria-expanded', String(show));
    if (show) $('#guide').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $('#helpBtn').addEventListener('click', () => showGuide($('#guide').hidden));
  $('#guideOk').addEventListener('click', () => { S.seenGuide = true; saveSettings(); showGuide(false); });

  // Settings that change the pattern: save, redraw, restart if playing.
  const set = (key, conv) => (e) => {
    S[key] = conv(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
    saveSettings();
    syncControls();
    renderMode();
    restartIfPlaying();
  };
  const num = (v) => +v, str = (v) => v, bool = (v) => !!v;
  document.querySelectorAll('input[name="mode"]').forEach((el) => el.addEventListener('change', set('mode', str)));
  document.querySelectorAll('input[name="rampKind"]').forEach((el) => el.addEventListener('change', set('rampKind', str)));
  document.querySelectorAll('input[name="detNote"]').forEach((el) => el.addEventListener('change', set('detNote', str)));
  $('#meterSel').addEventListener('change', set('meter', num));
  $('#subGrid').addEventListener('change', set('subGrid', num));
  $('#subLevel').addEventListener('change', set('subLevel', str));
  $('#countIn').addEventListener('change', set('countIn', bool));
  $('#gapPlay').addEventListener('change', set('gapPlay', num));
  $('#gapMute').addEventListener('change', set('gapMute', num));
  $('#gapShow').addEventListener('change', set('gapShow', bool));
  $('#gapGrow').addEventListener('change', set('gapGrow', bool));
  $('#gapMax').addEventListener('change', set('gapMax', num));
  $('#shiftPos').addEventListener('change', set('shiftPos', str));
  $('#rampEvery').addEventListener('change', set('rampEvery', num));
  $('#rampStep').addEventListener('change', set('rampStep', num));
  $('#rampEnd').addEventListener('change', set('rampEnd', (v) => clampBpm(+v || DEFAULTS.rampEnd)));
  $('#sens').addEventListener('input', (e) => {
    S.sens = +e.target.value;
    $('#sensOut').textContent = S.sens;
    micNode?.port.postMessage({ sensitivity: S.sens });
    saveSettings();
  });

  $('#patList').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-p]');
    if (!btn) return;
    const p = PATTERNS.find((q) => q.id === btn.dataset.p);
    S.pattern = p.id;
    S.detNote = p.det;   // the microphone checks the grid this pattern is played on
    saveSettings();
    syncControls();
    renderPatterns();
    restartIfPlaying();
    $('#practice').scrollIntoView({ behavior: 'smooth', block: 'start' });
    flash(`打：${p.name}`);
  });

  $('#btnClearLog').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (!b.classList.contains('armed')) {
      b.classList.add('armed');
      b.textContent = '確定清除全部紀錄？';
      setTimeout(() => { if (b.isConnected) { b.classList.remove('armed'); b.textContent = '清除紀錄'; } }, 3000);
      return;
    }
    b.classList.remove('armed');
    b.textContent = '清除紀錄';
    log = [];
    save('tk.log', log);
    renderLog();
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); playing ? stop() : play(); }
    else if (e.key === 't' || e.key === 'T') tap();
  });
  document.addEventListener('visibilitychange', async () => {
    if (playing && document.visibilityState === 'visible' && !wakeLock) {
      try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* ignore */ }
    }
  });
}

/* ---------- Boot ---------- */
if (!MODE_NAME[S.mode]) S.mode = 'gap';
if (!PATTERNS.some((p) => p.id === S.pattern)) S.pattern = PATTERNS[0].id;
if (!['off', 'soft', 'same'].includes(S.subLevel)) S.subLevel = 'off';
if (![2, 3, 4, 5, 6, 7].includes(S.meter)) S.meter = 4;
S.bpm = clampBpm(S.bpm);
syncControls();
bind();
renderMode();
renderPatterns();
renderLog();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  try { navigator.serviceWorker?.register('sw.js').catch(() => {}); } catch { /* not allowed here */ }
}
