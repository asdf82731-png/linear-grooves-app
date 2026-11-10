// Djent playback: synthesized metal kit (tight kick, crash, china, toms), metronome, count-in,
// auto-speed-up, auto-advance and the practice timer. Reads the latest state through get().
import {createAudio, createWakeLock, SUB_CLICK} from '../../shared/src/audio.js';
import {AMP, LEVEL, PAN} from './music.js';

export function createEngine({get, onSlot, onCount, onReps, onShow, onMsg, onBpm, onTimeUp}) {
  const A = createAudio({masterGain: 2.6});
  const wake = createWakeLock();
  let playing = false, step = 0, nextTime = 0, timer = null, raf = 0, countSlots = 0, reps = 0, loops = 0, startedAt = 0;
  let queue = [], schedEx = null, schedIdx = 0, bpm = 80;

  function hit(inst, t, amp, pan) {
    const {env, tone, noise} = A, dest = A.out(pan);
    if (inst === 'bd') {
      // Tight metal kick: short body plus a click so fast doubles stay clear.
      env(tone(t, 0.2, 'sine', 130, 48), t, amp * 1.15, 0.2).connect(dest);
      env(noise(t, 0.015, 'highpass', 2500), t, amp * 0.35, 0.015).connect(dest);
    } else if (inst === 'sn') {
      env(noise(t, 0.18, 'bandpass', 1900, 0.8), t, amp * 0.85, 0.18).connect(dest);
      env(tone(t, 0.08, 'triangle', 220, 170), t, amp * 0.5, 0.08).connect(dest);
    } else if (inst === 'hh') {
      env(noise(t, 0.05, 'highpass', 7500), t, amp * 0.45, 0.05).connect(dest);
    } else if (inst === 'ride') {
      env(noise(t, 0.4, 'highpass', 5200), t, amp * 0.22, 0.4).connect(dest);
      env(tone(t, 0.3, 'square', 760), t, amp * 0.035, 0.3).connect(dest);
      env(tone(t, 0.3, 'square', 1140), t, amp * 0.025, 0.3).connect(dest);
    } else if (inst === 'crash') {
      // Bright wash with a fast attack.
      env(noise(t, 1.1, 'highpass', 4200), t, amp * 0.34, 1.1).connect(dest);
      env(noise(t, 0.5, 'bandpass', 3000, 0.6), t, amp * 0.18, 0.5).connect(dest);
    } else if (inst === 'china') {
      // Trashy and shorter than a crash: a mid-band noise burst plus clashing square partials.
      env(noise(t, 0.55, 'bandpass', 2600, 0.9), t, amp * 0.42, 0.55).connect(dest);
      env(noise(t, 0.35, 'highpass', 6000), t, amp * 0.16, 0.35).connect(dest);
      for (const [f, a] of [[523, 0.03], [787, 0.025], [1171, 0.02]]) env(tone(t, 0.4, 'square', f), t, amp * a, 0.4).connect(dest);
    } else if (inst === 't1' || inst === 't2' || inst === 'ft') {
      const [f0, f1, d] = {t1: [230, 155, 0.28], t2: [175, 118, 0.32], ft: [125, 82, 0.4]}[inst];
      env(tone(t, d, 'sine', f0, f1), t, amp * 0.95, d).connect(dest);
      env(noise(t, 0.02, 'bandpass', 1300, 1), t, amp * 0.18, 0.02).connect(dest);
    }
  }
  function audible(limb) {
    const p = get().S.playPart;
    if (p === 'all') return true;
    if (p === 'none') return false;
    return p === 'hands' ? limb[1] === 'H' : limb[1] === 'F';
  }

  function scheduleSlot(n, t) {
    const {S, sheet} = get(), sub = schedEx.sub;
    if (n < 0) {
      const k = n + countSlots;
      if (k % sub === 0) { A.click(t); queue.push({t, count: k / sub + 1}); }
      return;
    }
    let i = n % schedEx.len;
    if (i === 0 && n > 0) {
      reps++;
      loops++;
      if (S.trainer && loops % S.trainerEvery === 0 && bpm < S.trainerMax) {
        bpm = Math.min(S.trainerMax, bpm + S.trainerStep);
        queue.push({t, bpm, msg: `加快到 ${bpm} BPM`});
      }
      if (S.autoNext && S.reps && reps >= S.reps) {
        reps = 0;
        schedIdx = (schedIdx + 1) % sheet.length;
        schedEx = sheet[schedIdx];
        step = 0; n = 0; i = 0;
        queue.push({t, show: schedIdx});
      }
      queue.push({t, reps});
    }
    for (const h of schedEx.slots[i]) if (audible(h.limb)) hit(h.inst, t, AMP * (LEVEL[h.lvl] || 1), PAN[h.limb]);
    if (S.click && i % sub === 0) A.click(t);
    else if (S.click && S.clickSub !== 'off') A.click(t, S.clickSub === 'same' ? 1 : SUB_CLICK);
    queue.push({t, i});
  }

  function tick() {
    while (nextTime < A.ctx.currentTime + 0.12) {
      scheduleSlot(step, nextTime);
      nextTime += 60 / bpm / schedEx.sub;
      step++;
    }
  }

  function draw() {
    if (!playing) return;
    const {S} = get();
    if (S.timer && performance.now() - startedAt >= S.timer * 60000) { stop(); onTimeUp(S.timer); return; }
    const now = A.ctx.currentTime;
    while (queue.length && queue[0].t <= now) {
      const e = queue.shift();
      if (e.show !== undefined) onShow(e.show);
      else if (e.count !== undefined) onCount(e.count);
      else if (e.msg) { onBpm(e.bpm); onMsg(e.msg); }
      else if (e.reps !== undefined) onReps(e.reps);
      else onSlot(e.i, schedEx);
    }
    raf = requestAnimationFrame(draw);
  }

  function play() {
    const {S, sheet, idx} = get();
    A.ensure();
    playing = true;
    schedIdx = idx;
    schedEx = sheet[idx];
    bpm = S.bpm;
    countSlots = S.countIn ? 4 * schedEx.sub : 0;
    step = -countSlots;
    reps = 0; loops = 0; queue = [];
    startedAt = performance.now();
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
    resetTimer: () => { startedAt = performance.now(); },
    elapsed: () => performance.now() - startedAt,
  };
}
