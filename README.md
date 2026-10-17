# Hick's Burger — site

- **Empresa:** Hick's Burger (CNPJ 36.635.421/0001-36), Campinas/SP, só delivery.
- **Nicho:** hamburgueria autoral.
- **Canais de pedido:** Cardápio Hick's (hicks.app.br), iFood, 99 Food. Instagram @hicks_br.
- **Repositório:** github.com/pauloneto10/hicks (privado), branch `main`.
- **Vercel:** projeto `hicks-burger` (https://hicks-burger.vercel.app) (time paulo-neto-s-projects), publica a cada push na `main`.
- **Domínio:** provisório na Vercel. Domínio próprio ainda não definido.
- **Medição:** não contratada (sem Analytics, sem banner de cookies).

## Como atualizar com um HTML novo do Claude Design

1. Salve o export em `../fonte/Hicks Burger - site.html`.
2. Rode `node ferramentas/montar-site.cjs` (usa o `sharp` de `Portlink/site/node_modules`).
3. Confira no navegador, registre em `docs/CHANGELOG.md`, commit `rodada N: ...` e push.

O montador desempacota o bundle, dá nomes legíveis às imagens (`assets/img`, `assets/cardapio/<id do produto>.webp`, `assets/video`, `assets/fonts`, `assets/js`), corrige as fotos que o export deixa quebradas, aponta os links de páginas que não existem para as seções equivalentes, gera ícones, imagem de compartilhamento e dados estruturados e coloca a assinatura "by portlink" no rodapé.

Se o Claude Design mudar imagens fixas, novos códigos aparecem como "uuids sem destino": acrescente-os ao mapa `fixos` do montador.
