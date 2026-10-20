(() => {
  const MAX = 1600;
  const tags = [...document.querySelectorAll('.sx-item-tag')].filter(t => /kcal/i.test(t.textContent));
  if (!tags.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = tags.map(tag => {
    const kcal = parseInt(tag.textContent.replace(/\D/g, ''), 10) || 0;
    const a = tag.closest('a') || tag.parentElement;
    const host = [...a.children].reverse().find(c => c.tagName === 'DIV') || a;
    tag.remove();
    const p = document.createElement('p');
    p.className = 'kc';
    p.setAttribute('aria-label', kcal.toLocaleString('pt-BR') + ' kcal');
    p.innerHTML = '<span class="kc-v"><strong>0</strong><small>kcal</small></span><span class="kc-cta">Conheça o lanche <b>↗︎</b></span>';
    host.appendChild(p);
    return { p, kcal, n: p.querySelector('strong'), bar: null, done: false };
  });
  const fmt = v => Math.round(v).toLocaleString('pt-BR');
  const run = it => {
    if (it.done) return; it.done = true;
    it.p.classList.add('on');
    
    if (reduce) { it.n.textContent = fmt(it.kcal); return; }
    const t0 = performance.now(), D = 1100;
    const step = t => { const k = Math.min((t - t0) / D, 1), e = 1 - Math.pow(1 - k, 3); it.n.textContent = fmt(it.kcal * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) { items.forEach(run); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const it = items.find(i => i.p === e.target); if (it) { run(it); io.unobserve(e.target); } } }), { threshold: 1 });
  items.forEach(it => io.observe(it.p));
})();
