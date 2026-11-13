// Look-ahead scheduler shared by every app (the "two clocks" pattern, like Tone.js's Transport but tiny).
// A Worker timer (timer.js) wakes up every 25 ms and asks the app to schedule each slot that starts within
// the next `ahead` seconds on the AudioContext clock. The app pushes screen events with their audio time;
// requestAnimationFrame hands each one to onEvent when its sound is actually heard.
//
//   const sch = createScheduler({ctx: () => A.ctx, step, onEvent});
//   step(t, push) → schedules the sounds of one slot starting at t, returns the slot length in seconds.
//   push({t, ...}) → queue a screen event for time t (events are kept in time order, ties in push order).
//   onFrame() → optional, runs every frame before the events; it may call stop().
//   onTick() → optional, runs after every scheduling pass (housekeeping).
import {setInterval, clearInterval} from './timer.js';

export function createScheduler({ctx, step, onEvent, onFrame, onTick, ahead = 0.12, every = 25}) {
  let running = false, next = 0, timer = null, raf = 0, queue = [];
  const push = e => { queue.push(e); };

  function tick() {
    const c = ctx();
    if (!running || !c) return;
    const before = queue.length;
    let guard = 0;
    while (next < c.currentTime + ahead && guard++ < 512) next += Math.max(0.001, step(next, push));
    // stable sort: only needed when a slot pushed events out of order (polyrhythm clicks inside a beat)
    if (queue.length !== before) {
      for (let i = 1; i < queue.length; i++) if (queue[i].t < queue[i - 1].t) { queue.sort((a, b) => a.t - b.t); break; }
    }
    onTick?.();
  }

  function draw() {
    if (!running) return;
    onFrame?.();
    if (!running) return;
    const now = ctx().currentTime;
    while (queue.length && queue[0].t <= now) onEvent(queue.shift(), now);
    raf = requestAnimationFrame(draw);
  }

  return {
    push,
    // lead: how long after now the first slot starts
    start(lead = 0.08) {
      running = true;
      queue = [];
      next = ctx().currentTime + lead;
      tick();
      clearInterval(timer);
      timer = setInterval(tick, every);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
      return next - lead;
    },
    stop() {
      running = false;
      clearInterval(timer);
      cancelAnimationFrame(raf);
      queue = [];
    },
    // start again from now, e.g. after the audio clock was suspended in the background
    resync(lead = 0.06) { next = ctx().currentTime + lead; queue = []; },
    isRunning: () => running,
    nextTime: () => next,
  };
}
