import { playCyberSound } from './audio.js';

let toastTimeout = null;

export const showCyberToast = (message) => {
  let toast = document.getElementById('cyber-hud-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cyber-hud-toast';
    toast.className = 'cyber-hud-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'cyber-hud-toast-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = '⚡';

    const msgSpan = document.createElement('span');
    msgSpan.className = 'cyber-hud-toast-msg';

    toast.append(iconSpan, msgSpan);
    document.body.appendChild(toast);
  }

  const msgEl = toast.querySelector('.cyber-hud-toast-msg');
  if (msgEl) {
    msgEl.textContent = message;
  }

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
};

export const initInteractiveUI = (toggleTheme) => {
  const activeKeys = new Set();

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    activeKeys.add(event.key.toLowerCase());
    if (activeKeys.has('t') && activeKeys.has('s')) {
      event.preventDefault();
      toggleTheme();
      activeKeys.clear();
      return;
    }
    if (activeKeys.has('t') && activeKeys.has('d')) {
      event.preventDefault();
      document.documentElement.classList.toggle('text-rainbow');
      activeKeys.clear();
    }
  });

  window.addEventListener('keyup', (event) => {
    activeKeys.delete(event.key.toLowerCase());
  });

  window.addEventListener('blur', () => {
    activeKeys.clear();
  });

  const originalTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? '戻ってきて！ (PORTFOLIO STANDBY)' : originalTitle;
  });

  const clickTimers = new WeakMap();

  const bindInteractiveGroup = (selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((item) => {
      const handleActivate = () => {
        elements.forEach((other) => {
          if (other !== item) {
            other.classList.remove('is-clicked');
            const prevOther = clickTimers.get(other);
            if (prevOther) {
              clearTimeout(prevOther);
              clickTimers.delete(other);
            }
          }
        });
        const prevTimer = clickTimers.get(item);
        if (prevTimer) clearTimeout(prevTimer);
        item.classList.add('is-clicked');
        playCyberSound('click');
        const nextTimer = setTimeout(() => {
          item.classList.remove('is-clicked');
          clickTimers.delete(item);
        }, 700);
        clickTimers.set(item, nextTimer);
      };

      item.addEventListener('click', handleActivate);
    });
  };

  bindInteractiveGroup('.core-lang-item');
  bindInteractiveGroup('.social-slot-link');
  bindInteractiveGroup('.tool-slot-item');
  bindInteractiveGroup('.skill-pill-item');

  const inDevElements = document.querySelectorAll('.portfolio-launch-btn.is-in-dev, .btn-cloud-db.is-in-dev');
  inDevElements.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      playCyberSound('click');
      const name = el.getAttribute('data-project-name') || el.getAttribute('title') || 'PROJECT';
      showCyberToast(`PROJECT [${name}] IS CURRENTLY UNDER ACTIVE DEVELOPMENT`);
    });
  });
};
