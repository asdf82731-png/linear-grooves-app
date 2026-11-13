// Web Audio metronome: look-ahead scheduler, synthesized clicks and voice counting.
// It reads the latest settings through getSettings() on every tick, and reports what it plays
// through the callbacks so the UI can light the beat that is sounding right now.
import {KITS, clamp, patOf} from './music.js';
import {VOX} from './vox.js';
import {createLimiter, createWakeLock} from '../../shared/src/audio.js';
import {createScheduler} from '../../shared/src/scheduler.js';

const LVLGAIN = {3: 0.8, s: 0.8, p: 0.6};
const BOOST = 1, HOLD = 0.025;

/* iPhone: play through the silent switch like a music app */
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}

export function createEngine({getSettings, onBeat, onPoly, onBpm, onStop}) {
  let ctx = null, master = null, running = false;
  let beatIdx = 0, bars = 0;
  const wake = createWakeLock();   // keeps the screen on while running, asks again when the app comes back to the front
  let voxBuf = null, voxLoading = false;
  const S = () => getSettings();
  const volGain = () => BOOST * Math.pow(S().vol / 100, 1.6);

  function ensureCtx() {
    if (ctx && ctx.state === 'closed') { ctx = null; voxBuf = null; }
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'});
      master = ctx.createGain();
      master.connect(createLimiter(ctx));   // the same loud-but-clean output chain as the other drum apps
    }
    master.gain.value = volGain();
    if (ctx.state !== 'running') { try { ctx.resume(); } catch {} }
    // unlock: a silent 1-sample buffer started inside the tap
    try {
      const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch {}
    loadVox();
  }

  /* voice counting: 1 e & a / 1 trip let / 1 la li & la li */
  function loadVox() {
    if (voxBuf || voxLoading) return;
    voxLoading = true;
    const out = {};
    Promise.all(Object.entries(VOX).map(([k, b64]) => new Promise(res => {
      const bin = atob(b64), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      try { ctx.decodeAudioData(u.buffer, b => { out[k] = b; res(); }, () => res()); } catch { res(); }
    }))).then(() => { voxBuf = out; voxLoading = false; });
  }
  function syl(pk, i, off, bi) {
    if (i === 0) return 'n' + (bi + 1);
    if (pk === 'x') return ['', 'la', 'li', 'and', 'la', 'li'][i];
    const near = v => Math.abs(off - v) < 0.01;
    if (near(0.25)) return 'e'; if (near(0.5)) return 'and'; if (near(0.75)) return 'a';
    if (near(1 / 3)) return 'trip'; if (near(2 / 3)) return 'let';
    return '';
  }
  function say(name, t, gain, until) {
    const b = voxBuf && voxBuf[name];
    if (!b) return false;
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = b; g.gain.value = gain * 1.4;
    src.connect(g).connect(master); src.start(t);
    if (until && until > t) {
      g.gain.setValueAtTime(gain * 1.4, Math.max(t, until - 0.015));
      g.gain.linearRampToValueAtTime(0, until); src.stop(until + 0.01);
    }
    return true;
  }
  function blip(level, t) {
    const k = KITS[S().kit]?.voice || !KITS[S().kit] ? KITS.wood : KITS[S().kit];
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = level === 'p' ? 'sine' : k.w;
    o.frequency.setValueAtTime(k.f[level], t);
    if (k === KITS.wood) o.frequency.exponentialRampToValueAtTime(k.f[level] * 0.7, t + HOLD + k.d);
    const peak = (level === 'p' ? 0.9 : k.v) * LVLGAIN[level], dec = level === 'p' ? 0.06 : k.d;
    /* hold full level for HOLD before fading: far more energy per click, so it sounds louder at the same peak */
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.setValueAtTime(peak, t + HOLD);
    g.gain.exponentialRampToValueAtTime(0.0001, t + HOLD + dec);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 3500;
    o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + HOLD + dec + 0.02);
    if (level === 3) {
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(k.f[3] * 2, t);
      g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(peak * 0.6, t + 0.002);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      o2.connect(g2).connect(master); o2.start(t); o2.stop(t + 0.07);
    }
  }
  const gapMuted = b => S().gap && (b % (S().gPlay + S().gMute)) >= S().gPlay;

  let bpm = 120; // the engine's own tempo, so the trainer can speed up ahead of the UI
  // one beat: its subdivisions, the polyrhythm clicks of the bar, and the speed trainer
  function beat(nextTime, push) {
    const s = S(), D = 60 / bpm, bi = beatIdx, lvl = s.accents[bi] ?? 2, mute = gapMuted(bars);
    const pat = patOf(s.pat), voice = s.kit === 'voice' && voxBuf;
    let off = 0;
    pat.s.forEach(([f, p], i) => {
      const t = nextTime + off * D;
      if (p && !mute && lvl > 0) {
        if (voice) {
          let j = i + 1;
          while (j < pat.s.length && !pat.s[j][1]) j++;
          const until = nextTime + (j < pat.s.length ? pat.s.slice(0, j).reduce((a, x) => a + x[0], 0) : 1) * D;
          const acc = i === 0 && lvl === 3;
          if (!say(syl(pat.k, i, off, bi), t, 0.8, until)) blip(acc ? 3 : 's', t);
          else if (acc) blip(3, t);
        } else blip(i === 0 && lvl === 3 ? 3 : 's', t);
      }
      push({t, bi, sub: i, beat: i === 0, dur: D, mute});
      off += f;
    });
    if (bi === 0 && s.poly) {
      const barD = D * s.beats;
      for (let j = 0; j < s.polyN; j++) {
        const t = nextTime + barD * j / s.polyN;
        if (!mute) blip('p', t);
        push({t, poly: j});
      }
    }
    beatIdx++;
    if (beatIdx >= s.beats) {
      beatIdx = 0;
      bars++;
      if (s.trainer && bars % Math.max(1, s.tBars) === 0 && bpm < s.tTarget) {
        bpm = Math.min(s.tTarget, bpm + Math.max(1, s.tStep));
        push({t: nextTime + D, setBpm: bpm});
      }
    }
    return D;
  }

  function onEvent(q, now) {
    if (q.setBpm) onBpm(q.setBpm);
    else if (q.poly !== undefined) onPoly(q.poly);
    else onBeat(q, now);
  }
  const sch = createScheduler({ctx: () => ctx, step: beat, onEvent});

  function start() {
    ensureCtx();
    running = true; beatIdx = 0; bars = 0;
    const s = S();
    bpm = s.trainer ? s.tStart : s.bpm;
    if (s.trainer) onBpm(bpm);
    const kick = () => sch.start(0.06);
    if (ctx.state === 'running') kick();
    else {
      const p = ctx.resume();
      (p && p.then ? p : Promise.resolve()).then(() => { if (running) kick(); });
      setTimeout(() => {
        if (running && ctx.state !== 'running') { ctx.close().catch(() => {}); ctx = null; ensureCtx(); kick(); }
      }, 600);
    }
    wake.on();
  }
  function stop() {
    running = false;
    sch.stop();
    wake.off();
    onStop();
  }

  function onVisible() {
    if (document.visibilityState !== 'visible') return;
    if (ctx && ctx.state !== 'running') {
      try { ctx.resume(); } catch {}
      if (running) setTimeout(() => { if (ctx.state === 'running') sch.resync(0.06); }, 50);
    }
  }
  document.addEventListener('visibilitychange', onVisible);
  /* unlock audio on the very first touch anywhere */
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, function once() {
    ensureCtx();
    document.removeEventListener(ev, once, true);
  }, true));

  return {
    start,
    stop,
    toggle: () => (running ? stop() : start()),
    isRunning: () => running,
    setBpm: v => { bpm = clamp(Math.round(v), 20, 300); },
    setVolume: () => { if (master) master.gain.value = volGain(); },
    preview() {
      ensureCtx();
      if (S().kit === 'voice') {
        const go = () => say('n1', ctx.currentTime + 0.02, 1);
        voxBuf ? go() : setTimeout(go, 300);
      } else blip(3, ctx.currentTime + 0.02);
    },
  };
}
