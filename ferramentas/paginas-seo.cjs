// Moldes das páginas de SEO do Hicks: uma página por burger, os guias de decisão e o cardápio completo.
// Recebe o conteúdo de conteudo-seo.cjs e devolve o HTML pronto (com dados estruturados) de cada página.
// Visual: os mesmos componentes e cores da Portlink (cabeçalho, rodapé, botão do iFood, camadas do lanche).
const { GLOSSARIO, BURGERS, GUIAS } = require('./conteudo-seo.cjs');
const { NUTRI, ORDEM, kcalTxt, NOTA_VD } = require('./nutricao.cjs');
const fmtK = n => n.toLocaleString('pt-BR');
// Tabela nutricional completa (página de cada burger): calorias em destaque e cada nutriente com barra de %VD.
const vdNum = vd => { const m = /([\d.,]+)/.exec(vd || ''); return m ? parseFloat(m[1].replace(',', '.')) : null; };
const tabelaNutri = (id, nome) => {
  const t = NUTRI[id]; if (!t) return '';
  const linhas = ORDEM.filter(([k]) => t.n[k]).map(([k, rot]) => { const [v, vd] = t.n[k]; const x = vdNum(vd);
    return `<tr><th scope="row">${esc(rot)}</th><td>${esc(v)}</td><td class="sx-vd">${vd === '**' ? '**' : esc(vd)}${x !== null && vd !== '**' ? `<i aria-hidden="true"><b style="width:${Math.min(100, x)}%"></b></i>` : ''}</td></tr>`; }).join('');
  return `<table class="sx-tn"><caption>Informação nutricional · ${esc(nome)}</caption><thead><tr><th scope="col">Porção: ${esc(t.porcao)}</th><th scope="col">Quantidade</th><th scope="col">%VD*</th></tr></thead><tbody>` +
    `<tr class="sx-tn-k"><th scope="row">Valor energético</th><td>${fmtK(t.kcal)} kcal</td><td class="sx-vd">${esc(t.kcalVD)}</td></tr>${linhas}</tbody></table>` +
    `<p class="sx-nota">${t.aprox ? 'Valores aproximados. ' : ''}Informação nutricional fornecida pelo Hicks.${Object.values(t.n).some(([, vd]) => vd === '**') ? ' ** %VD não estabelecido para açúcares totais.' : ''} *${NOTA_VD}</p>`;
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const porSlug = Object.fromEntries(BURGERS.map(b => [b.slug, b]));
const OBVIOS = new Set(['Tomate', 'Alface', 'Alface americana', 'Cebola', 'Cebola roxa', 'Ketchup', 'Mostarda']);
// Nome do burger sem quebra no meio ("Baba-Yaga" não pode virar "Baba-" / "Yaga").
const nw = s => `<span class="sx-nw">${esc(s)}</span>`;
const sa = b => b.nome.replace(/^O /, '');

// Estilos das páginas novas e da seção nova da página principal (mesmos tokens da Portlink).
const CSS = `
.sx-wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.sx-nw{white-space:nowrap}
.sx-ings-h{margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9A968D}
@media(min-width:651px){.sx-wrap{padding:0 40px}}
.sx-trilha{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:22px 0 0;padding:0;list-style:none;font-size:12px;color:#9A968D}
.sx-trilha a{color:#A19E95;text-decoration:none;border-bottom:1px solid transparent}
.sx-trilha a:hover{color:#F3F0E8;border-color:#F3F0E8}
.sx-trilha li+li::before{content:'›';margin-right:6px;color:#8C8981}
.sx-hero{display:grid;gap:26px;padding:22px 0 44px}
@media(min-width:861px){.sx-hero{grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);align-items:center;gap:56px;padding:34px 0 64px}}
.sx-foto{margin:0;border-radius:24px;overflow:hidden;background:#151514;border:1px solid #23231F}
.sx-foto img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover}
.sx-foto figcaption{padding:12px 16px;font-size:12px;line-height:1.5;color:#9A968D;border-top:1px solid #1F1F1C}
.sx-h1{font-family:var(--display);font-weight:800;text-transform:uppercase;font-size:clamp(52px,12vw,96px);line-height:.92;letter-spacing:-.01em;margin:12px 0 8px;color:#F3F0E8}
.sx-h1-guia{text-transform:none;font-size:clamp(44px,9vw,84px);letter-spacing:-.025em;line-height:.98;margin-bottom:18px}
.sx-sub{font-size:17px;color:#A19E95;margin:0 0 18px}
.sx-selos{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 18px}
.sx-selos span{border:1px solid #3A3A36;border-radius:999px;padding:6px 11px;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#F3F0E8}
.sx-selos .sx-quente{border-color:#fe001a;color:#ff6b6b}
.sx-resposta{font-size:17px;line-height:1.6;color:#C9C5BB;margin:0 0 6px;max-width:560px;text-wrap:pretty}
.sx-para{font-size:14px;color:#9A968D;margin:10px 0 0}
.sx-acoes{max-width:420px}
.sx-acoes .access-actions{margin-top:22px!important;max-width:none!important}
.sx-link{display:inline-flex;gap:8px;align-items:center;margin-top:16px;font-size:13px;color:#F3F0E8;text-decoration:none;border-bottom:1px solid #F3F0E8;padding-bottom:3px}
.sx-sec{padding:46px 0;border-top:1px solid #1F1F1C}
@media(min-width:861px){.sx-sec{padding:64px 0}}
.sx-h2{font-family:var(--display);font-weight:700;font-size:clamp(34px,6.4vw,54px);line-height:1;letter-spacing:-.02em;margin:10px 0 20px;color:#F3F0E8}
.sx-h2 em{font-style:normal;color:#8C8981}
.sx-texto p{font-size:16px;line-height:1.7;color:#C9C5BB;margin:0 0 14px;max-width:680px;text-wrap:pretty}
.sx-dois{display:grid;gap:30px}
@media(min-width:861px){.sx-dois{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:60px;align-items:start}}
.sx-camadas{border:1px solid #23231F;border-radius:22px;padding:20px 18px;background:#121211}
.sx-camadas h3,.sx-nutri h3{margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9A968D;display:flex;justify-content:space-between}
.sx-ings{display:grid;gap:0;margin:0;padding:0;list-style:none}
.sx-ings li{padding:14px 0;border-bottom:1px solid #1F1F1C}
.sx-ings b{display:block;font-size:15px;font-weight:600;color:#F3F0E8;margin-bottom:3px}
.sx-ings span{font-size:14px;line-height:1.55;color:#A19E95}
.sx-nutri{border:1px solid #23231F;border-radius:22px;padding:22px 20px;background:#121211;max-width:640px}
.sx-kcal{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.sx-kcal strong{font-family:var(--display);font-weight:800;font-size:clamp(54px,11vw,76px);line-height:.9;color:#F3F0E8;font-variant-numeric:tabular-nums}
.sx-kcal small{font-size:13px;color:#A19E95}
.sx-regua{position:relative;height:10px;border-radius:999px;background:#22221F;margin:20px 0 8px}
.sx-regua i{position:absolute;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#F2B53A,#fe001a)}
.sx-regua-leg{display:flex;justify-content:space-between;font-size:11px;color:#9A968D;letter-spacing:.04em}
.sx-pos{font-size:14px;color:#C9C5BB;margin:14px 0 0}
.sx-pesos{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.sx-pesos li{border-radius:14px;background:#1A1A18;padding:10px 12px;min-width:92px}
.sx-pesos b{display:block;font-family:var(--display);font-size:24px;font-weight:700;color:#F3F0E8;line-height:1}
.sx-pesos span{font-size:11px;color:#A19E95}
.sx-nutri dl{margin:18px 0 0;display:grid;gap:0}
.sx-nutri dl div{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid #22221F;font-size:14px}
.sx-nutri dt{color:#A19E95}.sx-nutri dd{margin:0;color:#F3F0E8;font-weight:600;text-align:right}
.sx-nutri-grade{display:grid;gap:16px}
@media(min-width:861px){.sx-nutri-grade{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start}}
.sx-nutri-grade .sx-nutri{max-width:none}
.sx-tn-box{border:1px solid #23231F;border-radius:22px;background:#121211;padding:18px 18px 14px;overflow-x:auto}
.sx-tn{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
.sx-tn caption{text-align:left;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9A968D;padding-bottom:10px}
.sx-tn thead th{font-size:11px;font-weight:600;color:#9A968D;text-align:left;padding:8px 0;border-bottom:1px solid #2A2A27}
.sx-tn thead th+th{text-align:right}
.sx-tn tbody th{font-weight:400;color:#C9C5BB;text-align:left;padding:9px 8px 9px 0;border-bottom:1px solid #1F1F1C}
.sx-tn td{color:#F3F0E8;font-weight:600;text-align:right;padding:9px 0 9px 10px;border-bottom:1px solid #1F1F1C;white-space:nowrap}
.sx-tn .sx-tn-k th,.sx-tn .sx-tn-k td{font-size:15px;color:#F3F0E8;font-weight:700}
.sx-vd{min-width:92px}
.sx-vd i{display:block;height:4px;border-radius:2px;background:#22221F;margin-top:5px;overflow:hidden}
.sx-vd i b{display:block;height:100%;border-radius:2px;background:#F2B53A}
.sx-nota{font-size:12px;line-height:1.5;color:#9A968D;margin:14px 0 0}
.sx-combo{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;border:1px solid #23231F;border-radius:22px;padding:20px;background:#121211;max-width:640px}
.sx-combo b{display:block;font-family:var(--display);font-size:26px;font-weight:700;color:#F3F0E8;text-transform:uppercase}
.sx-combo span{font-size:14px;color:#A19E95}
.sx-faq{max-width:760px}
.sx-faq details{border-bottom:1px solid #22221F;padding:4px 0}
.sx-faq summary{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:16px 0;font-size:16px;color:#F3F0E8;cursor:pointer;list-style:none}
.sx-faq summary::-webkit-details-marker{display:none}
.sx-faq summary::after{content:'+';flex:0 0 34px;height:34px;display:grid;place-items:center;border-radius:50%;background:#1F1F1C;color:#F3F0E8;font-size:18px;transition:transform .2s}
.sx-faq details[open] summary::after{transform:rotate(45deg)}
.sx-faq p{margin:0 0 16px;font-size:15px;line-height:1.65;color:#C9C5BB;max-width:680px}
.sx-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}
@media(min-width:861px){.sx-cards{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}
.sx-card a{display:block;height:100%;text-decoration:none;border:1px solid #23231F;border-radius:20px;overflow:hidden;background:#121211;transition:border-color .2s,transform .15s}
.sx-card a:hover{border-color:#5A5A52}.sx-card a:active{transform:scale(.98)}
.sx-card img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover;background:#151514}
.sx-card div{padding:12px 14px 14px}
.sx-card b{display:block;font-family:var(--display);font-size:22px;font-weight:700;text-transform:uppercase;line-height:1;color:#F3F0E8}
.sx-card span{display:block;font-size:12px;color:#A19E95;margin-top:5px;line-height:1.35}
.sx-um{grid-template-columns:minmax(0,1fr)!important;max-width:460px}
.sx-um .sx-card a{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center}
.sx-um .sx-card img{height:100%}
.sx-card em{display:inline-block;font-style:normal;font-size:12px;color:#F3F0E8;margin-top:10px;border-bottom:1px solid #F3F0E8}
.sx-lista{display:grid;gap:10px;margin:0;padding:0;list-style:none;max-width:760px}
.sx-lista li{border:1px solid #23231F;border-radius:18px;background:#121211}
.sx-lista li>a,.sx-lista li>div{display:block;padding:16px 18px;text-decoration:none}
.sx-lista b{display:block;font-size:16px;font-weight:600;color:#F3F0E8;margin-bottom:4px}
.sx-lista span{font-size:14px;line-height:1.55;color:#A19E95}
.sx-lista a b::after{content:' ↗\\FE0E';color:#9A968D}
.sx-lista a:hover{background:#161615}
.sx-rank{display:grid;gap:8px;margin:0;padding:0;list-style:none;max-width:760px}
.sx-rank a{display:grid;grid-template-columns:minmax(110px,170px) minmax(0,1fr) auto;align-items:center;gap:12px;text-decoration:none;font-size:14px;color:#F3F0E8;padding:6px 0}
.sx-rank .sx-regua{margin:0;height:8px}
.sx-rank small{color:#A19E95;font-variant-numeric:tabular-nums;white-space:nowrap}
.sx-horario{max-width:520px;margin:0}
.sx-horario div{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #22221F;font-size:16px}
.sx-horario dt{color:#C9C5BB}.sx-horario dd{margin:0;color:#F3F0E8;font-weight:600}
.sx-selos-img{display:flex;flex-wrap:wrap;gap:14px;margin:6px 0 0;padding:0;list-style:none}
.sx-selos-img li{width:96px;text-align:center;font-size:11px;line-height:1.3;color:#A19E95}
.sx-selos-img img{width:96px;height:96px;object-fit:contain;margin:0 auto 6px}
.sx-final{text-align:center;padding:56px 0 64px;border-top:1px solid #1F1F1C}
.sx-final .sx-h2{margin-bottom:10px}
.sx-final p{color:#A19E95;font-size:15px;margin:0 0 6px}
.sx-final .sx-acoes{margin:0 auto}
.sx-indice{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 6px;padding:0;list-style:none}
.sx-indice a{display:inline-block;border:1px solid #3A3A36;border-radius:999px;padding:8px 14px;font-size:13px;color:#F3F0E8;text-decoration:none}
.sx-indice a:hover{background:#F3F0E8;color:#0E0E0D}
.sx-menu{display:grid;gap:0;margin:0;padding:0;list-style:none;max-width:860px}
.sx-menu li{display:grid;grid-template-columns:64px minmax(0,1fr);gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #1F1F1C}
.sx-menu li.sx-semfoto{grid-template-columns:minmax(0,1fr)}
.sx-menu img{width:64px;height:64px;border-radius:14px;object-fit:cover;background:#151514}
.sx-menu h3{margin:0;font-size:16px;font-weight:600;color:#F3F0E8}
.sx-menu h3 a{color:inherit;text-decoration:none;border-bottom:1px solid #4A4A44}
.sx-menu h3 a:hover{border-color:#F3F0E8}
.sx-menu p{margin:3px 0 0;font-size:13px;line-height:1.5;color:#A19E95}
.sx-menu .sx-tag{display:inline-block;margin-left:6px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9A968D}
.sx-explorar{margin-top:30px;padding-top:24px;border-top:1px solid #1F1F1C;text-align:left}
.sx-explorar p{margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#9A968D}
.sx-explorar ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 22px;margin:0;padding:0;list-style:none;max-width:620px}
.sx-explorar li{line-height:1.45}
.sx-explorar a{white-space:nowrap;font-size:13.5px;color:#F3F0E8;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;transition:opacity .2s}
.sx-explorar a::after{content:' \\2197\\FE0E';font-size:12px;display:inline-block;text-decoration:none;margin-left:4px}
.sx-explorar a:hover{opacity:.7}
.sx-regiao{margin-top:18px;border:1px solid #23231F;border-radius:22px;background:#121211;padding:20px 20px 16px}
.sx-regiao .eyebrow{margin:0 0 6px}
.sx-regiao dl{margin:0}
.sx-regiao dl div{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:13px 0;border-bottom:1px solid #22221F}
.sx-regiao dt{font-size:14px;color:#A19E95}
.sx-regiao dd{margin:0;text-align:right;font-size:15px;font-weight:600;color:#F3F0E8}
.sx-regiao dd small{display:block;font-size:12px;font-weight:400;color:#9A968D;margin-top:2px}
.sx-regiao-nota{margin:12px 0 0!important;font-size:12.5px!important;line-height:1.5;color:#9A968D!important}
@media(min-width:651px){.sx-regiao{max-width:620px}}
.sx-edu{margin-top:22px}
.sx-pedir{margin-top:34px;padding-top:30px;border-top:1px solid #1F1F1C;text-align:center}
.sx-pedir .sx-h2{margin:0 0 8px}
.sx-pedir p{color:#A19E95;font-size:15px;margin:0}
.sx-pedir .access-actions{margin:20px auto 0!important;max-width:420px!important}
.cf-nutri{margin-top:12px;width:100%;max-width:300px;border:1px solid #2A2A27;border-radius:16px;background:#121211;text-align:left}
.cf-nutri summary{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 8px 9px 14px;cursor:pointer;list-style:none;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#F3F0E8}
.cf-nutri summary::-webkit-details-marker{display:none}
.cf-nutri summary::after{content:'+';flex:0 0 26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#F3F0E8;color:#0E0E0D;font-size:14px;transition:transform .2s}
.cf-nutri[open] summary::after{transform:rotate(45deg)}
.cf-nutri-corpo{padding:0 14px 12px}
.cf-nutri dl{margin:0}
.cf-nutri dl div{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #22221F;font-size:12.5px}
.cf-nutri dt{color:#A19E95}.cf-nutri dd{margin:0;color:#F3F0E8;font-weight:600;text-align:right}
.cf-nutri dd small{font-weight:400;font-size:11px;color:#9A968D;margin-left:4px}
.cf-nutri-mais{display:inline-flex;gap:5px;margin-top:10px;font-size:12px;color:#F3F0E8;text-decoration:none;border-bottom:1px solid #F3F0E8;padding-bottom:2px}
.pd-nutri .cf-nutri-mais{margin-top:12px}
.pd-nutri p{margin:8px 0 0;font-size:11px;line-height:1.45;color:#9A968D}
.cf-nutri p{margin:8px 0 0;font-size:11px;line-height:1.45;color:#9A968D}
@media(max-width:650px){#tabela-nutricional{display:none}}
.sx-hero-curto{padding-bottom:24px}
.sx-abas{position:sticky;top:0;z-index:30;background:rgba(16,16,16,.94);backdrop-filter:blur(8px);border-bottom:1px solid #1F1F1C}
.sx-abas ul{display:flex;gap:8px;overflow-x:auto;margin:0;padding:12px 0;list-style:none;scrollbar-width:none}
.sx-abas ul::-webkit-scrollbar{display:none}
.sx-abas a{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border:1px solid #3A3A36;border-radius:999px;padding:8px 14px;font-size:13px;color:#F3F0E8;text-decoration:none}
.sx-abas a:hover{background:#F3F0E8;color:#0E0E0D}
.sx-abas small{font-size:11px;color:#9A968D}
.sx-cat{scroll-margin-top:64px}
.sx-grade{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}
@media(min-width:861px){.sx-grade{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}
.sx-item>a,.sx-item>div{position:relative;display:flex;flex-direction:column;height:100%;text-decoration:none;border:1px solid #23231F;border-radius:20px;overflow:hidden;background:#121211;transition:border-color .2s,transform .15s}
.sx-item>a:hover{border-color:#5A5A52}.sx-item>a:active{transform:scale(.98)}
.sx-item img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover;background:#151514}
.sx-item>a>div,.sx-item-sem>div{padding:12px 14px 14px;display:flex;flex-direction:column;flex:1}
.sx-item h3{margin:0;font-family:var(--display);font-size:20px;font-weight:700;text-transform:uppercase;line-height:1.05;color:#F3F0E8}
.sx-item p{margin:6px 0 0;font-size:12.5px;line-height:1.45;color:#A19E95;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sx-item em{font-style:normal;font-size:12px;color:#F3F0E8;margin-top:auto;padding-top:10px;align-self:flex-start;border-bottom:1px solid #F3F0E8}
.sx-item-tag{position:absolute;top:10px;left:10px;border-radius:999px;background:rgba(14,14,13,.85);padding:5px 9px;font-size:10.5px;font-weight:600;color:#F3F0E8;letter-spacing:.02em}
.sx-esgotado img{filter:grayscale(1);opacity:.6}
.sx-foto-guia{margin:0 0 30px}
.sx-foto-guia img{aspect-ratio:16/10}
.sx-home .sx-cards{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -6vw;padding:4px 6vw 10px;scroll-padding:0 6vw;scrollbar-width:none;-webkit-overflow-scrolling:touch}.sx-home .sx-cards::-webkit-scrollbar{display:none}.sx-home .sx-card{flex:0 0 44%;scroll-snap-align:start}}
@media(min-width:651px){.sx-home .sx-cards{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(min-width:1100px){.sx-home .sx-cards{grid-template-columns:repeat(7,minmax(0,1fr));gap:12px}.sx-home .sx-card b{font-size:19px}}
.sx-card-todos a{display:flex!important;flex-direction:column;justify-content:space-between;min-height:100%;padding:18px;background:#F3F0E8!important;border-color:#F3F0E8!important}
.sx-card-todos b{color:#0E0E0D!important;font-size:24px!important}.sx-card-todos span{color:#8C8981!important}
.sx-card-todos i{font-style:normal;display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#0E0E0D;color:#F3F0E8;font-size:16px;margin-top:18px}
.sx-arraste{display:none;font-size:12px;color:#9A968D;margin:10px 0 0}
@media(max-width:650px){.sx-arraste{display:block}}
.sx-home .sx-indice{margin:22px 0 0}
.sx-drop{margin-top:26px;border:1px solid #23231F;border-radius:22px;background:#121211;overflow:hidden}
.sx-drop>summary{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 20px;cursor:pointer;list-style:none;font-size:15px;font-weight:600;color:#F3F0E8}
.sx-drop>summary::-webkit-details-marker{display:none}
.sx-drop>summary small{display:block;font-size:12px;font-weight:400;color:#9A968D;margin-top:3px}
.sx-drop>summary::after{content:'+';flex:0 0 36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#F3F0E8;color:#0E0E0D;font-size:18px;transition:transform .2s}
.sx-drop[open]>summary::after{transform:rotate(45deg)}
.sx-drop-corpo{padding:0 20px 20px}
.sx-tabela{width:100%;border-collapse:collapse;font-size:14px}
.sx-tabela th{text-align:left;font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#9A968D;padding:8px 0;border-bottom:1px solid #2A2A27}
.sx-tabela td{padding:11px 0;border-bottom:1px solid #1F1F1C;color:#C9C5BB;vertical-align:top}
.sx-tabela td:last-child,.sx-tabela th:last-child{text-align:right}
.sx-tabela a{color:#F3F0E8;text-decoration:none;border-bottom:1px solid #4A4A44}
.sx-tabela small{display:block;color:#9A968D;font-size:12px}
`;

function gerarPaginas(ctx) {
  const { SITE, HOME, IFOOD, catalogo, meses, mesAno, cabeca, header, footer, mobileOrder, botaoIfood, absolutizar } = ctx;
  const nomesCurtos = ctx.nomesCurtos || {};
  // Imagem de topo dos guias e do cardápio: entra sozinha quando existir em fonte/imagens/<slug>.(jpg|png|webp).
  const imagensGuias = ctx.imagensGuias || new Set();
  const fotoGuia = (slug, alt) => imagensGuias.has(slug)
    ? `<figure class="sx-foto sx-foto-guia"><img src="/assets/guias/${slug}.webp" srcset="/assets/guias/${slug}-800.webp 800w, /assets/guias/${slug}.webp 1600w" sizes="(min-width:861px) 1040px, 100vw" alt="${esc(alt)}" title="${esc(alt)}" width="1600" height="1000" fetchpriority="high"><figcaption>${esc(alt)}. Imagem ilustrativa.</figcaption></figure>` : '';
  const ogGuia = slug => imagensGuias.has(slug) ? `${SITE}/og/${slug}.jpg` : `${SITE}/og.jpg`;
  const cat = Object.fromEntries(catalogo.map(p => [p.id, p]));
  const urlBurger = b => `${SITE}/burgers/${b.slug}`;
  const img = (b, w) => `/assets/burgers/${b.slug}${w ? `-${w}` : ''}.webp`;
  const srcset = b => `${img(b, 480)} 480w, ${img(b, 800)} 800w, ${img(b)} 1100w`;
  const kc = b => NUTRI[b.id] ? NUTRI[b.id].kcal : null;
  const kcal = b => kcalTxt(b.id);
  const MAXK = Math.max(...BURGERS.filter(kc).map(kc));
  const regua = b => `<div class="sx-regua" aria-hidden="true"><i style="left:0;width:${((kc(b) / MAXK) * 100).toFixed(1)}%"></i></div>`;
  const porKcal = (a, z) => (kc(a) || 1e9) - (kc(z) || 1e9);
  const subst = s => s.replace(/\{MESES\}/g, meses).replace(/\{MES_ANO\}/g, mesAno);
  const restaurante = { '@id': `${HOME}#restaurante` };

  const montarHead = ({ titulo, descricao, url, imagem, dados }) => cabeca
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(titulo)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(descricao)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(titulo)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(descricao)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imagem}">`)
    .replace('</head>', `<style>${CSS}</style>${dados.map(ld).join('')}</head>`);

  const pagina = (head, main) => absolutizar(`${head}<body><a class="skip" href="#conteudo">Pular para o conteúdo</a>${header}<main id="conteudo">${main}</main>${footer}${mobileOrder}<script src="/assets/js/scroll-motion.js" defer></script></body></html>`);

  const trilha = itens => `<nav aria-label="Você está em"><ol class="sx-trilha">${itens.map(([nome, href]) => `<li>${href ? `<a href="${href}">${esc(nome)}</a>` : `<span aria-current="page">${esc(nome)}</span>`}</li>`).join('')}</ol></nav>`;
  const trilhaLd = itens => ({ '@type': 'BreadcrumbList', itemListElement: itens.map(([nome, href], i) => ({ '@type': 'ListItem', position: i + 1, name: nome, ...(href ? { item: href.startsWith('http') ? href : SITE + href } : {}) })) });
  const faqHtml = (titulo, faq) => `<section class="sx-sec"><div class="sx-wrap"><p class="eyebrow">PERGUNTAS FREQUENTES</p><h2 class="sx-h2">${titulo}</h2><div class="sx-faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>`;
  const faqLd = (url, faq) => ({ '@type': 'FAQPage', '@id': `${url}#perguntas`, mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  const cartao = b => `<li class="sx-card"><a href="/burgers/${b.slug}"><img src="${img(b, 480)}" alt="${esc(`${b.nome} do Hicks: ${b.sub}`)}" width="480" height="480" loading="lazy" decoding="async"><div><b>${esc(b.nome)}</b><span>${esc(b.sub)}</span><em>Conhecer</em></div></a></li>`;
  const cartoes = slugs => `<ul class="sx-cards${slugs.length === 1 ? ' sx-um' : ''}">${slugs.map(s => cartao(porSlug[s])).join('')}</ul>`;
  const final = (titulo = 'Bateu <em>vontade?</em>') => `<section class="sx-final"><div class="sx-wrap"><h2 class="sx-h2">${titulo}</h2><p>De quarta a segunda, das 18h às 23h. Terça fechado.</p><p>Entrega em Campinas pelo iFood.</p><div class="sx-acoes">${botaoIfood}</div><a class="sx-link" href="/cardapio">Ver o cardápio completo <span>↗︎</span></a></div></section>`;
  const nomeCurto = p => p.name.replace(/\s*\|.*$/, '').replace(/\s*\+\s*Fritas.*$/i, '').trim();

  const MAIS_VENDIDOS = ['duplo-aversa', 'aversa', 'o-classico', 'baba-yaga'];
  const relacionados4 = b => {
    const lista = [...b.relacionados];
    for (const x of [...BURGERS.filter(y => y.linha === b.linha).map(y => y.slug), ...MAIS_VENDIDOS, ...BURGERS.map(y => y.slug)]) {
      if (lista.length >= 4) break;
      if (x !== b.slug && !lista.includes(x)) lista.push(x);
    }
    return lista.slice(0, 4);
  };
  const paginas = [];

  // 1) Uma página por burger.
  for (const b of BURGERS) {
    const url = urlBurger(b);
    const p = cat[b.id];
    if (!p) throw new Error(`burger ${b.nome} (${b.id}) não está no cardápio`);
    const combo = b.combo && cat[b.combo];
    const k = kcal(b);
    const nt = NUTRI[b.id];
    const mais = BURGERS.filter(kc).sort(porKcal);
    const posicao = k ? mais.indexOf(b) + 1 : 0;
    const totalK = mais.length;
    const leitura = !k ? '' : posicao <= 3 ? 'Está entre os mais leves do cardápio.' : posicao > totalK - 3 ? 'Está entre os mais intensos do cardápio: lanche para fome grande.' : 'Fica no meio do cardápio: nem o mais leve, nem o mais intenso.';
    const faq = [
      [`O que vem no ${sa(b)}?`, b.resposta],
      [`O ${sa(b)} é apimentado?`, b.apimentado ? `Sim. A picância vem do picles de jalapeño e da maionese de sriracha. É o único lanche apimentado do Hicks.` : `Não. No Hicks, o único lanche apimentado é o Tex-Mex.`],
      [`Quantas calorias tem o ${sa(b)}?`, nt ? `O ${sa(b)} tem ${nt.aprox ? 'aproximadamente ' : ''}${fmtK(nt.kcal)} kcal por lanche (porção de ${nt.porcao.replace(/^1 lanche \((.*)\)$/, '$1')}), cerca de ${nt.kcalVD} do valor diário de referência, com ${nt.n.prot[0]} de proteínas. A tabela nutricional completa está nesta página.` : `A informação nutricional do ${sa(b)} está em levantamento.`],
      [`O ${sa(b)} tem combo?`, combo ? `Sim. O ${nomeCurto(combo)} vem com fritas e bebida à sua escolha, pelo iFood.` : `Não há combo com o ${sa(b)} no cardápio atual. Dá para pedir fritas e bebida separadamente no iFood.`],
      [`Onde pedir o ${sa(b)} em Campinas?`, 'Pelo iFood, de quarta a segunda, das 18h às 23h. Informe o seu endereço no iFood para conferir se o Hicks entrega na sua região.'],
    ];
    const trilhaItens = [['Início', '/portlink'], ['Cardápio', '/cardapio'], [b.nome, null]];
    const legenda = `${b.nome} do Hicks: ${b.sub}. Foto do cardápio oficial.`;
    const dados = [{
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: b.titulo, description: b.descricao, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, about: restaurante, breadcrumb: { '@id': `${url}#trilha` }, mainEntity: { '@id': `${url}#burger` }, primaryImageOfPage: { '@id': `${url}#foto` }, keywords: b.palavras.join(', ') },
        { ...trilhaLd(trilhaItens.map(([n, h]) => [n, h])), '@id': `${url}#trilha` },
        { '@type': 'ImageObject', '@id': `${url}#foto`, contentUrl: SITE + img(b), url: SITE + img(b), width: 1100, height: 1100, caption: legenda },
        {
          '@type': 'MenuItem', '@id': `${url}#burger`, name: b.nome, alternateName: b.sub, description: b.resposta, url, image: SITE + img(b),
          menuAddOn: combo ? { '@type': 'MenuItem', name: nomeCurto(combo), description: 'Com fritas e bebida à sua escolha.' } : undefined,
          ...(nt ? { nutrition: Object.fromEntries(Object.entries({ '@type': 'NutritionInformation', servingSize: nt.porcao, calories: `${nt.kcal} kcal`,
            carbohydrateContent: nt.n.carb?.[0], sugarContent: nt.n.acTot?.[0], proteinContent: nt.n.prot?.[0], fatContent: nt.n.gord?.[0], saturatedFatContent: nt.n.sat?.[0],
            transFatContent: nt.n.trans?.[0], fiberContent: nt.n.fibra?.[0], sodiumContent: nt.n.sodio?.[0] }).filter(([, v]) => v && /\d/.test(v))) } : {}),
          offers: { '@type': 'Offer', url: IFOOD, availability: p.soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock', areaServed: 'Campinas' },
        },
        faqLd(url, faq),
      ],
    }];
    const head = montarHead({ titulo: b.titulo, descricao: b.descricao, url, imagem: `${SITE}/og/${b.slug}.jpg`, dados });
    const camadas = b.ingredientes.map(([nome, tipo], i) => ({ nome, tipo: tipo === 'bun' ? (i === 0 ? 'bun-top' : 'bun-bottom') : tipo }));
    camadas.push({ nome: 'Base de brioche', tipo: 'bun-bottom' });
    const ingsUnicos = b.ingredientes.map(([n]) => n);
    for (const n of ingsUnicos) if (!GLOSSARIO[n]) throw new Error(`ingrediente sem glossário: ${n}`);
    const main = `
<div class="sx-wrap">${trilha(trilhaItens)}
<article class="sx-hero">
<figure class="sx-foto"><img src="${img(b)}" srcset="${srcset(b)}" sizes="(min-width:861px) 52vw, 100vw" alt="${esc(`${b.nome}, burger do Hicks em Campinas: ${b.sub}`)}" title="${esc(`${b.nome} · ${b.sub}`)}" width="1100" height="1100" fetchpriority="high"><figcaption>${esc(legenda)}</figcaption></figure>
<div>
<p class="eyebrow">${esc(b.linha.toUpperCase())} · BURGER DO <img class="hk-word" src="/assets/img/hicks-word.png" alt="Hick’s" width="644" height="209"></p>
<h1 class="sx-h1">${esc(b.nome)}</h1>
<p class="sx-sub">${esc(b.sub)}</p>
${b.selos.length ? `<p class="sx-selos">${b.selos.map(s => `<span${s === 'Apimentado' ? ' class="sx-quente"' : ''}>${esc(s)}</span>`).join('')}</p>` : ''}
<p class="sx-resposta">${esc(b.resposta)}</p>
<p class="sx-para">${esc(b.paraQuem)}</p>
<div class="sx-acoes">${botaoIfood}</div>
<a class="sx-link" href="#por-dentro">Ver o que vem no lanche <span>↓</span></a>
</div>
</article></div>
<section class="sx-sec" id="por-dentro"><div class="sx-wrap">
<p class="eyebrow">POR DENTRO DO LANCHE</p><h2 class="sx-h2">O que vem no <em>${nw(sa(b))}.</em></h2>
<div class="sx-dois">
<div class="sx-camadas"><h3>Montagem <span>${camadas.length} camadas</span></h3><ol class="pd-stack">${camadas.map(c => `<li class="pd-l pd-${c.tipo}"><i></i><span>${esc(c.nome)}</span></li>`).join('')}</ol></div>
<div><p class="sx-ings-h">Os ingredientes que fazem a diferença</p><ul class="sx-ings">${ingsUnicos.filter(n => !OBVIOS.has(n)).map(n => `<li><b>${esc(n)}</b><span>${esc(GLOSSARIO[n])}</span></li>`).join('')}</ul></div>
</div></div></section>
<section class="sx-sec"><div class="sx-wrap">
<p class="eyebrow">POR QUE FUNCIONA</p><h2 class="sx-h2">O jeito <em>Hicks</em> de fazer.</h2>
<div class="sx-texto">${b.porque.map(t => `<p>${esc(t)}</p>`).join('')}</div>
</div></section>
<section class="sx-sec" id="nutricao"><div class="sx-wrap">
<p class="eyebrow">TABELA NUTRICIONAL</p><h2 class="sx-h2">Tabela nutricional <em>do ${nw(sa(b))}.</em></h2>
<div class="sx-nutri-grade"><div class="sx-nutri">
<h3>Valor energético</h3>
${nt ? `<div class="sx-kcal"><strong>${fmtK(nt.kcal)}</strong><small>kcal · ${esc(nt.kcalVD)} do valor diário</small></div>${regua(b)}<div class="sx-regua-leg"><span>mais leve do cardápio</span><span>mais intenso</span></div><p class="sx-pos">${esc(leitura)}</p>` : `<div class="sx-kcal"><small>Informação nutricional em levantamento.</small></div>`}
<ul class="sx-pesos">${b.pesos.map(([q, o]) => `<li><b>${esc(q)}</b><span>${esc(o)}</span></li>`).join('')}</ul>
<p class="sx-nota">Pesos declarados no cardápio oficial.</p>
</div>${nt ? `<div class="sx-tn-box">${tabelaNutri(b.id, b.nome)}</div>` : ''}</div></div></section>
${combo ? `<section class="sx-sec"><div class="sx-wrap"><p class="eyebrow">TAMBÉM EM COMBO</p><h2 class="sx-h2">Com fritas <em>e bebida.</em></h2><div class="sx-combo"><div><b>${esc(nomeCurto(combo))}</b><span>${esc(b.nome)} + fritas + bebida à sua escolha</span></div><a class="sx-link" href="${IFOOD}" target="_blank" rel="noopener noreferrer">Pedir o combo no iFood <span>↗︎</span></a></div></div></section>` : ''}
${faqHtml(`Sobre o <em>${nw(sa(b))}.</em>`, faq)}
<section class="sx-sec"><div class="sx-wrap"><p class="eyebrow">PROVE TAMBÉM</p><h2 class="sx-h2">Se você gosta do ${nw(sa(b))}…</h2>${cartoes(relacionados4(b))}</div></section>
${final()}`;
    paginas.push({ rel: `burgers/${b.slug}.html`, url, html: pagina(head, main), imagem: { loc: SITE + img(b), titulo: `${b.nome} · ${b.sub}`, legenda } });
  }

  // 2) Guias de decisão.
  for (const g of GUIAS) {
    const url = `${SITE}/${g.slug}`;
    const resposta = subst(g.resposta);
    const faq = g.faq.map(([q, a]) => [subst(q), subst(a)]);
    const trilhaItens = [['Início', '/portlink'], [g.rotulo, null]];
    const blocos = g.blocos.map(bl => {
      let h = '';
      if (bl.textos) h += `<div class="sx-texto">${bl.textos.map(t => `<p>${esc(subst(t))}</p>`).join('')}</div>`;
      if (bl.lista) h += `<ul class="sx-lista">${bl.lista.map(([t, d, link]) => {
        const href = link && (porSlug[link] ? `/burgers/${link}` : `/${link}`);
        return `<li>${href ? `<a href="${href}">` : '<div>'}<b>${esc(t)}</b><span>${esc(d)}</span>${href ? '</a>' : '</div>'}</li>`;
      }).join('')}</ul>`;
      if (bl.burgers) h += cartoes(bl.burgers);
      if (bl.ranking) h += `<ul class="sx-rank">${BURGERS.filter(kc).sort(porKcal).map(b => `<li><a href="/burgers/${b.slug}"><span>${esc(b.nome)}</span>${regua(b)}<small>${esc(kcal(b))}</small></a></li>`).join('')}</ul><p class="sx-nota">Calorias por lanche, sem acompanhamentos. Informação nutricional fornecida pelo Hicks; a tabela completa está na página de cada burger.</p>`;
      if (bl.horario) h += `<dl class="sx-horario"><div><dt>Quarta a sábado</dt><dd>18h às 23h</dd></div><div><dt>Domingo</dt><dd>18h às 23h</dd></div><div><dt>Segunda-feira</dt><dd>18h às 23h</dd></div><div><dt>Terça-feira</dt><dd>Fechado</dd></div></dl>`;
      if (bl.selos) h += `<ul class="sx-selos-img">${[['ifood', 'Super Restaurante iFood'], ['top-10', 'Prêmio Hambúrguer Perfeito · Top 10 Campinas'], ['365', 'Padrão e Constância 365 Dias'], ['angus', 'Angus Brasil · carne certificada'], ['brazil-beef', 'Brazil Beef Quality']].map(([f, t]) => `<li><img src="/assets/img/selos/${f}.webp" alt="${esc(t)}" title="${esc(t)}" width="96" height="96" loading="lazy">${esc(t)}</li>`).join('')}</ul>`;
      return `<section class="sx-sec"><div class="sx-wrap"><h2 class="sx-h2">${esc(bl.h2)}</h2>${h}</div></section>`;
    }).join('');
    const itens = [...new Set(g.blocos.flatMap(bl => [...(bl.burgers || []), ...((bl.lista || []).map(l => l[2]).filter(s => porSlug[s]))]))];
    const dados = [{
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: g.titulo, description: g.descricao, inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, about: restaurante, breadcrumb: { '@id': `${url}#trilha` }, keywords: g.palavras.join(', '), ...(itens.length ? { mainEntity: { '@id': `${url}#lista` } } : {}) },
        { ...trilhaLd(trilhaItens), '@id': `${url}#trilha` },
        ...(itens.length ? [{ '@type': 'ItemList', '@id': `${url}#lista`, itemListElement: itens.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: urlBurger(porSlug[s]), name: porSlug[s].nome })) }] : []),
        faqLd(url, faq),
      ],
    }];
    const head = montarHead({ titulo: g.titulo, descricao: g.descricao, url, imagem: ogGuia(g.slug), dados });
    const main = `
<div class="sx-wrap">${trilha(trilhaItens)}
<header class="sx-hero" style="grid-template-columns:1fr"><div>
<p class="eyebrow">${esc(g.eyebrow)}</p>
<h1 class="sx-h1 sx-h1-guia">${esc(g.h1)}</h1>
<p class="sx-resposta">${esc(resposta)}</p>
<a class="sx-link" href="#guia">Ler o guia <span>↓</span></a>
</div></header>${fotoGuia(g.slug, g.rotulo)}</div>
<div id="guia"></div>
${blocos}
${faqHtml('Dúvidas <em>comuns.</em>', faq)}
${final()}`;
    paginas.push({ rel: `${g.slug}.html`, url, html: pagina(head, main) });
  }

  // 3) Cardápio completo, em texto (o que o Google e as IAs leem).
  {
    const url = `${SITE}/cardapio`;
    const CATS = [['Burgers Angus Premium', 'Burgers', 'burgers'], ['Combos - Burger + Fritas + Bebida', 'Combos', 'combos'], ['Acompanhamentos', 'Acompanhamentos', 'acompanhamentos'], ['Bebidas', 'Bebidas', 'bebidas'], ['Doces & Sobremesas', 'Sobremesa', 'sobremesa']];
    const bPorId = Object.fromEntries(BURGERS.map(b => [b.id, b]));
    const texto = p => String(p.description || '').replace(/\r/g, '').split(/\n\s*\n/)[0].split('\n').map(s => s.trim()).filter(Boolean).join(', ');
    const secoes = CATS.map(([c, rotulo, ancora]) => {
      const itens = catalogo.filter(p => p.category === c);
      return { rotulo, ancora, itens };
    });
    // Cada item vira um cartão com foto. Burger leva à página dele; combo leva à página do burger do combo.
    const burgerDoCombo = Object.fromEntries(BURGERS.filter(b => b.combo).map(b => [b.combo, b]));
    const curto = p => (nomesCurtos[p.id] || nomeCurto(p)).replace(/\s*\|.*$/, '');
    const cartaoItem = p => {
      const b = bPorId[p.id], bc = burgerDoCombo[p.id];
      const nome = b ? b.nome : curto(p);
      const linha = b ? b.sub : bc ? `${bc.nome} + fritas + bebida à sua escolha` : texto(p).replace(/^Porção Individual - \(sem sal\)$/, 'Porção individual, sem sal');
      const tag = p.soldOut ? 'esgotado' : NUTRI[p.id] && !NUTRI[p.id].ref ? kcalTxt(p.id) : NUTRI[p.id] ? `${kcalTxt(p.id)} · ${NUTRI[p.id].porcao.replace(/ \(.*\)$/, '')}` : '';
      const foto = b ? img(b, 480) : `/assets/cardapio/${p.id}-480.webp`;
      const href = b ? `/burgers/${b.slug}` : bc ? `/burgers/${bc.slug}` : null;
      const corpo = `<img src="${foto}" alt="${esc(`${nome} do Hicks${linha ? `: ${linha}` : ''}`)}" width="480" height="480" loading="lazy" decoding="async">${tag ? `<span class="sx-item-tag">${esc(tag)}</span>` : ''}<div><h3>${esc(nome)}</h3>${linha ? `<p>${esc(linha)}</p>` : ''}${href ? `<em>${b ? 'Ver o burger' : 'Conhecer o burger'}</em>` : ''}</div>`;
      return `<li class="sx-item${p.soldOut ? ' sx-esgotado' : ''}">${href ? `<a href="${href}">${corpo}</a>` : `<div class="sx-item-sem">${corpo}</div>`}</li>`;
    };
    const dados = [{
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', '@id': `${url}#pagina`, url, name: 'Cardápio do Hick’s Burger em Campinas', inLanguage: 'pt-BR', isPartOf: { '@id': `${SITE}/#site` }, about: restaurante, mainEntity: { '@id': `${url}#menu` }, breadcrumb: { '@id': `${url}#trilha` } },
        { ...trilhaLd([['Início', '/portlink'], ['Cardápio', null]]), '@id': `${url}#trilha` },
        {
          '@type': 'Menu', '@id': `${url}#menu`, name: 'Cardápio do Hick’s Burger', inLanguage: 'pt-BR',
          hasMenuSection: secoes.map(s => ({
            '@type': 'MenuSection', name: s.rotulo,
            hasMenuItem: s.itens.map(p => { const b = bPorId[p.id]; return { '@type': 'MenuItem', name: b ? b.nome : nomeCurto(p), description: b ? b.resposta : texto(p) || undefined, ...(b ? { url: urlBurger(b), image: SITE + img(b) } : {}) }; }),
          })),
        },
      ],
    }];
    const head = montarHead({
      titulo: 'Cardápio do Hick’s Burger: burgers e combos em Campinas',
      descricao: 'Cardápio completo do Hicks em Campinas: burgers Angus e de frango, combos com fritas e bebida, acompanhamentos, bebidas e sobremesa. Peça pelo iFood.',
      url, imagem: ogGuia('cardapio'), dados,
    });
    const main = `
<div class="sx-wrap">${trilha([['Início', '/portlink'], ['Cardápio', null]])}
<header class="sx-hero sx-hero-curto" style="grid-template-columns:1fr"><div>
<p class="eyebrow">CARDÁPIO COMPLETO</p>
<h1 class="sx-h1 sx-h1-guia">O cardápio do Hicks.</h1>
<p class="sx-resposta">Burgers de carne Angus e de frango crocante, combos com fritas e bebida, acompanhamentos e sobremesa. Toque em um burger para ver o que vem nele.</p>
</div></header>${fotoGuia('cardapio', 'Cardápio do Hicks')}</div>
<nav class="sx-abas" aria-label="Categorias do cardápio"><div class="sx-wrap"><ul>${secoes.map(s => `<li><a href="#${s.ancora}">${esc(s.rotulo)} <small>${s.itens.length}</small></a></li>`).join('')}</ul></div></nav>
${secoes.map(s => `<section class="sx-sec sx-cat" id="${s.ancora}"><div class="sx-wrap"><h2 class="sx-h2">${esc(s.rotulo)}</h2><ul class="sx-grade">${s.itens.map(cartaoItem).join('')}</ul></div></section>`).join('')}
<section class="sx-sec"><div class="sx-wrap sx-texto"><p>Preços, disponibilidade e área de entrega aparecem no iFood. Bebida dos combos à escolha, conforme disponibilidade.</p></div></section>
${final('Escolheu? <em>Peça já.</em>')}`;
    paginas.push({ rel: 'cardapio.html', url, html: pagina(head, main) });
  }

  return paginas;
}

