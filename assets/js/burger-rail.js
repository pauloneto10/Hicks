(() => {
  const rail = document.querySelector('#burgers .sx-cards'); if (!rail) return;
  const hint = document.querySelector('#burgers .sx-arraste');
  const cards = [...rail.querySelectorAll('.sx-card:not(.sx-card-todos)')];
  const bar = document.createElement('div'); bar.className = 'br-prog'; bar.innerHTML = '<span class="br-n">01 / ' + String(cards.length).padStart(2, '0') + '</span><span class="br-track"><i></i></span><span class="br-tip">deslize</span>';
  (hint || rail).after(bar); if (hint) hint.hidden = true;
  const fill = bar.querySelector('i'), num = bar.querySelector('.br-n');
  let tk = false;
  const upd = () => { tk = false; const max = rail.scrollWidth - rail.clientWidth; const p = max > 0 ? rail.scrollLeft / max : 0; fill.style.width = (12 + p * 88).toFixed(1) + '%';
    let best = 0, bd = 1e9; const L = rail.getBoundingClientRect().left; cards.forEach((c, i) => { const d = Math.abs(c.getBoundingClientRect().left - L - 22); if (d < bd) { bd = d; best = i; } });
    num.textContent = String(best + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0'); bar.classList.toggle('moved', rail.scrollLeft > 8); };
  rail.addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();
