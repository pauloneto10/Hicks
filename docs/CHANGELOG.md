# Histórico

## Rodada 1 — 17/10/2026
- Site montado a partir do export do Claude Design (16/10/2026) e publicado na Vercel.
- Corrigido o que o export trazia quebrado: fotos dos 9 lanches (desktop), catálogo de destaques (celular) e vídeo da cozinha.
- Links para páginas que não vieram no export (história, bastidores, central) apontam para as seções #hicks, #cozinha e #acesso.
- SEO: canonical, Open Graph com imagem 1200x630, robots.txt, sitemap.xml, JSON-LD de Restaurant e FAQPage.
- Segurança: HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy. Fontes servidas do próprio domínio.
- Assinatura "by portlink" no rodapé.

## Rodada 2 — 17/10/2026 (velocidade)
- Fonte da assinatura "by portlink" agora vem do próprio site (recorte de 1 KB), sem Google Fonts: a página não espera mais um servidor de fora para começar a aparecer. A política de segurança (CSP) deixou de liberar o Google.
- Fotos do cardápio recomprimidas (mesma aparência, cerca de metade do peso) e geradas em 160, 480, 800 e 1100 px: cada aparelho baixa só o tamanho que vai mostrar.
- Selos de reconhecimento recomprimidos (de 600 KB para 150 KB no total).
- O carrossel de destaques do celular só é montado quando a pessoa começa a rolar a página, tirando cerca de 0,5 s de trabalho do carregamento.
- Medição local no padrão de celular do Lighthouse (mediana de 3): nota 72 → 84, peso da primeira visita 2,1 MB → 0,5 MB, primeira pintura 2,4 s → 1,7 s, maior elemento 5,5 s → 3,7 s.
- Testado e descartado: adiar o desenho das seções fora da tela (content-visibility). Ganhava 0,5 s, mas errava a altura da página e podia desalinhar os botões que levam às seções.

## Rodada 3 — 17/10/2026
- Perguntas frequentes: ao abrir uma pergunta, o texto dela girava em diagonal junto com o ícone. Agora só o "+" gira (vira "×") e a pergunta fica reta.

## Rodada 4 — 17/10/2026
- Páginas História (/historia), Bastidores (/bastidores) e Central (/central) publicadas, a partir do projeto original do Claude Design ("Hicks Burger app redesign.zip", guardado em fonte/paginas/). Antes, os botões apontavam para seções da própria página inicial, e o "Nossa história e identidade" apontava para a seção em que ele mesmo estava.
- Quem chega de outra página com destino (ex.: "Ver destaques" na História) vai direto à seção, sem repetir a abertura animada.
- As três páginas usam o mesmo visual, as mesmas fontes locais e a assinatura "by portlink"; cada uma tem endereço oficial próprio e entrou no sitemap.xml.

## Rodada 5 — 18/10/2026 (versão nova do Claude Design)
- Página principal agora em https://hicksburger.com.br/portlink (a raiz redireciona para lá). Páginas internas em /historia, /bastidores e /central. Endereço oficial, sitemap e robots apontando para hicksburger.com.br.
- Versão nova aplicada: monograma H no cabeçalho, ícone e favicon; só iFood como canal; preços escondidos; cardápio completo; contador "46 meses seguidos"; FAQ novo; horário quarta a segunda, 18h às 23h, terça fechado.
- As três páginas internas também na versão nova (fonte/projeto/, do zip "Hicks Burger app redesign.zip").
- Montador reescrito: reconhece cada imagem e script do export pelo conteúdo, comparando com o projeto original. Um export novo não quebra mais por causa dos códigos internos que mudam a cada vez.
- Dados para o Google (Schema.org) atualizados: horário novo, as 5 perguntas do FAQ, cardápio no iFood. O montador para e avisa se o horário da página mudar sem atualizar esses dados.
- Cache: scripts conferidos a cada visita e imagens guardadas por 7 dias (antes, 1 ano), para ninguém ficar com imagem ou script antigo depois de uma rodada.

## Rodada 6 — 18/10/2026
- A marca é sempre masculina: "o Hicks", "do Hicks", "no Hicks", "pelo Hicks", "ao Hicks" (antes "a/da/na/pela/à Hick's"), em todas as páginas, scripts, títulos, descrições e no cardápio. "Nascida no quintal. Feita pra ser daqui." virou "Nascido no quintal. Feito pra ser daqui." O montador aplica a regra a cada versão nova e para se sobrar algum feminino.
- Kentucky: nome "Kentucky | Frango Crocante" (o subtítulo mostrava "Angus Premium no pão brioche"), mini descrição do frango em destaque na ficha ("O frango é a estrela: peito de frango de 100 g, empanado até ficar dourado e crocante por fora e macio por dentro.") e ingredientes corrigidos. O Combo Kentucky recebeu a mesma descrição do frango.

