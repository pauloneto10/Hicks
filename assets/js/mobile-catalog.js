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
  document.getElementById('mobile-catalog-products').innerHTML = list.map(p => `<article class="mobile-clean-product"><button type="button" class="mobile-clean-photo" data-mobile-product="${p.id}" aria-label="Ver detalhes de ${esc(p.name)}"><img src="${esc(p.image)}" alt="${esc(p.name)} — foto com bulldog discreto ao fundo" width="1254" height="1254" loading="lazy" decoding="async"></button><div class="mobile-clean-name"><h4>${esc(shortName(p))}</h4></div>${p.soldOut?'<span class="mobile-soldout">Esgotado no cardápio</span>':''}<p class="mobile-clean-desc">${esc(p.description || p.name)}</p><button type="button" class="mobile-clean-detail" data-mobile-product="${p.id}" aria-label="Ver ingredientes e detalhes de ${esc(p.name)}">Ver detalhes <span>↗</span></button></article>`).join('');
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
   { k: 'destaques', t: 'Destaques', s: 'O cardápio completo', list: [...HIGHLIGHTS.map(byId).filter(Boolean), ...['Burgers Angus Premium','Combos - Burger + Fritas + Bebida','Acompanhamentos','Bebidas','Doces & Sobremesas'].flatMap(c => catalog.filter(p => p.category === c && !HIGHLIGHTS.includes(p.id)))] },
   { k: 'promo', t: 'Combos', s: 'Combos em oferta', list: catalog.filter(p => /^Combos/.test(p.category) && p.prices[1] && num(p.prices[1]) > num(p.prices[0])) }
  ];
  const usedCovers = new Set();
  const cover = g => { const p = g.list.find(x => !usedCovers.has(x.image)) || g.list[0]; if (!p) return ''; usedCovers.add(p.image); return p.image; };
  host.innerHTML = groups.map((g, gi) => `<div class="rv-item rv-${g.k}${gi === 0 ? ' open' : ''}"><button type="button" class="rv-head" aria-expanded="${gi === 0}"><img class="rv-bg" src="${esc(cover(g))}" alt="" aria-hidden="true"><span class="rv-txt"><span class="rv-no">${String(gi + 1).padStart(2, '0')}</span><b>${g.t}</b><small>${g.s}</small></span><span class="rv-side"><span class="rv-thumbs">${g.list.slice(0, 3).map(p => `<img src="${esc(p.image)}" alt="" loading="lazy">`).join('')}</span><span class="rv-count">${g.list.length} ${g.k === 'promo' ? 'combos' : g.k === 'destaques' ? 'itens' : 'lanches'}</span></span><span class="rv-chev" aria-hidden="true">+</span></button><div class="rv-body"><div class="rv-inner"><div class="cf" role="region" aria-roledescription="carousel" aria-label="${g.t}"><button type="button" class="cf-nav cf-prev" aria-label="Anterior">‹</button><button type="button" class="cf-nav cf-next" aria-label="Próximo">›</button><div class="cf-frame" tabindex="0"><div class="cf-stage">${g.list.map((p, i) => `<div class="cf-card" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${g.list.length}"><img src="${esc(p.image)}" alt="${esc(p.name)}" draggable="false" loading="lazy"></div>`).join('')}</div></div><div class="cf-cap"><span class="cf-name"></span><span class="cf-sub"></span><span class="cf-price"></span><button type="button" class="cf-open">Ir para o iFood <span>↗</span></button></div><div class="cf-dots">${g.list.map((_, i) => `<button type="button" aria-label="Ir para ${i + 1}"></button>`).join('')}</div></div></div></div></div>`).join('');
  const flows = [...host.querySelectorAll('.cf')].map((el, gi) => coverflow(el, groups[gi], price));
  host.addEventListener('click', e => {
   const h = e.target.closest('.rv-head'); if (!h) return;
   const item = h.parentElement, was = item.classList.contains('open'); if (was) return;
   host.querySelectorAll('.rv-item').forEach(i => { i.classList.remove('open'); i.querySelector('.rv-head').setAttribute('aria-expanded', 'false'); });
   if (!was) { item.classList.add('open'); h.setAttribute('aria-expanded', 'true'); const f = flows[[...host.children].indexOf(item)]; if (f) requestAnimationFrame(f.measure); }
  });
 }
