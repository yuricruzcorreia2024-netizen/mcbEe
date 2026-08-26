(function () {
  MCBE_REPO.ready.then((loaded) => {
    if (!loaded) {
      const root = document.getElementById("addonRoot");
      if (root) root.innerHTML = `<p class="empty-state">Não foi possível carregar este addon.<br><small>${window.MCBE_LOAD_ERROR?.message || "Erro desconhecido."}</small></p>`;
      return;
    }
  const slug =
    (typeof MCBE_ADDON_SLUG !== "undefined" && MCBE_ADDON_SLUG) ||
    new URLSearchParams(window.location.search).get("slug");

  const root = document.getElementById("addonRoot");
  const addon = slug ? MCBE_REPO.getBySlug(slug) : null;

  if (!addon) {
    root.innerHTML = `<p class="empty-state">Conteúdo não encontrado. <a href="../index.html" style="color:var(--grass)">Voltar ao catálogo</a></p>`;
    return;
  }

  document.title = `${addon.title} — Addon para Minecraft Bedrock | MCBE`;
  const setMeta = (sel, attr, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  };
  setMeta('meta[name="description"]', "content", addon.description);
  setMeta('meta[property="og:title"]', "content", `${addon.title} | MCBE`);
  setMeta('meta[property="og:description"]', "content", addon.description);
  setMeta('meta[property="og:image"]', "content", addon.thumbnail);
  setMeta('link[rel="canonical"]', "href", `https://yuricruzcorreia2024-netizen.github.io/mcbEe/addons/${addon.slug}.html`);

  let galleryIndex = 0;

  function galleryHTML() {
    const shots = addon.screenshots.length ? addon.screenshots : [addon.thumbnail];
    return `
      <div class="gallery-main" id="galleryMain">
        <img id="galleryMainImg" src="${shots[0]}" alt="${addon.title} — captura de tela 1">
      </div>
      ${
        shots.length > 1
          ? `<div class="gallery-thumbs">${shots
              .map((s, i) => `<img src="${s}" data-i="${i}" class="${i === 0 ? "active" : ""}" alt="miniatura ${i + 1}">`)
              .join("")}</div>`
          : ""
      }`;
  }

  function infoRows() {
    const rows = [
      ["Nome", addon.title],
      ["Autor", addon.author],
      ["Categoria", mcbeCategoryLabel(addon.category)],
      ["Versão", addon.version],
      ["Minecraft", addon.minecraft_versions.join(", ")],
      ["Downloads", mcbeFormatNumber(mcbeDownloadCount(addon))],
      ["Atualizado", addon.updated_at],
    ];
    return rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  }

  function miniListHTML(list) {
    return list
      .slice(0, 4)
      .map(
        (a) => `
      <a href="../${a.page || `addons/${a.slug}.html`}" class="mini-item">
        <img src="${a.thumbnail}" alt="${a.title}">
        <div>
          <div class="t">${a.title}</div>
          <div class="d">↓ ${mcbeFormatNumber(mcbeDownloadCount(a))}</div>
        </div>
      </a>`
      )
      .join("");
  }

  const allContent = MCBE_REPO.getAll();
  const popular = [...allContent].sort((a, b) => mcbeDownloadCount(b) - mcbeDownloadCount(a));
  const recent = [...allContent].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  root.innerHTML = `
    <div class="breadcrumb">
      <a href="../index.html">Início</a> / <a href="../index.html?cat=${addon.category}">${mcbeCategoryLabel(addon.category)}</a> / ${addon.title}
    </div>

    <div class="addon-header">
      <div>
        <span class="card-cat" style="position:static;">${mcbeCategoryLabel(addon.category)}</span>
        <h1>${addon.title}</h1>
        <div class="addon-meta-row">
          <span>Por <b style="color:var(--text)">${addon.author}</b></span>
          <span>v${addon.version}</span>
          <span class="downloads">↓ ${mcbeFormatNumber(mcbeDownloadCount(addon))} downloads</span>
          <span>MC ${addon.minecraft_versions.join(", ")}</span>
        </div>
        <div class="addon-tags">${(addon.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
    </div>

    <div class="addon-layout">
      <div>
        <div id="galleryWrap">${galleryHTML()}</div>

        <div class="block">
          <h2>Descrição</h2>
          <p>${addon.long_description}</p>
        </div>

        <div class="block">
          <h2>Informações</h2>
          <table class="info-table"><tbody>${infoRows()}</tbody></table>
        </div>

        <div class="block">
          <h2>Como instalar</h2>
          <ol class="steps-list">
            <li>Baixe o arquivo.</li>
            <li>Abra o arquivo <code>.mcaddon</code> ou <code>.mcpack</code>.</li>
            <li>Aguarde a importação.</li>
            <li>Abra seu mundo.</li>
            <li>Ative os pacotes necessários.</li>
            <li>Entre no mundo.</li>
          </ol>
        </div>
      </div>

      <aside class="sidebar-card">
        <button class="btn btn-primary btn-block big-download" id="downloadBtn">BAIXAR</button>
        <div class="sidebar-actions">
          <button class="btn btn-secondary" id="favBtn" style="flex:1;">${MCBEStorage.isFavorite(addon.slug) ? "♥ Favoritado" : "♡ Favoritar"}</button>
        </div>
        <p class="sidebar-note">O download abre em uma nova aba, no site do autor/hospedagem do conteúdo.</p>

        <h4 style="margin:20px 0 4px;font-size:12px;color:var(--text-faint);text-transform:uppercase;">Mais populares</h4>
        <div class="mini-list">${miniListHTML(popular.filter((a) => a.slug !== addon.slug))}</div>

        <h4 style="margin:20px 0 4px;font-size:12px;color:var(--text-faint);text-transform:uppercase;">Adicionados recentemente</h4>
        <div class="mini-list">${miniListHTML(recent.filter((a) => a.slug !== addon.slug))}</div>
      </aside>
    </div>
  `;

  // ---------- galeria / lightbox ----------
  const shots = addon.screenshots.length ? addon.screenshots : [addon.thumbnail];
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");

  function openLightbox(i) {
    galleryIndex = i;
    lightboxImg.src = shots[galleryIndex];
    lightbox.classList.add("open");
  }
  document.getElementById("galleryMain").addEventListener("click", () => openLightbox(0));
  document.querySelectorAll(".gallery-thumbs img").forEach((img) => {
    img.addEventListener("click", () => {
      const i = Number(img.dataset.i);
      document.getElementById("galleryMainImg").src = shots[i];
      document.querySelectorAll(".gallery-thumbs img").forEach((t) => t.classList.remove("active"));
      img.classList.add("active");
    });
  });
  document.getElementById("lightboxClose").addEventListener("click", () => lightbox.classList.remove("open"));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("open");
  });

  // ---------- download ----------
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const result = MCBEStorage.registerDownloadClick(addon.slug);
    if (result.counted) showToast("Download registrado!");
    window.open(addon.download_url, "_blank", "noopener");
  });

  // ---------- favoritar ----------
  document.getElementById("favBtn").addEventListener("click", (e) => {
    const isFav = MCBEStorage.toggleFavorite(addon.slug);
    e.currentTarget.textContent = isFav ? "♥ Favoritado" : "♡ Favoritar";
  });

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  document.getElementById("hamburgerBtn")?.addEventListener("click", () => {
    document.getElementById("mobileNav").classList.toggle("open");
  });
  });
})();
