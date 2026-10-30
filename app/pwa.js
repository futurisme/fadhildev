/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * PWA Service Worker Registration & In-App Install Prompt Controller
 */

export function initPWA() {
  // 1. Service Worker Registration
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration skipped:', err);
        });
    });
  }

  // 2. In-App Install Prompt Handling
  let deferredPrompt = null;
  const installBtn = document.getElementById('btn-pwa-install');
  const iosModal = document.getElementById('pwa-ios-modal');
  const iosCloseBtn = document.getElementById('pwa-ios-close');
  const offlineToast = document.getElementById('pwa-offline-toast');

  // Check if already running in standalone display mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    if (installBtn) installBtn.style.display = 'none';
    return;
  }

  // Detect iOS Safari
  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  if (isIOS) {
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.addEventListener('click', () => {
        if (iosModal) iosModal.classList.remove('hidden');
      });
    }
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
    console.log('[PWA] App successfully installed!');
    if (installBtn) installBtn.classList.add('hidden');
    deferredPrompt = null;
  });

  if (iosCloseBtn && iosModal) {
    iosCloseBtn.addEventListener('click', () => {
      iosModal.classList.add('hidden');
    });
  }

  // 3. Online/Offline Connectivity Status Toast
  function updateOnlineStatus() {
    if (!offlineToast) return;
    if (navigator.onLine) {
      offlineToast.classList.add('hidden');
    } else {
      offlineToast.classList.remove('hidden');
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}
