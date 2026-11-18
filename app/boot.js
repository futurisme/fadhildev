/**
 * AVIF capability detection helper (Updated: November 17, 2026)
 * Avoids redundant probing when inline head detection already resolved.
 */
export const initAvifHyperLoadEngine = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  if (window.__AVIF_SUPPORT__ === true) {
    document.documentElement.classList.add('has-avif');
    return Promise.resolve(true);
  }
  if (window.__AVIF_SUPPORT__ === false) {
    document.documentElement.classList.add('no-avif');
    return Promise.resolve(false);
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
