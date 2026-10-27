import { playCyberSound } from './audio.js';

export const translations = {
  en: "A generalist hobbyist with interests in design, development, animation, cybersecurity, and 2D art (strictly as a hobby and personal interest, not pursued seriously).",
  id: "Seorang generalis penikmat hobi dengan minat pada bidang desain, pengembangan, animasi, keamanan siber, dan seni 2D (murni sebagai hobi dan minat pribadi, tidak ditekuni secara profesional/serius).",
  jp: "デザイン、開発、アニメーション、サイバーセキュリティ、2Dアートに関心を持つジェネラリスト愛好家です（純粋な趣味および個人的な関心として嗜んでおり、本業や専門的な追究ではありません）。"
};

export const initLanguageSwitcher = () => {
  const textElem = document.getElementById("about-desc-content");
  const langBtns = document.querySelectorAll(".lang-flag-btn, .lang-btn");
  if (!textElem || !langBtns.length) return;

  const setLanguage = (lang) => {
    const activeLang = translations[lang] ? lang : "en";
    textElem.textContent = translations[activeLang];
    document.documentElement.lang = activeLang === 'jp' ? 'ja' : activeLang;

    langBtns.forEach((btn) => {
      const isActive = btn.dataset.lang === activeLang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    try {
      localStorage.setItem("cariearsa_fadhil_lang", activeLang);
    } catch (_) {}
  };

  langBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      if (lang) {
        playCyberSound('click');
        setLanguage(lang);
      }
      langBtns.forEach((other) => {
        if (other !== btn) other.classList.remove("is-clicked");
      });
      btn.classList.add("is-clicked");
      setTimeout(() => {
        btn.classList.remove("is-clicked");
      }, 600);
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  // Determine language preference from localStorage or browser language, defaulting to en
  try {
    const saved = localStorage.getItem("cariearsa_fadhil_lang");
    if (saved && translations[saved]) {
      setLanguage(saved);
    } else {
      setLanguage("en");
    }
  } catch (_) {
    setLanguage("en");
  }

  return { setLanguage };
};
