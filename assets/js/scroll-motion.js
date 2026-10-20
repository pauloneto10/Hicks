(() => {
  const now = new Date();
  const HK_MONTHS = 46 + (now.getFullYear() - 2026) * 12 + (now.getMonth() - 9);
  document.querySelectorAll('.hk-months').forEach(el => { el.textContent = HK_MONTHS; });
  const lazyVid = document.querySelector('.kitchen-video[data-src]');
  if (lazyVid) {
    const start = () => { if (lazyVid.src) return; lazyVid.src = lazyVid.dataset.src; lazyVid.muted = true; const p = lazyVid.play(); if (p && p.catch) p.catch(() => {}); };
    const arm = () => { if ('IntersectionObserver' in window) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { start(); o.disconnect(); } }, { rootMargin: '300px 0px' }); o.observe(lazyVid); } else start(); };
    if (document.readyState === 'complete') arm(); else addEventListener('load', arm, { once: true });
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const sel = [
    'main > section:not(.hero) .eyebrow', 'main > section:not(.hero) h2', 'main > section:not(.hero) h2 + p',
    '.section-heading > p', '.access-actions > *', '.recognition-fact', '.mobile-seals img',
    '.plaque .award-compact', '.kitchen-head > *', '.kitchen-photo', '.rv-head', '.choice-card',
    '.order-links > a', '.hours', '.faq details', '.footer-top > *', '.manifesto-strip', '.mq-follow'
  ].join(',');
  const els = [...document.querySelectorAll(sel)].filter(el => !el.closest('.hero') && !el.closest('dialog') && !el.matches('.footer-dog'));
  const groups = new Map();
  els.forEach(el => {
    el.classList.add('sr');
    const key = el.parentElement;
    const i = (groups.get(key) || 0); groups.set(key, i + 1);
    el.style.setProperty('--sr-d', Math.min(i, 6) * 70 + 'ms');
    if (el.matches('.mobile-seals img')) el.classList.add('sr-pop');
    if (el.matches('.kitchen-photo, .plaque .award-compact')) el.classList.add('sr-zoom');
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('sr-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));

  // Leve parallax no vídeo da cozinha
  const vid = document.querySelector('.kitchen-video');
  if (vid) {
    let t = false;
    const upd = () => { t = false; const r = vid.parentElement.getBoundingClientRect(); const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; vid.style.transform = `translateY(${(p * -28).toFixed(1)}px) scale(1.06)`; };
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // Selos: carrossel horizontal com CTA em variações (?seal=pontos|setas|arraste|progresso)
  const track = document.querySelector('.seal-stack:not(.sw-on)') && !document.querySelector('script[src*="seal-wheel"]') ? document.querySelector('.seal-stack') : null;
  if (track) {
    const mode = (new URLSearchParams(location.search).get('seal') || 'pontos').toLowerCase();
    const cards = [...track.querySelectorAll('.seal-card')];
    const n = cards.length, pad = v => String(v).padStart(2, '0');
    const padL = () => parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const go = i => { i = Math.max(0, Math.min(n - 1, i)); const c = cards[i]; track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }); };
    let cur = 0;
    const ctl = document.createElement('div'); ctl.className = 'seal-ctl seal-ctl-' + mode;
    let dotsEl, countEl, barEl, prevB, nextB, hintEl;
    const mkBtn = (cls, label, txt, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('aria-label', label); b.textContent = txt; b.addEventListener('click', fn); return b; };
    if (mode === 'setas') {
      prevB = mkBtn('sc-arrow', 'Selo anterior', '←', () => go(cur - 1));
      nextB = mkBtn('sc-arrow', 'Próximo selo', '→', () => go(cur + 1));
      countEl = document.createElement('span'); countEl.className = 'sc-count';
      ctl.append(prevB, countEl, nextB);
    } else if (mode === 'arraste') {
      hintEl = document.createElement('span'); hintEl.className = 'sc-hint';
      hintEl.innerHTML = '<i class="sc-hand"></i>arraste para ver os selos';
      ctl.append(hintEl);
      const kill = () => { ctl.classList.add('sc-done'); track.removeEventListener('scroll', kill); };
      setTimeout(() => track.addEventListener('scroll', kill, { passive: true }), 600);
      if ('IntersectionObserver' in window) { const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { track.classList.add('sc-peek'); setTimeout(() => track.classList.remove('sc-peek'), 1400); o.disconnect(); } }, { threshold: .6 }); o.observe(track); }
    } else if (mode === 'progresso') {
      countEl = document.createElement('span'); countEl.className = 'sc-count';
      const bar = document.createElement('span'); bar.className = 'sc-bar'; barEl = document.createElement('i'); bar.append(barEl);
      const nx = mkBtn('sc-next', 'Próximo selo', 'próximo →', () => go(cur + 1 >= n ? 0 : cur + 1));
      ctl.append(countEl, bar, nx);
    } else {
      countEl = document.createElement('span'); countEl.className = 'sc-min';
      ctl.append(countEl);
      ctl.addEventListener('click', () => go(cur + 1 >= n ? 0 : cur + 1));
    }
    const INFO = [
      HK_MONTHS + ' meses seguidos como <a class="si-link" href="super-restaurante-ifood.html">Super Restaurante iFood <span>↗︎</span></a> <em class="si-more">E contando…</em>',
      'Carne Angus com origem certificada.',
      'Entre os 10 melhores burgers de Campinas.',
      'O mesmo padrão, todos os dias do ano.',
      'Carne bovina de qualidade verificada.'
    ];
    const info = document.createElement('p'); info.className = 'seal-info'; info.setAttribute('aria-live', 'polite');
    track.after(info);
    info.after(ctl);
    let infoI = -1;
    const setInfo = i => { if (i === infoI) return; infoI = i; info.classList.add('sw'); setTimeout(() => { info.innerHTML = INFO[i] || ''; info.classList.remove('sw'); }, infoI === i && info.textContent ? 160 : 0); };
    let tk = false;
    const upd = () => { tk = false; const mid = track.scrollLeft + track.clientWidth / 2; let best = 0, bd = 1e9;
      cards.forEach((c, i) => { const sd = c.offsetLeft + c.offsetWidth / 2 - mid, d = Math.abs(sd); if (d < bd) { bd = d; best = i; }
        const t = Math.min(d / c.offsetWidth, 1), far = Math.min(d / c.offsetWidth, 2); c.style.transform = 'translateX(' + (-Math.sign(sd) * t * 62).toFixed(1) + 'px) scale(' + (1 - t * .3).toFixed(3) + ')'; c.style.zIndex = String(10 - Math.round(far * 3)); c.style.opacity = (far > 1.5 ? Math.max(0, 1 - (far - 1) * 2) * .45 : 1 - t * .55).toFixed(3); c.style.filter = 'brightness(' + (1 - t * .35).toFixed(3) + ')'; const cap = c.querySelector('.seal-cap'); if (cap) cap.style.opacity = Math.max(0, 1 - t * 1.6).toFixed(3); });
      cur = best; setInfo(best);
      if (dotsEl) [...dotsEl.children].forEach((b, i) => b.classList.toggle('on', i === best));
      if (countEl) countEl.innerHTML = mode === 'pontos' || !['setas','arraste','progresso'].includes(mode) ? (best + 1) + ' de ' + n + ' <span class="sc-sep">·</span> ' + (best === n - 1 ? 'voltar ←' : 'deslize →') : '<b>' + pad(best + 1) + '</b> / ' + pad(n);
      if (barEl) { const max = track.scrollWidth - track.clientWidth; barEl.style.width = (max > 0 ? Math.max(1 / n, track.scrollLeft / max) * 100 : 100) + '%'; }
      if (prevB) { prevB.disabled = best === 0; nextB.disabled = best === n - 1; }
    };
    track.addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
  // Bulldog do rodapé: começa como marca-d'água na lateral e vai para o lugar
  const fdog = document.querySelector('.footer-dog');
  if (fdog) {
    fdog.style.willChange = 'transform, opacity'; fdog.style.position = 'relative'; fdog.style.zIndex = '0';
    const ease = t => 1 - Math.pow(1 - t, 3);
    let tk = false;
    const upd = () => { tk = false;
      const pr = fdog.parentElement.getBoundingClientRect(), vh = innerHeight, vw = document.documentElement.clientWidth;
      const top = pr.top + fdog.offsetTop;
      const raw = Math.min(Math.max((vh - top) / (vh * 0.85), 0), 1), p = ease(raw), k = 1 - p;
      const cx = pr.left + fdog.offsetLeft + fdog.offsetWidth / 2, dx = (vw * 0.92 - cx) * k, dy = -vh * 0.18 * k;
      fdog.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (1 + 2.4 * k).toFixed(3) + ') rotate(' + (-12 * k).toFixed(2) + 'deg)';
      fdog.style.opacity = (0.06 + 0.94 * Math.pow(p, 1.6)).toFixed(3);
    };
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
  // Placa: um traço por mês, o último pulsando
  const ticks = document.querySelector('#placa .pq-ticks');
  if (ticks) {
    ticks.innerHTML = Array.from({ length: HK_MONTHS }, (_, i) => '<i style="--d:' + (i * 18) + 'ms"' + (i === HK_MONTHS - 1 ? ' class="now"' : '') + '></i>').join('');
    const o = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { ticks.classList.add('on'); o.disconnect(); } }, { threshold: .4 });
    o.observe(ticks);
  }
})();
