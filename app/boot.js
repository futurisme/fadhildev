/**
 * AVIF decoding capability helper (Updated: November 18, 2026)
 * Uses actual 1x1 AVIF decode probe only when needed rather than unreliable canvas.toDataURL.
 */
export const initAvifHyperLoadEngine = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (typeof window.__AVIF_SUPPORT__ === 'boolean') {
    document.documentElement.classList.add(window.__AVIF_SUPPORT__ ? 'has-avif' : 'no-avif');
    return Promise.resolve(window.__AVIF_SUPPORT__);
  }

  return new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => {
      const ok = probe.width === 1 && probe.height === 1;
      document.documentElement.classList.add(ok ? 'has-avif' : 'no-avif');
      window.__AVIF_SUPPORT__ = ok;
      resolve(ok);
    };
    probe.onerror = () => {
      document.documentElement.classList.add('no-avif');
      window.__AVIF_SUPPORT__ = false;
      resolve(false);
    };
    probe.src =
      'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZgAAARNtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAAA5waXRtAAAAAAABAAAAImlsb2MAAAAAREAAAQABAAAAAAE3AAEAAAAAAAAAFwAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAAk2lwcnAAAABzaXBjbwAAABNjb2xybmNseAACAAIABoAAAAAMYXYxQ4EADAAAAAAUaXNwZQAAAAAAAAABAAAAAQAAAChjbGFwAAAAAQAAAAEAAAABAAAAAf////EAAAAC////8QAAAAIAAAAQcGl4aQAAAAADCAgIAAAAGGlwbWEAAAAAAAAAAQABBYGCA4SFAAAAH21kYXQSAAoFGAAGhCAyDBfwAABIAAAAsBNL6A==';
  });
};
