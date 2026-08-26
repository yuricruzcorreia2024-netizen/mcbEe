(function () {
  MCBE_REPO.ready.then((loaded) => {
    if (!loaded) {
      const grid = document.getElementById("catalogGrid");
      const resultCount = document.getElementById("resultCount");
      if (resultCount) resultCount.textContent = "erro ao carregar";
      if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><strong>Não foi possível carregar os addons.</strong><br><small>${window.MCBE_LOAD_ERROR?.message || "Erro desconhecido."}</small></div>`;
      return;
    }
  const PAGE_SIZE = 8;
  let state = {
    query: "",
    category: "all",
    version: "",
    sort: "recent",
    visible: PAGE_SIZE,
  };

  const grid = document.getElementById("catalogGrid");
  const emptyState = document.getElementById("emptyState");
  const resultCount = document.getElementById("resultCount");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const chipsWrap = document.getElementById("categoriaChips");

  // ---------- categorias (chips) ----------
  function renderChips() {
    const all = [{ id: "all", label: "Todos" }, ...MCBE_CATEGORIES];
    chipsWrap.innerHTML = all
      .map(
        (c) =>
          `<button class="chip ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">${c.label}</button>`
      )
      .join("");
    chipsWrap.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.category = btn.dataset.cat;
        state.visible = PAGE_SIZE;
        renderChips();
        render();
      });
    });
  }

  // ---------- card ----------
  function cardHTML(addon) {
    const fav = MCBEStorage.isFavorite(addon.slug);
    return `
    <div class="card">
      <a href="${addon.page || `addons/${addon.slug}.html`}" aria-label="${addon.title}">
        <div class="card-thumb">
          <img src="${addon.thumbnail}" alt="${addon.title}" loading="lazy">
          <span class="card-cat">${mcbeCategoryLabel(addon.category)}</span>
        </div>
      </a>
      <button class="card-fav ${fav ? "active" : ""}" data-slug="${addon.slug}" aria-label="Favoritar">${fav ? "♥" : "♡"}</button>
      <div class="card-body">
        <a href="${addon.page || `addons/${addon.slug}.html`}">
          <h3 class="card-title">${addon.title}</h3>
        </a>
        <span class="card-author">Por ${addon.author}</span>
        <p class="card-desc">${addon.description}</p>
        <div class="card-meta">
          <span>v${addon.version}</span>
          <span class="downloads">↓ ${mcbeFormatNumber(mcbeDownloadCount(addon))}</span>
        </div>
        <a href="${addon.page || `addons/${addon.slug}.html`}" class="btn btn-primary btn-block">Baixar</a>
      </div>
    </div>`;
  }

  function attachFavHandlers() {
    grid.querySelectorAll(".card-fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const isFav = MCBEStorage.toggleFavorite(btn.dataset.slug);
        btn.classList.toggle("active", isFav);
        btn.textContent = isFav ? "♥" : "♡";
      });
    });
  }

  // ---------- filtrar + ordenar ----------
  function getFiltered() {
    let list = MCBE_REPO.getAll();

    if (state.category !== "all") {
      list = list.filter((a) => a.category === state.category);
    }
    if (state.version) {
      list = list.filter((a) => a.minecraft_versions.includes(state.version));
    }
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter((a) =>
        [a.title, a.author, a.category, a.description, ...(a.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    switch (state.sort) {
      case "downloads":
      case "popular":
        list = [...list].sort((a, b) => mcbeDownloadCount(b) - mcbeDownloadCount(a));
        break;
      case "featured":
        list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case "random":
        list = [...list].sort(() => Math.random() - 0.5);
        break;
      case "recent":
      default:
        list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return list;
  }

  function render() {
    const filtered = getFiltered();
    resultCount.textContent = `${filtered.length} conteúdo${filtered.length === 1 ? "" : "s"}`;

    const slice = filtered.slice(0, state.visible);
    grid.innerHTML = slice.map(cardHTML).join("");
    attachFavHandlers();

    emptyState.style.display = filtered.length === 0 ? "block" : "none";
    grid.style.display = filtered.length === 0 ? "none" : "grid";
    loadMoreBtn.style.display = state.visible < filtered.length ? "inline-flex" : "none";
  }

  // ---------- destaque ----------
  function renderFeatured() {
    const featured = MCBE_REPO.getFeatured();
    const slot = document.getElementById("featuredSlot");
    if (!featured.length) {
      document.getElementById("destaque-wrap").style.display = "none";
      return;
    }
    const a = featured[0];
    slot.innerHTML = `
      <div class="featured-card">
        <div class="featured-media"><img src="${a.thumbnail}" alt="${a.title}"></div>
        <div class="featured-content">
          <span class="card-cat">${mcbeCategoryLabel(a.category)}</span>
          <h3>${a.title}</h3>
          <p>${a.description}</p>
          <div class="featured-stats">
            <span>Por <b>${a.author}</b></span>
            <span>v<b>${a.version}</b></span>
            <span>↓ <b>${mcbeFormatNumber(mcbeDownloadCount(a))}</b> downloads</span>
          </div>
          <a href="${a.page || `addons/${a.slug}.html`}" class="btn btn-primary">Baixar agora</a>
        </div>
      </div>`;
  }

  // ---------- busca com debounce ----------
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
  const onSearch = debounce((value) => {
    state.query = value;
    state.visible = PAGE_SIZE;
    render();
  }, 250);

  document.getElementById("heroSearch").addEventListener("input", (e) => {
    document.getElementById("headerSearch").value = e.target.value;
    onSearch(e.target.value);
    document.getElementById("colecao").scrollIntoView({ behavior: "smooth" });
  });
  document.getElementById("headerSearch").addEventListener("input", (e) => {
    document.getElementById("heroSearch").value = e.target.value;
    onSearch(e.target.value);
  });

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  document.getElementById("versionSelect").addEventListener("change", (e) => {
    state.version = e.target.value;
    state.visible = PAGE_SIZE;
    render();
  });
  loadMoreBtn.addEventListener("click", () => {
    state.visible += PAGE_SIZE;
    render();
  });

  // ---------- surpreenda-me ----------
  document.getElementById("surpriseBtn").addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const all = MCBE_REPO.getAll();
    if (!all.length) return;
    btn.classList.add("surprise-spin");
    btn.disabled = true;
    setTimeout(() => {
      const pick = all[Math.floor(Math.random() * all.length)];
      window.location.href = pick.page || `addons/${pick.slug}.html`;
    }, 600);
  });

  // ---------- menu mobile ----------
  document.getElementById("hamburgerBtn").addEventListener("click", () => {
    document.getElementById("mobileNav").classList.toggle("open");
  });

  // ---------- categoria via querystring (?cat=) ----------
  const params = new URLSearchParams(window.location.search);
  if (params.get("cat")) state.category = params.get("cat");

  renderChips();
  renderFeatured();
  render();
  });
})();
