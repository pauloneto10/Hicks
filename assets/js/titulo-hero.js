(() => {
  const h1 = document.getElementById('hero-title');
  if (!h1 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  const wrap = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'hw';
          const inner = document.createElement('span'); inner.className = 'hw-i'; inner.textContent = part;
          inner.style.transitionDelay = (0.12 + i++ * 0.11) + 's';
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.classList.contains('ww')) {
        const w = document.createElement('span'); w.className = 'hw';
        const inner = document.createElement('span'); inner.className = 'hw-i';
        inner.style.transitionDelay = (0.12 + i++ * 0.11) + 's';
        n.replaceWith(w); inner.appendChild(n); w.appendChild(inner);
      } else if (n.nodeType === 1 && n.tagName !== 'IMG' && n.tagName !== 'BR') wrap(n);
    });
  };
  wrap(h1);
  const dog = h1.querySelector('.hero-title-dog');
  if (dog) dog.style.transitionDelay = (0.2 + i * 0.11) + 's';
  const others = document.querySelectorAll('.hero-copy > .eyebrow, .hero-intro, .hero-actions');
  others.forEach((el, k) => { el.classList.add('hw-fade'); el.style.transitionDelay = (0.25 + i * 0.11 + k * 0.1) + 's'; });
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('hw-in')));
  setTimeout(() => document.documentElement.classList.add('hw-done'), 2400);
})();