// Seção nova da página principal: links para cada burger e o menu suspenso da tabela nutricional.
function secaoHome({ catalogo, IFOOD }) {
  const kcal = b => kcalTxt(b.id);
  const img = b => `assets/burgers/${b.slug}-480.webp`;
  const ordem = [...BURGERS].sort((a, z) => (NUTRI[a.id]?.kcal || 1e9) - (NUTRI[z.id]?.kcal || 1e9));
  return `<section class="section-wrap sx-home" id="burgers" aria-labelledby="burgers-titulo">
<h2 class="sx-h2" id="burgers-titulo">Conheça cada <em>burger.</em></h2>
<p class="sx-resposta">Composição, camadas e tabela nutricional de cada lanche do Hicks.</p>
<ul class="sx-cards">${BURGERS.map(b => `<li class="sx-card"><a href="/burgers/${b.slug}"><img src="${img(b)}" alt="${esc(`${b.nome} do Hicks: ${b.sub}`)}" width="480" height="480" loading="lazy" decoding="async">${kcal(b) ? `<span class="sx-item-tag">${esc(kcal(b))}</span>` : ''}<div><b>${esc(b.nome)}</b><span>${esc(b.sub)}</span></div></a></li>`).join('')}<li class="sx-card sx-card-todos"><a href="/cardapio"><span><b>Cardápio completo</b><span>Burgers, combos, acompanhamentos, bebidas e sobremesa.</span></span><i>↗︎</i></a></li></ul>
<p class="sx-arraste">Deslize para ver os ${BURGERS.length} burgers →</p>
<ul class="sx-indice"><li><a href="/melhor-hamburguer-de-campinas">Melhor hambúrguer de Campinas</a></li><li><a href="/melhor-angus-de-campinas">O melhor Angus</a></li><li><a href="/hamburgueria-autoral-campinas">Burger autoral</a></li><li><a href="/qual-hamburguer-escolher">Seu burger</a></li><li><a href="/hamburgueria-aberta-a-noite-campinas">Aberta à noite</a></li><li><a href="/cardapio">Cardápio completo</a></li></ul>
<details class="sx-drop" id="tabela-nutricional"><summary><span>Tabela nutricional<small>Calorias e proteínas de cada burger, do mais leve ao mais intenso</small></span></summary>
<div class="sx-drop-corpo"><table class="sx-tabela"><thead><tr><th>Burger</th><th>Proteínas</th><th>Calorias</th></tr></thead><tbody>
${ordem.map(b => `<tr><td><a href="/burgers/${b.slug}">${esc(b.nome)}</a><small>${esc(NUTRI[b.id] ? NUTRI[b.id].porcao.replace(/^1 lanche \((.*)\)$/, '$1') : '')}</small></td><td>${esc(NUTRI[b.id]?.n.prot[0] || '')}</td><td>${kcal(b) ? esc(kcal(b)) : 'em levantamento'}</td></tr>`).join('')}
</tbody></table><p class="sx-nota">Por lanche, sem acompanhamentos. Informação nutricional fornecida pelo Hicks; a tabela completa está na página de cada burger.</p></div></details>
<div class="sx-pedir"><h3 class="sx-h2">Escolheu? <em>Peça já.</em></h3><p>De quarta a segunda, das 18h às 23h. Entrega em Campinas pelo iFood.</p><div class="access-actions"><a class="ch ch-ifood" href="${IFOOD}" target="_blank" rel="noopener noreferrer"><span class="ch-tag">Super Restaurante</span><img class="ch-brand" src="assets/img/logo-ifood.jpg" alt="iFood" width="172" height="148"><span class="ch-label">peça pelo iFood</span></a></div></div>
</section>`;
}

// Links do rodapé (todas as páginas): o mapa do site para quem lê e para quem rastreia.
const RODAPE_LINKS = `<nav class="sx-explorar" aria-label="Explore o Hicks"><p>Explore o Hicks</p><ul>
<li><a href="/cardapio">Cardápio completo</a></li><li><a href="/melhor-hamburguer-de-campinas">Melhor hambúrguer</a></li>
<li><a href="/melhor-angus-de-campinas">O melhor Angus</a></li><li><a href="/hamburgueria-autoral-campinas">Burger autoral</a></li>
<li><a href="/qual-hamburguer-escolher">Seu burger</a></li><li><a href="/hamburguer-de-frango-crocante">Burger de frango</a></li>
<li><a href="/burgers/tex-mex">Burger apimentado</a></li><li><a href="/super-restaurante-ifood">Super Restaurante</a></li>
<li><a href="/hamburgueria-aberta-a-noite-campinas">Aberta à noite</a></li><li><a href="/historia">Nossa história</a></li>
<li><a href="/bastidores">Bastidores</a></li><li><a href="/central">Onde pedir</a></li>
</ul></nav>`;

module.exports = { CSS, gerarPaginas, secaoHome, RODAPE_LINKS, BURGERS, GUIAS };
