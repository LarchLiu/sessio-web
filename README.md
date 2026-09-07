# Sessio Website

This directory is the standalone Sessio website and app catalog. It can be
moved into its own repository without requiring the desktop application's Rust
backend.

## Development

```bash
pnpm install
pnpm dev
```

`pnpm build` validates every directory under `apps/`, generates the static app
catalog, copies listing images into `public/generated/`, and builds the site.

## App packages

Put each complete Sessio app in `apps/<slug>/`. The app must contain
`web/config.json` with the six required metadata strings from the
`create-sessio-app` contract, and at least one HTML file under `web/`.

The catalog also requires `category` (one non-empty string) and `topics`
(an array of non-empty strings; use `[]` when there are no topics) in
`web/config.json`. Both fields are collected in each catalog app entry.
Category and topic values are trimmed; duplicate topics are removed while
preserving their first occurrence. Category must be one of these case-sensitive
values: `Life`, `Games`, `Finance`, `Medical`, `Office`, `Tools`, `Sports`,
`Entertainment`, `News`, or `Other`. Topics remain free-form labels.

Example additional metadata:

```json
{
  "category": "Games",
  "topics": ["Board games", "Strategy"]
}
```

The app catalog reads metadata and `web/logo.*` from the runnable app, and
listing images from `apps/<slug>/screenshots/*`. Files under
`apps/<slug>/web/screenshots/` and `apps/<slug>/web/exports/` are runtime output;
they are ignored by the catalog and excluded from release packages. The
website displays metadata and listing images; it does not execute app HTML.

The `release-apps` workflow runs on every push to `main`, and can also be
run manually on `main`. It reads each
app's `web/config.json` version and checks for a Release tagged
`<slug>-v<version>`, such as `family-tree-v1.4.1`.

Already published versions are skipped without packaging or overwriting them.
Unpublished versions are packaged individually as
`sessio-app-<slug>-<version>.zip`, with a `SHA256SUMS` file for that app.
The workflow creates the tag automatically at the triggering commit. Releases
stay in draft until both assets are uploaded; rerunning the same commit resumes
an interrupted draft. A draft from a different commit blocks publication: rerun
its original workflow, or delete that unfinished draft before retrying.
Versions with a prerelease suffix are marked as GitHub prereleases.

To release an update, change only that app's `web/config.json` version and push
the app changes to `main`. Content changes without a version bump do not publish
a new package. The first run publishes every version without its own Release,
including versions previously shipped in a combined Release.

After all app releases succeed, `release-apps` calls the reusable `website`
workflow in `pages.yml` to build and deploy GitHub Pages from the same commit.
Website-only updates also take this path, skipping all published app versions.
The catalog links to each app's exact Release asset using
`releases/download/<slug>-v<version>/sessio-app-<slug>-<version>.zip`.
No manual tag or shared release version is needed.

After downloading, extract the package so the app directory is directly under
`$SESSIO_APP_HOME/apps/`, then restart or refresh Sessio's app list.
