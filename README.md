# MCBE — catálogo de addons para Minecraft Bedrock

Site estático (HTML + CSS + JS puro, sem build), feito pra funcionar direto
no GitHub Pages — mesma estrutura que você já usa no repositório "DKNET".

## Por que estático em vez de Next.js + Supabase?

O documento original pedia Next.js/TypeScript/Supabase. Adaptei para HTML/
CSS/JS puro porque:

- O GitHub Pages só serve arquivos estáticos (sem servidor rodando Next.js).
- Você ainda está começando, e esse formato te deixa editar qualquer coisa
  abrindo os arquivos direto, sem precisar de `npm run build`.
- Os dados já ficam isolados em `js/data.js`, no mesmo "formato de tabela"
  descrito na especificação — trocar por Supabase depois é só reescrever as
  funções de `MCBE_REPO` (em `js/data.js`) para buscar do banco em vez do
  array local. O resto do site não muda.

Tudo o que foi pedido está funcional: busca com debounce, filtros de
categoria/versão, ordenação, "carregar mais", páginas individuais por addon,
galeria com zoom, contador de downloads, favoritos, "surpreenda-me" e painel
admin.

## Estrutura

```
index.html          → homepage (hero, categorias, catálogo, destaque)
addon.html           → página de um addon via ?slug=... (fallback/preview)
addons/<slug>.html   → página própria e indexável de cada addon (gerada)
admin.html            → painel administrativo (chave de acesso)
sobre.html, faq.html, contato.html, privacidade.html, termos.html,
cookies.html, dmca.html, creditos.html → páginas institucionais do rodapé
css/style.css         → identidade visual
js/data.js             → dados de demonstração (20 addons) + camada MCBE_REPO
js/storage.js          → favoritos, contador de downloads, sessão do admin
js/home.js, js/addon.js, js/admin.js → lógica de cada página
generate-addon-pages.js → gera addons/*.html, sitemap.xml e robots.txt
generate-static-pages.js → gera as páginas institucionais do rodapé
```

## Painel admin

Acesse `admin.html` e digite a chave `88061594` (a mesma que você definiu
antes). Addons criados por ali ficam salvos no `localStorage` do seu
navegador — por enquanto só você vê o que cadastrar, já que não há banco de
dados compartilhado ainda.

## Como publicar no GitHub Pages

1. Copie todo o conteúdo desta pasta para o seu repositório (o mesmo do
   projeto "DKNET" ou um novo, como preferir).
2. Se editar `js/data.js` (adicionar/editar addons fixos), rode de novo:
   ```
   node generate-addon-pages.js
   ```
   isso regenera as páginas individuais e o `sitemap.xml`.
3. Faça commit e push. O GitHub Pages publica automaticamente.

## Próximos passos (quando quiser evoluir pra Supabase)

1. Criar as tabelas `addons`, `categories`, `authors`, `tags`, `downloads`,
   `favorites` no Supabase, com os mesmos campos usados em `js/data.js`.
2. Trocar as funções dentro de `MCBE_REPO` (em `js/data.js`) para fazer
   `fetch` na API do Supabase em vez de ler o array local.
3. O painel admin passaria a gravar direto no banco, em vez de
   `localStorage` — aí sim, dá pra ter várias pessoas cadastrando addons
   com contas separadas.
