import { playCyberSound } from './audio.js';

export const setTheme = (isLight) => {
  document.body.classList.toggle("light-theme", isLight);
  document.body.setAttribute("data-theme", isLight ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");

  const themeToggle = document.querySelector(".theme-toggle");
  themeToggle?.setAttribute("aria-pressed", String(isLight));
  themeToggle?.setAttribute(
    "aria-label",
    isLight ? "Switch to Cyber Dark theme" : "Switch to Manga Light theme"
  );

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", isLight ? "#240308" : "#05060A");
  }

  try {
    localStorage.setItem("portfolio-theme", isLight ? "light" : "dark");
  } catch (_) {}
};

export const initThemeSwitcher = () => {
  const themeToggle = document.querySelector(".theme-toggle");

  // Read theme from document data-theme (which may have been set in head inline script)
  const isCurrentlyLight = document.documentElement.getAttribute("data-theme") === "light" ||
    document.body.classList.contains("light-theme");
  setTheme(isCurrentlyLight);

  const toggleTheme = () => {
    if (themeToggle) {
      themeToggle.classList.remove("is-spinning");
      requestAnimationFrame(() => {
        themeToggle.classList.add("is-spinning");
      });
    }
    const isNowLight = !document.body.classList.contains("light-theme");
    setTheme(isNowLight);
    playCyberSound('click');
  };

  themeToggle?.addEventListener("click", toggleTheme);
  themeToggle?.addEventListener("animationend", () => {
    themeToggle.classList.remove("is-spinning");
  });

  return { toggleTheme };
};
