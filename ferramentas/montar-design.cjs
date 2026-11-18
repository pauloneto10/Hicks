// Monta o site do Hicks a partir das páginas prontas do Claude Design (fonte/design/, versão de 20/10/2026)
// e aplica o SEO e o GEO por cima. Uso: node ferramentas/montar-design.cjs
//
// O design vem com endereços de arquivo (burger-baba-yaga.html, assets/...). O montador:
//  1. publica cada página no endereço do site (/portlink, /cardapio, /burgers/baba-yaga, /melhor-angus-de-campinas...);
//  2. tira os scripts de dentro das páginas para arquivos próprios (a política de segurança do site, CSP,
//     só deixa rodar scripts que vêm de arquivo do próprio domínio);
//  3. reescreve o cabeçalho de SEO (título, descrição, endereço oficial, Open Graph) com seo-paginas.cjs;
//  4. refaz os dados estruturados (Schema.org) a partir do texto VISÍVEL de cada página;
//  5. recoloca o rodapé "Explore o Hicks" (sem ele, os guias ficavam sem links internos);
//  6. gera sitemap.xml, robots.txt e llms.txt e confere o resultado (marca no masculino, links, tamanhos).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PAGINAS } = require('./seo-paginas.cjs');
const { NUTRI } = require('./nutricao.cjs');
const { BURGERS } = require('./conteudo-seo.cjs');
const { VARIANTES } = require('./otimizar-fotos.cjs');
// Rota de cada burger → id do item no cardápio (para a tabela nutricional nos dados estruturados).
const ID_DO_BURGER = Object.fromEntries(BURGERS.map(b => [`burgers/${b.slug}`, b.id]));

