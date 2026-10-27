/**
 * Hero YouTube facade controller.
 * Uses https://www.youtube-nocookie.com for privacy and Core Web Vitals optimization.
 * Defers iframe loading until user interaction or autoplay readiness.
 */
export const initHeroYouTube = () => {
  const heroTrigger = document.querySelector(".hero-media-wrap");
  const soundToggleBtn = document.getElementById("hero-sound-btn");
  const pictureLayer = document.querySelector(".hero-picture-layer");

  if (!heroTrigger) return;

  const videoId = heroTrigger.dataset.youtubeVideoId || "r_UrlnA-6z4";
  const startTime = parseInt(heroTrigger.dataset.youtubeStart || "6", 10);
  let iframe = document.getElementById("fadhil-hero-yt");
  let ytPlayer = null;
  let isAudioActive = false;
  let isPlaying = false;
  let bannerCycleTimer = null;
  let isCycling = false;

  const startBannerCycle = () => {
    if (isCycling) return;
    isCycling = true;
    const cycle = () => {
      if (!isCycling || !pictureLayer) return;
      pictureLayer.classList.remove("is-hidden");
      pictureLayer.classList.add("is-visible");
      bannerCycleTimer = setTimeout(() => {
        if (!isCycling || !pictureLayer) return;
        pictureLayer.classList.remove("is-visible");
        pictureLayer.classList.add("is-hidden");
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
      pictureLayer.classList.remove("is-hidden");
      pictureLayer.classList.add("is-visible");
    }
  };

  const ensureIframe = () => {
    if (iframe && iframe.tagName.toLowerCase() === 'iframe') {
      return iframe;
    }
    const container = document.querySelector(".hero-video-frame-layer");
    if (!container) return null;

    const newIframe = document.createElement("iframe");
    newIframe.id = "fadhil-hero-yt";
    newIframe.className = "hero-yt-iframe";
    newIframe.width = "100%";
    newIframe.height = "100%";
    newIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?si=MzDoxi9AW-lhCFSV&start=${startTime}&enablejsapi=1&autoplay=1&mute=${isAudioActive ? 0 : 1}&controls=1&playsinline=1&rel=0&vq=hd1080`;
    newIframe.title = "YouTube video player";
    newIframe.frameBorder = "0";
    newIframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    newIframe.referrerPolicy = "strict-origin-when-cross-origin";
    newIframe.allowFullscreen = true;

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
    if (el && el.contentWindow) {
      el.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: func,
        args: args
      }), "*");
    }
  };

  const updateSoundIndicator = (active) => {
    isAudioActive = active;
    if (!soundToggleBtn) return;
    if (active && isPlaying) {
      soundToggleBtn.classList.remove("is-muted");
      soundToggleBtn.classList.add("is-active");
      soundToggleBtn.innerHTML = '<span class="sound-icon">🔊</span><span class="sound-label">SOUND 100%</span>';
      soundToggleBtn.title = "Audio aktif 100% (Klik untuk jeda/mute)";
    } else {
      soundToggleBtn.classList.remove("is-active");
      soundToggleBtn.classList.add("is-muted");
      soundToggleBtn.innerHTML = '<span class="sound-icon">🔇</span><span class="sound-label">CLICK FOR SOUND 100%</span>';
      soundToggleBtn.title = "Click video or this button to play audio 100%";
    }
  };

  updateSoundIndicator(false);

  const activateVideoAndAudio = () => {
    isAudioActive = true;
    isPlaying = true;
    ensureIframe();
    sendYTCommand("seekTo", [startTime, true]);
    sendYTCommand("unMute");
    sendYTCommand("setVolume", [100]);
    sendYTCommand("setPlaybackQuality", ["hd1080"]);
    sendYTCommand("playVideo");

    if (ytPlayer && typeof ytPlayer.playVideo === "function") {
      try {
        ytPlayer.seekTo?.(startTime, true);
        ytPlayer.unMute?.();
        ytPlayer.setVolume?.(100);
        ytPlayer.playVideo?.();
      } catch (_) {}
    }
    updateSoundIndicator(true);
    startBannerCycle();
  };

  const toggleVideoAndAudio = () => {
    if (isAudioActive && isPlaying) {
      sendYTCommand("pauseVideo");
      sendYTCommand("mute");
      if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
        try {
          ytPlayer.pauseVideo?.();
          ytPlayer.mute?.();
        } catch (_) {}
      }
      isPlaying = false;
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
              try {
                event.target.setPlaybackQuality("hd1080");
              } catch (_) {}
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
                startBannerCycle();
                updateSoundIndicator(isAudioActive);
              } else if (event.data === 2) {
                isPlaying = false;
                updateSoundIndicator(false);
              }
            }
          }
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
        if (typeof prevHook === "function") prevHook();
        initYT();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.append(script);
      }
    }
  };

  heroTrigger.addEventListener("click", () => {
    activateVideoAndAudio();
  });

  heroTrigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateVideoAndAudio();
    }
  });

  soundToggleBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleVideoAndAudio();
  });

  soundToggleBtn?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      toggleVideoAndAudio();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    const key = event.key.toLowerCase();
    if (event.shiftKey && (key === "e" || key === "s")) {
      event.preventDefault();
      activateVideoAndAudio();
    }
  });

  return { activateVideoAndAudio, toggleVideoAndAudio };
};
