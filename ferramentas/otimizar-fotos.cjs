// Recomprime as fotos que vêm do design e gera de verdade as versões menores. O export do Claude Design traz
// <foto>-480.webp e <foto>-800.webp como cópias idênticas da foto de 1100 px (mesmo arquivo, 90 a 200 KB cada),
// então o celular baixava a foto inteira mesmo quando mostrava pequena. Aqui cada versão sai no tamanho do nome.
// Uso: chamado pelo montar-design.cjs depois de copiar os arquivos do design (também roda sozinho).
// Resultado guardado em ferramentas/.cache-fotos (pelo conteúdo do arquivo), para a montagem não refazer tudo.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const CACHE = path.join(__dirname, '.cache-fotos');
fs.mkdirSync(CACHE, { recursive: true });

// Regra de cada pasta: largura máxima (o sufixo -480/-800 manda quando existir) e qualidade do WebP.
const QUALIDADE = { 480: 72, 800: 74, 1100: 76 };
const REGRAS = [
  { pasta: 'assets/burgers', tipo: 'webp' },
  { pasta: 'assets/cardapio', tipo: 'webp' },
  // Selos: aparecem com no máximo 71 px (medido nas 19 páginas, celular e computador); 216 px cobre telas de 3x.
  { pasta: 'assets/img/selos', tipo: 'webp', largura: 216, qualidade: 80 },
  { pasta: 'assets/img', tipo: 'jpg', qualidade: 78 },
  { pasta: 'assets/img', tipo: 'webp', qualidade: 78 },
];
const VERSAO = 'v1'; // mudar quando mudar a regra, para refazer o cache

// Versões pequenas (<nome>-<largura>.<ext>) de fotos e logos que aparecem miúdos. As larguras saem do tamanho em
// que cada imagem aparece (medido no Chrome nas 19 páginas, em tela de celular e de computador, 18/11/2026) vezes
// 2 e 3, para telas de alta densidade. O original continua: alguns são também fundo grande no CSS. O montador usa
// esta mesma tabela para escrever o srcset (lista de tamanhos que o navegador escolhe) nas tags <img>.
const VARIANTES = [
  { arq: 'assets/cardapio/*.webp', padrao: /^\d+\.webp$/, larguras: [240, 320] },           // miniaturas e capas do cardápio (56 a 160 px)
  { arq: 'assets/burgers/*.webp', padrao: /^[a-z]+(?:-[a-z]+)*\.webp$/, larguras: [240, 320] }, // burgers nas listas (112 a 176 px)
  ...['365', 'angus', 'brazil-beef', 'ifood', 'top-10'].map(n =>                              // selos (46 a 71 px)
    ({ arq: `assets/img/selos/${n}.webp`, larguras: [96, 128], sizes: '60px' })),
  { arq: 'assets/img/trilha-banco-2.jpg', larguras: [480, 640], sizes: 'min(88vw, 380px)' }, // foto da playlist (até 380 px)
  { arq: 'assets/img/ifood-reconhecimento.jpg', larguras: [180, 260], sizes: '84px' },        // placa (84 px; o fundo da página usa o original)
  { arq: 'assets/img/bulldog-white.png', larguras: [104, 156], sizes: '52px' },               // bulldog do rodapé (30 a 52 px; fundo usa o original)
  { arq: 'assets/img/hicks-word.png', larguras: [96, 144], sizes: '48px' },                   // "Hick’s" dentro do texto (até 43 px)
  { arq: 'assets/img/hicks-h.png', larguras: [32, 48], sizes: '16px' },                       // H da faixa do manifesto (13 px)
  { arq: 'assets/img/spotify-logo-white.png', larguras: [128, 192], sizes: '60px' },          // logo do Spotify (60 px)
  { arq: 'assets/img/spotify-icon-white.png', larguras: [56, 80], sizes: '26px' },            // ícone do Spotify (25 px)
  { arq: 'assets/img/logo-ifood-white.png', larguras: [72, 105], sizes: '35px' },             // logo do iFood do botão do topo (35 px)
];
module.exports = { VARIANTES };
if (require.main !== module) return;

