(() => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  scrollTo(0, 0);
  addEventListener('load', () => scrollTo(0, 0), { once: true });
  addEventListener('pageshow', () => scrollTo(0, 0));
  const el = document.getElementById('hk-intro');
  if (!el) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.remove(); return; }
  const html = document.documentElement;
  html.classList.add('hki-lock');
  scrollTo(0, 0);
  let gone = false;
  const end = () => { if (gone) return; gone = true; html.classList.remove('hki-lock'); el.remove(); scrollTo(0, 0); };
  el.addEventListener('click', () => { if (el.classList.contains('hki-done')) return; el.classList.add('hki-done'); setTimeout(end, 1250); });
  setTimeout(end, 4600);
})();
