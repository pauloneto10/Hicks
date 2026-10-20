(() => {
  const box = document.querySelector('.rg3'); if (!box) return;
  const now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const openDay = d !== 2, open = openDay && h >= 18 && h < 23;
  const st = box.querySelector('.rg3-st'), days = box.querySelectorAll('.rg3-dias li'), mk = box.querySelector('.rg3-agora');
  days.forEach(li => { if (+li.dataset.d === d) li.classList.add('hoje'); });
  if (st) {
    st.textContent = open ? 'Aberto agora' : !openDay ? 'Hoje fechado' : h < 18 ? 'Abre hoje às 18h' : 'Abre amanhã às 18h';
    if (d === 1 && h >= 23) st.textContent = 'Abre quarta às 18h';
    st.classList.toggle('on', open);
  }
  if (mk && open) { mk.style.left = ((h - 18) / 5 * 100).toFixed(1) + '%'; mk.hidden = false; }
})();
