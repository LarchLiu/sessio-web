#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyDisplayAssets, loadApps, makeCatalog } from "./app-catalog.mjs";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(webRoot, "apps");
const outputRoot = path.join(webRoot, "public", "generated");
const repository = process.env.GITHUB_REPOSITORY ?? "LarchLiu/sessio-web";

const apps = loadApps(sourceRoot);
rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });
copyDisplayAssets(apps, outputRoot);
const catalog = makeCatalog(apps, { repository });
writeFileSync(path.join(outputRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated catalog for ${apps.length} app(s) at ${path.join(outputRoot, "catalog.json")}`);
