// Monta o site da Hick's a partir do Claude Design.
// Uso: node ferramentas/montar-site.cjs
// Entradas (em ../fonte/):
//   "Hicks Burger - site.html"  export "bundle" da página principal (vira /portlink)
//   projeto/                    projeto original do zip "Hicks Burger app redesign.zip" (pasta original/):
//                               dá nome às imagens e scripts e traz História, Bastidores e Central.
// Gera portlink.html, historia.html, bastidores.html, central.html, assets/, sitemap.xml e ícones.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const FONTE = path.join(ROOT, '..', 'fonte');
const PROJETO = path.join(FONTE, 'projeto');
const SRC = path.resolve(process.argv[2] || path.join(FONTE, 'Hicks Burger - site.html'));
const html = fs.readFileSync(SRC, 'utf8');

const SITE = 'https://hicksburger.com.br';
const HOME = `${SITE}/portlink`;
// Páginas de SEO (burgers, guias, cardápio): conteúdo em conteudo-seo.cjs, moldes em paginas-seo.cjs.
const SEO = require('./paginas-seo.cjs');
const IFOOD = 'https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1';
const lerCatalogo = html => JSON.parse(html.split('<script id="mobile-catalog-data" type="application/json">')[1].split('</script>')[0]);
// Endereços absolutos (/assets/...) para as páginas em subpasta, como /burgers/baba-yaga.
const absolutizar = h => h
  .replace(/\b(src|href|data-src|poster)="(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g, '$1="/$2"')
  .replace(/\bsrcset="([^"]+)"/g, (_, v) => `srcset="${v.split(',').map(s => s.trim().replace(/^(?!https?:|\/)/, '/')).join(', ')}"`)
  .replace(/url\("(?!https?:|\/|data:)/g, 'url("/');
// Meses seguidos de Super Restaurante, como o contador da página (46 em outubro de 2026).
const agora = new Date();
const MESES_SUPER = 46 + (agora.getFullYear() - 2026) * 12 + (agora.getMonth() - 9);
const MES_ANO = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

const bloco = tipo => {
  const a = html.indexOf(`<script type="${tipo}">`);
  if (a < 0) throw new Error('bloco ausente: ' + tipo);
  const s = html.indexOf('>', a) + 1;
  return html.slice(s, html.indexOf('</script>', s));
};
const manifest = JSON.parse(bloco('__bundler/manifest'));
let page = JSON.parse(bloco('__bundler/template'));

const bytes = uuid => {
  const e = manifest[uuid];
  if (!e) throw new Error('uuid ausente no manifest: ' + uuid);
  const b = Buffer.from(e.data, 'base64');
  return e.compressed ? zlib.gunzipSync(b) : b;
};

// Limpa só o que este script gera.
fs.rmSync(path.join(ROOT, 'assets'), { recursive: true, force: true });
const salvar = (rel, buf) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, buf);
};

