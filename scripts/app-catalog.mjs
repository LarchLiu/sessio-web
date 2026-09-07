import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const REQUIRED_METADATA_FIELDS = [
  "nameZh",
  "nameEn",
  "description",
  "author",
  "email",
  "version",
  "category",
];

export const SUPPORTED_CATEGORIES = new Set([
  "Life",
  "Games",
  "Finance",
  "Medical",
  "Office",
  "Tools",
  "Sports",
  "Entertainment",
  "News",
  "Other",
]);

export const SUPPORTED_PERMISSIONS = new Set([
  "autoplay",
  "clipboardWrite",
  "downloads",
  "fullscreen",
  "gamepad",
  "modals",
  "pointerLock",
  "popups",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/;

function isImage(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function listFiles(directory, relative = "") {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      if (entry.name === ".DS_Store" || entry.name === "node_modules" || entry.name === ".git") {
        return [];
      }
      const entryPath = path.join(directory, entry.name);
      const entryRelative = path.join(relative, entry.name);
      if (entry.isDirectory()) return listFiles(entryPath, entryRelative);
      return entry.isFile() ? [entryRelative.replaceAll(path.sep, "/")] : [];
    });
}

function readMetadata(configPath, slug) {
  let metadata;
  try {
    metadata = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`${slug}: cannot parse web/config.json (${error.message})`);
  }
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${slug}: web/config.json must contain an object`);
  }
  for (const field of REQUIRED_METADATA_FIELDS) {
    if (typeof metadata[field] !== "string" || metadata[field].trim() === "") {
      throw new Error(`${slug}: config field ${field} must be a non-empty string`);
    }
  }
  if (!VERSION_PATTERN.test(metadata.version)) {
    throw new Error(`${slug}: version must use semantic version format`);
  }
  if (!SUPPORTED_CATEGORIES.has(metadata.category.trim())) {
    throw new Error(`${slug}: config field category must be one of ${[...SUPPORTED_CATEGORIES].join(", ")}`);
  }
  if (!Array.isArray(metadata.topics)) {
    throw new Error(`${slug}: config field topics must be an array`);
  }
  for (const topic of metadata.topics) {
    if (typeof topic !== "string" || topic.trim() === "") {
      throw new Error(`${slug}: each topic must be a non-empty string`);
    }
  }
  if (metadata.permissions !== undefined) {
    if (!Array.isArray(metadata.permissions)) {
      throw new Error(`${slug}: permissions must be an array`);
    }
    for (const permission of metadata.permissions) {
      if (typeof permission !== "string" || !SUPPORTED_PERMISSIONS.has(permission)) {
        throw new Error(`${slug}: unsupported permission ${JSON.stringify(permission)}`);
      }
    }
  }
  return {
    nameZh: metadata.nameZh.trim(),
    nameEn: metadata.nameEn.trim(),
    description: metadata.description.trim(),
    author: metadata.author.trim(),
    email: metadata.email.trim(),
    version: metadata.version.trim(),
    category: metadata.category.trim(),
    topics: [...new Set(metadata.topics.map((topic) => topic.trim()))],
    permissions: [...new Set(metadata.permissions ?? [])],
  };
}

function findWebFiles(webDirectory) {
  const files = listFiles(webDirectory);
  const htmlFiles = files.filter((file) => path.extname(file).toLowerCase() === ".html");
  if (htmlFiles.length === 0) throw new Error("app must contain at least one HTML file in web/");

  const logo = files.find((file) => {
    const parsed = path.parse(file);
    return parsed.dir === "" && parsed.name.toLowerCase() === "logo" && isImage(file);
  }) ?? null;

  return { files, htmlFiles, logo };
}

function findListingScreenshots(appDirectory) {
  const screenshotsDirectory = path.join(appDirectory, "screenshots");
  return listFiles(screenshotsDirectory).filter(isImage);
}

export function loadApps(sourceRoot) {
  if (!existsSync(sourceRoot)) throw new Error(`app source directory does not exist: ${sourceRoot}`);
  return readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const slug = entry.name;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(`${slug}: directory name must be lowercase kebab-case`);
      }
      const appDirectory = path.join(sourceRoot, slug);
      const webDirectory = path.join(appDirectory, "web");
      if (!statSync(webDirectory, { throwIfNoEntry: false })?.isDirectory()) {
        throw new Error(`${slug}: missing web/ directory`);
      }
      const metadata = readMetadata(path.join(webDirectory, "config.json"), slug);
      const webFiles = findWebFiles(webDirectory);
      const screenshots = findListingScreenshots(appDirectory);
      const files = listFiles(appDirectory).filter(
        (file) => !file.startsWith("web/screenshots/") && !file.startsWith("web/exports/"),
      );
      const entryHtml = webFiles.htmlFiles.find((file) => path.basename(file, path.extname(file)).toLowerCase() === slug)
        ?? webFiles.htmlFiles[0];
      const packageBytes = files.reduce((total, file) => total + statSync(path.join(appDirectory, file)).size, 0);
      const checksum = createHash("sha256");
      for (const file of files) checksum.update(readFileSync(path.join(appDirectory, file)));

      return {
        slug,
        directory: appDirectory,
        webDirectory,
        ...metadata,
        entryHtml: `web/${entryHtml}`,
        files,
        fileCount: files.length,
        sourceBytes: packageBytes,
        sourceSha256: checksum.digest("hex"),
        logo: webFiles.logo,
        screenshots,
      };
    });
}

export function getAppRelease(app) {
  return {
    releaseTag: `${app.slug}-v${app.version}`,
    assetName: `sessio-app-${app.slug}-${app.version}.zip`,
  };
}

export function makeCatalog(apps, {
  repository = "LarchLiu/sessio-web",
  publicPrefix = "generated",
} = {}) {
  return {
    schemaVersion: 1,
    repository,
    generatedAt: new Date().toISOString(),
    apps: apps.map((app) => {
      const { releaseTag, assetName } = getAppRelease(app);
      const releaseBase = `https://github.com/${repository}/releases/download/${releaseTag}`;
      return {
        slug: app.slug,
        nameZh: app.nameZh,
        nameEn: app.nameEn,
        description: app.description,
        author: app.author,
        email: app.email,
        version: app.version,
        category: app.category,
        topics: app.topics,
        permissions: app.permissions,
        entryHtml: app.entryHtml,
        fileCount: app.fileCount,
        packageSize: app.sourceBytes,
        sourceSha256: app.sourceSha256,
        assetName,
        releaseTag,
        logoUrl: app.logo ? `${publicPrefix}/apps/${app.slug}/logo${path.extname(app.logo).toLowerCase()}` : null,
        screenshots: app.screenshots.map((file) => `${publicPrefix}/apps/${app.slug}/screenshots/${file}`),
        downloadUrl: `${releaseBase}/${assetName}`,
        files: app.files,
      };
    }),
  };
}

export function copyDisplayAssets(apps, outputRoot) {
  for (const app of apps) {
    const appOutput = path.join(outputRoot, "apps", app.slug);
    if (app.logo) {
      const target = path.join(appOutput, `logo${path.extname(app.logo).toLowerCase()}`);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(path.join(app.webDirectory, app.logo), target);
    }
    for (const screenshot of app.screenshots) {
      const target = path.join(appOutput, "screenshots", screenshot);
      mkdirSync(path.dirname(target), { recursive: true });
      cpSync(path.join(app.directory, "screenshots", screenshot), target);
    }
  }
}
