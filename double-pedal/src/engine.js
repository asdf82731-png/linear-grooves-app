// Double Pedal playback: synthesized kit (right foot panned right, left foot left), metronome, count-in,
// auto-speed-up and auto-advance. Reads the latest settings through get() and reports to the screen through on*.
import {createAudio, createWakeLock, SUB_CLICK} from '../../shared/src/audio.js';
import {setInterval, clearInterval} from '../../shared/src/timer.js';
import {AMP, swapped} from './data.js';

const PAN = {RH: 0.2, LH: -0.1, RF: 0.35, LF: -0.35};

export function createEngine({get, onSlot, onCount, onReps, onShow, onMsg, onBpm, onTimeUp}) {
  const A = createAudio({masterGain: 2.8});
  const wake = createWakeLock();
  let playing = false, step = 0, nextTime = 0, timer = null, raf = 0, countSlots = 0, reps = 0, loops = 0, startedAt = 0;
  let queue = [], schedEx = null, schedCL = [], schedIdx = 0, bpm = 70;

  function hit(inst, t, amp, pan) {
    const {env, tone, noise} = A, dest = A.out(pan);
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
        schedCL = swapped(schedEx, S.leftLead);
        step = 0; n = 0; i = 0;
        queue.push({t, show: schedIdx});
      }
      queue.push({t, reps});
    }
    for (const l of schedCL) {
      const h = l.hits[i];
      if (h !== '.' && audible(l.limb)) hit(l.inst, t, AMP[h], PAN[l.limb]);
    }
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
      else onSlot(e.i, schedEx.sub);
    }
    raf = requestAnimationFrame(draw);
  }

  function play() {
    const {S, sheet, idx} = get();
    A.ensure();
    playing = true;
    schedIdx = idx;
    schedEx = sheet[idx];
    schedCL = swapped(schedEx, S.leftLead);
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
    reps: () => reps,
  };
}
