import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createReleaseClient, publishApps } from "./release-apps.mjs";
import { packageApp } from "./package-apps.mjs";

const commit = "a".repeat(40);
const family = { slug: "family-tree", version: "1.4.0" };
const gomoku = { slug: "gomoku-bot", version: "1.3.0" };

function published(app) {
  return {
    id: 1,
    tag_name: `${app.slug}-v${app.version}`,
    target_commitish: commit,
    draft: false,
    assets: [
      { name: `sessio-app-${app.slug}-${app.version}.zip`, state: "uploaded" },
      { name: "SHA256SUMS", state: "uploaded" },
    ],
  };
}

function setup(t, releases = []) {
  const outputRoot = mkdtempSync(path.join(tmpdir(), "sessio-release-test-"));
  t.after(() => rmSync(outputRoot, { recursive: true, force: true }));
  const calls = [];
  const options = {
    commit,
    outputRoot,
    log() {},
    buildPackage(app, directory) {
      calls.push(["package", app.slug]);
      const file = path.join(directory, `sessio-app-${app.slug}-${app.version}.zip`);
      writeFileSync(file, `package ${app.slug} ${app.version}`);
      return file;
    },
    github: {
      async listReleases() { return releases; },
      async createDraft(input) {
        calls.push(["draft", input]);
        return { id: 2, draft: true, assets: [], tag_name: input.tag };
      },
      async uploadAsset(release, file) { calls.push(["upload", path.basename(file)]); },
      async publish(release) { calls.push(["publish", release.tag_name]); },
    },
  };
  return { options, calls };
}

test("published versions do not get packaged or uploaded again", async (t) => {
  const { options, calls } = setup(t, [published(family), published(gomoku)]);
  const result = await publishApps([family, gomoku], options);
  assert.deepEqual(result, { published: [], skipped: ["family-tree-v1.4.0", "gomoku-bot-v1.3.0"] });
  assert.deepEqual(calls, []);
});

test("only an app with an unpublished version is packaged and published", async (t) => {
  const { options, calls } = setup(t, [published(family), published(gomoku)]);
  const nextFamily = { ...family, version: "1.4.1" };
  const result = await publishApps([nextFamily, gomoku], options);
  assert.deepEqual(result, { published: ["family-tree-v1.4.1"], skipped: ["gomoku-bot-v1.3.0"] });
  assert.deepEqual(calls, [
    ["package", "family-tree"],
    ["draft", { tag: "family-tree-v1.4.1", commit, prerelease: false }],
    ["upload", "sessio-app-family-tree-1.4.1.zip"],
    ["upload", "SHA256SUMS"],
    ["publish", "family-tree-v1.4.1"],
  ]);
  const expected = createHash("sha256").update("package family-tree 1.4.1").digest("hex");
  assert.equal(readFileSync(path.join(options.outputRoot, "family-tree", "SHA256SUMS"), "utf8"),
    `${expected}  sessio-app-family-tree-1.4.1.zip\n`);
});

test("first run publishes each app independently and marks prereleases", async (t) => {
  const { options, calls } = setup(t);
  const result = await publishApps([family, { ...gomoku, version: "2.0.0-beta.1" }], options);
  assert.deepEqual(result.published, ["family-tree-v1.4.0", "gomoku-bot-v2.0.0-beta.1"]);
  assert.deepEqual(calls.filter(([operation]) => operation === "draft").map(([, input]) => input.prerelease), [false, true]);
});

test("an upload failure leaves the release unpublished and stops deployment", async (t) => {
  const { options, calls } = setup(t);
  options.github.uploadAsset = async () => { throw new Error("upload failed"); };
  await assert.rejects(publishApps([family, gomoku], options), /upload failed/);
  assert.equal(calls.some(([operation]) => operation === "publish"), false);
  assert.deepEqual(calls.filter(([operation]) => operation === "package"), [["package", "family-tree"]]);
});

