// Monta o site da Hick's a partir do export "bundle" do Claude Design.
// Uso: node ferramentas/montar-site.cjs "../fonte/Hicks Burger - site.html"
// Gera index.html + assets/ (imagens, cardápio, vídeo, fontes, js) na raiz do site.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '..', 'fonte', 'Hicks Burger - site.html'));
const html = fs.readFileSync(SRC, 'utf8');

const bloco = tipo => {
  const a = html.indexOf(`<script type="${tipo}">`);
  if (a < 0) throw new Error('bloco ausente: ' + tipo);
  const s = html.indexOf('>', a) + 1;
  return html.slice(s, html.indexOf('</script>', s));
};
const manifest = JSON.parse(bloco('__bundler/manifest'));
let page = JSON.parse(bloco('__bundler/template'));
const ext = JSON.parse(bloco('__bundler/ext_resources'));

const bytes = uuid => {
  const e = manifest[uuid];
  if (!e) throw new Error('uuid ausente no manifest: ' + uuid);
  const b = Buffer.from(e.data, 'base64');
  return e.compressed ? zlib.gunzipSync(b) : b;
};

// Limpa só o que este script gera.
for (const d of ['assets']) fs.rmSync(path.join(ROOT, d), { recursive: true, force: true });
const salvar = (rel, buf) => {
  const f = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, buf);
};

const mapa = {}; // uuid -> caminho publicado
const usar = (uuid, rel) => { if (!mapa[uuid]) { salvar(rel, bytes(uuid)); mapa[uuid] = rel; } return mapa[uuid]; };

// 1) Imagens fixas da página (nomes conferidos visualmente).
const fixos = {
  'e4789a2f-0be5-4015-a1b9-a44d0e283bb3': 'assets/img/hicks-logo.png',
  'aed2f583-4256-412b-878d-e3ea46a1a3d7': 'assets/img/bulldog.png',
  'd2e72f85-5952-4c72-ad6f-ea3d1a931179': 'assets/img/bulldog-fundo.png',
  '29ad531e-9e80-4cd8-a118-ab73f349c55b': 'assets/img/logo-ifood.jpg',
  '1f582d77-d09f-4ff8-b134-67f795772e96': 'assets/img/logo-99food.png',
  '3ed59899-92a6-44fa-a66f-9610db8f9c74': 'assets/img/baba-yaga.jpg',
  '1cf9ee12-decf-4c88-b866-2fe07b0db8cb': 'assets/img/duplo-aversa.jpg',
  'df09e180-d24c-43c4-8d1b-1715609f731c': 'assets/img/aversa.jpg',
  '293ce099-fc81-4b92-b1eb-57c286e50d39': 'assets/img/placa-super-restaurante-2025.jpg',
  'c6a43c33-bf6a-420a-9460-1bf050cb59af': 'assets/img/selos/super-restaurante-ifood.webp',
  '2be37266-042f-4b2c-8011-2512e156ef99': 'assets/img/selos/hamburguer-perfeito-top10.webp',
  '459ec135-7b46-40fe-a763-959c68737ff0': 'assets/img/selos/padrao-constancia-365.webp',
  'c2b6f03b-47fd-4c7b-b4ab-ce4b2683abb2': 'assets/img/selos/angus-brasil.webp',
  '500bc1f8-4867-405a-93bc-1b54a1b5b1c6': 'assets/img/selos/brazil-beef-quality.webp',
};

// 2) Catálogo: r0..r41 seguem a ordem do JSON mobile-catalog-data; r45 é o vídeo.
const dataTag = '<script id="mobile-catalog-data" type="application/json">';
const catalogo = JSON.parse(page.split(dataTag)[1].split('</script>')[0]);
const porId = Object.fromEntries(ext.map(e => [e.id, e.uuid]));
catalogo.forEach((item, i) => usar(porId['r' + i], `assets/cardapio/${item.id}.webp`));
usar(porId.r45, 'assets/video/cozinha.mp4');
for (const [u, rel] of Object.entries(fixos)) usar(u, rel);

// 3) Fontes: nomeia pelo @font-face (família, peso, subset).
const reFace = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*{([^}]*)}/g;
let m;
while ((m = reFace.exec(page))) {
  const corpo = m[2];
  const fam = /font-family:\s*'([^']+)'/.exec(corpo)[1].toLowerCase().replace(/\s+/g, '-');
  const peso = /font-weight:\s*(\d+)/.exec(corpo)[1];
  const estilo = /font-style:\s*italic/.test(corpo) ? '-italic' : '';
  const uuid = /url\("([0-9a-f-]{36})"\)/.exec(corpo)[1];
  usar(uuid, `assets/fonts/${fam}-${peso}${estilo}-${m[1]}.woff2`);
}

