'use strict';

/* Hit detector for the microphone.
 * The same class runs inside the AudioWorklet and in the offline tests, so what is tested is what ships.
 * A hit starts where the envelope (instant attack, 4 ms release) jumps above both a fixed level (set by
 * the sensitivity slider) and 3× the loudest it was 2–15 ms earlier. The ring of an earlier hit only gets
 * quieter, so it never counts, while a soft hit right after a loud one still does. After a hit nothing new
 * counts for 50 ms, so a pad's own rattle is not a second hit.
 *
 * Second path, spectral flux (the method aubio, Essentia and Meyda use for onsets): every 128 samples a 256-point
 * FFT of the signal is compared with the one before; the flux is how much the (log) spectrum grew. A hit brings new
 * frequencies even when it is not louder overall, e.g. a hi-hat over a ringing floor tom or bass, which the
 * envelope path misses because the total level hardly jumps. A frame counts when its flux is well above the recent
 * median and the new part of the signal is above the sensitivity level; the hit time is then placed on the sample
 * where that new part rises, so the timing stays sample accurate. Both paths share the 50 ms hold, so one hit is
 * never counted twice. Hit positions can be a little before the current block (up to one frame, 5 ms).
 */
const N = 256, HOP = 128;
function makeFFT(n) {
  const rev = new Uint16Array(n), bits = Math.log2(n);
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b); rev[i] = r; }
  const cos = new Float32Array(n / 2), sin = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = -Math.sin(2 * Math.PI * i / n); }
  const re = new Float32Array(n), im = new Float32Array(n);
  // in: real frame; out: re/im (in place, iterative radix-2)
  return frame => {
    for (let i = 0; i < n; i++) { re[rev[i]] = frame[i]; im[rev[i]] = 0; }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1, step = n / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < half; j++) {
          const k = j * step, a = i + j, b = a + half;
          const tr = re[b] * cos[k] - im[b] * sin[k], ti = re[b] * sin[k] + im[b] * cos[k];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
    }
    return [re, im];
  };
}
class OnsetDetector {
  constructor(sampleRate, opts = {}) {
    this.sr = sampleRate;
    this.ratio = opts.ratio || 3;
    this.hold = Math.round(((opts.holdMs || 50) / 1000) * sampleRate);
    this.setSensitivity(opts.sensitivity == null ? 6 : opts.sensitivity);
    // One-pole high-pass at 80 Hz: removes rumble and handling noise, keeps the click of a stick on a pad.
    const rc = 1 / (2 * Math.PI * 80), dt = 1 / sampleRate;
    this.hp = rc / (rc + dt);
    this.px = 0;
    this.py = 0;
    this.fast = 0;
    this.fastDecay = Math.exp(-1 / (0.004 * sampleRate));
    // Loudest envelope value per millisecond, for the last 16 ms.
    this.msLen = Math.max(1, Math.round(sampleRate / 1000));
    this.ring = new Float32Array(16);
    this.ri = 0;
    this.msMax = 0;
    this.msCount = 0;
    this.ref = 0;                 // loudest value 2–15 ms ago
    this.since = this.hold + 1;   // samples since the last hit
    this.peak = 0;                // loudest sample since the last level report
    // spectral flux path (opts.flux === false turns it off, for comparison in the tests)
    this.useFlux = opts.flux !== false;
    this.fluxK = opts.fluxK || 3;
    this.fft = makeFFT(N);
    this.win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
    this.ringBuf = new Float32Array(N);    // last N high-passed samples (circular, next write at wi)
    this.wi = 0;
    this.hist = new Float32Array(N);       // the same samples in order, oldest first, filled once per frame
    this.frame = new Float32Array(N);
    this.prevMag = new Float32Array(N / 2 + 1);
    this.curMag = new Float32Array(N / 2 + 1);
    this.fluxHist = [];                     // flux of the last frames, for the median
    this.hopCount = 0;
    this.n = 0;                             // samples seen so far
    this.lastHit = -Infinity;               // sample number of the last hit, either path
  }

  // 1 = only loud hits (−10 dBFS) … 10 = very quiet hits (−55 dBFS), 5 dB a step.
  setSensitivity(s) {
    const step = Math.max(1, Math.min(10, Number(s) || 6));
    this.threshold = Math.pow(10, (-10 - (step - 1) * 5) / 20);
  }