## Rodada 7 — 19/10/2026
- Título do rodapé nas quatro páginas: "Segue o Bulldog." virou "Segue o Hicks." (mesmo estilo, "Hicks." em destaque cinza).
- Chicken Salad: subtítulo "Chicken Salad Supreme" (antes aparecia "Angus Premium no pão brioche").

## Rodada 8 — 19/10/2026
- Subtítulos no lugar do genérico "Angus Premium no pão brioche": Quarterão Angus Premium → "Releitura do Clássico do Méqui"; Cheese Salada → "Releitura Shake Shack"; Cheese Burger → "Pão, carne e queijo".

## Rodada 9 — 19/10/2026 (SEO do link)
- Título: "Hick’s Burger — Hamburgueria em Campinas" (Google e WhatsApp; antes "Burger autoral. Simples bem feito." e "Segue o Bulldog").
- Descrição nova no Google: "Hamburgueria em Campinas, só delivery: burgers autorais de Angus e frango crocante no pão brioche. Super Restaurante iFood. Peça pelo iFood, das 18h às 23h." No WhatsApp, versão curta. Descrição da Central corrigida (citava Cardápio Web e 99).
- Ícone: monograma H em favicon.ico (16/32/48), 32, 192, 512 e ícone do iPhone.
- Imagem de compartilhamento nova: H + "Hamburgueria em Campinas." + Baba-Yaga.
- "Segue o Bulldog" não existe mais: virou "Segue o Hicks" na faixa, na História e no link do Instagram da Central. O montador trava se a frase voltar.

## Rodada 10 — 19/10/2026
- Botão do Pinterest (br.pinterest.com/hicks_br) ao lado do Instagram no topo das quatro páginas, no mesmo estilo. Perfil incluído nos dados para o Google (sameAs).

## Rodada 11 — 19/10/2026 (SEO e GEO; montada no localhost, NÃO publicada)
- 13 páginas de burger (/burgers/<nome>), 5 guias (/hamburguer-angus, /hamburguer-de-frango-crocante, /qual-hamburguer-escolher, /super-restaurante-ifood, /horarios-e-entrega) e o cardápio em texto (/cardapio). Conteúdo em ferramentas/conteudo-seo.cjs, moldes em ferramentas/paginas-seo.cjs.
- Página principal: seção "Conheça cada burger" (carrossel no celular, 7×2 no desktop) e menu suspenso da tabela nutricional.
- Rodapé "Explore" em todas as páginas; "Os lanches" das páginas internas leva ao cardápio.
- Dados estruturados: WebSite, Restaurant (cardápio em /cardapio, ação de pedido no iFood), MenuItem, Menu, ItemList, BreadcrumbList, FAQPage, ImageObject.
- /portlink como endereço oficial com redirecionamento permanente (308); hicks-burger.vercel.app → hicksburger.com.br.
- llms.txt, robots.txt com buscadores de IA liberados, sitemap com fotos, uma imagem de compartilhamento por burger.
- Servidor local: node ferramentas/servidor-local.cjs → http://localhost:4400/portlink
- Ajustes da revisão (19/10/2026, local): tabela nutricional no carrossel "Qual vai ser hoje?" (antes de "Ver lanche", acompanha o lanche escolhido); cardápio refeito em cartões com foto e abas fixas; sem o "CADA BURGER, EM DETALHE"; "Explore o Hicks" como botão que abre os links. Imagens de topo dos guias entram sozinhas quando salvas em ../fonte/imagens/<slug>.jpg.
- 19/10/2026 (local, não publicado): tabela nutricional real do Hicks (ferramentas/nutricao.cjs) em cada página de burger, no carrossel "Qual vai ser hoje?", na ficha "Ver lanche", no cardápio e no llms.txt; saem as estimativas do design. Guias reescritos no tom da mensagem ao cliente: /melhor-hamburguer-de-campinas (novo), /melhor-angus-de-campinas, /hamburgueria-autoral-campinas (novo), /qual-hamburguer-escolher ("Burgers que expressam sua personalidade"), /super-restaurante-ifood, /hamburgueria-aberta-a-noite-campinas, /hamburguer-de-frango-crocante. Guias sem botão do iFood no topo (pedido só no fim). 25 páginas no mapa do site.

