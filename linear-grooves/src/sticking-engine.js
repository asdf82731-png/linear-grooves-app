// Sticking playback: practice-pad sound (R panned right, L left), flams and drags from the other hand,
// polyrhythm lanes with 「只聽…」, metronome, count-in, auto-speed-up and auto-advance.
import {createAudio, createWakeLock, SUB_CLICK} from '../../shared/src/audio.js';
import {swapped} from './sticking-data.js';

export function createEngine({get, onSlot, onCount, onReps, onShow, onMsg, onBpm}) {
  const A = createAudio({masterGain: 2.4});
  const wake = createWakeLock();
  let playing = false, step = 0, nextTime = 0, timer = null, raf = 0, countSlots = 0, reps = 0, loops = 0;
  let queue = [], schedEx = null, schedSL = [], schedIdx = 0, bpm = 70;

  function pad(t, hand, amp) {
    const ctx = A.ctx, dest = A.out(hand === 'R' ? 0.35 : -0.35);
    const src = ctx.createBufferSource();
    src.buffer = A.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.09);
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.04);
    const og = ctx.createGain();
    og.gain.setValueAtTime(amp * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(og).connect(dest);
    o.start(t);
    o.stop(t + 0.06);
  }

  function scheduleSlot(n, t) {
    const {S, sheet} = get(), sub = schedEx.sub;
    if (n < 0) {
      const k = n + countSlots;
      if (k % sub === 0) { A.click(t); queue.push({t, count: k / sub + 1}); }
      return;
    }
    let i = n % schedSL.length;
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
        schedSL = swapped(schedEx.notes, S.leftLead);
        step = 0; n = 0; i = 0;
        queue.push({t, show: schedIdx});
      }
      queue.push({t, reps});
    }
    const note = schedSL[i];
    const amp = note.acc ? 1 : 0.42;
    if (schedEx.poly) {
      const hit = h => { if (S.polyMute !== h) pad(t, h, h === 'R' ? 0.7 : 0.55); };
      if (note.h === 'R' || note.h === 'B') hit('R');
      if (note.h === 'L' || note.h === 'B') hit('L');
    } else {
      if (note.g) {
        const other = note.h === 'R' ? 'L' : 'R';
        for (let k = note.g; k >= 1; k--) pad(t - 0.028 * k, other, 0.16);
      }
      pad(t, note.h, amp);
    }
    if (S.click && i % sub === 0) A.click(t);
    else if (S.click && S.clickSub !== 'off' && !schedEx.poly) A.click(t, S.clickSub === 'same' ? 1 : SUB_CLICK);
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
    const now = A.ctx.currentTime;
    while (queue.length && queue[0].t <= now) {
      const e = queue.shift();
      if (e.show !== undefined) onShow(e.show);
      else if (e.count !== undefined) onCount(e.count);
      else if (e.msg) { onBpm(e.bpm); onMsg(e.msg); }
      else if (e.reps !== undefined) onReps(e.reps);
      else onSlot(e.i);
    }
    raf = requestAnimationFrame(draw);
  }

  function play() {
    const {S, sheet, idx} = get();
    A.ensure();
    playing = true;
    schedIdx = idx;
    schedEx = sheet[idx];
    schedSL = swapped(schedEx.notes, S.leftLead);
    bpm = S.bpm;
    countSlots = S.countIn ? 4 * schedEx.sub : 0;
    step = -countSlots;
    reps = 0; loops = 0; queue = [];
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

  return {play, stop, isPlaying: () => playing, setBpm: v => { bpm = v; }, resetLoops: () => { loops = 0; }};
}
