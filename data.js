/**
 * MCBE — carregador de addons
 *
 * Estrutura nova:
 *   js/addons/<slug>.js
 *   addons/<slug>.html
 *
 * Cada arquivo JS registra um único addon em window.MCBE_ADDONS.
 * No catálogo, o loader descobre todos os JS da pasta pelo GitHub API.
 * Nas páginas individuais, carrega somente o JS cujo nome é igual ao HTML.
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
const MCBE_GITHUB_BRANCH = "main";

// Descobre automaticamente o repositório onde o GitHub Pages está hospedado.
// Ex.: https://usuario.github.io/mcbe/ -> usuario/mcbe
const MCBE_HOST_OWNER = location.hostname.endsWith(".github.io")
  ? location.hostname.replace(/\.github\.io$/i, "")
  : "yuricruzcorreia2024-netizen";
const MCBE_PATH_PARTS = location.pathname.split("/").filter(Boolean);
const MCBE_GITHUB_REPO = MCBE_HOST_OWNER + "/" + (MCBE_PATH_PARTS[0] || "mcbe");
const MCBE_SITE_ROOT = MCBE_PATH_PARTS.length ? `/${MCBE_PATH_PARTS[0]}/` : "/";
const MCBE_ADDONS_API = `https://api.github.com/repos/${MCBE_GITHUB_REPO}/contents/${MCBE_ADDONS_PATH}?ref=${MCBE_GITHUB_BRANCH}`;
const MCBE_SITE_BASE = `${location.origin}${MCBE_SITE_ROOT}`;

window.MCBE_ADDONS = window.MCBE_ADDONS || [];

function mcbeAddonsBySlug() {
  const map = new Map();
  for (const addon of window.MCBE_ADDONS) {
    if (addon && addon.slug) map.set(addon.slug, addon);
  }
  return [...map.values()];
}

function mcbeLoadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Não foi possível carregar ${src}`));
    document.head.appendChild(script);
  });
}

async function mcbeLoadSingleAddon(slug) {
  const safeSlug = String(slug || "").toLowerCase().trim();
  if (!safeSlug) return;
  await mcbeLoadScript(`${MCBE_SITE_BASE}${MCBE_ADDONS_PATH}${encodeURIComponent(safeSlug)}.js`);
}

async function mcbeLoadAllAddons() {
  const response = await fetch(MCBE_ADDONS_API, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub API respondeu ${response.status}.`);
  }

  const files = await response.json();
  if (!Array.isArray(files)) {
    throw new Error("A resposta do GitHub não contém uma lista de arquivos.");
  }

  const addonFiles = files
    .filter((item) => item.type === "file")
    .map((item) => item.name)
    .filter((name) => /^[^/]+\.js$/i.test(name));

  await Promise.all(
    addonFiles.map((name) =>
      mcbeLoadScript(`${MCBE_SITE_BASE}${MCBE_ADDONS_PATH}${encodeURIComponent(name)}`)
    )
  );
}

const MCBE_URL_PARAMS = new URLSearchParams(window.location.search);
const MCBE_PATH_SLUG_MATCH = window.location.pathname.match(/\/addons\/([^/]+)\.html$/i);
const MCBE_ADDON_SLUG_VALUE =
  typeof MCBE_ADDON_SLUG !== "undefined"
    ? MCBE_ADDON_SLUG
    : MCBE_PATH_SLUG_MATCH
      ? decodeURIComponent(MCBE_PATH_SLUG_MATCH[1])
      : MCBE_URL_PARAMS.get("slug");

const MCBE_REPO = {
  ready: (async () => {
    try {
      if (MCBE_ADDON_SLUG_VALUE) {
        await mcbeLoadSingleAddon(MCBE_ADDON_SLUG_VALUE);
      } else {
        await mcbeLoadAllAddons();
      }
    } catch (error) {
      console.error("MCBE: erro carregando addons", error);
    }
    return true;
  })(),

  getAll() {
    const local = typeof MCBEStorage !== "undefined" ? MCBEStorage.getLocalAddons() : [];
    return [...mcbeAddonsBySlug(), ...local]
      .filter((a) => a && a.published)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
  },

  getBySlug(slug) {
    return this.getAll().find((a) => a.slug === slug) || null;
  },

  getFeatured() {
    return this.getAll().filter((a) => a.featured);
  },
};

