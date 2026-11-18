/**
 * Hero YouTube facade controller.
 * Uses https://www.youtube-nocookie.com for privacy and Core Web Vitals optimization.
 * Defers iframe and YouTube API script loading until user interaction.
 */
export const initHeroYouTube = () => {
  const heroContainer = document.querySelector('.hero-media-wrap');
  const heroTrigger = document.getElementById('hero-play-trigger') || heroContainer;
  const soundToggleBtn = document.getElementById('hero-sound-btn');
  const pictureLayer = document.querySelector('.hero-picture-layer');

  if (!heroContainer || !heroTrigger) return;

  const videoId = heroContainer.dataset.youtubeVideoId || 'r_UrlnA-6z4';
  const startTime = parseInt(heroContainer.dataset.youtubeStart || '6', 10);
  let iframe = document.getElementById('fadhil-hero-yt');
  let iframeLoaded = false;
  let ytPlayer = null;
  let isAudioActive = false;
  let isPlaying = false;
  let bannerCycleTimer = null;
  let isCycling = false;

  const startBannerCycle = () => {
    if (isCycling) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    isCycling = true;
    const cycle = () => {
      if (!isCycling || !pictureLayer) return;
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        stopBannerCycle();
        return;
      }
      pictureLayer.classList.remove('is-hidden');
      pictureLayer.classList.add('is-visible');
      bannerCycleTimer = setTimeout(() => {
        if (!isCycling || !pictureLayer) return;
        pictureLayer.classList.remove('is-visible');
        pictureLayer.classList.add('is-hidden');
        bannerCycleTimer = setTimeout(() => {
          if (!isCycling) return;
          cycle();
        }, 3000);
      }, 2000);
    };
    cycle();
  };

  const stopBannerCycle = () => {
    isCycling = false;
    if (bannerCycleTimer) {
      clearTimeout(bannerCycleTimer);
      bannerCycleTimer = null;
    }
    if (pictureLayer) {
      pictureLayer.classList.remove('is-hidden');
      pictureLayer.classList.add('is-visible');
    }
  };

  const ensureIframe = () => {
    if (iframe && iframe.tagName.toLowerCase() === 'iframe') {
      return iframe;
    }
    const container = document.querySelector('.hero-video-frame-layer');
    if (!container) return null;

    const originParam =
      typeof window !== 'undefined' && window.location.origin
        ? `&origin=${encodeURIComponent(window.location.origin)}`
        : '';

    const newIframe = document.createElement('iframe');
    newIframe.id = 'fadhil-hero-yt';
    newIframe.className = 'hero-yt-iframe';
    newIframe.width = '100%';
    newIframe.height = '100%';
    newIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?start=${startTime}&enablejsapi=1&autoplay=1&mute=${isAudioActive ? 0 : 1}&controls=1&playsinline=1&rel=0${originParam}`;
    newIframe.title = 'Fadhil Akbar Cariearsa Portfolio Showcase Video';
    newIframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    newIframe.referrerPolicy = 'strict-origin-when-cross-origin';
    newIframe.allowFullscreen = true;
    iframeLoaded = false;
    newIframe.addEventListener(
      'load',
      () => {
        iframeLoaded = true;
      },
      { once: true }
    );

    if (iframe) {
      iframe.replaceWith(newIframe);
    } else {
      container.appendChild(newIframe);
    }
    iframe = newIframe;
    loadYTAPI();
    return iframe;
  };

  const sendYTCommand = (func, args = []) => {
    const el = ensureIframe();
    if (el && iframeLoaded && el.contentWindow) {
      el.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        'https://www.youtube-nocookie.com'
      );
    }
  };

  const updateSoundIndicator = (active) => {
    isAudioActive = active;
    if (!soundToggleBtn) return;

    let iconEl = soundToggleBtn.querySelector('.sound-icon');
    let labelEl = soundToggleBtn.querySelector('.sound-label');
    if (!iconEl || !labelEl) {
      iconEl = document.createElement('span');
      iconEl.className = 'sound-icon';
      iconEl.setAttribute('aria-hidden', 'true');
      labelEl = document.createElement('span');
      labelEl.className = 'sound-label';
      soundToggleBtn.replaceChildren(iconEl, labelEl);
    }

    if (active && isPlaying) {
      soundToggleBtn.classList.remove('is-muted');
      soundToggleBtn.classList.add('is-active');
      soundToggleBtn.setAttribute('aria-pressed', 'true');
      iconEl.textContent = '🔊';
      labelEl.textContent = 'SOUND 100%';
      soundToggleBtn.title = 'Audio active 100% (Click to pause/mute)';
    } else {
      soundToggleBtn.classList.remove('is-active');
      soundToggleBtn.classList.add('is-muted');
      soundToggleBtn.setAttribute('aria-pressed', 'false');
      iconEl.textContent = '🔇';
      labelEl.textContent = 'CLICK FOR SOUND 100%';
      soundToggleBtn.title = 'Click video or this button to play audio 100%';
    }
  };

  updateSoundIndicator(false);

  const activateVideoAndAudio = () => {
    isAudioActive = true;
    isPlaying = true;
    ensureIframe();
    sendYTCommand('seekTo', [startTime, true]);
    sendYTCommand('unMute');
    sendYTCommand('setVolume', [100]);
    sendYTCommand('playVideo');

    if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
      try {
        ytPlayer.seekTo?.(startTime, true);
        ytPlayer.unMute?.();
        ytPlayer.setVolume?.(100);
        ytPlayer.playVideo?.();
      } catch (_) {}
    }
    if (heroTrigger && heroTrigger !== heroContainer) {
      heroTrigger.classList.add('is-playing');
    }
    updateSoundIndicator(true);
    startBannerCycle();
  };

  const toggleVideoAndAudio = () => {
    if (isAudioActive && isPlaying) {
      sendYTCommand('pauseVideo');
      sendYTCommand('mute');
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        try {
          ytPlayer.pauseVideo?.();
          ytPlayer.mute?.();
        } catch (_) {}
      }
      isPlaying = false;
      if (heroTrigger && heroTrigger !== heroContainer) {
        heroTrigger.classList.remove('is-playing');
      }
      stopBannerCycle();
      updateSoundIndicator(false);
    } else {
      activateVideoAndAudio();
    }
  };

  const initYT = () => {
    if (window.YT && window.YT.Player && iframe && iframe.tagName.toLowerCase() === 'iframe' && !ytPlayer) {
      try {
        ytPlayer = new window.YT.Player(iframe, {
          events: {
            onReady: (event) => {
              event.target.seekTo(startTime, true);
              event.target.setVolume(100);
              if (isAudioActive) {
                try {
                  event.target.unMute();
                  event.target.playVideo();
                } catch (_) {}
                updateSoundIndicator(true);
              } else {
                updateSoundIndicator(false);
              }
            },
            onStateChange: (event) => {
              if (event.data === 0) {
                event.target.seekTo(startTime, true);
                event.target.playVideo();
              } else if (event.data === 1) {
                isPlaying = true;
                if (heroTrigger && heroTrigger !== heroContainer) {
                  heroTrigger.classList.add('is-playing');
                }
                startBannerCycle();
                updateSoundIndicator(isAudioActive);
              } else if (event.data === 2) {
                isPlaying = false;
                if (heroTrigger && heroTrigger !== heroContainer) {
                  heroTrigger.classList.remove('is-playing');
                }
                stopBannerCycle();
                updateSoundIndicator(false);
              }
            },
          },
        });
      } catch (_) {}
    }
  };

  const loadYTAPI = () => {
    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const prevHook = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevHook === 'function') prevHook();
        initYT();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.addEventListener('error', () => {
          stopBannerCycle();
        });
        document.head.append(script);
      }
    }
  };

  heroTrigger.addEventListener('click', () => {
    activateVideoAndAudio();
  });

  soundToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVideoAndAudio();
  });

  window.addEventListener('offline', stopBannerCycle);

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
    const key = event.key.toLowerCase();
    if (event.shiftKey && (key === 'e' || key === 's')) {
      event.preventDefault();
      activateVideoAndAudio();
    }
  });

  return { activateVideoAndAudio, toggleVideoAndAudio };
};