(async () => {
  let antes = 0, depois = 0, trocados = 0, total = 0;
  for (const r of REGRAS) {
    const dir = path.join(ROOT, r.pasta);
    if (!fs.existsSync(dir)) continue;
    for (const nome of fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith('.' + r.tipo))) {
      const arq = path.join(dir, nome);
      const original = fs.readFileSync(arq);
      const sufixo = (nome.match(/-(480|800)\.webp$/) || [])[1];
      const largura = sufixo ? +sufixo : (r.largura || 1100);
      const qualidade = r.qualidade || QUALIDADE[largura] || 76;
      const chave = crypto.createHash('sha1').update(original).update(`${VERSAO}:${r.tipo}:${largura}:${qualidade}`).digest('hex');
      const emCache = path.join(CACHE, `${chave}.${r.tipo}`);
      let novo;
      if (fs.existsSync(emCache)) novo = fs.readFileSync(emCache);
      else {
        let img = sharp(original).resize({ width: largura, height: largura, fit: 'inside', withoutEnlargement: true });
        novo = r.tipo === 'jpg'
          ? await img.jpeg({ quality: qualidade, mozjpeg: true, progressive: true }).toBuffer()
          : await img.webp({ quality: qualidade, effort: 6, smartSubsample: true }).toBuffer();
        // Só troca quando a economia passa de 10%; senão o cache guarda o original.
        if (novo.length > original.length * 0.9) novo = original;
        fs.writeFileSync(emCache, novo);
      }
      total++; antes += original.length; depois += novo.length;
      if (novo !== original && !novo.equals(original)) { fs.writeFileSync(arq, novo); trocados++; }
    }
  }
  // Versões pequenas, feitas a partir do arquivo já recomprimido.
  let novas = 0;
  for (const v of VARIANTES) {
    const dir = path.join(ROOT, path.dirname(v.arq));
    const base = path.basename(v.arq);
    const nomes = v.padrao ? (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(n => v.padrao.test(n)) : [base];
    for (const nome of nomes) {
      const arq = path.join(dir, nome);
      if (!fs.existsSync(arq)) { console.log(`otimizar-fotos: ${v.arq} não veio no design (versões pequenas não geradas)`); continue; }
      const ext = path.extname(nome).slice(1).toLowerCase();
      const original = fs.readFileSync(arq);
      for (const largura of v.larguras) {
        const chave = crypto.createHash('sha1').update(original).update(`${VERSAO}:variante:${largura}`).digest('hex');
        const emCache = path.join(CACHE, `${chave}.${ext}`);
        let novo;
        if (fs.existsSync(emCache)) novo = fs.readFileSync(emCache);
        else {
          const img = sharp(original).resize({ width: largura, withoutEnlargement: true });
          novo = ext === 'png' ? await img.png({ compressionLevel: 9, palette: true, quality: 92, effort: 10 }).toBuffer()
            : ext === 'jpg' ? await img.jpeg({ quality: 78, mozjpeg: true, progressive: true }).toBuffer()
            : await img.webp({ quality: 74, effort: 6, smartSubsample: true }).toBuffer();
          fs.writeFileSync(emCache, novo);
        }
        fs.writeFileSync(path.join(dir, nome.replace(/\.(\w+)$/, `-${largura}.$1`)), novo);
        novas++;
      }
    }
  }
  if (novas) console.log(`fotos: ${novas} versões pequenas geradas`);
  const mb = n => (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
  console.log(`fotos: ${total} conferidas, ${trocados} recomprimidas · ${mb(antes)} → ${mb(depois)}`);
})().catch(e => { console.error('otimizar-fotos:', e.message); process.exit(1); });
