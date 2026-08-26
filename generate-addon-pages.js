/**
 * generate-addon-pages.js
 * -------------------------------------------------------------------------
 * Gera uma página HTML própria (indexável) para cada addon em js/data.js,
 * dentro de /addons/<slug>.html — com <title>, description, Open Graph e
 * canonical corretos para cada um, como pede a especificação de SEO.
 *
 * Rode sempre que adicionar/editar addons diretamente em js/data.js:
 *
 *   node generate-addon-pages.js
 *
 * (Addons criados pelo painel /admin ficam só no navegador de quem
 * cadastrou, em localStorage — quando o projeto migrar para Supabase,
 * essa geração deve passar a rodar automaticamente no deploy.)
 * -------------------------------------------------------------------------
 */
const fs = require("fs");
const path = require("path");
const { MCBE_DATA, MCBE_CATEGORIES } = require("./js/data.js");

const SITE_URL = "https://exemplo-mcbe.github.io"; // troque pelo domínio real
const OUT_DIR = path.join(__dirname, "addons");

function categoryLabel(id) {
  const c = MCBE_CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

function pageHTML(addon) {
  const title = `${addon.title} — Addon para Minecraft Bedrock | MCBE`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${addon.description}">
<meta property="og:title" content="${addon.title} | MCBE">
<meta property="og:description" content="${addon.description}">
<meta property="og:type" content="website">
<meta property="og:image" content="${addon.thumbnail}">
<link rel="icon" href="../img/logo.png">
<link rel="canonical" href="${SITE_URL}/addons/${addon.slug}.html">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "${addon.title}",
  "applicationCategory": "Game",
  "operatingSystem": "Minecraft Bedrock Edition",
  "description": ${JSON.stringify(addon.description)},
  "author": { "@type": "Person", "name": ${JSON.stringify(addon.author)} }
}
</script>
<link rel="stylesheet" href="../css/style.css">
<script>const MCBE_ADDON_SLUG = ${JSON.stringify(addon.slug)};</script>
</head>
<body>

<header class="site-header">
  <div class="inner container">
    <a href="../index.html" class="brand"><img src="../img/logo.png" alt="MCBE"> MCBE</a>
    <nav class="main-nav">
      <a href="../index.html">Início</a>
      <a href="../index.html?cat=addon">Addons</a>
      <a href="../index.html?cat=textura">Texturas</a>
      <a href="../index.html?cat=mapa">Mapas</a>
      <a href="../sobre.html">Sobre</a>
    </nav>
    <div class="header-search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" placeholder="Pesquisar..." onkeydown="if(event.key==='Enter'){window.location='../index.html'}">
    </div>
    <button class="hamburger" id="hamburgerBtn" aria-label="Abrir menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div class="mobile-nav" id="mobileNav">
    <a href="../index.html">Início</a>
    <a href="../index.html?cat=addon">Addons</a>
    <a href="../sobre.html">Sobre</a>
  </div>
</header>

<main class="container" style="padding-top:28px;padding-bottom:60px;">
  <div id="addonRoot"></div>
</main>

<footer class="site-footer">
  <div class="container">
    <p class="disclaimer">MCBE não possui vínculo com Mojang Studios ou Microsoft. Minecraft é uma marca registrada de Mojang Studios.</p>
  </div>
</footer>

<div class="lightbox" id="lightbox">
  <button class="lightbox-close" id="lightboxClose">✕</button>
  <img id="lightboxImg" src="" alt="">
</div>
<div class="toast" id="toast"></div>

<script src="../js/storage.js"></script>
<script src="../js/data.js"></script>
<script src="../js/addon.js"></script>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const urls = [`${SITE_URL}/index.html`];

  MCBE_DATA.filter((a) => a.published).forEach((addon) => {
    const file = path.join(OUT_DIR, `${addon.slug}.html`);
    fs.writeFileSync(file, pageHTML(addon), "utf-8");
    urls.push(`${SITE_URL}/addons/${addon.slug}.html`);
    console.log("gerado:", `addons/${addon.slug}.html`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(__dirname, "sitemap.xml"), sitemap, "utf-8");

  const robots = `User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(__dirname, "robots.txt"), robots, "utf-8");

  console.log(`\nPronto: ${MCBE_DATA.length} páginas de addon + sitemap.xml + robots.txt`);
}

main();
