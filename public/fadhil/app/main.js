import { initAvifHyperLoadEngine } from './boot.js';
import { initAudioTriggers } from './audio.js';
import { initThemeSwitcher } from './theme.js';
import { initHeroYouTube } from './youtube.js';
import { initLanguageSwitcher } from './lang.js';
import { initInteractiveUI } from './interactive.js';
import { initPWA } from './pwa.js';

(() => {
  // 0. Initialize hyper-load AVIF browser detection
  initAvifHyperLoadEngine();

  // 1. Initialize cyber audio triggers
  initAudioTriggers();

  // 2. Initialize theme management
  const { toggleTheme } = initThemeSwitcher();

  // 3. Initialize hero YouTube facade
  initHeroYouTube();

  // 4. Initialize multilingual switcher
  initLanguageSwitcher();

  // 5. Initialize interactive UI effects and key shortcuts
  initInteractiveUI(toggleTheme);

  // 6. Initialize Progressive Web App (PWA) lifecycle & install prompt
  initPWA();
})();
