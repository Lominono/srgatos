/**
 * Audio FX Synthesizer (Single AudioContext, zero dependencies, pure Web Audio)
 * Provides organic, tactile micro-feedback for mobile and desktop.
 */

let ctx = null;
let isMuted = false;

function getContext() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      ctx = new AudioContext();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export const sfx = {
  toggleMute() {
    isMuted = !isMuted;
    return isMuted;
  },

  isMuted() {
    return isMuted;
  },

  // Soft tactile haptic click
  click() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.045);
    } catch (_) {}
  },

  // Cute bite / chomp sound when eating
  feed() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const now = c.currentTime;
      // First quick chomp
      const osc1 = c.createOscillator();
      const gain1 = c.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(420, now);
      osc1.frequency.exponentialRampToValueAtTime(160, now + 0.09);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(c.destination);
      osc1.start(now);
      osc1.stop(now + 0.095);

      // Second bite (slightly higher)
      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(540, now + 0.11);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.22);
      gain2.gain.setValueAtTime(0.16, now + 0.11);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(c.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.23);
    } catch (_) {}
  },

  // Soapy scrub sound
  soap() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      const freq = 320 + Math.random() * 180;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, c.currentTime + 0.07);
      gain.gain.setValueAtTime(0.06, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.075);
    } catch (_) {}
  },

  // Bubble pop
  pop() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      const start = 900 + Math.random() * 300;
      osc.frequency.setValueAtTime(start, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(start * 1.8, c.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.045);
    } catch (_) {}
  },

  // Water rinse (soft filtered shower)
  shower() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const bufferSize = c.sampleRate * 0.3;
      const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = c.createBufferSource();
      noise.buffer = buffer;

      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, c.currentTime);
      filter.Q.setValueAtTime(3.0, c.currentTime);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, c.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);

      noise.start();
    } catch (_) {}
  },

  // Lamp switch toggle
  lamp() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.05);
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.055);
    } catch (_) {}
  },

  // Gentle purr rumble
  purr() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, c.currentTime);
      osc.frequency.setValueAtTime(62, c.currentTime + 0.1);
      osc.frequency.setValueAtTime(54, c.currentTime + 0.2);

      gain.gain.setValueAtTime(0.14, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.33);
    } catch (_) {}
  },

  // Gold coin collected
  coin() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const now = c.currentTime;
      const osc1 = c.createOscillator();
      const gain1 = c.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(c.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      const osc2 = c.createOscillator();
      const gain2 = c.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.07); // E6
      gain2.gain.setValueAtTime(0.14, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc2.connect(gain2);
      gain2.connect(c.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.27);
    } catch (_) {}
  },

  // Level up fanfare
  levelUp() {
    if (isMuted) return;
    const c = getContext();
    if (!c) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        const start = c.currentTime + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch (_) {}
  }
};
