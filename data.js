/**
 * MCBE — carregador automático de addons
 *
 * NÃO edite este arquivo para cadastrar addons.
 *
 * Para adicionar:
 *   js/addons/meu-addon.js
 *   addons/meu-addon.html
 *
 * Os dois arquivos usam o mesmo nome/slug.
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

window.MCBE_ADDONS = Array.isArray(window.MCBE_ADDONS)
  ? window.MCBE_ADDONS
  : [];

window.MCBE_LOAD_ERROR = null;
window.MCBE_LOAD_STATUS = "loading";

/* Descobre automaticamente o repositório a partir do GitHub Pages. */
const mcbePathParts = location.pathname.split("/").filter(Boolean);

const MCBE_SITE_ROOT =
  location.hostname.endsWith(".github.io") && mcbePathParts.length
    ? `/${mcbePathParts[0]}/`
    : "/";

const MCBE_OWNER = location.hostname.endsWith(".github.io")
  ? location.hostname.replace(/\.github\.io$/i, "")
  : "";

const MCBE_REPO_NAME =
  location.hostname.endsWith(".github.io") && mcbePathParts.length
    ? mcbePathParts[0]
    : "";

const MCBE_REPOSITORY =
  MCBE_OWNER && MCBE_REPO_NAME
    ? `${MCBE_OWNER}/${MCBE_REPO_NAME}`
    : "";

const MCBE_SITE_BASE = `${location.origin}${MCBE_SITE_ROOT}`;
const MCBE_GITHUB_API = MCBE_REPOSITORY
  ? `https://api.github.com/repos/${MCBE_REPOSITORY}`
  : "";

function mcbeGithubJson(url) {
  return fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  }).then(async (response) => {
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail = body.message ? ` — ${body.message}` : "";
      } catch (_) {}
      throw new Error(`GitHub API ${response.status}${detail}`);
    }
    return response.json();
  });
}

async function mcbeGetBranch() {
  if (!MCBE_GITHUB_API) {
    throw new Error("Não consegui identificar o repositório GitHub.");
  }

  const repo = await mcbeGithubJson(MCBE_GITHUB_API);
  return repo.default_branch || "main";
}

async function mcbeGetAddonFiles() {
  const branch = await mcbeGetBranch();

  const tree = await mcbeGithubJson(
    `${MCBE_GITHUB_API}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  );

  if (!Array.isArray(tree.tree)) {
    throw new Error("O GitHub não retornou a árvore de arquivos.");
  }

  return tree.tree
    .filter(
      (item) =>
        item.type === "blob" &&
        /^js\/addons\/[^/]+\.js$/i.test(item.path)
    )
    .map((item) => item.path.replace(/^js\/addons\//i, ""))
    .sort();
}

function mcbeLoadScript(filename) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.src =
      `${MCBE_SITE_BASE}js/addons/${encodeURIComponent(filename)}` +
      `?v=${Date.now()}`;

    script.onload = resolve;
    script.onerror = () =>
      reject(new Error(`Não consegui carregar js/addons/${filename}`));

    document.head.appendChild(script);
  });
}

async function mcbeLoadAddons() {
  const files = await mcbeGetAddonFiles();

  console.log("[MCBE] Repositório:", MCBE_REPOSITORY);
  console.log("[MCBE] Branch encontrada:", await mcbeGetBranch());
  console.log("[MCBE] JS encontrados:", files);

  if (!files.length) {
    throw new Error(
      "Nenhum .js foi encontrado em js/addons/. " +
      "Confira o nome da pasta e se o GitHub Pages já publicou o commit."
    );
  }

  for (const filename of files) {
    await mcbeLoadScript(filename);
  }

  if (!window.MCBE_ADDONS.length) {
    throw new Error(
      "Os arquivos .js foram encontrados, mas nenhum deles adicionou " +
      "um objeto em window.MCBE_ADDONS."
    );
  }

  return true;
}

/* Página individual: addons/meu-addon.html ou ?slug=meu-addon */
const params = new URLSearchParams(location.search);

const pathMatch = location.pathname.match(
  /\/addons\/([^/]+)\.html$/i
);

const MCBE_ADDON_SLUG =
  pathMatch?.[1]
    ? decodeURIComponent(pathMatch[1])
    : params.get("slug");

const MCBE_REPO = {
  ready: mcbeLoadAddons()
    .then(() => {
      window.MCBE_LOAD_STATUS = "ready";
      console.log(
        `[MCBE] ${window.MCBE_ADDONS.length} addon(s) carregado(s).`
      );
      return true;
    })
    .catch((error) => {
      window.MCBE_LOAD_STATUS = "error";
      window.MCBE_LOAD_ERROR = error;
      console.error("[MCBE] ERRO AO CARREGAR ADDONS:", error);
      return false;
    }),

  getAll() {
    const list = Array.isArray(window.MCBE_ADDONS)
      ? window.MCBE_ADDONS
      : [];

    const local =
      typeof MCBEStorage !== "undefined"
        ? MCBEStorage.getLocalAddons()
        : [];

    const map = new Map();

    [...list, ...local].forEach((addon) => {
      if (addon && addon.slug) map.set(addon.slug, addon);
    });

    return [...map.values()].filter((addon) => addon.published !== false);
  },

  getBySlug(slug) {
    return this.getAll().find((addon) => addon.slug === slug) || null;
  },

  getFeatured() {
    return this.getAll().filter((addon) => addon.featured);
  },
};