// 4) Scripts.
// Cada foto do cardápio sai em 480, 800 e 1100 px (passo 6); __S monta o srcset de uma delas.
const LARGURAS = [480, 800];
const srcset = u => LARGURAS.map(w => `${u.replace('.webp', `-${w}.webp`)} ${w}w`).concat(`${u} 1100w`).join(', ');
const SRCSET_JS = `var __S=u=>[${LARGURAS}].map(w=>u.replace('.webp','-'+w+'.webp')+' '+w+'w').concat(u+' 1100w').join(', ');\n`;
const scripts = {
  '0070c4cd-39c3-48ea-b92b-975c6d0ac803': 'assets/js/lanches.js',
  '9aae66b9-871b-4efd-ba24-c6491767a312': 'assets/js/destaques-mobile.js',
  '4f0d3c20-df82-4293-a93e-05f0bdae77e1': 'assets/js/abertura.js',
  'e45027f0-1cf1-4e61-aae2-e4548bedccb2': 'assets/js/animacoes.js',
  '9ba3b2c1-29e0-449b-bff9-5a6de6ab9f09': 'assets/js/titulo-hero.js',
  '9fe44df4-115c-45e6-b9dd-80c72e8e524c': 'assets/js/hero-parallax.js',
};
for (const [u, rel] of Object.entries(scripts)) {
  let js = bytes(u).toString('utf8');
  // Fotos dos lanches (desktop): o export apontava para burger-0X.jpg, que não veio no bundle.
  js = js.split('assets/${p.img}').join('assets/cardapio/${p.id}.webp');
  js = js.split("'assets/hicks-word.png'").join("'assets/img/hicks-logo.png'")
    .split("'assets/logo-99food-y.png'").join("'assets/img/logo-99food.png'")
    .split("'assets/logo-ifood.jpg'").join("'assets/img/logo-ifood.jpg'");
  // Velocidade: fotos do cardápio em versões menores (srcset), ver passo 6.
  if (rel.endsWith('lanches.js')) {
    js = js.split('<img src="assets/cardapio/${p.id}.webp" alt="${p.sub} da Hick’s Burger"')
      .join('<img src="assets/cardapio/${p.id}.webp" srcset="${__S(\'assets/cardapio/\'+p.id+\'.webp\')}" sizes="(max-width:650px) 100vw, 40vw" alt="${p.sub} da Hick’s Burger"')
      .split('<img src="assets/cardapio/${p.id}.webp" alt="${p.sub}">')
      .join('<img src="assets/cardapio/${p.id}.webp" srcset="${__S(\'assets/cardapio/\'+p.id+\'.webp\')}" sizes="(max-width:650px) 100vw, 400px" alt="${p.sub}">');
    js = SRCSET_JS + js;
  }
  if (rel.endsWith('destaques-mobile.js')) {
    const comSrcset = (antes, sizes) => {
      if (!js.includes(antes)) throw new Error('trecho não encontrado em destaques-mobile.js: ' + antes);
      js = js.split(antes).join(antes.replace('<img ', `<img srcset="\${__S(p.image)}" sizes="${sizes}" `));
    };
    comSrcset('<img src="${esc(p.image)}" alt="${esc(p.name)} — foto', '90vw');
    comSrcset('<img src="${esc(p.image)}" alt="${esc(p.name)}" draggable', '70vw');
    comSrcset('<img class="mobile-dialog-photo" src="${esc(p.image)}"', '100vw');
    js = js.split('`<img src="${esc(p.image)}" alt="" loading="lazy">`').join('`<img src="${esc(p.image.replace(\'.webp\', \'-160.webp\'))}" alt="" loading="lazy" width="40" height="40">`');
    js = js.split('<img class="rv-bg" src="${esc(cover(g))}"').join('<img class="rv-bg" src="${esc(cover(g).replace(\'.webp\', \'-800.webp\'))}" loading="lazy"');
    // O carrossel do celular só é montado quando a pessoa começa a rolar (tirava ~0,5 s do carregamento).
    const fim = /\n init\(\);\r?\n\}\)\(\);\s*$/;
    if (!fim.test(js)) throw new Error('fim de destaques-mobile.js mudou');
    js = SRCSET_JS + js.replace(fim, `
 const kick = () => { removeEventListener('scroll', kick); removeEventListener('touchstart', kick); init(); };
 addEventListener('scroll', kick, { passive: true }); addEventListener('touchstart', kick, { passive: true });
 if ('IntersectionObserver' in window) { const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); kick(); } }); o.observe(root); } else init();
})();
`);
  }
  salvar(rel, js);
  mapa[u] = rel;
}

