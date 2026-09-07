import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { loadApps, makeCatalog } from "./app-catalog.mjs";

function metadataFixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), "sessio-metadata-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const webRoot = path.join(root, "demo", "web");
  mkdirSync(webRoot, { recursive: true });
  writeFileSync(path.join(webRoot, "demo.html"), "<!doctype html>");
  return (overrides) => {
    writeFileSync(path.join(webRoot, "config.json"), JSON.stringify({
      nameZh: "Demo", nameEn: "Demo", description: "Demo app",
      author: "Alex", email: "alex@example.com", version: "1.0.0",
      category: "Games", topics: [], ...overrides,
    }));
    return loadApps(root);
  };
}

test("collects a single category and normalized topics into the catalog", (t) => {
  const load = metadataFixture(t);
  const apps = load({ category: " Games ", topics: [" Strategy ", "Board games", "Strategy"] });
  assert.equal(apps[0].category, "Games");
  assert.deepEqual(apps[0].topics, ["Strategy", "Board games"]);
  const catalog = makeCatalog(apps);
  assert.equal(catalog.apps[0].category, "Games");
  assert.deepEqual(catalog.apps[0].topics, ["Strategy", "Board games"]);
  for (const topics of [[], ["Strategy"]]) {
    assert.deepEqual(makeCatalog(load({ topics })).apps[0].topics, topics);
  }
});

test("rejects missing, empty, or multiple categories", (t) => {
  const load = metadataFixture(t);
  for (const category of [undefined, null, "", "  ", 1, {}, [], ["Games"], ["Games", "Health"]]) {
    assert.throws(() => load({ category }), /demo: config field category must be a non-empty string/);
  }
});

test("accepts the supported categories and rejects unknown or incorrectly cased labels", (t) => {
  const load = metadataFixture(t);
  for (const category of ["Life", "Games", "Finance", "Medical", "Office", "Tools", "Sports", "Entertainment", "News", "Other"]) {
    assert.equal(makeCatalog(load({ category })).apps[0].category, category);
  }
  for (const category of ["Health", "Unknown", "games", "GAMES", "Games, Life"]) {
    assert.throws(() => load({ category }), /demo: config field category must be one of/);
  }
});

test("requires a topics array containing only non-empty strings", (t) => {
  const load = metadataFixture(t);
  for (const topics of [undefined, null, "Strategy", 1, {}]) {
    assert.throws(() => load({ topics }), /demo: config field topics must be an array/);
  }
  for (const topic of [null, "", "  ", 1, {}, ["Strategy"]]) {
    assert.throws(() => load({ topics: ["Valid topic", topic] }), /demo: each topic must be a non-empty string/);
  }
});

test("loads the checked-in app catalog contract", () => {
  const root = path.resolve(import.meta.dirname, "../apps");
  const apps = loadApps(root);
  assert.deepEqual(apps.map((app) => app.slug), [
    "case-report-trends",
    "family-tree",
    "gomoku-bot",
    "infinite-garden",
  ]);
  assert.ok(apps.find((app) => app.slug === "family-tree").screenshots.length >= 1);
  assert.ok(apps.every((app) => app.files.every((file) => !file.startsWith("web/screenshots/"))));
  assert.equal(apps.find((app) => app.slug === "gomoku-bot").permissions[0], "downloads");
});

test("rejects missing metadata", () => {
  const root = mkdtempSync(path.join(tmpdir(), "sessio-app-test-"));
  mkdirSync(path.join(root, "demo", "web"), { recursive: true });
  writeFileSync(path.join(root, "demo", "web", "config.json"), JSON.stringify({ nameZh: "Demo" }));
  writeFileSync(path.join(root, "demo", "web", "demo.html"), "<!doctype html>");
  assert.throws(() => loadApps(root), /config field nameEn/);
});

test("links each app to its own versioned release", () => {
  const root = path.resolve(import.meta.dirname, "../apps");
  const apps = loadApps(root);
  const catalog = makeCatalog(apps);
  for (const app of catalog.apps) {
    assert.equal(app.releaseTag, `${app.slug}-v${app.version}`);
    assert.equal(app.downloadUrl, `https://github.com/LarchLiu/sessio-web/releases/download/${app.slug}-v${app.version}/sessio-app-${app.slug}-${app.version}.zip`);
  }
  const updatedApps = apps.map((app, index) => index === 0 ? { ...app, version: "2.0.0" } : app);
  const updatedCatalog = makeCatalog(updatedApps);
  assert.notEqual(updatedCatalog.apps[0].downloadUrl, catalog.apps[0].downloadUrl);
  assert.deepEqual(updatedCatalog.apps.slice(1), catalog.apps.slice(1));
});
