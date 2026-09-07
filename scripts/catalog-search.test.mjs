import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { loadApps, makeCatalog } from "./app-catalog.mjs";
import { filterApps } from "../src/catalog.ts";

const apps = makeCatalog(loadApps(path.resolve(import.meta.dirname, "../apps"))).apps;
const defaults = { query: "", category: "all", topic: "", permission: "all" };
const search = (filters) => filterApps(apps, { ...defaults, ...filters }).map((app) => app.slug);

test("searches app identity, author, category, and topics without case sensitivity", () => {
  assert.deepEqual(search({ query: "  MeDiCaL  " }), ["case-report-trends"]);
  assert.deepEqual(search({ query: "goMoku" }), ["gomoku-bot"]);
  assert.deepEqual(search({ query: "family-tree" }), ["family-tree"]);
  assert.deepEqual(search({ query: "Family Tree" }), ["family-tree"]);
  assert.equal(search({ query: "alex" }).length, apps.length);
  const gomoku = apps.find((app) => app.slug === "gomoku-bot");
  assert.deepEqual(search({ query: gomoku.nameZh }), [gomoku.slug]);
  assert.ok(search({ query: gomoku.topics[0] }).includes(gomoku.slug));
});

test("combines multiple search terms across metadata fields", () => {
  assert.deepEqual(search({ query: " games \t Bot\nAlex " }), ["gomoku-bot"]);
  assert.deepEqual(search({ query: "Games Medical" }), []);
  assert.equal(search({ query: " \n\t " }).length, apps.length);
});

test("combines category, topic, permission, and keyword filters", () => {
  const topic = apps.find((app) => app.slug === "gomoku-bot").topics[0];
  assert.deepEqual(search({ category: "Games" }), ["gomoku-bot"]);
  assert.deepEqual(search({ category: "Games", topic, permission: "downloads", query: "Gomoku" }), ["gomoku-bot"]);
  assert.deepEqual(search({ category: "Medical", topic }), []);
  assert.deepEqual(search({ category: "Life", permission: "pointerLock" }), []);
  assert.equal(search(defaults).length, apps.length);
});

test("treats a topic named all as an exact topic filter", () => {
  const entries = [{ ...apps[0], topics: ["all"] }, ...apps.slice(1)];
  assert.deepEqual(filterApps(entries, { ...defaults, topic: "all" }).map((app) => app.slug), [apps[0].slug]);
});
