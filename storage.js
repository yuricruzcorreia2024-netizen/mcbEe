/**
 * MCBE — camada de persistência local
 * -----------------------------------------------------------------------
 * Enquanto não há backend (Supabase), tudo é guardado no localStorage do
 * navegador. As chaves e o formato foram pensados para migrar fácil:
 * "favoritos" e "downloads" viram tabelas próprias, "addons_local" some
 * assim que o cadastro passar a ser feito direto no banco.
 * -----------------------------------------------------------------------
 */

const MCBEStorage = {
  KEYS: {
    FAVORITES: "mcbe_favorites",
    DOWNLOADS: "mcbe_download_clicks",
    LOCAL_ADDONS: "mcbe_admin_addons",
    ADMIN_KEY: "mcbe_admin_session",
  },

  // ---------- favoritos ----------
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || "[]");
  },
  isFavorite(slug) {
    return this.getFavorites().includes(slug);
  },
  toggleFavorite(slug) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(slug);
    if (idx >= 0) favs.splice(idx, 1);
    else favs.push(slug);
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favs));
    return idx < 0; // true = acabou de favoritar
  },

  // ---------- contagem de downloads (com proteção simples) ----------
  // Guarda { slug: timestamp } do último clique dessa sessão de navegador,
  // e bloqueia recontagem do mesmo addon por 12h — isso substitui, no
  // front, o rate-limit por IP/cookie que deve existir no backend real.
  registerDownloadClick(slug) {
    const clicks = JSON.parse(localStorage.getItem(this.KEYS.DOWNLOADS) || "{}");
    const now = Date.now();
    const last = clicks[slug] || 0;
    const twelveHours = 12 * 60 * 60 * 1000;
    if (now - last < twelveHours) {
      return { counted: false };
    }
    clicks[slug] = now;
    localStorage.setItem(this.KEYS.DOWNLOADS, JSON.stringify(clicks));

    // incrementa o contador "visual" local do addon (persistido separado
    // dos dados de demonstração, pra não editar MCBE_DATA em memória)
    const extra = JSON.parse(localStorage.getItem("mcbe_download_extra") || "{}");
    extra[slug] = (extra[slug] || 0) + 1;
    localStorage.setItem("mcbe_download_extra", JSON.stringify(extra));
    return { counted: true };
  },
  getExtraDownloads(slug) {
    const extra = JSON.parse(localStorage.getItem("mcbe_download_extra") || "{}");
    return extra[slug] || 0;
  },

  // ---------- addons cadastrados pelo painel admin ----------
  getLocalAddons() {
    return JSON.parse(localStorage.getItem(this.KEYS.LOCAL_ADDONS) || "[]");
  },
  saveLocalAddons(list) {
    localStorage.setItem(this.KEYS.LOCAL_ADDONS, JSON.stringify(list));
  },
  upsertLocalAddon(addon) {
    const list = this.getLocalAddons();
    const idx = list.findIndex((a) => a.id === addon.id);
    if (idx >= 0) list[idx] = addon;
    else list.push(addon);
    this.saveLocalAddons(list);
  },
  deleteLocalAddon(id) {
    this.saveLocalAddons(this.getLocalAddons().filter((a) => a.id !== id));
  },

  // ---------- sessão do painel admin ----------
  ADMIN_ACCESS_KEY: "88061594",
  isAdminUnlocked() {
    return sessionStorage.getItem(this.KEYS.ADMIN_KEY) === "1";
  },
  unlockAdmin(key) {
    if (key === this.ADMIN_ACCESS_KEY) {
      sessionStorage.setItem(this.KEYS.ADMIN_KEY, "1");
      return true;
    }
    return false;
  },
  lockAdmin() {
    sessionStorage.removeItem(this.KEYS.ADMIN_KEY);
  },
};

function mcbeFormatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

function mcbeDownloadCount(addon) {
  return addon.download_count + MCBEStorage.getExtraDownloads(addon.slug);
}

function mcbeCategoryLabel(id) {
  const cat = MCBE_CATEGORIES.find((c) => c.id === id);
  return cat ? cat.label : id;
}