// Onde cada arquivo do projeto original é publicado.
const destino = rel => {
  if (rel.endsWith('.js')) return `assets/js/${path.basename(rel)}`;
  if (rel.startsWith('assets/clean/')) return rel.replace('assets/clean/', 'assets/cardapio/');
  if (rel.endsWith('.mp4')) return `assets/video/${path.basename(rel)}`;
  return rel.replace(/^assets\//, 'assets/img/');
};
// Reescreve caminhos do projeto original ("assets/x.png", "assets/clean/...") para os publicados.
const caminhos = s => s
  .split('assets/clean/').join('assets/cardapio/')
  .replace(/assets\/([\w-]+\.mp4)/g, 'assets/video/$1')
  .replace(/assets\/(?!cardapio\/|img\/|js\/|fonts\/|video\/|\$\{)/g, 'assets/img/');

// 1) Imagens, vídeo e scripts: cada arquivo do bundle é reconhecido pelo conteúdo, comparado com o
// projeto original. Os códigos internos do bundle mudam a cada export; o conteúdo não.
const md5 = b => crypto.createHash('md5').update(b).digest('hex');
// O empacotador acrescenta "const __R=..." e troca 'assets/x' por ${__R('assets/x')} nos scripts.
const normalJs = b => b.toString('utf8').replace(/\r/g, '').replace(/^const __R=.*\n/, '').replace(/\$\{__R\('([^']+)'\)\}/g, '$1');
const porConteudo = {};
const varrer = dir => {
  for (const f of fs.readdirSync(path.join(PROJETO, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${f.name}` : f.name;
    if (f.isDirectory()) { varrer(rel); continue; }
    if (!/\.(png|jpe?g|webp|mp4|js)$/i.test(f.name)) continue;
    const buf = fs.readFileSync(path.join(PROJETO, rel));
    porConteudo[md5(rel.endsWith('.js') ? normalJs(buf) : buf)] = rel;
    if (!rel.endsWith('.js')) salvar(destino(rel), buf); // publica todas as imagens do projeto
  }
};
varrer('');

const mapa = {}; // uuid -> caminho publicado
const scripts = {}; // caminho publicado -> código
const desconhecidos = [];
for (const uuid of Object.keys(manifest).filter(u => page.includes(u))) {
  if (/font/.test(manifest[uuid].mime)) continue; // passo 2
  const js = /javascript/.test(manifest[uuid].mime);
  const buf = js ? Buffer.from(normalJs(bytes(uuid))) : bytes(uuid);
  const rel = porConteudo[md5(buf)];
  if (!rel) { desconhecidos.push(`${uuid} (${manifest[uuid].mime})`); continue; }
  mapa[uuid] = destino(rel);
  if (rel.endsWith('.js')) scripts[mapa[uuid]] = buf.toString('utf8');
}
if (desconhecidos.length) throw new Error('arquivos do bundle que não estão em fonte/projeto/ (exporte o zip de novo): ' + desconhecidos.join(', '));

// 2) Fontes: nomeia pelo @font-face (família, peso, subset).
const reFace = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
let m;
while ((m = reFace.exec(page))) {
  const corpo = m[2];
  const fam = /font-family:\s*'([^']+)'/.exec(corpo)[1].toLowerCase().replace(/\s+/g, '-');
  const peso = /font-weight:\s*(\d+)/.exec(corpo)[1];
  const estilo = /font-style:\s*italic/.test(corpo) ? '-italic' : '';
  const uuid = /url\("([0-9a-f-]{36})"\)/.exec(corpo)[1];
  const rel = `assets/fonts/${fam}-${peso}${estilo}-${m[1]}.woff2`;
  if (!mapa[uuid]) { salvar(rel, bytes(uuid)); mapa[uuid] = rel; }
}

// 3) Scripts, com os ajustes de velocidade e navegação.
// Cada foto do cardápio sai em 480, 800 e 1100 px (passo 6); __S monta o srcset de uma delas.
const LARGURAS = [480, 800];
const srcset = u => LARGURAS.map(w => `${u.replace('.webp', `-${w}.webp`)} ${w}w`).concat(`${u} 1100w`).join(', ');
const SRCSET_JS = `var __S=u=>[${LARGURAS}].map(w=>u.replace('.webp','-'+w+'.webp')+' '+w+'w').concat(u+' 1100w').join(', ');\n`;
const trocar = (js, nome, antes, depois) => {
  if (!js.includes(antes)) throw new Error(`trecho não encontrado em ${nome}: ${antes}`);
  return js.split(antes).join(depois);
};
// Seta ↗ e © em versão texto (o iOS 18 desenha ↗ como emoji).
const fe0 = s => s.replace(/([↗©])(?!︎)/g, '$1︎');

// A marca é sempre masculina: "o Hicks", "do Hicks", "no Hicks" (decisão do Neto, 18/10/2026).
// Vale para o nome escrito e para o logo em imagem (hk-word) logo depois do artigo.
const MARCA = String.raw`(?:Hick[’']?s|HICK[’']?S|<img class="hk-word"[^>]*>)`;
const ARTIGOS = { a: 'o', da: 'do', na: 'no', pela: 'pelo', 'à': 'ao' };
const reArtigo = new RegExp(String.raw`(^|[^\wÀ-ÿ])(a|da|na|pela|à)(\s+)(?=${MARCA})`, 'gi');
const masculino = s => s
  .replace(reArtigo, (_, antes, art, esp) => {
    const novo = ARTIGOS[art.toLowerCase()];
    const caixa = art === art.toUpperCase() && art !== art.toLowerCase() ? novo.toUpperCase()
      : art[0] === art[0].toUpperCase() && art[0] !== art[0].toLowerCase() ? novo[0].toUpperCase() + novo.slice(1) : novo;
    return antes + caixa + esp;
  })
  .replace(/Nascida(\s+no\s+quintal\.(?:\s|<br>)*)Feita(\s+pra\s+ser)/g, 'Nascido$1Feito$2');
const conferirMasculino = (s, onde) => {
  if (/segue o (<em>|<span[^>]*>)?bulldog/i.test(s)) throw new Error(`"Segue o Bulldog" voltou em ${onde}`);
  const sobra = s.match(new RegExp(String.raw`(?:^|[^\wÀ-ÿ])(?:a|da|na|pela|à)\s+${MARCA}|Nascida no quintal|Feita pra ser daqui`, 'gi'));
  if (sobra) throw new Error(`marca no feminino em ${onde}: ${sobra.slice(0, 3).join(' | ')}`);
  return s;
};
// "Segue o Bulldog" não existe mais (pedido do Neto, 19/10/2026): vira "Segue o Hicks" em todo lugar
// (rodapé, faixa, História, link do Instagram), mantendo a caixa e a marcação de destaque.
const rodape = s => s.replace(/(segue o )(<em>|<span class="hk-font">)?bulldog/gi,
  (_, a, tag) => a + (tag || '') + (a === a.toUpperCase() ? 'HICKS' : 'Hicks'));
const fe = s => fe0(rodape(masculino(s)));

// Pinterest ao lado do Instagram no topo (pedido do Neto, 19/10/2026), mesmo botão redondo (.nav-ig).
const PINTEREST = 'https://br.pinterest.com/hicks_br/';
const botaoPinterest = `<a class="nav-ig nav-pin" href="${PINTEREST}" target="_blank" rel="noopener noreferrer" aria-label="Pinterest do Hicks — hicks_br">` +
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg></a>';
const comPinterest = (s, onde) => {
  const re = /(<div class="header-actions">[\s\S]*?<\/a>)(<\/div>)/;
  if (!re.test(s)) throw new Error('topo sem header-actions em ' + onde);
  return s.replace(re, `$1${botaoPinterest}$2`);
};

for (const [rel, original] of Object.entries(scripts)) {
  let js = original;
  const nome = path.basename(rel);
  if (nome === 'app.js') {
    // Lanches do desktop: foto do cardápio (webp 1100 px) no lugar do burger-0X.jpg de 384 px, com srcset.
    js = trocar(js, nome, '<img src="assets/${p.img}" alt="${p.sub} da Hick’s Burger"',
      '<img src="assets/cardapio/${p.id}.webp" srcset="${__S(\'assets/cardapio/\'+p.id+\'.webp\')}" sizes="(max-width:650px) 100vw, 40vw" alt="${p.sub} da Hick’s Burger"');
    js = js.split('<img src="assets/${p.img}" alt="${p.sub}">')
      .join('<img src="assets/cardapio/${p.id}.webp" srcset="${__S(\'assets/cardapio/\'+p.id+\'.webp\')}" sizes="(max-width:650px) 100vw, 400px" alt="${p.sub}">');
    js = SRCSET_JS + js;
  }
  if (nome === 'intro.js') {
    // Quem chega de outra página com destino (ex.: /portlink#proximo-pedido) vai direto à seção, sem a abertura.
    js = trocar(js, nome, '(() => {', `(() => {
  const alvo = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (alvo) {
    document.getElementById('hk-intro')?.remove();
    addEventListener('load', () => alvo.scrollIntoView(), { once: true });
    return;
  }`);
  }
  if (nome === 'mobile-catalog.js') {
    const comSrcset = (antes, sizes) => { js = trocar(js, nome, antes, antes.replace('<img ', `<img srcset="\${__S(p.image)}" sizes="${sizes}" `)); };
    comSrcset('<img src="${esc(p.image)}" alt="${esc(p.name)} — foto', '90vw');
    comSrcset('<img src="${esc(p.image)}" alt="${esc(p.name)}" draggable', '70vw');
    comSrcset('<img class="mobile-dialog-photo" src="${esc(p.image)}"', '100vw');
    js = js.split('`<img src="${esc(p.image)}" alt="" loading="lazy">`').join('`<img src="${esc(p.image.replace(\'.webp\', \'-160.webp\'))}" alt="" loading="lazy" width="40" height="40">`');
    // "Qual vai ser hoje?": tabela nutricional do lanche escolhido, logo antes de "Ver lanche".
    // Os dados vêm de <script id="hk-nutri" type="application/json"> (montado no passo 4).
    js = trocar(js, nome, '<span class="cf-price"></span><button type="button" class="cf-open">',
      '<span class="cf-price"></span><details class="cf-nutri"><summary>Tabela nutricional</summary><div class="cf-nutri-corpo"></div></details><button type="button" class="cf-open">');
    js = trocar(js, nome, "   priceEl.innerHTML = '';\n", "   priceEl.innerHTML = '';\n   hkNutri(root, p);\n");
    // Prévia da tabela nutricional (informação do Hicks): porção, calorias e os principais nutrientes,
    // com link para a tabela completa na página do burger. Usada no carrossel e na ficha "Ver lanche".
    js = `var hkNutriDados=(function(){var d=null;return function(){if(!d){try{d=JSON.parse(document.getElementById('hk-nutri').textContent)}catch(e){d={}}}return d}})();
var hkNutriCorpo=function(n){
 var linha=function(a,b){return '<div><dt>'+a+'</dt><dd>'+b+'</dd></div>'};
 return '<dl>'+linha('Porção',n.porcao)+linha(n.combo?'Valor energético do lanche':'Valor energético',n.k+' <small>'+n.vd+' VD</small>')+n.linhas.map(function(l){return linha(l[0],l[1])}).join('')+'</dl>'+
  (n.url?'<a class="cf-nutri-mais" href="'+n.url+'">Tabela completa <span>↗︎</span></a>':'')+'<p>'+(n.ap?'Valores aproximados. ':'')+(n.ref?'Porção de referência do fabricante. ':'')+'Informação nutricional fornecida pelo Hicks.</p>';
};
var hkNutri=function(root,p){var box=root.querySelector('.cf-nutri');if(!box)return;var n=hkNutriDados()[p.id];
 if(!n){box.hidden=true;return}box.hidden=false;box.querySelector('.cf-nutri-corpo').innerHTML=hkNutriCorpo(n);};
` + js;
    // Ficha "Ver lanche": a tabela do design (estimativa de calorias) dá lugar à informação do Hicks.
    const reFicha = /function nutriHTML\(p\) \{[\s\S]*?\n \}\n/;
    if (!reFicha.test(js)) throw new Error('nutriHTML mudou em mobile-catalog.js');
    js = js.replace(reFicha, `function nutriHTML(p) {
  const n = hkNutriDados()[p.id]; if (!n) return '';
  return '<div class="pd-nutri"><span class="pd-ing-h">Tabela nutricional</span>' + hkNutriCorpo(n) + '</div>';
 }
`);
    js = trocar(js, nome, "let out = '';", "let out = p.destaque ? `<p class=\"pd-blurb\">${esc(p.destaque)}</p>` : '';");
    js = js.split('<img class="rv-bg" src="${esc(cover(g))}"').join('<img class="rv-bg" src="${esc(cover(g).replace(\'.webp\', \'-800.webp\'))}" loading="lazy"');
    // O carrossel do celular só é montado quando a pessoa começa a rolar (tirava ~0,5 s do carregamento).
    const fim = /\n init\(\);\r?\n\}\)\(\);\s*$/;
    if (!fim.test(js)) throw new Error('fim de mobile-catalog.js mudou');
    js = SRCSET_JS + js.replace(fim, `
 const kick = () => { removeEventListener('scroll', kick); removeEventListener('touchstart', kick); init(); };
 addEventListener('scroll', kick, { passive: true }); addEventListener('touchstart', kick, { passive: true });
 if ('IntersectionObserver' in window) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); kick(); } }); o.observe(root); } else init();
})();
`);
  }
  salvar(rel, conferirMasculino(fe(caminhos(js)), rel));
}

// 4) Página principal.
for (const [u, rel] of Object.entries(mapa)) page = page.split(u).join(rel);

// Ajustes de texto do cardápio (pedidos do Neto). Só fatos do cardápio oficial: 100 g de peito de
// frango empanado, maionese defumada artesanal, alface. O nome "Kentucky | Frango Crocante" faz o
// subtítulo virar "Frango Crocante" (sem o "|" a página mostrava "Angus Premium no pão brioche").
const FRANGO_KENTUCKY = 'O frango é a estrela: peito de frango de 100 g, empanado até ficar dourado e crocante por fora e macio por dentro.';
const CARDAPIO_AJUSTES = {
  // Subtítulo "Chicken Salad Supreme" (pedido do Neto, 19/10/2026); antes caía em "Angus Premium no pão brioche".
  2108702: { name: 'Chicken Salad | Chicken Salad Supreme' },
  5101889: { name: 'Quarterão Angus Premium | Releitura do Clássico do Méqui' },
  2108709: { name: 'Cheese Salada | Releitura Shake Shack' },
  2108708: { name: 'Cheese Burger | Pão, carne e queijo' },
  2108710: {
    name: 'Kentucky | Frango Crocante',
    destaque: FRANGO_KENTUCKY,
    description: 'Peito de frango empanado de 100 g\nMaionese defumada artesanal\nAlface\n\n' +
      FRANGO_KENTUCKY + ' A maionese defumada artesanal e a alface fresca completam um burger simples e bem feito.',
  },
  2108456: {
    destaque: FRANGO_KENTUCKY,
    description: 'Peito de frango empanado de 100 g\nMaionese defumada artesanal\nAlface\nFritas\nBebida de sua escolha\n\n' +
      FRANGO_KENTUCKY + ' Com maionese defumada artesanal e alface fresca, acompanhado de fritas e bebida à sua escolha.',
  },
};
{
  const tag = '<script id="mobile-catalog-data" type="application/json">';
  const [antes, resto] = page.split(tag);
  const fim = resto.indexOf('</script>');
  const cat = JSON.parse(resto.slice(0, fim));
  for (const [id, ajuste] of Object.entries(CARDAPIO_AJUSTES)) {
    const item = cat.find(p => p.id === Number(id));
    if (!item) throw new Error(`item ${id} sumiu do cardápio: revise CARDAPIO_AJUSTES`);
    Object.assign(item, ajuste);
  }
  page = antes + tag + JSON.stringify(cat).replace(/</g, '\\u003c') + resto.slice(fim);
}
page = caminhos(page);
// Fontes servidas do próprio domínio: sem preconnect ao Google.
page = page.replace(/<link rel="preconnect"[^>]*>/g, '');
// Fotos do cardápio no celular (hero e "qual vai ser hoje?") com versões menores.
page = page.replace(/<source media="\(max-width:650px\)" srcset="(assets\/cardapio\/\d+\.webp)">(<img class="hero-burger")?/g,
  (_, u, hero) => `<source media="(max-width:650px)" srcset="${srcset(u)}" sizes="${hero ? '115vw' : '45vw'}">${hero || ''}`);
// O shim do bundle (window.__resources) não é mais necessário.
page = page.replace(/<script>\(function\(\)\{var R=window\.__resources[\s\S]*?<\/script>/, '');

// A página principal mora em /portlink; as internas em /historia, /bastidores e /central.
const links = s => s.split('href="index.html#').join('href="/portlink#').split('href="index.html"').join('href="/portlink"')
  .split('href="historia.html"').join('href="/historia"')
  .split('href="bastidores.html"').join('href="/bastidores"')
  .split('href="central.html"').join('href="/central"');
page = comPinterest(fe(links(page)), 'portlink');

// Educar antes de pedir (decisão do Neto, 19/10/2026): ao longo da página, os botões levam a conteúdo
// (burgers, guias, bastidores). O pedido no iFood fica no fim: depois de "Conheça cada burger", no FAQ e no rodapé.
{
  const troca = (antes, depois, onde) => {
    if (!antes.test(page)) throw new Error(`educar antes de pedir: trecho não encontrado (${onde})`);
    page = page.replace(antes, depois);
  };
  const ifood = 'href="https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1" target="_blank" rel="noopener noreferrer"';
  const reIfood = ifood.replace(/[.?*+^$()[\]{}|\\/]/g, '\\$&');
  // Abertura: "Pedir agora" → conhecer os burgers.
  troca(new RegExp(`<a class="button light hero-order-btn" ${reIfood}>Pedir agora <span>↗︎</span></a>`),
    '<a class="button light hero-order-btn" href="#burgers">Conheça os burgers <span>↓</span></a>', 'abertura');
  // "Sua fome tem endereço": botão do iFood → como funciona a entrega.
  troca(new RegExp(`(<section id="acesso"[\\s\\S]*?)<a class="ch ch-ifood" ${reIfood}>[\\s\\S]*?</a>`),
    '$1<a class="button light" href="/hamburgueria-aberta-a-noite-campinas">Como funciona a entrega <span>↗︎</span></a>', 'sua fome tem endereço');
  // Reconhecimento: por que o Hicks é Super Restaurante.
  troca(/(<section[^>]*id="reconhecimento"[\s\S]*?)(<\/div><\/section>)/,
    '$1<a class="text-link sx-edu" href="/super-restaurante-ifood">Por que somos Super Restaurante <span>↗︎</span></a>$2', 'reconhecimento');
  // Principais lanches (desktop): "Cardápio completo" → o nosso cardápio.
  troca(new RegExp(`<a class="text-link" ${reIfood}>Cardápio completo ↗︎</a>`),
    '<a class="text-link" href="/cardapio">Cardápio completo ↗︎</a>', 'principais lanches');
  // Qual vai ser hoje?: botão do iFood → guia de escolha; cartões → páginas dos burgers e combos.
  troca(new RegExp(`(<div class="next-cta"><div class="access-actions">)<a class="ch ch-ifood" ${reIfood}>[\\s\\S]*?</a>`),
    '$1<a class="button light" href="/qual-hamburguer-escolher">Qual burger escolher? <span>↗︎</span></a>', 'qual vai ser hoje (botão)');
  const cartoes = [['Conheça o Duplo Aversa', '/burgers/duplo-aversa', null], ['Confira as ofertas do momento', '/cardapio#combos', 'Conheça os combos'], ['Explore o Baba-Yaga', '/burgers/baba-yaga', null]];
  for (const [texto, href, novo] of cartoes) {
    troca(new RegExp(`<a class="choice-card" ${reIfood}>([\\s\\S]*?)<span>${texto} ↗︎</span>`),
      `<a class="choice-card" href="${href}">$1<span>${novo || texto} ↗︎</span>`, 'cartão ' + texto);
  }
  // Cozinha: os bastidores.
  page = page.replace(/(<div class="kitchen-(?:head|copy)">[\s\S]*?<\/p>)(<\/div>)/g,
    '$1<a class="text-link sx-edu" href="/bastidores">Ver os bastidores <span>↗︎</span></a>$2');
  if ((page.match(/href="\/bastidores">Ver os bastidores/g) || []).length < 1) throw new Error('educar antes de pedir: cozinha');
}

// Título e descrição (Google, WhatsApp e redes). Só fatos: Angus e frango crocante, pão brioche,
// Super Restaurante iFood, pedido pelo iFood, 18h às 23h. Sem o número de meses (o contador muda).
const TITULO_HOME = 'Hick’s Burger — Hamburgueria em Campinas';
const DESC_HOME = 'Hamburgueria em Campinas, só delivery: burgers autorais de Angus e frango crocante no pão brioche. Super Restaurante iFood. Peça pelo iFood, das 18h às 23h.';
const DESC_COMPARTILHAR = 'Burgers autorais de Angus e frango crocante, com entrega em Campinas. Super Restaurante iFood. Peça pelo iFood.';
const trocarMeta = (s, re, novo, nome) => { if (!re.test(s)) throw new Error('meta ausente: ' + nome); return s.replace(re, novo); };
page = trocarMeta(page, /<title>[^<]*<\/title>/, `<title>${TITULO_HOME}</title>`, 'title');
page = trocarMeta(page, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${DESC_HOME}">`, 'description');
page = trocarMeta(page, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${TITULO_HOME}">`, 'og:title');
page = trocarMeta(page, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${DESC_COMPARTILHAR}">`, 'og:description');

// Cabeçalho: ícones (monograma H), endereço oficial, Open Graph e preload da fonte de título.
page = page.replace(/<link rel="icon"[^>]*>/,
  '<link rel="icon" href="/favicon.ico" sizes="48x48">' +
  '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">' +
  '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">' +
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">' +
  `<link rel="canonical" href="${HOME}">` +
  `<meta property="og:url" content="${HOME}"><meta property="og:image" content="${SITE}/og.jpg">` +
  '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' +
  '<meta property="og:locale" content="pt_BR"><meta name="twitter:card" content="summary_large_image">' +
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="' +
  Object.values(mapa).find(r => /barlow-condensed-\d+-latin\.woff2$/.test(r)) + '">');
if (!page.includes(`<link rel="canonical" href="${HOME}">`)) throw new Error('favicon/canonical não aplicados');

// Poppins da assinatura: recorte só com as letras de "by portlink" (1 KB cada), servido daqui.
for (const peso of [300, 700]) {
  salvar(`assets/fonts/poppins-${peso}-portlink.woff2`, fs.readFileSync(path.join(__dirname, 'recursos', `poppins-${peso}-portlink.woff2`)));
}

// Assinatura "by portlink" como último elemento do rodapé.
const assinatura =
  '<div class="portlink-wrap"><a href="https://useportlink.com" target="_blank" rel="noopener" aria-label="by portlink" class="portlink-sign">' +
  '<span class="portlink-by">by</span>' +
  '<span class="portlink-word"><span class="portlink-port">port</span><span class="portlink-link">link</span></span></a></div>';
page = page.replace('</footer>', SEO.RODAPE_LINKS + assinatura + '</footer>');

// Região atendida, logo abaixo de "Sua fome tem endereço" (pedido do Neto, 19/10/2026).
// Bairro: o do cadastro do Hicks no iFood (endereço da loja: .../campinas-sp/hicks--burger-vila-boa-vista/...).
const REGIAO = `<div class="sx-regiao" aria-labelledby="regiao-titulo"><p class="eyebrow" id="regiao-titulo">REGIÃO ATENDIDA</p><dl>
<div><dt>Cidade</dt><dd>Campinas, SP</dd></div>
<div><dt>Bairro</dt><dd>Vila Boa Vista<small>base de delivery do Hicks</small></dd></div>
<div><dt>Horário</dt><dd>Quarta a segunda, 18h às 23h<small>terça fechado</small></dd></div>
</dl><p class="sx-regiao-nota">Só delivery. Informe o seu endereço no iFood para confirmar a entrega na sua região.</p></div>`;
if (!/(<section id="acesso"[\s\S]*?)(<\/section>)/.test(page)) throw new Error('seção "Sua fome tem endereço" não encontrada');
page = page.replace(/(<section id="acesso"[\s\S]*?)(<\/section>)/, `$1${REGIAO}$2`);

// Seção nova antes das perguntas frequentes: um cartão por burger e o menu suspenso da tabela nutricional.
if (!/<section[^>]*id="informacoes"/.test(page)) throw new Error('seção de informações não encontrada na página principal');
page = page.replace(/<section[^>]*id="informacoes"/, m => SEO.secaoHome({ catalogo: lerCatalogo(page), IFOOD }) + m);
{ // Nenhum link para o iFood antes de "Conheça cada burger" (fora dos dados escondidos em <script>).
  const ate = page.slice(page.indexOf('<body'), page.indexOf('id="burgers"')).replace(/<script\b[\s\S]*?<\/script>/g, '');
  const n = (ate.match(/href="https:\/\/www\.ifood\.com\.br/g) || []).length;
  if (n) throw new Error(`educar antes de pedir: ainda há ${n} link(s) do iFood antes de "Conheça cada burger"`);
}
page = page.replace('</head>', `<style>${SEO.CSS}</style></head>`);
// Dados da tabela nutricional do carrossel "Qual vai ser hoje?" (burgers e os combos de cada um).
const nutri = {};
{ // Informação nutricional do Hicks (ferramentas/nutricao.cjs) para a prévia do carrossel e da ficha.
  const { NUTRI } = require('./nutricao.cjs');
  const PREVIA = [['prot', 'Proteínas'], ['carb', 'Carboidratos'], ['gord', 'Gorduras totais'], ['sodio', 'Sódio']];
  const previa = (id, extra) => { const t = NUTRI[id]; if (!t) return;
    nutri[id] = { k: `${t.kcal.toLocaleString('pt-BR')} kcal`, vd: t.kcalVD, porcao: t.porcao, ap: t.aprox || undefined, ref: t.ref || undefined,
      linhas: PREVIA.filter(([k]) => t.n[k]).map(([k, r]) => [r, t.n[k][0]]), ...extra }; };
  for (const b of SEO.BURGERS) {
    previa(b.id, { url: `/burgers/${b.slug}` });
    if (b.combo && nutri[b.id]) nutri[b.combo] = { ...nutri[b.id], combo: true }; // o combo mostra os dados do lanche
  }
  for (const id of Object.keys(NUTRI)) if (!nutri[id]) previa(id); // acompanhamentos
}
page = page.replace('</body>', `<script id="hk-nutri" type="application/json">${JSON.stringify(nutri).replace(/</g, '\\u003c')}</script></body>`);
page = page.replace('</head>', `<style>
/* FAQ: só o ícone + gira ao abrir, não a pergunta. */
.faq details[open] summary .faq-q{transform:none!important}
@font-face{font-family:'Poppins';font-style:normal;font-weight:300;font-display:swap;src:url("assets/fonts/poppins-300-portlink.woff2") format('woff2')}
@font-face{font-family:'Poppins';font-style:normal;font-weight:700;font-display:swap;src:url("assets/fonts/poppins-700-portlink.woff2") format('woff2')}
.portlink-wrap{text-align:center;margin-top:18px}
.portlink-sign{display:inline-flex;align-items:baseline;gap:5px;text-decoration:none;font-family:'Poppins',sans-serif;transition:color .2s ease;padding-bottom:8px;color:rgba(244,244,240,.6)}
.portlink-sign:hover,.portlink-sign:focus-visible{color:#F4F4F0}
.portlink-by{font-size:12px;font-weight:300}
.portlink-word{font-size:14px;letter-spacing:.01em;white-space:nowrap}
.portlink-port{font-weight:300}.portlink-link{font-weight:700}
@media(max-width:650px){.portlink-wrap{padding-bottom:70px}}
</style></head>`);

// Dados estruturados (Schema.org): o restaurante e as perguntas frequentes.
const texto = s => s.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, '$1').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const faq = [...page.matchAll(/<details><summary><span class="faq-q">([\s\S]*?)<\/span>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/g)]
  .map(([, q, r]) => {
    // Resposta sem os botões (ex.: "peça pelo iFood") e com espaço entre blocos.
    const so = r.replace(/<div class="access-actions[\s\S]*?<\/div>/g, '').replace(/<a\b[^>]*class="ch [\s\S]*?<\/a>/g, '')
      .replace(/<\/(p|li|strong|b|div)>/g, ' ');
    return { '@type': 'Question', name: texto(q), acceptedAnswer: { '@type': 'Answer', text: texto(so).replace(/\s+([.,:;])/g, '$1') } };
  });
// Horário informado ao Google: confere com o que a página mostra, para não publicar dado velho.
const HORARIO_PAGINA = 'Quarta a segunda 18h — 23h Terça-feira Fechado';
// Fonte oficial: a tabela de horários do rodapé (class "footer-hours").
const horario = texto((page.match(/class="[^"]*footer-hours[^"]*"[\s\S]*?(<dl>[\s\S]*?<\/dl>)/) || ['', ''])[1].replace(/<\/(dt|dd)>/g, ' '));
if (horario !== HORARIO_PAGINA) throw new Error(`horário da página mudou ("${horario}"): atualize openingHoursSpecification e HORARIO_PAGINA`);
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': `${SITE}/#site`, url: HOME, name: 'Hick’s Burger', inLanguage: 'pt-BR', publisher: { '@id': `${HOME}#restaurante` } },
    {
      '@type': 'Restaurant',
      '@id': `${HOME}#restaurante`,
      name: 'Hick’s Burger',
      description: 'Burger autoral em Campinas, só delivery. Peça pelo iFood.',
      url: HOME,
      logo: `${SITE}/assets/img/hicks-word.png`,
      image: `${SITE}/og.jpg`,
      servesCuisine: ['Hambúrguer', 'Hot dog'],
      taxID: '36.635.421/0001-36',
      address: { '@type': 'PostalAddress', addressLocality: 'Campinas', addressRegion: 'SP', addressCountry: 'BR' },
      areaServed: { '@type': 'City', name: 'Campinas' },
      hasMenu: `${SITE}/cardapio`,
      potentialAction: { '@type': 'OrderAction', target: { '@type': 'EntryPoint', urlTemplate: IFOOD, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] } },
      acceptsReservations: false,
      sameAs: ['https://www.instagram.com/hicks_br/', PINTEREST, IFOOD],
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'], opens: '18:00', closes: '23:00' },
      ],
      award: ['Super Restaurante iFood 2025', 'Prêmio Hambúrguer Perfeito, Top 10 Campinas'],
    },
    { '@type': 'FAQPage', '@id': `${HOME}#perguntas`, mainEntity: faq },
  ],
};
page = page.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>`);

fs.rmSync(path.join(ROOT, 'index.html'), { force: true }); // a raiz redireciona para /portlink (vercel.json)
fs.writeFileSync(path.join(ROOT, 'portlink.html'), conferirMasculino(page, 'portlink.html'));

// 5) Páginas internas: História, Bastidores e Central, do projeto original. Usam o mesmo cabeçalho da
// página principal (estilos, fontes, assinatura) e só o script de animações de rolagem.
// Descrições próprias (a do projeto da Central ainda citava Cardápio Web e 99).
const DESC_PAGINAS = {
  central: 'Onde pedir o Hicks em Campinas: peça pelo iFood, de quarta a segunda, das 18h às 23h. Acompanhe também o Instagram @hicks_br.',
};
const cabeca = page.slice(0, page.indexOf('<body')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const paginas = [];
for (const nome of ['historia', 'bastidores', 'central']) {
  const src = fs.readFileSync(path.join(PROJETO, `${nome}.html`), 'utf8');
  const titulo = masculino(/<title>([^<]*)<\/title>/.exec(src)[1]);
  const desc = DESC_PAGINAS[nome] || masculino(/<meta name="description" content="([^"]*)"/.exec(src)[1]);
  const url = `${SITE}/${nome}`;
  const head = cabeca
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(desc)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${attr(titulo)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${attr(desc)}"`)
    .replace(`<link rel="canonical" href="${HOME}">`, `<link rel="canonical" href="${url}">`)
    .replace(`<meta property="og:url" content="${HOME}">`, `<meta property="og:url" content="${url}">`);
  if (!head.includes(`<link rel="canonical" href="${url}">`)) throw new Error('canonical não trocado em ' + nome);
  let corpo = comPinterest(fe(links(caminhos(src.slice(src.indexOf('<body'))))), nome);
  const faltando = [...corpo.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(x => x[1]).filter(r => !fs.existsSync(path.join(ROOT, r)));
  if (faltando.length) throw new Error(`arquivo inexistente em ${nome}: ${faltando.join(', ')}`);
  corpo = corpo.split('href="/portlink#lanches"').join('href="/cardapio"') // "Os lanches" leva ao cardápio completo
    .replace('</footer>', SEO.RODAPE_LINKS + assinatura + '</footer>')
    .replace('</body>', '<script src="assets/js/scroll-motion.js" defer></script></body>');
  // Dados estruturados: página do site, ligada ao restaurante, com a trilha Início › página.
  const ldPagina = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: titulo, description: desc, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, about: { '@id': `${HOME}#restaurante` }, breadcrumb: { '@id': `${url}#trilha` } },
    { '@type': 'BreadcrumbList', '@id': `${url}#trilha`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: HOME },
      { '@type': 'ListItem', position: 2, name: titulo.replace(/ — .*$/, '') },
    ] },
  ] };
  const headLd = head.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ldPagina).replace(/</g, '\\u003c')}</script></head>`);
  fs.writeFileSync(path.join(ROOT, `${nome}.html`), conferirMasculino(headLd + corpo, `${nome}.html`));
  paginas.push(nome);
}

// 5b) Páginas de SEO: uma por burger, os guias de decisão e o cardápio completo em texto.
// Cabeçalho, rodapé e barra do celular vêm da página História já montada (mesma identidade).
const historiaHtml = fs.readFileSync(path.join(ROOT, 'historia.html'), 'utf8');
const pedaco = re => { const m = historiaHtml.match(re); if (!m) throw new Error('pedaço da página História não encontrado: ' + re); return m[0]; };
const botaoIfood = `<div class="access-actions"><a class="ch ch-ifood" href="${IFOOD}" target="_blank" rel="noopener noreferrer"><span class="ch-tag">Super Restaurante</span><img class="ch-brand" src="/assets/img/logo-ifood.jpg" alt="iFood" width="172" height="148"><span class="ch-label">peça pelo iFood</span></a></div>`;
// Nomes curtos do cardápio (ex.: "Combo Baba-Yaga"), do mapa "names" do mobile-catalog.js.
const NOMES_CURTOS = JSON.parse(/const names = (\{[^}]*\})/.exec(scripts['assets/js/mobile-catalog.js'])[1].replace(/(\d+):'([^']*)'/g, '"$1":"$2"'));
// Imagens de topo dos guias e do cardápio: fonte/imagens/<slug>.jpg|png|webp (geradas à parte, ilustrativas).
const IMAGENS = path.join(FONTE, 'imagens');
const imagensGuias = new Map();
if (fs.existsSync(IMAGENS)) for (const f of fs.readdirSync(IMAGENS)) {
  const m = /^([a-z0-9-]+)\.(jpe?g|png|webp)$/i.exec(f);
  if (m && (m[1] === 'cardapio' || SEO.GUIAS.some(g => g.slug === m[1]))) imagensGuias.set(m[1], path.join(IMAGENS, f));
}
const paginasSeo = SEO.gerarPaginas({
  SITE, HOME, IFOOD, catalogo: lerCatalogo(page), meses: MESES_SUPER, mesAno: MES_ANO,
  nomesCurtos: NOMES_CURTOS, imagensGuias: new Set(imagensGuias.keys()),
  cabeca, header: pedaco(/<header class="header"[\s\S]*?<\/header>/), footer: pedaco(/<footer[\s\S]*?<\/footer>/),
  mobileOrder: pedaco(/<div class="mobile-order">[\s\S]*?<\/div>/), botaoIfood, absolutizar,
});
fs.rmSync(path.join(ROOT, 'burgers'), { recursive: true, force: true });
for (const g of SEO.GUIAS) fs.rmSync(path.join(ROOT, `${g.slug}.html`), { force: true });
// Endereços antigos dos guias (renomeados em 19/10/2026, nunca publicados).
for (const velho of ['hamburguer-angus', 'horarios-e-entrega']) fs.rmSync(path.join(ROOT, `${velho}.html`), { force: true });
for (const p of paginasSeo) {
  const html = conferirMasculino(fe0(p.html), p.rel);
  const faltando = [...html.matchAll(/(?:src|href)="\/((?:assets|burgers)\/[^"#?]+)"/g)].map(x => x[1])
    .filter(r => !r.startsWith('assets/burgers/') && !r.startsWith('assets/guias/') && !/^assets\/cardapio\/\d+-(160|480|800)\.webp$/.test(r) &&!fs.existsSync(path.join(ROOT, r)) && !fs.existsSync(path.join(ROOT, r + '.html')) && !paginasSeo.some(q => q.rel === r + '.html'));
  if (faltando.length) throw new Error(`link ou arquivo inexistente em ${p.rel}: ${[...new Set(faltando)].join(', ')}`);
  salvar(p.rel, html);
}
// Mapa do site (com as fotos dos burgers) e regras para robôs: tudo liberado, inclusive os das IAs.
const hoje = new Date().toISOString().slice(0, 10);
const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const entradas = [
  { url: HOME, prio: '1.0' },
  ...paginasSeo.filter(p => p.rel === 'cardapio.html').map(p => ({ url: p.url, prio: '0.9' })),
  ...paginasSeo.filter(p => p.rel.startsWith('burgers/')).map(p => ({ url: p.url, prio: '0.8', imagem: p.imagem })),
  ...paginasSeo.filter(p => !p.rel.startsWith('burgers/') && p.rel !== 'cardapio.html').map(p => ({ url: p.url, prio: '0.7' })),
  ...paginas.map(p => ({ url: `${SITE}/${p}`, prio: '0.5' })),
];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entradas.map(e => `  <url><loc>${e.url}</loc><lastmod>${hoje}</lastmod><priority>${e.prio}</priority>${e.imagem ? `<image:image><image:loc>${e.imagem.loc}</image:loc><image:title>${xml(e.imagem.titulo)}</image:title><image:caption>${xml(e.imagem.legenda)}</image:caption></image:image>` : ''}</url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /

