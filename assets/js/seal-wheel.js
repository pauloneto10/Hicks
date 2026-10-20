(() => {
  const track = document.querySelector('.seal-stack'); if (!track) return;
  const cards = [...track.querySelectorAll('.seal-card')], n = cards.length; if (!n) return;
  const INFO = [
    (() => { const d = new Date(); return 46 + (d.getFullYear() - 2026) * 12 + (d.getMonth() - 9); })() + ' meses seguidos como <a class="si-link" href="super-restaurante-ifood.html">Super Restaurante iFood <span>↗︎</span></a> <em class="si-more">E contando…</em>',
    'Carne Angus com origem certificada.',
    'Entre os 10 melhores burgers de Campinas.',
    'O mesmo padrão, todos os dias do ano.',
    'Carne bovina de qualidade verificada.'
  ];
  track.classList.add('sw-on');
  const info = document.createElement('p'); info.className = 'seal-info'; info.setAttribute('aria-live', 'polite');
  const dots = document.createElement('div'); dots.className = 'sw-dots';
  cards.forEach((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Selo ' + (i + 1)); b.onclick = () => { stop(); goTo(i); }; dots.appendChild(b); });
  track.after(info);
  const STEP = 84, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pos = 0, target = 0, raf = 0, active = -1, timer = 0;
  const wrap = o => { o = ((o % n) + n) % n; return o > n / 2 ? o - n : o; };
  const render = () => {
    cards.forEach((c, i) => {
      const o = wrap(i - pos), a = Math.abs(o), t = Math.min(a, 1), far = Math.min(a, 2);
      const x = Math.sign(o) * (t * STEP + Math.max(0, far - 1) * 34);
      c.style.transform = 'translateX(' + x.toFixed(1) + 'px) scale(' + (1 - t * .32 - Math.max(0, far - 1) * .14).toFixed(3) + ')';
      c.style.zIndex = String(20 - Math.round(a * 4));
      c.style.opacity = (a > 1.5 ? Math.max(0, 1 - (a - 1.5) * 2) * .5 : 1 - t * .45).toFixed(3);
      c.style.filter = 'brightness(' + (1 - t * .45).toFixed(3) + ')';
      const cap = c.querySelector('.seal-cap'); if (cap) cap.style.opacity = Math.max(0, 1 - a * 2).toFixed(3);
      c.setAttribute('aria-hidden', a > .5 ? 'true' : 'false');
    });
    const cur = ((Math.round(pos) % n) + n) % n;
    if (cur !== active) { active = cur; info.innerHTML = INFO[cur] || ''; [...dots.querySelectorAll('button:not(.sw-arr)')].forEach((b, i) => b.classList.toggle('on', i === cur)); }
  };
  const tick = () => { const d = target - pos; pos += d * (reduce ? 1 : .14); if (Math.abs(d) < .001) pos = target; render(); raf = pos === target ? 0 : requestAnimationFrame(tick); };
  const anim = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const goTo = i => { const o = wrap(i - pos); target = Math.round(pos + o); anim(); };
  const step = s => { target = Math.round(target) + s; anim(); };
  const stop = () => { clearInterval(timer); timer = 0; };
  const play = () => { if (reduce || timer) return; timer = setInterval(() => step(1), 3200); };
  let sx = null, sp = 0, moved = false;
  track.addEventListener('pointerdown', e => { sx = e.clientX; sp = pos; moved = false; stop(); track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; pos = target = sp - dx / STEP; render(); });
  const end = () => { if (sx === null) return; sx = null; target = Math.round(pos); anim(); setTimeout(play, 4000); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); return; } const c = e.target.closest('.seal-card'); if (c) { stop(); goTo(cards.indexOf(c)); } }, true);
  track.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { stop(); step(1); } if (e.key === 'ArrowLeft') { stop(); step(-1); } });
  track.tabIndex = 0;
  let wacc = 0, wlock = 0;
  track.addEventListener('wheel', e => { const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0); if (!dx) return; e.preventDefault(); stop(); wacc += dx; const now = Date.now(); if (Math.abs(wacc) > 30 && now > wlock) { step(wacc > 0 ? 1 : -1); wacc = 0; wlock = now + 260; } clearTimeout(track._wt); track._wt = setTimeout(() => { wacc = 0; play(); }, 4000); }, { passive: false });
  const mk = (d, l) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw-arr'; b.setAttribute('aria-label', l); b.innerHTML = d < 0 ? '&larr;' : '&rarr;'; b.onclick = () => { stop(); step(d); setTimeout(play, 4000); }; return b; };
  dots.prepend(mk(-1, 'Selo anterior')); dots.append(mk(1, 'Próximo selo'));
  if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(x => x.isIntersecting ? play() : stop()), { threshold: .4 }).observe(track); else play();
  render();
})();
