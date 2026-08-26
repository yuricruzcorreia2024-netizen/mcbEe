(function () {
  const lockScreen = document.getElementById("lockScreen");
  const adminShell = document.getElementById("adminShell");

  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function unlockUI() {
    lockScreen.style.display = "none";
    adminShell.style.display = "grid";
    renderDashboard();
    renderAddonsTable();
    renderForm();
  }

  if (MCBEStorage.isAdminUnlocked()) unlockUI();

  document.getElementById("unlockBtn").addEventListener("click", tryUnlock);
  document.getElementById("keyInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });
  function tryUnlock() {
    const val = document.getElementById("keyInput").value.trim();
    if (MCBEStorage.unlockAdmin(val)) {
      unlockUI();
    } else {
      document.getElementById("lockError").style.display = "block";
    }
  }

  document.getElementById("lockOutBtn").addEventListener("click", () => {
    MCBEStorage.lockAdmin();
    window.location.reload();
  });

  // ---------- navegação entre views ----------
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      ["dashboard", "addons", "novo"].forEach((v) => {
        document.getElementById(`view-${v}`).style.display = v === btn.dataset.view ? "block" : "none";
      });
      if (btn.dataset.view === "addons") renderAddonsTable();
      if (btn.dataset.view === "dashboard") renderDashboard();
    });
  });

  // ---------- dashboard ----------
  function renderDashboard() {
    const all = MCBE_REPO.getAll();
    const totalDownloads = all.reduce((sum, a) => sum + mcbeDownloadCount(a), 0);
    const published = all.filter((a) => a.published).length;
    const featured = all.filter((a) => a.featured).length;
    const popular = [...all].sort((a, b) => mcbeDownloadCount(b) - mcbeDownloadCount(a)).slice(0, 5);
    const recent = [...all].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    document.getElementById("view-dashboard").innerHTML = `
      <div class="section-head"><div class="titles"><div class="strata-bar"></div><h2>Dashboard</h2></div></div>
      <div class="stat-grid">
        <div class="stat-card"><div class="n">${all.length}</div><div class="l">Total de addons</div></div>
        <div class="stat-card"><div class="n">${mcbeFormatNumber(totalDownloads)}</div><div class="l">Total de downloads</div></div>
        <div class="stat-card"><div class="n">${published}</div><div class="l">Conteúdos publicados</div></div>
        <div class="stat-card"><div class="n">${featured}</div><div class="l">Conteúdos destacados</div></div>
      </div>
      <div class="form-grid">
        <div>
          <h4 style="font-size:13px;color:var(--text-faint);text-transform:uppercase;margin-bottom:10px;">Mais populares</h4>
          <div class="mini-list">${popular.map((a) => `<div class="mini-item"><img src="${a.thumbnail}"><div><div class="t">${a.title}</div><div class="d">↓ ${mcbeFormatNumber(mcbeDownloadCount(a))}</div></div></div>`).join("")}</div>
        </div>
        <div>
          <h4 style="font-size:13px;color:var(--text-faint);text-transform:uppercase;margin-bottom:10px;">Adicionados recentemente</h4>
          <div class="mini-list">${recent.map((a) => `<div class="mini-item"><img src="${a.thumbnail}"><div><div class="t">${a.title}</div><div class="d">${a.created_at}</div></div></div>`).join("")}</div>
        </div>
      </div>
    `;
  }

  // ---------- tabela de addons ----------
  function renderAddonsTable() {
    const all = MCBE_REPO.getAll();
    document.getElementById("view-addons").innerHTML = `
      <div class="section-head"><div class="titles"><div class="strata-bar"></div><h2>Addons</h2></div><span class="count">${all.length} itens</span></div>
      <div style="overflow-x:auto;">
      <table class="admin-table">
        <thead><tr><th></th><th>Nome</th><th>Categoria</th><th>Downloads</th><th>Publicado</th><th>Destaque</th><th>Ações</th></tr></thead>
        <tbody>
          ${all
            .map(
              (a) => `
            <tr>
              <td><img src="${a.thumbnail}" alt=""></td>
              <td>${a.title}</td>
              <td>${mcbeCategoryLabel(a.category)}</td>
              <td>${mcbeFormatNumber(mcbeDownloadCount(a))}</td>
              <td><span class="pill ${a.published ? "on" : "off"}">${a.published ? "Sim" : "Não"}</span></td>
              <td><span class="pill ${a.featured ? "on" : "off"}">${a.featured ? "Sim" : "Não"}</span></td>
              <td>
                <div class="row-actions">
                  <button data-act="pub" data-id="${a.id}">${a.published ? "Despublicar" : "Publicar"}</button>
                  <button data-act="feat" data-id="${a.id}">${a.featured ? "Remover destaque" : "Destacar"}</button>
                  <button data-act="del" data-id="${a.id}">Excluir</button>
                </div>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      </div>
    `;

    document.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const item = MCBE_REPO.getAll().find((a) => a.id === id);
        if (!item) return;

        if (item.__demo !== false && !MCBEStorage.getLocalAddons().some((a) => a.id === id)) {
          // é um dado de demonstração (fixo no data.js): simula a ação, mas
          // sem persistir, e avisa o usuário — evita confusão de "sumiu".
          showToast("Este é um conteúdo de demonstração. Cadastre um addon novo para editar de verdade.");
          return;
        }

        const local = MCBEStorage.getLocalAddons();
        const idx = local.findIndex((a) => a.id === id);
        if (idx < 0) return;

        if (btn.dataset.act === "pub") local[idx].published = !local[idx].published;
        if (btn.dataset.act === "feat") local[idx].featured = !local[idx].featured;
        if (btn.dataset.act === "del") {
          MCBEStorage.deleteLocalAddon(id);
          renderAddonsTable();
          renderDashboard();
          showToast("Addon excluído.");
          return;
        }
        MCBEStorage.saveLocalAddons(local);
        renderAddonsTable();
        renderDashboard();
      });
    });
  }

  // ---------- formulário novo addon ----------
  function renderForm() {
    document.getElementById("view-novo").innerHTML = `
      <div class="section-head"><div class="titles"><div class="strata-bar"></div><h2>Novo addon</h2></div></div>
      <form id="addonForm" class="form-grid">
        <div class="field"><label>Nome</label><input name="title" required></div>
        <div class="field"><label>Autor</label><input name="author" required></div>
        <div class="field">
          <label>Categoria</label>
          <select name="category">${MCBE_CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Versão do addon</label><input name="version" placeholder="1.0.0" required></div>
        <div class="field"><label>Versões do Minecraft (separadas por vírgula)</label><input name="minecraft_versions" placeholder="1.21, 1.20"></div>
        <div class="field"><label>URL da thumbnail</label><input name="thumbnail" placeholder="https://..." required></div>
        <div class="field"><label>URL de download</label><input name="download_url" placeholder="https://..." required></div>
        <div class="field full"><label>Descrição curta</label><textarea name="description" required></textarea></div>
        <div class="field full"><label>Descrição completa</label><textarea name="long_description"></textarea></div>
        <div class="field"><label>Tags (separadas por vírgula)</label><input name="tags" placeholder="pvp, combate"></div>
        <div class="field">
          <label>Opções</label>
          <div style="display:flex;gap:16px;align-items:center;margin-top:6px;">
            <label style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--text-muted);"><input type="checkbox" name="published" checked style="width:auto;"> Publicado</label>
            <label style="display:flex;gap:6px;align-items:center;font-size:13px;color:var(--text-muted);"><input type="checkbox" name="featured" style="width:auto;"> Destaque</label>
          </div>
        </div>
        <div class="field full"><button class="btn btn-primary" type="submit">Salvar addon</button></div>
      </form>
    `;

    document.getElementById("addonForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const title = fd.get("title").trim();
      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const addon = {
        id: Date.now(),
        title,
        slug,
        category: fd.get("category"),
        author: fd.get("author").trim(),
        description: fd.get("description").trim(),
        long_description: fd.get("long_description").trim() || fd.get("description").trim(),
        version: fd.get("version").trim(),
        minecraft_versions: fd.get("minecraft_versions").split(",").map((s) => s.trim()).filter(Boolean),
        thumbnail: fd.get("thumbnail").trim(),
        screenshots: [fd.get("thumbnail").trim()],
        download_url: fd.get("download_url").trim(),
        download_count: 0,
        featured: fd.get("featured") === "on",
        published: fd.get("published") === "on",
        tags: fd.get("tags").split(",").map((s) => s.trim()).filter(Boolean),
        created_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString().slice(0, 10),
      };

      MCBEStorage.upsertLocalAddon(addon);
      showToast("Addon salvo com sucesso!");
      e.target.reset();
      renderAddonsTable();
      renderDashboard();
      document.querySelector('.nav-btn[data-view="addons"]').click();
    });
  }
})();
