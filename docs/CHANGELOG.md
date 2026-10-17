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
