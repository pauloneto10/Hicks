// Busca no catálogo do iTunes a prévia (trecho de 30 s) de cada música da playlist da página principal
// e grava os endereços em ferramentas/recursos/previas-musica.json. O montador lê esse arquivo e coloca
// o endereço em cada botão da lista: assim a música toca no mesmo toque (o iPhone só libera som dentro
// do toque) e o site não precisa chamar a Apple antes de a pessoa clicar.
// Uso: node ferramentas/buscar-previas.cjs   (rodar de novo só quando a playlist do design mudar)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DESIGN = path.resolve(ROOT, '..', 'fonte', 'design', 'portlink.html');
const SAIDA = path.join(__dirname, 'recursos', 'previas-musica.json');
const espera = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();
const semParenteses = s => s.replace(/\(.*?\)/g, '').trim();
const decod = s => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');

const html = fs.readFileSync(DESIGN, 'utf8');
const lista = (html.match(/<ol class="sp-q"[\s\S]*?<\/ol>/) || [''])[0];
const musicas = [...lista.matchAll(/<b>([^<]*)<\/b><span>([^<]*)<\/span>/g)].map(m => ({ titulo: decod(m[1]), artistas: decod(m[2]) }));
if (!musicas.length) throw new Error('playlist (ol.sp-q) não encontrada em fonte/design/portlink.html');

// Nota de cada resultado: artista certo, nome da faixa certo e, quando a música é uma versão
// (Remix, Tek-House, 2025), a mesma versão.
function nota(r, m) {
  const artistas = m.artistas.split(',').map(norm).filter(Boolean);
  const faixa = norm(r.trackName), base = norm(semParenteses(m.titulo));
  const versao = norm((m.titulo.match(/\((.*?)\)/) || [])[1] || '');
  const quem = ` ${norm(r.artistName)} `;
  let n = 0;
  if (quem.includes(` ${artistas[0]} `)) n += 4; else if (artistas.some(a => quem.includes(` ${a} `))) n += 2;
  if (faixa === base) n += 3; else if (faixa.startsWith(base + ' ')) n += 2; else if (faixa.includes(base)) n += 1;
  if (versao) { const certas = versao.split(' ').filter(p => faixa.includes(p)).length; n += certas || -2; }
  else if (/remix|mix|live|ao vivo|acoustic|instrumental|karaoke|version|sped up|slowed/.test(faixa.slice(base.length))) n -= 2;
  return n;
}

async function buscar(termo) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const r = await fetch(`https://itunes.apple.com/search?entity=song&limit=15&country=BR&term=${encodeURIComponent(termo)}`);
    if (r.status === 403 || r.status === 429) { await espera(20000); continue; } // limite de buscas da Apple
    if (!r.ok) throw new Error(`iTunes respondeu ${r.status}`);
    return ((await r.json()).results || []).filter(x => x.previewUrl);
  }
  throw new Error('iTunes recusou as buscas (limite por minuto)');
}

(async () => {
  const antigo = fs.existsSync(SAIDA) ? JSON.parse(fs.readFileSync(SAIDA, 'utf8')) : {};
  const novo = {};
  for (const m of musicas) {
    const chave = `${m.titulo} | ${m.artistas}`;
    const primeiro = m.artistas.split(',')[0].trim();
    let melhor = null;
    for (const termo of [`${m.titulo} ${primeiro}`, `${semParenteses(m.titulo)} ${primeiro}`]) {
      const achados = (await buscar(termo)).map(r => ({ r, n: nota(r, m) })).sort((a, b) => b.n - a.n);
      if (achados[0] && (!melhor || achados[0].n > melhor.n)) melhor = achados[0];
      await espera(3200);
      if (melhor && melhor.n >= 7) break;
    }
    if (melhor && melhor.n >= 6) {
      novo[chave] = { url: melhor.r.previewUrl, faixa: melhor.r.trackName, artista: melhor.r.artistName, nota: melhor.n };
      console.log(`ok   ${chave}  →  ${melhor.r.trackName} · ${melhor.r.artistName} (nota ${melhor.n})`);
    } else if (antigo[chave]) {
      novo[chave] = antigo[chave];
      console.log(`AVISO ${chave}: sem resultado confiável agora; mantido o endereço anterior`);
    } else {
      console.log(`AVISO ${chave}: sem prévia confiável no iTunes${melhor ? ` (melhor: ${melhor.r.trackName} · ${melhor.r.artistName}, nota ${melhor.n})` : ''}; o player busca na hora do toque`);
    }
  }
  fs.writeFileSync(SAIDA, JSON.stringify(novo, null, 2) + '\n');
  console.log(`\n${Object.keys(novo).length} de ${musicas.length} músicas com prévia → ${path.relative(ROOT, SAIDA)}`);
})();