const ROOT = path.resolve(__dirname, '..');
const DESIGN = path.join(ROOT, '..', 'fonte', 'design');
const SITE = 'https://hicksburger.com.br';
const HOME = `${SITE}/portlink`;
const IFOOD = 'https://www.ifood.com.br/delivery/campinas-sp/hicks--burger-vila-boa-vista/4a2f1137-8a50-41d3-8a62-c63040e771f1';
const PINTEREST = 'https://br.pinterest.com/hicks_br/';
const INSTAGRAM = 'https://www.instagram.com/hicks_br/';
const SPOTIFY = 'https://open.spotify.com/playlist/5bKJJZ1BPGHgVfaiMxymSI';
// Perfil do Hicks no Spotify (dono da playlist; confirmado pelo Neto em 20/10/2026). Entra na lista de perfis da
// marca (sameAs) e no llms.txt; o ícone do topo continua abrindo a playlist.
const SPOTIFY_PERFIL = 'https://open.spotify.com/user/314u5busxogors2o3bqnvdkhifee';
const agora = new Date();
const MESES = 46 + (agora.getFullYear() - 2026) * 12 + (agora.getMonth() - 9);
const MES_ANO = agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const HOJE = agora.toISOString().slice(0, 10);
// Playlist da página principal: player próprio e prévias de 30 s do iTunes (ver 5.2c).
const PLAYER = fs.readFileSync(path.join(__dirname, 'recursos', 'player-playlist.js'), 'utf8');
const ARQ_PREVIAS = path.join(__dirname, 'recursos', 'previas-musica.json');
const PREVIAS = fs.existsSync(ARQ_PREVIAS) ? JSON.parse(fs.readFileSync(ARQ_PREVIAS, 'utf8')) : {};
// Mapa da área de entrega (design de 21/10/2026): ponto, raio e link do Google Maps lidos do próprio design,
// para os dados estruturados e o llms.txt dizerem o mesmo que a página.
const MAPA = (() => {
  const h = fs.readFileSync(path.join(__dirname, '..', '..', 'fonte', 'design', 'portlink.html'), 'utf8');
  const p = h.match(/loja=\[(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/), r = h.match(/L\.circle\(loja,\{radius:(\d+)/), g = h.match(/class="rg5-gm" href="([^"]+)"/);
  return p && r ? { lat: +p[1], lng: +p[2], raio: +r[1], link: g ? g[1].replace(/&amp;/g, '&') : null } : null;
})();
// O mapa do design buscava a biblioteca Leaflet no unpkg e as imagens nos servidores do Google sem chave
// (proibido pelos termos do Google Maps). Agora: Leaflet 1.9.4 servido do próprio site (conferido pela assinatura
// publicada pelo Leaflet) e imagens do OpenStreetMap, com o crédito exigido. E o mapa não prende a rolagem: com o
// dedo (ou a roda do mouse) a página continua rolando; para arrastar o mapa, a tela cheia (⤢).
function remendarMapa(codigo, rota) {
  const trocas = [
    // (com a versão no endereço, para o cache de um ano; ver versao())
    [/https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.(css|js)/g, (m, ext) => `/assets/vendor/leaflet/leaflet.${ext}?v=${versao(`/assets/vendor/leaflet/leaflet.${ext}`)}`, 'endereço do Leaflet 1.9.4'],
    [/L\.tileLayer\(\s*'[^']*google\.com[^']*'\s*,\s*\{[^}]*\}\s*\)/, `L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'})`, 'imagens do mapa'],
    [/scrollWheelZoom:true,dragging:true/, "scrollWheelZoom:false,dragging:!matchMedia('(pointer: coarse)').matches", 'gestos do mapa'],
    [/var on=el\.classList\.toggle\('full'\);/, "var on=el.classList.toggle('full');if(on){m.dragging.enable();m.scrollWheelZoom.enable()}else{m.scrollWheelZoom.disable();if(matchMedia('(pointer: coarse)').matches)m.dragging.disable()}", 'tela cheia do mapa'],
  ];
  for (const [de, para, nome] of trocas) {
    if (!de.test(codigo)) { avisos.push(`${rota}: mapa mudou no design (${nome}); conferir remendarMapa`); continue; }
    codigo = codigo.replace(de, para);
  }
  if (/unpkg\.com|google\.com\/vt/.test(codigo)) avisos.push(`${rota}: o mapa ainda chama servidor de fora (unpkg/Google); a política de segurança vai bloquear`);
  return codigo;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const decod = s => String(s).replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
// Textos vizinhos que o design escreve colados ("<b>Duplo Aversa</b><span>Duplo Angus…</span>") ganham um espaço
// entre eles. Na tela nada muda (medido no navegador: estão em blocos ou caixas flex/grid, onde o espaço some),
// mas quem lê sem o visual (IAs, modo Leitor do Safari, leitor de tela) deixa de ver "Duplo AversaDuplo Angus".
// Ficam de fora a assinatura (port+link, que é uma palavra só) e o carimbo decorativo do topo.
const TAGS_TEXTO = 'span|b|i|em|strong|small|a|div|p|li|ul|ol|dl|dt|dd|h[1-6]|figure|figcaption|label|button|article|header|footer|section|nav|time';
const COLADOS = new RegExp(`([^\\s<>])((?:</(?:${TAGS_TEXTO})>)+)((?:<(?:${TAGS_TEXTO})\\b[^>]*>)+)(?=[^\\s<])`, 'g');
function separarColados(h) {
  const guardados = [];
  const guarda = m => `\u0000${guardados.push(m) - 1}\u0000`;
  h = h.replace(/<(script|style|textarea|pre)\b[\s\S]*?<\/\1>/g, guarda)
    .replace(/<span class="portlink-word">[\s\S]*?<\/span><\/span>/g, guarda)
    .replace(/<div class="orbit-stamp"[\s\S]*?<\/div>/g, guarda);
  return h.replace(COLADOS, '$1$2 $3').replace(/\u0000(\d+)\u0000/g, (m, i) => guardados[i]);
}
const txt = s => String(s).replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, ' $1 ').replace(/<(script|style|svg|table)[\s\S]*?<\/\1>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/[＋+]\s*$/, '').replace(/\s+([.,;:!?…])/g, '$1').replace(/\s+/g, ' ').trim();
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const subst = s => s.replace(/\{MESES\}/g, MESES);

// ---------------------------------------------------------------------------------------------
// 1) Páginas do design → endereços do site.
const arquivoDe = nome => nome === 'portlink.html' ? 'portlink' : nome.startsWith('burger-') ? 'burgers/' + nome.slice(7, -5) : nome.slice(0, -5);
const paginas = fs.readdirSync(DESIGN).filter(f => f.endsWith('.html') && f !== 'index.html').map(f => ({ origem: f, rota: arquivoDe(f) }));
for (const p of paginas) if (!PAGINAS[p.rota]) throw new Error(`página do design sem SEO definido em seo-paginas.cjs: ${p.origem}`);
for (const rota of Object.keys(PAGINAS)) if (!paginas.some(p => p.rota === rota)) throw new Error(`seo-paginas.cjs cita uma página que não veio no design: ${rota}`);
const rotas = new Set(paginas.map(p => p.rota));

// Endereço de arquivo do design → endereço do site.
const endereco = u => {
  if (!u || /^(https?:|mailto:|tel:|data:|javascript:|#)/.test(u) || u.startsWith('//')) return u;
  const [base, ...resto] = u.split('#');
  const ancora = resto.length ? '#' + resto.join('#') : '';
  const m = /^([a-z0-9-]+)\.html$/.exec(base);
  if (m) {
    const rota = base === 'index.html' ? 'portlink' : arquivoDe(base);
    if (!rotas.has(rota)) throw new Error(`link para página que não existe no design: ${u}`);
    return '/' + rota + ancora;
  }
  return '/' + base.replace(/^\.?\//, '') + ancora;
};

// ---------------------------------------------------------------------------------------------
// 2) Arquivos de apoio do design (fotos, fontes, scripts, vídeo, ícones). As imagens de compartilhamento (og/)
//    continuam as geradas antes, uma por burger.
fs.rmSync(path.join(ROOT, 'assets'), { recursive: true, force: true });
fs.cpSync(path.join(DESIGN, 'assets'), path.join(ROOT, 'assets'), { recursive: true });
for (const f of ['favicon.ico', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'og.jpg']) {
  if (fs.existsSync(path.join(DESIGN, f))) fs.copyFileSync(path.join(DESIGN, f), path.join(ROOT, f));
}
// Fontes da assinatura "by portlink" (recorte de 1 KB), que o export do design não traz.
for (const peso of [300, 700]) {
  const alvo = path.join(ROOT, 'assets', 'fonts', `poppins-${peso}-portlink.woff2`);
  if (!fs.existsSync(alvo)) fs.copyFileSync(path.join(__dirname, 'recursos', `poppins-${peso}-portlink.woff2`), alvo);
}
// Correções de conteúdo confirmadas pelo Hicks e aplicadas em todo o site (páginas e scripts do design).
// 20/10/2026: os nuggets são Seara, não artesanais.
// 22/10/2026: o Baba-Yaga leva frango. No lugar de uma das duas muçarelas empanadas que o design descrevia vai
// o burger de frango Chicken Supreme de 100 g (nome usado pelo próprio Hicks no iFood); o nome do lanche segue
// "Angus + Chicken & Catupiry", como no iFood. A tabela nutricional enviada já era a da versão com frango.
const CORRECOES = [
  [/Nuggets Artesanais/g, 'Nuggets Seara'],
  [/<b>2 fatias de muçarela empanada<\/b><span>Duas fatias de muçarela empanada, crocantes por fora e derretidas por dentro\.<\/span>/g,
    '<b>Chicken Supreme e muçarela empanada</b><span>Um burger de frango Chicken Supreme de 100 g e uma muçarela empanada de 100 g, crocante por fora e derretida por dentro.</span>'],
  [/Duas fatias de muçarela empanada e Catupiry/g, 'Chicken Supreme, muçarela empanada e Catupiry'],
  [/duas fatias de muçarela empanada/g, 'Chicken Supreme de 100 g, muçarela empanada'],
  [/(Baba-Yaga[^<]{0,80}?Angus de 100 g, )(100 g de muçarela empanada)/g, '$1Chicken Supreme de 100 g, $2'],
  [/Hambúrguer Angus 100g, muçarela empanada 100g, catupiry/g, 'Hambúrguer Angus 100g, Chicken Supreme 100g, muçarela empanada 100g, catupiry'],
  [/(name:'Baba-Yaga'[^}]*desc:'Angus de 100 g, )(muçarela empanada de 100 g)/g, '$1Chicken Supreme de 100 g, $2'],
  [/Angus, muçarela empanada (&amp;|&) Catupiry/g, 'Angus + Chicken $1 Catupiry'],
  [/Angus, muçarela empanada, Catupiry e bacon/g, 'Angus, Chicken Supreme, muçarela empanada, Catupiry e bacon'],
];
const corrigir = s => CORRECOES.reduce((t, [de, para]) => t.replace(de, para), s);
// Correções que valem só numa página (o mesmo trecho está certo em outra; ex.: Angus + muçarela no Aversa).
const CORRECOES_PAGINA = {
  'burger-baba-yaga.html': [
    [/ganha duas fatias de <mark>muçarela empanada<\/mark>/g, 'ganha o Chicken Supreme de 100 g e uma <mark>muçarela empanada</mark>'],
    [/<li><b>100 g<\/b><span>Angus<\/span><\/li><li><b>100 g<\/b><span>muçarela empanada<\/span><\/li>/g,
      '<li><b>100 g</b><span>Angus</span></li><li><b>100 g</b><span>Chicken Supreme</span></li><li><b>100 g</b><span>muçarela empanada</span></li>'],
  ],
};
for (const dir of [path.join(ROOT, 'assets', 'js')]) {
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.js'))) {
    const arq = path.join(dir, f), antes = fs.readFileSync(arq, 'utf8'), depois = corrigir(antes);
    if (depois !== antes) fs.writeFileSync(arq, depois);
  }
}
// Vídeo da cozinha (20/10/2026). O design só liberava o vídeo depois que a página inteira carregava, não tinha
// capa e não tentava de novo se o celular bloqueasse o play; e a abertura (intro.js) mandava a página de volta
// ao topo quando o carregamento terminava, tirando da seção quem já tinha rolado até ela.
const avisosApoio = [];
const remendar = (arq, de, para, motivo) => {
  const f = path.join(ROOT, 'assets', 'js', arq);
  if (!fs.existsSync(f)) return avisosApoio.push(`${arq} não veio no design (${motivo})`);
  const s = fs.readFileSync(f, 'utf8');
  if (!de.test(s)) return avisosApoio.push(`${arq}: trecho não encontrado, conferir (${motivo})`);
  fs.writeFileSync(f, s.replace(de, para));
};
remendar('scroll-motion.js',
  /[ \t]*const lazyVid = document\.querySelector\('\.kitchen-video\[data-src\]'\);[\s\S]*?addEventListener\('load', arm, \{ once: true \}\);\s*\}\n/,
  () => fs.readFileSync(path.join(__dirname, 'recursos', 'video-cozinha.js'), 'utf8'), 'vídeo da cozinha');
remendar('intro.js', /addEventListener\('load', \(\) => scrollTo\(0, 0\), \{ once: true \}\);/,
  "addEventListener('load', () => { if (document.documentElement.classList.contains('hki-lock')) scrollTo(0, 0); }, { once: true });", 'volta ao topo no fim do carregamento');
remendar('intro.js', /addEventListener\('pageshow', \(\) => scrollTo\(0, 0\)\);/,
  "addEventListener('pageshow', e => { if (e.persisted || document.documentElement.classList.contains('hki-lock')) scrollTo(0, 0); });", 'volta ao topo no fim do carregamento');
// Biblioteca do mapa (Leaflet 1.9.4) servida do próprio site, e a logo branca do iFood do botão do topo
// (o design usa e o export não trouxe; gerada da logo vermelha).
fs.cpSync(path.join(__dirname, 'recursos', 'leaflet'), path.join(ROOT, 'assets', 'vendor', 'leaflet'), { recursive: true });
if (!fs.existsSync(path.join(ROOT, 'assets', 'img', 'logo-ifood-white.png'))) fs.copyFileSync(path.join(__dirname, 'recursos', 'logo-ifood-white.png'), path.join(ROOT, 'assets', 'img', 'logo-ifood-white.png'));
// Capa de cada vídeo (quadro do próprio vídeo, em ferramentas/recursos/<vídeo>-capa.webp).
for (const f of fs.existsSync(path.join(ROOT, 'assets', 'video')) ? fs.readdirSync(path.join(ROOT, 'assets', 'video')).filter(n => n.endsWith('.mp4')) : []) {
  const capa = path.join(__dirname, 'recursos', f.replace(/\.mp4$/, '-capa.webp'));
  if (fs.existsSync(capa)) fs.copyFileSync(capa, path.join(ROOT, 'assets', 'video', path.basename(capa)));
  else avisosApoio.push(`vídeo ${f} sem capa em ferramentas/recursos/${path.basename(capa)}`);
}
// Fotos: recomprime e gera de verdade as versões de 480 e 800 px (o export traz cópias da foto de 1100 px).
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'otimizar-fotos.cjs')], { stdio: 'inherit' });
const scriptsExtraidos = new Map(); // nome do arquivo → código
// Scripts que ficam DENTRO da página (liberados na política de segurança pela impressão digital do código).
const SCRIPTS_NA_PAGINA = new Set(['hk-mobile-cap']);
const impressoes = new Set(); // 'sha256-...' de cada script que ficou na página

// Catálogo da página principal (mobile-catalog.js): as fotos montadas pelo script passam a oferecer ao navegador
// as versões de 240, 480 e 800 px (srcset), cada uma com o tamanho em que aparece (sizes). Antes iam sempre as de
// 1100 px, mesmo nas miniaturas.
remendar('mobile-catalog.js', /( const esc = value => [^\n]*\n)/,
  "$1 const ss = (u, s) => { const p = catalog.find(x => x.image === u); return p && p.srcset ? ` srcset=\"${esc(p.srcset)}\" sizes=\"${s}\"` : ''; };\n", 'fotos do catálogo: função do srcset');
for (const [de, sizes, nome] of [
  [/src="\$\{esc\(p\.image\)\}"( alt="\$\{esc\(p\.name\)\} — foto)/, '(max-width: 650px) min(46vw, 200px), 430px', 'cartão do catálogo'],
  [/(<span class="rv-thumbs">[^`]*`<img )src="\$\{esc\(p\.image\)\}"/, '(max-width: 650px) 40px, 112px', 'miniaturas das categorias'],
  [/src="\$\{esc\(p\.image\)\}"( alt="\$\{esc\(p\.name\)\}" draggable="false")/, '(max-width: 650px) 240px, 430px', 'carrossel'],
  [/src="\$\{esc\(p\.image\)\}"( alt="" loading="lazy" width="56")/, '56px', 'lista do menu'],
  [/src="\$\{esc\(p\.image\)\}"( alt="\$\{esc\(p\.name\)\}"><div class="mobile-dialog-copy">)/, 'min(100vw, 430px)', 'foto do detalhe'],
  [/src="\$\{esc\(cover\(g\)\)\}"/, '(max-width: 650px) 160px, 430px', 'capa das categorias'],
]) {
  const expr = nome === 'capa das categorias' ? 'cover(g)' : 'p.image';
  const tag = `src="\${esc(${expr})}"\${ss(${expr}, '${sizes}')}`;
  remendar('mobile-catalog.js', de, m => m.replace(`src="\${esc(${expr})}"`, tag), `fotos do catálogo: ${nome}`);
}

// Medidas de um arquivo de imagem (PNG, JPEG ou WebP), lidas do cabeçalho do arquivo.
function medidas(arq) {
  const b = fs.readFileSync(arq);
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
    return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  return null;
}
// Versão de cada arquivo (impressão digital curta do conteúdo), posta no endereço como ?v=... Assim o navegador
// pode guardar fotos e fontes por um ano (vercel.json): quando o arquivo muda, o endereço muda junto.
const versoes = new Map();
const versao = u => {
  if (!versoes.has(u)) {
    // Scripts tirados das páginas só são gravados no fim (passo 6): a versão sai do código guardado na memória.
    const extraido = u.startsWith('/assets/js/') && scriptsExtraidos.get(path.basename(u));
    const arq = path.join(ROOT, u);
    const conteudo = extraido != null && extraido !== false ? extraido : fs.existsSync(arq) ? fs.readFileSync(arq) : null;
    versoes.set(u, conteudo == null ? null : crypto.createHash('md5').update(conteudo).digest('hex').slice(0, 8));
  }
  return versoes.get(u);
};
// Scripts (assets/js) também (pedido do Neto, 18/11/2026): o retorno ao site não precisa mais conferir cada um.
const PASTAS_VERSIONADAS = /^\/assets\/(?:img|cardapio|burgers|fonts|video|vendor|js)\//;
const versionar = h => h.replace(/(["'(\s,])(\/assets\/[^"'()\s?#,]+\.(?:webp|jpe?g|png|svg|gif|avif|woff2?|mp4|js))(?=["')\s,])/g,
  (m, antes, u) => { const v = PASTAS_VERSIONADAS.test(u) && versao(u); return v ? `${antes}${u}?v=${v}` : m; });

// ---------------------------------------------------------------------------------------------
// 3) Rodapé "Explore o Hicks": links fixos para o cardápio e os guias em todas as páginas.
const EXPLORE = `<nav class="sx-explorar" aria-label="Explore o Hicks"><p>Explore o Hicks</p><ul>
<li><a href="/cardapio">Cardápio completo</a></li><li><a href="/melhor-hamburguer-de-campinas">Melhor hambúrguer</a></li>
<li><a href="/melhor-angus-de-campinas">O melhor Angus</a></li><li><a href="/hamburgueria-autoral-campinas">Burger autoral</a></li>
<li><a href="/super-restaurante-ifood">Super Restaurante</a></li><li><a href="/burgers/duplo-aversa">Duplo Aversa</a></li>
</ul></nav>`;
const CSS_EXPLORE = `<style>.sx-explorar{margin-top:30px;padding-top:24px;border-top:1px solid #1F1F1C;text-align:left}
.sx-explorar p{margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9A968D}
.sx-explorar ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 22px;margin:0;padding:0;list-style:none;max-width:620px}
.sx-explorar li{line-height:1.45}
.sx-explorar a{white-space:nowrap;font-size:13.5px;color:#F3F0E8;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;transition:opacity .2s}
.sx-explorar a::after{content:' \\2197\\FE0E';font-size:12px;display:inline-block;text-decoration:none;margin-left:4px}
.sx-explorar a:hover{opacity:.7}</style>`;

// ---------------------------------------------------------------------------------------------
// 4) Leitura do conteúdo visível (para os dados estruturados e para conferir as descrições).
const lerPagina = h => {
  const main = h.slice(h.indexOf('<main'), h.indexOf('</main>') > 0 ? h.indexOf('</main>') : undefined);
  const corpo = h.slice(h.indexOf('<body'));
  const perguntas = [...corpo.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map(m => m[1])
    .filter(d => !/sx-tn|sx-tabela|tabela-nutricional|Informação nutricional|Tabela nutricional/.test(d))
    .map(d => [txt((d.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || ''), txt(d.replace(/<summary[\s\S]*?<\/summary>/, ''))])
    .filter(([q, a]) => q && a);
  const trilha = [...((main.match(/<ol class="sx-trilha">([\s\S]*?)<\/ol>/) || [])[1] || '').matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map(m => [txt(m[1]), (m[1].match(/href="([^"]+)"/) || [])[1] || null]);
  const foto = main.match(/<figure class="sx-foto[^"]*"><img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>(?:<figcaption>([\s\S]*?)<\/figcaption>)?/);
  return {
    main, corpo, perguntas, trilha,
    h1: txt((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''),
    sub: txt((main.match(/<p class="sx-sub">([\s\S]*?)<\/p>/) || [])[1] || ''),
    resposta: txt((main.match(/<p class="sx-resposta">([\s\S]*?)<\/p>/) || [])[1] || ''),
    foto: foto ? { src: foto[1], alt: txt(foto[2]), legenda: txt(foto[3] || '') } : null,
    visivel: txt(corpo),
  };
};

// ---------------------------------------------------------------------------------------------
// 5) Montagem de cada página.
const resultado = [];
const avisos = [...avisosApoio];
for (const { origem, rota } of paginas) {
  const seo = PAGINAS[rota];
  const url = rota === 'portlink' ? HOME : `${SITE}/${rota}`;
  let h = corrigir(fs.readFileSync(path.join(DESIGN, origem), 'utf8'));
  for (const [de, para] of CORRECOES_PAGINA[origem] || []) {
    if (!de.test(h)) avisos.push(`${rota}: correção específica não encontrada (${de.source.slice(0, 40)}…); conferir CORRECOES_PAGINA`);
    h = h.replace(de, para);
  }

  // 5.1 Scripts de dentro da página → arquivo próprio (mesmo lugar, mesma ordem, mesmo efeito).
  h = h.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (tag, attrs = '', codigo) => {
    if (/\bsrc=/.test(attrs)) return tag;
    const tipo = (attrs.match(/\btype="([^"]*)"/) || [])[1];
    if (tipo === 'application/ld+json') return ''; // refeito abaixo, a partir do texto visível
    if (tipo && tipo !== 'text/javascript' && tipo !== 'module') return tag; // dados (application/json)
    if (!codigo.trim()) return '';
    const id = (attrs.match(/\bid="([^"]*)"/) || [])[1] || 'inline';
    // O player da playlist (sp-js) é trocado pela versão do montador (ver 5.2c).
    if (id === 'sp-js') codigo = PLAYER;
    if (id === 'rgmap-js') codigo = remendarMapa(codigo, rota);
    // O ajuste de largura do topo (hk-mobile-cap, 1 KB) precisa rodar antes de tudo; como arquivo separado, a
    // página esperava baixá-lo para começar a aparecer (o PageSpeed contava ~220 ms). Fica dentro da página e a
    // política de segurança libera exatamente esse código pela impressão digital (sha256) gravada no vercel.json.
    if (SCRIPTS_NA_PAGINA.has(id) && tipo !== 'module') {
      impressoes.add(`'sha256-${crypto.createHash('sha256').update(codigo, 'utf8').digest('base64')}'`);
      return `<script id="${id}">${codigo}</script>`;
    }
    const hash = crypto.createHash('md5').update(codigo).digest('hex').slice(0, 8);
    const nome = `pagina-${id}-${hash}.js`;
    scriptsExtraidos.set(nome, codigo);
    return `<script src="/assets/js/${nome}"${tipo === 'module' ? ' type="module"' : ''}></script>`;
  });

  // 5.2 Endereços: links, imagens, srcset, url() no CSS e endereços dentro dos dados JSON.
  h = h.replace(/\b(src|href|data-src|poster)="([^"]*)"/g, (m, a, u) => `${a}="${endereco(u)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (m, v) => `srcset="${v.split(',').map(s => { const [u, w] = s.trim().split(/\s+/); return endereco(u) + (w ? ' ' + w : ''); }).join(', ')}"`)
    .replace(/url\((["']?)(?!data:|https?:|#)([^"')]+)\1\)/g, (m, q, u) => `url(${q}${endereco(u)}${q})`)
    .replace(/"(url|image)":"([^"]+)"/g, (m, k, u) => `"${k}":"${endereco(u)}"`);

  // 5.2a Imagens no tamanho em que aparecem (PageSpeed, 18/11/2026: ~570 KB a mais só na página principal).
  //  - Fotos e logos que aparecem miúdos ganham a lista de versões pequenas (VARIANTES, em otimizar-fotos.cjs).
  h = h.replace(/<img\b[^>]*>/g, tag => {
    if (/\bsrcset=/.test(tag)) return tag;
    const src = (tag.match(/\bsrc="([^"]+)"/) || [])[1];
    const v = src && VARIANTES.find(x => x.sizes && '/' + x.arq === src);
    if (!v) return tag;
    const [w] = medidas(path.join(ROOT, v.arq)) || [];
    const lista = v.larguras.map(l => `${src.replace(/\.(\w+)$/, `-${l}.$1`)} ${l}w`).concat(w ? [`${src} ${w}w`] : []);
    return tag.replace(/<img\b/, `<img srcset="${lista.join(', ')}" sizes="${v.sizes}"`);
  });
  //  - Burgers nas listas (cartões dos guias, itens do cardápio, ranking): o design punha sempre a de 480 px. Agora
  //    o navegador escolhe entre 240, 320 e 480 px pelo tamanho do lugar (medido: 112 px no cardápio, até 176 nos cartões).
  h = h.replace(/<img\b[^>]*\bsrc="(\/assets\/(?:burgers\/[a-z-]+|cardapio\/\d+))-480\.webp"[^>]*>/g, (tag, src, pos, todo) => {
    if (/\bsrcset=/.test(tag)) return tag;
    const tam = [240, 320].filter(l => fs.existsSync(path.join(ROOT, `${src}-${l}.webp`)));
    if (!tam.length) return tag;
    const lugar = (todo.slice(Math.max(0, pos - 400), pos).match(/class="(sx-card|sx-item|au-row)\b/g) || []).pop() || '';
    const sizes = /sx-card/.test(lugar) ? 'min(41vw, 176px)' : '112px';
    return tag.replace(/<img\b/, `<img srcset="${tam.map(l => `${src}-${l}.webp ${l}w`).concat(`${src}-480.webp 480w`).join(', ')}" sizes="${sizes}"`);
  });
  //  - O design dizia ao navegador que as fotos ocupam a largura da janela (100vw, 115vw...), mas a página é uma
  //    coluna de no máximo 430 px: no computador ele baixava a maior versão. O tamanho ganha o limite da coluna.
  h = h.replace(/(<(?:img|source)\b[^>]*\bsizes=")([^"]*)"/g, (m, ini, s) => {
    const vw = s.match(/(\d+(?:\.\d+)?)vw\s*$/);
    return vw ? `${ini}min(${vw[1]}vw, ${Math.round(+vw[1] * 4.3)}px)"` : m;
  });
  //  - Catálogo da página principal (dados lidos pelo mobile-catalog.js): cada foto leva a lista de versões.
  h = h.replace(/(<script id="mobile-catalog-data" type="application\/json">)([\s\S]*?)(<\/script>)/, (m, a, dados, b) =>
    a + dados.replace(/"image":"(\/assets\/cardapio\/(\d+))\.webp"/g, (mm, base, id) => {
      const tam = [240, 320, 480, 800].filter(l => fs.existsSync(path.join(ROOT, `${base}-${l}.webp`)));
      const [w] = medidas(path.join(ROOT, `${base}.webp`)) || [];
      return tam.length && w ? `${mm},"srcset":"${tam.map(l => `${base}-${l}.webp ${l}w`).concat(`${base}.webp ${w}w`).join(', ')}"` : mm;
    }) + b);
  //  - Toda imagem do site com largura e altura escritas (sem elas a página "pula" enquanto a foto carrega).
  h = h.replace(/<img\b[^>]*>/g, tag => {
    if (/\bwidth=/.test(tag) && /\bheight=/.test(tag)) return tag;
    const src = (tag.match(/\bsrc="(\/assets\/[^"]+)"/) || [])[1];
    const d = src && fs.existsSync(path.join(ROOT, src)) && medidas(path.join(ROOT, src));
    if (!d) return tag;
    return tag.replace(/\s*\b(width|height)="[^"]*"/g, '').replace(/<img\b/, `<img width="${d[0]}" height="${d[1]}"`);
  });

  // 5.2b Ícone do Spotify no topo: o design apontava para a página inicial do Spotify; vai para a playlist do Hicks
  //      (link enviado pelo Neto em 20/10/2026, sem os parâmetros de rastreio).
  h = h.split('href="https://open.spotify.com/"').join(`href="${SPOTIFY}"`).split('aria-label="Spotify do Hicks"').join('aria-label="Playlist do Hicks no Spotify"');

  // 5.2c Playlist da página principal: o player do design buscava cada música por um script da Apple, que a
  //      política de segurança bloqueia, e nada tocava. Agora cada botão leva o endereço da prévia de 30 s
  //      (ferramentas/recursos/previas-musica.json, gerado por buscar-previas.cjs) e o player é o do montador.
  if (h.includes('class="sp-q"')) {
    for (const cl of ['sp-audio', 'sp-btn', 'sp-bar', 'sp-t0', 'sp-t1', 'sp-title', 'sp-back', 'sp-fwd', 'sp-float']) {
      if (!h.includes(cl)) avisos.push(`${rota}: o player da playlist mudou no design (falta .${cl}); conferir recursos/player-playlist.js`);
    }
    if (!/<script[^>]*id="sp-js"/.test(fs.readFileSync(path.join(DESIGN, origem), 'utf8'))) avisos.push(`${rota}: script sp-js não encontrado; o player do montador não entrou`);
    h = h.replace(/(<button type="button" data-i="\d+")(><b>([^<]*)<\/b><span>([^<]*)<\/span>)/g, (m, ini, fim, titulo, artistas) => {
      const previa = PREVIAS[`${decod(titulo)} | ${decod(artistas)}`];
      if (!previa) { avisos.push(`${rota}: "${decod(titulo)}" sem prévia gravada (rodar node ferramentas/buscar-previas.cjs)`); return m; }
      return `${ini} data-src="${esc(previa.url)}"${fim}`;
    });
  }

  // 5.2c2 Capa do vídeo: vai em data-poster e só é baixada quando a seção chega perto (recursos/video-cozinha.js).
  h = h.replace(/(<video\b[^>]*\bdata-src="\/assets\/video\/([^"]+)\.mp4")/g, (m, ini, nome) =>
    fs.existsSync(path.join(ROOT, 'assets', 'video', `${nome}-capa.webp`)) ? `${ini} data-poster="/assets/video/${nome}-capa.webp"` : m);

  // 5.2d Correções de estilo do design. A regra que aumenta o texto de apoio da seção "Qual vai ser hoje?"
  //      pegava também o rótulo "Escolha aqui o seu pedido" (14 px, contra 9 px dos outros rótulos).
  h = h.split('.next .section-heading p,').join('.next .section-heading p:not(.eyebrow),');
  // Mapa da área de entrega: o zoom (+/−) ficava por cima do "Abrir no Google Maps" e vai para a direita; e as
  // imagens do mapa se sobrepõem meio pixel, sem a soma de brilho que o Leaflet usa nas bordas (plus-lighter):
  // com as margens fracionadas do design, essa soma deixava uma linha clara no meio do mapa.
  if (h.includes('id="mapa-entrega"')) h = h.replace('</head>', '<style id="mapa-montador">.sx-regiao.rg5 .rg5-map .leaflet-top.leaflet-left{left:auto;right:0}.rg5-map img.leaflet-tile{mix-blend-mode:normal!important;width:256.5px!important;height:256.5px!important}</style></head>');

  // 5.3 Cabeçalho de SEO: sai o que veio do design, entra o padrão do montador.
  h = h.replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<meta\s+(?:name|property)="(?:description|robots|keywords|og:[^"]*|twitter:[^"]*|geo\.[^"]*)"[^>]*>/g, '')
    .replace(/<link rel="canonical"[^>]*>/g, '');
  const ogImg = rota.startsWith('burgers/') && fs.existsSync(path.join(ROOT, 'og', rota.slice(8) + '.jpg')) ? `${SITE}/og/${rota.slice(8)}.jpg` : `${SITE}/og.jpg`;
  const titulo = subst(seo.titulo), descricao = subst(seo.descricao);
  if (titulo.length > 62) avisos.push(`${rota}: título com ${titulo.length} caracteres`);
  if (descricao.length > 160) throw new Error(`${rota}: descrição com ${descricao.length} caracteres (máximo 160)`);
  // Verificação do Google Search Console (meta tag enviada pelo Neto em 24/10/2026), em todas as páginas.
  const cabecalho = `<title>${esc(titulo)}</title><meta name="google-site-verification" content="ps0_srzsha_JvTpqRwrEoT5bFJdgQapSzyIIOtyUALc"><meta name="description" content="${esc(descricao)}">` +
    `<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}">` +
    `<meta property="og:type" content="${seo.tipo === 'burger' ? 'article' : 'website'}"><meta property="og:site_name" content="Hick’s Burger">` +
    `<meta property="og:locale" content="pt_BR"><meta property="og:url" content="${url}"><meta property="og:title" content="${esc(titulo)}">` +
    `<meta property="og:description" content="${esc(descricao)}"><meta property="og:image" content="${ogImg}">` +
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">` +
    `<meta name="geo.region" content="BR-SP"><meta name="geo.placename" content="Campinas">`;
  if (!/<meta name="viewport"[^>]*>/.test(h)) throw new Error(`${rota}: sem meta viewport`);
  h = h.replace(/(<meta name="viewport"[^>]*>)/, `$1${cabecalho}`);

  // 5.3b A marca é sempre masculina: "o Hicks", "do Hicks", "no Hicks" (regra do Neto, 18/10/2026).
  // (aceita tags entre o artigo e a marca, como em "Destaques da</span> <em><img class="hk-word">")
  h = h.replace(/(^|[^\wÀ-ÿ<\/])(a|da|na|pela|à)((?:<\/[a-z]+>)*\s+(?:<(?!img)[a-z][^>]*>\s*)*)(?=Hick[’']?s|<img[^>]*class="hk-word")/gi, (m, antes, art, esp) => {
    const novo = { a: 'o', da: 'do', na: 'no', pela: 'pelo', 'à': 'ao' }[art.toLowerCase()];
    const caixa = art === art.toUpperCase() && art !== art.toLowerCase() ? novo.toUpperCase() : art[0] !== art[0].toLowerCase() ? novo[0].toUpperCase() + novo.slice(1) : novo;
    return antes + caixa + esp;
  });

  // 5.4 Rodapé "Explore o Hicks" antes da assinatura "by portlink".
  if (!/class="portlink-sign"/.test(h)) throw new Error(`${rota}: sem a assinatura "by portlink"`);
  if (!/class="sx-explorar"/.test(h)) h = h.replace(/(<div class="portlink-wrap">)/, `${EXPLORE}$1`);
  h = h.replace('</head>', `${CSS_EXPLORE}</head>`);

  // 5.5 Dados estruturados a partir do texto visível.
  const v = lerPagina(h);
  if (!v.h1) throw new Error(`${rota}: página sem h1`);
  const restaurante = { '@id': `${HOME}#restaurante` };
  const faqLd = v.perguntas.length ? [{ '@type': 'FAQPage', '@id': `${url}#perguntas`, mainEntity: v.perguntas.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : [];
  const trilhaLd = v.trilha.length ? [{ '@type': 'BreadcrumbList', '@id': `${url}#trilha`, itemListElement: v.trilha.map(([n, href], i) => ({ '@type': 'ListItem', position: i + 1, name: n, ...(href ? { item: SITE + href } : i === v.trilha.length - 1 ? { item: url } : {}) })) }] : [];
  const pagina = { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: titulo, description: descricao, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, about: restaurante, keywords: seo.palavras.join(', '), ...(trilhaLd.length ? { breadcrumb: { '@id': `${url}#trilha` } } : {}) };
  const grafo = [];
  if (seo.tipo === 'home') {
    grafo.push(
      { '@type': 'WebSite', '@id': `${SITE}/#site`, url: HOME, name: 'Hick’s Burger', inLanguage: 'pt-BR', publisher: restaurante },
      { ...pagina, mainEntity: restaurante },
      {
        '@type': 'Restaurant', '@id': `${HOME}#restaurante`, name: 'Hick’s Burger', alternateName: ['Hicks', 'Hicks Burger'],
        description: 'Hamburgueria em Campinas, só delivery: burger autoral e hambúrguer artesanal de Angus e frango crocante no pão brioche. Super Restaurante iFood.',
        url: HOME, logo: `${SITE}/assets/img/hicks-word.png`, image: `${SITE}/og.jpg`, servesCuisine: ['Hambúrguer', 'Hambúrguer artesanal'],
        taxID: '36.635.421/0001-36', address: { '@type': 'PostalAddress', addressLocality: 'Campinas', addressRegion: 'SP', addressCountry: 'BR' },
        areaServed: MAPA ? [{ '@type': 'City', name: 'Campinas' }, { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: MAPA.lat, longitude: MAPA.lng }, geoRadius: MAPA.raio }] : { '@type': 'City', name: 'Campinas' },
        ...(MAPA ? { geo: { '@type': 'GeoCoordinates', latitude: MAPA.lat, longitude: MAPA.lng }, ...(MAPA.link ? { hasMap: MAPA.link } : {}) } : {}),
        hasMenu: `${SITE}/cardapio`, acceptsReservations: false,
        potentialAction: { '@type': 'OrderAction', target: { '@type': 'EntryPoint', urlTemplate: IFOOD, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] } },
        sameAs: [INSTAGRAM, PINTEREST, SPOTIFY_PERFIL, IFOOD],
        openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday'], opens: '18:00', closes: '23:00' }],
        award: ['Super Restaurante iFood', 'Prêmio Hambúrguer Perfeito, Top 10 Campinas'],
      },
      ...faqLd,
    );
  } else if (seo.tipo === 'burger') {
    const nome = v.h1;
    const t = NUTRI[ID_DO_BURGER[rota]];
    const composicao = (v.perguntas.find(([q]) => /^O que vem/.test(q)) || [])[1] || v.resposta;
    grafo.push(
      { ...pagina, mainEntity: { '@id': `${url}#burger` }, ...(v.foto ? { primaryImageOfPage: { '@id': `${url}#foto` } } : {}) },
      ...trilhaLd,
      ...(v.foto ? [{ '@type': 'ImageObject', '@id': `${url}#foto`, contentUrl: SITE + v.foto.src, url: SITE + v.foto.src, caption: v.foto.legenda || v.foto.alt }] : []),
      {
        '@type': 'MenuItem', '@id': `${url}#burger`, name: nome, ...(v.sub ? { alternateName: v.sub } : {}), description: composicao, url,
        ...(v.foto ? { image: SITE + v.foto.src } : {}),
        ...(t ? { nutrition: Object.fromEntries(Object.entries({ '@type': 'NutritionInformation', servingSize: t.porcao, calories: `${t.kcal} kcal`,
          carbohydrateContent: t.n.carb?.[0], sugarContent: t.n.acTot?.[0], proteinContent: t.n.prot?.[0], fatContent: t.n.gord?.[0],
          saturatedFatContent: t.n.sat?.[0], transFatContent: t.n.trans?.[0], fiberContent: t.n.fibra?.[0], sodiumContent: t.n.sodio?.[0] }).filter(([, x]) => x && /\d/.test(x))) } : {}),
        offers: { '@type': 'Offer', url: IFOOD, availability: 'https://schema.org/InStock', areaServed: 'Campinas' },
      },
      ...faqLd,
    );
    if (!t) avisos.push(`${rota}: sem tabela nutricional no mapa`);
  } else if (seo.tipo === 'cardapio') {
    const secoes = [...v.main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2|$)/g)]
      .map(m => ({ nome: txt(m[1]), itens: [...m[2].matchAll(/<li class="sx-item[^"]*">([\s\S]*?)<\/li>/g)].map(x => ({
        nome: txt((x[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || ''), descricao: txt((x[1].match(/<p[^>]*>([\s\S]*?)<\/p>/) || [])[1] || ''),
        href: (x[1].match(/href="([^"]+)"/) || [])[1] || null, img: (x[1].match(/<img[^>]*src="([^"]+)"/) || [])[1] || null })).filter(i => i.nome) }))
      .filter(s => s.itens.length);
    grafo.push(
      { ...pagina, mainEntity: { '@id': `${url}#menu` } }, ...trilhaLd,
      { '@type': 'Menu', '@id': `${url}#menu`, name: 'Cardápio do Hick’s Burger', inLanguage: 'pt-BR', hasMenuSection: secoes.map(s => ({ '@type': 'MenuSection', name: s.nome,
        hasMenuItem: s.itens.map(i => ({ '@type': 'MenuItem', name: i.nome, ...(i.descricao ? { description: i.descricao } : {}), ...(i.href && i.href.startsWith('/burgers/') ? { url: SITE + i.href } : {}), ...(i.img ? { image: SITE + i.img } : {}) })) })) },
    );
  } else {
    const burgers = [...new Set([...v.main.matchAll(/href="(\/burgers\/[a-z0-9-]+)"/g)].map(m => m[1]))];
    grafo.push(
      { ...pagina, ...(burgers.length ? { mainEntity: { '@id': `${url}#lista` } } : {}) }, ...trilhaLd,
      ...(burgers.length ? [{ '@type': 'ItemList', '@id': `${url}#lista`, itemListElement: burgers.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + b })) }] : []),
      ...faqLd,
    );
  }
  h = h.replace('</head>', `${ld({ '@context': 'https://schema.org', '@graph': grafo })}</head>`);

  h = separarColados(h);

  // 5.6 Conferências.
  for (const n of (seo.descricao.match(/\b(Baba-Yaga|Duplo Aversa|Aversa|Montevidéu|Tex-Mex|Vila Nova|Kentucky|Elite|Chicken Salad|Cheese Salada|Cheese Burger|Quarterão|O Clássico|Shake Shack|Méqui|jalapeño|sriracha|Catupiry|alho frito|onion rings|Top 10)\b/g) || [])) {
    if (!v.visivel.includes(n)) avisos.push(`${rota}: a descrição cita "${n}", que não aparece no texto da página`);
  }
  if (/(?:^|[^\wÀ-ÿ])(?:a|da|na|pela|à)\s+(?:Hick[’']?s|<img class="hk-word")/i.test(v.visivel)) avisos.push(`${rota}: marca no feminino`);
  if (/segue o bulldog/i.test(v.visivel)) throw new Error(`${rota}: "Segue o Bulldog" voltou`);
  if (/estimativa|estimad[ao]s?\b/i.test(v.visivel)) avisos.push(`${rota}: texto com "estimativa"`);
  if (/(duas|2) fatias de (<[^>]+>)*muçarela/i.test(h)) avisos.push(`${rota}: Baba-Yaga com "duas fatias de muçarela" (leva frango no lugar de uma); conferir CORRECOES`);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) avisos.push(`${rota}: ${(h.match(/<h1[\s>]/g) || []).length} h1`);
  if (/\son[a-z]+="/i.test(h.slice(h.indexOf('<body')))) avisos.push(`${rota}: atributo on...="" (bloqueado pela política de segurança)`);

  // 5.7 Versão no endereço de fotos, fontes e vídeo (cache de um ano; ver versao()).
  h = versionar(h);

  resultado.push({ rota, url, html: h, foto: v.foto, h1: v.h1, perguntas: v.perguntas, seo });
}

// ---------------------------------------------------------------------------------------------
// 6) Gravação: scripts extraídos, páginas, e limpeza das páginas que saíram do site.
for (const [nome, codigo] of scriptsExtraidos) fs.writeFileSync(path.join(ROOT, 'assets', 'js', nome), codigo);
const SAIRAM = ['index', 'historia', 'bastidores', 'central', 'qual-hamburguer-escolher', 'hamburguer-de-frango-crocante',
  'hamburgueria-aberta-a-noite-campinas', 'hamburguer-angus', 'horarios-e-entrega'];
for (const s of SAIRAM) fs.rmSync(path.join(ROOT, `${s}.html`), { force: true });
fs.rmSync(path.join(ROOT, 'burgers'), { recursive: true, force: true });
for (const r of resultado) {
  const arq = path.join(ROOT, `${r.rota}.html`);
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, r.html);
}

// Conferência de links internos e arquivos citados (todos precisam existir no site montado).
const faltando = [];
const existeRota = u => { const b = u.split('#')[0].split('?')[0].replace(/^\//, ''); return b === '' || fs.existsSync(path.join(ROOT, b)) || fs.existsSync(path.join(ROOT, b + '.html')); };
for (const r of resultado) {
  for (const m of r.html.matchAll(/\b(?:src|href|data-src|poster)="(\/[^"]*)"/g)) if (!existeRota(m[1])) faltando.push(`${r.rota}: ${m[1]}`);
  for (const m of r.html.matchAll(/\bsrcset="([^"]*)"/g)) for (const s of m[1].split(',')) { const u = s.trim().split(/\s+/)[0]; if (u.startsWith('/') && !existeRota(u)) faltando.push(`${r.rota}: ${u}`); }
}
if (faltando.length) throw new Error('links ou arquivos inexistentes:\n' + [...new Set(faltando)].slice(0, 20).join('\n'));

// Política de segurança (vercel.json): libera os scripts que ficaram dentro das páginas, pela impressão digital.
{
  const arq = path.join(ROOT, 'vercel.json');
  const antes = fs.readFileSync(arq, 'utf8'), cfg = JSON.parse(antes);
  let achou = false;
  for (const regra of cfg.headers) for (const c of regra.headers) if (c.key === 'Content-Security-Policy') {
    c.value = c.value.replace(/script-src [^;]*/, `script-src 'self'${[...impressoes].sort().map(i => ' ' + i).join('')}`);
    achou = true;
  }
  if (!achou) avisos.push('vercel.json sem Content-Security-Policy: scripts dentro da página não liberados');
  const depois = JSON.stringify(cfg, null, 2) + '\n';
  if (depois !== antes) fs.writeFileSync(arq, depois);
  if (impressoes.size > 1) avisos.push(`${impressoes.size} versões diferentes do script de dentro da página (esperado: 1)`);
}

// ---------------------------------------------------------------------------------------------
// 7) Mapa do site (com fotos), robots.txt e llms.txt.
const xml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const prio = r => r.seo.tipo === 'home' ? '1.0' : r.seo.tipo === 'cardapio' ? '0.9' : '0.8';
const ordem = [...resultado].sort((a, b) => ['home', 'cardapio', 'guia', 'burger'].indexOf(a.seo.tipo) - ['home', 'cardapio', 'guia', 'burger'].indexOf(b.seo.tipo));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${ordem.map(r => `  <url><loc>${r.url}</loc><lastmod>${HOJE}</lastmod><priority>${prio(r)}</priority>${r.foto ? `<image:image><image:loc>${SITE}${r.foto.src}</image:loc><image:title>${xml(r.h1)}</image:title><image:caption>${xml(r.foto.legenda || r.foto.alt)}</image:caption></image:image>` : ''}</url>`).join('\n')}
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
const kcal = rota => { const t = NUTRI[ID_DO_BURGER[rota]]; return t ? ` ${t.kcal.toLocaleString('pt-BR')} kcal e ${t.n.prot[0]} de proteínas por lanche.` : ''; };
const burgersOrdem = ordem.filter(r => r.seo.tipo === 'burger');
fs.writeFileSync(path.join(ROOT, 'llms.txt'), `# Hick’s Burger (o Hicks)

> Hamburgueria em Campinas (SP), só delivery. Burger autoral e hambúrguer artesanal de carne Angus e de frango crocante no pão brioche, feitos na base da Vila Boa Vista. Pedidos exclusivamente pelo iFood, de quarta a segunda, das 18h às 23h (terça fechado). Super Restaurante iFood há ${MESES} meses seguidos (contagem de ${MES_ANO}).

## Fatos
- Nome: Hick’s Burger, chamado de "o Hicks". CNPJ 36.635.421/0001-36.
- Cidade: Campinas, SP. Base de delivery na Vila Boa Vista. Não há consumo nem retirada no local.
- Como pedir: iFood (${IFOOD}). ${MAPA ? `Área de entrega: raio de ${MAPA.raio / 1000} km a partir da base na Vila Boa Vista${MAPA.link ? ` (mapa: ${MAPA.link})` : ''}; o iFood confirma ao informar o endereço.` : 'A área de entrega aparece no iFood ao informar o endereço.'}
- Horário: quarta a segunda, das 18h às 23h, inclusive domingo e segunda. Terça-feira fechado.
- Reconhecimentos: Super Restaurante iFood (${MESES} meses seguidos em ${MES_ANO}), placa de 12 meses consecutivos 2024–2025, Prêmio Hambúrguer Perfeito (Top 10 Campinas), Padrão e Constância 365 Dias, selo Angus Brasil, Brazil Beef Quality.
- Mais vendidos: Duplo Aversa (campeão de vendas), Aversa, O Clássico e Baba-Yaga. Único apimentado: Tex-Mex.
- Informação nutricional completa de cada burger, fornecida pelo Hicks, na página de cada lanche.
- Instagram: ${INSTAGRAM} · Pinterest: ${PINTEREST} · Spotify: ${SPOTIFY_PERFIL} (playlist: ${SPOTIFY})

## Páginas
${ordem.filter(r => r.seo.tipo !== 'burger').map(r => `- [${r.h1.replace(/\.$/, '')}](${r.url}): ${subst(r.seo.descricao)}`).join('\n')}

## Burgers
${burgersOrdem.map(r => `- [${r.h1}](${r.url}): ${(r.perguntas.find(([q]) => /^O que vem/.test(q)) || ['', subst(r.seo.descricao)])[1]}${kcal(r.rota)}`).join('\n')}
`);

// ---------------------------------------------------------------------------------------------
// 8) Relatório.
console.log(`páginas: ${resultado.length} (${resultado.filter(r => r.seo.tipo === 'burger').length} burgers) · scripts extraídos: ${scriptsExtraidos.size}`);
if (avisos.length) console.log('AVISOS:\n- ' + avisos.join('\n- ')); else console.log('sem avisos');
