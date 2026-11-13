// Time Keeper: a metronome that checks your time.
// The metronome is scheduled one beat at a time on the AudioContext clock. The microphone runs through
// an AudioWorklet (onset-worklet.js) on that same clock, so every detected hit can be compared directly
// with the beat it belongs to. The latency calibration removes the delay of the whole loop
// (tablet → Xenyx → headphones → you → tablet microphone).
// Moved from the old app.js unchanged in timing and scoring; screen updates go out through the `ui` callbacks.
import {createAudio, createWakeLock, SUB_CLICK} from '../../shared/src/audio.js';
import {createScheduler} from '../../shared/src/scheduler.js';

export const MODE_NAME = {metro: '節拍器', gap: 'Gap click', shift: '位移節拍器', ramp: '漸進速度'};
export const SHIFT_NAME = {24: '2、4 拍', and: '每拍的 &', e: '每拍的 e', a: '每拍的 a', bar: '每小節第 1 拍', '2bar': '每 2 小節第 1 拍'};
export const SHIFT_CELL = {and: 2, e: 1, a: 3};   // where the click sits in a beat split into 1 e & a
export const SUB_NAME = {2: '8 分音符', 3: '8 分三連音', 4: '16 分音符', 6: '16 分六連音'};
export const MIN_BPM = 30, MAX_BPM = 300;
export const PERFECT_MS = 10;   // within ±10 ms counts as on time
const GAP_OK_MS = 30;           // a Gap click round succeeds when the return beat is within ±30 ms
export const clampBpm = v => Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)));

export function describeOff(off) {
  const r = Math.round(Math.abs(off));
  if (r <= PERFECT_MS) return `很準（${off < 0 ? '−' : '+'}${r} 毫秒）`;
  return off < 0 ? `快了 ${r} 毫秒` : `慢了 ${r} 毫秒`;
}

const avg = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = avg(a); return Math.sqrt(avg(a.map(x => (x - m) ** 2))); };