const sobra = Object.keys(manifest).filter(u => !mapa[u] && page.includes(u));
if (sobra.length) throw new Error('uuids sem destino: ' + sobra.join(', '));

// 5) HTML.
for (const [u, rel] of Object.entries(mapa)) page = page.split(u).join(rel);
page = page.split('assets/clean/').join('assets/cardapio/')
  .split('data-src="assets/cozinha-2.mp4"').join('data-src="assets/video/cozinha.mp4"');

// Fontes servidas do próprio domínio: sem preconnect ao Google.
page = page.replace(/<link rel="preconnect"[^>]*>/g, '');
// Fotos do cardápio no celular (hero e "qual vai ser hoje?") com versões menores.
page = page.replace(/<source media="\(max-width:650px\)" srcset="(assets\/cardapio\/\d+\.webp)">(<img class="hero-burger")?/g,
  (_, u, hero) => `<source media="(max-width:650px)" srcset="${srcset(u)}" sizes="${hero ? '115vw' : '45vw'}">${hero || ''}`);
// O shim do bundle (window.__resources) não é mais necessário.
page = page.replace(/<script>\(function\(\)\{var R=window\.__resources[\s\S]*?<\/script>/, '');

// Páginas que não vieram no export: aponta para as seções equivalentes.
page = page.split('href="historia.html"').join('href="#hicks"')
  .split('href="bastidores.html"').join('href="#cozinha"')
  .split('href="central.html"').join('href="#acesso"');

// Seta ↗ e © em versão texto (o iOS 18 desenha ↗ como emoji).
const fe = s => s.replace(/([↗©])(?!︎)/g, '$1︎');
page = fe(page);
for (const rel of Object.values(scripts)) salvar(rel, fe(fs.readFileSync(path.join(ROOT, rel), 'utf8')));

// Cabeçalho: favicon, preload e Open Graph.
const SITE = 'https://hicks-burger.vercel.app';
page = page.replace(/<link rel="icon"[^>]*>/,
  '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">' +
  '<link rel="apple-touch-icon" href="apple-touch-icon.png">' +
  `<link rel="canonical" href="${SITE}/">` +
  `<meta property="og:url" content="${SITE}/"><meta property="og:image" content="${SITE}/og.jpg">` +
  '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' +
  '<meta property="og:locale" content="pt_BR"><meta name="twitter:card" content="summary_large_image">' +
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="' +
  Object.values(mapa).find(r => /barlow-condensed-\d+-latin\.woff2$/.test(r)) + '">');

// Poppins da assinatura: recorte só com as letras de "by portlink" (1 KB cada), servido daqui.
// Antes vinha do Google Fonts e travava a primeira pintura da página por ~0,8 s.
for (const peso of [300, 700]) {
  const rel = `assets/fonts/poppins-${peso}-portlink.woff2`;
  salvar(rel, fs.readFileSync(path.join(__dirname, 'recursos', `poppins-${peso}-portlink.woff2`)));
}

// Assinatura "by portlink" como último elemento do rodapé.
const assinatura =
  '<div class="portlink-wrap"><a href="https://useportlink.com" target="_blank" rel="noopener" aria-label="by portlink" class="portlink-sign">' +
  '<span class="portlink-by">by</span>' +
  '<span class="portlink-word"><span class="portlink-port">port</span><span class="portlink-link">link</span></span></a></div>';
page = page.replace('</footer>', assinatura + '</footer>');
page = page.replace('</head>', `<style>
/* FAQ: o export gira todo span do summary ao abrir; só o ícone + deve girar, não a pergunta. */
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
const texto = s => s.replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, '$1').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const faq = [...page.matchAll(/<details><summary><span class="faq-q">([\s\S]*?)<\/span>[\s\S]*?<\/summary><p>([\s\S]*?)<\/p>/g)]
  .map(([, q, r]) => ({ '@type': 'Question', name: texto(q), acceptedAnswer: { '@type': 'Answer', text: texto(r) } }));
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Restaurant',
      '@id': `${SITE}/#restaurante`,
      name: 'Hick’s Burger',
      description: 'Burger autoral em Campinas. Delivery pelo Cardápio Hick’s, iFood e 99 Food.',
      url: `${SITE}/`,
      logo: `${SITE}/assets/img/hicks-logo.png`,
      image: `${SITE}/og.jpg`,
      servesCuisine: ['Hambúrguer', 'Hot dog'],
      priceRange: 'R$ 36,90 a R$ 79,90',
      taxID: '36.635.421/0001-36',
      address: { '@type': 'PostalAddress', addressLocality: 'Campinas', addressRegion: 'SP', addressCountry: 'BR' },
      areaServed: { '@type': 'City', name: 'Campinas' },
      hasMenu: 'https://hicks.app.br/hicks_burger_e_hotdog',
      acceptsReservations: false,
      sameAs: ['https://www.instagram.com/hicks_br/'],
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Thursday', 'Friday', 'Saturday'], opens: '18:00', closes: '23:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '18:30', closes: '23:00' },
      ],
      award: ['Super Restaurante iFood 2025', 'Prêmio Hambúrguer Perfeito, Top 10 Campinas'],
    },
    { '@type': 'FAQPage', '@id': `${SITE}/#perguntas`, mainEntity: faq },
  ],
};
page = page.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>`);

fs.writeFileSync(path.join(ROOT, 'index.html'), page);

// Ícones e imagem de compartilhamento (sharp do projeto da Portlink, como na Dale).
const sharp = require(path.join(ROOT, '..', '..', 'Portlink', 'site', 'node_modules', 'sharp'));
(async () => {
  // 6) Velocidade: recomprime as fotos (o export vem pesado) e gera as versões menores do cardápio.
  // Qualidade conferida lado a lado com o original: sem diferença visível.
  const recomprimir = async (rel, opcoes, largura, destino = rel) => {
    const buf = await sharp(fs.readFileSync(path.join(ROOT, rel))).resize(largura ? { width: largura } : undefined).webp({ effort: 6, ...opcoes }).toBuffer();
    fs.writeFileSync(path.join(ROOT, destino), buf);
  };
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/cardapio'))) {
    const rel = `assets/cardapio/${f}`;
    for (const w of [...LARGURAS, 160]) await recomprimir(rel, { quality: 76 }, w, rel.replace('.webp', `-${w}.webp`));
    await recomprimir(rel, { quality: 76 });
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/img/selos'))) await recomprimir(`assets/img/selos/${f}`, { quality: 80, alphaQuality: 90 });
  const pasta = d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).reduce((s, f) => { const p = path.join(ROOT, d, f); return fs.statSync(p).isFile() ? s + fs.statSync(p).size : s; }, 0);
  console.log(`imagens recomprimidas: assets/ agora com ${(pasta('assets') / 1048576).toFixed(1)} MB`);

  const dog = path.join(ROOT, 'assets/img/bulldog.png');
  const logo = path.join(ROOT, 'assets/img/hicks-logo.png');
  const quadrado = async (lado, margem) => {
    const d = await sharp(dog).resize(lado - margem * 2, lado - margem * 2, { fit: 'contain', background: '#00000000' }).toBuffer();
    return sharp({ create: { width: lado, height: lado, channels: 4, background: '#101010' } }).composite([{ input: d, gravity: 'center' }]).png();
  };
  await (await quadrado(32, 2)).toFile(path.join(ROOT, 'favicon-32.png'));
  await (await quadrado(180, 22)).toFile(path.join(ROOT, 'apple-touch-icon.png'));
  const burger = await sharp(path.join(ROOT, 'assets/cardapio/2108707.webp')).resize(630, 630).toBuffer();
  const marca = await sharp(logo).resize(420).toBuffer();
  const frase = Buffer.from(`<svg width="520" height="120" xmlns="http://www.w3.org/2000/svg"><text x="0" y="40" fill="#f4f1e9" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="40">BURGER AUTORAL.</text><text x="0" y="90" fill="#aaa8a1" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="40">SIMPLES BEM FEITO.</text></svg>`);
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#101010' } })
    .composite([{ input: burger, left: 570, top: 0 }, { input: marca, left: 70, top: 170 }, { input: frase, left: 74, top: 330 }])
    .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, 'og.jpg'));
})();
const total = Object.values(mapa).reduce((s, r) => s + fs.statSync(path.join(ROOT, r)).size, 0);
console.log(`index.html ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB · ${Object.keys(mapa).length} arquivos em assets/ (${(total / 1048576).toFixed(1)} MB)`);
