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
  let gone = false, flying = false;
  const end = () => { if (gone) return; gone = true; html.classList.remove('hki-lock'); el.remove(); scrollTo(0, 0); };
  const fly = () => {
    if (flying) return; flying = true;
    const src = el.querySelector('.hki-wordwrap');
    const target = document.querySelector('.header .brand-h');
    el.classList.add('hki-fly');
    el.style.transition = 'background-color 1s ease .3s';
    el.style.backgroundColor = 'rgba(0,0,0,0)';
    if (!src || !target) { setTimeout(end, 1100); return; }
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    const s = b.height / a.height;
    const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    src.style.animation = 'none'; src.style.clipPath = 'none';
    src.style.transition = 'transform 1.15s cubic-bezier(.65,0,.25,1)';
    requestAnimationFrame(() => { src.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${s.toFixed(4)})`; });
    setTimeout(end, 1200);
  };
  el.addEventListener('click', fly);
  setTimeout(fly, 2700);
  setTimeout(end, 6000);
})();