## Rodada 12 — 20/10/2026 (design final + SEO e GEO, publicada)
- Site refeito a partir das páginas prontas do Claude Design (fonte/design/), montadas por ferramentas/montar-design.cjs.
- 19 páginas: /portlink, /cardapio, 13 burgers em /burgers/<lanche> e 4 guias (melhor hambúrguer de Campinas, melhor Angus, burger autoral, Super Restaurante iFood).
- Títulos e descrições novos em todas as páginas, com nome do lanche + "Campinas" + burger autoral / hamburgueria / hambúrguer artesanal (ferramentas/seo-paginas.cjs).
- Dados estruturados refeitos a partir do texto visível de cada página (FAQ, cardápio, lanche com tabela nutricional, trilha de navegação).
- Rodapé "Explore o Hicks" de volta (os guias tinham ficado sem links internos; "Melhor hambúrguer de Campinas" não recebia nenhum).
- Scripts das páginas movidos para arquivos (a política de segurança bloqueava scripts dentro do HTML).
- História, Bastidores e Central saíram: redirecionamento permanente para /hamburgueria-autoral-campinas, /portlink#cozinha e /portlink#acesso.
- 20/10/2026: ícone do Spotify no topo das páginas passa a abrir a playlist do Hicks (https://open.spotify.com/playlist/5bKJJZ1BPGHgVfaiMxymSI); antes abria a página inicial do Spotify.

## Rodada 12.2 — 20/10/2026 (playlist e rótulo)
- Playlist da página principal voltou a tocar. O player do design buscava cada música por um script da Apple, e a política de segurança do site (CSP) bloqueava esse script e o áudio: nada tocava. Agora cada música da lista já leva o endereço da prévia de 30 s do iTunes, gravado na montagem (ferramentas/buscar-previas.cjs → ferramentas/recursos/previas-musica.json, 25 de 25 conferidas por nome, artista e versão). O toque toca na hora, inclusive no iPhone, e o site não chama a Apple antes de a pessoa escolher uma música.
- Se a Apple trocar o endereço de uma prévia, o player busca o novo no iTunes (uma vez por música) e, se não achar, pula para a próxima; para depois de 3 falhas seguidas.
- CSP liberada só para o necessário: áudio de https://audio-ssl.itunes.apple.com e busca em https://itunes.apple.com. Script de fora continua bloqueado.
- Rótulo "ESCOLHA AQUI O SEU PEDIDO" (seção "Qual vai ser hoje?") com o mesmo tamanho dos outros rótulos, como "CONHEÇA CADA BURGER MAIS A FUNDO" (estava com 14 px; os outros têm 9 px). A regra do design que aumenta o texto de apoio da seção pegava o rótulo junto; corrigido no montador.

## Rodada 12.3 — 20/10/2026 (confirmações do Hicks)
- Nuggets: "Nuggets Artesanais" virou "Nuggets Seara" no cardápio, no catálogo do celular e nos dados estruturados (o Hicks confirmou que são Seara). A troca fica no montador (lista CORRECOES), então vale também para as próximas versões do design.
- O Clássico: o queijo é cheddar, confirmado pelo Hicks. O texto do site já dizia cheddar; a tabela nutricional segue a enviada pelo Hicks como "Cheese Bacon — Brie".

## Rodada 12.4 — 20/10/2026 (Baba-Yaga sem frango e perfil do Spotify)
- Baba-Yaga: o lanche não leva frango (confirmado pelo Hicks). "Angus + Chicken & Catupiry" virou "Angus + Catupiry" (como o selo do lanche já dizia) no subtítulo, nas legendas e textos alternativos das fotos, no combo ("Combo Angus + Catupiry"), no catálogo e nos dados estruturados. Fica na lista CORRECOES do montador.
- A tabela nutricional do Baba-Yaga continua a enviada pelo Hicks com o nome "Angus + Chicken & Catupiry" (510 g, 1.445 kcal): pendente de confirmação, porque pode incluir o frango.
- Perfil do Hicks no Spotify (https://open.spotify.com/user/314u5busxogors2o3bqnvdkhifee, dono da playlist) na lista de perfis oficiais da marca nos dados estruturados (sameAs) e no llms.txt. O ícone do topo continua abrindo a playlist.

## Rodada 12.5 — 20/10/2026 (texto legível sem o visual)
- No celular do Ricardo a página do Duplo Aversa apareceu no modo Leitor do Safari (só texto, sem o visual do site). Ali dois defeitos do texto ficaram expostos: selos colados ("Campeão de vendasMais vendido") e o logo "Hick's" (imagem) sumindo depois de "BURGER DO".
- O montador agora coloca um espaço entre textos vizinhos que o design escrevia colados (cartões, selos, listas): cerca de 360 pares nas 19 páginas. Na tela nada muda: comparadas as posições de 16.512 elementos em 38 telas (celular e computador), antes e depois, sem nenhuma diferença. IAs, modo Leitor e leitores de tela passam a ler "Duplo Aversa Duplo Angus + Cheese Crocante" em vez de "Duplo AversaDuplo Angus".
- Ficam de fora a assinatura "portlink" (uma palavra só) e o carimbo decorativo do topo.
