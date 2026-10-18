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
const fe = s => s.replace(/([↗©])(?!︎)/g, '$1︎');

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
  salvar(rel, fe(caminhos(js)));
}

// 4) Página principal.
for (const [u, rel] of Object.entries(mapa)) page = page.split(u).join(rel);
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
page = fe(links(page));

// Cabeçalho: favicon, endereço oficial, Open Graph e preload da fonte de título.
page = page.replace(/<link rel="icon"[^>]*>/,
  '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">' +
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
page = page.replace('</footer>', assinatura + '</footer>');
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
const horario = texto((page.match(/<dl>[\s\S]*?<\/dl>/) || [''])[0].replace(/<\/(dt|dd)>/g, ' '));
if (horario !== HORARIO_PAGINA) throw new Error(`horário da página mudou ("${horario}"): atualize openingHoursSpecification e HORARIO_PAGINA`);
const IFOOD = 'https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1';
const ld = {
  '@context': 'https://schema.org',
  '@graph': [
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
      hasMenu: IFOOD,
      acceptsReservations: false,
      sameAs: ['https://www.instagram.com/hicks_br/', IFOOD],
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
fs.writeFileSync(path.join(ROOT, 'portlink.html'), page);

// 5) Páginas internas: História, Bastidores e Central, do projeto original. Usam o mesmo cabeçalho da
// página principal (estilos, fontes, assinatura) e só o script de animações de rolagem.
const cabeca = page.slice(0, page.indexOf('<body')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const paginas = [];
for (const nome of ['historia', 'bastidores', 'central']) {
  const src = fs.readFileSync(path.join(PROJETO, `${nome}.html`), 'utf8');
  const titulo = /<title>([^<]*)<\/title>/.exec(src)[1];
  const desc = /<meta name="description" content="([^"]*)"/.exec(src)[1];
  const url = `${SITE}/${nome}`;
  const head = cabeca
    .replace(/<title>[^<]*<\/title>/, `<title>${titulo}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(desc)}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${attr(titulo)}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${attr(desc)}"`)
    .replace(`<link rel="canonical" href="${HOME}">`, `<link rel="canonical" href="${url}">`)
    .replace(`<meta property="og:url" content="${HOME}">`, `<meta property="og:url" content="${url}">`);
  if (!head.includes(`<link rel="canonical" href="${url}">`)) throw new Error('canonical não trocado em ' + nome);
  let corpo = fe(links(caminhos(src.slice(src.indexOf('<body')))));
  const faltando = [...corpo.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(x => x[1]).filter(r => !fs.existsSync(path.join(ROOT, r)));
  if (faltando.length) throw new Error(`arquivo inexistente em ${nome}: ${faltando.join(', ')}`);
  corpo = corpo.replace('</footer>', assinatura + '</footer>')
    .replace('</body>', '<script src="assets/js/scroll-motion.js" defer></script></body>');
  fs.writeFileSync(path.join(ROOT, `${nome}.html`), head + corpo);
  paginas.push(nome);
}
const hoje = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['portlink', ...paginas].map(p => `  <url><loc>${SITE}/${p}</loc><lastmod>${hoje}</lastmod><priority>${p === 'portlink' ? '1.0' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

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
  const burger = await sharp(path.join(ROOT, 'assets/cardapio/2108707.webp')).resize(630, 630).toBuffer();
  const marca = await sharp(path.join(ROOT, 'assets/img/hicks-word.png')).resize(420).toBuffer();
  const frase = Buffer.from(`<svg width="520" height="120" xmlns="http://www.w3.org/2000/svg"><text x="0" y="40" fill="#f4f1e9" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="40">BURGER AUTORAL.</text><text x="0" y="90" fill="#aaa8a1" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="40">SIMPLES BEM FEITO.</text></svg>`);
  await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#101010' } })
    .composite([{ input: burger, left: 570, top: 0 }, { input: marca, left: 70, top: 170 }, { input: frase, left: 74, top: 330 }])
    .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(ROOT, 'og.jpg'));
})();
console.log(`portlink.html ${(Buffer.byteLength(page) / 1024).toFixed(0)} KB · ${Object.keys(mapa).length} arquivos do bundle reconhecidos · páginas: ${paginas.join(', ')}`);