# Buscadores de IA também são bem-vindos (o Hicks quer ser citado nas respostas).
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

// llms.txt: resumo do Hicks escrito para IAs (ChatGPT, Perplexity, Claude), com os fatos e os endereços certos.
const { NUTRI } = require('./nutricao.cjs');
const kcalTxt = b => NUTRI[b.id] ? ` ${NUTRI[b.id].kcal.toLocaleString('pt-BR')} kcal e ${NUTRI[b.id].n.prot[0]} de proteínas por lanche (${NUTRI[b.id].porcao.replace(/^1 lanche \((.*)\)$/, '$1')}).` : '';
fs.writeFileSync(path.join(ROOT, 'llms.txt'), `# Hick’s Burger (o Hicks)

> Hamburgueria em Campinas (SP), só delivery. Burgers autorais de carne Angus e de frango crocante no pão brioche. Pedidos exclusivamente pelo iFood, de quarta a segunda, das 18h às 23h (terça fechado). Super Restaurante iFood há ${MESES_SUPER} meses seguidos (contagem de ${MES_ANO}).

## Fatos
- Nome: Hick’s Burger, chamado de "o Hicks". CNPJ 36.635.421/0001-36.
- Cidade: Campinas, SP. Base de delivery na Vila Boa Vista. Não há consumo nem retirada no local.
- Como pedir: iFood (${IFOOD}). A área de entrega aparece no iFood ao informar o endereço.
- Horário: quarta a segunda, 18h às 23h, inclusive domingo e segunda. Terça-feira fechado.
- Informação nutricional completa de cada burger, fornecida pelo Hicks, na página de cada lanche.
- Reconhecimentos: Super Restaurante iFood (${MESES_SUPER} meses seguidos em ${MES_ANO}), placa de 12 meses consecutivos 2024–2025, Prêmio Hambúrguer Perfeito (Top 10 Campinas), Padrão e Constância 365 Dias, selo Angus Brasil, Brazil Beef Quality.
- Mais vendidos: Duplo Aversa (campeão de vendas), Aversa, O Clássico e Baba-Yaga. Único apimentado: Tex-Mex.
- Instagram: https://www.instagram.com/hicks_br/ · Pinterest: ${PINTEREST}

## Páginas principais
- [Página principal](${HOME}): a marca, os destaques e as perguntas frequentes.
- [Cardápio completo](${SITE}/cardapio): todos os burgers, combos, acompanhamentos, bebidas e sobremesa.
${SEO.GUIAS.map(g => `- [${g.h1.replace(/\.$/, '')}](${SITE}/${g.slug}): ${g.descricao}`).join('\n')}

## Burgers
${SEO.BURGERS.map(b => `- [${b.nome}](${SITE}/burgers/${b.slug}): ${b.resposta}${kcalTxt(b)}`).join('\n')}
`);