  // Returns the sample indexes, relative to the start of this block, where a hit starts (flux hits can be < 0).
  process(buf) {
    const out = [], base = this.n;
    for (let i = 0; i < buf.length; i++) {
      const x = buf[i];
      const y = this.hp * (this.py + x - this.px);
      this.px = x;
      this.py = y;
      const a = y < 0 ? -y : y;
      this.fast = a > this.fast ? a : this.fast * this.fastDecay;
      if (a > this.peak) this.peak = a;
      this.since++;
      if (this.since > this.hold && this.fast > this.threshold && this.fast > this.ref * this.ratio) {
        out.push(i);
        this.since = 0;
        this.lastHit = base + i;
      }
      if (this.fast > this.msMax) this.msMax = this.fast;
      if (++this.msCount >= this.msLen) {
        this.ring[this.ri] = this.msMax;
        this.ri = (this.ri + 1) % this.ring.length;
        this.msMax = 0;
        this.msCount = 0;
        // Skip the newest millisecond: a hit's own rise may have started there.
        let m = 0;
        for (let k = 2; k <= 15; k++) m = Math.max(m, this.ring[(this.ri - k + this.ring.length) % this.ring.length]);
        this.ref = m;
      }
      if (this.useFlux) {
        this.ringBuf[this.wi] = y;
        this.wi = (this.wi + 1) & (N - 1);
        if (++this.hopCount >= HOP) {
          this.hopCount = 0;
          const at = this.fluxFrame(base + i + 1);
          if (at !== null) { out.push(at - base); out.sort((p, q) => p - q); }
        }
      }
    }
    this.n += buf.length;
    return out;
  }

  // One FFT frame ending at sample `end` (exclusive). Returns the sample number of a new hit, or null.
  fluxFrame(end) {
    const h = this.hist, f = this.frame, w = this.win, r = this.ringBuf;
    for (let i = 0; i < N; i++) h[i] = r[(this.wi + i) & (N - 1)];
    for (let i = 0; i < N; i++) f[i] = h[i] * w[i];
    const [re, im] = this.fft(f);
    // SuperFlux (Böck & Widmer 2013): compare each bin with the loudest of its neighbours in the previous frame,
    // so the random wobble of a noisy ring (cymbal, snare tail) does not look like new sound
    const cur = this.curMag, prev = this.prevMag;
    for (let k = 1; k <= N / 2; k++) cur[k] = Math.log1p(1000 * Math.sqrt(re[k] * re[k] + im[k] * im[k]));
    let flux = 0;
    for (let k = 1; k <= N / 2; k++) {
      const p = Math.max(prev[k - 1], prev[k], k < N / 2 ? prev[k + 1] : 0);
      const d = cur[k] - p;
      if (d > 0) flux += d;
    }
    prev.set(cur);
    const hist = this.fluxHist, sorted = hist.slice().sort((p, q) => p - q);
    const median = sorted.length ? sorted[sorted.length >> 1] : 0;
    hist.push(flux);
    if (hist.length > 24) hist.shift();
    if (hist.length < 8 || flux <= this.fluxK * median + 4) return null;
    // where in the newest hop does the new sound start: the first sample whose size passes half the hop's peak,
    // measured on the change from the previous hop's level so a loud ringing background does not hide it
    let prevPeak = 0, peak = 0;
    for (let i = N - 2 * HOP; i < N - HOP; i++) prevPeak = Math.max(prevPeak, Math.abs(h[i]));
    for (let i = N - HOP; i < N; i++) peak = Math.max(peak, Math.abs(h[i]));
    if (peak - prevPeak < this.threshold * 0.5 && peak < this.threshold) return null;
    let j = N - HOP;
    const level = prevPeak + (peak - prevPeak) * 0.5;
    while (j < N - 1 && Math.abs(h[j]) < level) j++;
    const at = end - N + j;
    if (at - this.lastHit <= this.hold) return null;
    this.lastHit = at;
    this.since = end - at;
    return at;
  }
}

if (typeof registerProcessor === 'function') {
  class OnsetProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.det = new OnsetDetector(sampleRate);
      this.every = Math.round(sampleRate * 0.05);   // level report every 50 ms
      this.count = 0;
      this.port.onmessage = (e) => {
        if (e.data && e.data.sensitivity != null) this.det.setSensitivity(e.data.sensitivity);
      };
    }
    process(inputs) {
      const ch = inputs[0] && inputs[0][0];
      if (ch) {
        // currentFrame is on the AudioContext clock, the same clock the metronome is scheduled on.
        for (const i of this.det.process(ch)) this.port.postMessage({ hit: (currentFrame + i) / sampleRate });
        this.count += ch.length;
        if (this.count >= this.every) {
          this.port.postMessage({ level: this.det.peak, threshold: this.det.threshold });
          this.det.peak = 0;
          this.count = 0;
        }
      }
      return true;
    }
  }
  registerProcessor('onset', OnsetProcessor);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { OnsetDetector };
