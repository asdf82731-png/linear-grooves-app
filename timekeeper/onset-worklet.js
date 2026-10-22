'use strict';

/* Hit detector for the microphone.
 * The same class runs inside the AudioWorklet and in the offline tests, so what is tested is what ships.
 * A hit starts where the envelope (instant attack, 4 ms release) jumps above both a fixed level (set by
 * the sensitivity slider) and 3× the loudest it was 2–15 ms earlier. The ring of an earlier hit only gets
 * quieter, so it never counts, while a soft hit right after a loud one still does. After a hit nothing new
 * counts for 50 ms, so a pad's own rattle is not a second hit.
 */
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
  }

  // 1 = only loud hits (−10 dBFS) … 10 = very quiet hits (−55 dBFS), 5 dB a step.
  setSensitivity(s) {
    const step = Math.max(1, Math.min(10, Number(s) || 6));
    this.threshold = Math.pow(10, (-10 - (step - 1) * 5) / 20);
  }

  // Returns the sample indexes in this block where a hit starts.
  process(buf) {
    const out = [];
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
    }
    return out;
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