// 6) Velocidade: recomprime as fotos (o export vem pesado) e gera as versões menores do cardápio.
// Qualidade conferida lado a lado com o original: sem diferença visível.
const sharp = require(path.join(ROOT, '..', '..', 'Portlink', 'site', 'node_modules', 'sharp'));
(async () => {
  const recomprimir = async (rel, opcoes, largura, alvo = rel) => {
    const buf = await sharp(fs.readFileSync(path.join(ROOT, rel))).resize(largura ? { width: largura } : undefined).webp({ effort: 6, ...opcoes }).toBuffer();
    fs.writeFileSync(path.join(ROOT, alvo), buf);
  };
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/cardapio'))) {
    const rel = `assets/cardapio/${f}`;
    for (const w of [...LARGURAS, 160]) await recomprimir(rel, { quality: 76 }, w, rel.replace('.webp', `-${w}.webp`));
    await recomprimir(rel, { quality: 76 });
  }
  // Fotos dos burgers com nome legível (o Google também lê o nome do arquivo): /assets/burgers/baba-yaga.webp.
  fs.mkdirSync(path.join(ROOT, 'assets/burgers'), { recursive: true });
  for (const b of SEO.BURGERS) for (const suf of ['', '-480', '-800']) {
    fs.copyFileSync(path.join(ROOT, `assets/cardapio/${b.id}${suf}.webp`), path.join(ROOT, `assets/burgers/${b.slug}${suf}.webp`));
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/img/selos'))) await recomprimir(`assets/img/selos/${f}`, { quality: 80, alphaQuality: 90 });
  // Foto da cozinha (Bastidores): recomprimida no mesmo formato e nome que a página usa.
  await sharp(fs.readFileSync(path.join(ROOT, 'assets/img/cozinha.jpg'))).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(ROOT, 'assets/img/cozinha.jpg.tmp'));
  fs.renameSync(path.join(ROOT, 'assets/img/cozinha.jpg.tmp'), path.join(ROOT, 'assets/img/cozinha.jpg'));
  const pasta = d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).reduce((s, f) => { const p = path.join(ROOT, d, f); return fs.statSync(p).isFile() ? s + fs.statSync(p).size : s; }, 0);
  console.log(`imagens recomprimidas: assets/ com ${(pasta('assets') / 1048576).toFixed(1)} MB`);

  // Ícones: o monograma H da marca. Compartilhamento: logo + Baba-Yaga.
  const h = path.join(ROOT, 'assets/img/hicks-h-clear.png');
  const quadrado = async (lado, margem) => {
    const d = await sharp(h).resize(lado - margem * 2, lado - margem * 2, { fit: 'contain', background: '#00000000' }).toBuffer();
    return sharp({ create: { width: lado, height: lado, channels: 4, background: '#101010' } }).composite([{ input: d, gravity: 'center' }]).png();
  };
  await (await quadrado(32, 3)).toFile(path.join(ROOT, 'favicon-32.png'));
  await (await quadrado(180, 30)).toFile(path.join(ROOT, 'apple-touch-icon.png'));
  await (await quadrado(192, 30)).toFile(path.join(ROOT, 'icon-192.png'));
  await (await quadrado(512, 80)).toFile(path.join(ROOT, 'icon-512.png'));
  // favicon.ico (16, 32 e 48 px, PNG dentro do .ico): o endereço que o Google e os navegadores pedem primeiro.
  const pngs = await Promise.all([[16, 1], [32, 3], [48, 5]].map(async ([l, m]) => (await quadrado(l, m)).toBuffer()));
  const cab = Buffer.alloc(6 + 16 * pngs.length);
  cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(pngs.length, 4);
  let pos = cab.length;
  pngs.forEach((b, i) => {
    const l = [16, 32, 48][i], o = 6 + 16 * i;
    cab.writeUInt8(l, o); cab.writeUInt8(l, o + 1); cab.writeUInt16LE(1, o + 4); cab.writeUInt16LE(32, o + 6);
    cab.writeUInt32LE(b.length, o + 8); cab.writeUInt32LE(pos, o + 12); pos += b.length;
  });
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([cab, ...pngs]));

  // Imagem de compartilhamento (WhatsApp, redes): H + "Hamburgueria em Campinas" + Baba-Yaga.
  const burger = await sharp(path.join(ROOT, 'assets/cardapio/2108707.webp')).resize(630, 630).toBuffer();
  const monograma = await sharp(h).resize(96, 96, { fit: 'contain', background: '#00000000' }).toBuffer();
  const fonte = `font-family="Bahnschrift, 'Arial Narrow', Arial, sans-serif" font-stretch="condensed"`;
  const frase = Buffer.from(`<svg width="560" height="330" xmlns="http://www.w3.org/2000/svg">
<text x="0" y="78" fill="#f4f1e9" ${fonte} font-weight="700" font-size="78">HAMBURGUERIA</text>
<text x="0" y="160" fill="#aaa8a1" ${fonte} font-weight="700" font-size="78">EM CAMPINAS.</text>
<text x="2" y="232" fill="#f4f1e9" ${fonte} font-weight="400" font-size="30">Burger autoral. Simples bem feito.</text>
<text x="2" y="280" fill="#8c8981" ${fonte} font-weight="400" font-size="24">Super Restaurante iFood · Só delivery</text>
</svg>`);
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#101010' } })
    .composite([
      { input: burger, left: 570, top: 0 },
      // Degradê que esconde a emenda entre o fundo e a foto.
      { input: Buffer.from('<svg width="180" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0" stop-color="#101010"/><stop offset="1" stop-color="#101010" stop-opacity="0"/></linearGradient></defs><rect width="180" height="630" fill="url(#g)"/></svg>'), left: 570, top: 0 },
      { input: monograma, left: 70, top: 92 }, { input: frase, left: 70, top: 222 },
    ])
    .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(ROOT, 'og.jpg'));

  // Uma imagem de compartilhamento por burger (WhatsApp e redes mostram o lanche certo).
  fs.rmSync(path.join(ROOT, 'og'), { recursive: true, force: true });
  fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });
  const degrade = Buffer.from('<svg width="180" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0" stop-color="#101010"/><stop offset="1" stop-color="#101010" stop-opacity="0"/></linearGradient></defs><rect width="180" height="630" fill="url(#g)"/></svg>');
  const xmlEsc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  for (const b of SEO.BURGERS) {
    const foto = await sharp(path.join(ROOT, `assets/cardapio/${b.id}.webp`)).resize(630, 630).toBuffer();
    const nome = b.nome.toUpperCase();
    const tam = Math.min(84, Math.floor(540 / (nome.length * 0.47)));
    const texto = Buffer.from(`<svg width="560" height="330" xmlns="http://www.w3.org/2000/svg">
<text x="0" y="${tam}" fill="#f4f1e9" ${fonte} font-weight="700" font-size="${tam}">${xmlEsc(nome)}</text>
<text x="2" y="${tam + 52}" fill="#aaa8a1" ${fonte} font-weight="400" font-size="32">${xmlEsc(b.sub)}</text>
<text x="2" y="${tam + 120}" fill="#8c8981" ${fonte} font-weight="400" font-size="24">Hick’s Burger · Hamburgueria em Campinas</text>
</svg>`);
    await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#101010' } })
      .composite([{ input: foto, left: 570, top: 0 }, { input: degrade, left: 570, top: 0 }, { input: monograma, left: 70, top: 92 }, { input: texto, left: 70, top: 250 }])
      .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, `og/${b.slug}.jpg`));
  }
  // Imagens dos guias (quando existirem em fonte/imagens/): topo da página (1600 e 800 px) e compartilhamento.
  if (imagensGuias.size) fs.mkdirSync(path.join(ROOT, 'assets/guias'), { recursive: true });
  for (const [slug, arq] of imagensGuias) {
    const buf = fs.readFileSync(arq);
    await sharp(buf).resize(1600, 1000, { fit: 'cover' }).webp({ quality: 78, effort: 6 }).toFile(path.join(ROOT, `assets/guias/${slug}.webp`));
    await sharp(buf).resize(800, 500, { fit: 'cover' }).webp({ quality: 76, effort: 6 }).toFile(path.join(ROOT, `assets/guias/${slug}-800.webp`));
    await sharp(buf).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, `og/${slug}.jpg`));
  }
  console.log(`páginas de SEO: ${paginasSeo.length} · imagens de compartilhamento: ${SEO.BURGERS.length + 1 + imagensGuias.size} · imagens de guia: ${imagensGuias.size}`);
})();
console.log(`portlink.html ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB · ${Object.keys(mapa).length} arquivos do bundle reconhecidos · páginas: ${paginas.join(', ')}`);
