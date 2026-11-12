// Shared Web Audio setup for the drum apps: the loud-but-clean output chain, synth building blocks and the metronome click.
// Each app passes its own master gain (how hard its drums are pushed into the limiter) and builds its kit from these parts.

// Loud but clean for phone speakers: a limiter that only touches the loudest peaks, then a soft clipper that rounds
// off any attack the limiter lets through (output stays below 0 dBFS). Returns the node to connect into.
export function createLimiter(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = 0; comp.knee.value = 0; comp.ratio.value = 20; comp.attack.value = 0; comp.release.value = 0.05;
  // The shaper's input range is ±1, so feed it half the signal and let its curve cover ±2:
  // straight line up to 0.7 (normal hits are untouched), then bends smoothly toward 0.98.
  const half = ctx.createGain();
  half.gain.value = 0.5;
  const clip = ctx.createWaveShaper(), curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = ((i / (curve.length - 1)) * 2 - 1) * 2, a = Math.abs(x);
    curve[i] = Math.sign(x) * (a <= 0.7 ? a : 0.7 + 0.28 * Math.tanh((a - 0.7) / 0.28));
  }
  clip.curve = curve;
  comp.connect(half).connect(clip).connect(ctx.destination);
  return comp;
}

export function createAudio({masterGain = 2.8, clickGain = 0.9} = {}) {
  const A = {ctx: null, master: null, clickBus: null, noiseBuf: null};

  A.ensure = () => {
    if (!A.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const limiter = createLimiter(ctx);
      A.master = ctx.createGain();
      A.master.gain.value = masterGain;
      A.master.connect(limiter);
      A.clickBus = ctx.createGain();
      A.clickBus.gain.value = clickGain;
      A.clickBus.connect(limiter);
      A.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = A.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.ctx = ctx;
    }
    if (A.ctx.state === 'suspended') A.ctx.resume();
    return A.ctx;
  };

  A.out = pan => {
    if (!A.ctx.createStereoPanner) return A.master;
    const p = A.ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(A.master);
    return p;
  };
  A.env = (node, t, amp, dur) => {
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, amp), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(g);
    return g;
  };
  A.noise = (t, dur, type, freq, q) => {
    const src = A.ctx.createBufferSource();
    src.buffer = A.noiseBuf;
    const f = A.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    src.connect(f);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
    return f;
  };
  A.tone = (t, dur, type, f0, f1) => {
    const o = A.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    o.start(t);
    o.stop(t + dur + 0.02);
    return o;
  };

  // Metronome: the same wood-block click on every beat — no louder or higher first beat.
  // Pitch sweep from Pro Metronome's 木魚 kit, but a filtered square wave held at full level for 25 ms,
  // so it stays clearly louder than the drums instead of hiding under them.
  A.click = (t, level = 1) => {
    const ctx = A.ctx, o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1250, t);
    o.frequency.exponentialRampToValueAtTime(875, t + 0.09);
    lp.type = 'lowpass';
    lp.frequency.value = 3500;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.002);
    g.gain.setValueAtTime(level, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(lp).connect(g).connect(A.clickBus);
    o.start(t);
    o.stop(t + 0.11);
    return o;
  };
  return A;
}

// subdivision clicks: same sound, about 10 dB under the beat
export const SUB_CLICK = 0.3;

// Keeps the screen on while playing; re-acquired when the page comes back to the front.
export function createWakeLock() {
  let lock = null, want = false;
  const get = async () => {
    if (lock) return;
    try {
      const l = await navigator.wakeLock?.request('screen');
      if (!l) return;
      if (!want) { l.release(); return; }   // stopped while the request was on its way
      lock = l;
      l.addEventListener('release', () => { if (lock === l) lock = null; });
    } catch { lock = null; }
  };
  document.addEventListener('visibilitychange', () => { if (want && document.visibilityState === 'visible' && !lock) get(); });
  return {
    on() { want = true; get(); },
    off() { want = false; try { lock?.release(); } catch { /* ignore */ } lock = null; },
  };
}
