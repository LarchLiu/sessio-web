#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAppRelease, loadApps } from "./app-catalog.mjs";

export function packageApp(app, outputRoot) {
  mkdirSync(outputRoot, { recursive: true });
  if (!existsSync("/usr/bin/zip") && !existsSync("/usr/local/bin/zip")) {
    const probe = spawnSync("zip", ["-v"], { stdio: "ignore" });
    if (probe.error) throw new Error("zip command is required to package apps");
  }
  const { assetName } = getAppRelease(app);
  const outputPath = path.join(outputRoot, assetName);
  rmSync(outputPath, { force: true });
  const result = spawnSync(
    "zip",
    [
      "-X", "-q", "-r", outputPath, app.slug,
      "-x", "*/.DS_Store", "*/node_modules/*", "*/.git/*", "*/web/screenshots/*", "*/web/exports/*",
    ],
    { cwd: path.dirname(app.directory), stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`failed to package ${app.slug}`);
  console.log(`Packaged ${assetName}`);
  return outputPath;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = new Map();
  for (let index = 2; index < process.argv.length; index += 2) {
    const key = process.argv[index];
    const value = process.argv[index + 1];
    if (!["--output", "--app"].includes(key) || value === undefined) {
      throw new Error("usage: package-apps [--output <directory>] [--app <slug>]");
    }
    args.set(key.slice(2), value);
  }
  const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const outputRoot = path.resolve(args.get("output") ?? path.join(webRoot, "dist", "app-packages"));
  const apps = loadApps(path.join(webRoot, "apps"))
    .filter((app) => !args.has("app") || app.slug === args.get("app"));
  if (!apps.length) throw new Error(`no apps found for ${args.get("app") ?? "packaging"}`);
  for (const app of apps) packageApp(app, outputRoot);
}