const IFOOD_PRATO={"1292560":"6cf770b0-ab23-4c90-baef-835ef1758001","1292563":"ae60ced2-8281-41b5-bc32-994b3d21b87d","1292565":"473da782-c924-4bb3-9fa0-21dde77ca84a","1292568":"d1abed09-1b4c-4aff-a746-ebf70e428f18","1292569":"3cda9150-fd67-411a-8973-54709584208d","2108458":"2c5a995f-fec7-4c2d-a42c-cb049c7e4691","2108459":"994e4546-d49d-4fc8-9fde-6ea6a05b8051","2108461":"5262ac5a-23ee-4465-8456-4b4bcdcba007","2108463":"7be398f0-10ea-46b6-95c9-b825ef29f0e3","2108466":"761f9111-3345-4e25-a77d-42897e4333ce","2108469":"39035549-88af-42ce-af11-8f1833ee2cc5","2108471":"a292f3e3-8747-423b-80b7-0685dac3c37a","2108690":"2bad5f5a-7cc8-43a1-95ed-2fd0f6ee58ea","2108692":"023ca292-cbb7-42c6-a983-6c3e5060ce95","2108699":"47cbd814-e668-4dee-a903-79e0bac5ccf0","2108702":"d04f2dc4-b995-4370-9a20-6ff837402ea2","2108704":"4cb304a6-290c-4469-a9ff-932f9c18dec1","2108706":"8d1f4951-eccb-4d77-9246-1dd368123027","2108709":"0aee9b24-2405-4570-9eab-ce0765d8e03d","2630319":"6101e4c3-1a59-4e45-9ff7-95248d193f29","2630320":"77e5e301-e609-4162-b33d-d9ebef848019","2630321":"6360c9fd-abf3-4fc9-8423-dc711567151c","4854487":"0590069a-b42b-4658-89c8-92784bb553bb","4854494":"0725af3f-f780-4c92-8794-1c843d021a3b","4854496":"b1ddf6ff-b445-4def-b648-d160867539e6","5040812":"64726b34-5db0-45a4-b6ce-9c609020cfc2","5040813":"6cb27de8-774e-4081-a90e-40dddfbe6843","5174253":"7276bcf2-3c07-4eaa-8d4b-b26b9865cdad","5174560":"46c2390b-3305-4e0a-9ceb-52f45f42ea1a","5174562":"adadc102-443a-485a-af8c-c5622220a1f3","5175093":"164ca506-e2b9-42cb-87dc-cd711bab90c9","5241492":"64ee284d-4229-4dbb-a65d-45ba1e99b1a4"};const ifoodLink=p=>IFOOD_PRATO[p&&p.id]?'https://www.ifood.com.br/delivery/campinas-sp/hicks-burger-hamburgueria---angus-artesanal-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1?prato='+IFOOD_PRATO[p.id]:'https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1';const goIfood=p=>window.open(ifoodLink(p),'_blank','noopener');
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
   priceEl.innerHTML = '';
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
    if (i >= 0 && i === sel) { goIfood(items[i]); settle(clamp(Math.round(pos))); return; }
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
  root.querySelector('.cf-open').addEventListener('click', () => goIfood(items[sel]));
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
 const KCAL = {2108708:'523',5101889:'578',2108454:'578',2108710:'614',2108456:'614',2108704:'625',2108463:'625',2108702:'636',2108466:'636',2108690:'721',2108459:'721',2108709:'734',4854494:'734',2108699:'772',2108458:'772',2108692:'805',2108461:'805',2108688:'1.070',2108451:'1.070',4854487:'1.220',4854496:'1.220',2108707:'1.445',2108471:'1.445',2108706:'1.536',2108469:'1.536'};
 const PAGE = {2108708:'burger-cheese-burger.html',5101889:'burger-quarterao-angus.html',2108454:'burger-quarterao-angus.html',2108710:'burger-kentucky.html',2108456:'burger-kentucky.html',2108704:'burger-vila-nova.html',2108463:'burger-vila-nova.html',2108702:'burger-chicken-salad.html',2108466:'burger-chicken-salad.html',2108690:'burger-tex-mex.html',2108459:'burger-tex-mex.html',2108709:'burger-cheese-salada.html',4854494:'burger-cheese-salada.html',2108699:'burger-o-classico.html',2108458:'burger-o-classico.html',2108692:'burger-montevideu.html',2108461:'burger-montevideu.html',2108688:'burger-elite-chicken-crispy.html',2108451:'burger-elite-chicken-crispy.html',4854487:'burger-aversa.html',4854496:'burger-aversa.html',2108707:'burger-baba-yaga.html',2108471:'burger-baba-yaga.html',2108706:'burger-duplo-aversa.html',2108469:'burger-duplo-aversa.html'};
 const PNAME = {"burger-cheese-burger.html":"Cheese Burger","burger-quarterao-angus.html":"Quarterão Angus","burger-kentucky.html":"Kentucky","burger-vila-nova.html":"Vila Nova","burger-chicken-salad.html":"Chicken Salad","burger-tex-mex.html":"Tex-Mex","burger-cheese-salada.html":"Cheese Salada","burger-o-classico.html":"O Clássico","burger-montevideu.html":"Montevidéu","burger-elite-chicken-crispy.html":"Elite","burger-aversa.html":"Aversa","burger-baba-yaga.html":"Baba-Yaga","burger-duplo-aversa.html":"Duplo Aversa"};
 function nutriHTML(p) {
  const k = KCAL[p.id]; if (!k) return '';
  const combo = /^Combos/.test(p.category);
  return `<div class="pd-nutri"><span class="pd-ing-h">Tabela nutricional</span><dl><div><dt>Porção</dt><dd>1 sanduíche</dd></div><div><dt>${combo ? 'Valor energético do sanduíche' : 'Valor energético'}</dt><dd>${k} kcal</dd></div></dl><p class="pd-nutri-note">Calorias estimadas por sanduíche, sem acompanhamentos ou adicionais; podem variar conforme os ingredientes e o preparo.</p>${PAGE[p.id]?`<a class="pd-more" href="${PAGE[p.id]}"><em>Conheça mais sobre</em> ${esc(PNAME[PAGE[p.id]]||'o lanche')} <span>↗︎</span></a>`:''}</div>`;
 }
 function renderFull() {
  const host = document.getElementById('full-menu'); if (!host) return;
  const CATS = [['Burgers Angus Premium','Burgers'],['Combos - Burger + Fritas + Bebida','Combos · burger + fritas + bebida'],['Acompanhamentos','Acompanhamentos'],['Bebidas','Bebidas'],['Doces & Sobremesas','Sobremesas']];
  host.innerHTML = CATS.map(([c, label]) => { const list = catalog.filter(p => p.category === c); if (!list.length) return '';
   return `<div class="fm-cat"><h4>${label}<span>${list.length}</span></h4><ul>${list.map(p => `<li><button type="button" data-mobile-product="${p.id}"><img src="${esc(p.image)}" alt="" loading="lazy" width="56" height="56"><span class="fm-txt"><b>${esc(shortName(p).replace(/\s*\|.*$/, ''))}</b><small>${esc(subName(p))}</small></span>${p.soldOut ? '<em>esgotado</em>' : ''}<i aria-hidden="true">↗</i></button></li>`).join('')}</ul></div>`; }).join('');
  const t = document.querySelector('.fm-toggle');
  if (t) t.addEventListener('click', () => { const open = host.hidden; host.hidden = !open; t.setAttribute('aria-expanded', String(open)); t.innerHTML = open ? 'Fechar cardápio completo <span>−</span>' : 'Ver cardápio completo <span>＋</span>'; });
 }
 function openProduct(p, button) {
  lastFocus = button;
  document.getElementById('mobile-dialog-content').innerHTML = `<img class="mobile-dialog-photo" src="${esc(p.image)}" alt="${esc(p.name)}"><div class="mobile-dialog-copy"><p class="eyebrow">${esc(p.category)}</p><h2 id="mobile-dialog-title" class="pd-title">${esc(shortName(p).replace(/\s*\|.*$/,""))}</h2><p class="pd-sub">${esc(subName(p))}</p>${descHTML(p)}${nutriHTML(p)}${p.soldOut?'<span class="mobile-soldout">Esgotado no cardápio na consulta</span>':''}<p class="pd-cta-title">Peça agora o seu</p><div class="access-actions pd-actions"><a class="ch ch-ifood" href="https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1" target="_blank" rel="noopener noreferrer"><span class="ch-tag">Super Restaurante</span><img class="ch-brand" src="assets/img/logo-ifood.jpg" alt="iFood" width="172" height="148"><span class="ch-label">peça pelo iFood</span></a></div></div>`;
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
   renderFull();
   if(location.hash==='#lanches')root.scrollIntoView({block:'start'});
   document.addEventListener('click', e => {const button=e.target.closest('[data-mobile-product]');if(!button)return;const p=catalog.find(p=>p.id===Number(button.dataset.mobileProduct));if(p)openProduct(p,button);});
   dialog.querySelector('.mobile-dialog-close').addEventListener('click',()=>dialog.close());
   dialog.addEventListener('close',()=>{document.body.style.overflow='';lastFocus?.focus({preventScroll:true});});
   dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  } catch {
   document.getElementById('mobile-catalog-products').innerHTML='<p>Confira todos os sabores no <a class="text-link" href="https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1" target="_blank" rel="noopener noreferrer">iFood ↗</a>.</p>';
  }
 }
 // Existing anchor links keep their original destination on desktop.
 document.addEventListener('click',e=>{if(!mobile.matches)return;const a=e.target.closest('a[href="#lanches"]');if(a){e.preventDefault();root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}});
 mobile.addEventListener('change',()=>{if(!mobile.matches&&dialog.open)dialog.close();init();});
 init();
})();