// get() → {S, latencyMs}; ui: onCount onBpm onMsg onBeat onStopped onLevel onHit onMic onMicError onCalib onCalibDone onSession onMidi
export function createKeeper(get, ui) {
  const A = createAudio({masterGain: 1});
  const wake = createWakeLock();
  const S = () => get().S;

  // The same wood-block click as the other apps; kept in `nodes` so stop() can silence the ones not yet played.
  let nodes = [];
  function click(t, level = 1) { nodes.push({o: A.click(t, level), t}); }
  function silenceFuture() {
    const now = A.ctx.currentTime;
    for (const n of nodes) if (n.t > now) { try { n.o.stop(); } catch { /* already stopped */ } }
    nodes = [];
  }

  /* ---------- Scheduler: one beat at a time ---------- */
  let playing = false;
  let nextT = 0, beatNo = 0, beatInBar = 0, barNo = 0, curBpm = 80, firstBeatT = 0;
  let cycleNo = 0, cycleBar = 0, muteBars = 2;   // Gap click
  let rampDir = 1;                               // 漸進速度
  let expected = [];                             // beat grid the hits are compared with
  let lastReturn = null, gapPairs = [];

  function startState() {
    const s = S();
    curBpm = s.bpm;
    beatNo = s.countIn ? -s.meter : 0;
    beatInBar = 0; barNo = 0; cycleNo = 0; cycleBar = 0;
    muteBars = s.gapMute;
    rampDir = s.rampEnd >= s.bpm ? 1 : -1;
    lastReturn = null;
    gapPairs = [];
  }

  // Called at the start of every bar (after the count-in): tempo steps and Gap click growth.
  function barStart(t) {
    const s = S();
    if (s.mode === 'ramp' && barNo > 0 && barNo % s.rampEvery === 0) {
      const start = s.bpm, end = s.rampEnd, lo = Math.min(start, end), hi = Math.max(start, end);
      let next = curBpm + rampDir * s.rampStep;
      if (s.rampKind === 'ladder') {
        if (next >= hi || next <= lo) { next = Math.max(lo, Math.min(hi, next)); rampDir = -rampDir; }
      } else {
        next = rampDir > 0 ? Math.min(end, next) : Math.max(end, next);
      }
      if (next !== curBpm) { curBpm = next; sch.push({t, bpm: curBpm}); }
    }
    if (s.mode === 'gap' && s.gapGrow && cycleNo > 0 && cycleBar === s.gapPlay && muteBars < s.gapMax) {
      const ok = !(micActive || midiOn) || (lastReturn && lastReturn.cycle === cycleNo && Math.abs(lastReturn.off) <= GAP_OK_MS);
      if (ok) { muteBars++; sch.push({t, msg: `成功！這一輪安靜 ${muteBars} 小節`}); }
    }
  }

  function infoText(muted) {
    const s = S();
    if (s.mode === 'gap') {
      const where = muted ? `安靜中（第 ${cycleBar - s.gapPlay + 1} / ${muteBars} 小節）` : `響（第 ${cycleBar + 1} / ${s.gapPlay} 小節）`;
      return `第 ${cycleNo + 1} 輪 · ${where}`;
    }
    if (s.mode === 'ramp') {
      const left = s.rampEvery - (barNo % s.rampEvery);
      const done = s.rampKind === 'linear' && curBpm === s.rampEnd;
      return `${curBpm} BPM · ${done ? '已經到終點' : `再 ${left} 小節變速`}`;
    }
    if (s.mode === 'shift') return `click 在：${SHIFT_NAME[s.shiftPos]} · 第 ${barNo + 1} 小節`;
    return `${s.meter}/4 · 第 ${barNo + 1} 小節`;
  }

  function scheduleBeat(t) {
    const s = S(), dur = 60 / curBpm;
    if (beatNo < 0) {                                   // count-in: a plain click on every beat
      click(t);
      sch.push({t, count: beatNo + s.meter + 1});
    } else {
      if (beatInBar === 0) barStart(t);
      const d = 60 / curBpm;                            // barStart may have changed the tempo
      const muted = s.mode === 'gap' && cycleBar >= s.gapPlay;
      if (s.mode === 'shift') {
        const p = s.shiftPos;
        if (p === '24' && beatInBar % 2 === 1) click(t);
        else if (SHIFT_CELL[p]) click(t + (d * SHIFT_CELL[p]) / 4);
        else if (p === 'bar' && beatInBar === 0) click(t);
        else if (p === '2bar' && beatInBar === 0 && barNo % 2 === 0) click(t);
      } else if (!muted) {
        click(t);
        if (s.subLevel !== 'off') for (let j = 1; j < s.subGrid; j++) click(t + (d * j) / s.subGrid, s.subLevel === 'same' ? 1 : SUB_CLICK);
      }
      // The grid your hits are compared with: every beat, or every eighth note.
      const ret = s.mode === 'gap' && cycleNo > 0 && cycleBar === 0 && beatInBar === 0 ? cycleNo : null;
      const parts = s.detNote === 'e' ? 2 : 1;
      for (let k = 0; k < parts; k++) {
        expected.push({t: t + (d * k) / parts, w: d / parts / 2, mute: muted, cycle: cycleNo, bpm: curBpm, ret: k === 0 ? ret : null});
        if (sess) sess.grid.push(t + (d * k) / parts);
      }
      const hide = muted && !s.gapShow;
      sch.push({t, beat: beatInBar, muted, hide, info: hide ? `第 ${cycleNo + 1} 輪 · 安靜中，繼續打` : infoText(muted)});
    }
    nextT = t + (beatNo < 0 ? dur : 60 / curBpm);
    beatNo++;
    if (beatNo <= 0) return;                            // still counting in (beatNo 0 = first real beat)
    if (++beatInBar >= s.meter) {
      beatInBar = 0;
      barNo++;
      if (s.mode === 'gap' && ++cycleBar >= s.gapPlay + muteBars) { cycleBar = 0; cycleNo++; }
    }
  }

  // housekeeping after each scheduling pass: forget beats and clicks that are long gone
  function tidy() {
    const ctx = A.ctx, old = ctx.currentTime - 2;
    if (expected.length && expected[0].t < old) expected = expected.filter(e => e.t >= old);
    if (nodes.length > 64) nodes = nodes.filter(n => n.t > ctx.currentTime - 1);
  }
  function onEvent(e) {
    if (e.count !== undefined) ui.onCount(e.count);
    else if (e.bpm !== undefined) ui.onBpm(e.bpm);
    else if (e.msg) ui.onMsg(e.msg);
    else ui.onBeat(e);
  }
  const sch = createScheduler({
    ctx: () => A.ctx,
    step: t => { scheduleBeat(t); return nextT - t; },
    onEvent, onTick: tidy, ahead: 0.15,
  });

  function play() {
    if (calib) cancelCalib('已取消校正');
    A.ensure();
    const s = S();
    playing = true;
    startState();
    expected = []; nodes = [];
    nextT = A.ctx.currentTime + 0.1;
    firstBeatT = nextT + (s.countIn ? (s.meter * 60) / s.bpm : 0);
    startSession();
    sch.start(0.1);
    wake.on();
  }
  function stop() {
    if (!playing) return;
    playing = false;
    sch.stop();
    silenceFuture();
    finishSession(A.ctx.currentTime);
    wake.off();
    ui.onStopped();
  }

  /* ---------- Microphone ---------- */
  let micActive = false, micStream = null, micSrc = null, micNode = null, workletReady = false;

  async function micStart() {
    A.ensure();
    const ctx = A.ctx;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('這個瀏覽器不能用麥克風'), {name: 'NoMedia'});
      if (!ctx.audioWorklet) throw Object.assign(new Error('這個瀏覽器不支援 AudioWorklet'), {name: 'NoWorklet'});
      micStream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: false, noiseSuppression: false, autoGainControl: false}});
      if (!workletReady) { await ctx.audioWorklet.addModule('onset-worklet.js'); workletReady = true; }
      micSrc = ctx.createMediaStreamSource(micStream);
      micNode = new AudioWorkletNode(ctx, 'onset');
      micNode.port.onmessage = onMic;
      micNode.port.postMessage({sensitivity: S().sens});
      // The detector has to be pulled by the graph to run; route it to the output at zero volume.
      const mute = ctx.createGain();
      mute.gain.value = 0;
      micSrc.connect(micNode).connect(mute).connect(ctx.destination);
      micActive = true;
      ui.onMic(true);
      ui.onMsg(get().latencyMs == null ? '第一次使用，請先做「延遲校正」' : '麥克風開始聽了');
    } catch (err) {
      micStop();
      const msg = err.name === 'NotAllowedError' ? '沒有麥克風權限：請到 Chrome 的網站設定允許麥克風'
        : err.name === 'NotFoundError' ? '找不到麥克風' : `麥克風打不開：${err.message}`;
      ui.onMicError(msg);
    }
  }
  function micStop() {
    try { micSrc?.disconnect(); micNode?.disconnect(); } catch { /* ignore */ }
    micStream?.getTracks().forEach(tr => tr.stop());
    micStream = micSrc = micNode = null;
    micActive = false;
    if (calib) cancelCalib('麥克風關了，校正取消');
    ui.onMic(false);
  }
  function onMic(e) {
    const d = e.data;
    if (d.level !== undefined) ui.onLevel(d.level, d.threshold);
    else if (d.hit !== undefined) handleHit(d.hit);
  }

  // A hit at AudioContext time `raw`: match it to the nearest beat (or eighth) and score it.
  // raw: AudioContext time of the hit; exact: already corrected (MIDI), so the microphone latency is not taken off
  function handleHit(raw, exact = false) {
    if (calib && !exact) { calibHit(raw); return; }
    if (!playing || !sess) return;
    const t = exact ? raw : raw - (get().latencyMs || 0) / 1000;
    let best = null, bd = Infinity;
    for (const e of expected) {
      const d = Math.abs(t - e.t);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best || bd > best.w || best.hit) return;
    best.hit = true;
    const off = (t - best.t) * 1000;
    sess.hits.push({at: best.t - firstBeatT, off, mute: best.mute});
    ui.onHit(off);
    if (best.mute) gapPairs.push({cycle: best.cycle, e: best.t, t, bpm: best.bpm});
    if (best.ret != null) {
      lastReturn = {cycle: best.ret, off};
      const speed = gapSpeed(best.ret - 1);
      ui.onMsg(`回來時${describeOff(off)}${speed ? `；安靜時你的速度約 ${speed.bpm.toFixed(1)} BPM` : ''}`);
    }
  }

  // Your tempo while the click was silent: the slope of your hits against the beats they belong to.
  function gapSpeed(cycle) {
    const p = gapPairs.filter(x => x.cycle === cycle);
    gapPairs = gapPairs.filter(x => x.cycle > cycle);
    if (p.length < 4 || p.at(-1).e - p[0].e < 1) return null;
    const me = avg(p.map(x => x.e)), mt = avg(p.map(x => x.t));
    let num = 0, den = 0;
    for (const x of p) { num += (x.e - me) * (x.t - mt); den += (x.e - me) ** 2; }
    const slope = num / den, bpm = p[0].bpm / slope;
    if (sess) sess.gapBpms.push({bpm, target: p[0].bpm});
    return {bpm};
  }

  /* ---------- Electronic drums over MIDI (Web MIDI API) ----------
   * Every note-on from any connected MIDI input is a hit. A MIDI message carries the exact time it arrived
   * (performance.now clock), turned here into AudioContext time, so no microphone and no latency calibration:
   * the only delay left is the tablet's own audio output (you play along with the click you hear), which
   * the browser reports as outputLatency. Works over USB (OTG) in Chrome on Android, Windows and macOS. */
  let midi = null, midiOn = false;
  const midiNames = () => (midi ? [...midi.inputs.values()].filter(i => i.state === 'connected').map(i => i.name || 'MIDI') : []);
  function toCtxTime(perfMs) {
    const ctx = A.ctx, ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
    if (ts && ts.performanceTime) return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    return ctx.currentTime - (performance.now() - perfMs) / 1000;
  }
  function outLatency() { const c = A.ctx; return (c.outputLatency || 0) + (c.baseLatency || 0); }
  function onMidiMessage(e) {
    const [st, note, vel] = e.data;
    if ((st & 0xf0) !== 0x90 || !vel) return;          // note-on with velocity > 0
    const t = toCtxTime(e.timeStamp || performance.now()) - outLatency();
    if (calib) return;                                  // calibration is for the microphone only
    handleHit(t, true);
    ui.onMidiHit?.(note, vel);
  }
  function midiListen() {
    for (const input of midi.inputs.values()) input.onmidimessage = midiOn ? onMidiMessage : null;
    ui.onMidi?.(midiOn, midiNames());
  }
  async function midiStart() {
    A.ensure();
    try {
      if (!navigator.requestMIDIAccess) throw new Error('這個瀏覽器不支援 MIDI（請用 Chrome）');
      midi = midi || await navigator.requestMIDIAccess();
      midi.onstatechange = () => midiListen();          // plugged in or out while the app is open
      midiOn = true;
      midiListen();
      const n = midiNames();
      ui.onMsg(n.length ? `已連接電子鼓：${n.join('、')}` : 'MIDI 已開啟，請用 USB 接上電子鼓');
    } catch (err) {
      midiOn = false;
      ui.onMidi?.(false, []);
      ui.onMicError(err.name === 'SecurityError' || err.name === 'NotAllowedError' ? '沒有 MIDI 權限：請到 Chrome 的網站設定允許' : `MIDI 打不開：${err.message}`);
    }
  }
  function midiStop() {
    midiOn = false;
    if (midi) midiListen();
  }

  /* ---------- Latency calibration: tap 8 times along with the click ---------- */
  let calib = null, calibTimer = null;
  function startCalib() {
    if (!micActive) { ui.onMsg('先按左下角「開始聽」打開麥克風'); return; }
    if (playing) stop();
    A.ensure();
    const ctx = A.ctx, beat = 60 / 80, t0 = ctx.currentTime + 0.4;
    calib = {clicks: [], hits: []};
    for (let k = 0; k < 12; k++) { click(t0 + k * beat); calib.clicks.push(t0 + k * beat); }
    ui.onCalib('先聽 4 下，第 5 下開始跟著 click 打 8 下（打小鼓 pad）', true);
    calibTimer = setTimeout(finishCalib, (t0 + 12 * beat + 0.6 - ctx.currentTime) * 1000);
  }
  function calibHit(raw) {
    const tapClicks = calib.clicks.slice(4);
    if (raw < tapClicks[0] - 0.3) return;
    let bd = Infinity;
    for (const c of tapClicks) if (Math.abs(raw - c) < Math.abs(bd)) bd = raw - c;
    if (Math.abs(bd) > 0.35) return;
    calib.hits.push(bd * 1000);
    ui.onCalib(`第 ${calib.hits.length} / 8 下`, true);
    if (calib.hits.length >= 8) finishCalib();
  }
  function finishCalib() {
    clearTimeout(calibTimer);
    if (!calib) return;
    const h = calib.hits.slice().sort((a, b) => a - b);
    calib = null;
    if (h.length < 6) { ui.onCalib(`只抓到 ${h.length} 下，請調高靈敏度再試一次`, false); return; }
    const mid = Math.floor(h.length / 2);
    const med = h.length % 2 ? h[mid] : (h[mid - 1] + h[mid]) / 2;
    if (med < -30 || med > 400) { ui.onCalib(`量到 ${Math.round(med)} 毫秒，不太合理，請再試一次`, false); return; }
    ui.onCalibDone({ms: Math.round(med), date: new Date().toISOString().slice(0, 10)});
  }
  function cancelCalib(msg) {
    clearTimeout(calibTimer);
    calib = null;
    if (A.ctx) silenceFuture();
    ui.onCalib(null, false);
    if (msg) ui.onMsg(msg);
  }

  /* ---------- Sessions and results ---------- */
  let sess = null;
  function startSession() { sess = {mode: S().mode, bpm: S().bpm, hits: [], grid: [], gapBpms: []}; }
  function finishSession(stopT) {
    const s = sess;
    sess = null;
    if (!s) return;
    const dur = Math.max(0, stopT - firstBeatT);
    const offs = s.hits.map(h => h.off);
    const due = s.grid.filter(t => t <= stopT - 0.05).length;
    const entry = {d: new Date().toISOString(), mode: s.mode, bpm: s.bpm, dur: Math.round(dur)};
    let result = null;
    if (offs.length >= 4) {
      entry.n = offs.length;
      entry.due = due;
      entry.mean = Math.round(avg(offs) * 10) / 10;
      entry.sd = Math.round(sd(offs) * 10) / 10;
      if (s.gapBpms.length) entry.gap = Math.round(avg(s.gapBpms.map(g => g.bpm - g.target)) * 10) / 10;
      result = {entry, hits: s.hits, dur};
    }
    ui.onSession(entry, result, dur >= 10);
  }

  return {
    play, stop,
    toggle: () => (playing ? stop() : play()),
    isPlaying: () => playing,
    // takes effect from the next beat (the ramp keeps its own tempo)
    setBpm: v => { if (playing && S().mode !== 'ramp') curBpm = v; },
    micToggle: () => (micActive ? micStop() : micStart()),
    isMic: () => micActive,
    midiToggle: () => (midiOn ? midiStop() : midiStart()),
    isMidi: () => midiOn,
    setSensitivity: v => micNode?.port.postMessage({sensitivity: v}),
    calibToggle: () => (calib ? cancelCalib('已取消校正') : startCalib()),
    isCalibrating: () => !!calib,
  };
}
