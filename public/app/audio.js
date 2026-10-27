/**
 * Cyber audio synthesizer using Web Audio API
 * Generates synthetic high-tech click and hover audio effects
 */
let audioCtx = null;
let isAudioUnlocked = false;

export const unlockAudio = () => {
  isAudioUnlocked = true;
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
};

['click', 'pointerdown', 'keydown', 'touchstart'].forEach((evt) => {
  window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
});

export const getAudioContext = () => {
  const hasGesture = isAudioUnlocked || (typeof navigator !== 'undefined' && navigator.userActivation && navigator.userActivation.hasBeenActive);
  if (!hasGesture) return null;
  if (!audioCtx) {
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (AudioClass) audioCtx = new AudioClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playCyberSound = (type = 'click') => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else {
      const bufferSize = Math.floor(ctx.sampleRate * 0.035);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.035);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  } catch (_) {}
};

export const initAudioTriggers = () => {
  document.addEventListener('pointerenter', (e) => {
    const target = e.target;
    if (target && target.closest && target.closest('a, button, .cyber-action-btn, .skill-pill-item, .core-lang-item, .social-slot-link, .tool-slot-item, .portfolio-card-item')) {
      playCyberSound('hover');
    }
  }, { passive: true, capture: true });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.closest && target.closest('a, button, .cyber-action-btn, .skill-pill-item, .core-lang-item, .social-slot-link, .tool-slot-item, .portfolio-card-item')) {
      playCyberSound('click');
    }
  }, { passive: true });
};
