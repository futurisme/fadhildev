/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PWA Service Worker Registration & In-App Install Prompt Controller
 */

export function initPWA() {
  // 1. Service Worker Registration
  if (
    'serviceWorker' in navigator &&
    (window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  // 2. Online/Offline Connectivity Status Toast (active in both browser and standalone modes)
  const offlineToast = document.getElementById('pwa-offline-toast');
  function updateOnlineStatus() {
    if (!offlineToast) return;
    offlineToast.classList.toggle('hidden', navigator.onLine);
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // 3. In-App Install Prompt Handling
  let deferredPrompt = null;
  const installBtn = document.getElementById('btn-pwa-install');
  const iosModal = document.getElementById('pwa-ios-modal');
  const iosCloseBtn = document.getElementById('pwa-ios-close');

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (isStandalone) {
    if (installBtn) installBtn.classList.add('hidden');
    return;
  }

  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  if (isIOS && installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.addEventListener('click', () => {
      if (iosModal) {
        iosModal.classList.remove('hidden');
        requestAnimationFrame(() => iosCloseBtn?.focus());
      }
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  if (installBtn && !isIOS) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.classList.add('hidden');
      }
      deferredPrompt = null;
    });
  }

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.classList.add('hidden');
    deferredPrompt = null;
  });

  if (iosCloseBtn && iosModal) {
    const closeIosModal = () => {
      iosModal.classList.add('hidden');
      installBtn?.focus();
    };
    iosCloseBtn.addEventListener('click', closeIosModal);
    iosModal.addEventListener('click', (e) => {
      if (e.target === iosModal) closeIosModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !iosModal.classList.contains('hidden')) {
        closeIosModal();
      }
    });
  }
}
