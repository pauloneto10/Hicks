// Servidor local que imita a Vercel (vercel.json): endereços limpos, redirecionamentos e cabeçalhos.
// Uso: node ferramentas/servidor-local.cjs [porta]   →   http://localhost:4400/portlink
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORTA = Number(process.argv[2]) || 4400;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.svg': 'image/svg+xml',
};
// Converte o padrão da Vercel ("/assets/(img|fonts)/(.*)") em expressão regular.
const padrao = src => new RegExp('^' + src.replace(/:path\*/g, '(.*)') + '$');

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  let p = decodeURIComponent(url.pathname);
  for (const r of config.redirects || []) {
    if (r.has) continue; // regra de domínio (hicks-burger.vercel.app) não se aplica no localhost
    if (padrao(r.source).test(p)) { res.writeHead(r.permanent ? 308 : 307, { Location: r.destination }); return res.end(); }
  }
  // cleanUrls: /pagina.html → /pagina
  if (config.cleanUrls && p.endsWith('.html')) { res.writeHead(308, { Location: p.slice(0, -5) }); return res.end(); }
  let arq = path.join(ROOT, p);
  if (!arq.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(arq) || fs.statSync(arq).isDirectory()) arq += '.html';
  if (!fs.existsSync(arq) || /[\\/](ferramentas|docs|\.git|\.vercel)[\\/]/.test(arq)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — página não encontrada');
  }
  const cab = { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream' };
  for (const h of config.headers || []) if (padrao(h.source).test(p)) for (const { key, value } of h.headers) if (!(key in cab)) cab[key] = value;
  // No localhost não há HTTPS: sai o HSTS e o "upgrade-insecure-requests"; o resto da CSP vale, para pegar
  // qualquer script ou recurso que seria bloqueado no ar.
  delete cab['Strict-Transport-Security'];
  if (cab['Content-Security-Policy']) cab['Content-Security-Policy'] = cab['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
  res.writeHead(200, cab);
  fs.createReadStream(arq).pipe(res);
}).listen(PORTA, () => console.log(`Hicks no localhost: http://localhost:${PORTA}/portlink`));
