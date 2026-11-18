import { playCyberSound } from './audio.js';

export const translations = {
  en: 'A generalist hobbyist with interests in design, development, animation, cybersecurity, and 2D art (strictly as a hobby and personal interest, not pursued seriously).',
  id: 'Seorang generalis penikmat hobi dengan minat pada bidang desain, pengembangan, animasi, keamanan siber, dan seni 2D (murni sebagai hobi dan minat pribadi, tidak ditekuni secara profesional/serius).',
  jp: 'デザイン、開発、アニメーション、サイバーセキュリティ、2Dアートに関心を持つジェネラリスト愛好家です（純粋な趣味および個人的な関心として嗜んでおり、本業や専門的な追究ではありません）。',
};

export const initLanguageSwitcher = () => {
  const textElem = document.getElementById('about-desc-content');
  const langBtns = document.querySelectorAll('.lang-flag-btn');
  if (!textElem || !langBtns.length) return;

  const setLanguage = (lang) => {
    const normalized = lang === 'ja' ? 'jp' : lang;
    const activeLang = translations[normalized] ? normalized : 'en';
    textElem.textContent = translations[activeLang];
    document.documentElement.lang = activeLang === 'jp' ? 'ja' : activeLang;

    langBtns.forEach((btn) => {
      const isActive = btn.dataset.lang === activeLang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    try {
      localStorage.setItem('cariearsa_fadhil_lang', activeLang);
    } catch (_) {}
  };

  const langClickTimers = new WeakMap();

  langBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.dataset.lang;
      if (lang) {
        playCyberSound('click');
        setLanguage(lang);
      }
      langBtns.forEach((other) => {
        if (other !== btn) {
          other.classList.remove('is-clicked');
          const prevOther = langClickTimers.get(other);
          if (prevOther) {
            clearTimeout(prevOther);
            langClickTimers.delete(other);
          }
        }
      });
      const prevTimer = langClickTimers.get(btn);
      if (prevTimer) clearTimeout(prevTimer);
      btn.classList.add('is-clicked');
      const nextTimer = setTimeout(() => {
        btn.classList.remove('is-clicked');
        langClickTimers.delete(btn);
      }, 600);
      langClickTimers.set(btn, nextTimer);
    });
  });

  let initialLang = 'en';
  try {
    const queryLang = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
    const saved = localStorage.getItem('cariearsa_fadhil_lang');
    if (queryLang && (translations[queryLang] || queryLang === 'ja')) {
      initialLang = queryLang;
    } else if (saved && translations[saved]) {
      initialLang = saved;
    }
  } catch (_) {}

  setLanguage(initialLang);

  return { setLanguage };
};
