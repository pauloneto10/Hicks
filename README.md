# Hick's Burger — site

- **Empresa:** Hick's Burger (CNPJ 36.635.421/0001-36), Campinas/SP, só delivery.
- **Nicho:** hamburgueria autoral.
- **Canal de pedido:** iFood. Instagram @hicks_br.
- **Repositório:** github.com/pauloneto10/hicks (privado), branch `main`.
- **Vercel:** projeto `hicks-burger` (time paulo-neto-s-projects), publica a cada push na `main`.
- **Páginas:** /portlink (principal; a raiz redireciona), /cardapio, 13 páginas /burgers/<lanche> e os guias /melhor-hamburguer-de-campinas, /melhor-angus-de-campinas, /hamburgueria-autoral-campinas e /super-restaurante-ifood.
- **Domínio:** hicksburger.com.br (ligado na Vercel; DNS no Registro.br precisa apontar para a Vercel).
- **Medição:** não contratada (sem Analytics, sem banner de cookies).

## Como atualizar (a partir de 20/10/2026)

A fonte do site são as páginas prontas do Claude Design, em `../fonte/design/` (o conteúdo da pasta `hicks-site` do zip "Hicks Burger app redesign.zip").

1. Substitua o conteúdo de `../fonte/design/` pela pasta nova do Claude Design.
2. Se entrou ou saiu alguma página, ajuste `ferramentas/seo-paginas.cjs` (título, descrição, objetivo e palavras de cada página).
3. Rode `node ferramentas/montar-design.cjs`. Ele publica cada página no endereço certo, tira os scripts de dentro das páginas (exigência da política de segurança), reescreve o cabeçalho de SEO, refaz os dados estruturados a partir do texto visível, recoloca o rodapé "Explore o Hicks", aplica "o Hicks" no masculino e gera sitemap, robots e llms.txt.
4. Confira com `node ferramentas/servidor-local.cjs` (http://localhost:4400/portlink, com a política de segurança ligada), registre em `docs/CHANGELOG.md`, commit e push.

Tabela nutricional: `ferramentas/nutricao.cjs` (dados enviados pelo Hicks). Playlist da página principal: se as músicas da lista mudarem no design, rode `node ferramentas/buscar-previas.cjs` antes do montador (busca a prévia de 30 s de cada música no iTunes e confere nome, artista e versão; o player fica em `ferramentas/recursos/player-playlist.js`). `ferramentas/montar-site.cjs`, `conteudo-seo.cjs` e `paginas-seo.cjs` são do fluxo antigo (bundle de 17/10) e não devem ser rodados: sobrescreveriam o site.
