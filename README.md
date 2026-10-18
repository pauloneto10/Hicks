# Hick's Burger — site

- **Empresa:** Hick's Burger (CNPJ 36.635.421/0001-36), Campinas/SP, só delivery.
- **Nicho:** hamburgueria autoral.
- **Canal de pedido:** iFood. Instagram @hicks_br.
- **Repositório:** github.com/pauloneto10/hicks (privado), branch `main`.
- **Vercel:** projeto `hicks-burger` (time paulo-neto-s-projects), publica a cada push na `main`.
- **Páginas:** /portlink (principal; a raiz redireciona), /historia, /bastidores e /central.
- **Domínio:** hicksburger.com.br (ligado na Vercel; DNS no Registro.br precisa apontar para a Vercel).
- **Medição:** não contratada (sem Analytics, sem banner de cookies).

## Como atualizar com uma versão nova do Claude Design

1. Salve o export da página principal em `../fonte/Hicks Burger - site.html`.
2. Extraia a pasta `original/` do zip "Hicks Burger app redesign.zip" para `../fonte/projeto/` (substituindo). Ela dá nome às imagens e traz História, Bastidores e Central.
3. Rode `node ferramentas/montar-site.cjs` (usa o `sharp` de `Portlink/site/node_modules`).
4. Confira no navegador, registre em `docs/CHANGELOG.md`, commit `rodada N: ...` e push.

O montador reconhece cada arquivo do export pelo conteúdo. Se ele avisar "arquivos do bundle que não estão em fonte/projeto/", o zip está desatualizado em relação ao export: exporte os dois de novo. Se avisar que o horário mudou, atualize o horário dos dados estruturados no montador.
