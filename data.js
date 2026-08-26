/**
 * MCBE — carregador automático de addons
 *
 * Estrutura:
 *   js/data.js
 *   js/addons/<slug>.js
 *   addons/<slug>.html
 *
 * NÃO edite este arquivo para cadastrar addons.
 * Basta colocar o JS em js/addons/.
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

window.MCBE_ADDONS = window.MCBE_ADDONS || [];

/* ---------- Descoberta do repositório ---------- */

const MCBE_PATH_PARTS = location.pathname.split("/").filter(Boolean);
const MCBE_SITE_ROOT =
  location.hostname.endsWith(".github.io") && MCBE_PATH_PARTS.length
    ? `/${MCBE_PATH_PARTS[0]}/`
    : "/";

const MCBE_OWNER = location.hostname.endsWith(".github.io")
  ? location.hostname.replace(/\.github\.io$/i, "")
  : "";

const MCBE_REPO_NAME =
  location.hostname.endsWith(".github.io") && MCBE_PATH_PARTS.length
    ? MCBE_PATH_PARTS[0]
    : "";

const MCBE_REPOSITORY =
  MCBE_OWNER && MCBE_REPO_NAME
    ? `${MCBE_OWNER}/${MCBE_REPO_NAME}`
    : "";

const MCBE_SITE_BASE = `${location.origin}${MCBE_SITE_ROOT}`;
const MCBE_ADDONS_PATH = "js/addons/";
const MCBE_GITHUB_API = MCBE_REPOSITORY
  ? `https://api.github.com/repos/${MCBE_REPOSITORY}`
  : "";

window.MCBE_LOAD_ERROR = null;
window.MCBE_LOAD_STATUS = "loading";

function mcbeLog(...args) {
  console.log("[MCBE]", ...args);
}

function mcbeScriptUrl(filename) {
  return `${MCBE_SITE_BASE}${MCBE_ADDONS_PATH}${encodeURIComponent(filename)}?v=${Date.now()}`;
}

function mcbeLoadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Não foi possível carregar: ${src}`));
    document.head.appendChild(script);
  });
}

function mcbeAddonsBySlug() {
  const map = new Map();

  for (const addon of window.MCBE_ADDONS) {
    if (addon && addon.slug) {
      map.set(String(addon.slug), addon);
    }
  }

  return [...map.values()];
}

/* ---------- GitHub ---------- */

async function mcbeGithubJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body.message ? ` — ${body.message}` : "";
    } catch (_) {}

    throw new Error(`GitHub API ${response.status}${detail}`);
  }

  return response.json();
}

async function mcbeGetDefaultBranch() {
  if (!MCBE_GITHUB_API) {
    throw new Error("Não consegui identificar o repositório GitHub.");
  }

  const repo = await mcbeGithubJson(MCBE_GITHUB_API);
  return repo.default_branch || "main";
}

async function mcbeGetAddonFiles() {
  const branch = await mcbeGetDefaultBranch();

  const treeUrl =
    `${MCBE_GITHUB_API}/git/trees/` +
    `${encodeURIComponent(branch)}?recursive=1`;

  const tree = await mcbeGithubJson(treeUrl);

  if (!Array.isArray(tree.tree)) {
    throw new Error("A árvore do GitHub não retornou arquivos.");
  }

  const prefix = "js/addons/";

  return tree.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path)
    .filter(
      (path) =>
        path.startsWith(prefix) &&
        path.toLowerCase().endsWith(".js") &&
        !path.slice(prefix.length).includes("/")
    )
    .map((path) => path.slice(prefix.length));
}

/* ---------- Carregamento ---------- */

async function mcbeLoadAllAddons() {
  const files = await mcbeGetAddonFiles();

  mcbeLog("Arquivos encontrados:", files);

  if (!files.length) {
    throw new Error(
      "A pasta js/addons existe, mas nenhum arquivo .js foi encontrado."
    );
  }

  // Sequencial para evitar corrida entre scripts.
  for (const filename of files) {
    await mcbeLoadScript(mcbeScriptUrl(filename));
  }

  return files;
}

async function mcbeLoadSingleAddon(slug) {
  const safeSlug = String(slug || "").trim();

  if (!safeSlug) {
    throw new Error("Slug do addon não informado.");
  }

  const filename = `${safeSlug}.js`;
  await mcbeLoadScript(mcbeScriptUrl(filename));

  return filename;
}

/* ---------- Identificação da página ---------- */

const MCBE_URL_PARAMS = new URLSearchParams(location.search);

const MCBE_ADDON_SLUG_FROM_PATH = location.pathname.match(
  /\/addons\/([^/]+)\.html$/i
);

const MCBE_ADDON_SLUG_VALUE =
  typeof MCBE_ADDON_SLUG !== "undefined" && MCBE_ADDON_SLUG
    ? MCBE_ADDON_SLUG
    : MCBE_ADDON_SLUG_FROM_PATH
      ? decodeURIComponent(MCBE_ADDON_SLUG_FROM_PATH[1])
      : MCBE_URL_PARAMS.get("slug");

/* ---------- API usada pelo site ---------- */

const MCBE_REPO = {
  ready: (async () => {
    try {
      if (MCBE_ADDON_SLUG_VALUE) {
        await mcbeLoadSingleAddon(MCBE_ADDON_SLUG_VALUE);
      } else {
        await mcbeLoadAllAddons();
      }

      window.MCBE_LOAD_STATUS = "ready";
      mcbeLog(
        `${window.MCBE_ADDONS.length} addon(s) carregado(s) com sucesso.`
      );
    } catch (error) {
      window.MCBE_LOAD_STATUS = "error";
      window.MCBE_LOAD_ERROR = error;

      console.error("MCBE: falha ao carregar addons.", error);

      // Não transforma erro de carregamento em "0 conteúdos" silenciosamente.
      const message =
        error && error.message
          ? error.message
          : "Erro desconhecido ao carregar os addons.";

      console.error(
        "MCBE: confira se os arquivos estão em js/addons/ e se o GitHub Pages já publicou o último commit."
      );

      // Não lança novamente: o restante do site consegue renderizar a mensagem.
      return false;
    }

    return true;
  })(),

  getAll() {
    const local =
      typeof MCBEStorage !== "undefined"
        ? MCBEStorage.getLocalAddons()
        : [];

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
