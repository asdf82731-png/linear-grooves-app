// Linear Grooves playback: synthesised kit (accented notes louder), metronome, count-in and auto-speed-up.
// Plays the current flattened slots from get().SL, so edits made while playing are heard on the next slot.
import {createAudio, createWakeLock, SUB_CLICK} from '../../shared/src/audio.js';

export function createEngine({get, onSlot, onCount, onMsg, onBpm}) {
  const A = createAudio({masterGain: 2});
  const wake = createWakeLock();
  let playing = false, cur = 0, nextTime = 0, timer = null, raf = 0, countSlots = 0, loops = 0, queue = [], bpm = 80;

  function env(g, t, peak, dec) {
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dec);
  }
  function noise(t, dec, type, freq, peak, q) {
    const ctx = A.ctx, src = ctx.createBufferSource();
    src.buffer = A.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, peak, dec);
    src.connect(f).connect(g).connect(A.master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dec + 0.02);
  }
  function tone(t, f0, f1, dec, peak, type) {
    const ctx = A.ctx, o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.6);
    const g = ctx.createGain();
    env(g, t, peak, dec);
    o.connect(g).connect(A.master);
    o.start(t);
    o.stop(t + dec + 0.02);
  }
  const KIT = {
    // Djent cymbals: a bright crash wash, and a shorter, trashier china.
    crash: (t, a) => { noise(t, 1.1, 'highpass', 4200, 0.3 * a); noise(t, 0.5, 'bandpass', 3000, 0.16 * a, 0.6); },
    china: (t, a) => {
      noise(t, 0.55, 'bandpass', 2600, 0.38 * a, 0.9); noise(t, 0.35, 'highpass', 6000, 0.14 * a);
      tone(t, 523, 520, 0.4, 0.03 * a, 'square'); tone(t, 787, 783, 0.4, 0.025 * a, 'square');
    },
    k: (t, a) => { tone(t, 150, 44, 0.36, 1.0 * a); noise(t, 0.012, 'lowpass', 3000, 0.25 * a); },
    sn: (t, a) => { noise(t, 0.16, 'highpass', 1400, 0.6 * a); tone(t, 230, 170, 0.08, 0.35 * a, 'triangle'); },
    hh: (t, a) => { noise(t, 0.045, 'highpass', 7800, 0.38 * a); },
    ride: (t, a) => { noise(t, 0.5, 'bandpass', 6200, 0.18 * a, 0.9); tone(t, 2400, 2350, 0.35, 0.03 * a, 'triangle'); },
    t1: (t, a) => { tone(t, 230, 155, 0.28, 0.75 * a); noise(t, 0.02, 'bandpass', 1500, 0.15 * a); },
    ft: (t, a) => { tone(t, 125, 82, 0.4, 0.85 * a); noise(t, 0.02, 'bandpass', 900, 0.15 * a); },
  };

  function scheduleSlot(n, t) {
    const {S, SL, pattern} = get(), sub = pattern.sub;
    if (n < 0) {
      const k = n + countSlots;
      if (k % sub === 0) { A.click(t); queue.push({t, count: k / sub + 1}); }
      return;
    }
    const i = n % SL.length;
    if (i === 0 && n > 0) {
      loops++;
      if (S.trainer && loops % S.trainerEvery === 0 && bpm < S.trainerMax) {
        bpm = Math.min(S.trainerMax, bpm + S.trainerStep);
        queue.push({t, bpm, msg: `加速到 ${bpm} BPM`});
      }
    }
    const s = SL[i];
    KIT[s.voice](t, s.acc ? 1 : 0.55);
    if (S.click && i % sub === 0) A.click(t);
    else if (S.click && S.clickSub !== 'off') A.click(t, S.clickSub === 'same' ? 1 : SUB_CLICK);
    queue.push({t, i});
  }

  function tick() {
    while (nextTime < A.ctx.currentTime + 0.12) {
      scheduleSlot(cur, nextTime);
      nextTime += 60 / bpm / get().pattern.sub;
      cur++;
    }
  }

  function draw() {
    if (!playing) return;
    const now = A.ctx.currentTime;
    while (queue.length && queue[0].t <= now) {
      const e = queue.shift();
      if (e.count !== undefined) onCount(e.count);
      else if (e.msg) { onBpm(e.bpm); onMsg(e.msg); }
      else onSlot(e.i);
    }
    raf = requestAnimationFrame(draw);
  }

  function play() {
    const {S, pattern} = get();
    A.ensure();
    playing = true;
    bpm = S.bpm;
    countSlots = S.countIn ? pattern.beats * pattern.sub : 0;
    cur = -countSlots;
    loops = 0; queue = [];
    nextTime = A.ctx.currentTime + 0.08;
    tick();
    timer = setInterval(tick, 25);
    raf = requestAnimationFrame(draw);
    wake.on();
  }
  function stop() {
    playing = false;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    queue = [];
    wake.off();
  }

  return {
    play, stop,
    isPlaying: () => playing,
    setBpm: v => { bpm = v; },
    resetLoops: () => { loops = 0; },
    // a fresh groove starts from its first slot on the next tick
    restartGroove: () => { if (playing && cur > 0) cur = 0; },
  };
}
