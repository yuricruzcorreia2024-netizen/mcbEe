const fs = require("fs");
const path = require("path");

function shell(title, body) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — MCBE</title>
<link rel="icon" href="img/logo.png">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<header class="site-header">
  <div class="inner container">
    <a href="index.html" class="brand"><img src="img/logo.png" alt="MCBE"> MCBE</a>
    <nav class="main-nav">
      <a href="index.html">Início</a>
      <a href="index.html?cat=addon">Addons</a>
      <a href="index.html?cat=textura">Texturas</a>
      <a href="index.html?cat=mapa">Mapas</a>
      <a href="sobre.html">Sobre</a>
    </nav>
  </div>
</header>
<main class="container" style="padding:44px 0 70px;max-width:760px;">
  <div class="strata-bar" style="margin-bottom:14px;"></div>
  ${body}
</main>
<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">MCBE não possui vínculo com Mojang Studios ou Microsoft. Minecraft é uma marca registrada de Mojang Studios.</p>
  </div>
</footer>
</body>
</html>
`;
}

const pages = {
  "sobre.html": [
    "Sobre o MCBE",
    `<h1 style="font-family:var(--font-display);">Sobre o MCBE</h1>
     <p style="color:var(--text-muted);line-height:1.7;">O MCBE é um catálogo independente feito por e para a comunidade de Minecraft Bedrock Edition. Reunimos addons, texturas, resource packs, mapas, skins e shaders de vários criadores em um só lugar, com busca e filtros pra facilitar achar o que você procura.</p>
     <p style="color:var(--text-muted);line-height:1.7;">Não hospedamos os arquivos: cada conteúdo aponta para o link de download do próprio criador. Nosso trabalho é organizar, catalogar e dar visibilidade.</p>`,
  ],
  "faq.html": [
    "Perguntas frequentes",
    `<h1 style="font-family:var(--font-display);">Perguntas frequentes</h1>
     <div class="block"><h2>O MCBE hospeda os arquivos?</h2><p>Não. O botão "Baixar" leva até o link de download fornecido pelo criador do conteúdo.</p></div>
     <div class="block"><h2>Posso enviar meu addon pro catálogo?</h2><p>Sim — use a página de Contato para enviar os detalhes do seu conteúdo.</p></div>
     <div class="block"><h2>Os favoritos ficam salvos se eu trocar de aparelho?</h2><p>Por enquanto os favoritos ficam salvos só neste navegador. Sincronização com conta está nos planos.</p></div>`,
  ],
  "contato.html": [
    "Contato",
    `<h1 style="font-family:var(--font-display);">Contato</h1>
     <p style="color:var(--text-muted);line-height:1.7;">Quer sugerir um addon, relatar um link quebrado ou tirar uma dúvida? Fale com a gente pelo Discord ou pelas redes sociais do MCBE, linkadas no rodapé do site.</p>`,
  ],
  "privacidade.html": [
    "Política de privacidade",
    `<h1 style="font-family:var(--font-display);">Política de privacidade</h1>
     <p style="color:var(--text-muted);line-height:1.7;">O MCBE guarda localmente, no seu navegador, apenas dados como favoritos e histórico de cliques em download, usados para evitar contagens duplicadas. Não coletamos dados pessoais nem compartilhamos informações com terceiros.</p>`,
  ],
  "termos.html": [
    "Termos de uso",
    `<h1 style="font-family:var(--font-display);">Termos de uso</h1>
     <p style="color:var(--text-muted);line-height:1.7;">Ao usar o MCBE, você concorda em utilizar o catálogo apenas para fins de consulta e download de conteúdos de terceiros. O MCBE não se responsabiliza pelo conteúdo, funcionamento ou segurança dos arquivos hospedados por terceiros.</p>`,
  ],
  "cookies.html": [
    "Política de cookies",
    `<h1 style="font-family:var(--font-display);">Política de cookies</h1>
     <p style="color:var(--text-muted);line-height:1.7;">Usamos armazenamento local do navegador (localStorage) para lembrar favoritos e evitar contagens de download duplicadas. Isso não é usado para rastreamento entre sites.</p>`,
  ],
  "dmca.html": [
    "DMCA",
    `<h1 style="font-family:var(--font-display);">DMCA / Remoção de conteúdo</h1>
     <p style="color:var(--text-muted);line-height:1.7;">Se você é titular de direitos autorais e acredita que algum conteúdo listado no MCBE infringe seus direitos, entre em contato informando o link do conteúdo e a prova de titularidade. O item será analisado e removido do catálogo se procedente.</p>`,
  ],
  "creditos.html": [
    "Créditos",
    `<h1 style="font-family:var(--font-display);">Créditos</h1>
     <p style="color:var(--text-muted);line-height:1.7;">Cada addon, textura e mapa listado no MCBE pertence ao seu respectivo criador, indicado na página de cada conteúdo. Minecraft é uma marca registrada de Mojang Studios / Microsoft.</p>`,
  ],
};

for (const [file, [title, body]] of Object.entries(pages)) {
  fs.writeFileSync(path.join(__dirname, file), shell(title, body), "utf-8");
  console.log("gerado:", file);
}
