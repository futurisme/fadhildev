import { playCyberSound } from './audio.js';

let toastTimeout = null;

export const showCyberToast = (message) => {
  let toast = document.getElementById("cyber-hud-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cyber-hud-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = `
      position: fixed;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #090B12;
      color: #FFE600;
      border: 2px solid #FFE600;
      box-shadow: 4px 4px 0px #FF003C, 0 0 24px rgba(0, 229, 255, 0.35);
      padding: 12px 24px;
      font-family: 'Oswald', sans-serif;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      z-index: 99999;
      opacity: 0;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 4px;
      max-width: 90vw;
      text-align: center;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="color:#00E5FF;font-size:1.2rem;">⚡</span><span>${message}</span>`;
  
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  toastTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, 3200);
};

export const initInteractiveUI = (toggleTheme) => {
  const activeKeys = new Set();

  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    activeKeys.add(event.key.toLowerCase());
    if (activeKeys.has("t") && activeKeys.has("s")) {
      event.preventDefault();
      toggleTheme();
      activeKeys.clear();
      return;
    }
    if (activeKeys.has("t") && activeKeys.has("d")) {
      event.preventDefault();
      document.documentElement.classList.toggle("text-rainbow");
      activeKeys.clear();
    }
  });

  window.addEventListener("keyup", (event) => {
    activeKeys.delete(event.key.toLowerCase());
  });

  const originalTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "戻ってきて！ (PORTFOLIO STANDBY)" : originalTitle;
  });

  const bindInteractiveGroup = (selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((item) => {
      const handleActivate = () => {
        elements.forEach((other) => {
          if (other !== item) other.classList.remove("is-clicked");
        });
        item.classList.add("is-clicked");
        playCyberSound('click');
        setTimeout(() => {
          item.classList.remove("is-clicked");
        }, 700);
      };

      item.addEventListener("click", handleActivate);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (item.tagName.toLowerCase() !== 'a') {
            e.preventDefault();
          }
          handleActivate();
        }
      });
    });
  };

  bindInteractiveGroup(".core-lang-item");
  bindInteractiveGroup(".social-slot-link");
  bindInteractiveGroup(".tool-slot-item");
  bindInteractiveGroup(".skill-pill-item");

  // Deactivated in-development portfolio and cloud buttons handler
  const inDevElements = document.querySelectorAll(".portfolio-launch-btn.is-in-dev, .btn-cloud-db.is-in-dev, [data-in-development]");
  inDevElements.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      playCyberSound('click');
      const name = el.getAttribute("data-project-name") || el.getAttribute("title") || "PROJECT";
      showCyberToast(`PROJECT [${name}] IS CURRENTLY UNDER ACTIVE DEVELOPMENT`);
    });
  });
};
