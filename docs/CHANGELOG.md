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
