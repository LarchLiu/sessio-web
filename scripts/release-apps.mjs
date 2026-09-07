#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, openAsBlob, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAppRelease, loadApps } from "./app-catalog.mjs";
import { packageApp } from "./package-apps.mjs";

export function createReleaseClient({ repository, token, apiUrl = "https://api.github.com", fetchImpl = fetch }) {
  if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GH_TOKEN are required");
  const baseUrl = `${apiUrl}/repos/${repository}`;

  async function request(url, { method = "GET", json, body, contentType } = {}) {
    const response = await fetchImpl(url, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: json !== undefined ? JSON.stringify(json) : body,
    });
    if (!response.ok) {
      throw new Error(`GitHub ${method} ${url} failed (${response.status}): ${await response.text()}`);
    }
    return response.status === 204 ? null : response.json();
  }

  return {
    async listReleases() {
      const releases = [];
      // Listing includes drafts, so interrupted uploads can be resumed.
      for (let page = 1; ; page += 1) {
        const batch = await request(`${baseUrl}/releases?per_page=100&page=${page}`);
        releases.push(...batch);
        if (batch.length < 100) return releases;
      }
    },
    createDraft({ tag, commit, prerelease }) {
      return request(`${baseUrl}/releases`, {
        method: "POST",
        json: {
          tag_name: tag,
          target_commitish: commit,
          name: tag,
          body: `App package for ${tag}.`,
          draft: true,
          prerelease,
        },
      });
    },
    async uploadAsset(release, filePath) {
      const name = path.basename(filePath);
      const existing = release.assets.find((asset) => asset.name === name);
      if (existing) await request(`${baseUrl}/releases/assets/${existing.id}`, { method: "DELETE" });
      const uploadUrl = new URL(release.upload_url.split("{")[0]);
      uploadUrl.searchParams.set("name", name);
      return request(uploadUrl.toString(), {
        method: "POST",
        body: await openAsBlob(filePath),
        contentType: name.endsWith(".zip") ? "application/zip" : "text/plain",
      });
    },
    publish(release) {
      return request(`${baseUrl}/releases/${release.id}`, {
        method: "PATCH",
        json: { draft: false, make_latest: "false" },
      });
    },
  };
}

export async function publishApps(apps, {
  github,
  commit,
  outputRoot,
  buildPackage = packageApp,
  log = console.log,
}) {
  if (!/^[a-f0-9]{40}$/i.test(commit ?? "")) throw new Error("a full commit SHA is required");
  const releases = new Map((await github.listReleases()).map((release) => [release.tag_name, release]));
  const result = { published: [], skipped: [] };

  for (const app of apps) {
    const { releaseTag, assetName } = getAppRelease(app);
    let release = releases.get(releaseTag);
    if (release && !release.draft) {
      for (const name of [assetName, "SHA256SUMS"]) {
        if (!release.assets.some((asset) => asset.name === name && asset.state === "uploaded")) {
          throw new Error(`${releaseTag}: published release is missing ${name}; repair the release before deploying`);
        }
      }
      log(`Skipped ${releaseTag}: already published; bump config.json version to publish changes`);
      result.skipped.push(releaseTag);
      continue;
    }
    if (release && release.target_commitish !== commit) {
      throw new Error(`${releaseTag}: unfinished draft belongs to another commit; rerun its workflow or delete the draft before retrying`);
    }

    const appOutput = path.join(outputRoot, app.slug);
    mkdirSync(appOutput, { recursive: true });
    const packagePath = await buildPackage(app, appOutput);
    const checksum = createHash("sha256").update(readFileSync(packagePath)).digest("hex");
    const checksumsPath = path.join(appOutput, "SHA256SUMS");
    writeFileSync(checksumsPath, `${checksum}  ${assetName}\n`);
    release ??= await github.createDraft({
      tag: releaseTag,
      commit,
      prerelease: app.version.includes("-"),
    });
    await github.uploadAsset(release, packagePath);
    await github.uploadAsset(release, checksumsPath);
    await github.publish(release);
    log(`Published ${releaseTag}`);
    result.published.push(releaseTag);
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await publishApps(loadApps(path.join(webRoot, "apps")), {
    github: createReleaseClient({
      repository: process.env.GITHUB_REPOSITORY,
      token: process.env.GH_TOKEN,
      apiUrl: process.env.GITHUB_API_URL,
    }),
    commit: process.env.GITHUB_SHA,
    outputRoot: path.join(webRoot, "staged"),
  });
  console.log(`Published ${result.published.length} app(s), skipped ${result.skipped.length} app(s)`);
}
