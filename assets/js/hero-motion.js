(() => {
  const img = document.querySelector('.hero-burger');
  const hero = document.querySelector('.hero');
  if (!img || !hero) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const visual = document.querySelector('.hero-visual');
  const copy = document.querySelector('.hero-copy');
  const extras = [...document.querySelectorAll('.hero-dog, .orbit-stamp, .image-caption')];
  if (copy) { copy.style.position = copy.style.position || 'relative'; copy.style.zIndex = '2'; }
  if (visual) visual.style.zIndex = '0';
  Object.assign(img.style, { transformOrigin: '50% 50%', willChange: 'transform, opacity, filter', animation: 'none' });
  let geo = null, ticking = false, intro = 0;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  const measure = () => {
    const prev = img.style.transform; img.style.transform = 'none';
    const r = img.getBoundingClientRect(), h = hero.getBoundingClientRect();
    img.style.transform = prev;
    const vh = Math.min(innerHeight, h.height);
    const big = Math.max(h.width * 1.05, vh * 0.95) / r.width;
    geo = { big, dx: (h.left + h.width / 2) - (r.left + r.width / 2), dy: (h.top + scrollY + vh * 0.5) - (r.top + scrollY + r.height / 2) };
  };
  const progress = () => Math.min(Math.max(scrollY / Math.max(hero.offsetHeight * 0.75, 320), 0), 1);
  const apply = () => {
    ticking = false; if (!geo) measure();
    const p = ease(progress()), k = 1 - p;
    const s = lerp(geo.big, 1, p);
    img.style.transform = `translate(${(geo.dx * k).toFixed(1)}px, ${(geo.dy * k).toFixed(1)}px) scale(${s.toFixed(4)})`;
    img.style.filter = `grayscale(${k.toFixed(3)}) contrast(${lerp(1.9, 1, p).toFixed(3)}) brightness(${lerp(1.5, 1, p).toFixed(3)})`;
    img.style.mixBlendMode = p < 0.98 ? 'screen' : 'normal';
    img.style.opacity = (lerp(0.16, 1, p) * ease(intro)).toFixed(3);
    extras.forEach(el => { el.style.opacity = Math.max(0, (p - 0.55) / 0.45).toFixed(3); });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
  const start = performance.now();
  const step = now => { intro = Math.min((now - start) / 1200, 1); apply(); if (intro < 1) requestAnimationFrame(step); };
  const boot = () => { measure(); apply(); requestAnimationFrame(step); };
  if (img.complete) boot(); else img.addEventListener('load', boot, { once: true });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
})();
