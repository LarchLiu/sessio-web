import assert from "node:assert/strict";
import test from "node:test";
import { assetUrl } from "../src/catalog.ts";

test("resolves images and catalog beneath a GitHub Pages repository path", () => {
  for (const base of ["/sessio-web", "/sessio-web/"]) {
    assert.equal(assetUrl("brand/logo.png", base), "/sessio-web/brand/logo.png");
    assert.equal(assetUrl("/brand/logo.png", base), "/sessio-web/brand/logo.png");
    assert.equal(assetUrl("generated/catalog.json", base), "/sessio-web/generated/catalog.json");
    assert.equal(assetUrl("generated/apps/family-tree/screenshots/tree.png", base), "/sessio-web/generated/apps/family-tree/screenshots/tree.png");
  }
});

test("supports root deployments, relative previews, and absolute base URLs", () => {
  for (const base of ["", "/"]) assert.equal(assetUrl("brand/logo.png", base), "/brand/logo.png");
  for (const base of [".", "./"]) assert.equal(assetUrl("brand/logo.png", base), "./brand/logo.png");
  assert.equal(assetUrl("brand/logo.png", "https://example.com/sessio-web"), "https://example.com/sessio-web/brand/logo.png");
});
