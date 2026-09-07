export type AppCategory =
  | "Life"
  | "Games"
  | "Finance"
  | "Medical"
  | "Office"
  | "Tools"
  | "Sports"
  | "Entertainment"
  | "News"
  | "Other";

export interface AppCatalogEntry {
  slug: string;
  nameZh: string;
  nameEn: string;
  description: string;
  author: string;
  email: string;
  version: string;
  category: AppCategory;
  topics: string[];
  permissions: string[];
  entryHtml: string;
  fileCount: number;
  packageSize: number;
  sourceSha256: string;
  assetName: string;
  releaseTag: string;
  logoUrl: string | null;
  screenshots: string[];
  downloadUrl: string;
  files: string[];
}

export interface AppCatalog {
  schemaVersion: number;
  repository: string;
  generatedAt: string;
  apps: AppCatalogEntry[];
}

export interface CatalogFilters {
  query: string;
  category: AppCategory | "all";
  topic: string;
  permission: string;
}

export function filterApps(apps: AppCatalogEntry[], filters: CatalogFilters): AppCatalogEntry[] {
  const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return apps.filter((app) => {
    const text = [app.slug, app.nameZh, app.nameEn, app.description, app.author, app.category, ...app.topics]
      .join(" ").toLowerCase();
    return terms.every((term) => text.includes(term))
      && (filters.category === "all" || app.category === filters.category)
      && (filters.topic === "" || app.topics.includes(filters.topic))
      && (filters.permission === "all" || app.permissions.includes(filters.permission));
  });
}

export async function loadCatalog(): Promise<AppCatalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}generated/catalog.json`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`catalog request failed (${response.status})`);
  const catalog = (await response.json()) as AppCatalog;
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.apps)) {
    throw new Error("catalog schema is invalid");
  }
  return catalog;
}

export function assetUrl(relativePath: string): string {
  return `${import.meta.env.BASE_URL}${relativePath}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseRoute(hash = window.location.hash): { page: "home" | "apps" | "detail"; slug?: string } {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] !== "apps") return { page: "home" };
  return parts[1] ? { page: "detail", slug: parts[1] } : { page: "apps" };
}
