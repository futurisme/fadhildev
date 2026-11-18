/**
 * Responsive Bento card order controller.
 * Ensures mobile/stacked viewports (<= 1200px) always display cards in the
 * exact DOM and visual sequence:
 *   1. Video Banner (.hero-banner-frame)
 *   2. ABOUT ME (.about-cyber-frame)
 *   3. SOCIAL PROFILES (.socials-cyber-frame)
 *   4. TOOLS AND PLATFORMS (.tools-cyber-frame)
 *   5. SKILLS (.skills-cyber-frame)
 *   6. FEATURED LEARNING PORTFOLIOS (.portfolios-section)
 * While preserving the two-column desktop bento structure (> 1200px).
 */

export const MOBILE_CARD_SELECTORS = [
  '.hero-banner-frame',
  '.about-cyber-frame',
  '.socials-cyber-frame',
  '.tools-cyber-frame',
  '.skills-cyber-frame',
  '.portfolios-section',
];

export const DESKTOP_COLUMN_SELECTORS = {
  heroColumn: ['.hero-banner-frame', '.skills-cyber-frame'],
  profileColumn: ['.about-cyber-frame', '.socials-cyber-frame', '.tools-cyber-frame'],
};

export const getResponsiveOrderMode = (viewportWidth) =>
  viewportWidth <= 1200 ? 'mobile' : 'desktop';

export const initResponsiveCardOrder = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;

  const bentoGrid = document.querySelector('.bento-grid');
  const heroColumn = bentoGrid?.querySelector('.hero-column');
  const profileColumn = bentoGrid?.querySelector('.profile-column');
  const heroSrHeading = bentoGrid?.querySelector('.hero-column > h2.sr-only, .bento-grid > h2.sr-only');
  const heroCard = bentoGrid?.querySelector('.hero-banner-frame');
  const aboutCard = bentoGrid?.querySelector('.about-cyber-frame');
  const socialsCard = bentoGrid?.querySelector('.socials-cyber-frame');
  const toolsCard = bentoGrid?.querySelector('.tools-cyber-frame');
  const skillsCard = bentoGrid?.querySelector('.skills-cyber-frame');
  const portfoliosSection = bentoGrid?.querySelector('.portfolios-section');

  if (
    !bentoGrid ||
    !heroColumn ||
    !profileColumn ||
    !heroCard ||
    !aboutCard ||
    !socialsCard ||
    !toolsCard ||
    !skillsCard ||
    !portfoliosSection
  ) {
    return null;
  }

  let currentMode = null;

  const applyOrder = (isMobile) => {
    const nextMode = isMobile ? 'mobile' : 'desktop';
    if (currentMode === nextMode) return;
    currentMode = nextMode;

    if (isMobile) {
      bentoGrid.classList.add('is-mobile-stacked');
      if (heroSrHeading && heroSrHeading.parentElement !== bentoGrid) {
        bentoGrid.insertBefore(heroSrHeading, heroColumn);
      }
      const mobileOrder = [heroCard, aboutCard, socialsCard, toolsCard, skillsCard, portfoliosSection];
      for (const el of mobileOrder) {
        if (el.parentElement !== bentoGrid || el.nextElementSibling !== null) {
          bentoGrid.appendChild(el);
        }
      }
      // Keep ordered nodes cleanly ahead of or behind empty hidden columns
      bentoGrid.appendChild(heroColumn);
      bentoGrid.appendChild(profileColumn);
    } else {
      bentoGrid.classList.remove('is-mobile-stacked');
      bentoGrid.insertBefore(heroColumn, portfoliosSection);
      bentoGrid.insertBefore(profileColumn, portfoliosSection);
      if (heroSrHeading) {
        heroColumn.appendChild(heroSrHeading);
      }
      heroColumn.appendChild(heroCard);
      heroColumn.appendChild(skillsCard);
      profileColumn.appendChild(aboutCard);
      profileColumn.appendChild(socialsCard);
      profileColumn.appendChild(toolsCard);
      bentoGrid.appendChild(portfoliosSection);
    }
  };

  const mql = window.matchMedia('(max-width: 1200px)');
  applyOrder(mql.matches);

  const handleChange = (event) => applyOrder(event.matches);
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', handleChange);
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(handleChange);
  }

  return { applyOrder };
};
