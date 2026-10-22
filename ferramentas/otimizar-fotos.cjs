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
  { pasta: 'assets/img/selos', tipo: 'webp', largura: 420, qualidade: 80 },
  { pasta: 'assets/img', tipo: 'jpg', qualidade: 78 },
  { pasta: 'assets/img', tipo: 'webp', qualidade: 78 },
];
const VERSAO = 'v1'; // mudar quando mudar a regra, para refazer o cache

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
  const mb = n => (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
  console.log(`fotos: ${total} conferidas, ${trocados} recomprimidas · ${mb(antes)} → ${mb(depois)}`);
})().catch(e => { console.error('otimizar-fotos:', e.message); process.exit(1); });