test("retry resumes a draft from the same commit without creating another release", async (t) => {
  const { options, calls } = setup(t, [{ ...published(family), draft: true }]);
  await publishApps([family], options);
  assert.equal(calls.some(([operation]) => operation === "draft"), false);
  assert.deepEqual(calls.at(-1), ["publish", "family-tree-v1.4.0"]);
});

test("drafts from another commit and incomplete published releases block deployment", async (t) => {
  const { options, calls } = setup(t, [{ ...published(family), draft: true, target_commitish: "b".repeat(40) }]);
  await assert.rejects(publishApps([family], options), /another commit/);
  options.github.listReleases = async () => [{ ...published(family), assets: [] }];
  await assert.rejects(publishApps([family], options), /published release is missing/);
  assert.deepEqual(calls, []);
});

test("GitHub release listing includes all pages and surfaces API failures", async () => {
  const urls = [];
  const client = createReleaseClient({
    repository: "LarchLiu/sessio-web",
    token: "test-token",
    fetchImpl: async (url) => {
      urls.push(url);
      return Response.json(urls.length === 1 ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100, draft: true }]);
    },
  });
  assert.equal((await client.listReleases()).length, 101);
  assert.match(urls[1], /page=2$/);
  const failingClient = createReleaseClient({
    repository: "LarchLiu/sessio-web",
    token: "test-token",
    fetchImpl: async () => new Response("Forbidden", { status: 403 }),
  });
  await assert.rejects(failingClient.listReleases(), /failed \(403\)/);
});

test("GitHub client replaces draft assets and publishes only on explicit request", async (t) => {
  const { options } = setup(t);
  const file = path.join(options.outputRoot, "SHA256SUMS");
  writeFileSync(file, "checksum\n");
  const requests = [];
  const client = createReleaseClient({
    repository: "LarchLiu/sessio-web",
    token: "test-token",
    fetchImpl: async (url, init) => {
      requests.push({ url, ...init });
      return init.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json({ id: 3 });
    },
  });
  await client.createDraft({ tag: "family-tree-v1.4.0", commit, prerelease: false });
  assert.deepEqual(JSON.parse(requests[0].body), {
    tag_name: "family-tree-v1.4.0", target_commitish: commit, name: "family-tree-v1.4.0",
    body: "App package for family-tree-v1.4.0.", draft: true, prerelease: false,
  });
  const draft = {
    id: 3, assets: [{ id: 4, name: "SHA256SUMS" }],
    upload_url: "https://uploads.github.com/repos/LarchLiu/sessio-web/releases/3/assets{?name,label}",
  };
  await client.uploadAsset(draft, file);
  assert.equal(requests[1].method, "DELETE");
  assert.match(requests[1].url, /releases\/assets\/4$/);
  assert.equal(requests[2].url, "https://uploads.github.com/repos/LarchLiu/sessio-web/releases/3/assets?name=SHA256SUMS");
  assert.equal(await requests[2].body.text(), "checksum\n");
  await client.publish(draft);
  assert.equal(requests[3].method, "PATCH");
  assert.deepEqual(JSON.parse(requests[3].body), { draft: false, make_latest: "false" });
});

test("single-app packaging includes only the requested app and excludes runtime output", (t) => {
  const { options } = setup(t);
  const directory = path.join(options.outputRoot, "apps", "demo");
  mkdirSync(path.join(directory, "web", "exports"), { recursive: true });
  writeFileSync(path.join(directory, "web", "demo.html"), "<!doctype html>");
  writeFileSync(path.join(directory, "web", "exports", "private.json"), "{}");
  const file = packageApp({ slug: "demo", version: "1.0.0", directory }, path.join(options.outputRoot, "packages"));
  const listing = spawnSync("unzip", ["-Z1", file], { encoding: "utf8" });
  assert.equal(listing.status, 0, listing.stderr);
  assert.match(listing.stdout, /demo\/web\/demo.html/);
  assert.doesNotMatch(listing.stdout, /private.json/);
});
