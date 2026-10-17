const __R=u=>(window.__resMap&&window.__resMap[u])||u;
(() => {
 'use strict';
 const mobile = matchMedia('(max-width:650px)');
 let initialized = false, catalog = [], lastFocus = null;
 const root = document.getElementById('sabores-mobile');
 if (!root) return;
 const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shortName = p => {
  const names = {2108471:'Combo Baba-Yaga',2108469:'Combo Duplo Aversa',4854496:'Combo Aversa',2108451:'Combo Chicken Elite',2108463:'Combo Onion Rings & Bacon',2108459:'Combo Jalapeño & Bacon',2108461:'Combo Angus no Alho',4854494:'Combo Cheese Salada',2108458:'Combo Cheese Bacon',2108454:'Combo Quarterão Angus',2108466:'Combo Chicken Salad',2108456:'Combo Kentucky',2108707:'Baba-Yaga',2108706:'Duplo Aversa',4854487:'Aversa',2108688:'Chicken Crispy | Elite',2108690:'Tex-Mex',2108704:'Vila Nova',2108692:'Montevidéu',2108699:'O Clássico',2108709:'Cheese Salada',5086721:'Ribs — Costela Premium',1292563:'Nuggets Artesanais · 10 un.',1292565:'Anéis de Cebola · 10 un.',1292558:'Almofadinha de Gouda · 10 un.',5241492:'Pudim de Leite Condensado · 120 g'};
  return names[p.id] || p.name;
 };
 const dialog = document.getElementById('mobile-product-dialog');
 const HIGHLIGHTS = [2108706,2108707,2108699,2108690,2108692,2108704];
 function render(category) {
  const list = HIGHLIGHTS.map(id => catalog.find(p => p.id === id)).filter(Boolean);
  document.getElementById('mobile-category-title').textContent = category;
  document.getElementById('mobile-category-count').textContent = `${list.length} ${list.length===1?'produto':'produtos'}`;
  document.getElementById('mobile-catalog-products').innerHTML = list.map(p => `<article class="mobile-clean-product"><button type="button" class="mobile-clean-photo" data-mobile-product="${p.id}" aria-label="Ver detalhes de ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)} — foto com bulldog discreto ao fundo" width="1254" height="1254" loading="lazy" decoding="async"></button><div class="mobile-clean-name"><h4>${esc(shortName(p))}</h4><strong><small>R$</small>${esc(p.prices[0].replace(/^R\$\s*/,''))}</strong></div>${p.soldOut?'<span class="mobile-soldout">Esgotado no cardápio</span>':''}<p class="mobile-clean-desc">${esc(p.description || p.name)}</p><button type="button" class="mobile-clean-detail" data-mobile-product="${p.id}" aria-label="Ver ingredientes e detalhes de ${esc(p.name)}">Ver detalhes <span>↗︎</span></button></article>`).join('');
  document.getElementById('mobile-catalog-status').textContent = `${category}: ${list.length} produtos apresentados.`;
 }

 function subName(p) {
  const t = shortName(p).replace(/\s*\|.*$/, '');
  const clean = s => s.replace(/\s+/g, ' ').replace(/\s*-\s*\(.*?\)/g, '').replace(/\s*\(.*?\)/g, '').trim();
  if (p.name.includes('|')) { const parts = p.name.split('|').map(s => clean(s)); const other = parts.find(s => s && s.toLowerCase() !== t.toLowerCase()); if (other) return other; }
  const n = clean(p.name);
  if (n.toLowerCase() !== t.toLowerCase()) return n.replace(/^Combo\s+/i, 'Combo · ');
  if (/Burgers/i.test(p.category)) return 'Angus Premium no pão brioche';
  return p.category;
 }

 function renderReveal() {
  const host = document.getElementById('reveal-menu'); if (!host) return;
  const byId = id => catalog.find(p => p.id === id);
  const price = s => String(s || '').replace(/^R\$\s*/, '');
  const num = s => parseFloat(price(s).replace('.', '').replace(',', '.'));
  const groups = [
   { k: 'vendidos', t: 'Mais vendidos', s: 'Os que mais saem da chapa', list: [2108706, 4854487, 2108699, 2108707].map(byId).filter(Boolean) },
   { k: 'destaques', t: 'Destaques', s: 'Personalidade da casa', list: HIGHLIGHTS.map(byId).filter(Boolean) },
   { k: 'promo', t: 'Promoções', s: 'Combos com preço especial', list: catalog.filter(p => /^Combos/.test(p.category) && p.prices[1] && num(p.prices[1]) > num(p.prices[0])) }
  ];
  const usedCovers = new Set();
  const cover = g => { const p = g.list.find(x => !usedCovers.has(x.image)) || g.list[0]; if (!p) return ''; usedCovers.add(p.image); return p.image; };
  host.innerHTML = groups.map((g, gi) => `<div class="rv-item rv-${g.k}${gi === 0 ? ' open' : ''}"><button type="button" class="rv-head" aria-expanded="${gi === 0}"><img class="rv-bg" src="${esc(cover(g))}" alt="" aria-hidden="true"><span class="rv-txt"><span class="rv-no">${String(gi + 1).padStart(2, '0')}${g.k === 'promo' ? '<em>oferta</em>' : ''}</span><b>${g.t}</b><small>${g.s}</small></span><span class="rv-side"><span class="rv-thumbs">${g.list.slice(0, 3).map(p => `<img src="${esc(p.image)}" alt="" loading="lazy">`).join('')}</span><span class="rv-count">${g.list.length} ${g.k === 'promo' ? 'combos' : 'lanches'}</span></span><span class="rv-chev" aria-hidden="true">+</span></button><div class="rv-body"><div class="rv-inner"><div class="cf" role="region" aria-roledescription="carousel" aria-label="${g.t}"><button type="button" class="cf-nav cf-prev" aria-label="Anterior">‹</button><button type="button" class="cf-nav cf-next" aria-label="Próximo">›</button><div class="cf-frame" tabindex="0"><div class="cf-stage">${g.list.map((p, i) => `<div class="cf-card" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${g.list.length}"><img src="${esc(p.image)}" alt="${esc(p.name)}" draggable="false" loading="lazy"></div>`).join('')}</div></div><div class="cf-cap"><span class="cf-name"></span><span class="cf-sub"></span><span class="cf-price"></span><button type="button" class="cf-open">Ver lanche <span>↗︎</span></button></div><div class="cf-dots">${g.list.map((_, i) => `<button type="button" aria-label="Ir para ${i + 1}"></button>`).join('')}</div></div></div></div></div>`).join('');
  const flows = [...host.querySelectorAll('.cf')].map((el, gi) => coverflow(el, groups[gi], price));
  host.addEventListener('click', e => {
   const h = e.target.closest('.rv-head'); if (!h) return;
   const item = h.parentElement, was = item.classList.contains('open'); if (was) return;
   host.querySelectorAll('.rv-item').forEach(i => { i.classList.remove('open'); i.querySelector('.rv-head').setAttribute('aria-expanded', 'false'); });
   if (!was) { item.classList.add('open'); h.setAttribute('aria-expanded', 'true'); const f = flows[[...host.children].indexOf(item)]; if (f) requestAnimationFrame(f.measure); }
  });
 }
 function coverflow(root, group, price) {
  const items = group.list, count = items.length, loop = count > 2;
  const frame = root.querySelector('.cf-frame'), cards = [...root.querySelectorAll('.cf-card')];
  const nameEl = root.querySelector('.cf-name'), subEl = root.querySelector('.cf-sub'), priceEl = root.querySelector('.cf-price');
  const dots = [...root.querySelectorAll('.cf-dots button')];
  const R = 44, DEPTH = 0.6, FALL = 0.56, FADE = 0.16, GAP = 0.05;
  let pos = 0, target = 0, width = 0, raf = null, drag = null, sel = -1;
  const idx = p => ((Math.round(p) % count) + count) % count;
  const clamp = p => loop ? p : Math.max(0, Math.min(count - 1, p));
  const select = i => {
   if (i === sel) return; sel = i; const p = items[i];
   nameEl.textContent = shortName(p).replace(/\s*\|.*$/, '');
   subEl.textContent = subName(p);
   priceEl.innerHTML = (group.k === 'promo' && p.prices[1] ? `<s>R$ ${esc(price(p.prices[1]))}</s>` : '') + `<small>R$</small>${esc(price(p.prices[0]))}`;
   dots.forEach((d, k) => d.classList.toggle('on', k === i));
  };
  const paint = () => {
   if (!width) return; const pitch = width * (1 + GAP);
   cards.forEach((card, i) => {
    let off = i - pos;
    if (loop) { off = ((off % count) + count) % count; if (off > count / 2) off -= count; }
    const d = Math.abs(off), ramp = Math.pow(d, FALL), tilt = Math.min(R * ramp, 82) * Math.sign(off);
    card.style.transform = `translateX(calc(-50% + ${off * pitch}px)) translateZ(${-DEPTH * width * ramp}px) rotateY(${-tilt}deg)`;
    const edge = loop ? Math.min(1, Math.max(0, count / 2 - d)) : 1;
    card.style.opacity = String(Math.max(0, 1 - FADE * d) * edge);
    card.style.zIndex = String(100 - Math.round(d));
   });
  };
  const settle = t => {
   if (raf) cancelAnimationFrame(raf); target = t; select(idx(t));
   const step = () => { const r = target - pos; if (Math.abs(r) < 0.0004) { pos = target; paint(); raf = null; return; } pos += r * 0.16; paint(); raf = requestAnimationFrame(step); };
   raf = requestAnimationFrame(step);
  };
  const goTo = i => settle(clamp(loop ? i + Math.round((target - i) / count) * count : i));
  const nudge = by => settle(clamp(Math.round(target) + by));
  frame.addEventListener('pointerdown', e => {
   if (raf) { cancelAnimationFrame(raf); raf = null; }
   frame.setPointerCapture(e.pointerId); target = pos;
   drag = { id: e.pointerId, x: e.clientX, pos, v: 0, t: performance.now(), moved: 0 };
  });
  frame.addEventListener('pointermove', e => {
   if (!drag || drag.id !== e.pointerId) return; const pitch = width * (1 + GAP); if (!pitch) return;
   const now = performance.now(), prev = pos; drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
   pos = clamp(drag.pos - (e.clientX - drag.x) / pitch);
   drag.v = ((pos - prev) / Math.max(now - drag.t, 1)) * 1000; drag.t = now; select(idx(pos)); paint();
  });
  const end = e => {
   if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null;
   if (d.moved < 6) {
    const card = document.elementFromPoint(e.clientX, e.clientY)?.closest('.cf-card');
    const i = cards.indexOf(card);
    if (i >= 0 && i === sel) { openProduct(items[i], root.querySelector('.cf-open')); settle(clamp(Math.round(pos))); return; }
    if (i >= 0) { goTo(i); return; }
   }
   settle(clamp(Math.round(pos + Math.max(-2, Math.min(2, d.v * 0.18)))));
  };
  frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
  frame.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); } else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); } });
  dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
  root.querySelector('.cf-prev').addEventListener('click', () => nudge(-1));
  root.querySelector('.cf-next').addEventListener('click', () => nudge(1));
  let wheelAcc = 0, wheelT = 0;
  frame.addEventListener('wheel', e => {
   if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
   e.preventDefault(); wheelAcc += e.deltaX;
   const now = performance.now();
   if (Math.abs(wheelAcc) > 40 && now - wheelT > 220) { nudge(wheelAcc > 0 ? 1 : -1); wheelAcc = 0; wheelT = now; }
  }, { passive: false });
  root.querySelector('.cf-open').addEventListener('click', e => openProduct(items[sel], e.currentTarget));
  const measure = () => { width = cards[0] ? cards[0].offsetWidth : 0; paint(); };
  new ResizeObserver(measure).observe(frame);
  select(0); measure();
  return { measure };
 }
 function descHTML(p) {
  const raw = String(p.description || '').replace(/\r/g, '').trim();
  const parts = raw.split(/\n\s*\n/);
  let ing = (parts[0] || '').split('\n').map(s => s.trim()).filter(Boolean);
  let blurb = parts.slice(1).join(' ').trim();
  if (ing.length < 2) { blurb = [ing.join(' '), blurb].filter(Boolean).join(' '); ing = []; }
  const isBurger = /^(Combos|Burgers)/i.test(p.category);
  if (isBurger && !ing.length && blurb) ing = blurb.replace(/\.$/, '').split(/,\s*|\s+e\s+/).map(s => s.trim()).filter(s => s && s.length < 60);
  const kind = t => { const s = t.toLowerCase();
    if (/batata|fritas|bebida|refrigerante/.test(s)) return 'side';
    if (/pão|brioche/.test(s)) return 'bun';
    if (/maionese|molho|barbecue|catupiry|sriracha|ketchup|mostarda/.test(s)) return 'sauce';
    if (/empanad|crocante|onion|anéis|chicken|frango/.test(s)) return 'fried';
    if (/burger|angus|carne|costela|ribs|blend/.test(s)) return 'patty';
    if (/cheddar|queijo|muçarela|mussarela|gouda/.test(s)) return 'cheese';
    if (/bacon/.test(s)) return 'bacon';
    if (/tomate/.test(s)) return 'tomato';
    if (/alface|cebola|picles|pepino|jalapeño|rúcula/.test(s)) return 'veg';
    if (/alho/.test(s)) return 'garlic';
    return 'other'; };
  let out = '';
  if (blurb && !(isBurger && ing.length)) out += `<p class="pd-blurb">${esc(blurb)}</p>`;
  if (isBurger && ing.length) {
    const items = ing.map(t => ({ t, k: kind(t) }));
    const sides = items.filter(i => i.k === 'side');
    const order = ['sauce', 'veg', 'tomato', 'bacon', 'garlic', 'other', 'cheese', 'fried', 'patty'];
    const fill = items.filter(i => i.k !== 'side' && i.k !== 'bun').sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
    const bun = items.find(i => i.k === 'bun') || { t: 'Pão de brioche', k: 'bun' };
    const layers = [{ t: bun.t, k: 'bun-top' }, ...fill, { t: 'Base de brioche', k: 'bun-bottom' }];
    out += `<div class="pd-ing"><span class="pd-ing-h">Estrutura do lanche <b>${layers.length} camadas</b></span><ol class="pd-stack">${layers.map(l => `<li class="pd-l pd-${l.k}"><i></i><span>${esc(l.t)}</span></li>`).join('')}</ol>${sides.length ? `<p class="pd-sides">Acompanha: ${sides.map(s => esc(s.t)).join(' · ')}</p>` : ''}</div>`;
  } else if (ing.length) {
    out += `<div class="pd-ing"><span class="pd-ing-h">Composição</span><ol>${ing.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>`;
  }
  return out || `<p class="pd-blurb">${esc(p.name)}</p>`;
 }
 function openProduct(p, button) {
  lastFocus = button;
  document.getElementById('mobile-dialog-content').innerHTML = `<img class="mobile-dialog-photo" src="${esc(p.image)}" alt="${esc(p.name)}"><div class="mobile-dialog-copy"><p class="eyebrow">${esc(p.category)}</p><h2 id="mobile-dialog-title" class="pd-title">${esc(shortName(p).replace(/\s*\|.*$/,""))}</h2><p class="pd-sub">${esc(subName(p))}</p>${descHTML(p)}${p.soldOut?'<span class="mobile-soldout">Esgotado no cardápio na consulta</span>':''}<p class="pd-cta-title">Peça agora o seu</p><div class="access-actions pd-actions"><a class="ch ch-web" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="Pedir no cardápio Hick’s"><img class="ch-logo" src="${__R('assets/img/hicks-logo.png')}" alt="Hick’s" width="644" height="209"><span class="ch-note">peça direto com a gente</span></a><a class="ch ch-ifood" href="https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1" target="_blank" rel="noopener noreferrer"><img class="ch-brand" src="${__R('assets/img/logo-ifood.jpg')}" alt="iFood" width="172" height="148"></a><a class="ch ch-99" href="https://oia.99app.com/dlp9/zgP5vE?area=BR" target="_blank" rel="noopener noreferrer"><img class="ch-brand" src="${__R('assets/img/logo-99food.png')}" alt="99 Food" width="288" height="68"></a></div></div>`;
  dialog.setAttribute('aria-labelledby','mobile-dialog-title');
  dialog.showModal(); document.body.style.overflow='hidden';
 }
 async function init() {
  if (!mobile.matches || initialized) return;
  initialized = true;
  try {
   const embedded = document.getElementById('mobile-catalog-data');
   if (embedded) { catalog = JSON.parse(embedded.textContent); } else {
    const response = await fetch('mobile-catalog.json');
    if (!response.ok) throw new Error('catalog');
    catalog = await response.json();
   }
   render('Destaques da casa');
   renderReveal();
   if(location.hash==='#lanches')root.scrollIntoView({block:'start'});
   document.addEventListener('click', e => {const button=e.target.closest('[data-mobile-product]');if(!button)return;const p=catalog.find(p=>p.id===Number(button.dataset.mobileProduct));if(p)openProduct(p,button);});
   dialog.querySelector('.mobile-dialog-close').addEventListener('click',()=>dialog.close());
   dialog.addEventListener('close',()=>{document.body.style.overflow='';lastFocus?.focus({preventScroll:true});});
   dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  } catch {
   document.getElementById('mobile-catalog-products').innerHTML='<p>Confira todos os sabores no <a class="text-link" href="https://hicks.app.br/hicks_burger_e_hotdog" target="_blank" rel="noopener noreferrer">Cardápio Web ↗︎</a>.</p>';
  }
 }
 // Existing anchor links keep their original destination on desktop.
 document.addEventListener('click',e=>{if(!mobile.matches)return;const a=e.target.closest('a[href="#lanches"]');if(a){e.preventDefault();root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}});
 mobile.addEventListener('change',()=>{if(!mobile.matches&&dialog.open)dialog.close();init();});
 init();
})();
