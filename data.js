/**
 * MCBE — carregador de addons por index.json
 *
 * Estrutura:
 *   js/data.js
 *   js/addons/index.json
 *   js/addons/<slug>.js
 *   addons/<slug>.html
 */
const MCBE_CATEGORIES = [
  { id: "addon", label: "Addons" },
  { id: "textura", label: "Texturas" },
  { id: "resource-pack", label: "Resource Packs" },
  { id: "mapa", label: "Mapas" },
  { id: "skin", label: "Skins" },
  { id: "shader", label: "Shaders" },
  { id: "outro", label: "Outros" },
];
const MCBE_VERSIONS = ["1.21", "1.20", "1.19", "1.18"];
const MCBE_ADDONS_PATH = "js/addons/";
window.MCBE_ADDONS = Array.isArray(window.MCBE_ADDONS) ? window.MCBE_ADDONS : [];
window.MCBE_LOAD_ERROR = null;
window.MCBE_LOAD_STATUS = "loading";

function mcbeSiteRoot() {
  const parts = location.pathname.split("/").filter(Boolean);
  return location.hostname.endsWith(".github.io") && parts.length ? `/${parts[0]}/` : "/";
}
const MCBE_SITE_BASE = `${location.origin}${mcbeSiteRoot()}`;
const MCBE_INDEX_URL = `${MCBE_SITE_BASE}${MCBE_ADDONS_PATH}index.json`;

function mcbeLoadScript(filename) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MCBE_SITE_BASE}${MCBE_ADDONS_PATH}${encodeURIComponent(filename)}?v=${Date.now()}`;
    script.async = false;
    script.onload = () => resolve(filename);
    script.onerror = () => reject(new Error(`Não foi possível carregar js/addons/${filename}`));
    document.head.appendChild(script);
  });
}

async function mcbeGetIndex() {
  const response = await fetch(`${MCBE_INDEX_URL}?v=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Não foi possível carregar js/addons/index.json (HTTP ${response.status}).`);
  const data = await response.json();
  const files = Array.isArray(data) ? data : data.addons;
  if (!Array.isArray(files)) throw new Error("js/addons/index.json está inválido: esperado 'addons'.");
  return files.map(String).map(s => s.trim()).filter(file => /^[^/]+\.js$/i.test(file));
}

async function mcbeLoadSingleAddon(slug) {
  const safeSlug = String(slug || "").trim().toLowerCase();
  if (!safeSlug) throw new Error("Slug do addon não informado.");
  await mcbeLoadScript(`${safeSlug}.js`);
}

async function mcbeLoadAllAddons() {
  const files = await mcbeGetIndex();
  if (!files.length) throw new Error("js/addons/index.json está vazio.");
  for (const file of files) await mcbeLoadScript(file);
}

function mcbeAddonsBySlug() {
  const map = new Map();
  for (const addon of window.MCBE_ADDONS) if (addon && addon.slug) map.set(String(addon.slug), addon);
  return [...map.values()];
}

const MCBE_URL_PARAMS = new URLSearchParams(window.location.search);
const MCBE_PATH_MATCH = window.location.pathname.match(/\/addons\/([^/]+)\.html$/i);
const MCBE_ADDON_SLUG_VALUE =
  (typeof MCBE_ADDON_SLUG !== "undefined" && MCBE_ADDON_SLUG) ||
  (MCBE_PATH_MATCH ? decodeURIComponent(MCBE_PATH_MATCH[1]) : null) ||
  MCBE_URL_PARAMS.get("slug");

const MCBE_REPO = {
  ready: (async () => {
    try {
      if (MCBE_ADDON_SLUG_VALUE) await mcbeLoadSingleAddon(MCBE_ADDON_SLUG_VALUE);
      else await mcbeLoadAllAddons();
      window.MCBE_LOAD_STATUS = "ready";
      console.log(`[MCBE] ${window.MCBE_ADDONS.length} addon(s) carregado(s).`);
      return true;
    } catch (error) {
      window.MCBE_LOAD_STATUS = "error";
      window.MCBE_LOAD_ERROR = error;
      console.error("[MCBE] Erro carregando addons:", error);
      return false;
    }
  })(),
  getAll() {
    const local = typeof MCBEStorage !== "undefined" && MCBEStorage.getLocalAddons ? MCBEStorage.getLocalAddons() : [];
    return [...mcbeAddonsBySlug(), ...local].filter(a => a && a.published !== false).sort((a,b) => Number(a.id||0)-Number(b.id||0));
  },
  getBySlug(slug) { return this.getAll().find(a => a.slug === slug) || null; },
  getFeatured() { return this.getAll().filter(a => a.featured); },
};
